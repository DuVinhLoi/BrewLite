import { act, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { router } from '../../../vitest.setup';
import { json, line, mockApi, order, payment, renderShop } from '@/test/helpers';
import { OrdersScreen } from './OrdersScreen';
import { VnpayReturnScreen } from './VnpayReturnScreen';

describe('UNIT-T19 VNPay return (FR-14, FR-15)', () => {
  it.each([['24', 'Bạn đã hủy giao dịch'], ['51', 'Tài khoản không đủ số dư'], ['13', 'Bạn nhập sai mã OTP'], ['11', 'Đã hết thời gian thanh toán'], ['15', 'Đã hết thời gian thanh toán'], ['99', 'Thanh toán không thành công']])('uses code %s for failure wording only after the DB confirms failure', async (code, message) => {
    window.history.replaceState(null, '', `/payment/vnpay-return?vnp_ResponseCode=${code}`);
    mockApi((path) => path === '/payments/vnpay/return' ? json({ valid: true, paymentId: 'payment-1', orderId: 'order-1', responseCode: code }) : json({ ...order, status: 'PAYMENT_FAILED' }));
    renderShop(<VnpayReturnScreen />, [line], true);
    expect(await screen.findByRole('alert')).toHaveTextContent(message);
    expect(screen.getByRole('link', { name: 'Thử lại' })).toHaveAttribute('href', '/checkout?order=order-1');
    expect(JSON.parse(localStorage.getItem('brewlite-cart')!)).toEqual([line]);
    expect(router.replace).not.toHaveBeenCalled();
  });
  it('redirects and clears the matching cart only when the DB reports a paid order', async () => {
    window.history.replaceState(null, '', '/payment/vnpay-return?vnp_ResponseCode=00');
    sessionStorage.setItem('brewlite-checkout:test@example.invalid', '{"orderId":"order-1","key":"test-key"}');
    mockApi((path) => path === '/payments/vnpay/return' ? json({ valid: true, paymentId: 'payment-1', orderId: 'order-1', responseCode: '00' }) : json({ ...order, status: 'PAID' }));
    renderShop(<VnpayReturnScreen />, [line], true);
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/orders/order-1'));
    expect(sessionStorage.getItem('brewlite-checkout:test@example.invalid')).toBeNull();
    await waitFor(() => expect(localStorage.getItem('brewlite-cart')).toBe('[]'));
  });
  it('does not claim success from response 00 while the DB is still pending', async () => {
    window.history.replaceState(null, '', '/payment/vnpay-return?vnp_ResponseCode=00');
    mockApi((path) => path === '/payments/vnpay/return' ? json({ valid: true, paymentId: 'payment-1', orderId: 'order-1', responseCode: '00' }) : json({ ...order, payments: [payment] }));
    renderShop(<VnpayReturnScreen />, [line], true);
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    expect(screen.getByRole('status')).toHaveTextContent('Đang xác minh thanh toán, vui lòng kiểm tra lại');
    expect(router.replace).not.toHaveBeenCalled();
    expect(JSON.parse(localStorage.getItem('brewlite-cart')!)).toEqual([line]);
  });
  it('reports that the order cannot be identified for valid:false without a saved order', async () => {
    window.history.replaceState(null, '', '/payment/vnpay-return?vnp_ResponseCode=00&orderId=attacker-order');
    mockApi(() => json({ valid: false }));
    renderShop(<VnpayReturnScreen />, [line], true);
    expect(await screen.findByRole('alert')).toHaveTextContent('Không xác định được đơn hàng');
    expect(screen.getByRole('link', { name: 'Lịch sử đơn hàng' })).toHaveAttribute('href', '/orders');
    expect(fetch).toHaveBeenCalledTimes(1); // the query-string order ID is untrusted and is never read
    expect(router.replace).not.toHaveBeenCalled();
    expect(JSON.parse(localStorage.getItem('brewlite-cart')!)).toEqual([line]);
  });
  // AC-F20.3: the confirmation page is the order detail /orders/:id, so after a reload the same content must come from a new GET /orders/order-1.
  it('shows the paid order on its detail page and rebuilds it from a new GET after a reload (AC-F20.3)', async () => {
    let reads = 0;
    // The reload reads a newer status, so content kept from the first render or in web storage cannot pass.
    mockApi(() => json({ ...order, status: ++reads === 1 ? 'PAID' : 'PREPARING' }));
    const expectConfirmation = async (label: string) => {
      expect(await screen.findByRole('heading', { name: 'Mã đơn: order-1' })).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveTextContent(label);
      expect(screen.getByText('Cappuccino · Size L · Trân châu × 2 — 124.000đ')).toBeInTheDocument();
      expect(screen.getByText('Tổng tiền: 124.000đ')).toBeInTheDocument();
    };
    const first = renderShop(<OrdersScreen id="order-1" />, [], true);
    await expectConfirmation('Đã thanh toán');
    expect(fetch).toHaveBeenCalledTimes(1);
    first.unmount();
    renderShop(<OrdersScreen id="order-1" />, [], true);
    await expectConfirmation('Đang pha chế');
    expect(fetch).toHaveBeenCalledTimes(2); // a second GET, not a result kept from the first render
    expect(vi.mocked(fetch).mock.calls.map(([url]) => new URL(String(url)).pathname)).toEqual(['/orders/order-1', '/orders/order-1']);
  });
  it('polls the saved order even for valid:false and ignores untrusted query IDs', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    window.history.replaceState(null, '', '/payment/vnpay-return?vnp_ResponseCode=00&orderId=attacker-order');
    sessionStorage.setItem('brewlite-checkout:test@example.invalid', '{"orderId":"order-1","key":"test-key"}');
    let reads = 0;
    const paths: string[] = [];
    mockApi((path) => {
      paths.push(path);
      if (path === '/payments/vnpay/return') return json({ valid: false });
      return json(++reads === 1 ? { ...order, payments: [payment] } : { ...order, status: 'PAID' });
    });
    renderShop(<VnpayReturnScreen />, [line], true);
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    expect(reads).toBe(1);
    expect(screen.getByRole('status')).toHaveTextContent('Đang xác minh thanh toán');
    await act(async () => { await vi.advanceTimersByTimeAsync(2000); });
    expect(paths).toEqual(['/payments/vnpay/return', '/orders/order-1', '/orders/order-1']);
    expect(router.replace).toHaveBeenCalledWith('/orders/order-1');
    expect(localStorage.getItem('brewlite-cart')).toBe('[]');
  });
});

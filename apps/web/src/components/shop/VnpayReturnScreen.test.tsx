import { act, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { router } from '../../../vitest.setup';
import { json, line, mockApi, order, payment, renderShop } from '@/test/helpers';
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

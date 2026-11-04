import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { router } from '../../../vitest.setup';
import { json, line, mockApi, order, payment, renderShop } from '@/test/helpers';
import { CheckoutScreen } from './CheckoutScreen';

async function submit() {
  const button = await screen.findByRole('button', { name: 'Thanh toán qua VNPay' });
  await waitFor(() => expect(button).toBeEnabled());
  fireEvent.click(button);
}

describe('UNIT-T18 checkout recovery (FR-10, FR-13, FR-14, FR-16)', () => {
  it('offers login to guests without creating an order', async () => {
    renderShop(<CheckoutScreen />, [line]);
    expect(await screen.findByRole('link', { name: 'Đăng nhập để đặt đơn' })).toHaveAttribute('href', '/login?next=/checkout');
    expect(fetch).not.toHaveBeenCalled();
  });
  it('redirects an expired session after 401 and retains cart contents', async () => {
    mockApi(() => json({ statusCode: 401, error: 'UNAUTHORIZED', message: 'Phiên đăng nhập đã hết hạn' }, 401));
    renderShop(<CheckoutScreen />, [line], true);
    await submit();
    await waitFor(() => expect(router.push).toHaveBeenCalledWith('/login?next=/checkout&expired=1'));
    expect(sessionStorage.getItem('brewlite-session')).toBeNull();
    expect(JSON.parse(localStorage.getItem('brewlite-cart')!)).toEqual([line]);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it('preserves the created order and idempotency key when payment returns 401', async () => {
    mockApi((path) => path === '/orders' ? json(order, 201) : json({ message: 'Hết phiên' }, 401));
    renderShop(<CheckoutScreen />, [line], true);
    await submit();
    await waitFor(() => expect(router.push).toHaveBeenCalledWith('/login?next=/checkout&expired=1'));
    expect(JSON.parse(sessionStorage.getItem('brewlite-checkout:test@example.invalid')!)).toEqual({ orderId: 'order-1', key: expect.any(String) });
    expect(JSON.parse(localStorage.getItem('brewlite-cart')!)).toEqual([line]);
  });
  it.each(['OUT_OF_STOCK', 'RECIPE_UNAVAILABLE'])('retains cart and links to editing after an order 409 %s', async (error) => {
    mockApi(() => json({ statusCode: 409, error, message: 'Không đủ nguyên liệu' }, 409));
    renderShop(<CheckoutScreen />, [line], true);
    await submit();
    expect(await screen.findByRole('alert')).toHaveTextContent('Nguyên liệu đã thay đổi. Vui lòng sửa giỏ hàng');
    expect(screen.getByRole('link', { name: 'Sửa giỏ hàng' })).toHaveAttribute('href', '/cart');
    expect(screen.getByRole('button', { name: 'Thanh toán qua VNPay' })).toBeDisabled();
    expect(JSON.parse(localStorage.getItem('brewlite-cart')!)).toEqual([line]);
    expect(sessionStorage.getItem('brewlite-checkout:test@example.invalid')).toBeNull();
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it('reloads the existing order after PAYMENT_IN_PROGRESS and offers continuing the same payment', async () => {
    mockApi((path) => {
      if (path === '/orders') return json(order, 201);
      if (path === '/payments') return json({ statusCode: 409, error: 'PAYMENT_IN_PROGRESS', message: 'Đang thanh toán' }, 409);
      if (path === '/orders/order-1') return json({ ...order, payments: [payment] });
      throw new Error(`Unexpected path: ${path}`);
    });
    renderShop(<CheckoutScreen />, [line], true);
    await submit();
    expect(await screen.findByRole('button', { name: 'Tiếp tục thanh toán' })).toBeEnabled();
    expect(screen.getByRole('status')).toHaveTextContent('Đơn đang có giao dịch VNPay chưa hoàn tất.');
    expect(screen.queryByRole('button', { name: 'Thanh toán qua VNPay' })).not.toBeInTheDocument();
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(JSON.parse(localStorage.getItem('brewlite-cart')!)).toEqual([line]);
  });
  it('shows a recoverable 502 provider error while preserving the existing order', async () => {
    mockApi((path) => path === '/orders' ? json(order, 201) : json({ statusCode: 502, error: 'PAYMENT_PROVIDER_ERROR', message: 'Provider unavailable' }, 502));
    renderShop(<CheckoutScreen />, [line], true);
    await submit();
    expect(await screen.findByRole('alert')).toHaveTextContent('Có lỗi xảy ra, vui lòng thử lại');
    expect(screen.getByRole('button', { name: 'Thanh toán qua VNPay' })).toBeEnabled();
    expect(JSON.parse(sessionStorage.getItem('brewlite-checkout:test@example.invalid')!).orderId).toBe('order-1');
    expect(JSON.parse(localStorage.getItem('brewlite-cart')!)).toEqual([line]);
  });
  it('redirects to the returned paymentUrl with the correct payment payload and keeps the unpaid cart', async () => {
    const assign = vi.fn();
    const browser = window;
    vi.stubGlobal('window', new Proxy(browser, { get(target, property) {
      return property === 'location' ? { search: '', assign } : Reflect.get(target, property, target);
    } }));
    mockApi((path) => {
      if (path === '/orders') return json(order, 201);
      if (path === '/payments') return json({ paymentId: 'payment-1', orderId: 'order-1', orderStatus: 'PENDING', amount: 124000, status: 'PENDING', paymentUrl: 'https://sandbox.example.invalid/pay', expiresAt: payment.expiresAt }, 201);
      throw new Error(`Unexpected path: ${path}`);
    });
    renderShop(<CheckoutScreen />, [line], true);
    await submit();
    await waitFor(() => expect(assign).toHaveBeenCalledWith('https://sandbox.example.invalid/pay'));
    expect(fetch).toHaveBeenCalledWith(expect.stringMatching(/\/payments$/), expect.objectContaining({ method: 'POST', headers: expect.objectContaining({ 'Idempotency-Key': expect.any(String), Authorization: 'Bearer fake-test-token' }), body: '{"orderId":"order-1","paymentMethod":"WALLET"}' }));
    expect(JSON.parse(sessionStorage.getItem('brewlite-checkout:test@example.invalid')!)).toEqual({ orderId: 'order-1', key: expect.any(String), paymentId: 'payment-1', paymentMethod: 'WALLET' });
    expect(JSON.parse(localStorage.getItem('brewlite-cart')!)).toEqual([line]);
  });
});

import { afterEach, describe, expect, test, vi } from 'vitest';
import { ApiPaymentGateway } from './api-gateway';
import { PaymentError } from './types';

// UC06 KB1: thử lại sau lỗi trừ tiền phải trả tiếp ĐƠN CŨ (PAYMENT_FAILED -> PENDING),
// không tạo đơn mới — gateway trả orderId trong lỗi để UI giữ lại.
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.removeItem('brewlite-token');
});

describe('ApiPaymentGateway retry', () => {
  test('lỗi thanh toán mang theo orderId; lần thử lại chỉ gọi /payments với đơn cũ', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(json(201, { id: 'order-1' }))
      .mockResolvedValueOnce(json(400, { message: 'Payment failed' }))
      .mockResolvedValueOnce(json(201, { orderId: 'order-1', amount: 40000 }));
    vi.stubGlobal('fetch', fetchMock);
    localStorage.setItem('brewlite-token', 'tok-1');
    const gw = new ApiPaymentGateway();
    const items = [{ productId: 'p1', quantity: 1, size: 'M' }];

    const err = await gw.pay({ amount: 40000, method: 'WALLET', idempotencyKey: 'k1', items }).catch((e) => e);
    expect(err).toBeInstanceOf(PaymentError);
    expect(err.orderId).toBe('order-1');

    const r = await gw.pay({ amount: 40000, method: 'WALLET', idempotencyKey: 'k2', orderId: err.orderId, items });
    expect(r.status).toBe('PAID');
    expect(fetchMock).toHaveBeenCalledTimes(3);
    const [url, init] = fetchMock.mock.calls[2];
    expect(url).toMatch(/\/payments$/);
    expect(JSON.parse(init.body).orderId).toBe('order-1');
    // POST /payments phải mang JWT (backend gắn JwtAuthGuard + kiểm tra chủ đơn)
    expect(init.headers.Authorization).toBe('Bearer tok-1');
    expect(fetchMock.mock.calls[1][1].headers.Authorization).toBe('Bearer tok-1');
  });

  test('không có token → /payments không gửi Authorization (backend trả 401)', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(json(201, { orderId: 'order-1', amount: 1 }));
    vi.stubGlobal('fetch', fetchMock);
    await new ApiPaymentGateway().pay({ amount: 1, method: 'WALLET', idempotencyKey: 'k', orderId: 'order-1' });
    expect(fetchMock.mock.calls[0][1].headers).not.toHaveProperty('Authorization');
  });

  test('/payments 401 → báo cần đăng nhập, vẫn mang orderId để thử lại đúng đơn', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(json(401, { message: 'Unauthorized' })));
    const err = await new ApiPaymentGateway()
      .pay({ amount: 1, method: 'WALLET', idempotencyKey: 'k', orderId: 'order-1' })
      .catch((e) => e);
    expect(err).toBeInstanceOf(PaymentError);
    expect(err.message).toMatch(/đăng nhập/);
    expect(err.orderId).toBe('order-1');
  });

  test('/payments 403 (đơn của người khác) → báo không có quyền, vẫn mang orderId', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(json(403, { message: 'Not your order' })));
    const err = await new ApiPaymentGateway()
      .pay({ amount: 1, method: 'WALLET', idempotencyKey: 'k', orderId: 'order-1' })
      .catch((e) => e);
    expect(err).toBeInstanceOf(PaymentError);
    expect(err.message).toMatch(/không có quyền/);
    expect(err.orderId).toBe('order-1');
  });

  test('POST /orders chỉ gửi productId, quantity, size, toppings (không unitPrice/name/key/lineTotal)', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(json(201, { id: 'order-1' }))
      .mockResolvedValueOnce(json(201, { orderId: 'order-1', amount: 100000 }));
    vi.stubGlobal('fetch', fetchMock);
    // giỏ thật là CartItem: có thêm key, name, imageUrl, unitPrice, lineTotal
    const cartItems = [
      { key: 'p1|L|Trân châu', productId: 'p1', name: 'Latte', imageUrl: '', size: 'L', toppings: ['Trân châu'], quantity: 2, unitPrice: 50000, lineTotal: 100000 },
    ];
    await new ApiPaymentGateway().pay({ amount: 100000, method: 'WALLET', idempotencyKey: 'k', items: cartItems });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/orders$/);
    expect(JSON.parse(init.body)).toEqual({
      items: [{ productId: 'p1', quantity: 2, size: 'L', toppings: ['Trân châu'] }],
    });
  });

  test('tạo đơn lỗi → PaymentError không có orderId (lần sau tạo đơn lại)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(json(500, {})));
    const err = await new ApiPaymentGateway()
      .pay({ amount: 1, method: 'WALLET', idempotencyKey: 'k', items: [{ productId: 'p1', quantity: 1 }] })
      .catch((e) => e);
    expect(err).toBeInstanceOf(PaymentError);
    expect(err.orderId).toBeUndefined();
  });
});

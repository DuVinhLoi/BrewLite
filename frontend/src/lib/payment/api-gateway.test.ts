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

  // Đề §9 tiêu chí (b) cho POST /orders: header Idempotency-Key của đơn khác key của POST /payments
  test('POST /orders gửi Idempotency-Key = orderIdempotencyKey; POST /payments dùng key riêng', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(json(201, { id: 'order-1' }))
      .mockResolvedValueOnce(json(201, { orderId: 'order-1', amount: 1 }));
    vi.stubGlobal('fetch', fetchMock);
    await new ApiPaymentGateway().pay({ amount: 1, method: 'WALLET', idempotencyKey: 'pay-key', orderIdempotencyKey: 'order-key', items: [{ productId: 'p1', quantity: 1 }] });
    expect(fetchMock.mock.calls[0][1].headers['Idempotency-Key']).toBe('order-key');
    expect(fetchMock.mock.calls[1][1].headers['Idempotency-Key']).toBe('pay-key');
  });

  test('tạo đơn lỗi mạng rồi thử lại với cùng orderIdempotencyKey → backend gộp về 1 đơn', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(json(200, { id: 'order-1', isCached: true }))
      .mockResolvedValueOnce(json(201, { orderId: 'order-1', amount: 1 }));
    vi.stubGlobal('fetch', fetchMock);
    const gw = new ApiPaymentGateway();
    const req = { amount: 1, method: 'WALLET' as const, orderIdempotencyKey: 'order-key', items: [{ productId: 'p1', quantity: 1 }] };
    await expect(gw.pay({ ...req, idempotencyKey: 'k1' })).rejects.toBeInstanceOf(PaymentError);
    await expect(gw.pay({ ...req, idempotencyKey: 'k2' })).resolves.toMatchObject({ status: 'PAID' });
    expect(fetchMock.mock.calls[0][1].headers['Idempotency-Key']).toBe('order-key');
    expect(fetchMock.mock.calls[1][1].headers['Idempotency-Key']).toBe('order-key');
  });

  // Phương án A: PaymentForm giữ 1 key trả tiền cho cả phiên màn Thanh toán. Đã trả mà mất phản hồi, bấm lại cùng key
  // thì backend trúng cache (200 biên lai cũ) thay vì 400 PAID -> PAID như khi key mới.
  test('/payments rớt mạng rồi thử lại CÙNG idempotencyKey → PAID; 2 lần /payments cùng header, chỉ 1 lần POST /orders', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(json(201, { id: 'order-1' }))
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(json(200, { isCached: true, orderId: 'order-1', amount: 40000 }));
    vi.stubGlobal('fetch', fetchMock);
    const gw = new ApiPaymentGateway();
    const items = [{ productId: 'p1', quantity: 1 }];

    const err = await gw.pay({ amount: 40000, method: 'WALLET', idempotencyKey: 'pay-key', orderIdempotencyKey: 'order-key', items }).catch((e) => e);
    expect(err).toBeInstanceOf(PaymentError);
    expect(err.orderId).toBe('order-1'); // đơn đã tạo: lần thử lại không tạo đơn mới

    const r = await gw.pay({ amount: 40000, method: 'WALLET', idempotencyKey: 'pay-key', orderId: err.orderId });
    expect(r).toMatchObject({ status: 'PAID', amount: 40000 });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    const urls = fetchMock.mock.calls.map(([u]) => String(u));
    expect(urls.filter((u) => u.endsWith('/orders'))).toHaveLength(1);
    const payCalls = fetchMock.mock.calls.filter(([u]) => String(u).endsWith('/payments'));
    expect(payCalls).toHaveLength(2);
    expect(payCalls[0][1].headers['Idempotency-Key']).toBe('pay-key');
    expect(payCalls[1][1].headers['Idempotency-Key']).toBe('pay-key');
  });

  // Backend trả JSON { message, error, statusCode }: UI chỉ được thấy câu tiếng Việt, không phải JSON thô
  const payErr = async (res: Response) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(res));
    return new ApiPaymentGateway()
      .pay({ amount: 1, method: 'WALLET', idempotencyKey: 'k', orderId: 'order-1' })
      .catch((e) => e);
  };

  test('/payments 400 (cổng trừ tiền lỗi) → câu tiếng Việt, không có JSON thô, giữ orderId', async () => {
    const err = await payErr(json(400, { statusCode: 400, message: 'Payment failed', error: 'Bad Request' }));
    expect(err).toBeInstanceOf(PaymentError);
    expect(err.message).toMatch(/Thanh toán thất bại/);
    expect(err.message).toMatch(/Giỏ hàng được giữ nguyên/);
    expect(err.message).not.toMatch(/[{}"]|statusCode|Bad Request/);
    expect(err.orderId).toBe('order-1');
  });

  test('/payments 409 (kẹt kho) → báo món hết hàng và tiền đã hoàn, không có JSON thô, giữ orderId', async () => {
    const err = await payErr(json(409, { statusCode: 409, message: 'Out of stock', error: 'Conflict' }));
    expect(err).toBeInstanceOf(PaymentError);
    expect(err.message).toMatch(/hết hàng/);
    expect(err.message).toMatch(/hoàn/);
    expect(err.message).not.toMatch(/[{}"]|statusCode|Conflict/);
    expect(err.orderId).toBe('order-1');
  });

  test('/payments 400 do validate (message dạng mảng) → nối lại, kèm câu tiếng Việt', async () => {
    const err = await payErr(json(400, { statusCode: 400, message: ['orderId must be a string', 'paymentMethod must be one of WALLET, CARD'], error: 'Bad Request' }));
    expect(err.message).toMatch(/Thanh toán thất bại/);
    expect(err.message).toContain('orderId must be a string, paymentMethod must be one of WALLET, CARD');
    expect(err.message).not.toMatch(/[{}[\]"]/);
    expect(err.orderId).toBe('order-1');
  });

  test('/payments mã khác (404/500) → kèm mã và thông điệp backend, không có JSON thô, giữ orderId', async () => {
    const e404 = await payErr(json(404, { statusCode: 404, message: 'Product not found', error: 'Not Found' }));
    expect(e404.message).toMatch(/404/);
    expect(e404.message).toContain('Product not found');
    expect(e404.message).not.toMatch(/[{}"]|statusCode/);
    expect(e404.orderId).toBe('order-1');

    const e500 = await payErr(json(500, { statusCode: 500, message: 'Internal server error' }));
    expect(e500.message).toMatch(/500/);
    expect(e500.message).not.toMatch(/[{}"]/);
    expect(e500.orderId).toBe('order-1');
  });

  test('/payments lỗi mà body không phải JSON (proxy trả HTML) → chỉ báo mã, không lộ HTML', async () => {
    const err = await payErr(new Response('<html><body>Bad Gateway</body></html>', { status: 502 }));
    expect(err.message).toMatch(/502/);
    expect(err.message).not.toMatch(/[<>]/);
    expect(err.orderId).toBe('order-1');
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

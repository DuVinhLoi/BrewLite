import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { ApiError, advanceOrder, cancelOrder, getMyOrders, getOrder, getProducts, getProfile } from './api';
import { TOKEN_KEY, getToken, saveToken } from './auth';
import { MOCK_PRODUCTS } from './mock-products';
import { setRedirect } from './session';

// UC06 KB2/KB3: nút "Hủy đơn" gọi PATCH /orders/:id { status: 'CANCELLED' } kèm Bearer JWT.
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

// canCancel (khi nào hiện nút Hủy) đã chuyển sang lib/order-status.ts, test ở order-status.test.ts.
describe('cancelOrder', () => {
  test('gửi PATCH /orders/:id với body CANCELLED và header Authorization', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(json(200, { id: 'o1', status: 'CANCELLED' }));
    vi.stubGlobal('fetch', fetchMock);

    await cancelOrder('o1', 'tok-1');

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/orders\/o1$/);
    expect(init.method).toBe('PATCH');
    expect(init.headers.Authorization).toBe('Bearer tok-1');
    expect(init.headers['Content-Type']).toBe('application/json');
    expect(JSON.parse(init.body)).toEqual({ status: 'CANCELLED' });
  });

  test('403 → báo không có quyền, nêu cả hai lý do (đơn người khác hoặc cần tài khoản quầy)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(json(403, { message: 'Not your order' })));
    const err = await cancelOrder('o1', 't').catch((e) => e);
    expect(err.message).toMatch(/không có quyền/);
    expect(err.message).toMatch(/tài khoản khác/);
    expect(err.message).toMatch(/tài khoản quầy/);
  });

  test('400 (sai trạng thái) → thông điệp tiếng Việt theo nhãn trạng thái, không lộ chữ tiếng Anh của backend', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce(json(400, { message: 'Invalid transition PREPARING -> CANCELLED' })),
    );
    const err = await cancelOrder('o1', 't').catch((e) => e);
    expect(err.message).toMatch(/Đang pha/);
    expect(err.message).toMatch(/Đã hủy/);
    expect(err.message).not.toMatch(/Invalid transition/);
  });

  test('401 → báo cần đăng nhập; 404 → báo không tìm thấy đơn', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(json(401, { message: 'Unauthorized' })));
    await expect(cancelOrder('o1', 't')).rejects.toThrow(/đăng nhập/);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(json(404, { message: 'Order not found' })));
    await expect(cancelOrder('o1', 't')).rejects.toThrow(/không tìm thấy/i);
  });

  test('mất kết nối → ném lỗi, không văng TypeError thô', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new TypeError('fetch failed')));
    await expect(cancelOrder('o1', 't')).rejects.toThrow(/kết nối/);
  });

  test('message dạng mảng (class-validator) được nối lại', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(json(400, { message: ['status must be valid', 'x'] })));
    await expect(cancelOrder('o1', 't')).rejects.toThrow(/status must be valid, x/);
  });
});

// UC01: có NEXT_PUBLIC_API_URL thì lỗi/rỗng là thật (ProductGrid hiện error + retry / empty);
// chỉ khi chưa cấu hình mới dùng menu mẫu để demo UI không cần backend.
describe('getProducts', () => {
  test('chưa cấu hình NEXT_PUBLIC_API_URL → menu mẫu, không gọi fetch', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', '');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await expect(getProducts()).resolves.toEqual({ data: MOCK_PRODUCTS, fromMock: true });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('đã cấu hình + backend trả danh sách → dữ liệu thật đã chuẩn hóa, fromMock=false', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'http://api.test');
    const fetchMock = vi.fn().mockResolvedValueOnce(json(200, [{ id: 'p1', name: 'Latte', price: 35000, stock: 3, version: 2 }]));
    vi.stubGlobal('fetch', fetchMock);
    const r = await getProducts();
    expect(r.fromMock).toBe(false);
    expect(r.data).toEqual([{ id: 'p1', name: 'Latte', price: 35000, imageUrl: '', stock: 3, version: 2 }]);
    expect(fetchMock.mock.calls[0][0]).toBe('http://api.test/products');
  });

  test('đã cấu hình + backend trả rỗng → mảng rỗng thật (ProductGrid hiện empty), không rơi về menu mẫu', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'http://api.test');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(json(200, [])));
    await expect(getProducts()).resolves.toEqual({ data: [], fromMock: false });
  });

  test('đã cấu hình + HTTP lỗi → ném lỗi (ProductGrid hiện error + retry)', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'http://api.test');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(json(500, {})));
    await expect(getProducts()).rejects.toThrow(/500/);
  });

  test('đã cấu hình + mất kết nối → ném lỗi tiếng Việt', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'http://api.test');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new TypeError('fetch failed')));
    await expect(getProducts()).rejects.toThrow(/kết nối/);
  });
});

// Màn quầy (/barista): Barista/Admin tiến đơn bằng PATCH /orders/:id.
describe('advanceOrder', () => {
  test('gửi PATCH /orders/:id với body { status } và header Authorization', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(json(200, { id: 'o1', status: 'PREPARING' }));
    vi.stubGlobal('fetch', fetchMock);

    await advanceOrder('o1', 'PREPARING', 'tok-1');

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/orders\/o1$/);
    expect(init.method).toBe('PATCH');
    expect(init.headers.Authorization).toBe('Bearer tok-1');
    expect(init.headers['Content-Type']).toBe('application/json');
    expect(JSON.parse(init.body)).toEqual({ status: 'PREPARING' });
  });

  test('400 nhảy cóc PAID -> READY → thông điệp tiếng Việt nêu 2 trạng thái, không lộ chữ tiếng Anh', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(json(400, { message: 'Invalid transition PAID -> READY' })));
    const err = await advanceOrder('o1', 'READY', 't').catch((e) => e);
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toMatch(/Đã thanh toán/);
    expect(err.message).toMatch(/Sẵn sàng/);
    expect(err.message).not.toMatch(/Invalid transition/);
  });

  test('400 với thông điệp lạ → giữ thông điệp backend sau câu tiếng Việt', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(json(400, { message: 'Use cancel for CANCELLED' })));
    await expect(advanceOrder('o1', 'CANCELLED', 't')).rejects.toThrow(/Không thể chuyển trạng thái đơn: Use cancel for CANCELLED/);
  });

  test('403 → không có quyền; 404 → không tìm thấy; 401 → đăng nhập', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(json(403, { message: 'Not your order' })));
    await expect(advanceOrder('o1', 'PREPARING', 't')).rejects.toThrow(/không có quyền/);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(json(404, { message: 'Order not found' })));
    await expect(advanceOrder('o1', 'PREPARING', 't')).rejects.toThrow(/không tìm thấy/i);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(json(401, { message: 'Unauthorized' })));
    await expect(advanceOrder('o1', 'PREPARING', 't')).rejects.toThrow(/đăng nhập/);
  });

  test('mất kết nối → ném lỗi tiếng Việt', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new TypeError('fetch failed')));
    await expect(advanceOrder('o1', 'PREPARING', 't')).rejects.toThrow(/kết nối/);
  });
});

describe('getProfile', () => {
  test('GET /users/me kèm Bearer, trả đúng hồ sơ', async () => {
    const me = { id: 'u1', email: 'a@b.co', role: 'CUSTOMER', loyaltyPoints: 30 };
    const fetchMock = vi.fn().mockResolvedValueOnce(json(200, me));
    vi.stubGlobal('fetch', fetchMock);

    await expect(getProfile('tok-1')).resolves.toEqual(me);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/users\/me$/);
    expect(init.headers.Authorization).toBe('Bearer tok-1');
  });

  test('401 → báo đăng nhập lại; lỗi mạng → báo không kết nối', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(json(401, { message: 'Unauthorized' })));
    await expect(getProfile('t')).rejects.toThrow(/đăng nhập lại/);
    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new TypeError('fail')));
    await expect(getProfile('t')).rejects.toThrow(/Không kết nối/);
  });
});

// UC07: /history gọi GET /orders/me kèm Bearer; mỗi dòng món có productName do backend gắn.
describe('getMyOrders', () => {
  const orders = [
    {
      id: 'o1',
      status: 'PAID',
      total: 80000,
      createdAt: '2026-10-09T10:00:00.000Z',
      items: [
        { productId: 'p1', productName: 'Latte', quantity: 2, unitPrice: 40000, size: 'M', toppings: [] },
        { productId: 'p2', productName: 'Cold Brew', quantity: 1, unitPrice: 45000, size: 'L', toppings: ['Trân châu'] },
      ],
    },
  ];

  test('GET /orders/me kèm Bearer, trả đúng danh sách đơn (giữ productName)', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(json(200, orders));
    vi.stubGlobal('fetch', fetchMock);

    const list = await getMyOrders('tok-1');

    expect(list).toEqual(orders);
    expect(list[0].items.map((i) => i.productName)).toEqual(['Latte', 'Cold Brew']);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/orders\/me$/);
    expect(init.headers.Authorization).toBe('Bearer tok-1');
  });

  test('danh sách rỗng là kết quả thật, không phải lỗi', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(json(200, [])));
    await expect(getMyOrders('t')).resolves.toEqual([]);
  });

  test('HTTP lỗi → ApiError mang đúng mã; ưu tiên thông điệp backend (mảng được nối), không có thì nêu mã', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(json(500, { message: 'boom' })));
    const a = await getMyOrders('t').catch((e) => e);
    expect(a).toBeInstanceOf(ApiError);
    expect(a.status).toBe(500);
    expect(a.message).toBe('boom');

    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(json(400, { message: ['x must be y', 'z'] })));
    const b = await getMyOrders('t').catch((e) => e);
    expect(b.status).toBe(400);
    expect(b.message).toBe('x must be y, z');

    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(new Response('<html>', { status: 502 })));
    const c = await getMyOrders('t').catch((e) => e);
    expect(c).toBeInstanceOf(ApiError);
    expect(c.status).toBe(502);
    expect(c.message).toBe('Máy chủ trả lỗi (mã 502).');
  });

  test('mất kết nối → ApiError status 0, câu tiếng Việt', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new TypeError('fetch failed')));
    const err = await getMyOrders('t').catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(0);
    expect(err.message).toBe('Không kết nối được máy chủ.');
  });
});

// Biên lai (PaymentSuccess) poll GET /orders/:id kèm Bearer; backend trả 403 đơn người khác, 404 đơn lạ.
describe('getOrder', () => {
  const order = {
    id: 'o1',
    userId: 'u1',
    status: 'PREPARING',
    total: 80000,
    createdAt: '2026-10-09T10:00:00.000Z',
    items: [{ productId: 'p1', quantity: 2, unitPrice: 40000, size: 'M', toppings: [] }],
  };

  test('GET /orders/:id kèm Bearer, trả đúng đơn', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(json(200, order));
    vi.stubGlobal('fetch', fetchMock);

    await expect(getOrder('o1', 'tok-1')).resolves.toEqual(order);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/orders\/o1$/);
    expect(init.headers.Authorization).toBe('Bearer tok-1');
    expect(init.method ?? 'GET').toBe('GET');
  });

  test('mã đơn được mã hóa trong URL', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(json(200, order));
    vi.stubGlobal('fetch', fetchMock);
    await getOrder('a/b?c', 't');
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/orders\/a%2Fb%3Fc$/);
  });

  test('403 → "không phải đơn của bạn"; 404 → "không tìm thấy đơn"; cùng mã trong ApiError', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(json(403, { message: 'Not your order' })));
    const a = await getOrder('o1', 't').catch((e) => e);
    expect(a).toBeInstanceOf(ApiError);
    expect(a.status).toBe(403);
    expect(a.message).toBe('Đây không phải đơn của bạn.');

    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(json(404, { message: 'Order not found' })));
    const b = await getOrder('o1', 't').catch((e) => e);
    expect(b).toBeInstanceOf(ApiError);
    expect(b.status).toBe(404);
    expect(b.message).toBe('Không tìm thấy đơn.');
  });

  test('lỗi khác: ưu tiên thông điệp backend, không có thì nêu mã; thân JSON null không văng TypeError', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(json(500, { message: 'boom' })));
    const a = await getOrder('o1', 't').catch((e) => e);
    expect(a.status).toBe(500);
    expect(a.message).toBe('boom');

    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(new Response('null', { status: 502 })));
    const b = await getOrder('o1', 't').catch((e) => e);
    expect(b).toBeInstanceOf(ApiError);
    expect(b.status).toBe(502);
    expect(b.message).toBe('Máy chủ trả lỗi (mã 502).');
  });

  test('mất kết nối → ApiError status 0, câu tiếng Việt', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new TypeError('fetch failed')));
    const err = await getOrder('o1', 't').catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(0);
    expect(err.message).toBe('Không kết nối được máy chủ.');
  });
});

// Thân lỗi không phải object (null, số, chuỗi) hoặc message sai kiểu: coi như không có message, không văng TypeError.
describe('thân lỗi lạ', () => {
  const nullBody = () => new Response('null', { status: 502, headers: { 'Content-Type': 'application/json' } });

  test('thân JSON null + 502: cancelOrder, advanceOrder, getMyOrders ném ApiError 502 với câu tiếng Việt như khi không có message', async () => {
    const expected: [string, () => Promise<unknown>, string][] = [
      ['cancelOrder', () => cancelOrder('o1', 't'), 'Không thể hủy đơn (mã 502)'],
      ['advanceOrder', () => advanceOrder('o1', 'PREPARING', 't'), 'Không thể chuyển trạng thái đơn (mã 502)'],
      ['getMyOrders', () => getMyOrders('t'), 'Máy chủ trả lỗi (mã 502).'],
    ];
    for (const [, call, message] of expected) {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(nullBody()));
      const err = (await call().catch((e) => e)) as ApiError;
      expect(err).toBeInstanceOf(ApiError);
      expect(err.status).toBe(502);
      expect(err.message).toBe(message);
    }
  });

  test.each([
    ['message là số', { message: 123 }],
    ['message là object', { message: { a: 1 } }],
    ['message là mảng lẫn kiểu', { message: ['ok', 5] }],
    ['thân là số', 7],
  ])('%s: bỏ qua, nêu mã HTTP', async (_name, body) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(json(500, body)));
    const a = await cancelOrder('o1', 't').catch((e) => e);
    expect(a.message).toBe('Không thể hủy đơn (mã 500)');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(json(500, body)));
    const b = await getMyOrders('t').catch((e) => e);
    expect(b.message).toBe('Máy chủ trả lỗi (mã 500).');
  });
});

// Lỗi có mã HTTP (ApiError.status; 0 = không tới được máy chủ) để useAsync / UI phân biệt; câu thông báo giữ nguyên.
describe('ApiError', () => {
  test('là Error có status, name và message', () => {
    const e = new ApiError('Không tìm thấy đơn.', 404);
    expect(e).toBeInstanceOf(Error);
    expect(e).toBeInstanceOf(ApiError);
    expect(e.name).toBe('ApiError');
    expect(e.status).toBe(404);
    expect(e.message).toBe('Không tìm thấy đơn.');
  });

  test.each([
    [403, 'Bạn không có quyền thực hiện thao tác này (đơn của tài khoản khác hoặc cần tài khoản quầy).'],
    [404, 'Không tìm thấy đơn.'],
    [401, 'Bạn cần đăng nhập lại để hủy đơn.'],
    [400, 'Không thể hủy đơn: x'],
    [500, 'Không thể hủy đơn (mã 500)'],
  ])('cancelOrder: HTTP %i → ApiError cùng mã, đúng câu tiếng Việt', async (status, message) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(json(status, status === 400 ? { message: 'x' } : {})));
    const err = await cancelOrder('o1', 't').catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(status);
    expect(err.message).toBe(message);
  });

  test('mất kết nối → status 0 (cancelOrder, advanceOrder, getProfile, getMyOrders, getOrder, getProducts)', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'http://api.test');
    const calls = [
      () => cancelOrder('o1', 't'),
      () => advanceOrder('o1', 'PREPARING', 't'),
      () => getProfile('t'),
      () => getMyOrders('t'),
      () => getOrder('o1', 't'),
      () => getProducts(),
    ];
    for (const call of calls) {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new TypeError('fetch failed')));
      const err = await call().catch((e) => e);
      expect(err).toBeInstanceOf(ApiError);
      expect(err.status).toBe(0);
    }
  });

  test('getProducts: HTTP lỗi → ApiError mang đúng mã, giữ câu "GET /products lỗi (mã N)."', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'http://api.test');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(json(503, {})));
    const err = await getProducts().catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(503);
    expect(err.message).toBe('GET /products lỗi (mã 503).');
  });

  test('getProfile: 404 và mã khác → ApiError cùng mã', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(json(404, {})));
    const a = await getProfile('t').catch((e) => e);
    expect(a.status).toBe(404);
    expect(a.message).toBe('Phiên đăng nhập không còn hiệu lực, hãy đăng nhập lại.');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(json(500, {})));
    const b = await getProfile('t').catch((e) => e);
    expect(b.status).toBe(500);
    expect(b.message).toBe('Không tải được hồ sơ (mã 500).');
  });
});

// 401 giữa phiên: xóa token của tab rồi chuyển về /login (redirect inject được), vẫn ném cùng câu tiếng Việt như trước.
describe('401 ở hàm có xác thực', () => {
  const redirect = vi.fn();

  beforeEach(() => {
    redirect.mockClear();
    saveToken('h.p.s');
    setRedirect(redirect);
  });
  afterEach(() => {
    setRedirect(null);
    sessionStorage.removeItem(TOKEN_KEY);
  });

  test.each([
    ['cancelOrder', () => cancelOrder('o1', 't'), 'Bạn cần đăng nhập lại để hủy đơn.'],
    ['advanceOrder', () => advanceOrder('o1', 'PREPARING', 't'), 'Bạn cần đăng nhập lại để chuyển trạng thái đơn.'],
    ['getProfile', () => getProfile('t'), 'Phiên đăng nhập không còn hiệu lực, hãy đăng nhập lại.'],
    ['getMyOrders', () => getMyOrders('t'), 'Phiên đăng nhập không còn hiệu lực, hãy đăng nhập lại.'],
    ['getOrder', () => getOrder('o1', 't'), 'Phiên đăng nhập không còn hiệu lực, hãy đăng nhập lại.'],
  ])('%s: 401 → xóa token, gọi redirect một lần, ném ApiError 401', async (_name, call, message) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(json(401, { message: 'Unauthorized' })));
    const err = await call().catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(401);
    expect(err.message).toBe(message);
    expect(getToken()).toBeNull();
    expect(redirect).toHaveBeenCalledTimes(1);
    expect(redirect).toHaveBeenCalledWith('/login');
  });

  // getProfile: 404 (tài khoản không còn) cũng là hết phiên, có test riêng bên dưới nên không nằm trong danh sách "giữ token"
  test.each([
    ['cancelOrder', () => cancelOrder('o1', 't'), [403, 404, 500]],
    ['advanceOrder', () => advanceOrder('o1', 'PREPARING', 't'), [403, 404, 500]],
    ['getProfile', () => getProfile('t'), [403, 500]],
    ['getMyOrders', () => getMyOrders('t'), [403, 404, 500]],
    ['getOrder', () => getOrder('o1', 't'), [403, 404, 500]],
  ])('%s: lỗi khác 401 (%j) và mất mạng giữ nguyên token, không chuyển trang', async (_name, call, statuses) => {
    for (const status of statuses) {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(json(status, {})));
      await call().catch(() => undefined);
    }
    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new TypeError('fetch failed')));
    await call().catch(() => undefined);
    expect(getToken()).toBe('h.p.s');
    expect(redirect).not.toHaveBeenCalled();
  });

  test('getProfile: 404 (tài khoản không còn) cũng xóa token và về /login, vẫn ném cùng câu và mã 404', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(json(404, { message: 'User not found' })));
    const err = await getProfile('t').catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(404);
    expect(err.message).toBe('Phiên đăng nhập không còn hiệu lực, hãy đăng nhập lại.');
    expect(getToken()).toBeNull();
    expect(redirect).toHaveBeenCalledTimes(1);
    expect(redirect).toHaveBeenCalledWith('/login');
  });

  test('thành công không đụng tới token', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(json(200, { id: 'o1' })));
    await cancelOrder('o1', 't');
    expect(getToken()).toBe('h.p.s');
    expect(redirect).not.toHaveBeenCalled();
  });

  test('getProducts (công khai) gặp 401 cũng không đá người dùng ra /login', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'http://api.test');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(json(401, {})));
    await getProducts().catch(() => undefined);
    expect(redirect).not.toHaveBeenCalled();
    expect(getToken()).toBe('h.p.s');
  });
});

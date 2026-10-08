import { afterEach, describe, expect, test, vi } from 'vitest';
import { cancelOrder, getProducts } from './api';
import { MOCK_PRODUCTS } from './mock-products';

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

  test('403 (đơn người khác) → ném lỗi báo không có quyền', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(json(403, { message: 'Not your order' })));
    await expect(cancelOrder('o1', 't')).rejects.toThrow(/không có quyền/);
  });

  test('400 (sai trạng thái) → ném lỗi kèm thông điệp backend', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce(json(400, { message: 'Invalid transition PREPARING -> CANCELLED' })),
    );
    await expect(cancelOrder('o1', 't')).rejects.toThrow(/Invalid transition PREPARING -> CANCELLED/);
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

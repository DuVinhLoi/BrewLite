import { afterEach, describe, expect, test, vi } from 'vitest';
import { LOW_STOCK, adjustStock, fetchInventory, stockBadge } from './admin';

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
afterEach(() => vi.unstubAllGlobals());

test('stockBadge: 0 hết hàng, ≤ LOW_STOCK sắp hết, còn lại bình thường', () => {
  expect(stockBadge(0)).toEqual({ label: 'Hết hàng', tone: 'out' });
  expect(stockBadge(LOW_STOCK)).toEqual({ label: 'Sắp hết', tone: 'low' });
  expect(stockBadge(LOW_STOCK + 1)).toEqual({ label: 'Còn hàng', tone: 'ok' });
});

describe('fetchInventory', () => {
  test('GET /admin/products kèm Bearer', async () => {
    const f = vi.fn().mockResolvedValueOnce(json(200, [{ id: 'p1', name: 'Latte', price: 35000, stock: 0, version: 1 }]));
    vi.stubGlobal('fetch', f);
    expect((await fetchInventory('tok'))[0].stock).toBe(0);
    expect(f.mock.calls[0][0]).toMatch(/\/admin\/products$/);
    expect(f.mock.calls[0][1].headers.Authorization).toBe('Bearer tok');
  });
  test('403 → báo cần tài khoản quản trị', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(json(403, {})));
    await expect(fetchInventory('tok')).rejects.toThrow(/quản trị/);
  });
});

describe('adjustStock', () => {
  test('PATCH /admin/products/:id/stock với body {mode,value,version}', async () => {
    const f = vi.fn().mockResolvedValueOnce(json(200, { id: 'p1', name: 'Latte', price: 35000, stock: 15, version: 2 }));
    vi.stubGlobal('fetch', f);
    const p = await adjustStock('tok', 'p1', { mode: 'delta', value: 5, version: 1 });
    expect(p.stock).toBe(15);
    const [url, init] = f.mock.calls[0];
    expect(url).toMatch(/\/admin\/products\/p1\/stock$/);
    expect(init.method).toBe('PATCH');
    expect(JSON.parse(init.body)).toEqual({ mode: 'delta', value: 5, version: 1 });
  });
  test('409 → báo dữ liệu đã đổi, tải lại', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(json(409, { message: 'Stock changed, reload' })));
    await expect(adjustStock('tok', 'p1', { mode: 'set', value: 1, version: 1 })).rejects.toThrow(/vừa thay đổi/);
  });
  test('400 → báo không được âm', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(json(400, { message: 'Stock cannot be negative' })));
    await expect(adjustStock('tok', 'p1', { mode: 'delta', value: -99, version: 1 })).rejects.toThrow(/âm/);
  });
  test('400 khác (vượt giới hạn, message mảng của class-validator) → báo không hợp lệ, không bảo "âm"', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(json(400, { message: ['value must not be greater than 2147483647'] })));
    const err = await adjustStock('tok', 'p1', { mode: 'set', value: 2147483648, version: 1 }).catch((e) => e);
    expect(err.message).toMatch(/không hợp lệ/);
    expect(err.message).not.toMatch(/âm/);
  });
  test('400 body không phải JSON → báo không hợp lệ', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(new Response('<html>bad</html>', { status: 400 })));
    await expect(adjustStock('tok', 'p1', { mode: 'set', value: 1, version: 1 })).rejects.toThrow(/không hợp lệ/);
  });
});

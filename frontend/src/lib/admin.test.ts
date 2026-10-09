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
});

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { TOKEN_KEY, getToken, saveToken } from './auth';
import { setRedirect } from './session';
import { LOW_STOCK, adjustStock, fetchInventory, inventorySummary, parseStockDraft, quickSteps, stockBadge } from './admin';

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
afterEach(() => {
  vi.unstubAllGlobals();
  setRedirect(null);
  sessionStorage.removeItem(TOKEN_KEY);
});

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

// 401 giữa phiên ở màn tồn kho: xóa token và về /login (handleUnauthorized) trước khi ném lỗi như cũ.
describe('màn tồn kho: hết phiên (401)', () => {
  const redirect = vi.fn();
  beforeEach(() => {
    redirect.mockClear();
    saveToken('h.p.s');
    setRedirect(redirect);
  });

  test.each([
    ['fetchInventory', () => fetchInventory('tok')],
    ['adjustStock', () => adjustStock('tok', 'p1', { mode: 'set', value: 1, version: 1 })],
  ])('%s: 401 → xóa token, redirect /login một lần, vẫn ném đúng câu cũ', async (_name, call) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(json(401, {})));
    const err = await call().catch((e) => e);
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại.');
    expect(redirect).toHaveBeenCalledTimes(1);
    expect(redirect).toHaveBeenCalledWith('/login');
    expect(getToken()).toBeNull();
  });

  test('403, 409, 400, 500 và mất mạng giữ token, không chuyển trang', async () => {
    for (const status of [403, 409, 400, 500]) {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(json(status, {})));
      await fetchInventory('tok').catch(() => undefined);
    }
    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new TypeError('fetch failed')));
    await fetchInventory('tok').catch(() => undefined);
    expect(getToken()).toBe('h.p.s');
    expect(redirect).not.toHaveBeenCalled();
  });
});

// Màn Kho nét mực (ui-visual-plan.md §6 mục 13): phần quyết định tách khỏi AdminView để test không cần trình duyệt.
describe('màn tồn kho: hàm thuần', () => {
  const s = (...stocks: number[]) => stocks.map((stock) => ({ stock }));

  test('inventorySummary: đếm theo stockBadge, chỉ nêu nhóm có món', () => {
    expect(inventorySummary(s(24, 3, 12, 0))).toBe('4 món. 1 món sắp hết, 1 món hết hàng.');
    expect(inventorySummary(s(24, 2, 1, 0, 0))).toBe('5 món. 2 món sắp hết, 2 món hết hàng.');
    expect(inventorySummary(s(24, LOW_STOCK))).toBe('2 món. 1 món sắp hết.');
    expect(inventorySummary(s(0, 0))).toBe('2 món. 2 món hết hàng.');
    expect(inventorySummary(s(LOW_STOCK + 1, 50))).toBe('2 món, tất cả còn hàng.');
    expect(inventorySummary([])).toBe('Chưa có món nào.');
  });

  test('inventorySummary: một món (mỗi nhóm một ca)', () => {
    expect(inventorySummary(s(0))).toBe('1 món. 1 món hết hàng.');
    expect(inventorySummary(s(LOW_STOCK))).toBe('1 món. 1 món sắp hết.');
    expect(inventorySummary(s(50))).toBe('1 món, tất cả còn hàng.');
  });

  test('parseStockDraft: chỉ nhận số nguyên ≥ 0 (giữ đúng điều kiện nút "Lưu" cũ)', () => {
    expect(parseStockDraft('0')).toBe(0);
    expect(parseStockDraft('25')).toBe(25);
    for (const bad of [undefined, '', '-1', '2.5', 'abc']) expect(parseStockDraft(bad)).toBeNull();
  });

  test('quickSteps: −1 / +1 / +10 kèm aria-label theo tên món; −1 khóa khi hết hàng; mọi nút khóa khi đang gửi', () => {
    expect(quickSteps('Latte', 5, false)).toEqual([
      { delta: -1, text: '−1', label: 'Giảm 1 Latte', disabled: false },
      { delta: 1, text: '+1', label: 'Tăng 1 Latte', disabled: false },
      { delta: 10, text: '+10', label: 'Tăng 10 Latte', disabled: false },
    ]);
    expect(quickSteps('Latte', 0, false).map((q) => q.disabled)).toEqual([true, false, false]);
    expect(quickSteps('Latte', 5, true).map((q) => q.disabled)).toEqual([true, true, true]);
  });
});

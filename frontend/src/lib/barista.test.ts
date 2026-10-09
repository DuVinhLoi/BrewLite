import { afterEach, describe, expect, test, vi } from 'vitest';
import { ACTION_LABEL, QUEUE_COLUMNS, fetchQueue, groupQueue, type QueueOrder } from './barista';

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
afterEach(() => vi.unstubAllGlobals());

const order = (id: string, status: string, minute: number): QueueOrder => ({
  id, status, total: 40000, createdAt: `2026-10-09T10:${String(minute).padStart(2, '0')}:00Z`,
  items: [{ productId: 'p1', productName: 'Latte', quantity: 1, unitPrice: 40000, size: 'M', toppings: [] }],
});

test('3 cột đúng thứ tự sơ đồ §9.1 và nhãn nút', () => {
  expect(QUEUE_COLUMNS.map((c) => c.status)).toEqual(['PAID', 'PREPARING', 'READY']);
  expect(ACTION_LABEL).toEqual({ PAID: 'Nhận pha', PREPARING: 'Pha xong', READY: 'Đã giao' });
});

test('groupQueue chia cột, cũ trước, bỏ trạng thái ngoài hàng đợi', () => {
  const g = groupQueue([order('b', 'PAID', 30), order('a', 'PAID', 10), order('c', 'READY', 5), order('x', 'COMPLETED', 1)]);
  expect(g.PAID.map((o) => o.id)).toEqual(['a', 'b']);
  expect(g.PREPARING).toEqual([]);
  expect(g.READY.map((o) => o.id)).toEqual(['c']);
});

describe('fetchQueue', () => {
  test('GET /orders?status=PAID,PREPARING,READY kèm Bearer', async () => {
    const f = vi.fn().mockResolvedValueOnce(json(200, [order('a', 'PAID', 1)]));
    vi.stubGlobal('fetch', f);
    expect((await fetchQueue('tok')).map((o) => o.id)).toEqual(['a']);
    const [url, init] = f.mock.calls[0];
    expect(url).toMatch(/\/orders\?status=PAID,PREPARING,READY$/);
    expect(init.headers.Authorization).toBe('Bearer tok');
  });
  test('403 → báo cần tài khoản quầy', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(json(403, { message: 'Insufficient role' })));
    await expect(fetchQueue('tok')).rejects.toThrow(/tài khoản quầy/);
  });
  test('401 → báo đăng nhập lại', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(json(401, {})));
    await expect(fetchQueue('tok')).rejects.toThrow(/đăng nhập/);
  });
});

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { TOKEN_KEY, getToken, saveToken } from './auth';
import { setRedirect } from './session';
import { ACTION_LABEL, POLL_MS, QUEUE_COLUMNS, QueueAuthError, cardActions, fetchQueue, groupQueue, isStaff, pollNote, type QueueOrder } from './barista';

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
afterEach(() => {
  vi.unstubAllGlobals();
  setRedirect(null);
  sessionStorage.removeItem(TOKEN_KEY);
});

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
  test('401/403 ném QueueAuthError (để màn quầy ngừng tự tải lại); lỗi khác thì không', async () => {
    for (const status of [401, 403]) {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(json(status, {})));
      await expect(fetchQueue('tok')).rejects.toBeInstanceOf(QueueAuthError);
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(json(500, {})));
    const e500 = await fetchQueue('tok').catch((e) => e);
    expect(e500).toBeInstanceOf(Error);
    expect(e500).not.toBeInstanceOf(QueueAuthError);
    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new TypeError('fetch failed')));
    expect(await fetchQueue('tok').catch((e) => e)).not.toBeInstanceOf(QueueAuthError);
  });
});

// 401 giữa phiên ở màn quầy: xóa token và về /login (handleUnauthorized) trước khi ném QueueAuthError như cũ.
describe('fetchQueue: hết phiên (401)', () => {
  const redirect = vi.fn();
  beforeEach(() => {
    redirect.mockClear();
    saveToken('h.p.s');
    setRedirect(redirect);
  });

  test('401 → xóa token, redirect /login một lần (sau khi đã xóa), vẫn ném QueueAuthError đúng câu cũ', async () => {
    let tokenWhenRedirected: string | null = 'chưa gọi';
    redirect.mockImplementationOnce(() => {
      tokenWhenRedirected = getToken();
    });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(json(401, {})));
    const err = await fetchQueue('tok').catch((e) => e);
    expect(err).toBeInstanceOf(QueueAuthError);
    expect(err.message).toBe('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại.');
    expect(redirect).toHaveBeenCalledTimes(1);
    expect(redirect).toHaveBeenCalledWith('/login');
    expect(tokenWhenRedirected).toBeNull();
    expect(getToken()).toBeNull();
  });

  test('403, 500 và mất mạng giữ token, không chuyển trang (sai vai trò không phải hết phiên)', async () => {
    for (const status of [403, 500]) {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(json(status, {})));
      await fetchQueue('tok').catch(() => undefined);
    }
    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new TypeError('fetch failed')));
    await fetchQueue('tok').catch(() => undefined);
    expect(getToken()).toBe('h.p.s');
    expect(redirect).not.toHaveBeenCalled();
  });
});

// Màn quầy nét mực (ui-visual-plan.md §6 mục 12): phần quyết định tách khỏi BaristaView để test không cần trình duyệt.
describe('màn quầy: hằng và hàm thuần', () => {
  test('POLL_MS = 5000; dòng nhắc tính từ POLL_MS', () => {
    expect(POLL_MS).toBe(5000);
    expect(pollNote()).toBe('Tự tải lại mỗi 5 giây.');
    expect(pollNote(3000)).toBe('Tự tải lại mỗi 3 giây.');
  });

  test('isStaff: chỉ BARISTA và ADMIN vào được quầy', () => {
    expect(isStaff('BARISTA')).toBe(true);
    expect(isStaff('ADMIN')).toBe(true);
    expect(isStaff('CUSTOMER')).toBe(false);
    expect(isStaff(null)).toBe(false);
  });

  test('cardActions: nút tiến đơn theo ACTION_LABEL và nextStatus; chỉ cột Chờ pha có nút hủy', () => {
    expect(cardActions('PAID', false)).toEqual({ advance: { to: 'PREPARING', label: 'Nhận pha' }, cancel: true });
    expect(cardActions('PREPARING', false)).toEqual({ advance: { to: 'READY', label: 'Pha xong' }, cancel: false });
    expect(cardActions('READY', false)).toEqual({ advance: { to: 'COMPLETED', label: 'Đã giao' }, cancel: false });
  });

  test('cardActions: đơn đang chuyển thì nút tiến đơn đổi chữ "Đang chuyển…"', () => {
    expect(cardActions('PAID', true).advance.label).toBe('Đang chuyển…');
    expect(cardActions('PAID', true).cancel).toBe(true);
  });
});

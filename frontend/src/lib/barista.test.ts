import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { TOKEN_KEY, getToken, saveToken } from './auth';
import { setRedirect } from './session';
import { ACTION_LABEL, QUEUE_COLUMNS, QueueAuthError, fetchQueue, groupQueue, type QueueOrder } from './barista';

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

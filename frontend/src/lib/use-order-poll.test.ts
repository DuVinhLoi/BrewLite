import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { ApiError } from './api';
import { orderPollFetcher, startPolling } from './use-order-poll';

// Không có DOM để chạy hook: test lõi startPolling (không phụ thuộc React) bằng fake timers;
// useOrderPoll / usePolling chỉ nối lõi này vào useState / useEffect.
const deferred = <T>() => {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

// chạy hết microtask đang treo, không tiến đồng hồ
const settle = () => vi.advanceTimersByTimeAsync(0);

const harness = <T>(fetch: () => Promise<T>, isDone: (d: T) => boolean = () => false, intervalMs = 3000) => {
  const onData = vi.fn<(d: T) => void>();
  const onError = vi.fn<(e: ApiError) => void>();
  const stop = startPolling<T>({ fetch, isDone, onData, onError, intervalMs });
  return { onData, onError, stop };
};

describe('startPolling: nhịp gọi', () => {
  test('gọi fetch ngay lần đầu (không chờ intervalMs)', () => {
    const fetch = vi.fn(() => Promise.resolve('a'));
    harness(fetch);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  test('gọi tiếp mỗi intervalMs (3 giây) sau khi lần trước xong, và báo data từng lần', async () => {
    const fetch = vi.fn<() => Promise<number>>().mockResolvedValueOnce(1).mockResolvedValueOnce(2).mockResolvedValue(3);
    const { onData } = harness(fetch);
    await settle();
    expect(onData.mock.calls).toEqual([[1]]);

    await vi.advanceTimersByTimeAsync(2999);
    expect(fetch).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(onData.mock.calls).toEqual([[1], [2]]);

    await vi.advanceTimersByTimeAsync(3000);
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(onData.mock.calls).toEqual([[1], [2], [3]]);
  });

  test('intervalMs tùy chỉnh được tôn trọng', async () => {
    const fetch = vi.fn(() => Promise.resolve('x'));
    harness(fetch, () => false, 500);
    await settle();
    await vi.advanceTimersByTimeAsync(499);
    expect(fetch).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  test('không gọi chồng: lần trước chưa xong thì không gọi lần mới, dù đã qua nhiều chu kỳ', async () => {
    const first = deferred<string>();
    const fetch = vi.fn<() => Promise<string>>().mockReturnValueOnce(first.promise).mockResolvedValue('sau');
    const { onData } = harness(fetch);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(fetch).toHaveBeenCalledTimes(1);

    first.resolve('trước');
    await settle();
    expect(onData.mock.calls).toEqual([['trước']]);
    // chu kỳ tính từ lúc lần trước xong
    await vi.advanceTimersByTimeAsync(2999);
    expect(fetch).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});

describe('startPolling: dừng', () => {
  test('dừng khi isDone(data) đúng: data cuối vẫn được báo, sau đó không gọi nữa', async () => {
    const fetch = vi.fn<() => Promise<string>>().mockResolvedValueOnce('PAID').mockResolvedValueOnce('COMPLETED').mockResolvedValue('?');
    const { onData } = harness(fetch, (s) => s === 'COMPLETED');
    await settle();
    await vi.advanceTimersByTimeAsync(3000);
    expect(onData.mock.calls).toEqual([['PAID'], ['COMPLETED']]);

    await vi.advanceTimersByTimeAsync(30_000);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  test('lần đầu đã xong (isDone ngay) thì chỉ gọi 1 lần', async () => {
    const fetch = vi.fn(() => Promise.resolve('CANCELLED'));
    harness(fetch, () => true);
    await vi.advanceTimersByTimeAsync(30_000);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  test('stop() giữa hai lần: không gọi thêm, đồng hồ bị hủy', async () => {
    const fetch = vi.fn(() => Promise.resolve('a'));
    const { stop } = harness(fetch);
    await settle();
    stop();
    expect(vi.getTimerCount()).toBe(0);
    await vi.advanceTimersByTimeAsync(30_000);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  test('stop() khi fetch đang bay: kết quả về muộn không gọi onData, không hẹn lần sau', async () => {
    const pending = deferred<string>();
    const fetch = vi.fn(() => pending.promise);
    const { onData, onError, stop } = harness(fetch);
    stop();
    pending.resolve('muộn');
    await vi.advanceTimersByTimeAsync(30_000);
    expect(onData).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  test('stop() khi fetch đang bay: lỗi về muộn cũng không gọi onError', async () => {
    const pending = deferred<string>();
    const { onData, onError, stop } = harness(() => pending.promise);
    stop();
    pending.reject(new ApiError('x', 500));
    await vi.advanceTimersByTimeAsync(30_000);
    expect(onData).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });

  test('stop() gọi nhiều lần không sao', async () => {
    const { stop } = harness(() => Promise.resolve('a'));
    stop();
    expect(() => stop()).not.toThrow();
  });
});

describe('startPolling: lỗi', () => {
  test.each([401, 403, 404])('ApiError %i: báo onError một lần rồi dừng hẳn', async (status) => {
    const fetch = vi.fn<() => Promise<string>>().mockRejectedValue(new ApiError('không được', status));
    const { onData, onError } = harness(fetch);
    await vi.advanceTimersByTimeAsync(30_000);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(onData).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0]).toBeInstanceOf(ApiError);
    expect(onError.mock.calls[0][0].status).toBe(status);
    expect(onError.mock.calls[0][0].message).toBe('không được');
  });

  test('dừng vì 404 sau khi đã có data: không poll lại', async () => {
    const fetch = vi.fn<() => Promise<string>>().mockResolvedValueOnce('PAID').mockRejectedValueOnce(new ApiError('mất', 404));
    const { onData, onError } = harness(fetch);
    await settle();
    await vi.advanceTimersByTimeAsync(3000);
    await vi.advanceTimersByTimeAsync(30_000);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(onData.mock.calls).toEqual([['PAID']]);
    expect(onError).toHaveBeenCalledTimes(1);
  });

  test.each([
    ['mất kết nối (status 0)', new ApiError('Không kết nối được máy chủ.', 0), 0],
    ['5xx', new ApiError('Máy chủ trả lỗi (mã 503).', 503), 503],
    ['400', new ApiError('bad', 400), 400],
    ['lỗi thường không phải ApiError (bọc thành status 0)', new TypeError('fetch failed'), 0],
  ])('%s: báo onError, giữ data cũ, vẫn poll tiếp và lần sau thành công thì báo data mới', async (_name, err, status) => {
    const fetch = vi
      .fn<() => Promise<string>>()
      .mockResolvedValueOnce('PAID')
      .mockRejectedValueOnce(err)
      .mockResolvedValueOnce('PREPARING');
    const { onData, onError } = harness(fetch);
    await settle();
    await vi.advanceTimersByTimeAsync(3000);
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0]).toBeInstanceOf(ApiError);
    expect(onError.mock.calls[0][0].status).toBe(status);
    expect(onData.mock.calls).toEqual([['PAID']]); // lỗi không xóa data: không báo data rỗng

    await vi.advanceTimersByTimeAsync(3000);
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(onData.mock.calls).toEqual([['PAID'], ['PREPARING']]);
  });

  test('fetch ném đồng bộ cũng là lỗi: không văng khỏi startPolling, 5xx thì vẫn poll tiếp', async () => {
    const fetch = vi
      .fn<() => Promise<string>>()
      .mockImplementationOnce(() => {
        throw new ApiError('hỏng', 503);
      })
      .mockResolvedValue('ok');
    let h!: ReturnType<typeof harness<string>>;
    expect(() => {
      h = harness(fetch);
    }).not.toThrow();
    await settle();
    expect(h.onError).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(3000);
    expect(h.onData.mock.calls).toEqual([['ok']]);
  });
});

// Không poll khi thiếu orderId hoặc token: nơi gọi nhận undefined thì không gọi startPolling
describe('orderPollFetcher', () => {
  test('thiếu orderId hoặc token → undefined (không có gì để poll)', () => {
    expect(orderPollFetcher(undefined, 'tok')).toBeUndefined();
    expect(orderPollFetcher('o1', null)).toBeUndefined();
    expect(orderPollFetcher('o1', undefined)).toBeUndefined();
    expect(orderPollFetcher('', 'tok')).toBeUndefined();
    expect(orderPollFetcher('o1', '')).toBeUndefined();
  });

  test('đủ cả hai → hàm gọi GET /orders/:id kèm Bearer', async () => {
    const order = { id: 'o1', status: 'PAID', total: 40000, createdAt: '2026-10-09T10:00:00.000Z', items: [] };
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(order), { status: 200, headers: { 'Content-Type': 'application/json' } }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const run = orderPollFetcher('o1', 'tok-1');
    expect(run).toBeTypeOf('function');
    await expect(run!()).resolves.toEqual(order);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/orders\/o1$/);
    expect(init.headers.Authorization).toBe('Bearer tok-1');
  });
});

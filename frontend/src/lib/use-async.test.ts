import { describe, expect, test, vi } from 'vitest';
import { ApiError } from './api';
import { createAsyncRunner } from './use-async';
import type { AsyncState } from './use-async';

// Không có DOM để chạy hook: test phần lõi (createAsyncRunner), hook useAsync chỉ nối lõi này vào useState / useEffect.
const deferred = <T>() => {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

// chờ hết các microtask đang treo (promise đã settle thì then chạy trong lượt này)
const flush = () => new Promise<void>((r) => setTimeout(r, 0));

const setup = <T>(fn: () => Promise<T>) => {
  const states: AsyncState<T>[] = [];
  const runner = createAsyncRunner(fn, (s) => states.push(s));
  return { runner, states, last: () => states[states.length - 1] };
};

describe('createAsyncRunner', () => {
  test('start: báo loading ngay, xong thì có data và hết loading', async () => {
    const { runner, states, last } = setup(() => Promise.resolve([1, 2]));
    runner.start();
    expect(states[0]).toEqual({ data: undefined, error: undefined, loading: true });
    await flush();
    expect(last()).toEqual({ data: [1, 2], error: undefined, loading: false });
  });

  test('fn reject bằng ApiError: error giữ nguyên status', async () => {
    const { runner, last } = setup(() => Promise.reject(new ApiError('Máy chủ trả lỗi (mã 500).', 500)));
    runner.start();
    await flush();
    const s = last();
    expect(s.loading).toBe(false);
    expect(s.data).toBeUndefined();
    expect(s.error).toBeInstanceOf(ApiError);
    expect(s.error?.status).toBe(500);
    expect(s.error?.message).toBe('Máy chủ trả lỗi (mã 500).');
  });

  test('fn reject bằng Error thường hoặc giá trị lạ: bọc thành ApiError status 0', async () => {
    const a = setup(() => Promise.reject(new TypeError('fetch failed')));
    a.runner.start();
    await flush();
    expect(a.last().error).toBeInstanceOf(ApiError);
    expect(a.last().error?.status).toBe(0);
    expect(a.last().error?.message).toBe('fetch failed');

    const b = setup(() => Promise.reject('boom'));
    b.runner.start();
    await flush();
    expect(b.last().error?.status).toBe(0);
    expect(b.last().error?.message).toBe('Lỗi không xác định');
  });

  test('fn ném đồng bộ cũng thành error, không văng ra ngoài start()', async () => {
    const { runner, last } = setup<number>(() => {
      throw new ApiError('hỏng', 503);
    });
    expect(() => runner.start()).not.toThrow();
    await flush();
    expect(last().error?.status).toBe(503);
  });

  test('retry gọi lại fn; lỗi trước đó bị xóa, có data mới', async () => {
    const fn = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new ApiError('mất mạng', 0))
      .mockResolvedValueOnce('menu');
    const { runner, states, last } = setup(fn);
    runner.start();
    await flush();
    expect(last().error?.message).toBe('mất mạng');

    runner.retry();
    expect(fn).toHaveBeenCalledTimes(2);
    expect(last()).toEqual({ data: undefined, error: undefined, loading: true });
    await flush();
    expect(last()).toEqual({ data: 'menu', error: undefined, loading: false });
    expect(states.filter((s) => s.loading)).toHaveLength(2);
  });

  test('retry khi lần trước còn chạy: kết quả lần cũ về muộn bị bỏ', async () => {
    const first = deferred<string>();
    const second = deferred<string>();
    const fn = vi.fn<() => Promise<string>>().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    const { runner, last } = setup(fn);
    runner.start();
    runner.retry();
    second.resolve('mới');
    await flush();
    expect(last().data).toBe('mới');

    first.resolve('cũ');
    await flush();
    expect(last().data).toBe('mới');
  });

  test('lỗi của lần cũ về muộn cũng bị bỏ', async () => {
    const first = deferred<string>();
    const second = deferred<string>();
    const fn = vi.fn<() => Promise<string>>().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    const { runner, last } = setup(fn);
    runner.start();
    runner.retry();
    second.resolve('mới');
    first.reject(new ApiError('cũ', 500));
    await flush();
    expect(last()).toEqual({ data: 'mới', error: undefined, loading: false });
  });

  test('cancel: kết quả về sau đó (thành công hoặc lỗi) không báo thêm gì', async () => {
    const ok = deferred<string>();
    const a = setup(() => ok.promise);
    a.runner.start();
    a.runner.cancel();
    ok.resolve('x');
    await flush();
    expect(a.states).toHaveLength(1);

    const bad = deferred<string>();
    const b = setup(() => bad.promise);
    b.runner.start();
    b.runner.cancel();
    bad.reject(new ApiError('x', 500));
    await flush();
    expect(b.states).toHaveLength(1);
  });

  test('sau cancel vẫn start lại được', async () => {
    const { runner, last } = setup(() => Promise.resolve('ok'));
    runner.start();
    runner.cancel();
    runner.start();
    await flush();
    expect(last().data).toBe('ok');
  });
});

// ============================================================
// FEATURE: Mẫu trạng thái loading / lỗi / dữ liệu cho màn tải từ API (Menu dùng đầu tiên).
// createAsyncRunner là lõi không phụ thuộc React (test bằng async thường); useAsync chỉ nối lõi vào useState / useEffect.
// ============================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from './api';

export interface AsyncState<T> {
  data: T | undefined;
  error: ApiError | undefined;
  loading: boolean;
}

export interface AsyncRunner {
  /** Chạy fn; báo loading ngay, rồi báo data hoặc error. Kết quả của lần chạy cũ về muộn bị bỏ. */
  start: () => void;
  /** Chạy lại fn (cùng start): nút "Thử lại". */
  retry: () => void;
  /** Bỏ kết quả của lần đang chạy (rời màn, đổi deps). Vẫn start lại được. */
  cancel: () => void;
}

const LOADING = { data: undefined, error: undefined, loading: true } as const;

// fn có thể ném thứ không phải ApiError (TypeError, SyntaxError của res.json()): bọc lại, status 0 = không có mã HTTP.
export function toApiError(e: unknown): ApiError {
  if (e instanceof ApiError) return e;
  return new ApiError(e instanceof Error ? e.message : 'Lỗi không xác định', 0);
}

export function createAsyncRunner<T>(fn: () => Promise<T>, onChange: (state: AsyncState<T>) => void): AsyncRunner {
  let run = 0; // số thứ tự lần chạy hiện hành; kết quả mang số cũ hơn thì bỏ

  const start = () => {
    const mine = ++run;
    onChange({ ...LOADING });
    let pending: Promise<T>;
    try {
      pending = fn();
    } catch (e) {
      pending = Promise.reject(e); // fn ném đồng bộ cũng thành error, không văng ra khỏi start()
    }
    const settle = (next: AsyncState<T>) => {
      if (mine === run) onChange(next);
    };
    pending.then(
      (data) => settle({ data, error: undefined, loading: false }),
      (e) => settle({ data: undefined, error: toApiError(e), loading: false }),
    );
  };

  return {
    start,
    retry: start,
    cancel: () => {
      run++;
    },
  };
}

/** Chạy fn khi mount và mỗi khi deps đổi. Menu: useAsync(getProducts, []). */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [state, setState] = useState<AsyncState<T>>({ ...LOADING });
  const runner = useRef<AsyncRunner | null>(null);

  useEffect(() => {
    const r = createAsyncRunner(fn, setState);
    runner.current = r;
    r.start();
    return r.cancel;
    // deps do nơi gọi quyết định (như useEffect), fn không cần ổn định
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const retry = useCallback(() => runner.current?.retry(), []);
  return { ...state, retry };
}

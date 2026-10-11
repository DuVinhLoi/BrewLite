// ============================================================
// FEATURE: Biên lai và lịch sử tự cập nhật trạng thái đơn (UC07): hỏi lại backend mỗi 3 giây đến khi đơn xong.
// startPolling là lõi không phụ thuộc React (test bằng fake timers); usePolling / useOrderPoll chỉ nối lõi vào useState / useEffect.
// ============================================================

import { useCallback, useEffect, useState } from 'react';
import { ApiError, getOrder } from './api';
import { getToken } from './auth';
import { isTerminal } from './order-status';
import type { OrderDetail } from './types';
import { toApiError } from './use-async';

/** Chu kỳ hỏi lại: biên lai và /history. */
export const POLL_INTERVAL_MS = 3000;

// Lỗi không tự khỏi nếu hỏi tiếp: hết phiên, đơn của người khác, không có đơn. Mất mạng (0) và 5xx thì có thể khỏi.
const NON_RECOVERABLE = [401, 403, 404];

export interface PollOptions<T> {
  /** Một lần hỏi backend. */
  fetch: () => Promise<T>;
  /** Dữ liệu này đã là kết quả cuối (không cần hỏi nữa)? */
  isDone: (data: T) => boolean;
  onData: (data: T) => void;
  onError: (error: ApiError) => void;
  intervalMs: number;
}

// ponytail: hỏi lại theo chu kỳ cố định, kể cả khi tab bị ẩn (chưa dùng Page Visibility), không có đẩy từ server (WebSocket / SSE) —
// đủ cho demo; nhiều khách mở biên lai / lịch sử cùng lúc thì tải tăng theo 1 request mỗi 3 giây mỗi tab
/**
 * Hỏi ngay lần đầu, rồi hẹn lần sau intervalMs SAU KHI lần trước xong (không bao giờ có 2 request chồng nhau).
 * Tự dừng khi isDone(data), hoặc khi gặp lỗi 401 / 403 / 404 (sau khi gọi onError). Mất mạng, 5xx, lỗi khác: báo onError rồi hỏi tiếp;
 * lõi không giữ data nên nơi gọi giữ data cuối. Trả về stop(): sau stop, kết quả của request đang bay (thành công hay lỗi) bị bỏ.
 */
export function startPolling<T>({ fetch, isDone, onData, onError, intervalMs }: PollOptions<T>): () => void {
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const stop = () => {
    stopped = true;
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
  };
  const scheduleNext = () => {
    if (!stopped) timer = setTimeout(tick, intervalMs);
  };

  function tick() {
    timer = undefined;
    let pending: Promise<T>;
    try {
      pending = fetch();
    } catch (e) {
      pending = Promise.reject(e); // fetch ném đồng bộ cũng là lỗi, không văng ra khỏi lõi
    }
    pending.then(
      (data) => {
        if (stopped) return;
        onData(data);
        if (isDone(data)) stop();
        else scheduleNext();
      },
      (e) => {
        if (stopped) return;
        const error = toApiError(e);
        onError(error);
        if (NON_RECOVERABLE.includes(error.status)) stop();
        else scheduleNext();
      },
    );
  }

  tick();
  return stop;
}

/**
 * Nối startPolling vào React. source() chạy trong effect và trả hàm hỏi một lần, hoặc undefined khi chưa đủ đầu vào (không poll).
 * Chạy lại khi deps đổi (data và lỗi cũ bị bỏ) hoặc khi gọi refresh() (hỏi ngay, data cũ vẫn hiện đến khi có data mới). Rời màn thì dừng.
 * source và isDone được đọc lúc chạy effect; deps quyết định khi nào chạy lại (như useEffect).
 */
export function usePolling<T>(
  source: () => (() => Promise<T>) | undefined,
  isDone: (data: T) => boolean,
  intervalMs: number,
  deps: unknown[],
) {
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<ApiError | undefined>(undefined);
  const [round, setRound] = useState(0);

  // deps đổi (đơn khác, tài khoản khác): bỏ data của lần trước. refresh() không đi qua đây nên giữ data cũ.
  useEffect(() => {
    setData(undefined);
    setError(undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    const fetch = source();
    if (!fetch) return;
    return startPolling<T>({
      fetch,
      isDone,
      intervalMs,
      onData: (d) => {
        setData(d);
        setError(undefined);
      },
      onError: setError,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, intervalMs, round]);

  /** Nút "Thử lại" và sau khi hủy đơn: bỏ lỗi, hỏi lại ngay. */
  const refresh = useCallback(() => {
    setError(undefined);
    setRound((n) => n + 1);
  }, []);

  return { data, error, refresh };
}

/** Hàm hỏi GET /orders/:id cho một đơn; undefined khi thiếu mã đơn hoặc token (không poll). */
export function orderPollFetcher(orderId: string | undefined, token: string | null | undefined): (() => Promise<OrderDetail>) | undefined {
  return orderId && token ? () => getOrder(orderId, token) : undefined;
}

const isOrderDone = (order: OrderDetail) => isTerminal(order.status);

/** Biên lai: theo dõi một đơn đến COMPLETED / CANCELLED. orderId undefined (cổng mock) hoặc chưa đăng nhập thì không poll. */
export function useOrderPoll(orderId: string | undefined, intervalMs = POLL_INTERVAL_MS): { order: OrderDetail | undefined; error?: ApiError } {
  const { data, error } = usePolling(() => orderPollFetcher(orderId, getToken()), isOrderDone, intervalMs, [orderId]);
  return { order: data, error };
}

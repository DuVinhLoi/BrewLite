// ============================================================
// FEATURE: Order State Machine phía FE (đề §9 + sơ đồ §9.1) — nhãn, bảng chuyển trạng thái, thanh tiến trình.
// Bảng TRANSITIONS là bản sao của ALLOWED ở backend/src/state-machine/order-state.machine.ts;
// order-status.test.ts pin nó với 9 mũi tên của sơ đồ và đọc thẳng file backend để 2 bên không lệch.
// ============================================================

export type OrderStatus =
  | 'PENDING'
  | 'PAID'
  | 'PREPARING'
  | 'READY'
  | 'COMPLETED'
  | 'PAYMENT_FAILED'
  | 'CANCELLED';

export const ORDER_STATUSES: OrderStatus[] = [
  'PENDING',
  'PAID',
  'PREPARING',
  'READY',
  'COMPLETED',
  'PAYMENT_FAILED',
  'CANCELLED',
];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: 'Chờ thanh toán',
  PAID: 'Đã thanh toán',
  PREPARING: 'Đang pha',
  READY: 'Sẵn sàng',
  COMPLETED: 'Hoàn tất',
  PAYMENT_FAILED: 'Thanh toán lỗi',
  CANCELLED: 'Đã hủy',
};

// 9 mũi tên của sơ đồ §9.1; COMPLETED và CANCELLED là trạng thái cuối.
export const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['PAID', 'PAYMENT_FAILED', 'CANCELLED'],
  PAID: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY'],
  READY: ['COMPLETED'],
  COMPLETED: [],
  PAYMENT_FAILED: ['PENDING', 'CANCELLED'],
  CANCELLED: [],
};

// Luồng chính của sơ đồ (thanh tiến trình 5 bước)
export const HAPPY_PATH: OrderStatus[] = ['PENDING', 'PAID', 'PREPARING', 'READY', 'COMPLETED'];

export const isOrderStatus = (s: string): s is OrderStatus => (ORDER_STATUSES as string[]).includes(s);

// US-10: khách hủy được khi chưa vào quầy (PENDING, PAYMENT_FAILED, PAID); PREPARING trở đi backend trả 400.
export const canCancel = (s: string): boolean => isOrderStatus(s) && TRANSITIONS[s].includes('CANCELLED');

// Trạng thái cuối: không còn mũi tên đi ra (COMPLETED, CANCELLED). Biên lai và lịch sử tự cập nhật đến khi đơn tới đây
// (lib/use-order-poll.ts). Trạng thái lạ → false: cứ hỏi tiếp thay vì tin là xong.
export const isTerminal = (s: string): boolean => isOrderStatus(s) && TRANSITIONS[s].length === 0;

export interface TrackStep {
  status: OrderStatus;
  label: string;
  state: 'done' | 'current' | 'todo';
}

export type StatusTrack =
  | { kind: 'steps'; steps: TrackStep[] }
  | { kind: 'failed' | 'cancelled' | 'unknown'; label: string };

// Dữ liệu cho thanh tiến trình: luồng chính 5 bước; PAYMENT_FAILED / CANCELLED / trạng thái lạ hiện nhãn riêng.
export function statusTrack(s: string): StatusTrack {
  if (s === 'PAYMENT_FAILED') return { kind: 'failed', label: STATUS_LABEL.PAYMENT_FAILED };
  if (s === 'CANCELLED') return { kind: 'cancelled', label: STATUS_LABEL.CANCELLED };
  const at = HAPPY_PATH.indexOf(s as OrderStatus);
  if (at < 0) return { kind: 'unknown', label: s };
  return {
    kind: 'steps',
    steps: HAPPY_PATH.map((status, i) => ({
      status,
      label: STATUS_LABEL[status],
      state: i < at ? 'done' : i === at ? 'current' : 'todo',
    })),
  };
}

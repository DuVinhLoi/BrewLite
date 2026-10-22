// ============================================================
// FEATURE: Lịch sử đơn (US-09) — phần thuần của trang /history, tách ra để test không cần trình duyệt.
// ============================================================

import { isOrderStatus, STATUS_LABEL, type OrderStatus } from './order-status';
import type { HistoryItem, HistoryOrder } from './types';

// Trạng thái do nhân viên quầy đẩy (qua Swagger): chỉ khi còn đơn ở đây thì /history còn gì để chờ.
const COUNTER_DRIVEN = ['PAID', 'PREPARING', 'READY'];

/**
 * Ruling R14: /history tự cập nhật chỉ khi còn ít nhất một đơn PAID / PREPARING / READY. PENDING, PAYMENT_FAILED và
 * trạng thái lạ không kích hoạt poll (chỉ khách đẩy được chúng, nên poll mãi chỉ tốn request); danh sách rỗng cũng dừng.
 * Trang dùng `isDone = !needsPolling`.
 */
export const needsPolling = (orders: HistoryOrder[]): boolean => orders.some((o) => COUNTER_DRIVEN.includes(o.status));

/**
 * "2× Latte (L + Trân châu, Kem cheese)"; thiếu size thì M. Tên món do backend gắn (productName);
 * thiếu hoặc rỗng thì rơi về 8 ký tự đầu của mã món (không in "undefined").
 * Đơn giá không nằm trong chuỗi này: HistoryView vẽ nó ở cột riêng (ui-visual-plan.md §6 mục 10, bỏ em-dash).
 */
export function itemLine(i: HistoryItem): string {
  const toppings = i.toppings?.length ? ` + ${i.toppings.join(', ')}` : '';
  const name = typeof i.productName === 'string' && i.productName ? i.productName : i.productId.slice(0, 8);
  return `${i.quantity}× ${name} (${i.size ?? 'M'}${toppings})`;
}

/** Màu nhãn trạng thái ở đầu thẻ đơn; trùng tên tone của components/ui/Badge. */
export type HistoryTone = 'neutral' | 'ink' | 'ok' | 'warn';

// Artboard HistoryDoodle dòng 98 đến 101: chờ / đã trả nền mist, đang pha warn, sẵn sàng ok, hoàn tất nền mực.
const BADGE_TONE: Partial<Record<OrderStatus, HistoryTone>> = {
  PENDING: 'neutral',
  PAID: 'neutral',
  PREPARING: 'warn',
  READY: 'ok',
  COMPLETED: 'ink',
};

/**
 * Nhãn trạng thái ở đầu thẻ đơn: chữ STATUS_LABEL (tiếng Việt, không phải mã tiếng Anh) và màu.
 * null khi đơn không có thanh 5 bước (Thanh toán lỗi, Đã hủy, trạng thái lạ): OrderStatusTrack tự hiện nhãn riêng ở chỗ đó,
 * nên mỗi thẻ có đúng một nhãn.
 */
export function statusBadge(status: string): { label: string; tone: HistoryTone } | null {
  const tone = isOrderStatus(status) ? BADGE_TONE[status] : undefined;
  return tone ? { label: STATUS_LABEL[status as OrderStatus], tone } : null;
}

/** Đơn đã hủy hoặc thanh toán lỗi: thẻ mờ 0,72 và không có thanh tiến trình (§6 mục 10). */
export const isFaded = (status: string): boolean => status === 'CANCELLED' || status === 'PAYMENT_FAILED';

/** Mới nhất trước (backend đã trả đúng thứ tự này; sắp lại để trang không phụ thuộc vào đó). Không đổi mảng gốc. */
export function sortNewestFirst(orders: HistoryOrder[]): HistoryOrder[] {
  return [...orders].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

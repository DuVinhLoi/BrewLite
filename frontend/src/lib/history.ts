// ============================================================
// FEATURE: Lịch sử đơn (UC07) — phần thuần của trang /history, tách ra để test không cần trình duyệt.
// ============================================================

import { formatVND } from './pricing';
import type { HistoryItem, HistoryOrder } from './types';

// Trạng thái do quầy (Barista) đẩy: chỉ khi còn đơn ở đây thì /history còn gì để chờ.
const COUNTER_DRIVEN = ['PAID', 'PREPARING', 'READY'];

/**
 * Ruling R14: /history tự cập nhật chỉ khi còn ít nhất một đơn PAID / PREPARING / READY. PENDING, PAYMENT_FAILED và
 * trạng thái lạ không kích hoạt poll (chỉ khách đẩy được chúng, nên poll mãi chỉ tốn request); danh sách rỗng cũng dừng.
 * Trang dùng `isDone = !needsPolling`.
 */
export const needsPolling = (orders: HistoryOrder[]): boolean => orders.some((o) => COUNTER_DRIVEN.includes(o.status));

/**
 * "2× Latte (L + Trân châu, Kem cheese) — 55.000đ"; thiếu size thì M. Tên món do backend gắn (productName);
 * thiếu hoặc rỗng thì rơi về 8 ký tự đầu của mã món (không in "undefined").
 */
export function itemLine(i: HistoryItem): string {
  const toppings = i.toppings?.length ? ` + ${i.toppings.join(', ')}` : '';
  const name = typeof i.productName === 'string' && i.productName ? i.productName : i.productId.slice(0, 8);
  return `${i.quantity}× ${name} (${i.size ?? 'M'}${toppings}) — ${formatVND(i.unitPrice)}`;
}

/** Mới nhất trước (backend đã trả đúng thứ tự này; sắp lại để trang không phụ thuộc vào đó). Không đổi mảng gốc. */
export function sortNewestFirst(orders: HistoryOrder[]): HistoryOrder[] {
  return [...orders].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

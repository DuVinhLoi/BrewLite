// ============================================================
// FEATURE: Màn quầy (UC08–UC12, mở rộng ngoài MVP §3.2): hàng đợi 3 cột theo sơ đồ §9.1.
// ============================================================
import { API_BASE } from './api';
import { isStaff } from './auth';
import { nextStatus, type OrderStatus } from './order-status';
import { handleUnauthorized } from './session';
import type { HistoryItem, HistoryOrder } from './types';

// GET /orders?status= trả đơn cùng hình với GET /orders/me (dòng món có productName): dùng chung kiểu, tên cũ giữ cho import cũ.
export type QueueItem = HistoryItem;
export type QueueOrder = HistoryOrder;

// Tự tải lại hàng đợi mỗi 5 giây (UC08).
export const POLL_MS = 5000;

/** Dòng nhắc dưới tiêu đề màn quầy, tính từ POLL_MS: "Tự tải lại mỗi 5 giây." */
export const pollNote = (ms: number = POLL_MS): string => `Tự tải lại mỗi ${ms / 1000} giây.`;

// Quầy chỉ dành cho nhân viên; isStaff định nghĩa ở lib/auth, re-export để import cũ vẫn chạy.
export { isStaff };

export type QueueColumn = 'PAID' | 'PREPARING' | 'READY';

export const QUEUE_COLUMNS: { status: QueueColumn; title: string }[] = [
  { status: 'PAID', title: 'Chờ pha' },
  { status: 'PREPARING', title: 'Đang pha' },
  { status: 'READY', title: 'Sẵn sàng' },
];

// UC09 / UC10 / UC11
export const ACTION_LABEL: Record<QueueColumn, string> = { PAID: 'Nhận pha', PREPARING: 'Pha xong', READY: 'Đã giao' };

/**
 * Nút trên thẻ đơn của một cột: nút tiến đơn (trạng thái kế theo nextStatus, chữ theo ACTION_LABEL, đang chuyển thì
 * "Đang chuyển…") và nút "Hủy (hết nguyên liệu)" chỉ ở cột Chờ pha (UC12). Mỗi cột hàng đợi luôn có bước kế.
 */
export function cardActions(column: QueueColumn, busy: boolean): { advance: { to: OrderStatus; label: string }; cancel: boolean } {
  return {
    advance: { to: nextStatus(column) as OrderStatus, label: busy ? 'Đang chuyển…' : ACTION_LABEL[column] },
    cancel: column === 'PAID',
  };
}

export function groupQueue(orders: QueueOrder[]): Record<QueueColumn, QueueOrder[]> {
  const sorted = [...orders].sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
  return {
    PAID: sorted.filter((o) => o.status === 'PAID'),
    PREPARING: sorted.filter((o) => o.status === 'PREPARING'),
    READY: sorted.filter((o) => o.status === 'READY'),
  };
}

// 401/403: phiên hết hạn hoặc sai vai trò — thử lại cũng vô ích nên màn quầy ngừng tự tải lại khi gặp lỗi này.
// 401 còn xóa token và về /login?next= (handleUnauthorized, lib/session.ts) trước khi ném.
export class QueueAuthError extends Error {}

export async function fetchQueue(token: string): Promise<QueueOrder[]> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/orders?status=PAID,PREPARING,READY`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
  } catch {
    throw new Error('Không kết nối được máy chủ (hàng đợi quầy).');
  }
  if (res.status === 401) {
    handleUnauthorized();
    throw new QueueAuthError('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại.');
  }
  if (res.status === 403) throw new QueueAuthError('Trang này cần tài khoản quầy (Barista) hoặc quản trị.');
  if (!res.ok) throw new Error(`Không tải được hàng đợi (mã ${res.status}).`);
  return res.json();
}

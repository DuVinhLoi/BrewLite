// ============================================================
// FEATURE: Màn quầy (UC08–UC12, mở rộng ngoài MVP §3.2): hàng đợi 3 cột theo sơ đồ §9.1.
// ============================================================
import { API_BASE } from './api';

export interface QueueItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  size?: string;
  toppings?: string[];
}

export interface QueueOrder {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  items: QueueItem[];
}

export type QueueColumn = 'PAID' | 'PREPARING' | 'READY';

export const QUEUE_COLUMNS: { status: QueueColumn; title: string }[] = [
  { status: 'PAID', title: 'Chờ pha' },
  { status: 'PREPARING', title: 'Đang pha' },
  { status: 'READY', title: 'Sẵn sàng' },
];

// UC09 / UC10 / UC11
export const ACTION_LABEL: Record<QueueColumn, string> = { PAID: 'Nhận pha', PREPARING: 'Pha xong', READY: 'Đã giao' };

export function groupQueue(orders: QueueOrder[]): Record<QueueColumn, QueueOrder[]> {
  const sorted = [...orders].sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
  return {
    PAID: sorted.filter((o) => o.status === 'PAID'),
    PREPARING: sorted.filter((o) => o.status === 'PREPARING'),
    READY: sorted.filter((o) => o.status === 'READY'),
  };
}

// 401/403: phiên hết hạn hoặc sai vai trò — thử lại cũng vô ích nên màn quầy ngừng tự tải lại khi gặp lỗi này.
export class QueueAuthError extends Error {}

export async function fetchQueue(token: string): Promise<QueueOrder[]> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/orders?status=PAID,PREPARING,READY`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
  } catch {
    throw new Error('Không kết nối được máy chủ (hàng đợi quầy).');
  }
  if (res.status === 401) throw new QueueAuthError('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại.');
  if (res.status === 403) throw new QueueAuthError('Trang này cần tài khoản quầy (Barista) hoặc quản trị.');
  if (!res.ok) throw new Error(`Không tải được hàng đợi (mã ${res.status}).`);
  return res.json();
}

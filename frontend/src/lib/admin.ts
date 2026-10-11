// ============================================================
// FEATURE: Màn tồn kho (UC14, mở rộng ngoài MVP §3.2). Chỉ Product.stock, không CRUD món.
// ============================================================
import { API_BASE } from './api';
import { handleUnauthorized } from './session';

export interface InventoryItem {
  id: string;
  name: string;
  price: number;
  stock: number;
  version: number;
  imageUrl?: string;
}

export const LOW_STOCK = 3;

export function stockBadge(stock: number): { label: string; tone: 'out' | 'low' | 'ok' } {
  if (stock <= 0) return { label: 'Hết hàng', tone: 'out' };
  if (stock <= LOW_STOCK) return { label: 'Sắp hết', tone: 'low' };
  return { label: 'Còn hàng', tone: 'ok' };
}

async function call<T>(token: string, path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
  } catch {
    throw new Error('Không kết nối được máy chủ (tồn kho).');
  }
  if (res.status === 401) {
    handleUnauthorized(); // xóa token, về /login?next= (lib/session.ts) trước khi ném
    throw new Error('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại.');
  }
  if (res.status === 403) throw new Error('Trang này cần tài khoản quản trị (Admin).');
  if (res.status === 409) throw new Error('Tồn kho vừa thay đổi (có đơn mới hoặc người khác sửa). Đã tải lại, hãy thử lại.');
  if (res.status === 400) {
    // Chỉ lỗi "âm" mới báo âm; 400 khác (vượt giới hạn, sai kiểu…) báo chung. message có thể là chuỗi hoặc mảng (class-validator).
    const body = await res.json().catch(() => ({}));
    const message = Array.isArray(body?.message) ? body.message.join(', ') : String(body?.message ?? '');
    throw new Error(/negative/i.test(message) ? 'Tồn kho không được âm.' : 'Giá trị tồn kho không hợp lệ.');
  }
  if (!res.ok) throw new Error(`Thao tác tồn kho lỗi (mã ${res.status}).`);
  return res.json();
}

export const fetchInventory = (token: string) => call<InventoryItem[]>(token, '/admin/products');

export const adjustStock = (token: string, id: string, body: { mode: 'set' | 'delta'; value: number; version: number }) =>
  call<InventoryItem>(token, `/admin/products/${encodeURIComponent(id)}/stock`, { method: 'PATCH', body: JSON.stringify(body) });

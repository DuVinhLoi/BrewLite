// ============================================================
// FEATURE: Màn tồn kho (UC14, mở rộng ngoài MVP §3.2). Chỉ Product.stock, không CRUD món.
// ============================================================
import { API_BASE } from './api';
import { handleUnauthorized } from './session';
import { stockBadge } from './stock';

export interface InventoryItem {
  id: string;
  name: string;
  price: number;
  stock: number;
  version: number;
  imageUrl?: string;
}

// Định nghĩa ở lib/stock.ts (menu khách cũng dùng, không kéo theo client API admin); re-export để import cũ giữ nguyên.
export { LOW_STOCK, stockBadge } from './stock';

/**
 * Dòng tóm tắt dưới tiêu đề màn Kho, đếm theo stockBadge: "4 món. 1 món sắp hết, 1 món hết hàng."
 * Chỉ nêu nhóm có món; không món nào sắp hết hay hết thì "N món, tất cả còn hàng."; danh sách rỗng thì "Chưa có món nào."
 */
export function inventorySummary(items: { stock: number }[]): string {
  if (items.length === 0) return 'Chưa có món nào.';
  let low = 0;
  let out = 0;
  for (const p of items) {
    const tone = stockBadge(p.stock).tone;
    if (tone === 'low') low++;
    else if (tone === 'out') out++;
  }
  const parts = [low && `${low} món sắp hết`, out && `${out} món hết hàng`].filter(Boolean);
  return parts.length ? `${items.length} món. ${parts.join(', ')}.` : `${items.length} món, tất cả còn hàng.`;
}

/** Ô "Đặt số": số nguyên ≥ 0 thì trả số đó, còn lại (trống, âm, lẻ, chữ) trả null và nút "Lưu" bị khóa. */
export function parseStockDraft(draft: string | undefined): number | null {
  if (draft === undefined || draft === '') return null;
  const n = Number(draft);
  return Number.isInteger(n) && n >= 0 ? n : null;
}

/** Nút "Điều chỉnh nhanh" (mode delta): −1 khóa khi đã hết hàng; đang gửi thì khóa cả ba. aria-label nêu tên món. */
export function quickSteps(name: string, stock: number, busy: boolean): { delta: number; text: string; label: string; disabled: boolean }[] {
  return [
    { delta: -1, text: '−1', label: `Giảm 1 ${name}`, disabled: busy || stock <= 0 },
    { delta: 1, text: '+1', label: `Tăng 1 ${name}`, disabled: busy },
    { delta: 10, text: '+10', label: `Tăng 10 ${name}`, disabled: busy },
  ];
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

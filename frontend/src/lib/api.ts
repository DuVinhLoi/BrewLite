// ============================================================
// FEATURE: Menu API — GET /products; chỉ dùng menu mẫu khi chưa cấu hình NEXT_PUBLIC_API_URL.
// ============================================================

import type { Product } from './types';
import { MOCK_PRODUCTS } from './mock-products';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

interface RawProduct {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  image?: string;
  stock?: number;
  version?: number;
}

function normalize(raw: RawProduct): Product {
  return {
    id: String(raw.id),
    name: String(raw.name),
    price: Number(raw.price),
    imageUrl: raw.imageUrl ?? raw.image ?? '',
    stock: Number(raw.stock ?? 999),
    version: raw.version !== undefined ? Number(raw.version) : 1,
  };
}

// UC06 KB2/KB3: khách chỉ hủy được đơn chưa vào quầy (khớp assertTransition ở backend; PREPARING trở đi bị 400).
const CANCELLABLE_STATUSES = ['PENDING', 'PAYMENT_FAILED', 'PAID'];

export const canCancelOrder = (status: string) => CANCELLABLE_STATUSES.includes(status);

// PATCH /orders/:id { status: 'CANCELLED' } kèm Bearer JWT; ném Error với thông điệp tiếng Việt cho UI hiển thị.
export async function cancelOrder(orderId: string, token: string): Promise<void> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/orders/${encodeURIComponent(orderId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: 'CANCELLED' }),
    });
  } catch {
    throw new Error('Không kết nối được máy chủ để hủy đơn.');
  }
  if (res.ok) return;
  const data = await res.json().catch(() => ({}));
  const detail = Array.isArray(data.message) ? data.message.join(', ') : data.message;
  if (res.status === 401) throw new Error('Bạn cần đăng nhập lại để hủy đơn.');
  if (res.status === 403) throw new Error('Bạn không có quyền hủy đơn này (đơn thuộc tài khoản khác).');
  if (res.status === 404) throw new Error('Không tìm thấy đơn.');
  throw new Error(`Không thể hủy đơn${detail ? `: ${detail}` : ` (mã ${res.status})`}`);
}

// Chưa cấu hình NEXT_PUBLIC_API_URL → menu mẫu (demo UI không cần backend, ProductGrid hiện banner).
// Đã cấu hình → lỗi/rỗng là thật: ném lỗi để ProductGrid hiện error + retry, trả [] để hiện empty
// (rơi về menu mẫu lúc này sẽ cho khách thêm món có id không tồn tại trong DB → 404 khi đặt đơn).
export async function getProducts(): Promise<{ data: Product[]; fromMock: boolean }> {
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base) return { data: MOCK_PRODUCTS, fromMock: true };

  let res: Response;
  try {
    res = await fetch(`${base}/products`, { cache: 'no-store' });
  } catch {
    throw new Error('Không kết nối được máy chủ (GET /products).');
  }
  if (!res.ok) throw new Error(`GET /products lỗi (mã ${res.status}).`);
  const json = await res.json();
  const list: RawProduct[] = Array.isArray(json) ? json : json.data ?? json.items ?? [];
  return { data: Array.isArray(list) ? list.map(normalize) : [], fromMock: false };
}

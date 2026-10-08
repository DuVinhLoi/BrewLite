// ============================================================
// FEATURE: Menu API — GET /products; chỉ dùng menu mẫu khi chưa cấu hình NEXT_PUBLIC_API_URL.
// ============================================================

import type { Product } from './types';
import { MOCK_PRODUCTS } from './mock-products';
import { STATUS_LABEL, isOrderStatus } from './order-status';

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

// PATCH /orders/:id { status } kèm Bearer JWT; ném Error với thông điệp tiếng Việt cho UI hiển thị.
// Dùng chung cho nút Hủy và nút "Quầy (demo)"; verb là cụm động từ trong thông báo lỗi.
async function patchOrderStatus(orderId: string, status: string, token: string, verb: string): Promise<void> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/orders/${encodeURIComponent(orderId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });
  } catch {
    throw new Error(`Không kết nối được máy chủ để ${verb}.`);
  }
  if (res.ok) return;
  const data = await res.json().catch(() => ({}));
  const detail = Array.isArray(data.message) ? data.message.join(', ') : data.message;
  if (res.status === 401) throw new Error(`Bạn cần đăng nhập lại để ${verb}.`);
  if (res.status === 403) throw new Error(`Bạn không có quyền ${verb} này (đơn thuộc tài khoản khác).`);
  if (res.status === 404) throw new Error('Không tìm thấy đơn.');
  throw new Error(transitionError(res.status, detail, verb));
}

// 400 của backend: "Invalid transition PAID -> READY" → câu tiếng Việt dùng nhãn trạng thái; thông điệp khác giữ nguyên sau câu mở đầu.
function transitionError(status: number, detail: string | undefined, verb: string): string {
  const m = /^Invalid transition (\w+) -> (\w+)$/.exec(detail ?? '');
  if (m && isOrderStatus(m[1]) && isOrderStatus(m[2])) {
    return `Không thể chuyển đơn từ "${STATUS_LABEL[m[1]]}" sang "${STATUS_LABEL[m[2]]}" (sai thứ tự trạng thái).`;
  }
  return `Không thể ${verb}${detail ? `: ${detail}` : ` (mã ${status})`}`;
}

// Nút Hủy hiện khi canCancel(status) (lib/order-status.ts, khớp bảng chuyển trạng thái của backend).
export const cancelOrder = (orderId: string, token: string): Promise<void> =>
  patchOrderStatus(orderId, 'CANCELLED', token, 'hủy đơn');

// Nút "Quầy (demo)": mô phỏng Barista (ngoài MVP theo đề §3.2) tiến đơn PAID → PREPARING → READY → COMPLETED
// bằng chính PATCH /orders/:id có sẵn; backend vẫn kiểm chủ đơn và assertTransition.
export const advanceOrder = (orderId: string, status: string, token: string): Promise<void> =>
  patchOrderStatus(orderId, status, token, 'chuyển trạng thái đơn');

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

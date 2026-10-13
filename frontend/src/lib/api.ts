// ============================================================
// FEATURE: Menu API — GET /products; chỉ dùng menu mẫu khi chưa cấu hình NEXT_PUBLIC_API_URL.
// ============================================================

import type { HistoryOrder, OrderDetail, Product } from './types';
import { MOCK_PRODUCTS } from './mock-products';
import { STATUS_LABEL, isOrderStatus } from './order-status';
import { handleUnauthorized } from './session';

export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

// Lỗi gọi API: message là câu tiếng Việt cho UI; status là mã HTTP (0 = không tới được máy chủ).
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

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

// Thông điệp lỗi của backend trong thân JSON: chuỗi, hoặc mảng chuỗi (class-validator) nối bằng ", ".
// Thân không phải object (null, số, chuỗi) hoặc message sai kiểu thì coi như không có.
function errorDetail(data: unknown): string | undefined {
  const message = (data as { message?: unknown } | null)?.message;
  if (typeof message === 'string') return message;
  if (Array.isArray(message) && message.every((m) => typeof m === 'string')) return message.join(', ');
  return undefined;
}

// PATCH /orders/:id { status } kèm Bearer JWT; ném ApiError với thông điệp tiếng Việt cho UI hiển thị.
// Dùng chung cho nút Hủy và các nút ở quầy; verb là cụm động từ trong thông báo lỗi.
// 401: xóa token và về /login (lib/session.ts) trước khi ném lỗi.
async function patchOrderStatus(orderId: string, status: string, token: string, verb: string): Promise<void> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/orders/${encodeURIComponent(orderId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });
  } catch {
    throw new ApiError(`Không kết nối được máy chủ để ${verb}.`, 0);
  }
  if (res.ok) return;
  const detail = errorDetail(await res.json().catch(() => undefined));
  if (res.status === 401) {
    handleUnauthorized();
    throw new ApiError(`Bạn cần đăng nhập lại để ${verb}.`, 401);
  }
  if (res.status === 403) throw new ApiError('Bạn không có quyền thực hiện thao tác này (đơn của tài khoản khác hoặc cần tài khoản quầy).', 403);
  if (res.status === 404) throw new ApiError('Không tìm thấy đơn.', 404);
  throw new ApiError(transitionError(res.status, detail, verb), res.status);
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

// Màn quầy (/barista): Barista/Admin tiến đơn PAID → PREPARING → READY → COMPLETED bằng PATCH /orders/:id;
// backend kiểm vai trò và assertTransition.
export const advanceOrder = (orderId: string, status: string, token: string): Promise<void> =>
  patchOrderStatus(orderId, status, token, 'chuyển trạng thái đơn');

// GET /users/me (mở rộng ngoài đề §12.1): hồ sơ người đang đăng nhập, gồm tổng điểm tích lũy mà JWT không mang.
export interface Profile {
  id: string;
  email: string;
  role: 'CUSTOMER' | 'BARISTA' | 'ADMIN';
  loyaltyPoints: number;
}

export async function getProfile(token: string): Promise<Profile> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/users/me`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
  } catch {
    throw new ApiError('Không kết nối được máy chủ để tải hồ sơ.', 0);
  }
  // 401: token hết hạn hoặc sai; 404: tài khoản của token không còn. Cả hai đều là hết phiên: xóa token, về /login
  if (res.status === 401 || res.status === 404) {
    handleUnauthorized();
    throw new ApiError('Phiên đăng nhập không còn hiệu lực, hãy đăng nhập lại.', res.status);
  }
  if (!res.ok) throw new ApiError(`Không tải được hồ sơ (mã ${res.status}).`, res.status);
  return (await res.json()) as Profile;
}

// GET /orders/me (UC07): lịch sử đơn của người đang đăng nhập, mỗi dòng món kèm productName.
// Câu lỗi (trừ 401) là thông điệp backend hoặc câu có mã HTTP; trang /history ghép sau "Không tải được lịch sử: ".
// 401: xóa token và về /login (lib/session.ts) trước khi ném lỗi.
export async function getMyOrders(token: string): Promise<HistoryOrder[]> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/orders/me`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
  } catch {
    throw new ApiError('Không kết nối được máy chủ.', 0);
  }
  if (res.ok) return (await res.json()) as HistoryOrder[];
  if (res.status === 401) {
    handleUnauthorized();
    throw new ApiError('Phiên đăng nhập không còn hiệu lực, hãy đăng nhập lại.', 401);
  }
  const detail = errorDetail(await res.json().catch(() => undefined));
  throw new ApiError(detail || `Máy chủ trả lỗi (mã ${res.status}).`, res.status);
}

// GET /orders/:id (biên lai tự cập nhật trạng thái, lib/use-order-poll.ts): chỉ chủ đơn xem được.
// 403 = đơn của tài khoản khác, 404 = không có đơn này. 401: xóa token và về /login (lib/session.ts) trước khi ném lỗi.
export async function getOrder(orderId: string, token: string): Promise<OrderDetail> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/orders/${encodeURIComponent(orderId)}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
  } catch {
    throw new ApiError('Không kết nối được máy chủ.', 0);
  }
  if (res.ok) return (await res.json()) as OrderDetail;
  if (res.status === 401) {
    handleUnauthorized();
    throw new ApiError('Phiên đăng nhập không còn hiệu lực, hãy đăng nhập lại.', 401);
  }
  if (res.status === 403) throw new ApiError('Đây không phải đơn của bạn.', 403);
  if (res.status === 404) throw new ApiError('Không tìm thấy đơn.', 404);
  const detail = errorDetail(await res.json().catch(() => undefined));
  throw new ApiError(detail || `Máy chủ trả lỗi (mã ${res.status}).`, res.status);
}

// Chưa cấu hình NEXT_PUBLIC_API_URL → menu mẫu (demo UI không cần backend, ProductGrid hiện banner).
// Đã cấu hình → lỗi/rỗng là thật: ném lỗi để ProductGrid hiện error + retry, trả [] để hiện empty
// (rơi về menu mẫu lúc này sẽ cho khách thêm món có id không tồn tại trong DB → 404 khi đặt đơn).
// Lỗi là ApiError mang đúng mã HTTP (0 khi không tới được máy chủ).
export async function getProducts(): Promise<{ data: Product[]; fromMock: boolean }> {
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base) return { data: MOCK_PRODUCTS, fromMock: true };

  let res: Response;
  try {
    res = await fetch(`${base}/products`, { cache: 'no-store' });
  } catch {
    throw new ApiError('Không kết nối được máy chủ (GET /products).', 0);
  }
  if (!res.ok) throw new ApiError(`GET /products lỗi (mã ${res.status}).`, res.status);
  const json = await res.json();
  const list: RawProduct[] = Array.isArray(json) ? json : json.data ?? json.items ?? [];
  return { data: Array.isArray(list) ? list.map(normalize) : [], fromMock: false };
}

// Fresh detail data; failed requests never fall back to the demo menu.
export async function getProduct(id: string): Promise<Product> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/products/${encodeURIComponent(id)}`, { cache: 'no-store' });
  } catch {
    throw new ApiError('Không kết nối được máy chủ để tải sản phẩm.', 0);
  }
  if (res.status === 404) throw new ApiError('Sản phẩm không tồn tại.', 404);
  if (!res.ok) throw new ApiError(`Không tải được sản phẩm (mã ${res.status}).`, res.status);
  return normalize(await res.json());
}

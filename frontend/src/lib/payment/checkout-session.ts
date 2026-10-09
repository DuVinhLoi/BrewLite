import { PaymentError, newIdempotencyKey, type CartLine } from './types';

// ============================================================
// FEATURE: Phiên thanh toán của tab (UC06 KB1 + phương án A): mã đơn + key tạo đơn + key trả tiền,
// gắn với đúng nội dung giỏ. Lưu sessionStorage nên reload, hoặc "Quay lại giỏ" rồi vào lại, vẫn trả tiếp
// đúng đơn đó với đúng key (không tạo đơn mới, không trừ tiền 2 lần). Giỏ đổi thì bỏ, tạo phiên mới.
// ============================================================

export const CHECKOUT_KEY = 'brewlite-checkout';

export interface CheckoutState {
  /** Dấu vân tay giỏ (cartFingerprint) lúc tạo phiên. */
  cart: string;
  orderKey: string;
  payKey: string;
  orderId?: string;
}

const tabStore = (): Storage | null => (typeof sessionStorage !== 'undefined' ? sessionStorage : null);

/** Dấu vân tay nội dung giỏ: chỉ các trường gửi POST /orders, không phụ thuộc thứ tự dòng hay thứ tự topping. */
export function cartFingerprint(items: CartLine[]): string {
  const lines = items.map((i) => JSON.stringify([i.productId, i.quantity, i.size ?? '', [...(i.toppings ?? [])].sort()]));
  return JSON.stringify(lines.sort());
}

function read(): CheckoutState | null {
  try {
    const raw = tabStore()?.getItem(CHECKOUT_KEY);
    return raw ? (JSON.parse(raw) as CheckoutState) : null;
  } catch {
    return null;
  }
}

/** Phiên thanh toán cho giỏ này: dùng lại phiên đã lưu nếu cùng giỏ, không thì tạo phiên mới (2 key mới) và lưu. */
export function loadCheckout(items: CartLine[]): CheckoutState {
  const cart = cartFingerprint(items);
  const saved = read();
  if (saved && saved.cart === cart) return saved;
  const fresh: CheckoutState = { cart, orderKey: newIdempotencyKey(), payKey: newIdempotencyKey() };
  tabStore()?.setItem(CHECKOUT_KEY, JSON.stringify(fresh));
  return fresh;
}

/** Ghi lại mã đơn đã tạo để lần thử lại (kể cả sau reload) trả tiếp đúng đơn này. */
export function rememberOrder(orderId: string): void {
  const saved = read();
  if (saved) tabStore()?.setItem(CHECKOUT_KEY, JSON.stringify({ ...saved, orderId }));
}

export function clearCheckout(): void {
  tabStore()?.removeItem(CHECKOUT_KEY);
}

/**
 * Lỗi cho thấy đơn đang giữ không trả tiếp được: bỏ phiên, lần bấm sau tạo đơn mới với key mới.
 * Giữ phiên khi chưa biết kết quả (mất kết nối, 5xx), khi cổng từ chối (400 "Payment failed"),
 * khi kẹt kho đã hoàn tiền (409) hoặc khi cần đăng nhập lại (401).
 */
export function dropsCheckout(e: unknown): boolean {
  if (!(e instanceof PaymentError) || e.status === undefined) return false;
  if (e.status === 403 || e.status === 404 || e.status === 422) return true;
  return e.status === 400 && e.orderId !== undefined && e.detail !== 'Payment failed';
}

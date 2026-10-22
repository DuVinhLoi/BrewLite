import { getToken, userIdFromToken } from '../auth';
import { PaymentError, newIdempotencyKey, type CartLine } from './types';

// ============================================================
// FEATURE: Phiên thanh toán của tab (US-08, phương án A): mã đơn + key tạo đơn + key trả tiền,
// gắn với đúng nội dung giỏ và đúng tài khoản. Lưu sessionStorage nên reload, hoặc "Quay lại giỏ" rồi vào lại,
// vẫn trả tiếp đúng đơn đó với đúng key (không tạo đơn mới, không trừ tiền 2 lần). Giỏ đổi thì bỏ, tạo phiên mới.
// Hết phiên đăng nhập giữa lúc trả tiền: đăng nhập lại cùng tài khoản thì giữ phiên (clearCheckoutIfOtherUser).
// ============================================================

export const CHECKOUT_KEY = 'brewlite-checkout';

export interface CheckoutState {
  /** Dấu vân tay giỏ (cartFingerprint) lúc tạo phiên. */
  cart: string;
  orderKey: string;
  payKey: string;
  orderId?: string;
  /** Tài khoản (sub của JWT) lúc tạo phiên; phiên lưu trước khi có trường này, hoặc tạo khi chưa đăng nhập, thì không có. */
  userId?: string;
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

/** Phiên thanh toán cho giỏ này: dùng lại phiên đã lưu nếu cùng giỏ, không thì tạo phiên mới (2 key mới, userId của token hiện tại) và lưu. */
export function loadCheckout(items: CartLine[]): CheckoutState {
  const cart = cartFingerprint(items);
  const saved = read();
  if (saved && saved.cart === cart) return saved;
  const userId = userIdFromToken(getToken());
  const fresh: CheckoutState = { cart, orderKey: newIdempotencyKey(), payKey: newIdempotencyKey(), ...(userId ? { userId } : {}) };
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
 * Sau đăng nhập: giữ phiên khi đúng tài khoản đã tạo nó (hết phiên giữa lúc trả tiền, đăng nhập lại là trả tiếp
 * đúng đơn với đúng key); tài khoản khác, phiên cũ không có userId, userId null hoặc dữ liệu hỏng thì xóa.
 */
export function clearCheckoutIfOtherUser(userId: string | null): void {
  if (!userId || read()?.userId !== userId) clearCheckout();
}

/** Lỗi 401 của POST /orders hoặc POST /payments: PaymentForm gọi handleUnauthorized() (lib/session.ts). */
export function isUnauthorizedPayment(e: unknown): boolean {
  return e instanceof PaymentError && e.status === 401;
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

import { apiBaseUrl, ApiError, type Product } from './api';
export type Options = { sizes: Record<string, number>; toppings: Record<string, number> };
export type CartLine = { key: string; productId: string; name: string; size: string; toppings: string[]; quantity: number; unitPrice: number };
// Payment fields of GET /orders/:id (plan 1.5); the four gateway fields are null until VNPay answers.
export type Payment = { id: string; method: string; status: string; amount: number; createdAt: string; paymentUrl: string | null; expiresAt: string | null; gatewayResponseCode: string | null; gatewayTransactionStatus: string | null };
export type Order = { id: string; status: string; total: number; createdAt: string; items: (CartLine & { id: string; lineTotal: number })[]; payments?: Payment[] };
// POST /payments: 201 or 200 replay. paymentUrl and expiresAt exist only while status is PENDING.
export type PaymentResult = { paymentId: string; orderId: string; orderStatus: string; amount: number; status: string; paymentUrl?: string; expiresAt?: string };
// POST /payments/:id/sync
export type PaymentSync = { paymentId: string; orderId: string; orderStatus: string; status: string };
// GET /payments/vnpay/return: only a valid answer carries IDs.
export type VnpayReturn = { valid: true; paymentId: string; orderId: string; responseCode: string } | { valid: false };
export const statusLabels: Record<string, string> = { PENDING: 'Chờ thanh toán', PAID: 'Đã thanh toán', PAYMENT_FAILED: 'Thanh toán thất bại', PREPARING: 'Đang pha chế', READY: 'Sẵn sàng nhận', COMPLETED: 'Hoàn tất', CANCELLED: 'Đã hủy' };
export const paymentLabels: Record<string, string> = { SUCCESS: 'Đã trả', PENDING: 'Đang chờ VNPay', FAILED: 'Thất bại' };
export const paidStatuses = ['PAID', 'PREPARING', 'READY', 'COMPLETED'];
// Same key in CheckoutScreen, VnpayReturnScreen and OrdersScreen: { orderId, key, paymentId, paymentMethod } of the current checkout.
export function checkoutKey(email: string) { return `brewlite-checkout:${email}`; }
// BR-10: an order has at most one PENDING payment.
export function pendingPayment(order: Order) { return order.payments?.find((payment) => payment.status === 'PENDING'); }
// After expiresAt the stored URL must not be reused; the API has to ask VNPay first (plan 1.6). A missing expiresAt counts as expired.
export function isExpired(payment: Payment, now: number) { return !payment.expiresAt || now >= Date.parse(payment.expiresAt); }
// Customer message for a VNPay response code (plan 1.7). The code only picks the wording; the order status in the DB decides the outcome.
export function vnpayMessage(code: string): string {
  switch (code) {
    case '24': return 'Bạn đã hủy giao dịch';
    // 15 was seen in the 2026-10-30 spike (expiry at the OTP step); EXPIRED is our own gatewayResponseCode for a closed payment (D6).
    case '11': case '15': case 'EXPIRED': return 'Đã hết thời gian thanh toán';
    case '51': return 'Tài khoản không đủ số dư';
    case '13': return 'Bạn nhập sai mã OTP';
    case '09': case '10': case '12': case '79': return 'Thẻ hoặc tài khoản có vấn đề, vui lòng kiểm tra lại';
    default: return 'Thanh toán không thành công';
  }
}
// Shown while a payment has no final answer; never says "failed" and never suggests paying a second time (AC-F15.4).
export const verifyingText = 'Đang xác minh thanh toán, vui lòng kiểm tra lại';
// Message for a failed POST /payments or POST /payments/:id/sync. 502 or a lost response = VNPay side failed (UC-04 E8a, E13); 409 = no final answer yet.
export function paymentError(err: unknown) {
  if (!(err instanceof ApiError) || err.status === 502) return 'Có lỗi xảy ra, vui lòng thử lại';
  return err.status === 409 ? verifyingText : err.message;
}
export function priceFor(product: Product, size: string, selected: string[], options: Options) {
  return product.price + options.sizes[size] + selected.reduce((sum, name) => sum + options.toppings[name], 0);
}
export function cartKey(productId: string, size: string, toppings: string[]) { return JSON.stringify([productId, size, [...toppings].sort()]); }
export function addLine(lines: CartLine[], next: CartLine): CartLine[] {
  const existing = lines.find((line) => line.key === next.key);
  if (existing && existing.quantity + next.quantity > 99) throw new Error('Mỗi dòng tối đa 99 ly');
  if (!existing && lines.length >= 20) throw new Error('Giỏ hàng tối đa 20 món');
  return existing ? lines.map((line) => line.key === next.key ? { ...line, quantity: line.quantity + next.quantity } : line) : [...lines, next];
}
export function cartTotal(lines: CartLine[]) { return lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0); }
export async function shopApi<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl()}${path}`, { ...init, cache: 'no-store', headers: { ...(init.body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init.headers } });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new ApiError(data.message ?? `Không thể kết nối API (${response.status})`, response.status);
  }
  return response.json() as Promise<T>;
}
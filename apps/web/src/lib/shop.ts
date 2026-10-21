import { apiBaseUrl, ApiError, type Product } from './api';
export type Options = { sizes: Record<string, number>; toppings: Record<string, number> };
export type CartLine = { key: string; productId: string; name: string; size: string; toppings: string[]; quantity: number; unitPrice: number };
export type Order = { id: string; status: string; total: number; createdAt: string; items: (CartLine & { id: string; lineTotal: number })[]; payments?: { id: string; method: string; status: string; amount: number; createdAt: string }[] };
export const statusLabels: Record<string, string> = { PENDING: 'Chờ thanh toán', PAID: 'Đã thanh toán', PAYMENT_FAILED: 'Thanh toán thất bại', PREPARING: 'Đang pha chế', READY: 'Sẵn sàng nhận', COMPLETED: 'Hoàn tất', CANCELLED: 'Đã hủy' };
export function priceFor(product: Product, size: string, selected: string[], options: Options) {
  return product.price + options.sizes[size] + selected.reduce((sum, name) => sum + options.toppings[name], 0);
}
export function cartKey(productId: string, size: string, toppings: string[]) { return JSON.stringify([productId, size, [...toppings].sort()]); }
export function addLine(lines: CartLine[], next: CartLine): CartLine[] {
  const existing = lines.find((line) => line.key === next.key);
  if (existing && existing.quantity + next.quantity > 99) throw new Error('Mỗi dòng tối đa 99 ly');
  if (!existing && lines.length >= 20) throw new Error('Giỏ hàng tối đa 20 dòng');
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
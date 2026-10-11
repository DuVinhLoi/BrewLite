// ============================================================
// FEATURE: Nhãn tồn kho dùng chung cho menu khách (ProductCard) và màn Kho (admin). Hàm thuần, không gọi mạng.
// ============================================================
export const LOW_STOCK = 3;

export function stockBadge(stock: number): { label: string; tone: 'out' | 'low' | 'ok' } {
  if (stock <= 0) return { label: 'Hết hàng', tone: 'out' };
  if (stock <= LOW_STOCK) return { label: 'Sắp hết', tone: 'low' };
  return { label: 'Còn hàng', tone: 'ok' };
}

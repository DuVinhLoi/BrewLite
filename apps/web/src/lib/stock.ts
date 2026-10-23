export const LOW_STOCK = 5;

export type StockBadge = {
  label: string;
  tone: 'ok' | 'low' | 'out';
};

export function stockBadge(stock: number): StockBadge {
  if (stock <= 0) {
    return { label: 'Hết hàng', tone: 'out' };
  }
  if (stock <= LOW_STOCK) {
    return { label: `Sắp hết, còn ${stock}`, tone: 'low' };
  }
  return { label: `Còn ${stock}`, tone: 'ok' };
}

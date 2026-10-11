// ============================================================
// FEATURE: Tóm tắt menu cho hero trang Menu: "N món / giá từ X" (ui-visual-plan.md §6 mục 2).
// N và X tính từ danh sách GET /products, không viết cứng; menu rỗng thì không có gì để tóm tắt.
// ============================================================

import type { Product } from './types';

export interface MenuSummary {
  /** Số món đang có trên menu. */
  count: number;
  /** Giá gốc thấp nhất (VND). */
  minPrice: number;
}

export function menuSummary(products: readonly Pick<Product, 'price'>[]): MenuSummary | null {
  if (products.length === 0) return null;
  return { count: products.length, minPrice: Math.min(...products.map((p) => p.price)) };
}

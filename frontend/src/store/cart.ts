// ============================================================
// FEATURE: Cart store — Zustand + localStorage; thêm/sửa/xóa,
// tổng tiền luôn tính lại từ pricing.ts, badge đọc từ count.
// ============================================================

'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, Product, Size } from '@/lib/types';
import {
  buildCartKey,
  calcLineTotal,
  calcUnitPrice,
  DEFAULT_SIZE,
  DEFAULT_TOPPINGS,
} from '@/lib/pricing';
import { MAX_LINES, MAX_QTY, type AddItemResult } from '@/lib/cart-limits';

// Hằng giới hạn định nghĩa ở lib/cart-limits (khớp CreateOrderDto); re-export để chỗ import cũ từ store vẫn dùng được.
export { MAX_LINES, MAX_QTY };

interface CartState {
  items: CartItem[];
  /** Tổng số ly (đọc cho badge header). */
  count: number;
  /** Tổng tiền giỏ (VND) = sum(lineTotal). */
  total: number;
  /** Từ chối (không đổi giỏ) khi vượt 20 dòng / 99 ly hoặc hết hàng (OUT_OF_STOCK), hoặc dòng đã giữ hết số còn lại (AT_STOCK_LIMIT); tồn kho thấp hơn số xin thì vẫn cắt xuống tồn kho. */
  addItem: (product: Product, opts?: { size?: Size; toppings?: string[]; quantity?: number }) => AddItemResult;
  updateQty: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  clear: () => void;
}

function summarize(items: CartItem[]): { count: number; total: number } {
  return {
    count: items.reduce((s, i) => s + i.quantity, 0),
    total: items.reduce((s, i) => s + i.lineTotal, 0),
  };
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      count: 0,
      total: 0,

      addItem: (product, opts) => {
        const size = opts?.size ?? DEFAULT_SIZE;
        const toppings = opts?.toppings ?? DEFAULT_TOPPINGS;
        const qty = Math.max(1, Math.floor(opts?.quantity ?? 1));
        const stock = Math.max(0, product.stock);
        if (stock <= 0) return { ok: false, reason: 'OUT_OF_STOCK' };
        // Số xin vượt 99 là từ chối, không âm thầm cắt về 99.
        if (qty > MAX_QTY) return { ok: false, reason: 'MAX_QTY' };

        const state = get();
        const key = buildCartKey(product.id, size, toppings);
        const existing = state.items.find((i) => i.key === key);
        if (!existing && state.items.length >= MAX_LINES) return { ok: false, reason: 'MAX_LINES' };
        if (existing && existing.quantity + qty > MAX_QTY) return { ok: false, reason: 'MAX_QTY' };

        // Không cho vượt tồn kho (backend Task 10 kiểm tra lại).
        const nextQty = Math.min((existing?.quantity ?? 0) + qty, stock);
        // Dòng đã giữ hết số còn lại (stock > 0 nhưng không thêm được gì): AT_STOCK_LIMIT, không phải OUT_OF_STOCK.
        if (existing && nextQty <= existing.quantity) return { ok: false, reason: 'AT_STOCK_LIMIT' };

        let items: CartItem[];
        if (existing) {
          items = state.items.map((i) =>
            i.key === key ? { ...i, quantity: nextQty, lineTotal: calcLineTotal(i.unitPrice, nextQty) } : i,
          );
        } else {
          const unitPrice = calcUnitPrice(product.price, size, toppings);
          items = [
            ...state.items,
            {
              key,
              productId: product.id,
              name: product.name,
              imageUrl: product.imageUrl,
              size,
              toppings: [...toppings].sort(),
              quantity: nextQty,
              unitPrice,
              lineTotal: calcLineTotal(unitPrice, nextQty),
            },
          ];
        }
        set({ items, ...summarize(items) });
        return { ok: true };
      },

      updateQty: (key, quantity) =>
        set((state) => {
          // Số lượng tối thiểu >= 1 (xóa món dùng nút Xóa riêng).
          const qty = Math.min(MAX_QTY, Math.max(1, Math.floor(quantity)));
          const items = state.items.map((i) =>
            i.key === key ? { ...i, quantity: qty, lineTotal: calcLineTotal(i.unitPrice, qty) } : i,
          );
          return { items, ...summarize(items) };
        }),

      removeItem: (key) =>
        set((state) => {
          const items = state.items.filter((i) => i.key !== key);
          return { items, ...summarize(items) };
        }),

      clear: () => set({ items: [], count: 0, total: 0 }),
    }),
    { name: 'brewlite-cart' },
  ),
);

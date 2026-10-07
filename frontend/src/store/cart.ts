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

interface CartState {
  items: CartItem[];
  /** Tổng số ly (đọc cho badge header). */
  count: number;
  /** Tổng tiền giỏ (VND) = sum(lineTotal). */
  total: number;
  addItem: (product: Product, opts?: { size?: Size; toppings?: string[]; quantity?: number }) => void;
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
    (set) => ({
      items: [],
      count: 0,
      total: 0,

      addItem: (product, opts) =>
        set((state) => {
          const size = opts?.size ?? DEFAULT_SIZE;
          const toppings = opts?.toppings ?? DEFAULT_TOPPINGS;
          const qty = Math.max(1, Math.floor(opts?.quantity ?? 1));
          // Không cho vượt tồn kho (backend Task 10 kiểm tra lại).
          const cappedQty = Math.min(qty, Math.max(0, product.stock));
          if (cappedQty <= 0) return state;

          const key = buildCartKey(product.id, size, toppings);
          const unitPrice = calcUnitPrice(product.price, size, toppings);
          const existing = state.items.find((i) => i.key === key);

          let items: CartItem[];
          if (existing) {
            const nextQty = Math.min(existing.quantity + cappedQty, Math.max(0, product.stock));
            items = state.items.map((i) =>
              i.key === key
                ? { ...i, quantity: nextQty, lineTotal: calcLineTotal(i.unitPrice, nextQty) }
                : i,
            );
          } else {
            items = [
              ...state.items,
              {
                key,
                productId: product.id,
                name: product.name,
                imageUrl: product.imageUrl,
                size,
                toppings: [...toppings].sort(),
                quantity: cappedQty,
                unitPrice,
                lineTotal: calcLineTotal(unitPrice, cappedQty),
              },
            ];
          }
          return { items, ...summarize(items) };
        }),

      updateQty: (key, quantity) =>
        set((state) => {
          // Số lượng tối thiểu >= 1 (xóa món dùng nút Xóa riêng).
          const qty = Math.max(1, Math.floor(quantity));
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

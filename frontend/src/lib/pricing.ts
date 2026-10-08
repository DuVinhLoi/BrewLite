// ============================================================
// FEATURE: Pricing — nguồn duy nhất cho mọi tính tiền (VND nguyên).
// unitPrice = base + SIZE_UPCHARGE[size] + sum(TOPPING_PRICES)
// lineTotal = unitPrice * qty; cartTotal = sum(lineTotal)
// Backend tự tính lại giá đơn bằng bản sao ở backend/src/order/pricing.ts — sửa bảng thì sửa cả 2.
// ============================================================

import type { Size } from './types';

export const SIZE_UPCHARGE: Record<Size, number> = {
  S: 0,
  M: 5000,
  L: 10000,
};

/** Giá topping (VND) — key khớp tên hiển thị trên UI. */
export const TOPPING_PRICES: Record<string, number> = {
  'Trân châu': 5000,
  'Kem cheese': 8000,
  'Thạch cà phê': 6000,
};

export const DEFAULT_SIZE: Size = 'M';
export const DEFAULT_TOPPINGS: string[] = [];

export function calcUnitPrice(basePrice: number, size: Size, toppings: string[]): number {
  const sizeFee = SIZE_UPCHARGE[size] ?? 0;
  const toppingFee = toppings.reduce((sum, t) => sum + (TOPPING_PRICES[t] ?? 0), 0);
  return basePrice + sizeFee + toppingFee;
}

export function calcLineTotal(unitPrice: number, quantity: number): number {
  return unitPrice * Math.max(0, Math.floor(quantity));
}

/** Key dòng giỏ: productId|size|toppings(sort). */
export function buildCartKey(productId: string, size: Size, toppings: string[]): string {
  const sorted = [...toppings].sort().join(',');
  return `${productId}|${size}|${sorted}`;
}

/** 35000 -> "35.000đ" — dùng chung mọi chỗ hiện tiền. */
export function formatVND(amount: number): string {
  return `${new Intl.NumberFormat('vi-VN').format(Math.round(amount))}đ`;
}

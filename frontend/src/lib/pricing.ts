// NGUỒN DUY NHẤT cho tính giá frontend (Task 3 + Task 5).
// Backend Task 6/8/10 khi validate POST /orders phải dùng ĐÚNG bảng này,
// nếu không sẽ lệch tổng tiền (sai số) giữa giỏ hàng và đơn hàng.
//
// Công thức:
//   unitPrice = basePrice + SIZE_UPCHARGE[size] + sum(TOPPING_PRICES[t])
//   lineTotal = unitPrice * quantity
//   cartTotal = sum(lineTotal)
// Tất cả là số nguyên VND, không dùng float.

import type { Size } from './types';

export const SIZE_UPCHARGE: Record<Size, number> = {
  S: 0,
  M: 5000,
  L: 10000,
};

/** Giá topping (VND). Key phải khớp tên hiển thị trên UI. */
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

/** Key dòng giỏ: productId|size|topping1,topping2 (sort) — tránh gộp nhầm option khác nhau. */
export function buildCartKey(productId: string, size: Size, toppings: string[]): string {
  const sorted = [...toppings].sort().join(',');
  return `${productId}|${size}|${sorted}`;
}

/** 35000 -> "35.000đ". Dùng cho mọi chỗ hiển thị tiền để thống nhất. */
export function formatVND(amount: number): string {
  return `${new Intl.NumberFormat('vi-VN').format(Math.round(amount))}đ`;
}

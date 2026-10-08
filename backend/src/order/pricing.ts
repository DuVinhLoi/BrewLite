// Bảng giá size/topping phía server — PHẢI khớp frontend/src/lib/pricing.ts.
// unitPrice = product.price + SIZE_UPCHARGE[size] + sum(TOPPING_PRICES); client không gửi giá.
export const SIZES = ['S', 'M', 'L'] as const;
export type Size = (typeof SIZES)[number];

export const SIZE_UPCHARGE: Record<Size, number> = { S: 0, M: 5000, L: 10000 };

export const TOPPING_PRICES: Record<string, number> = {
  'Trân châu': 5000,
  'Kem cheese': 8000,
  'Thạch cà phê': 6000,
};

// Khớp DEFAULT_SIZE frontend + default cột OrderItem.size
export const DEFAULT_SIZE: Size = 'M';

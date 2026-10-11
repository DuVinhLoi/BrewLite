// ============================================================
// FEATURE: Hằng số khuyến mãi / tích điểm (UC05a voucher, UC09 điểm thưởng).
// PHẢI KHỚP backend/src/payment/payment.service.ts (cùng tên, cùng giá trị): lib/promo.test.ts đọc file đó và đối chiếu.
// ============================================================

export const VOUCHER_CODE = 'BREWLITE10';
export const VOUCHER_RATE = 0.1;
export const LOYALTY_RATE = 0.1;
export const VND_PER_POINT = 1000;

/** Số tiền (đ) khách trả để nhận 1 điểm: 1 điểm = VND_PER_POINT / LOYALTY_RATE = 10.000 đ. */
export const VND_FOR_ONE_POINT = VND_PER_POINT / LOYALTY_RATE;

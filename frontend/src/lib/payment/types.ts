// ============================================================
// FEATURE: Payment contracts — dùng chung cho mock + gateway thật,
// khớp CreatePaymentDto backend (orderId, WALLET|CARD).
// ============================================================

export type PaymentMethod = 'WALLET' | 'CARD';

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'WALLET', label: 'Ví điện tử' },
  { value: 'CARD', label: 'Thẻ ngân hàng' },
];

export interface CartLine {
  productId: string;
  quantity: number;
  unitPrice: number;
  size?: string;
  toppings?: string[];
}

export interface PaymentRequest {
  amount: number;
  method: PaymentMethod;
  /** Chống trừ tiền 2 lần khi retry (header Idempotency-Key, Task 8/10). */
  idempotencyKey: string;
  /** Có khi Task 6 xong; mock tự sinh mã đơn demo. */
  orderId?: string;
  /** Dòng giỏ để tạo đơn Task 6 khi chưa có orderId. */
  items?: CartLine[];
  /** Mã giảm giá UC05a, backend validate nội bộ. */
  voucherCode?: string;
}

export interface PaymentResult {
  orderCode: string; // dạng #1042 (wireframe màn 5)
  status: 'PAID';
  amount: number;
  method: PaymentMethod;
  idempotencyKey: string;
}

/** Mỗi lần "Xác nhận trả" sinh 1 key để chống trừ tiền 2 lần. */
export function newIdempotencyKey(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
}

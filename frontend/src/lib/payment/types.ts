// ============================================================
// FEATURE: Payment contracts — dùng chung cho mock + gateway thật,
// khớp CreatePaymentDto backend (orderId, WALLET|CARD).
// ============================================================

export type PaymentMethod = 'WALLET' | 'CARD';

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'WALLET', label: 'Ví điện tử' },
  { value: 'CARD', label: 'Thẻ ngân hàng' },
];

/** Dòng gửi POST /orders (khớp CreateOrderItemDto): không có giá, server tự tính từ product.price + size/topping. */
export interface CartLine {
  productId: string;
  quantity: number;
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
  /** Idempotency-Key của POST /orders (khác `idempotencyKey` của POST /payments): thử lại tạo đơn vẫn chỉ ra 1 đơn. */
  orderIdempotencyKey?: string;
  /** Mã giảm giá (US-10), backend validate nội bộ. */
  voucherCode?: string;
}

export interface PaymentResult {
  orderCode: string; // dạng #1042 (wireframe màn 5)
  /** Mã đơn đầy đủ để biên lai poll GET /orders/:id. Chỉ cổng API có (đơn thật); cổng mock không có nên biên lai không poll. */
  orderId?: string;
  status: 'PAID';
  amount: number;
  method: PaymentMethod;
  idempotencyKey: string;
  /** Số tiền đã giảm nhờ voucher (đ), 0 khi không giảm. */
  discount: number;
  /** Điểm thưởng nhận được từ đơn này, 0 khi chưa đủ một điểm. */
  loyaltyPointsEarned: number;
}

/**
 * Lỗi thanh toán. `orderId`: đơn đã tạo → lần thử lại trả tiếp đơn này (US-08), không tạo đơn mới.
 * `status`: mã HTTP (không có khi mất kết nối); `detail`: message gốc của backend. PaymentForm dùng hai trường này
 * (`dropsCheckout()`) để quyết định giữ hay bỏ đơn đang trả dở.
 */
export class PaymentError extends Error {
  constructor(
    message: string,
    readonly orderId?: string,
    readonly status?: number,
    readonly detail?: string,
  ) {
    super(message);
    this.name = 'PaymentError';
  }
}

/** Sinh 1 Idempotency-Key. PaymentForm giữ 1 key tạo đơn và 1 key trả tiền cho cả phiên màn Thanh toán để thử lại không trừ tiền / tạo đơn 2 lần. */
export function newIdempotencyKey(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
}

// Kiểu dùng chung cho thanh toán — khớp contract backend
// (nhánh feature/task-8-10-payment-order):
//   CreatePaymentDto { orderId, paymentMethod: 'WALLET' | 'CARD', voucherCode?, shouldSimulateFailure? }
//   => { status: 'PAID', orderId, amount, discount, loyaltyPointsEarned, ... }

export type PaymentMethod = 'WALLET' | 'CARD';

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'WALLET', label: 'Ví điện tử' },
  { value: 'CARD', label: 'Thẻ ngân hàng' },
];

export interface PaymentRequest {
  amount: number;
  method: PaymentMethod;
  /** Chống trừ tiền 2 lần khi retry — gửi kèm header Idempotency-Key (Task 8/10). */
  idempotencyKey: string;
  /** Có khi Task 6 (POST /orders) xong; mock hiện tại tự sinh mã đơn demo. */
  orderId?: string;
}

export interface PaymentResult {
  orderCode: string; // dạng #1042 như wireframe PDF Mục 7 (màn 5)
  status: 'PAID';
  amount: number;
  method: PaymentMethod;
  idempotencyKey: string;
}

/** Mỗi lần bấm "Xác nhận trả" sinh 1 key; bấm "Thử lại" cho cùng 1 đơn dùng lại key cũ. */
export function newIdempotencyKey(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
}

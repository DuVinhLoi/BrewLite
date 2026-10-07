import type { PaymentRequest, PaymentResult } from './types';
import { MockPaymentGateway } from './mock-gateway';
import { ApiPaymentGateway } from './api-gateway';

/**
 * Cổng thanh toán — UI (PaymentForm) chỉ phụ thuộc interface này,
 * không phụ thuộc mock hay API thật. Muốn thêm cổng mới (Momo/VNPay/Stripe):
 * tạo class implement PaymentGateway rồi đăng ký trong getPaymentGateway().
 */
export interface PaymentGateway {
  readonly name: string;
  pay(req: PaymentRequest): Promise<PaymentResult>;
}

export type PaymentMode = 'mock' | 'api';

/**
 * ĐIỂM NỐI duy nhất giữa thanh toán đơn giản và thanh toán thật:
 * đổi NEXT_PUBLIC_PAYMENT_MODE=api là cắm backend Task 8, không sửa UI.
 * Mặc định 'mock' để demo Task 3+5 không cần backend.
 */
export function getPaymentGateway(mode?: PaymentMode): PaymentGateway {
  const m = mode ?? (process.env.NEXT_PUBLIC_PAYMENT_MODE as PaymentMode | undefined) ?? 'mock';
  return m === 'api' ? new ApiPaymentGateway() : new MockPaymentGateway();
}

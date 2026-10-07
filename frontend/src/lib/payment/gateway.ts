import type { PaymentRequest, PaymentResult } from './types';
import { MockPaymentGateway } from './mock-gateway';
import { ApiPaymentGateway } from './api-gateway';

// ============================================================
// FEATURE: Payment seam — UI chỉ phụ thuộc interface PaymentGateway.
// Thêm cổng mới (Momo/VNPay/Stripe): implement interface rồi đăng ký dưới đây.
// ============================================================
export interface PaymentGateway {
  readonly name: string;
  pay(req: PaymentRequest): Promise<PaymentResult>;
}

export type PaymentMode = 'mock' | 'api';

// Đổi mock <-> backend thật bằng NEXT_PUBLIC_PAYMENT_MODE (mock|api), không sửa UI.
export function getPaymentGateway(mode?: PaymentMode): PaymentGateway {
  const m = mode ?? (process.env.NEXT_PUBLIC_PAYMENT_MODE as PaymentMode | undefined) ?? 'mock';
  return m === 'api' ? new ApiPaymentGateway() : new MockPaymentGateway();
}

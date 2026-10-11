import { LOYALTY_RATE, VND_PER_POINT } from '../promo';
import type { PaymentGateway } from './gateway';
import type { PaymentRequest, PaymentResult } from './types';

function generateOrderCode(): string {
  return `#${Math.floor(1000 + Math.random() * 9000)}`;
}

// FEATURE: Mock payment gateway — delay ngắn rồi luôn PAID, giữ nguyên amount từ giỏ.
// req.amount đã là số tiền sau giảm nên mock không biết tổng gốc: discount luôn 0. Điểm tính như backend.
export class MockPaymentGateway implements PaymentGateway {
  readonly name = 'mock';

  async pay(req: PaymentRequest): Promise<PaymentResult> {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    return {
      orderCode: req.orderId ? `#${req.orderId.slice(0, 8)}` : generateOrderCode(),
      status: 'PAID',
      amount: req.amount,
      method: req.method,
      idempotencyKey: req.idempotencyKey,
      discount: 0,
      loyaltyPointsEarned: Math.floor((req.amount * LOYALTY_RATE) / VND_PER_POINT),
    };
  }
}

import type { PaymentGateway } from './gateway';
import type { PaymentRequest, PaymentResult } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

// ============================================================
// FEATURE: Real payment gateway (Task 8) — POST /payments, kết quả
// chuẩn hóa về PaymentResult nên UI giữ nguyên. Bật bằng
// NEXT_PUBLIC_PAYMENT_MODE=api.
// ============================================================
export class ApiPaymentGateway implements PaymentGateway {
  readonly name = 'api';

  async pay(req: PaymentRequest): Promise<PaymentResult> {
    if (!req.orderId) {
      throw new Error('Thiếu orderId: cần Task 6 (POST /orders) tạo đơn trước khi gọi POST /payments.');
    }
    const res = await fetch(`${API_BASE}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': req.idempotencyKey,
      },
      body: JSON.stringify({ orderId: req.orderId, paymentMethod: req.method }),
    });
    if (!res.ok) {
      // Lỗi -> UI giữ giỏ (US-05).
      const text = await res.text().catch(() => '');
      throw new Error(text || `Thanh toán thất bại (mã ${res.status}). Giỏ hàng được giữ nguyên.`);
    }
    const json = await res.json();
    return {
      orderCode: `#${String(json.orderId ?? req.orderId).slice(0, 8)}`,
      status: 'PAID',
      amount: Number(json.amount ?? req.amount),
      method: req.method,
      idempotencyKey: req.idempotencyKey,
    };
  }
}

import type { PaymentGateway } from './gateway';
import type { CartLine, PaymentRequest, PaymentResult } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

// FEATURE: Real payment gateway (Task 8) — POST /orders (Task 6) rồi POST /payments,
// kết quả chuẩn hóa về PaymentResult nên UI giữ nguyên. Bật bằng NEXT_PUBLIC_PAYMENT_MODE=api.
export class ApiPaymentGateway implements PaymentGateway {
  readonly name = 'api';

  private async createOrderId(items: CartLine[]): Promise<string> {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('brewlite-token') : null;
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ items }),
      });
    } catch {
      throw new Error('Chưa có POST /orders (Task 6) — để demo, dùng NEXT_PUBLIC_PAYMENT_MODE=mock.');
    }
    if (res.status === 401) throw new Error('Bạn cần đăng nhập trước khi đặt đơn (thiếu JWT).');
    if (!res.ok) throw new Error(`Tạo đơn thất bại (mã ${res.status}). Giỏ hàng được giữ nguyên.`);
    const json = await res.json();
    if (!json?.id) throw new Error('Tạo đơn thất bại: backend không trả mã đơn.');
    return String(json.id);
  }

  async pay(req: PaymentRequest): Promise<PaymentResult> {
    const orderId = req.orderId ?? (req.items?.length ? await this.createOrderId(req.items) : undefined);
    if (!orderId) {
      throw new Error('Thiếu orderId: cần Task 6 (POST /orders) tạo đơn trước khi gọi POST /payments.');
    }
    const res = await fetch(`${API_BASE}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': req.idempotencyKey,
      },
      body: JSON.stringify({ orderId, paymentMethod: req.method, ...(req.voucherCode ? { voucherCode: req.voucherCode } : {}) }),
    });
    if (!res.ok) {
      // Lỗi -> UI giữ giỏ (US-05).
      const text = await res.text().catch(() => '');
      throw new Error(text || `Thanh toán thất bại (mã ${res.status}). Giỏ hàng được giữ nguyên.`);
    }
    const json = await res.json();
    return {
      orderCode: `#${String(json.orderId ?? orderId).slice(0, 8)}`,
      status: 'PAID',
      amount: Number(json.amount ?? req.amount),
      method: req.method,
      idempotencyKey: req.idempotencyKey,
    };
  }
}

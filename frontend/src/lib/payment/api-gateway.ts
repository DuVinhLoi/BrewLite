import { getToken } from '../auth';
import type { PaymentGateway } from './gateway';
import { PaymentError } from './types';
import type { CartLine, PaymentRequest, PaymentResult } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

// Body lỗi của NestJS: { statusCode, message: string | string[], error }; body không phải JSON (proxy trả HTML…) thì bỏ qua.
async function readMessage(res: Response): Promise<string> {
  const message = (await res.json().catch(() => null))?.message;
  return Array.isArray(message) ? message.join(', ') : typeof message === 'string' ? message : '';
}

// 400 = cổng trừ tiền lỗi; 409 = kẹt kho sau khi đã trừ (backend hoàn tiền); mã khác kèm mã + thông điệp backend.
function paymentErrorMessage(status: number, detail: string): string {
  const kept = 'Giỏ hàng được giữ nguyên.';
  if (status === 409) return `Món đã hết hàng, tiền đã được hoàn lại. ${kept}`;
  if (status === 400) {
    const extra = detail && detail !== 'Payment failed' ? ` (${detail})` : '';
    return `Thanh toán thất bại${extra}. ${kept} Bạn có thể thử lại.`;
  }
  return `Thanh toán thất bại (mã ${status}${detail ? `: ${detail}` : ''}). ${kept}`;
}

// FEATURE: Real payment gateway (Task 8) — POST /orders (Task 6) rồi POST /payments,
// kết quả chuẩn hóa về PaymentResult nên UI giữ nguyên. Bật bằng NEXT_PUBLIC_PAYMENT_MODE=api.
export class ApiPaymentGateway implements PaymentGateway {
  readonly name = 'api';

  private async createOrderId(items: CartLine[], idempotencyKey?: string): Promise<string> {
    const token = getToken();
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        // Chỉ gửi các trường DTO nhận; giá do server tính (giỏ có thêm key/name/unitPrice/lineTotal thì bỏ)
        body: JSON.stringify({
          items: items.map(({ productId, quantity, size, toppings }) => ({ productId, quantity, size, toppings })),
        }),
      });
    } catch {
      throw new PaymentError('Không kết nối được máy chủ để tạo đơn (POST /orders). Giỏ hàng được giữ nguyên.');
    }
    if (res.status === 401) throw new PaymentError('Bạn cần đăng nhập trước khi đặt đơn (thiếu JWT).', undefined, 401);
    if (!res.ok) throw new PaymentError(`Tạo đơn thất bại (mã ${res.status}). Giỏ hàng được giữ nguyên.`, undefined, res.status, await readMessage(res));
    const json = await res.json();
    if (!json?.id) throw new PaymentError('Tạo đơn thất bại: backend không trả mã đơn.');
    return String(json.id);
  }

  async pay(req: PaymentRequest): Promise<PaymentResult> {
    const orderId = req.orderId ?? (req.items?.length ? await this.createOrderId(req.items, req.orderIdempotencyKey) : undefined);
    if (!orderId) {
      throw new Error('Thiếu orderId: cần Task 6 (POST /orders) tạo đơn trước khi gọi POST /payments.');
    }
    // Từ đây đơn đã tồn tại: mọi lỗi mang orderId để UI thử lại đúng đơn này (US-08)
    const token = getToken();
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': req.idempotencyKey,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ orderId, paymentMethod: req.method, ...(req.voucherCode ? { voucherCode: req.voucherCode } : {}) }),
      });
    } catch {
      throw new PaymentError('Không kết nối được máy chủ thanh toán. Giỏ hàng được giữ nguyên.', orderId);
    }
    if (res.status === 401) throw new PaymentError('Bạn cần đăng nhập trước khi thanh toán (thiếu hoặc hết hạn JWT). Giỏ hàng được giữ nguyên.', orderId, 401);
    if (res.status === 403) throw new PaymentError('Bạn không có quyền thanh toán đơn này (đơn thuộc tài khoản khác). Giỏ hàng được giữ nguyên.', orderId, 403);
    if (!res.ok) {
      // Lỗi -> UI giữ giỏ (US-05). Backend trả JSON { message, ... }: chỉ lấy message, không đẩy JSON thô lên UI.
      const detail = await readMessage(res);
      throw new PaymentError(paymentErrorMessage(res.status, detail), orderId, res.status, detail);
    }
    const json = await res.json();
    const paidOrderId = String(json.orderId ?? orderId);
    return {
      orderCode: `#${paidOrderId.slice(0, 8)}`,
      orderId: paidOrderId,
      status: 'PAID',
      amount: Number(json.amount ?? req.amount),
      method: req.method,
      idempotencyKey: req.idempotencyKey,
      discount: Number(json.discount ?? 0),
      loyaltyPointsEarned: Number(json.loyaltyPointsEarned ?? 0),
    };
  }
}

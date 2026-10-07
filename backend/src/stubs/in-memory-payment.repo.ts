import { Injectable } from '@nestjs/common';
import { IPaymentRepository, PaymentDto } from '../contracts/payment.contract';

@Injectable()
export class InMemoryPaymentRepo implements IPaymentRepository {
  private byKey = new Map<string, PaymentDto>();

  async findByIdempotencyKey(key: string): Promise<PaymentDto | null> {
    return this.byKey.get(key) ?? null;
  }

  async findByOrderId(orderId: string): Promise<PaymentDto | null> {
    for (const p of this.byKey.values()) if (p.orderId === orderId) return p;
    return null;
  }

  async save(payment: PaymentDto): Promise<PaymentDto> {
    this.byKey.set(payment.idempotencyKey, payment);
    return payment;
  }
}

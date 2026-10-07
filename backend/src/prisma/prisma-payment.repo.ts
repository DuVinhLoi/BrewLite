import { Injectable } from '@nestjs/common';
import { IPaymentRepository, PaymentDto } from '../contracts/payment.contract';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaPaymentRepo implements IPaymentRepository {
  constructor(private db: PrismaService) {}

  async findByIdempotencyKey(key: string): Promise<PaymentDto | null> {
    const p = await this.db.payment.findUnique({ where: { idempotencyKey: key } });
    return p && this.toDto(p);
  }

  async findByOrderId(orderId: string): Promise<PaymentDto | null> {
    const p = await this.db.payment.findFirst({ where: { orderId }, orderBy: { createdAt: 'desc' } });
    return p && this.toDto(p);
  }

  async save(payment: PaymentDto): Promise<PaymentDto> {
    const p = await this.db.payment.create({
      data: {
        id: payment.id,
        orderId: payment.orderId,
        idempotencyKey: payment.idempotencyKey,
        amount: payment.amount,
        method: payment.method,
        status: payment.status,
        discount: payment.discount,
        loyaltyPointsEarned: payment.loyaltyPointsEarned,
      },
    });
    return this.toDto(p)!;
  }

  private toDto(p: {
    id: string; orderId: string; idempotencyKey: string; amount: number;
    method: string; status: string; discount: number; loyaltyPointsEarned: number; createdAt: Date;
  }): PaymentDto | null {
    if (!p) return null;
    return {
      id: p.id, orderId: p.orderId, idempotencyKey: p.idempotencyKey, amount: p.amount,
      method: p.method as PaymentDto['method'], status: p.status as PaymentDto['status'],
      discount: p.discount, loyaltyPointsEarned: p.loyaltyPointsEarned, createdAt: p.createdAt,
    };
  }
}

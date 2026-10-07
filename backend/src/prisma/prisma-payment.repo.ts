import { Injectable } from '@nestjs/common';
import type { Payment as PaymentRow } from '@prisma/client';
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

  // UC06 KB3: hoàn đúng số tiền thực thu = cộng mọi biên lai SUCCESS của đơn
  async findAllByOrderId(orderId: string): Promise<PaymentDto[]> {
    const rows = await this.db.payment.findMany({ where: { orderId }, orderBy: { createdAt: 'asc' } });
    return rows.map((p) => this.toDto(p));
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
    return this.toDto(p);
  }

  private toDto(p: PaymentRow): PaymentDto {
    return {
      id: p.id, orderId: p.orderId, idempotencyKey: p.idempotencyKey, amount: p.amount,
      method: p.method as PaymentDto['method'], status: p.status as PaymentDto['status'],
      discount: p.discount, loyaltyPointsEarned: p.loyaltyPointsEarned, createdAt: p.createdAt,
    };
  }
}

import { Injectable } from '@nestjs/common';
import type { Payment as PaymentRow } from '@prisma/client';
import { IPaymentRepository, PaymentDto } from '../contracts/payment.contract';
import { TxContext } from '../contracts/transaction.contract';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaPaymentRepo implements IPaymentRepository {
  constructor(private db: PrismaService) {}

  private cx(tx?: TxContext): PrismaService {
    return (tx as PrismaService) ?? this.db;
  }

  async findByIdempotencyKey(key: string, tx?: TxContext): Promise<PaymentDto | null> {
    const p = await this.cx(tx).payment.findUnique({ where: { idempotencyKey: key } });
    return p && this.toDto(p);
  }

  // UC06 KB3: hoàn đúng số tiền thực thu = cộng mọi biên lai SUCCESS của đơn
  async findAllByOrderId(orderId: string, tx?: TxContext): Promise<PaymentDto[]> {
    const rows = await this.cx(tx).payment.findMany({ where: { orderId }, orderBy: { createdAt: 'asc' } });
    return rows.map((p) => this.toDto(p));
  }

  async save(payment: PaymentDto, tx?: TxContext): Promise<PaymentDto> {
    const p = await this.cx(tx).payment.create({
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

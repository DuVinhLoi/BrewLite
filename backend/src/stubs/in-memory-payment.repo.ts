import { Injectable } from '@nestjs/common';
import { IPaymentRepository, PaymentDto } from '../contracts/payment.contract';
import { TxContext } from '../contracts/transaction.contract';
import { registerInMemoryRepo, snapshotMap } from './in-memory-tx';

// Lưu và trả bản sao (như Prisma trả hàng mới mỗi lần đọc)
@Injectable()
export class InMemoryPaymentRepo implements IPaymentRepository {
  private byKey = new Map<string, PaymentDto>();

  constructor() {
    registerInMemoryRepo({
      snap: () => snapshotMap(this.byKey),
      restore: (s) => {
        this.byKey.clear();
        for (const [k, v] of s) this.byKey.set(k as string, v as PaymentDto);
      },
    });
  }

  async findByIdempotencyKey(key: string, _tx?: TxContext): Promise<PaymentDto | null> {
    const p = this.byKey.get(key);
    return p ? structuredClone(p) : null;
  }

  async findAllByOrderId(orderId: string, _tx?: TxContext): Promise<PaymentDto[]> {
    return [...this.byKey.values()].filter((p) => p.orderId === orderId).map((p) => structuredClone(p));
  }

  async save(payment: PaymentDto, _tx?: TxContext): Promise<PaymentDto> {
    this.byKey.set(payment.idempotencyKey, structuredClone(payment));
    return structuredClone(payment);
  }
}

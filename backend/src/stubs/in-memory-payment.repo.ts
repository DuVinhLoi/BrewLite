import { Injectable } from '@nestjs/common';
import { IPaymentRepository, PaymentDto } from '../contracts/payment.contract';
import { TxContext } from '../contracts/transaction.contract';
import { registerInMemoryRepo, runInMemoryTransaction, snapshotMap } from './in-memory-tx';

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
    return this.byKey.get(key) ?? null;
  }

  async findByOrderId(orderId: string, _tx?: TxContext): Promise<PaymentDto | null> {
    for (const p of this.byKey.values()) if (p.orderId === orderId) return p;
    return null;
  }

  async findAllByOrderId(orderId: string, _tx?: TxContext): Promise<PaymentDto[]> {
    return [...this.byKey.values()].filter((p) => p.orderId === orderId);
  }

  async save(payment: PaymentDto, _tx?: TxContext): Promise<PaymentDto> {
    this.byKey.set(payment.idempotencyKey, payment);
    return payment;
  }

  runInTransaction<T>(fn: (tx: TxContext) => Promise<T>): Promise<T> {
    return runInMemoryTransaction(() => fn(undefined));
  }
}

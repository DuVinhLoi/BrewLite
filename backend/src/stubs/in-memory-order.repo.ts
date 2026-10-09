import { Injectable } from '@nestjs/common';
import { IOrderRepository, OrderDto, OrderStatus } from '../contracts/order.contract';
import { TxContext } from '../contracts/transaction.contract';
import { registerInMemoryRepo, runInMemoryTransaction, snapshotMap } from './in-memory-tx';

@Injectable()
export class InMemoryOrderRepo implements IOrderRepository {
  private store = new Map<string, OrderDto>();

  constructor() {
    registerInMemoryRepo({
      snap: () => snapshotMap(this.store),
      restore: (s) => {
        this.store.clear();
        for (const [k, v] of s) this.store.set(k as string, v as OrderDto);
      },
    });
  }

  async findById(id: string, _tx?: TxContext): Promise<OrderDto | null> {
    return this.store.get(id) ?? null;
  }

  async findByIdempotencyKey(key: string, _tx?: TxContext): Promise<OrderDto | null> {
    return [...this.store.values()].find((o) => o.idempotencyKey === key) ?? null;
  }

  async findByUserId(userId: string, _tx?: TxContext): Promise<OrderDto[]> {
    return [...this.store.values()]
      .filter((o) => o.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async findByStatuses(statuses: OrderStatus[], _tx?: TxContext): Promise<OrderDto[]> {
    return [...this.store.values()]
      .filter((o) => statuses.includes(o.status))
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async updateStatus(id: string, status: OrderStatus, _tx?: TxContext): Promise<OrderDto> {
    const o = this.store.get(id);
    if (!o) throw new Error('Order not found');
    o.status = status;
    return o;
  }

  async save(order: OrderDto, _tx?: TxContext): Promise<OrderDto> {
    // giả lập chỉ số unique của Postgres
    if (order.idempotencyKey && [...this.store.values()].some((o) => o.idempotencyKey === order.idempotencyKey && o.id !== order.id)) {
      throw new Error('Unique constraint failed on idempotencyKey');
    }
    this.store.set(order.id, order);
    return order;
  }

  runInTransaction<T>(fn: (tx: TxContext) => Promise<T>): Promise<T> {
    return runInMemoryTransaction(() => fn(undefined));
  }
}

import { Injectable } from '@nestjs/common';
import { IOrderRepository, OrderDto, OrderStatus } from '../contracts/order.contract';

@Injectable()
export class InMemoryOrderRepo implements IOrderRepository {
  private store = new Map<string, OrderDto>();

  async findById(id: string): Promise<OrderDto | null> {
    return this.store.get(id) ?? null;
  }

  async updateStatus(id: string, status: OrderStatus): Promise<OrderDto> {
    const o = this.store.get(id);
    if (!o) throw new Error('Order not found');
    o.status = status;
    return o;
  }

  async save(order: OrderDto): Promise<OrderDto> {
    this.store.set(order.id, order);
    return order;
  }
}

import { BadRequestException } from '@nestjs/common';
import { OrderStatus } from '../contracts/order.contract';

const ALLOWED: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.PAID, OrderStatus.PAYMENT_FAILED, OrderStatus.CANCELLED],
  [OrderStatus.PAID]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  [OrderStatus.PREPARING]: [OrderStatus.READY],
  [OrderStatus.READY]: [OrderStatus.COMPLETED],
  [OrderStatus.COMPLETED]: [],
  [OrderStatus.PAYMENT_FAILED]: [OrderStatus.PENDING, OrderStatus.CANCELLED],
  [OrderStatus.CANCELLED]: [],
};

export function assertTransition(from: OrderStatus, to: OrderStatus): void {
  if (!ALLOWED[from]?.includes(to)) {
    throw new BadRequestException(`Invalid transition ${from} -> ${to}`);
  }
}

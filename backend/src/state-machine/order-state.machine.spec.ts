import { assertTransition } from './order-state.machine';
import { OrderStatus } from '../contracts/order.contract';

describe('Order State Machine (a)', () => {
  test.each([
    [OrderStatus.PENDING, OrderStatus.PAID],
    [OrderStatus.PENDING, OrderStatus.PAYMENT_FAILED],
    [OrderStatus.PAYMENT_FAILED, OrderStatus.PENDING],
    [OrderStatus.PENDING, OrderStatus.CANCELLED],
    [OrderStatus.PAID, OrderStatus.CANCELLED],
    [OrderStatus.PAYMENT_FAILED, OrderStatus.CANCELLED],
    [OrderStatus.PAID, OrderStatus.PREPARING],
    [OrderStatus.PREPARING, OrderStatus.READY],
    [OrderStatus.READY, OrderStatus.COMPLETED],
  ])('allows %s -> %s', (from, to) => {
    expect(() => assertTransition(from, to)).not.toThrow();
  });

  test.each([
    [OrderStatus.PREPARING, OrderStatus.CANCELLED],
    [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
    [OrderStatus.PENDING, OrderStatus.COMPLETED],
    [OrderStatus.COMPLETED, OrderStatus.PENDING],
    [OrderStatus.PAID, OrderStatus.PENDING],
  ])('blocks %s -> %s', (from, to) => {
    expect(() => assertTransition(from, to)).toThrow();
  });
});

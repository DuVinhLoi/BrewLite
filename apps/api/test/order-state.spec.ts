import { OrderStatus } from '@prisma/client';
import { canTransition } from '../src/checkout/order-state';
it('UNIT-S2-06: accepts exactly 8 of all 49 state pairs', () => {
  const valid = new Set(['PENDING:PAID', 'PENDING:PAYMENT_FAILED', 'PENDING:CANCELLED', 'PAYMENT_FAILED:PENDING', 'PAYMENT_FAILED:CANCELLED', 'PAID:PREPARING', 'PREPARING:READY', 'READY:COMPLETED']);
  for (const from of Object.values(OrderStatus)) for (const to of Object.values(OrderStatus)) {
    expect(canTransition(from, to)).toBe(valid.has(`${from}:${to}`));
  }
});
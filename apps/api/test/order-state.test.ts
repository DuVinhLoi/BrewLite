// UNIT-T04: all 49 pairs, using the eight approved SRS BR-08 transitions.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { OrderStatus } from '@prisma/client';
import { canTransition } from '../src/checkout/order-state';

const allowed = new Set([
  'PENDING->PAID',
  'PENDING->PAYMENT_FAILED',
  'PENDING->CANCELLED',
  'PAYMENT_FAILED->PENDING',
  'PAYMENT_FAILED->CANCELLED',
  'PAID->PREPARING',
  'PREPARING->READY',
  'READY->COMPLETED',
]);

describe('UNIT-T04 order state', () => {
  for (const from of Object.values(OrderStatus)) {
    for (const to of Object.values(OrderStatus)) {
      const expected = allowed.has(`${from}->${to}`);
      it(`${expected ? 'allows' : 'rejects'} ${from} -> ${to}`, () => {
        assert.equal(canTransition(from, to), expected);
      });
    }
  }
});

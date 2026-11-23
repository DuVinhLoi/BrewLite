import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import type { OrderStatus } from '@prisma/client';
import { CheckoutService } from '../src/checkout/checkout.service';
import type { PrismaService } from '../src/prisma/prisma.service';
import type { InventoryService } from '../src/inventory/inventory.service';
import type { VnpayGateway } from '../src/payment/payment-gateway';

function service(status: OrderStatus | null) {
  const tx = {
    $queryRaw: async () => [],
    order: {
      findUnique: async () => status && ({ id: 'order-test', userId: 'customer-test', status, items: [], inventoryTracked: true }),
      update: async () => { assert.fail('Rejected cancellation must not update an order'); },
    },
  };
  const prisma = { $transaction: (run: (client: typeof tx) => Promise<unknown>) => run(tx) } as unknown as PrismaService;
  const inventory = { settle: async () => { assert.fail('Rejected cancellation must not settle inventory'); } } as unknown as InventoryService;
  return new CheckoutService(prisma, inventory, {} as VnpayGateway);
}

describe('AC-F24.3 Barista cancellation permissions', () => {
  const barista = { sub: 'barista-test', role: 'BARISTA' as const };
  for (const status of ['PENDING', 'PAYMENT_FAILED'] as const) {
    it(`rejects Barista cancellation of ${status} with 403`, async () => {
      await assert.rejects(service(status).transition(barista, 'order-test', { status: 'CANCELLED' }), ForbiddenException);
    });
  }
  for (const status of ['PAID', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'] as const) {
    it(`keeps invalid Barista cancellation of ${status} as 409`, async () => {
      await assert.rejects(service(status).transition(barista, 'order-test', { status: 'CANCELLED' }), ConflictException);
    });
  }
  it('keeps an unknown order as 404', async () => {
    await assert.rejects(service(null).transition(barista, 'missing', { status: 'CANCELLED' }), NotFoundException);
  });
});

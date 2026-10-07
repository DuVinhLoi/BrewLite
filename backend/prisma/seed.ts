import { PrismaClient } from '@prisma/client';
import { OrderStatus } from '../src/contracts/order.contract';

// Seed tối thiểu cho demo Task 8: user + Latte 35k + đơn order-1042 PENDING
async function main() {
  const db = new PrismaClient();
  await db.user.upsert({
    where: { id: 'u1' },
    create: { id: 'u1', email: 'demo@brewlite.vn', passwordHash: '', loyaltyPoints: 0 },
    update: {},
  });
  await db.product.upsert({
    where: { id: 'p1' },
    create: { id: 'p1', name: 'Latte', price: 35000, stock: 10, version: 1 },
    update: { price: 35000, stock: 10, version: 1 },
  });
  await db.orderItem.deleteMany({ where: { orderId: 'order-1042' } });
  await db.payment.deleteMany({ where: { orderId: 'order-1042' } });
  await db.order.deleteMany({ where: { id: 'order-1042' } });
  await db.order.create({
    data: {
      id: 'order-1042',
      userId: 'u1',
      status: OrderStatus.PENDING,
      total: 35000,
      items: { create: [{ productId: 'p1', size: 'M', qty: 1, lineTotal: 35000 }] },
    },
  });
  await db.$disconnect();
  console.log('seeded: u1, p1 (stock 10), order-1042 PENDING 35000');
}

main();

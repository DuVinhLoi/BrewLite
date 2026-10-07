import { PaymentService } from '../src/payment/payment.service';
import { MockPaymentGatewayService } from '../src/payment/mock-payment-gateway.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { PrismaOrderRepo } from '../src/prisma/prisma-order.repo';
import { PrismaProductRepo } from '../src/prisma/prisma-product.repo';
import { PrismaPaymentRepo } from '../src/prisma/prisma-payment.repo';
import { PrismaUserRepo } from '../src/prisma/prisma-user.repo';
import { OrderStatus } from '../src/contracts/order.contract';

// Chạy với Postgres thật: DATABASE_URL=postgresql://brewlite:brewlite@localhost:5432/brewlite
// Không có DATABASE_URL thì skip (test InMemory đã cover).
const pg = process.env.DATABASE_URL ? describe : describe.skip;

pg('Task 8+10 on Postgres', () => {
  let db: PrismaService;
  let svc: PaymentService;

  beforeAll(async () => {
    db = new PrismaService();
    await db.$connect();
    svc = new PaymentService(
      new PrismaOrderRepo(db),
      new PrismaProductRepo(db),
      new PrismaPaymentRepo(db),
      new PrismaUserRepo(db),
      new MockPaymentGatewayService(),
    );
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  test('(b) idempotent + (c) concurrent stock=3', async () => {
    const orders = new PrismaOrderRepo(db);
    const products = new PrismaProductRepo(db);
    const users = new PrismaUserRepo(db);
    await users.save({ id: 'u-pg', email: 'pg@test.vn', loyaltyPoints: 0 });
    await products.save({ id: 'p-pg', name: 'Latte', price: 10000, stock: 3, version: 1 });
    for (let i = 0; i < 10; i++) {
      await db.order.deleteMany({ where: { id: `opg${i}` } });
      await orders.save({ id: `opg${i}`, userId: 'u-pg', status: OrderStatus.PENDING, total: 10000, items: [{ productId: 'p-pg', quantity: 1, unitPrice: 10000 }], createdAt: new Date() });
    }
    const r1 = await svc.processPayment({ orderId: 'opg0', paymentMethod: 'WALLET' }, 'PG-KEY-1');
    const r2 = await svc.processPayment({ orderId: 'opg0', paymentMethod: 'WALLET' }, 'PG-KEY-1');
    expect(r2.isCached).toBe(true);
    expect(r2.discount).toBe(r1.discount);
    const results = await Promise.allSettled(
      Array.from({ length: 9 }, (_, i) => svc.processPayment({ orderId: `opg${i + 1}`, paymentMethod: 'WALLET' }, `PG-K-${i}`)),
    );
    const ok = results.filter((r) => r.status === 'fulfilled').length;
    expect(ok).toBe(2); // opg0 đã lấy 1 suất trong tổng kho 3
    expect((await products.findById('p-pg'))!.stock).toBe(0);
  });
});

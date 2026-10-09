import { OrderService } from '../src/order/order.service';
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

  // Đơn của test này; Payment/OrderItem trỏ FK tới Order nên phải xóa con trước cha (Payment → OrderItem → Order)
  const orderIds = Array.from({ length: 10 }, (_, i) => `opg${i}`);
  const cleanOrders = async () => {
    await db.payment.deleteMany({ where: { orderId: { in: orderIds } } });
    await db.orderItem.deleteMany({ where: { orderId: { in: orderIds } } });
    await db.order.deleteMany({ where: { id: { in: orderIds } } });
  };

  // Chạy lại được: dọn dữ liệu lần trước (kể cả lần chạy chết giữa chừng) trước khi seed, và dọn lại sau khi xong
  beforeAll(cleanOrders);

  afterAll(async () => {
    await cleanOrders();
    // món/user của test không được nằm lại trong DB demo (GET /products liệt kê mọi món còn kho)
    await db.product.deleteMany({ where: { id: 'p-pg' } });
    await db.user.deleteMany({ where: { id: 'u-pg' } });
    await db.$disconnect();
  });

  test('(b) idempotent + (c) concurrent stock=3', async () => {
    const orders = new PrismaOrderRepo(db);
    const products = new PrismaProductRepo(db);
    const users = new PrismaUserRepo(db);
    // Hậu tố ngẫu nhiên mỗi lần chạy: Idempotency-Key là @unique, biên lai cũ (nếu còn) không bao giờ trúng cache nhầm
    const run = crypto.randomUUID().slice(0, 8);
    await users.save({ id: 'u-pg', email: 'pg@test.vn', loyaltyPoints: 0 }); // có sẵn thì upsert, đặt lại điểm về 0
    await products.save({ id: 'p-pg', name: 'Latte', price: 10000, stock: 3, version: 1 }); // upsert đặt lại stock/version
    for (const id of orderIds) {
      await orders.save({ id, userId: 'u-pg', status: OrderStatus.PENDING, total: 10000, items: [{ productId: 'p-pg', quantity: 1, unitPrice: 10000 }], createdAt: new Date() });
    }
    const r1 = await svc.processPayment('u-pg', { orderId: 'opg0', paymentMethod: 'WALLET' }, `PG-KEY-1-${run}`);
    const r2 = await svc.processPayment('u-pg', { orderId: 'opg0', paymentMethod: 'WALLET' }, `PG-KEY-1-${run}`);
    expect(r1.isCached).toBe(false);
    expect(r2.isCached).toBe(true);
    expect(r2.discount).toBe(r1.discount);
    const results = await Promise.allSettled(
      Array.from({ length: 9 }, (_, i) => svc.processPayment('u-pg', { orderId: `opg${i + 1}`, paymentMethod: 'WALLET' }, `PG-K-${i}-${run}`)),
    );
    const ok = results.filter((r) => r.status === 'fulfilled').length;
    expect(ok).toBe(2); // opg0 đã lấy 1 suất trong tổng kho 3
    expect((await products.findById('p-pg'))!.stock).toBe(0);
  });

  // Đề §9 tiêu chí (b) cho POST /orders: bên thua cuộc đua vi phạm chỉ số unique Order.idempotencyKey rồi đọc lại đơn của bên thắng
  test('POST /orders: 2 request song song cùng Idempotency-Key chỉ tạo 1 đơn', async () => {
    const products = new PrismaProductRepo(db);
    await new PrismaUserRepo(db).save({ id: 'u-pg', email: 'pg@test.vn', loyaltyPoints: 0 });
    await products.save({ id: 'p-pg', name: 'Latte', price: 10000, stock: 3, version: 1 });
    const orderSvc = new OrderService(new PrismaOrderRepo(db), products);
    const key = `PG-ORD-${crypto.randomUUID().slice(0, 8)}`;
    try {
      const dto = { items: [{ productId: 'p-pg', quantity: 1 }] };
      const [a, b] = await Promise.all([orderSvc.create('u-pg', dto, key), orderSvc.create('u-pg', dto, key)]);
      expect(b.id).toBe(a.id);
      expect([a.isCached, b.isCached].sort()).toEqual([false, true]);
      expect(await db.order.count({ where: { idempotencyKey: key } })).toBe(1);
    } finally {
      await db.orderItem.deleteMany({ where: { order: { idempotencyKey: key } } });
      await db.order.deleteMany({ where: { idempotencyKey: key } });
    }
  });
});

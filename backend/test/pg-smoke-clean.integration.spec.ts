import { PrismaService } from '../src/prisma/prisma.service';
import { cleanSmokeData } from '../prisma/clean-smoke';

// Chạy với Postgres thật: DATABASE_URL=postgresql://brewlite:brewlite@localhost:5432/brewlite. Không có thì skip.
const pg = process.env.DATABASE_URL ? describe : describe.skip;

pg('smoke:clean trên Postgres', () => {
  let db: PrismaService;
  const run = crypto.randomUUID().slice(0, 8);
  const smokeId = `u-smoke-${run}`;
  const keepId = `u-keep-${run}`;
  const productId = `p-smoke-${run}`;
  const orderIds = [`o-smoke-paid-${run}`, `o-smoke-cancel-${run}`, `o-keep-${run}`];

  beforeAll(async () => {
    db = new PrismaService();
    await db.$connect();
    await db.product.create({ data: { id: productId, name: 'Smoke', price: 10000, stock: 3, version: 1 } }); // 5 - 2 đã bán cho đơn smoke PAID
    await db.user.create({ data: { id: smokeId, email: `smoke-${run}@smoke.test`, passwordHash: 'x', loyaltyPoints: 2 } });
    await db.user.create({ data: { id: keepId, email: `keep-${run}@example.com`, passwordHash: 'x' } });
    const order = (id: string, userId: string, status: string, qty: number) =>
      db.order.create({ data: { id, userId, status, total: 10000 * qty, items: { create: [{ productId, size: 'S', qty, lineTotal: 10000 * qty }] } } });
    await order(orderIds[0], smokeId, 'PAID', 2);
    await order(orderIds[1], smokeId, 'CANCELLED', 1);
    await order(orderIds[2], keepId, 'PAID', 1);
    await db.payment.create({ data: { orderId: orderIds[0], idempotencyKey: `smoke-pay-${run}`, amount: 20000, method: 'WALLET' } });
  });

  afterAll(async () => {
    await db.payment.deleteMany({ where: { orderId: { in: orderIds } } });
    await db.orderItem.deleteMany({ where: { orderId: { in: orderIds } } });
    await db.order.deleteMany({ where: { id: { in: orderIds } } });
    await db.user.deleteMany({ where: { id: { in: [smokeId, keepId] } } });
    await db.product.deleteMany({ where: { id: productId } });
    await db.$disconnect();
  });

  test('xóa tài khoản @smoke.test cùng đơn và biên lai, hoàn kho đơn đã trừ kho, giữ dữ liệu người khác', async () => {
    const r = await cleanSmokeData(db);
    expect(r.users).toBeGreaterThanOrEqual(1);
    expect(await db.user.findUnique({ where: { id: smokeId } })).toBeNull();
    expect(await db.order.count({ where: { id: { in: orderIds.slice(0, 2) } } })).toBe(0);
    expect(await db.payment.count({ where: { idempotencyKey: `smoke-pay-${run}` } })).toBe(0);
    expect(await db.order.findUnique({ where: { id: orderIds[2] } })).not.toBeNull();
    const p = await db.product.findUnique({ where: { id: productId } });
    expect(p!.stock).toBe(5); // 3 + 2 của đơn smoke PAID; đơn CANCELLED đã hoàn kho lúc hủy nên không cộng
    expect(p!.version).toBe(2); // mọi lần đổi tồn kho đều tăng version
  });
});

import { createHmac, randomUUID } from 'node:crypto';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuthService } from '../src/auth/auth.service';

// Refuse any database except an explicitly named, separate test database.
const url = process.env.TEST_DATABASE_URL;
if (!url || !/^brewlite_test(?:_[a-z0-9]+)?$/.test(new URL(url).pathname.slice(1))) throw new Error('TEST_DATABASE_URL must point to a separate brewlite_test database');
process.env.DATABASE_URL = url;
process.env.JWT_SECRET = 'integration-only-secret-at-least-32-characters';

describe('INT-S2: real PostgreSQL checkout', () => {
  let app: INestApplication; let db: PrismaService; let token: string; let other: string; let barista: string;
  const suffix = randomUUID(); const productId = `test-${suffix}`; const userIds: string[] = [];
  const items = [{ productId, quantity: 2, size: 'L', toppings: ['Trân châu'] }];
  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication(); configureApp(app); await app.init(); db = module.get(PrismaService);
    const auth = module.get(AuthService);
    for (const role of ['CUSTOMER', 'CUSTOMER', 'BARISTA'] as const) {
      const user = await db.user.create({ data: { email: `${randomUUID()}@test.local`, passwordHash: 'unused', role } });
      userIds.push(user.id);
    }
    token = auth.token({ sub: userIds[0], role: 'CUSTOMER' }); other = auth.token({ sub: userIds[1], role: 'CUSTOMER' }); barista = auth.token({ sub: userIds[2], role: 'BARISTA' });
    await db.product.create({ data: { id: productId, name: 'Test Cappuccino', description: 'Test', price: 45000, imageUrl: '/images/cappuccino.svg', stock: 30 } });
  });
  afterAll(async () => {
    if (db) {
      await db.payment.deleteMany({ where: { userId: { in: userIds } } });
      await db.orderItem.deleteMany({ where: { order: { userId: { in: userIds } } } });
      await db.order.deleteMany({ where: { userId: { in: userIds } } });
      await db.user.deleteMany({ where: { id: { in: userIds } } });
      await db.product.deleteMany({ where: { id: productId } });
    }
    if (app) await app.close();
  });
  const create = () => request(app.getHttpServer()).post('/orders').set('Authorization', `Bearer ${token}`).send({ items });
  const pay = (orderId: string, key: string, card?: string) => request(app.getHttpServer()).post('/payments').set('Authorization', `Bearer ${token}`).set('Idempotency-Key', key).send({ orderId, paymentMethod: card ? 'CARD' : 'WALLET', ...(card ? { cardNumber: card } : {}) });
  it('INT-S2-01: persists server price, reserves stock, and rolls back all earlier lines', async () => {
    const before = (await db.product.findUniqueOrThrow({ where: { id: productId } })).stock;
    const created = await create().expect(201); expect(created.body.total).toBe(124000);
    expect((await db.product.findUniqueOrThrow({ where: { id: productId } })).stock).toBe(before - 2);
    const count = await db.order.count();
    await request(app.getHttpServer()).post('/orders').set('Authorization', `Bearer ${token}`).send({ items: [...items, { ...items[0], productId: 'zz-missing' }] }).expect(404);
    expect(await db.order.count()).toBe(count);
    expect((await db.product.findUniqueOrThrow({ where: { id: productId } })).stock).toBe(before - 2);
  });
  it('INT-S2-02: protects ownership and JWT', async () => {
    const created = await create().expect(201);
    await request(app.getHttpServer()).get(`/orders/${created.body.id}`).set('Authorization', `Bearer ${other}`).expect(403);
    await request(app.getHttpServer()).get('/orders/me').expect(401);
    await request(app.getHttpServer()).post('/orders').set('Authorization', `Bearer ${token}`).send({ items, total: 1 }).expect(400);
    const history = await request(app.getHttpServer()).get('/orders/me').set('Authorization', `Bearer ${other}`).expect(200);
    expect(history.body).toEqual([]);
  });
  it('INT-S2-03: concurrent replay returns one successful payment; key can be reused on another order', async () => {
    const order = (await create().expect(201)).body;
    const key = randomUUID();
    const responses = await Promise.all([pay(order.id, key), pay(order.id, key)]);
    expect(responses.map((r) => r.status).sort()).toEqual([200, 201]);
    expect(responses[0].body).toEqual(responses[1].body);
    expect(await db.payment.count({ where: { orderId: order.id, status: 'SUCCESS' } })).toBe(1);
    const replay = await pay(order.id, key).expect(200);
    expect(replay.body.paymentId).toBe(responses[0].body.paymentId);
    await pay(order.id, randomUUID()).expect(409);
    const second = (await create().expect(201)).body;
    await pay(second.id, key).expect(201);
    expect((await db.order.findUniqueOrThrow({ where: { id: second.id } })).status).toBe('PAID');
  });
  it('INT-S2-08: same key and method with a different card number replays', async () => {
    const order = (await create().expect(201)).body; const key = randomUUID();
    const first = await pay(order.id, key, '4242424242424242').expect(201);
    const replay = await pay(order.id, key, '5555555555554444').expect(200);
    expect(replay.body).toEqual(first.body);
    expect(await db.payment.count({ where: { orderId: order.id, status: 'SUCCESS' } })).toBe(1);
  });
  it('INT-S2-09: same key with a different method after success returns ORDER_NOT_PAYABLE', async () => {
    const order = (await create().expect(201)).body; const key = randomUUID();
    await pay(order.id, key).expect(201);
    const rejected = await pay(order.id, key, '4242424242424242').expect(409);
    expect(rejected.body.error).toBe('ORDER_NOT_PAYABLE');
    expect(await db.payment.count({ where: { orderId: order.id } })).toBe(1);
  });
  it('INT-S2-10: replays historical successful rows with a legacy fingerprint', async () => {
    const order = (await create().expect(201)).body; const key = randomUUID();
    const first = await pay(order.id, key, '4242424242424242').expect(201);
    const legacy = createHmac('sha256', process.env.JWT_SECRET!)
      .update(JSON.stringify([order.id, 'CARD', '4242424242424242'])).digest('hex');
    await db.payment.update({ where: { id: first.body.paymentId }, data: { fingerprint: legacy } });
    const replay = await pay(order.id, key, '5555555555554444').expect(200);
    expect(replay.body).toEqual(first.body);
    expect(await db.payment.count({ where: { orderId: order.id } })).toBe(1);
  });
  it('INT-S2-04: failed payment persists; same key can retry successfully', async () => {
    const order = (await create().expect(201)).body; const key = randomUUID();
    await pay(order.id, key, '4000000000000002').expect(402);
    expect((await db.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe('PAYMENT_FAILED');
    await pay(order.id, key).expect(201);
    expect(await db.payment.count({ where: { orderId: order.id } })).toBe(2);
    expect((await db.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe('PAID');
  });
  it('INT-S2-05: cancellation restores stock once and barista transitions are enforced', async () => {
    const before = (await db.product.findUniqueOrThrow({ where: { id: productId } })).stock;
    const order = (await create().expect(201)).body;
    const patch = (id: string, status: string, identity = token) => request(app.getHttpServer()).patch(`/orders/${id}`).set('Authorization', `Bearer ${identity}`).send({ status });
    await patch(order.id, 'CANCELLED').expect(200); await patch(order.id, 'CANCELLED').expect(409);
    expect((await db.product.findUniqueOrThrow({ where: { id: productId } })).stock).toBe(before);
    const paid = (await create().expect(201)).body; await pay(paid.id, randomUUID()).expect(201);
    await patch(paid.id, 'PREPARING').expect(403);
    await patch(paid.id, 'COMPLETED', barista).expect(409);
    for (const status of ['PREPARING', 'READY', 'COMPLETED']) await patch(paid.id, status, barista).expect(200);
  });
  it('INT-S2-07: failed parallel requests remain retryable', async () => {
    const order = (await create().expect(201)).body; const key = randomUUID();
    const declines = await Promise.all([pay(order.id, key, '4000000000000002'), pay(order.id, key, '4000000000000002')]);
    expect(declines.map((r) => r.status)).toEqual([402, 402]);
    expect(await db.payment.count({ where: { orderId: order.id, status: 'FAILED' } })).toBe(2);
    expect((await db.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe('PAYMENT_FAILED');
    await pay(order.id, key).expect(201);
    expect(await db.payment.count({ where: { orderId: order.id, status: 'SUCCESS' } })).toBe(1);
  }, 20000);
  it('INT-S2-06: concurrent reservations never oversell', async () => {
    await db.product.update({ where: { id: productId }, data: { stock: 3 } });
    const responses = await Promise.all([create(), create()]);
    expect(responses.map((r) => r.status).sort()).toEqual([201, 409]);
    expect((await db.product.findUniqueOrThrow({ where: { id: productId } })).stock).toBe(1);
  });
});
import { ConflictException, ForbiddenException, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import { PaymentController } from '../src/payment/payment.controller';
import { PaymentService } from '../src/payment/payment.service';
import { MockPaymentGatewayService } from '../src/payment/mock-payment-gateway.service';
import { InMemoryOrderRepo } from '../src/stubs/in-memory-order.repo';
import { InMemoryProductRepo } from '../src/stubs/in-memory-product.repo';
import { InMemoryPaymentRepo } from '../src/stubs/in-memory-payment.repo';
import { InMemoryUserRepo } from '../src/stubs/in-memory-user.repo';
import { OrderStatus } from '../src/contracts/order.contract';

function setup(stock = 3) {
  const orders = new InMemoryOrderRepo();
  const products = new InMemoryProductRepo();
  const payments = new InMemoryPaymentRepo();
  const users = new InMemoryUserRepo();
  const gateway = new MockPaymentGatewayService();
  const svc = new PaymentService(orders, products, payments, users, gateway);
  return { orders, products, payments, users, gateway, svc };
}

describe('Task 8+10 integration (b/c)', () => {
  test('(b) same Idempotency-Key charges once', async () => {
    const { orders, products, users, gateway, svc } = setup();
    await products.save({ id: 'p1', name: 'Latte', price: 35000, stock: 10, version: 1 });
    await users.save({ id: 'u1', email: 'a@b.c', loyaltyPoints: 0 });
    await orders.save({ id: 'o1', userId: 'u1', status: OrderStatus.PENDING, total: 35000, items: [{ productId: 'p1', quantity: 1, unitPrice: 35000 }], createdAt: new Date() });

    const dto = { orderId: 'o1', paymentMethod: 'WALLET' as const, voucherCode: 'BREWLITE10' };
    const r1 = await svc.processPayment('u1', dto, 'KEY-1');
    const r2 = await svc.processPayment('u1', dto, 'KEY-1');
    expect(gateway.getCallCount()).toBe(1);
    expect(r2.isCached).toBe(true);
    expect(r1.status).toBe('PAID');
    const u = await users.findById('u1');
    expect(u!.loyaltyPoints).toBe(r1.loyaltyPointsEarned);
  });

  // 10b race: 2 request cùng key tới song song → vẫn chỉ trừ tiền 1 lần, request sau nhận bản cache
  test('(b) concurrent same Idempotency-Key charges once', async () => {
    const { orders, products, users, gateway, svc } = setup();
    await products.save({ id: 'p1', name: 'Latte', price: 35000, stock: 10, version: 1 });
    await users.save({ id: 'u1', email: 'a@b.c', loyaltyPoints: 0 });
    await orders.save({ id: 'o1', userId: 'u1', status: OrderStatus.PENDING, total: 35000, items: [{ productId: 'p1', quantity: 1, unitPrice: 35000 }], createdAt: new Date() });

    const dto = { orderId: 'o1', paymentMethod: 'WALLET' as const };
    const [r1, r2] = await Promise.all([svc.processPayment('u1', dto, 'KEY-P'), svc.processPayment('u1', dto, 'KEY-P')]);
    expect(gateway.getCallCount()).toBe(1);
    expect([r1.isCached, r2.isCached].sort()).toEqual([false, true]);
    expect(r2.paymentId).toBe(r1.paymentId);
    expect((await products.findById('p1'))!.stock).toBe(9);
  });

  // Khóa khác nhau nhưng cùng 1 đơn, gửi song song → chỉ 1 lần trừ tiền/kho, lần kia bị chặn trước charge
  test('concurrent different keys on same order charge once', async () => {
    const { orders, products, users, gateway, svc } = setup();
    await products.save({ id: 'p1', name: 'Latte', price: 35000, stock: 10, version: 1 });
    await users.save({ id: 'u1', email: 'a@b.c', loyaltyPoints: 0 });
    await orders.save({ id: 'o1', userId: 'u1', status: OrderStatus.PENDING, total: 35000, items: [{ productId: 'p1', quantity: 1, unitPrice: 35000 }], createdAt: new Date() });

    const results = await Promise.allSettled([
      svc.processPayment('u1', { orderId: 'o1', paymentMethod: 'WALLET' }, 'KEY-A'),
      svc.processPayment('u1', { orderId: 'o1', paymentMethod: 'WALLET' }, 'KEY-B'),
    ]);
    expect(results.filter((r) => r.status === 'fulfilled').length).toBe(1);
    expect(gateway.getCallCount()).toBe(1);
    expect((await products.findById('p1'))!.stock).toBe(9);
  });

  test('(c) concurrent stock never negative', async () => {
    const { orders, products, users, svc } = setup();
    await products.save({ id: 'p1', name: 'Latte', price: 10000, stock: 3, version: 1 });
    await users.save({ id: 'u1', email: 'a@b.c', loyaltyPoints: 0 });
    for (let i = 0; i < 10; i++) {
      await orders.save({ id: `o${i}`, userId: 'u1', status: OrderStatus.PENDING, total: 10000, items: [{ productId: 'p1', quantity: 1, unitPrice: 10000 }], createdAt: new Date() });
    }
    const results = await Promise.allSettled(
      Array.from({ length: 10 }, (_, i) => svc.processPayment('u1', { orderId: `o${i}`, paymentMethod: 'WALLET' as const }, `K-${i}`)),
    );
    const ok = results.filter((r) => r.status === 'fulfilled').length;
    expect(ok).toBe(3);
    const p = await products.findById('p1');
    expect(p!.stock).toBe(0);
  });

  test('cancel PAID refunds stock, PREPARING blocks', async () => {
    const { orders, products, users, svc } = setup();
    await products.save({ id: 'p1', name: 'Latte', price: 10000, stock: 5, version: 1 });
    await users.save({ id: 'u1', email: 'a@b.c', loyaltyPoints: 0 });
    await orders.save({ id: 'o1', userId: 'u1', status: OrderStatus.PENDING, total: 10000, items: [{ productId: 'p1', quantity: 1, unitPrice: 10000 }], createdAt: new Date() });
    await svc.processPayment('u1', { orderId: 'o1', paymentMethod: 'WALLET' as const }, 'K-C1');
    await svc.cancelOrder('o1');
    const o = await orders.findById('o1');
    expect(o!.status).toBe(OrderStatus.CANCELLED);
    await expect(svc.cancelOrder('o1')).rejects.toThrow();
  });

  // UC06 KB3: hủy đơn đã trả (có voucher) → hoàn đúng số thực thu, không phải tổng gốc
  test('cancel PAID refunds actual collected amount, not order total', async () => {
    const { orders, products, users, gateway, svc } = setup();
    await products.save({ id: 'p1', name: 'Latte', price: 35000, stock: 10, version: 1 });
    await users.save({ id: 'u1', email: 'a@b.c', loyaltyPoints: 0 });
    await orders.save({ id: 'o1', userId: 'u1', status: OrderStatus.PENDING, total: 35000, items: [{ productId: 'p1', quantity: 1, unitPrice: 35000 }], createdAt: new Date() });
    const r = await svc.processPayment('u1', { orderId: 'o1', paymentMethod: 'WALLET' as const, voucherCode: 'BREWLITE10' }, 'K-FB1');
    expect(r.amount).toBe(31500);
    await svc.cancelOrder('o1');
    expect(gateway.refunds).toEqual([{ orderId: 'o1', amount: 31500 }]);
    expect((await products.findById('p1'))!.stock).toBe(10);
  });

  // Không có biên lai SUCCESS thì chưa thu đồng nào: không được hoàn theo order.total (sẽ hoàn khống)
  test('cancel PAID không có biên lai SUCCESS → hoàn kho + CANCELLED nhưng không gọi hoàn tiền', async () => {
    const { orders, products, users, gateway, svc } = setup();
    await products.save({ id: 'p1', name: 'Latte', price: 35000, stock: 4, version: 1 });
    await users.save({ id: 'u1', email: 'a@b.c', loyaltyPoints: 0 });
    await orders.save({ id: 'o1', userId: 'u1', status: OrderStatus.PAID, total: 35000, items: [{ productId: 'p1', quantity: 1, unitPrice: 35000 }], createdAt: new Date() });
    await svc.cancelOrder('o1');
    expect(gateway.refunds).toEqual([]);
    expect((await orders.findById('o1'))!.status).toBe(OrderStatus.CANCELLED);
    expect((await products.findById('p1'))!.stock).toBe(5);
  });

  test('cancel PENDING issues no refund', async () => {
    const { orders, products, users, gateway, svc } = setup();
    await products.save({ id: 'p1', name: 'Latte', price: 20000, stock: 5, version: 1 });
    await users.save({ id: 'u1', email: 'a@b.c', loyaltyPoints: 0 });
    await orders.save({ id: 'o1', userId: 'u1', status: OrderStatus.PENDING, total: 20000, items: [{ productId: 'p1', quantity: 1, unitPrice: 20000 }], createdAt: new Date() });
    await svc.cancelOrder('o1');
    expect(gateway.refunds).toEqual([]);
    expect((await orders.findById('o1'))!.status).toBe(OrderStatus.CANCELLED);
  });

  // Khóa khác trả lại đơn PAID → chặn trước khi charge (không trừ tiền/kho lần 2)
  test('second pay with new key on PAID order is rejected without charging', async () => {
    const { orders, products, users, gateway, svc } = setup();
    await products.save({ id: 'p1', name: 'Latte', price: 20000, stock: 5, version: 1 });
    await users.save({ id: 'u1', email: 'a@b.c', loyaltyPoints: 0 });
    await orders.save({ id: 'o1', userId: 'u1', status: OrderStatus.PENDING, total: 20000, items: [{ productId: 'p1', quantity: 1, unitPrice: 20000 }], createdAt: new Date() });
    await svc.processPayment('u1', { orderId: 'o1', paymentMethod: 'WALLET' as const }, 'K-D1');
    const calls = gateway.getCallCount();
    await expect(svc.processPayment('u1', { orderId: 'o1', paymentMethod: 'WALLET' as const }, 'K-D2')).rejects.toThrow();
    expect(gateway.getCallCount()).toBe(calls);
    expect((await products.findById('p1'))!.stock).toBe(4);
  });
});

test('voucher BREWLITE10: discount floor(total*0.1), loyalty floor(final*0.1/1000)', async () => {
  const { orders, products, users, svc } = setup();
  await products.save({ id: 'p1', name: 'Latte', price: 35000, stock: 10, version: 1 });
  await users.save({ id: 'u1', email: 'a@b.c', loyaltyPoints: 0 });
  await orders.save({ id: 'o1', userId: 'u1', status: OrderStatus.PENDING, total: 35000, items: [{ productId: 'p1', quantity: 1, unitPrice: 35000 }], createdAt: new Date() });

  const r = await svc.processPayment('u1', { orderId: 'o1', paymentMethod: 'WALLET', voucherCode: 'BREWLITE10' }, 'K-V1');
  expect(r.discount).toBe(3500);
  expect(r.amount).toBe(31500);
  expect(r.loyaltyPointsEarned).toBe(3);
  expect((await users.findById('u1'))!.loyaltyPoints).toBe(3);
});

test('wrong voucher code: discount 0, full charge', async () => {
  const { orders, products, users, svc } = setup();
  await products.save({ id: 'p1', name: 'Latte', price: 35000, stock: 10, version: 1 });
  await users.save({ id: 'u1', email: 'a@b.c', loyaltyPoints: 0 });
  await orders.save({ id: 'o1', userId: 'u1', status: OrderStatus.PENDING, total: 35000, items: [{ productId: 'p1', quantity: 1, unitPrice: 35000 }], createdAt: new Date() });

  const r = await svc.processPayment('u1', { orderId: 'o1', paymentMethod: 'CARD', voucherCode: 'FAKE' }, 'K-V2');
  expect(r.discount).toBe(0);
  expect(r.amount).toBe(35000);
});

test('PAYMENT_FAILED -> retry with new key succeeds (PAYMENT_FAILED -> PENDING -> PAID)', async () => {
  const { orders, products, users, gateway, svc } = setup();
  await products.save({ id: 'p1', name: 'Latte', price: 20000, stock: 5, version: 1 });
  await users.save({ id: 'u1', email: 'a@b.c', loyaltyPoints: 0 });
  await orders.save({ id: 'o1', userId: 'u1', status: OrderStatus.PENDING, total: 20000, items: [{ productId: 'p1', quantity: 1, unitPrice: 20000 }], createdAt: new Date() });

  gateway.failNextCharge();
  await expect(svc.processPayment('u1', { orderId: 'o1', paymentMethod: 'WALLET' }, 'K-R1')).rejects.toThrow();
  const r = await svc.processPayment('u1', { orderId: 'o1', paymentMethod: 'WALLET' }, 'K-R2');
  expect(r.isCached).toBe(false);
  expect(r.status).toBe('PAID');
  expect((await orders.findById('o1'))!.status).toBe(OrderStatus.PAID);
});

test('PENDING -> CANCELLED without payment touches no stock', async () => {
  const { orders, products, users, svc } = setup();
  await products.save({ id: 'p1', name: 'Latte', price: 20000, stock: 5, version: 1 });
  await users.save({ id: 'u1', email: 'a@b.c', loyaltyPoints: 0 });
  await orders.save({ id: 'o1', userId: 'u1', status: OrderStatus.PENDING, total: 20000, items: [{ productId: 'p1', quantity: 1, unitPrice: 20000 }], createdAt: new Date() });

  await svc.cancelOrder('o1');
  expect((await orders.findById('o1'))!.status).toBe(OrderStatus.CANCELLED);
  expect((await products.findById('p1'))!.stock).toBe(5);
});

// UC06 KB1/KB2: đơn lỗi thanh toán hủy được, không hoàn tiền (chưa thu), kho nguyên
test('PAYMENT_FAILED -> CANCELLED issues no refund, stock intact', async () => {
  const { orders, products, users, gateway, svc } = setup();
  await products.save({ id: 'p1', name: 'Latte', price: 20000, stock: 5, version: 1 });
  await users.save({ id: 'u1', email: 'a@b.c', loyaltyPoints: 0 });
  await orders.save({ id: 'o1', userId: 'u1', status: OrderStatus.PENDING, total: 20000, items: [{ productId: 'p1', quantity: 1, unitPrice: 20000 }], createdAt: new Date() });

  gateway.failNextCharge();
  await expect(svc.processPayment('u1', { orderId: 'o1', paymentMethod: 'WALLET' }, 'K-FC1')).rejects.toThrow('Payment failed');
  expect((await orders.findById('o1'))!.status).toBe(OrderStatus.PAYMENT_FAILED);
  await svc.cancelOrder('o1');
  expect((await orders.findById('o1'))!.status).toBe(OrderStatus.CANCELLED);
  expect(gateway.refunds).toEqual([]);
  expect((await products.findById('p1'))!.stock).toBe(5);
});

// POST /payments chỉ chủ đơn: người lạ không thanh toán hộ, không đọc biên lai bằng Idempotency-Key
describe('payment ownership (POST /payments)', () => {
  async function seed(s: ReturnType<typeof setup>) {
    await s.products.save({ id: 'p1', name: 'Latte', price: 20000, stock: 5, version: 1 });
    await s.users.save({ id: 'u1', email: 'u1@b.c', loyaltyPoints: 0 });
    await s.users.save({ id: 'u2', email: 'u2@b.c', loyaltyPoints: 0 });
    for (const [id, userId] of [['o1', 'u1'], ['o2', 'u2']]) {
      await s.orders.save({ id, userId, status: OrderStatus.PENDING, total: 20000, items: [{ productId: 'p1', quantity: 1, unitPrice: 20000 }], createdAt: new Date() });
    }
  }

  test('người khác trả đơn của u1 → 403, không charge, đơn vẫn PENDING', async () => {
    const s = setup();
    await seed(s);
    await expect(s.svc.processPayment('u2', { orderId: 'o1', paymentMethod: 'WALLET' }, 'K-X1')).rejects.toBeInstanceOf(ForbiddenException);
    expect(s.gateway.getCallCount()).toBe(0);
    expect((await s.orders.findById('o1'))!.status).toBe(OrderStatus.PENDING);
    expect((await s.products.findById('p1'))!.stock).toBe(5);
  });

  test('đơn không tồn tại → 404, không charge', async () => {
    const s = setup();
    await seed(s);
    await expect(s.svc.processPayment('u1', { orderId: 'nope', paymentMethod: 'WALLET' }, 'K-X2')).rejects.toBeInstanceOf(NotFoundException);
    expect(s.gateway.getCallCount()).toBe(0);
  });

  test('cache hit: người khác dùng lại key của u1 trên đơn của u1 → 403, không lộ biên lai', async () => {
    const s = setup();
    await seed(s);
    await s.svc.processPayment('u1', { orderId: 'o1', paymentMethod: 'WALLET' }, 'K-X3');
    const err = await s.svc.processPayment('u2', { orderId: 'o1', paymentMethod: 'WALLET' }, 'K-X3').catch((e) => e);
    expect(err).toBeInstanceOf(ForbiddenException);
    expect(s.gateway.getCallCount()).toBe(1);
    // chủ đơn vẫn nhận được bản cache như cũ
    await expect(s.svc.processPayment('u1', { orderId: 'o1', paymentMethod: 'WALLET' }, 'K-X3')).resolves.toMatchObject({ isCached: true, orderId: 'o1' });
  });

  test('cache hit chéo đơn: u2 gửi key của u1 kèm orderId của chính u2 → 403, đơn u2 không bị trừ tiền', async () => {
    const s = setup();
    await seed(s);
    await s.svc.processPayment('u1', { orderId: 'o1', paymentMethod: 'WALLET' }, 'K-X4');
    await expect(s.svc.processPayment('u2', { orderId: 'o2', paymentMethod: 'WALLET' }, 'K-X4')).rejects.toBeInstanceOf(ForbiddenException);
    expect(s.gateway.getCallCount()).toBe(1);
    expect((await s.orders.findById('o2'))!.status).toBe(OrderStatus.PENDING);
  });

  // Cùng chủ nhưng key đã dùng cho đơn khác: trước đây trả 200 PAID của đơn cũ trong khi đơn mới vẫn PENDING
  test('cache hit chéo đơn cùng chủ: key của o1 gửi kèm o3 (cũng của u1) → 422, không charge, o3 vẫn PENDING', async () => {
    const s = setup();
    await seed(s);
    await s.orders.save({ id: 'o3', userId: 'u1', status: OrderStatus.PENDING, total: 20000, items: [{ productId: 'p1', quantity: 1, unitPrice: 20000 }], createdAt: new Date() });
    await s.svc.processPayment('u1', { orderId: 'o1', paymentMethod: 'WALLET' }, 'K-X6');
    await expect(s.svc.processPayment('u1', { orderId: 'o3', paymentMethod: 'WALLET' }, 'K-X6')).rejects.toBeInstanceOf(UnprocessableEntityException);
    expect(s.gateway.getCallCount()).toBe(1);
    expect((await s.orders.findById('o3'))!.status).toBe(OrderStatus.PENDING);
    // gửi lại đúng cặp (key, o1) vẫn trả bản cache
    await expect(s.svc.processPayment('u1', { orderId: 'o1', paymentMethod: 'WALLET' }, 'K-X6')).resolves.toMatchObject({ isCached: true, orderId: 'o1' });
  });

  test('PaymentController: gắn JwtAuthGuard và truyền req.user.id vào service', async () => {
    const s = setup();
    await seed(s);
    expect(Reflect.getMetadata(GUARDS_METADATA, PaymentController.prototype.pay)).toContain(JwtAuthGuard);
    const ctl = new PaymentController(s.svc);
    const res = { status: jest.fn() };
    const dto = { orderId: 'o1', paymentMethod: 'WALLET' as const };
    await expect(ctl.pay(dto, 'K-X5', { user: { id: 'u2' } }, res)).rejects.toBeInstanceOf(ForbiddenException);
    await expect(ctl.pay(dto, 'K-X5', { user: { id: 'u1' } }, res)).resolves.toMatchObject({ status: 'PAID', isCached: false });
    expect(res.status).toHaveBeenLastCalledWith(201);
    await ctl.pay(dto, 'K-X5', { user: { id: 'u1' } }, res);
    expect(res.status).toHaveBeenLastCalledWith(200);
  });
});

// P2-T1: hủy đơn PAID — hoàn kho (mọi món) + CANCELLED nguyên tử; lỗi giữa chừng thì rollback
describe('cancel PAID is atomic (restoreStock + CANCELLED)', () => {
  async function seedPaid() {
    const s = setup();
    await s.products.save({ id: 'p1', name: 'Latte', price: 20000, stock: 5, version: 1 });
    await s.products.save({ id: 'p2', name: 'Mocha', price: 30000, stock: 5, version: 1 });
    await s.users.save({ id: 'u1', email: 'a@b.c', loyaltyPoints: 0 });
    await s.orders.save({
      id: 'o1', userId: 'u1', status: OrderStatus.PENDING, total: 80000,
      items: [{ productId: 'p1', quantity: 1, unitPrice: 20000 }, { productId: 'p2', quantity: 2, unitPrice: 30000 }],
      createdAt: new Date(),
    });
    await s.svc.processPayment('u1', { orderId: 'o1', paymentMethod: 'WALLET' }, 'K-AT1');
    expect((await s.products.findById('p1'))!.stock).toBe(4);
    expect((await s.products.findById('p2'))!.stock).toBe(3);
    return s;
  }

  test('restoreStock lỗi ở món thứ 2 → kho món 1 không bị hoàn dở, đơn vẫn PAID', async () => {
    const s = await seedPaid();
    const real = s.products.restoreStock.bind(s.products);
    let calls = 0;
    jest.spyOn(s.products, 'restoreStock').mockImplementation(async (id, qty, tx) => {
      if (++calls === 2) throw new Error('restore boom');
      return real(id, qty, tx);
    });

    await expect(s.svc.cancelOrder('o1')).rejects.toThrow('restore boom');
    expect((await s.orders.findById('o1'))!.status).toBe(OrderStatus.PAID);
    expect((await s.products.findById('p1'))!.stock).toBe(4);
    expect((await s.products.findById('p2'))!.stock).toBe(3);
  });

  test('hủy thành công: hoàn kho mọi món + CANCELLED', async () => {
    const s = await seedPaid();
    await s.svc.cancelOrder('o1');
    expect((await s.orders.findById('o1'))!.status).toBe(OrderStatus.CANCELLED);
    expect((await s.products.findById('p1'))!.stock).toBe(5);
    expect((await s.products.findById('p2'))!.stock).toBe(5);
  });
});

// Lỗi BẤT KỲ sau khi charge thành công (không riêng kẹt kho) phải hoàn đúng số đã thu + đơn sang PAYMENT_FAILED
// rồi ném lại lỗi gốc; nếu không, đơn kẹt PENDING không biên lai và thử lại sẽ trừ tiền lần 2 (đề §9)
describe('lỗi sau charge thành công → hoàn tiền + PAYMENT_FAILED', () => {
  async function seed(opts: { stock?: number; withProduct?: boolean } = {}) {
    const s = setup();
    if (opts.withProduct !== false) await s.products.save({ id: 'p1', name: 'Latte', price: 35000, stock: opts.stock ?? 5, version: 1 });
    await s.users.save({ id: 'u1', email: 'a@b.c', loyaltyPoints: 0 });
    await s.orders.save({ id: 'o1', userId: 'u1', status: OrderStatus.PENDING, total: 35000, items: [{ productId: 'p1', quantity: 1, unitPrice: 35000 }], createdAt: new Date() });
    return s;
  }
  const dto = { orderId: 'o1', paymentMethod: 'WALLET' as const };

  test('sản phẩm mất giữa chừng (NotFound) → hoàn tiền, PAYMENT_FAILED, ném lại 404; thử lại key mới thanh toán được', async () => {
    const s = await seed({ withProduct: false });
    await expect(s.svc.processPayment('u1', dto, 'K-E1')).rejects.toBeInstanceOf(NotFoundException);
    expect(s.gateway.refunds).toEqual([{ orderId: 'o1', amount: 35000 }]);
    expect((await s.orders.findById('o1'))!.status).toBe(OrderStatus.PAYMENT_FAILED);
    expect(await s.payments.findByIdempotencyKey('K-E1')).toBeNull();

    await s.products.save({ id: 'p1', name: 'Latte', price: 35000, stock: 5, version: 1 });
    const r = await s.svc.processPayment('u1', dto, 'K-E2');
    expect(r).toMatchObject({ isCached: false, status: 'PAID', amount: 35000 });
    expect((await s.orders.findById('o1'))!.status).toBe(OrderStatus.PAID);
    expect(s.gateway.refunds).toHaveLength(1); // lần thử lại không hoàn thêm
  });

  test('lỗi chung của DB/repo → hoàn đúng số thực thu (có voucher), PAYMENT_FAILED, ném lại đúng lỗi gốc, không để lại gì', async () => {
    const s = await seed();
    jest.spyOn(s.users, 'addLoyaltyPoints').mockRejectedValueOnce(new Error('db down'));
    const withVoucher = { ...dto, voucherCode: 'BREWLITE10' };

    await expect(s.svc.processPayment('u1', withVoucher, 'K-E3')).rejects.toThrow('db down');
    expect(s.gateway.refunds).toEqual([{ orderId: 'o1', amount: 31500 }]); // finalAmount sau voucher, không phải 35000
    expect((await s.orders.findById('o1'))!.status).toBe(OrderStatus.PAYMENT_FAILED);
    expect((await s.products.findById('p1'))!.stock).toBe(5); // transaction rollback: kho không bị trừ
    expect(await s.payments.findByIdempotencyKey('K-E3')).toBeNull();

    const r = await s.svc.processPayment('u1', withVoucher, 'K-E4');
    expect(r).toMatchObject({ isCached: false, status: 'PAID', amount: 31500 });
    expect(s.gateway.refunds).toHaveLength(1);
  });

  test('kẹt kho (409) giữ nguyên: ConflictException + hoàn tiền + PAYMENT_FAILED', async () => {
    const s = await seed({ stock: 0 });
    await expect(s.svc.processPayment('u1', dto, 'K-E5')).rejects.toBeInstanceOf(ConflictException);
    expect(s.gateway.refunds).toEqual([{ orderId: 'o1', amount: 35000 }]);
    expect((await s.orders.findById('o1'))!.status).toBe(OrderStatus.PAYMENT_FAILED);
  });
});

import { ForbiddenException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import { OrderStatus } from '../src/contracts/order.contract';
import { OrderController } from '../src/order/order.controller';
import { OrderService } from '../src/order/order.service';
import { UpdateOrderStatusDto } from '../src/payment/dto/update-order-status.dto';
import { MockPaymentGatewayService } from '../src/payment/mock-payment-gateway.service';
import { PaymentController } from '../src/payment/payment.controller';
import { PaymentService } from '../src/payment/payment.service';
import { InMemoryOrderRepo } from '../src/stubs/in-memory-order.repo';
import { InMemoryPaymentRepo } from '../src/stubs/in-memory-payment.repo';
import { InMemoryProductRepo } from '../src/stubs/in-memory-product.repo';
import { InMemoryUserRepo } from '../src/stubs/in-memory-user.repo';

function setup() {
  const orders = new InMemoryOrderRepo();
  const products = new InMemoryProductRepo();
  const payments = new InMemoryPaymentRepo();
  const users = new InMemoryUserRepo();
  const gateway = new MockPaymentGatewayService();
  const svc = new PaymentService(orders, products, payments, users, gateway);
  const orderSvc = new OrderService(orders, products);
  return { orders, products, payments, users, gateway, svc, orderSvc };
}

async function seedPaid(s: ReturnType<typeof setup>, orderId = 'o1', userId = 'u1') {
  await s.products.save({ id: 'p1', name: 'Latte', price: 20000, stock: 5, version: 1 });
  await s.users.save({ id: userId, email: `${userId}@b.c`, loyaltyPoints: 0 });
  await s.orders.save({
    id: orderId, userId, status: OrderStatus.PAID, total: 20000,
    items: [{ productId: 'p1', quantity: 1, unitPrice: 20000 }], createdAt: new Date(),
  });
}

describe('order advance PAID->PREPARING->READY->COMPLETED (gap 1)', () => {
  test('happy path đủ 3 bước tiến đơn', async () => {
    const s = setup();
    await seedPaid(s);
    await expect(s.svc.advanceOrder('u1', 'o1', OrderStatus.PREPARING)).resolves.toMatchObject({ status: OrderStatus.PREPARING });
    await expect(s.svc.advanceOrder('u1', 'o1', OrderStatus.READY)).resolves.toMatchObject({ status: OrderStatus.READY });
    await expect(s.svc.advanceOrder('u1', 'o1', OrderStatus.COMPLETED)).resolves.toMatchObject({ status: OrderStatus.COMPLETED });
  });

  test.each([
    [OrderStatus.PAID, OrderStatus.READY, 'nhảy cóc PAID->READY'],
    [OrderStatus.PENDING, OrderStatus.PREPARING, 'PENDING->PREPARING'],
    [OrderStatus.READY, OrderStatus.PREPARING, 'đi lùi READY->PREPARING'],
    [OrderStatus.COMPLETED, OrderStatus.CANCELLED, 'COMPLETED->CANCELLED'],
  ])('sai thứ tự %s->%s bị 400 (%s)', async (from, to) => {
    const s = setup();
    await s.products.save({ id: 'p1', name: 'Latte', price: 20000, stock: 5, version: 1 });
    await s.users.save({ id: 'u1', email: 'u1@b.c', loyaltyPoints: 0 });
    await s.orders.save({
      id: 'o1', userId: 'u1', status: from, total: 20000,
      items: [{ productId: 'p1', quantity: 1, unitPrice: 20000 }], createdAt: new Date(),
    });
    const p = to === OrderStatus.CANCELLED
      ? s.svc.cancelOrderAs('u1', 'o1')
      : s.svc.advanceOrder('u1', 'o1', to);
    await expect(p).rejects.toThrow(`Invalid transition ${from} -> ${to}`);
  });

  test('advanceOrder từ chối CANCELLED (phải đi đường cancel có hoàn tiền)', async () => {
    const s = setup();
    await seedPaid(s);
    await expect(s.svc.advanceOrder('u1', 'o1', OrderStatus.CANCELLED)).rejects.toThrow();
    expect((await s.orders.findById('o1'))!.status).toBe(OrderStatus.PAID);
  });

  test('chủ đơn lạ bị 403 ở advance/cancel/detail', async () => {
    const s = setup();
    await seedPaid(s);
    await expect(s.svc.advanceOrder('u2', 'o1', OrderStatus.PREPARING)).rejects.toBeInstanceOf(ForbiddenException);
    await expect(s.svc.cancelOrderAs('u2', 'o1')).rejects.toBeInstanceOf(ForbiddenException);
    await expect(s.orderSvc.getById('u2', 'o1')).rejects.toBeInstanceOf(ForbiddenException);
    expect((await s.orders.findById('o1'))!.status).toBe(OrderStatus.PAID);
  });

  test('cancelOrderAs của chủ đơn vẫn hoàn tiền/hoàn kho như cũ', async () => {
    const s = setup();
    await s.products.save({ id: 'p1', name: 'Latte', price: 20000, stock: 5, version: 1 });
    await s.users.save({ id: 'u1', email: 'u1@b.c', loyaltyPoints: 0 });
    await s.orders.save({
      id: 'o1', userId: 'u1', status: OrderStatus.PENDING, total: 20000,
      items: [{ productId: 'p1', quantity: 1, unitPrice: 20000 }], createdAt: new Date(),
    });
    await s.svc.processPayment({ orderId: 'o1', paymentMethod: 'WALLET' }, 'K-ADV-C1');
    await s.svc.cancelOrderAs('u1', 'o1');
    expect((await s.orders.findById('o1'))!.status).toBe(OrderStatus.CANCELLED);
    expect(s.gateway.refunds).toEqual([{ orderId: 'o1', amount: 20000 }]);
    expect((await s.products.findById('p1'))!.stock).toBe(5);
  });

  test('GET detail: chủ đơn đọc được, đơn lạ 404', async () => {
    const s = setup();
    await seedPaid(s);
    await expect(s.orderSvc.getById('u1', 'o1')).resolves.toMatchObject({ id: 'o1', status: OrderStatus.PAID });
    await expect(s.orderSvc.getById('u1', 'nope')).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('PATCH/GET wiring + guard 401', () => {
  test('PaymentController rẽ CANCELLED sang cancel, còn lại sang advance', async () => {
    const s = setup();
    await seedPaid(s, 'o1');
    await seedPaid(s, 'o2');
    const ctl = new PaymentController(s.svc);
    await expect(ctl.update('o1', { status: OrderStatus.PREPARING } as UpdateOrderStatusDto, { user: { id: 'u1' } }))
      .resolves.toMatchObject({ status: OrderStatus.PREPARING });
    await expect(ctl.update('o2', { status: OrderStatus.CANCELLED } as UpdateOrderStatusDto, { user: { id: 'u1' } }))
      .resolves.toMatchObject({ status: OrderStatus.CANCELLED });
    expect(s.gateway.refunds).toEqual([{ orderId: 'o2', amount: 20000 }]);
  });

  test('OrderController.byId chặn chủ đơn lạ', async () => {
    const s = setup();
    await seedPaid(s);
    const ctl = new OrderController(s.orderSvc);
    await expect(ctl.byId('o1', { user: { id: 'u1' } })).resolves.toMatchObject({ id: 'o1' });
    await expect(ctl.byId('o1', { user: { id: 'u2' } })).rejects.toBeInstanceOf(ForbiddenException);
  });

  test('thiếu/sai token bị 401, token đúng gắn req.user', async () => {
    const jwt = new JwtService({ secret: 'test-secret' });
    const guard = new JwtAuthGuard(jwt);
    const ctx = (req: any) => ({ switchToHttp: () => ({ getRequest: () => req }) }) as any;
    await expect(guard.canActivate(ctx({ headers: {} }))).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(guard.canActivate(ctx({ headers: { authorization: 'Bearer bogus' } }))).rejects.toBeInstanceOf(UnauthorizedException);
    const req = { headers: { authorization: `Bearer ${jwt.sign({ sub: 'u1', email: 'u1@b.c' })}` } } as any;
    await expect(guard.canActivate(ctx(req))).resolves.toBe(true);
    expect(req.user.id).toBe('u1');
  });

  test('DTO nhận PREPARING/READY/COMPLETED/CANCELLED, vẫn từ chối PAID', async () => {
    for (const status of [OrderStatus.PREPARING, OrderStatus.READY, OrderStatus.COMPLETED, OrderStatus.CANCELLED]) {
      expect(await validate(plainToInstance(UpdateOrderStatusDto, { status }))).toHaveLength(0);
    }
    expect((await validate(plainToInstance(UpdateOrderStatusDto, { status: OrderStatus.PAID }))).length).toBeGreaterThan(0);
  });
});

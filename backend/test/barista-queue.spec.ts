import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { OrderStatus } from '../src/contracts/order.contract';
import { Role } from '../src/contracts/user.contract';
import { OrderController } from '../src/order/order.controller';
import { OrderService } from '../src/order/order.service';
import { RolesGuard } from '../src/auth/roles.guard';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import { InMemoryOrderRepo } from '../src/stubs/in-memory-order.repo';
import { InMemoryProductRepo } from '../src/stubs/in-memory-product.repo';

async function setup() {
  const orders = new InMemoryOrderRepo();
  const products = new InMemoryProductRepo();
  await products.save({ id: 'p1', name: 'Latte', price: 35000, stock: 5, version: 1 });
  const mk = (id: string, status: OrderStatus, minute: number) =>
    orders.save({ id, userId: 'u1', status, total: 40000, items: [{ productId: 'p1', quantity: 1, unitPrice: 40000, size: 'M', toppings: [] }], createdAt: new Date(2026, 9, 9, 10, minute) });
  await mk('o-paid-late', OrderStatus.PAID, 30);
  await mk('o-paid-early', OrderStatus.PAID, 10);
  await mk('o-prep', OrderStatus.PREPARING, 20);
  await mk('o-ready', OrderStatus.READY, 25);
  await mk('o-pending', OrderStatus.PENDING, 5);
  await mk('o-done', OrderStatus.COMPLETED, 1);
  return { orders, products, svc: new OrderService(orders, products) };
}

describe('hàng đợi quầy GET /orders?status=', () => {
  test('mặc định lấy PAID/PREPARING/READY, cũ trước (FIFO), kèm tên món', async () => {
    const { svc } = await setup();
    const q = await svc.listQueue();
    expect(q.map((o) => o.id)).toEqual(['o-paid-early', 'o-prep', 'o-ready', 'o-paid-late']);
    expect(q[0].items[0].productName).toBe('Latte');
  });

  test('lọc theo 1 trạng thái', async () => {
    const { svc } = await setup();
    expect((await svc.listQueue([OrderStatus.PAID])).map((o) => o.id)).toEqual(['o-paid-early', 'o-paid-late']);
  });

  test('trạng thái ngoài hàng đợi (PENDING/COMPLETED) → 400', async () => {
    const { svc } = await setup();
    await expect(svc.listQueue([OrderStatus.PENDING])).rejects.toBeInstanceOf(BadRequestException);
  });

  test('controller: parse "PAID,READY", chuỗi lạ → 400', async () => {
    const { svc } = await setup();
    const ctl = new OrderController(svc);
    expect((await ctl.queue('PAID,READY')).map((o) => o.id)).toEqual(['o-paid-early', 'o-ready', 'o-paid-late']);
    await expect(ctl.queue('PAID,FOO')).rejects.toBeInstanceOf(BadRequestException);
  });

  test('route gắn JwtAuthGuard + RolesGuard, chỉ BARISTA/ADMIN', () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, OrderController.prototype.queue);
    expect(guards).toEqual([JwtAuthGuard, RolesGuard]);
    const guard = new RolesGuard(new Reflector());
    const ctx = (role: Role) => ({ getHandler: () => OrderController.prototype.queue, getClass: () => OrderController, switchToHttp: () => ({ getRequest: () => ({ user: { role } }) }) }) as any;
    expect(guard.canActivate(ctx(Role.BARISTA))).toBe(true);
    expect(() => guard.canActivate(ctx(Role.CUSTOMER))).toThrow(ForbiddenException);
  });
});

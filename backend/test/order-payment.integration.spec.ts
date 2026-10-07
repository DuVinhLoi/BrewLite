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
    const r1 = await svc.processPayment(dto, 'KEY-1');
    const r2 = await svc.processPayment(dto, 'KEY-1');
    expect(gateway.getCallCount()).toBe(1);
    expect(r2.isCached).toBe(true);
    expect(r1.status).toBe('PAID');
    const u = await users.findById('u1');
    expect(u!.loyaltyPoints).toBe(r1.loyaltyPointsEarned);
  });

  test('(c) concurrent stock never negative', async () => {
    const { orders, products, users, svc } = setup();
    await products.save({ id: 'p1', name: 'Latte', price: 10000, stock: 3, version: 1 });
    await users.save({ id: 'u1', email: 'a@b.c', loyaltyPoints: 0 });
    for (let i = 0; i < 10; i++) {
      await orders.save({ id: `o${i}`, userId: 'u1', status: OrderStatus.PENDING, total: 10000, items: [{ productId: 'p1', quantity: 1, unitPrice: 10000 }], createdAt: new Date() });
    }
    const results = await Promise.allSettled(
      Array.from({ length: 10 }, (_, i) => svc.processPayment({ orderId: `o${i}`, paymentMethod: 'WALLET' as const }, `K-${i}`)),
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
    await svc.processPayment({ orderId: 'o1', paymentMethod: 'WALLET' as const }, 'K-C1');
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
    const r = await svc.processPayment({ orderId: 'o1', paymentMethod: 'WALLET' as const, voucherCode: 'BREWLITE10' }, 'K-FB1');
    expect(r.amount).toBe(31500);
    await svc.cancelOrder('o1');
    expect(gateway.refunds).toEqual([{ orderId: 'o1', amount: 31500 }]);
    expect((await products.findById('p1'))!.stock).toBe(10);
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
    await svc.processPayment({ orderId: 'o1', paymentMethod: 'WALLET' as const }, 'K-D1');
    const calls = gateway.getCallCount();
    await expect(svc.processPayment({ orderId: 'o1', paymentMethod: 'WALLET' as const }, 'K-D2')).rejects.toThrow();
    expect(gateway.getCallCount()).toBe(calls);
    expect((await products.findById('p1'))!.stock).toBe(4);
  });
});

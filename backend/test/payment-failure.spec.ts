import { PaymentService } from '../src/payment/payment.service';
import { MockPaymentGatewayService } from '../src/payment/mock-payment-gateway.service';
import { InMemoryOrderRepo } from '../src/stubs/in-memory-order.repo';
import { InMemoryProductRepo } from '../src/stubs/in-memory-product.repo';
import { InMemoryPaymentRepo } from '../src/stubs/in-memory-payment.repo';
import { InMemoryUserRepo } from '../src/stubs/in-memory-user.repo';
import { OrderStatus } from '../src/contracts/order.contract';

test('gateway failure -> PAYMENT_FAILED, cart kept (order retryable)', async () => {
  const orders = new InMemoryOrderRepo();
  const products = new InMemoryProductRepo();
  const payments = new InMemoryPaymentRepo();
  const users = new InMemoryUserRepo();
  const gateway = new MockPaymentGatewayService();
  const svc = new PaymentService(orders, products, payments, users, gateway);
  await products.save({ id: 'p1', name: 'Latte', price: 35000, stock: 10, version: 1 });
  await users.save({ id: 'u1', email: 'a@b.c', loyaltyPoints: 0 });
  await orders.save({ id: 'o1', userId: 'u1', status: OrderStatus.PENDING, total: 35000, items: [{ productId: 'p1', quantity: 1, unitPrice: 35000 }], createdAt: new Date() });

  gateway.failNextCharge();
  await expect(svc.processPayment('u1', { orderId: 'o1', paymentMethod: 'WALLET' }, 'K-F1')).rejects.toThrow('Payment failed');
  expect((await orders.findById('o1'))!.status).toBe(OrderStatus.PAYMENT_FAILED);
  expect((await products.findById('p1'))!.stock).toBe(10);
});

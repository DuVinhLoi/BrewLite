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

// Demo nhánh PAYMENT_FAILED (UC06 KB1) mà không sửa code: biến môi trường backend, đọc lúc gọi charge(), mặc định tắt
describe('MOCK_GATEWAY_DECLINE_METHOD', () => {
  const saved = process.env.MOCK_GATEWAY_DECLINE_METHOD;
  afterEach(() => {
    if (saved === undefined) delete process.env.MOCK_GATEWAY_DECLINE_METHOD;
    else process.env.MOCK_GATEWAY_DECLINE_METHOD = saved;
  });

  async function setup() {
    const orders = new InMemoryOrderRepo();
    const products = new InMemoryProductRepo();
    const users = new InMemoryUserRepo();
    const payments = new InMemoryPaymentRepo();
    const svc = new PaymentService(orders, products, payments, users, new MockPaymentGatewayService());
    await products.save({ id: 'p1', name: 'Latte', price: 35000, stock: 10, version: 1 });
    await users.save({ id: 'u1', email: 'a@b.c', loyaltyPoints: 0 });
    await orders.save({ id: 'o1', userId: 'u1', status: OrderStatus.PENDING, total: 35000, items: [{ productId: 'p1', quantity: 1, unitPrice: 35000 }], createdAt: new Date() });
    return { orders, products, payments, svc };
  }

  test('CARD bị từ chối → 400 + PAYMENT_FAILED; thử lại cùng đơn bằng WALLET (key mới) → PAID', async () => {
    process.env.MOCK_GATEWAY_DECLINE_METHOD = 'CARD';
    const { orders, products, svc } = await setup();
    await expect(svc.processPayment('u1', { orderId: 'o1', paymentMethod: 'CARD' }, 'K-D1')).rejects.toThrow('Payment failed');
    expect((await orders.findById('o1'))!.status).toBe(OrderStatus.PAYMENT_FAILED);
    expect((await products.findById('p1'))!.stock).toBe(10);
    await expect(svc.processPayment('u1', { orderId: 'o1', paymentMethod: 'WALLET' }, 'K-D2')).resolves.toMatchObject({ status: 'PAID', isCached: false });
    expect((await orders.findById('o1'))!.status).toBe(OrderStatus.PAID);
  });

  // Phương án A: giao diện giữ 1 key trả tiền; lần bị cổng từ chối không lưu key nên đổi phương thức và dùng lại key vẫn được
  test('CARD bị từ chối rồi đổi sang WALLET với CÙNG key → PAID, đúng 1 biên lai theo key đó', async () => {
    process.env.MOCK_GATEWAY_DECLINE_METHOD = 'CARD';
    const { orders, payments, svc } = await setup();
    await expect(svc.processPayment('u1', { orderId: 'o1', paymentMethod: 'CARD' }, 'K-D4')).rejects.toThrow('Payment failed');
    expect((await orders.findById('o1'))!.status).toBe(OrderStatus.PAYMENT_FAILED);
    expect(await payments.findByIdempotencyKey('K-D4')).toBeNull();
    await expect(svc.processPayment('u1', { orderId: 'o1', paymentMethod: 'WALLET' }, 'K-D4')).resolves.toMatchObject({ status: 'PAID', isCached: false });
    expect((await orders.findById('o1'))!.status).toBe(OrderStatus.PAID);
    expect(await payments.findAllByOrderId('o1')).toHaveLength(1);
    expect(await payments.findByIdempotencyKey('K-D4')).toMatchObject({ method: 'WALLET', orderId: 'o1' });
  });

  test('mặc định tắt: không đặt biến thì Thẻ vẫn trả được', async () => {
    delete process.env.MOCK_GATEWAY_DECLINE_METHOD;
    const { svc } = await setup();
    await expect(svc.processPayment('u1', { orderId: 'o1', paymentMethod: 'CARD' }, 'K-D3')).resolves.toMatchObject({ status: 'PAID' });
  });
});

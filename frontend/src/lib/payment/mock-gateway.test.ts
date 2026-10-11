import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { MockPaymentGateway } from './mock-gateway';

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

// Mock không có backend: không có đơn thật để poll, nên kết quả không mang orderId (PaymentSuccess không poll).
test('MockPaymentGateway: kết quả không có orderId dù request có orderId', async () => {
  const pending = new MockPaymentGateway().pay({ amount: 1, method: 'WALLET', idempotencyKey: 'k', orderId: 'abcdef1234567890' });
  await vi.advanceTimersByTimeAsync(1200);
  const r = await pending;
  expect(r.orderCode).toBe('#abcdef12');
  expect(r.orderId).toBeUndefined();
});

// req.amount của PaymentForm đã là số tiền sau giảm nên mock không có tổng gốc để tính giảm: discount luôn 0.
// Điểm tính như backend: floor(amount * LOYALTY_RATE / VND_PER_POINT) = 1 điểm mỗi 10.000 đ.
test('MockPaymentGateway: discount = 0 và loyaltyPointsEarned = floor(amount / 10.000)', async () => {
  const pay = async (amount: number) => {
    const pending = new MockPaymentGateway().pay({ amount, method: 'WALLET', idempotencyKey: 'k' });
    await vi.advanceTimersByTimeAsync(1200);
    return pending;
  };
  expect(await pay(80000)).toMatchObject({ discount: 0, loyaltyPointsEarned: 8 });
  expect(await pay(36000)).toMatchObject({ discount: 0, loyaltyPointsEarned: 3 });
  expect(await pay(9999)).toMatchObject({ discount: 0, loyaltyPointsEarned: 0 });
});

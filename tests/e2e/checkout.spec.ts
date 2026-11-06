import { addAmericano, checkoutAsCustomer, expect, expectPaid, expectStatus, payThroughFakeGateway, request, test } from './helpers';
import { moveStock } from '../integration/helpers.mjs';

test('E2E-T01: menu options, Customer checkout, signed payment and paid history preserve the total', async ({ page, shop }) => {
  await addAmericano(page, { size: 'L', topping: true, quantity: 2 });
  // Seeded Americano 40,000 + L 10,000 + cheese foam 10,000; two cups = 120,000 VND.
  await expect(page.getByText('Size L · Kem phô mai', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Số lượng Americano', { exact: true })).toHaveText('2');
  await expect(page.getByText(/^Tổng tiền:/)).toContainText('120.000');
  await checkoutAsCustomer(page, shop);
  await expect(page.getByRole('listitem')).toHaveText('2 × Americano · Size L · Kem phô mai');
  const payment = await payThroughFakeGateway(page, shop);
  const order = await expectPaid(page, shop, payment.orderId);
  expect(order.total).toBe(120000);
  expect(order.items).toEqual([expect.objectContaining({ productId: 'americano', size: 'L', toppings: ['Kem phô mai'], quantity: 2, unitPrice: 60000, lineTotal: 120000 })]);
  await expect(page.getByText(/^Tổng tiền:/)).toContainText('120.000');
  await page.getByRole('link', { name: 'Đơn hàng', exact: true }).click();
  const history = page.getByRole('article').filter({ has: page.getByRole('heading', { name: `Mã đơn: ${order.id}`, exact: true }) });
  await expect(history.getByRole('status')).toHaveText('Đã thanh toán');
  await expect(history.getByText(/^Tổng tiền:/)).toContainText('120.000');
  expect(expectStatus(await request('/orders/me', { token: shop.customer.token }), 200).some((entry: { id: string; status: string }) => entry.id === order.id && entry.status === 'PAID')).toBe(true);
  await page.getByRole('link', { name: /^Giỏ hàng \(/ }).click();
  await expect(page.getByText('Giỏ hàng trống', { exact: true })).toBeVisible();
});

test('E2E-T02: guest checkout returns from login with the full cart intact', async ({ page, shop }) => {
  await addAmericano(page, { size: 'M', topping: true, quantity: 2 });
  await checkoutAsCustomer(page, shop);
  await expect(page.getByRole('listitem')).toHaveText('2 × Americano · Size M · Kem phô mai');
  await expect(page.getByText(/^Tổng tiền:/)).toContainText('110.000');
  await page.getByRole('link', { name: 'Quay lại giỏ hàng', exact: true }).click();
  await expect(page.getByText('Size M · Kem phô mai', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Số lượng Americano', { exact: true })).toHaveText('2');
  await expect(page.getByText(/^Tổng tiền:/)).toContainText('110.000');
  expect(expectStatus(await request('/orders/me', { token: shop.customer.token }), 200)).toHaveLength(0);
});

test('E2E-T03: signed code 24 shows failure, then a new payment succeeds on the same order', async ({ page, shop }) => {
  await addAmericano(page);
  await checkoutAsCustomer(page, shop);
  const failed = await payThroughFakeGateway(page, shop, '24');
  await expect(page.getByRole('main').getByRole('alert')).toContainText('Bạn đã hủy giao dịch');
  const beforeRetry = expectStatus(await request(`/orders/${failed.orderId}`, { token: shop.customer.token }), 200);
  expect(beforeRetry.status).toBe('PAYMENT_FAILED');
  expect(beforeRetry.payments).toEqual([expect.objectContaining({ id: failed.paymentId, status: 'FAILED', gatewayResponseCode: '24' })]);
  await page.getByRole('link', { name: 'Thử lại', exact: true }).click();
  const retried = await payThroughFakeGateway(page, shop);
  expect(retried.orderId).toBe(failed.orderId);
  expect(retried.paymentId === failed.paymentId, 'Retry must create a new payment attempt').toBe(false);
  const order = await expectPaid(page, shop, retried.orderId);
  expect(order.payments).toHaveLength(2);
  expect(expectStatus(await request('/orders/me', { token: shop.customer.token }), 200)).toHaveLength(1);
});

test('E2E-T04: stock shortage blocks the cart until quantity is corrected, then checkout succeeds', async ({ page, shop }) => {
  await addAmericano(page, { quantity: 2 });
  await moveStock(shop.barista, 'espresso', 'ADJUST', 30);
  await page.reload();
  await expect(page.getByRole('main').getByRole('alert')).toContainText('Espresso');
  await expect(page.getByRole('button', { name: 'Thanh toán', exact: true })).toBeDisabled();
  await expect(page.getByRole('link', { name: 'Thanh toán', exact: true })).toHaveCount(0);
  expect(expectStatus(await request('/orders/me', { token: shop.customer.token }), 200)).toHaveLength(0);
  await page.getByRole('button', { name: 'Giảm Americano', exact: true }).click();
  await expect(page.getByLabel('Số lượng Americano', { exact: true })).toHaveText('1');
  await expect(page.getByRole('main').getByRole('alert')).toHaveCount(0);
  await checkoutAsCustomer(page, shop);
  const payment = await payThroughFakeGateway(page, shop);
  const order = await expectPaid(page, shop, payment.orderId);
  expect(order.total).toBe(40000);
  expect(order.items[0].quantity).toBe(1);
});

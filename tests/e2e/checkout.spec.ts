import { randomUUID } from 'node:crypto';
import { test, expect } from '../../apps/web/node_modules/@playwright/test';

test('E2E-S2-01: menu → tùy chọn → giỏ → đăng nhập → thanh toán → xác nhận', async ({ page, request }) => {
  const email = `e2e-${randomUUID()}@test.local`;
  const registered = await request.post('http://127.0.0.1:4105/auth/register', { data: { email, password: 'E2ePassword123' } });
  expect(registered.status()).toBe(201);
  await page.goto('/');
  const product = page.getByRole('article').filter({ has: page.getByRole('heading', { name: 'Cappuccino', exact: true }) });
  await product.getByRole('button', { name: 'Thêm vào giỏ' }).click();
  await expect(page.getByRole('heading', { name: 'Cappuccino', exact: true })).toBeVisible();
  await page.getByRole('radio', { name: /^L / }).check();
  await page.getByRole('checkbox', { name: /^Trân châu / }).check();
  await expect(page.getByText('62.000đ', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Thêm vào giỏ', exact: true }).click();
  await page.getByRole('link', { name: 'Xem giỏ hàng' }).click();
  await page.getByRole('button', { name: 'Tăng Cappuccino' }).click();
  await expect(page.getByText('Tổng tiền: 124.000đ')).toBeVisible();
  await page.reload();
  await expect(page.getByText('Tổng tiền: 124.000đ')).toBeVisible();
  await page.getByRole('link', { name: 'Thanh toán', exact: true }).click();
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Mật khẩu', { exact: true }).fill('E2ePassword123');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Thanh toán mô phỏng' })).toBeVisible();
  await page.getByRole('button', { name: 'Xác nhận trả' }).click();
  await expect(page.getByRole('heading', { name: 'Chi tiết đơn hàng' })).toBeVisible();
  await expect(page.getByText('Đã thanh toán', { exact: true })).toBeVisible();
  await expect(page.getByText('Tổng tiền: 124.000đ')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Giỏ hàng (0)' })).toBeVisible();
  await page.getByRole('link', { name: 'Đơn hàng', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Xem chi tiết' })).toHaveCount(1);
});
async function enterCheckout(page: import('../../apps/web/node_modules/@playwright/test').Page, request: import('../../apps/web/node_modules/@playwright/test').APIRequestContext) {
  const email = `e2e-${randomUUID()}@test.local`;
  expect((await request.post('http://127.0.0.1:4105/auth/register', { data: { email, password: 'E2ePassword123' } })).status()).toBe(201);
  await page.goto('/products/cappuccino');
  await page.getByRole('button', { name: 'Thêm vào giỏ', exact: true }).click();
  await page.getByRole('link', { name: 'Xem giỏ hàng' }).click();
  await page.getByRole('link', { name: 'Thanh toán', exact: true }).click();
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Mật khẩu', { exact: true }).fill('E2ePassword123');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Xác nhận trả' })).toBeEnabled();
  return email;
}

test('E2E-S2-02: declined card keeps cart and retries the same order with wallet', async ({ page, request }) => {
  await enterCheckout(page, request);
  await page.getByLabel('Phương thức', { exact: true }).selectOption('CARD');
  await page.getByLabel('Số thẻ demo', { exact: true }).fill('4000000000000002');
  await page.getByRole('button', { name: 'Xác nhận trả' }).click();
  await expect(page.getByRole('main').getByRole('alert')).toContainText('Đơn của bạn vẫn được giữ');
  await expect(page.getByRole('link', { name: 'Giỏ hàng (1)' })).toBeVisible();
  const orderText = await page.getByText(/^Mã đơn:/).textContent();
  await page.getByLabel('Phương thức', { exact: true }).selectOption('WALLET');
  await page.getByRole('button', { name: 'Thử lại thanh toán' }).click();
  await expect(page.getByRole('heading', { name: orderText!, exact: true })).toBeVisible();
  await expect(page.getByText('Đã thanh toán', { exact: true })).toBeVisible();
});

test('E2E-S2-03: lost create response blocks another reservation and survives reload', async ({ page, request }) => {
  await enterCheckout(page, request);
  let creates = 0;
  await page.route('**/orders', async (route) => {
    if (route.request().method() === 'POST') { creates++; await route.fetch(); await route.abort('failed'); }
    else await route.continue();
  });
  await page.getByRole('button', { name: 'Xác nhận trả' }).click();
  await expect(page.getByRole('main').getByRole('alert')).toContainText('Chưa xác định được kết quả tạo đơn');
  await expect(page.getByRole('button', { name: 'Xác nhận trả' })).toBeDisabled();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Xác nhận trả' })).toBeDisabled();
  await page.getByRole('link', { name: 'Kiểm tra lịch sử đơn hàng' }).click();
  await expect(page.getByRole('link', { name: 'Xem chi tiết' })).toHaveCount(1);
  expect(creates).toBe(1);
});

test('E2E-S2-04: lost successful card response recovers paid result without paying again', async ({ page, request }) => {
  await enterCheckout(page, request);
  let payments = 0;
  await page.route('**/payments', async (route) => { payments++; await route.fetch(); await route.abort('failed'); });
  await page.getByLabel('Phương thức', { exact: true }).selectOption('CARD');
  await page.getByLabel('Số thẻ demo', { exact: true }).fill('4242424242424242');
  await page.getByRole('button', { name: 'Xác nhận trả' }).click();
  await expect(page.getByRole('main').getByRole('alert')).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Chi tiết đơn hàng' })).toBeVisible();
  await expect(page.getByText('Đã thanh toán', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Giỏ hàng (0)' })).toBeVisible();
  expect(payments).toBe(1);
});
test('E2E-S2-05: failed saved-order lookup cannot create another order', async ({ page, request }) => {
  const email = await enterCheckout(page, request);
  const token = await page.evaluate(() => JSON.parse(sessionStorage.getItem('brewlite-session')!).token as string);
  const response = await request.post('http://127.0.0.1:4105/orders', { headers: { Authorization: `Bearer ${token}` }, data: { items: [{ productId: 'cappuccino', size: 'M', toppings: [], quantity: 1 }] } });
  expect(response.status()).toBe(201); const order = await response.json();
  await page.evaluate(({ email, id }) => sessionStorage.setItem(`brewlite-checkout:${email}`, JSON.stringify({ orderId: id, key: crypto.randomUUID() })), { email, id: order.id });
  let creates = 0;
  page.on('request', (request) => { if (request.method() === 'POST' && request.url().endsWith('/orders')) creates++; });
  await page.route(`**/orders/${order.id}`, (route) => route.abort('failed'));
  await page.reload();
  await expect(page.getByRole('button', { name: 'Xác nhận trả' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Thử tải lại đơn' })).toBeVisible();
  await page.unroute(`**/orders/${order.id}`);
  await page.getByRole('button', { name: 'Thử tải lại đơn' }).click();
  await page.getByRole('button', { name: 'Thử lại thanh toán' }).click();
  await expect(page.getByText('Đã thanh toán', { exact: true })).toBeVisible();
  expect(creates).toBe(0);
});

test('E2E-S2-06: payment 401 resumes the same order and key after login', async ({ page, request }) => {
  const email = await enterCheckout(page, request);
  let creates = 0;
  const keys: string[] = [];
  page.on('request', (request) => {
    if (request.method() === 'POST' && request.url().endsWith('/orders')) creates++;
    if (request.url().endsWith('/payments')) keys.push(request.headers()['idempotency-key']);
  });
  let firstPayment = true;
  await page.route('**/payments', async (route) => {
    if (firstPayment && route.request().method() === 'POST') { firstPayment = false; await route.continue({ headers: { ...route.request().headers(), authorization: 'Bearer expired-test-token' } }); }
    else await route.continue();
  });
  await page.getByRole('button', { name: 'Xác nhận trả' }).click();
  await expect(page.getByRole('main').getByRole('alert')).toHaveText('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Mật khẩu', { exact: true }).fill('E2ePassword123');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await page.getByRole('button', { name: 'Thử lại thanh toán' }).click();
  await expect(page.getByText('Đã thanh toán', { exact: true })).toBeVisible();
  expect(creates).toBe(1); expect(keys).toHaveLength(2); expect(keys[0]).toBe(keys[1]);
});
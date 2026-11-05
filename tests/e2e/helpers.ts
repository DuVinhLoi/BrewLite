import { test as base, expect, type Page } from '../../apps/web/node_modules/@playwright/test';
import { callbackParams, expectStatus, fake, request as sharedRequest, scenario, signVnpay, targets } from '../integration/helpers.mjs';

type Identity = { email: string; token: string };
// The shared JavaScript fixture adds these fields after construction; its inferred TS return type omits them.
type Fixture = {
  customer: Identity;
  barista: Identity;
  orders: { order: { id: string }; user: Identity }[];
};
export const request: (
  path: string,
  options?: NonNullable<Parameters<typeof sharedRequest>[1]> & { token?: string },
) => ReturnType<typeof sharedRequest> = sharedRequest;
export const test = base.extend<{ shop: Fixture }>({
  shop: async ({ page }, use) => {
    let cleanup: (() => Promise<void>) | undefined;
    const pending: Promise<void>[] = [];
    try {
      const fixture = await scenario({ after: (callback: () => Promise<void>) => { cleanup = callback; } }) as unknown as Fixture;
      // Track browser-created orders so the shared fixture can resolve payments and release reservations even after a failed assertion.
      page.on('response', (response) => {
        if (response.url() === `${targets.apiUrl}/orders` && response.request().method() === 'POST' && response.status() === 201) {
          pending.push(response.json().then((order) => { fixture.orders.push({ order, user: fixture.customer }); }));
        }
      });
      // All browser traffic stays local. A test must explicitly install the fake gateway route before paying.
      await page.route('**/*', async (route) => {
        const url = new URL(route.request().url());
        if (url.origin === targets.apiUrl && /^\/payments\/[^/]+\/sync$/.test(url.pathname)) await route.abort('blockedbyclient');
        else if ([targets.webUrl, targets.apiUrl].includes(url.origin)) await route.continue();
        else await route.abort('blockedbyclient');
      });
      await use(fixture);
    } finally {
      try { await Promise.all(pending); }
      finally { await cleanup?.(); }
    }
  },
});
export { expect, fake, expectStatus, targets };

export async function signIn(page: Page, email: string, password: string = fake.password) {
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Mật khẩu', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
}

export async function addAmericano(page: Page, { size = 'S', topping = false, quantity = 1 } = {}) {
  await page.goto('/');
  await page.getByRole('article').filter({ has: page.getByRole('heading', { name: 'Americano', exact: true }) }).getByRole('button', { name: 'Thêm vào giỏ' }).click();
  await page.getByRole('radio', { name: new RegExp(`^${size} \\(`) }).check();
  if (topping) await page.getByRole('checkbox', { name: /^Kem phô mai/ }).check();
  await expect(page.getByRole('button', { name: 'Thêm vào giỏ', exact: true })).toBeEnabled();
  await page.getByLabel('Số lượng', { exact: true }).fill(String(quantity));
  await page.getByRole('button', { name: 'Thêm vào giỏ', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Đã thêm vào giỏ hàng');
  await page.getByRole('link', { name: 'Xem giỏ hàng', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Giỏ hàng', exact: true })).toBeVisible();
}

export async function checkoutAsCustomer(page: Page, shop: Fixture) {
  await page.getByRole('link', { name: 'Thanh toán', exact: true }).click();
  await expect(page).toHaveURL(`${targets.webUrl}/login?next=/checkout`);
  await signIn(page, shop.customer.email);
  await expect(page).toHaveURL(`${targets.webUrl}/checkout`);
  await expect(page.getByRole('button', { name: 'Thanh toán qua VNPay', exact: true })).toBeEnabled();
}

export async function payThroughFakeGateway(page: Page, shop: Fixture, code = '00') {
  const result = new Promise<{ orderId: string; paymentId: string; amount: number }>((resolve, reject) => {
    void page.route('https://sandbox.vnpayment.vn/**', async (route) => {
      try {
        const params = Object.fromEntries(new URL(route.request().url()).searchParams);
        expect(params.vnp_SecureHash === signVnpay(params), 'VNPay URL must have the independently verified fake signature').toBe(true);
        expect(params.vnp_TmnCode === fake.tmnCode, 'VNPay merchant must be fake').toBe(true);
        expect(params.vnp_ReturnUrl === `${targets.webUrl}/payment/vnpay-return`, 'VNPay return URL must stay local').toBe(true);
        const summaries = expectStatus(await request('/orders/me', { token: shop.customer.token }), 200);
        const orders = await Promise.all(summaries.map(async (entry: { id: string }) => expectStatus(await request(`/orders/${entry.id}`, { token: shop.customer.token }), 200)));
        const order = orders.find((entry: { payments: { id: string }[] }) => entry.payments.some((payment) => payment.id === params.vnp_TxnRef));
        expect(Boolean(order), 'Gateway transaction must belong to the current Customer').toBe(true);
        expect(Number(params.vnp_Amount), 'Gateway amount uses VND × 100').toBe(order.total * 100);
        const payment = { orderId: order.id, paymentId: params.vnp_TxnRef, amount: order.total };
        const signed = callbackParams(payment, { vnp_ResponseCode: code, vnp_TransactionStatus: code === '00' ? '00' : '02' });
        expect(expectStatus(await request(`/payments/vnpay/ipn?${new URLSearchParams(signed)}`), 200).RspCode).toBe('00');
        await route.fulfill({ status: 302, headers: { location: `${targets.webUrl}/payment/vnpay-return?${new URLSearchParams(signed)}` } });
        resolve(payment);
      } catch (error) {
        await route.abort();
        reject(error);
      }
    }, { times: 1 }).catch(reject);
  });
  await page.getByRole('button', { name: 'Thanh toán qua VNPay', exact: true }).click();
  return result;
}

export async function expectPaid(page: Page, shop: Fixture, orderId: string) {
  // A predicate avoids printing the signed return URL in an assertion failure.
  await expect.poll(() => new URL(page.url()).pathname).toBe(`/orders/${orderId}`);
  await expect(page.getByRole('status', { exact: true })).toHaveText('Đã thanh toán');
  const order = expectStatus(await request(`/orders/${orderId}`, { token: shop.customer.token }), 200);
  expect(order.status).toBe('PAID');
  expect(order.payments.filter((payment: { status: string }) => payment.status === 'SUCCESS')).toHaveLength(1);
  return order;
}

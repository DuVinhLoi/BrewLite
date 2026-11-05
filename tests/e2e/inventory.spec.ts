import { randomUUID } from 'node:crypto';
import { expect, expectStatus, request, signIn, test } from './helpers';
import { moveStock } from '../integration/helpers.mjs';

test('E2E-T05: Barista receives stock in inventory and the menu becomes available', async ({ page, shop }) => {
  await moveStock(shop.barista, 'espresso', 'ADJUST', 0);
  await page.goto('/');
  const americano = page.getByRole('article').filter({ has: page.getByRole('heading', { name: 'Americano', exact: true }) });
  await expect(americano.getByText('Hết hàng', { exact: true })).toBeVisible();
  await expect(americano.getByRole('button', { name: 'Thêm vào giỏ' })).toBeDisabled();
  expect(expectStatus(await request('/products/americano'), 200).stock).toBe(0);
  await page.goto('/login?next=/inventory');
  await signIn(page, shop.barista.email, 'Demo@12345');
  await expect(page.getByRole('heading', { name: 'Kho nguyên liệu', exact: true })).toBeVisible();
  await page.getByRole('combobox', { name: /^Nguyên liệu/ }).selectOption('espresso');
  await page.getByLabel('Số lượng nhập / tổng kiểm đếm', { exact: true }).fill('90');
  const reason = `E2E delivery ${randomUUID()}`;
  await page.getByLabel('Lý do', { exact: true }).fill(reason);
  await page.getByRole('button', { name: 'Lưu biến động', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Đã lưu biến động');
  const movement = page.getByRole('article').filter({ has: page.getByText(reason, { exact: true }) });
  await expect(movement).toContainText('+90 ml');
  await expect(movement).toContainText(shop.barista.email);
  expect(expectStatus(await request('/products/americano'), 200).stock).toBe(3);
  await page.getByRole('link', { name: 'BrewLite', exact: true }).click();
  await expect(americano.getByText('Còn hàng', { exact: true })).toBeVisible();
  await expect(americano.getByRole('button', { name: 'Thêm vào giỏ' })).toBeEnabled();
});

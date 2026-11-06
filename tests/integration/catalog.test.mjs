import assert from 'node:assert/strict';
import test from 'node:test';
import { createOrder, expectStatus, request, scenario } from './helpers.mjs';

test('API-T01: eight products expose ingredient-derived stock, including reservations', async (t) => {
  const f = await scenario(t, { espresso: 150 });
  const products = expectStatus(await request('/products'), 200);
  assert.deepEqual(products.map((p) => p.id).sort(), ['americano', 'bac-xiu', 'ca-phe-sua', 'cappuccino', 'cold-brew', 'matcha-latte', 'tra-dao', 'tra-sua-tran-chau']);
  // Hand-derived S recipe limits with every other ingredient at 1000.
  const capacities = { americano: 5, 'bac-xiu': 10, 'ca-phe-sua': 40, cappuccino: 5, 'cold-brew': 5, 'matcha-latte': 6, 'tra-dao': 33, 'tra-sua-tran-chau': 12 };
  for (const product of products) assert.equal(product.stock, capacities[product.id], product.id);
  await createOrder(f.customer);
  const reserved = expectStatus(await request('/products'), 200);
  assert.equal(reserved.find((p) => p.id === 'americano').stock, 4);
  assert.equal(reserved.find((p) => p.id === 'cappuccino').stock, 4);
});

test('API-T02: product detail exposes stock and unknown ID has PRODUCT_NOT_FOUND', async (t) => {
  await scenario(t, { espresso: 90 });
  const product = expectStatus(await request('/products/americano'), 200);
  assert.equal(product.id, 'americano');
  assert.equal(product.stock, 3);
  expectStatus(await request('/products/unknown-integration-product'), 404, 'PRODUCT_NOT_FOUND');
});

test('API-T03: health confirms database connectivity', async (t) => {
  await scenario(t);
  assert.deepEqual(expectStatus(await request('/health'), 200), { status: 'ok', database: 'up' });
});

import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import { expectStatus, fake, item, request, scenario } from './helpers.mjs';

test('API-T04: registration validates credentials and login returns expiring customer JWT', async (t) => {
  const f = await scenario(t);
  const email = `integration-${randomUUID()}@example.test`;
  const user = expectStatus(await request('/auth/register', { method: 'POST', body: { email, password: fake.password } }), 201);
  assert.equal(user.email, email);
  assert.equal(user.role, 'CUSTOMER');
  assert.equal(Object.hasOwn(user, 'passwordHash'), false);
  for (const body of [{ email: 'invalid', password: fake.password }, { email: `invalid-${randomUUID()}@example.test`, password: 'Ab1' }, { email: `role-${randomUUID()}@example.test`, password: fake.password, role: 'BARISTA' }]) {
    expectStatus(await request('/auth/register', { method: 'POST', body }), 400, 'VALIDATION_ERROR');
  }
  const login = expectStatus(await request('/auth/login', { method: 'POST', body: { email, password: fake.password } }), 200);
  assert.equal(Object.hasOwn(login.user, 'passwordHash'), false);
  const claims = JSON.parse(Buffer.from(login.accessToken.split('.')[1], 'base64url').toString());
  assert.equal(claims.sub, user.id);
  assert.equal(claims.role, 'CUSTOMER');
  assert.ok(claims.exp > Date.now() / 1000 && claims.exp <= Date.now() / 1000 + 3601);
  expectStatus(await request('/orders/me', { token: login.accessToken }), 200);
  expectStatus(await request('/auth/login', { method: 'POST', body: { email, password: 'WrongTest12345' } }), 401, 'UNAUTHORIZED');
  expectStatus(await request('/auth/login', { method: 'POST', body: { email: f.customer.email, password: 'WrongTest12345' } }), 401, 'UNAUTHORIZED');
});

test('API-T05: guest and role authorization matrix protects checkout and inventory', async (t) => {
  const f = await scenario(t);
  const routes = [
    ['/orders', 'POST', { items: [item()] }], ['/payments', 'POST', { orderId: 'unknown', paymentMethod: 'CARD' }], ['/orders/me', 'GET'],
  ];
  for (const [path, method, body] of routes) {
    expectStatus(await request(path, { method, body }), 401, 'UNAUTHORIZED');
    expectStatus(await request(path, { method, body, token: f.barista.token }), 403, 'FORBIDDEN');
  }
  const inventory = [
    ['/inventory/ingredients', 'GET'], ['/inventory/movements', 'GET'], ['/inventory/recipes', 'GET'],
    ['/inventory/ingredients/espresso/movements', 'POST', { kind: 'RECEIVE', quantity: '1', unit: 'ml', reason: 'Forbidden test' }],
    ['/inventory/recipes', 'PUT', { productId: 'americano', size: 'S', lines: [{ ingredientId: 'espresso', quantity: '30', unit: 'ml' }] }],
  ];
  for (const [path, method, body] of inventory) {
    expectStatus(await request(path, { method, body }), 401, 'UNAUTHORIZED');
    expectStatus(await request(path, { method, body, token: f.customer.token }), 403, 'FORBIDDEN');
  }
});

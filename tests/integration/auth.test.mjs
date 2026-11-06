import assert from 'node:assert/strict';
import { createHmac, randomUUID } from 'node:crypto';
import test from 'node:test';
import { createOrder, createPayment, expectStatus, fake, item, request, scenario, snapshot } from './helpers.mjs';

// Independent HS256 signer: no imports from application auth code. The SRS (AC-N05.1) fixes only the signature, the key and exp;
// iss and aud mirror the API's own token contract in auth.service.ts, not an SRS rule.
function signJwt(claims, secret) {
  const part = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const input = `${part({ alg: 'HS256', typ: 'JWT' })}.${part({ iss: 'brewlite', aud: 'brewlite-api', ...claims })}`;
  return `${input}.${createHmac('sha256', secret).update(input).digest('base64url')}`;
}
const inOneHour = () => Math.floor(Date.now() / 1000) + 3600;

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
    // AC-F10.1 lists the payment sync endpoint too; the id is unknown because the guard must answer before any lookup.
    ['/payments/unknown-payment/sync', 'POST'],
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
  // AC-F10.1: the two order-detail endpoints are open to the owner or a Barista, so guests are the only rejected caller here.
  for (const [path, method, body] of [['/orders/unknown-order', 'GET'], ['/orders/unknown-order', 'PATCH', { status: 'CANCELLED' }]]) {
    expectStatus(await request(path, { method, body }), 401, 'UNAUTHORIZED');
  }
  // AC-N05.2: a Barista must get 403 from a real payment's sync, not merely a 404 for an unknown id.
  const payment = await createPayment(f.customer, await createOrder(f.customer));
  const before = await snapshot(f);
  expectStatus(await request(`/payments/${payment.paymentId}/sync`, { method: 'POST' }), 401, 'UNAUTHORIZED');
  expectStatus(await request(`/orders/${payment.orderId}`), 401, 'UNAUTHORIZED');
  expectStatus(await request(`/orders/${payment.orderId}`, { method: 'PATCH', body: { status: 'CANCELLED' } }), 401, 'UNAUTHORIZED');
  expectStatus(await request(`/payments/${payment.paymentId}/sync`, { method: 'POST', token: f.barista.token }), 403, 'FORBIDDEN');
  assert.deepEqual(await snapshot(f), before);
});

test('API-T05: tampered, wrong-secret, expired, unsigned and foreign issuer or audience tokens are rejected with 401 (AC-F10.2, AC-N05.1)', async (t) => {
  const f = await scenario(t);
  const claims = { sub: f.barista.id, role: 'BARISTA' };
  const guarded = (token) => request('/inventory/ingredients', { token });
  // Positive controls: the hand-signed token is accepted when it is valid, so each rejection below has one cause only.
  expectStatus(await guarded(f.barista.token), 200);
  expectStatus(await guarded(signJwt({ ...claims, exp: inOneHour() }, fake.jwt)), 200);
  // A real token whose signature differs by exactly one character.
  const [header, payload, signature] = f.barista.token.split('.');
  const tampered = `${header}.${payload}.${signature[0] === 'A' ? 'B' : 'A'}${signature.slice(1)}`;
  expectStatus(await guarded(tampered), 401, 'UNAUTHORIZED');
  // A BARISTA token signed with a secret the API does not use.
  expectStatus(await guarded(signJwt({ ...claims, exp: inOneHour() }, 'WRONG_SECRET_FOR_TEST_ONLY_32_CHARS_MINIMUM')), 401, 'UNAUTHORIZED');
  // Correctly signed, expired only.
  expectStatus(await guarded(signJwt({ ...claims, exp: Math.floor(Date.now() / 1000) - 120 }, fake.jwt)), 401, 'UNAUTHORIZED');
  // An unsigned token (alg none) has no valid signature (AC-F10.2). The iss and aud checks are the API's own contract, not stated in the SRS.
  const part = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
  expectStatus(await guarded(`${part({ alg: 'none', typ: 'JWT' })}.${part({ iss: 'brewlite', aud: 'brewlite-api', ...claims, exp: inOneHour() })}.`), 401, 'UNAUTHORIZED');
  expectStatus(await guarded(signJwt({ ...claims, iss: 'other', exp: inOneHour() }, fake.jwt)), 401, 'UNAUTHORIZED');
  expectStatus(await guarded(signJwt({ ...claims, aud: 'other', exp: inOneHour() }, fake.jwt)), 401, 'UNAUTHORIZED');
  expectStatus(await guarded(signJwt({ ...claims, iss: undefined, exp: inOneHour() }, fake.jwt)), 401, 'UNAUTHORIZED');
  expectStatus(await guarded(signJwt({ ...claims, aud: undefined, exp: inOneHour() }, fake.jwt)), 401, 'UNAUTHORIZED');
  expectStatus(await guarded(signJwt(claims, fake.jwt)), 401, 'UNAUTHORIZED');
  // The same holds for a Customer endpoint.
  const customer = { sub: f.customer.id, role: 'CUSTOMER' };
  expectStatus(await request('/orders/me', { token: signJwt({ ...customer, exp: inOneHour() }, fake.jwt) }), 200);
  expectStatus(await request('/orders/me', { token: signJwt({ ...customer, exp: inOneHour() }, 'WRONG_SECRET_FOR_TEST_ONLY_32_CHARS_MINIMUM') }), 401, 'UNAUTHORIZED');
  expectStatus(await request('/orders/me', { token: signJwt({ ...customer, exp: Math.floor(Date.now() / 1000) - 120 }, fake.jwt) }), 401, 'UNAUTHORIZED');
});

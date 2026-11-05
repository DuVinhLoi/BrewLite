import assert from 'node:assert/strict';
import { createHmac, randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const require = createRequire(new URL('../../apps/api/package.json', import.meta.url));
const { PrismaClient } = require('@prisma/client');
const run = promisify(execFile);
export const fake = Object.freeze({
  password: 'FakeTest12345',
  jwt: 'FAKE_JWT_SECRET_FOR_CI_ONLY_32_CHARS_MINIMUM',
  tmnCode: 'FAKETMN1',
  hashSecret: 'FAKE_SECRET_FOR_CI_ONLY',
});

// Fail before constructing a database client or issuing any HTTP request.
export function assertSafeTargets(env = process.env) {
  const loopback = (value, protocols, label) => {
    let url;
    try { url = new URL(value); } catch { throw new Error(`${label} must be an explicit loopback URL`); }
    assert.ok(protocols.includes(url.protocol) && ['127.0.0.1', 'localhost'].includes(url.hostname), `${label} must use loopback`);
    return url;
  };
  const api = loopback(env.API_URL, ['http:'], 'API_URL');
  const web = loopback(env.WEB_URL, ['http:'], 'WEB_URL');
  assert.ok(!api.username && !api.password && !web.username && !web.password, 'HTTP targets cannot contain credentials');
  const database = loopback(env.DATABASE_URL, ['postgresql:', 'postgres:'], 'DATABASE_URL');
  assert.match(database.pathname.slice(1), /^brewlite_(ci|test)(_[a-z0-9]+)?$/, 'Database name must identify a test database');
  assert.ok(decodeURIComponent(database.username) === 'brewlite' && decodeURIComponent(database.password) === 'fake-ci-only-password', 'Only the known fake database credentials are allowed');
  for (const [key, expected] of Object.entries({ JWT_SECRET: fake.jwt, VNP_TMN_CODE: fake.tmnCode, VNP_HASH_SECRET: fake.hashSecret })) {
    assert.ok(env[key] === undefined || env[key] === expected, `${key} must use the known fake value`);
  }
  return { apiUrl: api.origin, webUrl: web.origin, databaseUrl: database.href };
}

export const targets = assertSafeTargets();

export async function request(path, { method = 'GET', token, body, headers = {} } = {}) {
  assertSafeTargets();
  assert.ok(path.startsWith('/') && !path.startsWith('//'), 'Only API-relative paths are allowed');
  const response = await fetch(`${targets.apiUrl}${path}`, {
    method, redirect: 'error', signal: AbortSignal.timeout(30000),
    headers: { ...(body === undefined ? {} : { 'content-type': 'application/json' }), ...(token ? { authorization: `Bearer ${token}` } : {}), ...headers },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  return { status: response.status, body: await response.json() };
}

export function expectStatus(result, status, error) {
  // Deliberately do not dump bodies: they may contain JWTs or signed URLs.
  assert.equal(result.status, status, `Expected HTTP ${status}; received ${result.status} (${result.body?.error ?? 'no error code'})`);
  if (error) assert.equal(result.body.error, error);
  return result.body;
}

export async function login(email, password = fake.password) {
  const body = expectStatus(await request('/auth/login', { method: 'POST', body: { email, password } }), 200);
  assert.ok(typeof body.accessToken === 'string' && body.accessToken.length > 0, 'Login must return an access token');
  return { ...body.user, token: body.accessToken };
}

export async function createUser(fixture) {
  const email = `integration-${randomUUID()}@example.test`;
  const user = expectStatus(await request('/auth/register', { method: 'POST', body: { email, password: fake.password } }), 201);
  assert.equal(Object.hasOwn(user, 'passwordHash'), false);
  return { ...await login(email), fixture };
}

export async function moveStock(staff, ingredientId, kind, quantity, unit = 'ml', reason = 'Isolated integration fixture') {
  return expectStatus(await request(`/inventory/ingredients/${ingredientId}/movements`, {
    method: 'POST', token: staff.token, body: { kind, quantity: String(quantity), unit, reason },
  }), 201);
}

export const item = (overrides = {}) => ({ productId: 'americano', size: 'S', toppings: [], quantity: 1, ...overrides });

export async function createOrder(user, items = [item()]) {
  const order = expectStatus(await request('/orders', { method: 'POST', token: user.token, body: { items } }), 201);
  user.fixture.orders.push({ order, user });
  return order;
}

export async function createPayment(user, order, key = randomUUID()) {
  return expectStatus(await request('/payments', {
    method: 'POST', token: user.token, headers: { 'Idempotency-Key': key }, body: { orderId: order.id, paymentMethod: 'CARD' },
  }), 201);
}

// Independent protocol oracle: no imports from application signing code.
export function signVnpay(params) {
  const fields = Object.keys(params).filter((key) => key.startsWith('vnp_') && !['vnp_SecureHash', 'vnp_SecureHashType'].includes(key)).sort();
  const encode = (value) => encodeURIComponent(value).replace(/[!'()~]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`).replace(/%20/g, '+');
  const canonical = fields.map((key) => `${encode(key)}=${encode(String(params[key]))}`).join('&');
  return createHmac('sha512', fake.hashSecret).update(canonical, 'utf8').digest('hex');
}

export function callbackParams(payment, overrides = {}) {
  const params = {
    vnp_TmnCode: fake.tmnCode, vnp_TxnRef: payment.paymentId, vnp_Amount: String(payment.amount * 100),
    vnp_ResponseCode: '00', vnp_TransactionStatus: '00', vnp_TransactionNo: '123456',
    vnp_BankCode: 'NCB', vnp_PayDate: '20261105120000', vnp_OrderInfo: 'Fake payment with spaces + accents cà phê',
    ...overrides,
  };
  return { ...params, vnp_SecureHash: signVnpay(params) };
}

export async function callback(payment, overrides = {}, endpoint = 'ipn') {
  return request(`/payments/vnpay/${endpoint}?${new URLSearchParams(callbackParams(payment, overrides))}`);
}

export async function payOrder(fixture, order) {
  const payment = await createPayment(fixture.customer, order);
  assert.equal(expectStatus(await callback(payment), 200).RspCode, '00');
  return payment;
}

export async function balance(fixture, id = 'espresso') {
  const row = await fixture.read((db) => db.ingredient.findUniqueOrThrow({ where: { id } }));
  return { onHand: row.onHand.toString(), reserved: row.reserved.toString() };
}

export async function snapshot(fixture) {
  const rows = await fixture.read((db) => Promise.all([
    db.product.findMany({ orderBy: { id: 'asc' } }),
    db.user.findMany({ orderBy: { id: 'asc' }, omit: { passwordHash: true } }),
    db.ingredient.findMany({ orderBy: { id: 'asc' } }),
    db.order.findMany({ orderBy: { id: 'asc' } }),
    db.orderItem.findMany({ orderBy: { id: 'asc' } }),
    db.orderIngredient.findMany({ orderBy: [{ orderId: 'asc' }, { ingredientId: 'asc' }] }),
    db.payment.findMany({ orderBy: { id: 'asc' }, omit: { paymentUrl: true, fingerprint: true } }),
    db.stockMovement.findMany({ orderBy: { id: 'asc' } }),
    db.recipe.findMany({ orderBy: { id: 'asc' }, include: { lines: { orderBy: { ingredientId: 'asc' } } } }),
  ]));
  return JSON.parse(JSON.stringify(rows));
}

export async function runSeed() {
  assertSafeTargets();
  const { stdout } = await run(process.execPath, ['--import', 'tsx', 'prisma/seed.ts'], {
    cwd: fileURLToPath(new URL('../../apps/api/', import.meta.url)), timeout: 60000,
    env: { ...process.env, DATABASE_URL: targets.databaseUrl, JWT_SECRET: fake.jwt, VNP_TMN_CODE: fake.tmnCode,
      VNP_HASH_SECRET: fake.hashSecret, WEB_URL: targets.webUrl, SEED_DEMO_USERS: 'false' },
  });
  assert.match(stdout, /8/);
}

export async function saveRecipe(fixture, body) {
  const original = fixture.recipes.find((recipe) => body.topping ? recipe.topping === body.topping : recipe.productId === body.productId && recipe.size === body.size);
  assert.ok(original, 'Fixture only replaces existing seeded recipes');
  fixture.changedRecipes.add(original);
  return expectStatus(await request('/inventory/recipes', { method: 'PUT', token: fixture.barista.token, body }), 200);
}

// Use only with suite concurrency 1 and an exclusive, seeded local test database.
export async function scenario(t, { espresso = 1000 } = {}) {
  assertSafeTargets();
  const db = new PrismaClient({ datasourceUrl: targets.databaseUrl });
  const read = (operation) => db.$transaction(async (tx) => {
    await tx.$executeRaw`SET TRANSACTION READ ONLY`;
    return operation(tx);
  });
  const fixture = { read, orders: [], changedRecipes: new Set() };
  let originalIngredients, originalRecipes;
  try {
    [originalIngredients, originalRecipes] = await read((tx) => Promise.all([
      tx.ingredient.findMany(), tx.recipe.findMany({ include: { lines: true } }),
    ]));
    fixture.recipes = originalRecipes;
    assert.equal(originalIngredients.length, 15, 'Seed the isolated database first');
    assert.ok(originalIngredients.every((row) => row.reserved.isZero()), 'Database is in use: existing reservations prevent isolated fixtures');
  } catch (error) {
    await db.$disconnect();
    throw error;
  }
  t.after(async () => {
    try {
      for (const { order, user } of fixture.orders) {
        const current = expectStatus(await request(`/orders/${order.id}`, { token: user.token }), 200);
        for (const payment of current.payments.filter((row) => row.status === 'PENDING')) {
          assert.equal(expectStatus(await callback({ paymentId: payment.id, amount: payment.amount }, { vnp_ResponseCode: '24', vnp_TransactionStatus: '02' }), 200).RspCode, '00');
        }
        if (['PENDING', 'PAYMENT_FAILED'].includes(current.status)) expectStatus(await request(`/orders/${order.id}`, { method: 'PATCH', token: user.token, body: { status: 'CANCELLED' } }), 200);
      }
      for (const recipe of fixture.changedRecipes) {
        const selector = recipe.topping ? { topping: recipe.topping } : { productId: recipe.productId, size: recipe.size };
        const lines = recipe.lines.map((line) => ({ ingredientId: line.ingredientId, quantity: line.quantity.toString(), unit: originalIngredients.find((row) => row.id === line.ingredientId).unit }));
        expectStatus(await request('/inventory/recipes', { method: 'PUT', token: fixture.barista.token, body: { ...selector, lines } }), 200);
      }
      for (const row of originalIngredients) await moveStock(fixture.barista, row.id, 'ADJUST', row.onHand.toString(), row.unit, 'Restore integration fixture');
    } finally { await db.$disconnect(); }
  });
  fixture.customer = await createUser(fixture);
  fixture.barista = await login('barista.demo@brewlite.local', 'Demo@12345');
  for (const row of originalIngredients) {
    await moveStock(fixture.barista, row.id, 'ADJUST', row.id === 'espresso' ? espresso : 1000, row.unit);
  }
  return fixture;
}

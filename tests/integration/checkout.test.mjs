import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import {
  balance, callback, callbackParams, createOrder, createPayment, createUser, expectStatus, fake,
  item, payOrder, request, scenario, signVnpay, snapshot, targets,
} from './helpers.mjs';

const transition = (user, order, status) => request(`/orders/${order.id}`, { method: 'PATCH', token: user.token, body: { status } });
const detail = async (user, order) => expectStatus(await request(`/orders/${order.id}`, { token: user.token }), 200);

const payRequest = (user, orderId, key, paymentMethod = 'CARD') => request('/payments', {
  method: 'POST', token: user.token, headers: { 'Idempotency-Key': key }, body: { orderId, paymentMethod },
});

test('INT-T01: server prices valid DTO and reserves the exact order snapshot', async (t) => {
  const f = await scenario(t);
  const order = await createOrder(f.customer, [item({ size: 'M', toppings: ['Trân châu'], quantity: 2 })]);
  assert.equal(order.status, 'PENDING');
  assert.equal(order.total, 104000); // (40000 + 5000 + 7000) * 2
  assert.equal(order.items[0].unitPrice, 52000);
  assert.equal(order.items[0].lineTotal, 104000);
  const stored = await f.read((db) => db.orderIngredient.findMany({ where: { orderId: order.id }, orderBy: { ingredientId: 'asc' } }));
  assert.deepEqual(stored.map((line) => [line.ingredientId, line.quantity.toString()]), [['cooked-pearls', '40'], ['espresso', '75']]);
  assert.deepEqual(await balance(f), { onHand: '1000', reserved: '75' });
  assert.deepEqual(await balance(f, 'cooked-pearls'), { onHand: '1000', reserved: '40' });
});

test('INT-T01: SRS example, two Cappuccino L with Trân châu, totals 124000', async (t) => {
  const f = await scenario(t);
  const order = await createOrder(f.customer, [item({ productId: 'cappuccino', size: 'L', toppings: ['Trân châu'], quantity: 2 })]);
  assert.equal(order.status, 'PENDING');
  assert.equal(order.total, 124000); // (45000 + 10000 + 7000) * 2
  assert.equal(order.items[0].unitPrice, 62000);
  assert.equal(order.items[0].lineTotal, 124000);
});

test('INT-T02: invalid size, zero quantity, unknown and client price fields leave DB unchanged', async (t) => {
  const f = await scenario(t);
  const before = await snapshot(f);
  for (const body of [
    { items: [item({ size: 'XL' })] }, { items: [item({ quantity: 0 })] },
    { items: [item({ extra: true })] }, { items: [item()], extra: true },
    { items: [item()], total: 1 }, { items: [item({ unitPrice: 1 })] },
  ]) {
    expectStatus(await request('/orders', { method: 'POST', token: f.customer.token, body }), 400, 'VALIDATION_ERROR');
    assert.deepEqual(await snapshot(f), before);
  }
});

test('INT-T03: insufficient espresso identifies shortage and leaves DB unchanged', async (t) => {
  const f = await scenario(t, { espresso: 29 });
  const before = await snapshot(f);
  const error = expectStatus(await request('/orders', { method: 'POST', token: f.customer.token, body: { items: [item()] } }), 409, 'OUT_OF_STOCK');
  assert.equal(error.details.length, 1);
  assert.equal(error.details[0].ingredientId, 'espresso');
  assert.equal(error.details[0].requested, '30');
  assert.equal(error.details[0].available, '29');
  assert.deepEqual(await snapshot(f), before);
});

test('INT-T04: ten concurrent orders compete for exactly five Americano S cups', async (t) => {
  const f = await scenario(t, { espresso: 150 });
  const results = await Promise.all(Array.from({ length: 10 }, () => request('/orders', {
    method: 'POST', token: f.customer.token, body: { items: [item()] },
  })));
  for (const result of results.filter((r) => r.status === 201)) f.orders.push({ order: result.body, user: f.customer });
  assert.equal(results.filter((r) => r.status === 201).length, 5);
  assert.equal(results.filter((r) => r.status === 409 && r.body.error === 'OUT_OF_STOCK').length, 5);
  assert.deepEqual(await balance(f), { onHand: '150', reserved: '150' });
  const ingredients = expectStatus(await request('/inventory/ingredients', { token: f.barista.token }), 200);
  for (const row of ingredients) assert.ok(Number(row.reserved) >= 0 && Number(row.reserved) <= Number(row.onHand), row.id);
  assert.equal(ingredients.find((row) => row.id === 'espresso').available, '0');
});

test('INT-T05: payment URL signature and amount are correct, replay reuses URL, key is mandatory', async (t) => {
  const f = await scenario(t);
  const order = await createOrder(f.customer);
  const key = randomUUID();
  const payment = await createPayment(f.customer, order, key);
  assert.ok(typeof payment.paymentUrl === 'string', 'Payment must include URL');
  const params = Object.fromEntries(new URL(payment.paymentUrl).searchParams);
  assert.equal(params.vnp_Amount, '4000000');
  assert.equal(params.vnp_TmnCode, fake.tmnCode);
  assert.equal(params.vnp_TxnRef, payment.paymentId);
  assert.equal(new URL(params.vnp_ReturnUrl).origin, targets.webUrl);
  assert.ok(params.vnp_SecureHash === signVnpay(params), 'Independent payment URL HMAC must match');
  const before = await snapshot(f);
  const replay = expectStatus(await request('/payments', { method: 'POST', token: f.customer.token, headers: { 'Idempotency-Key': key }, body: { orderId: order.id, paymentMethod: 'CARD' } }), 200);
  assert.ok(replay.paymentUrl === payment.paymentUrl, 'Replay must reuse original signed URL');
  assert.equal(replay.paymentId, payment.paymentId);
  expectStatus(await request('/payments', { method: 'POST', token: f.customer.token, body: { orderId: order.id, paymentMethod: 'CARD' } }), 400, 'IDEMPOTENCY_KEY_REQUIRED');
  assert.deepEqual(await snapshot(f), before);
});

test('INT-T05: while PENDING a new key with the same method returns the same payment, another method conflicts (AC-F16.8)', async (t) => {
  const f = await scenario(t);
  const order = await createOrder(f.customer);
  const first = await createPayment(f.customer, order, randomUUID());
  const before = await snapshot(f);
  const again = expectStatus(await payRequest(f.customer, order.id, randomUUID()), 200);
  assert.equal(again.paymentId, first.paymentId);
  assert.ok(typeof first.paymentUrl === 'string' && again.paymentUrl === first.paymentUrl, 'A new key must reuse the original signed URL');
  assert.equal(again.expiresAt, first.expiresAt);
  // snapshot() omits paymentUrl, so the stored URL is checked here: a new key must not overwrite it (AC-F16.8).
  assert.equal((await detail(f.customer, order)).payments[0].paymentUrl, first.paymentUrl);
  assert.deepEqual(await snapshot(f), before, 'No second Payment may be created');
  expectStatus(await payRequest(f.customer, order.id, randomUUID(), 'WALLET'), 409, 'PAYMENT_IN_PROGRESS');
  assert.deepEqual(await snapshot(f), before);
});

test('INT-T05: Customer B cannot create a payment for Customer A order (AC-N05.3)', async (t) => {
  const f = await scenario(t);
  const other = await createUser(f);
  const order = await createOrder(f.customer);
  const before = await snapshot(f);
  expectStatus(await payRequest(other, order.id, randomUUID()), 403, 'FORBIDDEN');
  assert.deepEqual(await snapshot(f), before);
  // With a PENDING payment on the order, B must still get 403 and not A's signed payment URL.
  await createPayment(f.customer, order);
  const pending = await snapshot(f);
  expectStatus(await payRequest(other, order.id, randomUUID()), 403, 'FORBIDDEN');
  assert.deepEqual(await snapshot(f), pending);
});

test('INT-T05: Customer B cannot sync Customer A payment (AC-N05.3)', async (t) => {
  const f = await scenario(t);
  const other = await createUser(f);
  const payment = await createPayment(f.customer, await createOrder(f.customer));
  const before = await snapshot(f);
  expectStatus(await request(`/payments/${payment.paymentId}/sync`, { method: 'POST', token: other.token }), 403, 'FORBIDDEN');
  assert.deepEqual(await snapshot(f), before);
  // Once the payment has settled, B still must not reach it through sync.
  assert.equal(expectStatus(await callback(payment), 200).RspCode, '00');
  const settled = await snapshot(f);
  expectStatus(await request(`/payments/${payment.paymentId}/sync`, { method: 'POST', token: other.token }), 403, 'FORBIDDEN');
  assert.deepEqual(await snapshot(f), settled);
  // Positive control and AC-F14.13: the owner gets the settled result from the DB, so the 403s above have one cause only.
  const own = expectStatus(await request(`/payments/${payment.paymentId}/sync`, { method: 'POST', token: f.customer.token }), 200);
  assert.deepEqual({ paymentId: own.paymentId, orderStatus: own.orderStatus, status: own.status }, { paymentId: payment.paymentId, orderStatus: 'PAID', status: 'SUCCESS' });
  assert.deepEqual(await snapshot(f), settled);
});

test('INT-T06: successful IPN consumes snapshot once and duplicate is 02', async (t) => {
  const f = await scenario(t);
  const order = await createOrder(f.customer, [item({ quantity: 2 })]);
  const payment = await createPayment(f.customer, order);
  assert.equal(expectStatus(await callback(payment), 200).RspCode, '00');
  assert.equal((await detail(f.customer, order)).status, 'PAID');
  assert.deepEqual(await balance(f), { onHand: '940', reserved: '0' });
  const before = await snapshot(f);
  assert.equal(expectStatus(await callback(payment), 200).RspCode, '02');
  assert.deepEqual(await snapshot(f), before);
});

test('INT-T06: after PAID the same key and method replays SUCCESS, a new key cannot charge again (AC-F16.1, AC-F16.4)', async (t) => {
  const f = await scenario(t);
  const order = await createOrder(f.customer);
  const key = randomUUID();
  const payment = await createPayment(f.customer, order, key);
  assert.equal(expectStatus(await callback(payment), 200).RspCode, '00');
  const before = await snapshot(f);
  const replay = expectStatus(await payRequest(f.customer, order.id, key), 200);
  assert.equal(replay.paymentId, payment.paymentId);
  assert.equal(replay.orderId, order.id);
  assert.equal(replay.orderStatus, 'PAID');
  assert.equal(replay.amount, payment.amount);
  assert.equal(replay.status, 'SUCCESS');
  assert.equal(Object.hasOwn(replay, 'paymentUrl'), false, 'A SUCCESS replay must not create a payment URL');
  assert.deepEqual(await snapshot(f), before);
  expectStatus(await payRequest(f.customer, order.id, randomUUID()), 409, 'ORDER_NOT_PAYABLE');
  assert.deepEqual(await snapshot(f), before, 'No second Payment may be created for a PAID order');
  // AC-F16.1: the same key with another method is a new request, and a PAID order is not payable.
  expectStatus(await payRequest(f.customer, order.id, key, 'WALLET'), 409, 'ORDER_NOT_PAYABLE');
  assert.deepEqual(await snapshot(f), before);
  assert.equal(await f.read((db) => db.payment.count({ where: { orderId: order.id } })), 1);
});

test('INT-T07: bad signature, wrong amount and unknown reference return 97/04/01 without writes', async (t) => {
  const f = await scenario(t);
  const payment = await createPayment(f.customer, await createOrder(f.customer));
  const before = await snapshot(f);
  const bad = callbackParams(payment);
  bad.vnp_SecureHash = '0'.repeat(128);
  assert.equal(expectStatus(await request(`/payments/vnpay/ipn?${new URLSearchParams(bad)}`), 200).RspCode, '97');
  assert.deepEqual(await snapshot(f), before);
  assert.equal(expectStatus(await callback(payment, { vnp_Amount: '100' }), 200).RspCode, '04');
  assert.deepEqual(await snapshot(f), before);
  assert.equal(expectStatus(await callback(payment, { vnp_TxnRef: `unknown-${randomUUID()}` }), 200).RspCode, '01');
  assert.deepEqual(await snapshot(f), before);
});

test('INT-T08: failed payment keeps reservation; retry succeeds without reserving twice', async (t) => {
  const f = await scenario(t);
  const order = await createOrder(f.customer);
  const payment = await createPayment(f.customer, order);
  assert.equal(expectStatus(await callback(payment, { vnp_ResponseCode: '24', vnp_TransactionStatus: '02' }), 200).RspCode, '00');
  assert.equal((await detail(f.customer, order)).status, 'PAYMENT_FAILED');
  assert.deepEqual(await balance(f), { onHand: '1000', reserved: '30' });
  const retry = await createPayment(f.customer, order);
  assert.notEqual(retry.paymentId, payment.paymentId);
  assert.equal((await detail(f.customer, order)).status, 'PENDING');
  assert.deepEqual(await balance(f), { onHand: '1000', reserved: '30' });
  assert.equal(expectStatus(await callback(retry), 200).RspCode, '00');
  assert.equal((await detail(f.customer, order)).status, 'PAID');
  assert.deepEqual(await balance(f), { onHand: '970', reserved: '0' });
});

test('INT-T09: cancellation releases once, pending payment blocks and paid customer cancellation is forbidden', async (t) => {
  const f = await scenario(t);
  const order = await createOrder(f.customer);
  assert.equal(expectStatus(await transition(f.customer, order, 'CANCELLED'), 200).status, 'CANCELLED');
  assert.deepEqual(await balance(f), { onHand: '1000', reserved: '0' });
  let before = await snapshot(f);
  expectStatus(await transition(f.customer, order, 'CANCELLED'), 409, 'INVALID_ORDER_TRANSITION');
  assert.deepEqual(await snapshot(f), before);
  const pending = await createOrder(f.customer);
  await createPayment(f.customer, pending);
  before = await snapshot(f);
  expectStatus(await transition(f.customer, pending, 'CANCELLED'), 409, 'PAYMENT_IN_PROGRESS');
  assert.deepEqual(await snapshot(f), before);
  const paid = await createOrder(f.customer);
  await payOrder(f, paid);
  before = await snapshot(f);
  expectStatus(await transition(f.customer, paid, 'CANCELLED'), 403, 'FORBIDDEN');
  assert.deepEqual(await snapshot(f), before);
});

test('INT-T09: Customer B cannot cancel Customer A order (AC-F25.2, AC-N05.3)', async (t) => {
  const f = await scenario(t);
  const other = await createUser(f);
  const order = await createOrder(f.customer);
  const before = await snapshot(f);
  expectStatus(await transition(other, order, 'CANCELLED'), 403, 'FORBIDDEN');
  assert.deepEqual(await snapshot(f), before);
  assert.deepEqual(await balance(f), { onHand: '1000', reserved: '30' });
  assert.equal((await detail(f.customer, order)).status, 'PENDING');
});

test('INT-T09: Customer B cannot read, pay or cancel a PAYMENT_FAILED order of Customer A (AC-N05.3)', async (t) => {
  const f = await scenario(t);
  const other = await createUser(f);
  const order = await createOrder(f.customer);
  const payment = await createPayment(f.customer, order);
  assert.equal(expectStatus(await callback(payment, { vnp_ResponseCode: '24', vnp_TransactionStatus: '02' }), 200).RspCode, '00');
  assert.equal((await detail(f.customer, order)).status, 'PAYMENT_FAILED');
  const before = await snapshot(f);
  expectStatus(await request(`/orders/${order.id}`, { token: other.token }), 403, 'FORBIDDEN');
  expectStatus(await payRequest(other, order.id, randomUUID()), 403, 'FORBIDDEN');
  expectStatus(await transition(other, order, 'CANCELLED'), 403, 'FORBIDDEN');
  expectStatus(await request(`/payments/${payment.paymentId}/sync`, { method: 'POST', token: other.token }), 403, 'FORBIDDEN');
  assert.deepEqual(await snapshot(f), before);
  assert.equal((await detail(f.customer, order)).status, 'PAYMENT_FAILED');
  // Positive control and AC-F14.13: the owner gets the FAILED result from the DB, so the 403 above has one cause only.
  const own = expectStatus(await request(`/payments/${payment.paymentId}/sync`, { method: 'POST', token: f.customer.token }), 200);
  assert.deepEqual({ paymentId: own.paymentId, orderStatus: own.orderStatus, status: own.status }, { paymentId: payment.paymentId, orderStatus: 'PAYMENT_FAILED', status: 'FAILED' });
  assert.deepEqual(await snapshot(f), before);
});

test('INT-T10: return checks signature but never settles payment or changes DB', async (t) => {
  const f = await scenario(t);
  const payment = await createPayment(f.customer, await createOrder(f.customer));
  const before = await snapshot(f);
  assert.equal(expectStatus(await callback(payment, {}, 'return'), 200).valid, true);
  assert.deepEqual(await snapshot(f), before);
  const bad = callbackParams(payment);
  bad.vnp_SecureHash = '0'.repeat(128);
  assert.equal(expectStatus(await request(`/payments/vnpay/return?${new URLSearchParams(bad)}`), 200).valid, false);
  assert.deepEqual(await snapshot(f), before);
});

test('INT-T11a: Barista fulfills paid orders in sequence and rejects invalid transition', async (t) => {
  const f = await scenario(t);
  const paid = await createOrder(f.customer);
  await payOrder(f, paid);
  const paidBefore = await snapshot(f);
  expectStatus(await transition(f.barista, paid, 'READY'), 409, 'INVALID_ORDER_TRANSITION');
  assert.deepEqual(await snapshot(f), paidBefore);
  for (const status of ['PREPARING', 'READY', 'COMPLETED']) {
    assert.equal(expectStatus(await transition(f.barista, paid, status), 200).status, status);
    assert.equal((await detail(f.customer, paid)).status, status);
  }
});

test('INT-T11a: Customer cannot drive PREPARING, READY or COMPLETED on own order (AC-F24.2)', async (t) => {
  const f = await scenario(t);
  const order = await createOrder(f.customer);
  const expectForbidden = async (label) => {
    const before = await snapshot(f);
    for (const status of ['PREPARING', 'READY', 'COMPLETED']) {
      expectStatus(await transition(f.customer, order, status), 403, 'FORBIDDEN');
      assert.deepEqual(await snapshot(f), before, `${label}: Customer ${status} must change nothing`);
    }
  };
  await expectForbidden('PENDING');
  await payOrder(f, order);
  await expectForbidden('PAID');
  expectStatus(await transition(f.barista, order, 'PREPARING'), 200);
  await expectForbidden('PREPARING');
  expectStatus(await transition(f.barista, order, 'READY'), 200);
  await expectForbidden('READY');
  assert.equal((await detail(f.customer, order)).status, 'READY');
  expectStatus(await request(`/orders/${order.id}`, { method: 'PATCH', body: { status: 'PREPARING' } }), 401, 'UNAUTHORIZED');
});

test('INT-T11b: Barista cannot cancel an unpaid order', async (t) => {
  const f = await scenario(t);
  const unpaid = await createOrder(f.customer);
  const before = await snapshot(f);
  expectStatus(await transition(f.barista, unpaid, 'CANCELLED'), 403, 'FORBIDDEN');
  assert.deepEqual(await snapshot(f), before);
});

test('INT-T12: customers see only own orders and Barista can view either owner', async (t) => {
  const f = await scenario(t);
  const other = await createUser(f);
  const mine = await createOrder(f.customer);
  const theirs = await createOrder(other);
  const ownList = expectStatus(await request('/orders/me', { token: f.customer.token }), 200);
  const otherList = expectStatus(await request('/orders/me', { token: other.token }), 200);
  assert.deepEqual(ownList.map((row) => row.id), [mine.id]);
  assert.deepEqual(otherList.map((row) => row.id), [theirs.id]);
  expectStatus(await request(`/orders/${theirs.id}`, { token: f.customer.token }), 403, 'FORBIDDEN');
  expectStatus(await request(`/orders/${mine.id}`, { token: other.token }), 403, 'FORBIDDEN');
  assert.equal((await detail(f.barista, mine)).id, mine.id);
  assert.equal((await detail(f.barista, theirs)).id, theirs.id);
  expectStatus(await request('/orders/unknown-order', { token: f.customer.token }), 404, 'ORDER_NOT_FOUND');
  // Also once paid, the state most orders end up in (AC-N05.3).
  await payOrder(f, mine);
  expectStatus(await request(`/orders/${mine.id}`, { token: other.token }), 403, 'FORBIDDEN');
});

test('INT-T11b: Barista cannot cancel a PAYMENT_FAILED order', async (t) => {
  const f = await scenario(t);
  const failed = await createOrder(f.customer);
  const payment = await createPayment(f.customer, failed);
  assert.equal(expectStatus(await callback(payment, { vnp_ResponseCode: '24', vnp_TransactionStatus: '02' }), 200).RspCode, '00');
  assert.equal((await detail(f.customer, failed)).status, 'PAYMENT_FAILED');
  const before = await snapshot(f);
  expectStatus(await transition(f.barista, failed, 'CANCELLED'), 403, 'FORBIDDEN');
  assert.deepEqual(await snapshot(f), before);
});

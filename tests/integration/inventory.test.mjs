import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import { balance, createOrder, expectStatus, moveStock, payOrder, request, runSeed, saveRecipe, scenario, snapshot } from './helpers.mjs';

test('INT-T13: audited RECEIVE/ADJUST require reasons and reject counts below reservations', async (t) => {
  const f = await scenario(t);
  for (const kind of ['RECEIVE', 'ADJUST']) {
    for (const reason of [undefined, '', '   ']) {
      const before = await snapshot(f);
      expectStatus(await request('/inventory/ingredients/espresso/movements', { method: 'POST', token: f.barista.token, body: { kind, quantity: '50', unit: 'ml', ...(reason === undefined ? {} : { reason }) } }), 400, 'VALIDATION_ERROR');
      assert.deepEqual(await snapshot(f), before);
    }
  }
  const deliveryReason = `INT-T13 delivery ${randomUUID()}`;
  const countReason = `INT-T13 physical count ${randomUUID()}`;
  await moveStock(f.barista, 'espresso', 'RECEIVE', '75', 'ml', deliveryReason);
  assert.deepEqual(await balance(f), { onHand: '1075', reserved: '0' });
  await moveStock(f.barista, 'espresso', 'ADJUST', '500', 'ml', countReason);
  assert.deepEqual(await balance(f), { onHand: '500', reserved: '0' });
  const movements = expectStatus(await request('/inventory/movements', { token: f.barista.token }), 200);
  for (const [reason, kind, quantity, after] of [
    [deliveryReason, 'RECEIVE', '75', '1075'], [countReason, 'ADJUST', '-575', '500'],
  ]) {
    const movement = movements.find((row) => row.reason === reason);
    assert.ok(movement, 'Audited movement must be visible');
    assert.equal(movement.actorId, f.barista.id);
    assert.equal(movement.actor.email, f.barista.email);
    assert.equal(movement.ingredientId, 'espresso');
    assert.equal(movement.kind, kind);
    assert.equal(movement.quantity, quantity);
    assert.equal(movement.onHandAfter, after);
    assert.ok(Number.isFinite(Date.parse(movement.createdAt)));
  }
  await createOrder(f.customer);
  const before = await snapshot(f);
  expectStatus(await request('/inventory/ingredients/espresso/movements', { method: 'POST', token: f.barista.token, body: { kind: 'ADJUST', quantity: '29', unit: 'ml', reason: 'Too low' } }), 409, 'BELOW_RESERVED');
  assert.deepEqual(await snapshot(f), before);
});

test('INT-T14: full recipe replacement preserves held snapshot and validates exclusive selectors', async (t) => {
  const f = await scenario(t);
  const held = await createOrder(f.customer);
  const original = await f.read((db) => db.orderIngredient.findMany({ where: { orderId: held.id } }));
  await saveRecipe(f, { productId: 'americano', size: 'S', lines: [
    { ingredientId: 'espresso', quantity: '60', unit: 'ml' }, { ingredientId: 'whole-milk', quantity: '10', unit: 'ml' },
  ] });
  const replaced = await saveRecipe(f, { productId: 'americano', size: 'S', lines: [{ ingredientId: 'espresso', quantity: '45', unit: 'ml' }] });
  assert.deepEqual(replaced.lines.map((line) => [line.ingredientId, line.quantity]), [['espresso', '45']]);
  const recipes = expectStatus(await request('/inventory/recipes', { token: f.barista.token }), 200);
  assert.deepEqual(recipes.find((recipe) => recipe.productId === 'americano' && recipe.size === 'S').lines.map((line) => [line.ingredientId, line.quantity]), [['espresso', '45']]);
  assert.deepEqual(await f.read((db) => db.orderIngredient.findMany({ where: { orderId: held.id } })), original);
  assert.deepEqual(await balance(f), { onHand: '1000', reserved: '30' });
  await createOrder(f.customer);
  assert.deepEqual(await balance(f), { onHand: '1000', reserved: '75' });
  await payOrder(f, held);
  assert.deepEqual(await balance(f), { onHand: '970', reserved: '45' });
  const topping = await saveRecipe(f, { topping: 'Trân châu', lines: [{ ingredientId: 'cooked-pearls', quantity: '25', unit: 'g' }] });
  assert.equal(topping.lines[0].quantity, '25');
  for (const selector of [{}, { productId: 'americano', size: 'S', topping: 'Trân châu' }]) {
    const before = await snapshot(f);
    expectStatus(await request('/inventory/recipes', { method: 'PUT', token: f.barista.token, body: { ...selector, lines: [{ ingredientId: 'espresso', quantity: '30', unit: 'ml' }] } }), 400, 'VALIDATION_ERROR');
    assert.deepEqual(await snapshot(f), before);
  }
});

test('INT-T15: actual seed twice preserves received balance, edited recipe and held inventory without duplicates', async (t) => {
  const f = await scenario(t);
  await moveStock(f.barista, 'espresso', 'RECEIVE', '37', 'ml', 'INT-T15 preserved delivery');
  await saveRecipe(f, { productId: 'americano', size: 'S', lines: [{ ingredientId: 'espresso', quantity: '45', unit: 'ml' }] });
  await createOrder(f.customer);
  assert.deepEqual(await balance(f), { onHand: '1037', reserved: '45' });
  const before = await snapshot(f);
  const catalogBefore = expectStatus(await request('/products'), 200);
  for (let iteration = 0; iteration < 2; iteration++) {
    await runSeed();
    assert.deepEqual(await snapshot(f), before, `Seed run ${iteration + 1} must preserve all stored inventory/order data`);
    const catalog = expectStatus(await request('/products'), 200); // read after this seed run
    assert.deepEqual(catalog, catalogBefore);
    const ingredients = expectStatus(await request('/inventory/ingredients', { token: f.barista.token }), 200);
    const recipes = expectStatus(await request('/inventory/recipes', { token: f.barista.token }), 200);
    assert.equal(catalog.length, 8);
    assert.equal(new Set(catalog.map((row) => row.id)).size, 8);
    assert.equal(new Set(catalog.map((row) => row.name)).size, 8);
    assert.equal(ingredients.length, 15);
    assert.equal(new Set(ingredients.map((row) => row.name)).size, 15);
    assert.equal(recipes.length, 27);
    assert.equal(new Set(recipes.map((row) => row.topping ?? `${row.productId}:${row.size}`)).size, 27);
    for (const recipe of recipes) assert.equal(new Set(recipe.lines.map((line) => line.ingredientId)).size, recipe.lines.length);
  }
});

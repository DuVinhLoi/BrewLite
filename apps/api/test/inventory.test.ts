// UNIT-T05: SRS FR-13 Matcha example and BR-03 aggregate ingredient demand.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BadRequestException } from '@nestjs/common';
import { Prisma, type Ingredient } from '@prisma/client';
import { calculateAvailability, canonicalQuantity } from '../src/inventory/inventory';
import type { ItemInput } from '../src/checkout/pricing';

type Recipe = Parameters<typeof calculateAvailability>[1][number];
const decimal = (value: string) => new Prisma.Decimal(value);
const ingredients: Ingredient[] = [
  { id: 'matcha', name: 'Matcha', unit: 'g', tracked: true, onHand: decimal('20'), reserved: decimal('0') },
  { id: 'milk', name: 'Milk', unit: 'ml', tracked: true, onHand: decimal('2000'), reserved: decimal('0') },
  { id: 'syrup', name: 'Syrup', unit: 'ml', tracked: true, onHand: decimal('200'), reserved: decimal('0') },
  { id: 'water', name: 'Water', unit: 'ml', tracked: false, onHand: decimal('0'), reserved: decimal('0') },
  { id: 'pearls', name: 'Pearls', unit: 'g', tracked: true, onHand: decimal('50'), reserved: decimal('0') },
];
const small: Recipe = {
  id: 'matcha-s', productId: 'matcha-latte', size: 'S', topping: null,
  lines: [
    { ingredientId: 'matcha', quantity: decimal('3') },
    { ingredientId: 'milk', quantity: decimal('150') },
    { ingredientId: 'syrup', quantity: decimal('20') },
    { ingredientId: 'water', quantity: decimal('100') },
  ],
};
const medium: Recipe = {
  id: 'matcha-m', productId: 'matcha-latte', size: 'M', topping: null,
  lines: [
    { ingredientId: 'matcha', quantity: decimal('3.75') },
    { ingredientId: 'milk', quantity: decimal('187.5') },
    { ingredientId: 'syrup', quantity: decimal('25') },
  ],
};
const item: ItemInput = { productId: 'matcha-latte', size: 'S', toppings: [], quantity: 6 };

describe('UNIT-T05 ingredient availability', () => {
  it('sells six Matcha S cups with matcha limiting, ignoring untracked water', () => {
    const { demand, response } = calculateAvailability([item], [small], ingredients);
    assert.equal(response.canOrder, true);
    assert.equal(response.lines[0].cups, 6);
    assert.equal(response.lines[0].sellable, true);
    assert.deepEqual(response.lines[0].limitingIngredients, [{ id: 'matcha', name: 'Matcha', unit: 'g' }]);
    assert.deepEqual([...demand].map(([id, quantity]) => [id, quantity.toString()]), [
      ['matcha', '18'], ['milk', '900'], ['syrup', '120'],
    ]);
    assert.deepEqual(response.shortages, []);
    assert.equal(ingredients[0].onHand.toString(), '20');
    assert.equal(ingredients[0].reserved.toString(), '0');
  });

  it('rejects a seven-cup cart with exact ingredient shortage amounts', () => {
    const { response } = calculateAvailability([{ ...item, quantity: 7 }], [small], ingredients);
    assert.equal(response.canOrder, false);
    assert.equal(response.lines[0].cups, 6);
    assert.deepEqual(response.shortages, [{ ingredientId: 'matcha', name: 'Matcha', unit: 'g', requested: '21', available: '20' }]);
  });

  it('subtracts reservations before calculating capacity and shortages', () => {
    const reserved = ingredients.map((ingredient) => ingredient.id === 'matcha' ? { ...ingredient, reserved: decimal('5') } : ingredient);
    const { response } = calculateAvailability([item], [small], reserved);
    assert.equal(response.lines[0].cups, 5);
    assert.equal(response.canOrder, false);
    assert.deepEqual(response.shortages, [{ ingredientId: 'matcha', name: 'Matcha', unit: 'g', requested: '18', available: '15' }]);
  });

  it('reports all ingredients tied at the limiting capacity', () => {
    const tied = ingredients.map((ingredient) => ingredient.id === 'milk' ? { ...ingredient, onHand: decimal('900') } : ingredient);
    const { response } = calculateAvailability([item], [small], tied);
    assert.equal(response.lines[0].cups, 6);
    assert.deepEqual(response.lines[0].limitingIngredients, [
      { id: 'matcha', name: 'Matcha', unit: 'g' }, { id: 'milk', name: 'Milk', unit: 'ml' },
    ]);
  });

  it('makes a choice unsellable when its tracked ingredient is exhausted', () => {
    const exhausted = ingredients.map((ingredient) => ingredient.id === 'matcha' ? { ...ingredient, reserved: decimal('20') } : ingredient);
    const { response } = calculateAvailability([{ ...item, quantity: 1 }], [small], exhausted);
    assert.equal(response.canOrder, false);
    assert.equal(response.lines[0].sellable, false);
    assert.equal(response.lines[0].cups, 0);
  });

  const unavailable: [string, ItemInput, Recipe[]][] = [
    ['missing base recipe', item, []],
    ['empty base recipe', item, [{ ...small, lines: [] }]],
    ['base without tracked ingredients', item, [{ ...small, lines: [{ ingredientId: 'water', quantity: decimal('100') }] }]],
    ['missing topping recipe', { ...item, toppings: ['Trân châu'] }, [small]],
    ['empty topping recipe', { ...item, toppings: ['Trân châu'] }, [small, { id: 'pearls', productId: null, size: null, topping: 'Trân châu', lines: [] }]],
    ['unknown recipe ingredient', item, [{ ...small, lines: [...small.lines, { ingredientId: 'missing', quantity: decimal('1') }] }]],
    ['nonpositive recipe quantity', item, [{ ...small, lines: [{ ingredientId: 'matcha', quantity: decimal('0') }] }]],
  ];
  for (const [name, selection, recipes] of unavailable) {
    it(`does not sell a choice with ${name}`, () => {
      const { response } = calculateAvailability([selection], recipes, ingredients);
      assert.equal(response.canOrder, false);
      assert.equal(response.lines[0].sellable, false);
      assert.equal(response.lines[0].cups, 0);
      assert.ok(response.lines[0].reason);
    });
  }

  it('adds shared matcha demand across two size variants before approving a cart', () => {
    const { demand, response } = calculateAvailability([
      { ...item, quantity: 4 }, { ...item, size: 'M', quantity: 3 },
    ], [small, medium], ingredients);
    assert.deepEqual(response.lines.map(({ cups, sellable }) => ({ cups, sellable })), [
      { cups: 6, sellable: true }, { cups: 5, sellable: true },
    ]);
    assert.equal(demand.get('matcha')?.toString(), '23.25');
    assert.equal(demand.get('milk')?.toString(), '1162.5');
    assert.equal(response.canOrder, false);
    assert.deepEqual(response.shortages, [{ ingredientId: 'matcha', name: 'Matcha', unit: 'g', requested: '23.25', available: '20' }]);
  });

  it('adds topping pearls to pearls already present in the base recipe', () => {
    const base = { ...small, lines: [...small.lines, { ingredientId: 'pearls', quantity: decimal('10') }] };
    const topping: Recipe = { id: 'pearls', productId: null, size: null, topping: 'Trân châu', lines: [{ ingredientId: 'pearls', quantity: decimal('20') }] };
    const { demand, response } = calculateAvailability([{ ...item, toppings: ['Trân châu'], quantity: 2 }], [base, topping], ingredients);
    assert.equal(demand.get('pearls')?.toString(), '60');
    assert.equal(response.lines[0].cups, 1);
    assert.deepEqual(response.lines[0].limitingIngredients, [{ id: 'pearls', name: 'Pearls', unit: 'g' }]);
    assert.equal(response.canOrder, false);
    assert.deepEqual(response.shortages, [{ ingredientId: 'pearls', name: 'Pearls', unit: 'g', requested: '60', available: '50' }]);
  });
});

describe('UNIT-T05 canonical inventory units', () => {
  const conversions: [string, string, string, string][] = [
    ['1.234', 'kg', 'g', '1234'],
    ['0.125', 'l', 'ml', '125'],
    ['0.001', 'g', 'g', '0.001'],
    ['3', 'piece', 'piece', '3'],
  ];
  for (const [value, unit, canonical, expected] of conversions) {
    it(`converts ${value} ${unit} to ${expected} ${canonical} exactly`, () => {
      assert.equal(canonicalQuantity(value, unit, canonical).toString(), expected);
    });
  }

  const invalid: [string, unknown, string, string][] = [
    ['cross-dimension conversion', '1', 'g', 'ml'],
    ['fractional pieces', '1.5', 'piece', 'piece'],
    ['numeric rather than decimal-string input', 1, 'g', 'g'],
    ['overprecision', '1.0001', 'g', 'g'],
    ['negative quantity', '-1', 'g', 'g'],
    ['zero recipe quantity', '0', 'g', 'g'],
    ['overflow after kg conversion', '999999999999999', 'kg', 'g'],
  ];
  for (const [name, value, unit, canonical] of invalid) {
    it(`rejects ${name}`, () => {
      assert.throws(() => canonicalQuantity(value, unit, canonical), (error: unknown) => {
        assert.ok(error instanceof BadRequestException);
        assert.equal(error.getStatus(), 400);
        assert.equal((error.getResponse() as { code: string }).code, 'VALIDATION_ERROR');
        return true;
      });
    });
  }

  it('allows zero for a physical stock adjustment', () => {
    assert.equal(canonicalQuantity('0', 'g', 'g', true).toString(), '0');
  });
});

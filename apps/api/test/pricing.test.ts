// UNIT-T03: literal prices and validation cases from SRS §3.3, FR-04/12, NFR-06.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BadRequestException } from '@nestjs/common';
import { parseItems, unitPrice, type Size, type Topping } from '../src/checkout/pricing';

const item = { productId: 'cappuccino', size: 'L', toppings: ['Trân châu'], quantity: 2 };
const validationError = (error: unknown) => {
  assert.ok(error instanceof BadRequestException);
  assert.equal(error.getStatus(), 400);
  assert.equal((error.getResponse() as { code: string }).code, 'VALIDATION_ERROR');
  assert.ok((error.getResponse() as { details: string[] }).details.length > 0);
  return true;
};

describe('UNIT-T03 pricing', () => {
  const prices: { size: Size; selected: Topping[]; expected: number }[] = [
    { size: 'S', selected: [], expected: 45000 },
    { size: 'M', selected: [], expected: 50000 },
    { size: 'L', selected: [], expected: 55000 },
    { size: 'L', selected: ['Trân châu'], expected: 62000 },
    { size: 'S', selected: ['Kem phô mai'], expected: 55000 },
    { size: 'S', selected: ['Thạch dừa'], expected: 50000 },
    { size: 'L', selected: ['Trân châu', 'Kem phô mai'], expected: 72000 },
  ];
  for (const { size, selected, expected } of prices) {
    it(`prices Cappuccino ${size} with ${selected.join(', ') || 'no topping'} at ${expected}`, () => {
      assert.equal(unitPrice(45000, size, selected), expected);
    });
  }

  it('prices the SRS two Cappuccino L + pearls example at 124000 VND', () => {
    const [parsed] = parseItems({ items: [item] });
    assert.equal(unitPrice(45000, parsed.size, parsed.toppings) * parsed.quantity, 124000);
  });

  const invalidBodies: [string, unknown][] = [
    ['null body', null],
    ['array body', []],
    ['missing items', {}],
    ['empty cart', { items: [] }],
    ['21 lines', { items: Array(21).fill(item) }],
    ['client total', { items: [item], total: 1 }],
    ['client unitPrice at body level', { items: [item], unitPrice: 1 }],
    ['client unitPrice on a line', { items: [{ ...item, unitPrice: 1 }] }],
    ['client line total', { items: [{ ...item, lineTotal: 1 }] }],
    ['unknown line field', { items: [{ ...item, stock: 99 }] }],
    ['unknown size', { items: [{ ...item, size: 'XL' }] }],
    ['inherited size key', { items: [{ ...item, size: 'toString' }] }],
    ['zero quantity', { items: [{ ...item, quantity: 0 }] }],
    ['negative quantity', { items: [{ ...item, quantity: -1 }] }],
    ['fractional quantity', { items: [{ ...item, quantity: 1.5 }] }],
    ['quantity above 99', { items: [{ ...item, quantity: 100 }] }],
    ['string quantity', { items: [{ ...item, quantity: '2' }] }],
    ['unknown topping', { items: [{ ...item, toppings: ['unknown'] }] }],
    ['duplicate topping', { items: [{ ...item, toppings: ['Trân châu', 'Trân châu'] }] }],
    ['empty product id', { items: [{ ...item, productId: '' }] }],
  ];
  for (const [name, body] of invalidBodies) {
    it(`rejects ${name} with a validation error`, () => {
      assert.throws(() => parseItems(body), validationError);
    });
  }

  it('accepts the 20-line and quantity 1/99 boundaries', () => {
    const items = Array.from({ length: 20 }, (_, index) => ({ ...item, quantity: index === 0 ? 1 : 99 }));
    assert.deepEqual(parseItems({ items }), items);
  });
});

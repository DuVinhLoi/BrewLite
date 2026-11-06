import { describe, expect, it } from 'vitest';
import { addLine, cartKey, cartTotal, priceFor } from './shop';
import { line, options, product } from '@/test/helpers';

describe('UNIT-T11 cart arithmetic and identity (FR-05–FR-07)', () => {
  it('totals independent quantities and prices, including an empty cart', () => {
    expect(cartTotal([])).toBe(0);
    expect(cartTotal([line, { ...line, key: 'americano', unitPrice: 45000, quantity: 1 }])).toBe(169000);
    expect(cartTotal([{ ...line, quantity: 3 }])).toBe(186000);
  });
  it('adds every size and topping surcharge', () => {
    expect(priceFor(product, 'L', ['Trân châu', 'Kem phô mai'], options)).toBe(72000);
    expect(priceFor(product, 'S', [], options)).toBe(45000);
  });
  it('identifies the same topping set regardless of selection order', () => {
    expect(cartKey('cappuccino', 'L', ['Trân châu', 'Kem phô mai'])).toBe('["cappuccino","L",["Kem phô mai","Trân châu"]]');
    expect(cartKey('cappuccino', 'L', ['Kem phô mai', 'Trân châu'])).toBe('["cappuccino","L",["Kem phô mai","Trân châu"]]');
  });
  it('merges matching choices without mutating the original cart', () => {
    const original = [{ ...line }];
    expect(addLine(original, { ...line, quantity: 3 })).toEqual([{ ...line, quantity: 5 }]);
    expect(original[0].quantity).toBe(2);
  });
  it.each([{ ...line, key: 'different-size', size: 'S' }, { ...line, key: 'different-topping', toppings: [] }])('keeps a distinct choice in a separate line ($key)', (next) => {
    expect(addLine([line], next)).toEqual([line, next]);
  });
  it('allows 99 cups but rejects a merge above 99', () => {
    expect(addLine([{ ...line, quantity: 98 }], { ...line, quantity: 1 })[0].quantity).toBe(99);
    expect(() => addLine([{ ...line, quantity: 99 }], { ...line, quantity: 1 })).toThrow('Mỗi dòng tối đa 99 ly');
  });
  it('rejects a 21st line while still allowing a merge at 20 lines', () => {
    const cart = Array.from({ length: 20 }, (_, index) => ({ ...line, key: String(index), quantity: 1 }));
    expect(() => addLine(cart, line)).toThrow('Giỏ hàng tối đa 20 món');
    expect(addLine(cart, { ...line, key: '0', quantity: 1 })[0].quantity).toBe(2);
  });
});

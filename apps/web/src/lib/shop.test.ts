import { describe, expect, it } from 'vitest';
import { addLine, cartKey, cartTotal, priceFor, type CartLine } from './shop';
const line: CartLine = { key: cartKey('cappuccino', 'L', ['Trân châu']), productId: 'cappuccino', name: 'Cappuccino', size: 'L', toppings: ['Trân châu'], quantity: 1, unitPrice: 62000 };
describe('UNIT-S2-04: cart and price', () => {
  it('uses options returned by the API', () => {
    expect(priceFor({ id: 'cappuccino', name: '', description: '', price: 45000, imageUrl: '', stock: 30 }, 'L', ['Trân châu'], { sizes: { L: 10000 }, toppings: { 'Trân châu': 7000 } })).toBe(62000);
  });
  it('merges identical options and calculates 124000', () => {
    const cart = addLine([line], line); expect(cart).toHaveLength(1); expect(cartTotal(cart)).toBe(124000);
  });
  it('normalizes topping order but distinguishes size and toppings', () => {
    expect(cartKey('x', 'M', ['a', 'b'])).toBe(cartKey('x', 'M', ['b', 'a']));
    const other = { ...line, size: 'M', key: cartKey(line.productId, 'M', line.toppings) };
    expect(addLine([line], other)).toHaveLength(2);
    expect(cartKey('x', 'M', [])).not.toBe(cartKey('x', 'M', ['a']));
  });
  it('enforces quantity and line limits', () => {
    expect(() => addLine([{ ...line, quantity: 99 }], line)).toThrow();
    expect(() => addLine(Array.from({ length: 20 }, (_, i) => ({ ...line, key: String(i) })), line)).toThrow();
  });
});
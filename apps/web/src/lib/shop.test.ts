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
  it('P1-CART-01: refuses a new line after 20 with exact copy', () => {
    const full = Array.from({ length: 20 }, (_, i) => ({
      ...line, productId: `other-${i}`, key: cartKey(`other-${i}`, 'L', ['Trân châu']),
    }));
    expect(() => addLine(full, line)).toThrow('Giỏ hàng tối đa 20 món');
    expect(full).toHaveLength(20);
  });
  it('P1-CART-02: merges an existing key even with 20 lines', () => {
    const full = [line, ...Array.from({ length: 19 }, (_, i) => ({
      ...line, productId: `other-${i}`, key: cartKey(`other-${i}`, 'L', ['Trân châu']),
    }))];
    const result = addLine(full, { ...line, quantity: 2 });
    expect(result).toHaveLength(20);
    expect(result[0].quantity).toBe(3);
    expect(full[0].quantity).toBe(1);
  });
  it('P1-CART-03: permits 99 and rejects 100 on an existing line', () => {
    expect(addLine([{ ...line, quantity: 98 }], line)[0].quantity).toBe(99);
    expect(() => addLine([{ ...line, quantity: 99 }], line))
      .toThrow('Mỗi dòng tối đa 99 ly');
  });
});
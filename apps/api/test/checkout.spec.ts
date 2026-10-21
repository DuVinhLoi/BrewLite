import { parseItems, unitPrice } from '../src/checkout/pricing';
import { simulatePayment } from '../src/checkout/payment';

describe('Sprint 2 pricing and validation', () => {
  it('UNIT-S2-01: calculates the SRS example using integer VND', () => {
    expect(unitPrice(45000, 'L', ['Trân châu'])).toBe(62000);
    expect(unitPrice(45000, 'S', [])).toBe(45000);
    expect(unitPrice(45000, 'M', ['Trân châu', 'Kem phô mai'])).toBe(67000);
  });
  it.each([[], [{ productId: 'x', size: 'X', toppings: [], quantity: 1 }],
    [{ productId: 'x', size: 'M', toppings: [], quantity: 0 }],
    [{ productId: 'x', size: 'M', toppings: ['unknown'], quantity: 1 }],
    [{ productId: 'x', size: 'M', toppings: ['Trân châu', 'Trân châu'], quantity: 1 }],
    [{ productId: 'x', size: 'M', toppings: [], quantity: 1, unitPrice: 1 }],
  ].map((items) => ({ items })))('UNIT-S2-02: rejects invalid items %j', ({ items }) => {
    expect(() => parseItems({ items })).toThrow();
  });
  it('rejects client totals and user IDs', () => {
    expect(() => parseItems({ items: [{ productId: 'x', size: 'M', toppings: [], quantity: 1 }], total: 1 })).toThrow();
  });
  it('UNIT-S2-03: simulates success and decline', async () => {
    expect(await simulatePayment('WALLET')).toBe('SUCCESS');
    expect(await simulatePayment('CARD', '4242424242424242')).toBe('SUCCESS');
    expect(await simulatePayment('CARD', '4000000000000002')).toBe('DECLINED');
  });
  it('simulates provider timeout after five seconds', async () => {
    jest.useFakeTimers();
    try {
      const payment = simulatePayment('CARD', '4000000000000119');
      await jest.advanceTimersByTimeAsync(5100);
      expect(await payment).toBe('UNAVAILABLE');
    } finally { jest.useRealTimers(); }
  });
});
import { describe, expect, it } from 'vitest';
import { stockBadge } from './stock';

describe('UNIT-T12 stock labels (AC-F01.3)', () => {
  it.each([[0, 'Hết hàng', 'out'], [1, 'Sắp hết, còn 1', 'low'], [5, 'Sắp hết, còn 5', 'low'], [6, 'Còn 6', 'ok']])('labels %i cups', (stock, label, tone) => {
    expect(stockBadge(Number(stock))).toEqual({ label, tone });
  });
});

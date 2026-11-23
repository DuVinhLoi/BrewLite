import { describe, expect, it } from 'vitest';
import { stockBadge } from './stock';

// Only the tone is asserted: AC-F01.3 forbids showing cup counts, and the UI does not use the badge label.
describe('UNIT-T12 stock tone', () => {
  it.each([[0, 'out'], [1, 'low'], [5, 'low'], [6, 'ok'], [8, 'ok']] as const)('classifies %i cups as %s', (stock, tone) => {
    expect(stockBadge(stock).tone).toBe(tone);
  });
});

import { describe, expect, it } from 'vitest';
import { formatVnd } from './format';

describe('UNIT-T10 VND formatting (FR-07)', () => {
  it.each([[0, '0đ'], [45000, '45.000đ'], [124000, '124.000đ'], [1234567, '1.234.567đ']])('formats %i as %s', (amount, expected) => {
    expect(formatVnd(amount)).toBe(expected);
  });
});

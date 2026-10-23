import { describe, expect, it } from 'vitest';
import { LOW_STOCK, stockBadge } from './stock';

describe('UNIT-T02: stockBadge', () => {
  it('trả nhãn "Hết hàng" khi stock = 0', () => {
    expect(stockBadge(0)).toEqual({ label: 'Hết hàng', tone: 'out' });
  });

  it('trả nhãn "Sắp hết, còn N" khi stock <= LOW_STOCK', () => {
    expect(LOW_STOCK).toBe(5);
    expect(stockBadge(3)).toEqual({ label: 'Sắp hết, còn 3', tone: 'low' });
    expect(stockBadge(5)).toEqual({ label: 'Sắp hết, còn 5', tone: 'low' });
  });

  it('trả nhãn "Còn N" khi stock > LOW_STOCK', () => {
    expect(stockBadge(30)).toEqual({ label: 'Còn 30', tone: 'ok' });
  });
});

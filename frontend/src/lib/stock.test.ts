import { describe, expect, test } from 'vitest';
import { LOW_STOCK, stockBadge } from './stock';

describe('stock.ts: nhãn tồn kho dùng chung (menu khách)', () => {
  test('LOW_STOCK = 3', () => {
    expect(LOW_STOCK).toBe(3);
  });

  test('stockBadge: <= 0 hết hàng, <= LOW_STOCK sắp hết, còn lại bình thường', () => {
    expect(stockBadge(-1)).toEqual({ label: 'Hết hàng', tone: 'out' });
    expect(stockBadge(0)).toEqual({ label: 'Hết hàng', tone: 'out' });
    expect(stockBadge(1)).toEqual({ label: 'Sắp hết', tone: 'low' });
    expect(stockBadge(LOW_STOCK)).toEqual({ label: 'Sắp hết', tone: 'low' });
    expect(stockBadge(LOW_STOCK + 1)).toEqual({ label: 'Còn hàng', tone: 'ok' });
  });
});

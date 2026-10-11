import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { LOW_STOCK, stockBadge } from './stock';
import * as admin from './admin';

describe('stock.ts: nhãn tồn kho dùng chung (menu khách và màn Kho)', () => {
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

  test('lib/admin.ts re-export đúng hai thứ này (import cũ của trang admin và test giữ nguyên)', () => {
    expect(admin.stockBadge).toBe(stockBadge);
    expect(admin.LOW_STOCK).toBe(LOW_STOCK);
  });

  test('ProductCard (menu khách) không import lib/admin (client gọi API admin)', () => {
    const src = readFileSync(path.resolve(__dirname, '../components/ProductCard.tsx'), 'utf8');
    expect(src).not.toMatch(/from\s+['"]@\/lib\/admin['"]/);
    expect(src).toMatch(/from\s+['"]@\/lib\/stock['"]/);
  });
});

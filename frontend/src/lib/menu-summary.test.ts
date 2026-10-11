import { describe, expect, test } from 'vitest';
import { menuSummary } from './menu-summary';
import type { Product } from './types';

// Dòng "N món / giá từ X" ở hero Menu: N và X tính từ GET /products (ui-visual-plan.md §2.2, §6 mục 2).
const p = (id: string, price: number, stock = 10): Product => ({ id, name: id, price, stock });

describe('menuSummary', () => {
  test('menu rỗng: null (hero không hiện dòng tóm tắt)', () => {
    expect(menuSummary([])).toBeNull();
  });

  test('N là số món trong danh sách', () => {
    expect(menuSummary([p('a', 35000), p('b', 40000), p('c', 45000), p('d', 39000)])?.count).toBe(4);
  });

  test('X là giá thấp nhất', () => {
    expect(menuSummary([p('a', 35000), p('b', 40000)])?.minPrice).toBe(35000);
  });

  test('giá không theo thứ tự vẫn ra giá thấp nhất', () => {
    expect(menuSummary([p('a', 45000), p('b', 39000), p('c', 52000), p('d', 41000)])).toEqual({ count: 4, minPrice: 39000 });
  });

  test('một món: N = 1, X = giá món đó', () => {
    expect(menuSummary([p('a', 42000)])).toEqual({ count: 1, minPrice: 42000 });
  });
});

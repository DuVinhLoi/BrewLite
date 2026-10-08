import { beforeEach, describe, expect, test } from 'vitest';
import { useCart } from './cart';
import type { Product } from '@/lib/types';

const latte: Product = { id: 'p1', name: 'Latte', price: 30000, stock: 10 };

function state() {
  return useCart.getState();
}

beforeEach(() => {
  localStorage.clear();
  state().clear();
});

describe('addItem', () => {
  test('mặc định size M, qty 1, key persist đúng', () => {
    state().addItem(latte);
    const s = state();
    expect(s.items).toHaveLength(1);
    expect(s.items[0].key).toBe('p1|M|');
    expect(s.items[0].unitPrice).toBe(35000);
    expect(s.items[0].lineTotal).toBe(35000);
    expect(s.count).toBe(1);
    expect(s.total).toBe(35000);
  });

  test('size/topping đổi giá và tách dòng', () => {
    state().addItem(latte, { size: 'L', toppings: ['Trân châu', 'Kem cheese'] });
    const s = state();
    // 30000 + 10000 + 5000 + 8000
    expect(s.items[0].unitPrice).toBe(53000);
    expect(s.items[0].toppings).toEqual(['Kem cheese', 'Trân châu']);
    state().addItem(latte, { size: 'S', toppings: [] });
    expect(state().items).toHaveLength(2);
  });

  test('cùng key thì gộp số lượng, khác thứ tự topping vẫn gộp', () => {
    state().addItem(latte, { toppings: ['Kem cheese', 'Trân châu'], quantity: 2 });
    state().addItem(latte, { toppings: ['Trân châu', 'Kem cheese'], quantity: 3 });
    const s = state();
    expect(s.items).toHaveLength(1);
    expect(s.items[0].quantity).toBe(5);
    expect(s.count).toBe(5);
  });

  test('chặn vượt tồn kho, hết hàng thì không thêm', () => {
    const low: Product = { ...latte, id: 'p2', stock: 2 };
    state().addItem(low, { quantity: 5 });
    expect(state().items[0].quantity).toBe(2);
    state().addItem(low, { quantity: 5 });
    expect(state().items[0].quantity).toBe(2);

    const empty: Product = { ...latte, id: 'p3', stock: 0 };
    state().clear();
    state().addItem(empty);
    expect(state().items).toHaveLength(0);
  });
});

describe('updateQty / removeItem / total', () => {
  test('đổi qty tính lại lineTotal + total + count', () => {
    state().addItem(latte, { quantity: 2 }); // 2 x 35000
    const key = state().items[0].key;
    state().addItem({ ...latte, id: 'p2', name: 'Capu' }, { size: 'S', quantity: 1 }); // 30000
    expect(state().total).toBe(100000);

    state().updateQty(key, 3);
    expect(state().items[0].lineTotal).toBe(105000);
    expect(state().total).toBe(135000);
    expect(state().count).toBe(4);
  });

  test('qty tối thiểu 1, lẻ thì floor', () => {
    state().addItem(latte);
    const key = state().items[0].key;
    state().updateQty(key, 0);
    expect(state().items[0].quantity).toBe(1);
    state().updateQty(key, 2.9);
    expect(state().items[0].quantity).toBe(2);
  });

  test('removeItem và clear', () => {
    state().addItem(latte);
    const key = state().items[0].key;
    state().removeItem(key);
    expect(state().items).toHaveLength(0);
    expect(state().total).toBe(0);
    expect(state().count).toBe(0);

    state().addItem(latte, { quantity: 2 });
    state().clear();
    expect(state().items).toHaveLength(0);
  });
});

describe('persist key', () => {
  test('dùng key brewlite-cart và ghi localStorage', () => {
    expect(useCart.persist.getOptions().name).toBe('brewlite-cart');
    state().addItem(latte);
    const raw = localStorage.getItem('brewlite-cart');
    expect(raw).not.toBeNull();
    expect(raw!).toContain('p1');
  });
});

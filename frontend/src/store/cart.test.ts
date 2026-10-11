import { beforeEach, describe, expect, test } from 'vitest';
import { MAX_LINES, MAX_QTY, useCart } from './cart';
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

  // POST /orders giới hạn quantity 1..99 mỗi dòng (DTO @Max(99)); giỏ không được vượt để khỏi gặp lỗi 400 lúc trả tiền
  test('qty tối đa 99 mỗi dòng, cả khi thêm lẫn khi bấm +', () => {
    const big: Product = { ...latte, stock: 500 };
    expect(state().addItem(big, { quantity: 99 })).toEqual({ ok: true });
    const key = state().items[0].key;
    expect(state().items[0].quantity).toBe(99);
    expect(state().addItem(big, { quantity: 5 })).toEqual({ ok: false, reason: 'MAX_QTY' });
    expect(state().items[0].quantity).toBe(99);
    state().updateQty(key, 50);
    state().updateQty(key, 150);
    expect(state().items[0].quantity).toBe(99);
    expect(state().items[0].lineTotal).toBe(99 * 35000);
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

// Khớp @ArrayMaxSize(20) và @Max(99) của CreateOrderDto: giỏ từ chối thay vì để backend trả 400 lúc trả tiền
describe('addItem: giới hạn 20 dòng và 99 ly', () => {
  const big: Product = { ...latte, stock: 500 };
  const distinct = (n: number): Product[] =>
    Array.from({ length: n }, (_, i) => ({ ...big, id: `d${i}`, name: `Món ${i}` }));

  test('hằng số khớp backend', () => {
    expect(MAX_LINES).toBe(20);
    expect(MAX_QTY).toBe(99);
  });

  test('đường ok trả { ok: true } và cập nhật count/total như trước', () => {
    expect(state().addItem(latte, { quantity: 2 })).toEqual({ ok: true });
    expect(state().count).toBe(2);
    expect(state().total).toBe(70000);
  });

  test('dòng thứ 20 được nhận, dòng thứ 21 bị MAX_LINES và giỏ không đổi', () => {
    const ps = distinct(21);
    for (let i = 0; i < 20; i++) expect(state().addItem(ps[i])).toEqual({ ok: true });
    expect(state().items).toHaveLength(20);
    const before = { items: state().items, count: state().count, total: state().total };
    expect(state().addItem(ps[20])).toEqual({ ok: false, reason: 'MAX_LINES' });
    expect(state().items).toBe(before.items);
    expect(state().count).toBe(before.count);
    expect(state().total).toBe(before.total);
  });

  test('đủ 20 dòng vẫn gộp được vào dòng có sẵn', () => {
    const ps = distinct(20);
    for (const p of ps) state().addItem(p);
    expect(state().addItem(ps[3], { quantity: 2 })).toEqual({ ok: true });
    expect(state().items).toHaveLength(20);
    expect(state().items[3].quantity).toBe(3);
  });

  test('khác size hoặc topping của cùng món là dòng mới, tính vào 20 dòng', () => {
    const ps = distinct(19);
    for (const p of ps) state().addItem(p);
    expect(state().addItem(ps[0], { size: 'L' })).toEqual({ ok: true });
    expect(state().items).toHaveLength(20);
    expect(state().addItem(ps[0], { toppings: ['Trân châu'] })).toEqual({ ok: false, reason: 'MAX_LINES' });
    expect(state().items).toHaveLength(20);
  });

  test('số lượng 100 cho dòng mới bị MAX_QTY, không cắt về 99', () => {
    expect(state().addItem(big, { quantity: 100 })).toEqual({ ok: false, reason: 'MAX_QTY' });
    expect(state().items).toHaveLength(0);
    expect(state().addItem(big, { quantity: 99 })).toEqual({ ok: true });
    expect(state().items[0].quantity).toBe(99);
  });

  test('thêm vào dòng đã 99 bị MAX_QTY, giỏ không đổi', () => {
    state().addItem(big, { quantity: 99 });
    const before = state().items;
    expect(state().addItem(big)).toEqual({ ok: false, reason: 'MAX_QTY' });
    expect(state().items).toBe(before);
  });

  test('98 + 5 bị MAX_QTY, không cắt về 99', () => {
    state().addItem(big, { quantity: 98 });
    expect(state().addItem(big, { quantity: 5 })).toEqual({ ok: false, reason: 'MAX_QTY' });
    expect(state().items[0].quantity).toBe(98);
    expect(state().addItem(big, { quantity: 1 })).toEqual({ ok: true });
    expect(state().items[0].quantity).toBe(99);
  });

  test('hết hàng trả OUT_OF_STOCK, giỏ không đổi', () => {
    const empty: Product = { ...latte, id: 'p3', stock: 0 };
    expect(state().addItem(empty)).toEqual({ ok: false, reason: 'OUT_OF_STOCK' });
    expect(state().items).toHaveLength(0);
  });

  test('tồn kho thấp vẫn cắt như cũ; dòng đã bằng tồn kho thì AT_STOCK_LIMIT (còn hàng nhưng không thêm được gì)', () => {
    const low: Product = { ...latte, id: 'p2', stock: 2 };
    expect(state().addItem(low, { quantity: 5 })).toEqual({ ok: true });
    expect(state().items[0].quantity).toBe(2);
    expect(state().addItem(low, { quantity: 5 })).toEqual({ ok: false, reason: 'AT_STOCK_LIMIT' });
    expect(state().items[0].quantity).toBe(2);
  });
});

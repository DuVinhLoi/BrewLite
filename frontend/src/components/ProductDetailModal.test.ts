import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import ProductDetailModal from './ProductDetailModal';
import type { Product } from '@/lib/types';

// Render lần đầu (số lượng 1): kiểm nút + của bộ chọn số lượng mà khách thấy. Bấm nút thì không kiểm được trong CI.
const latte: Product = { id: 'p1', name: 'Latte', price: 30000, stock: 5 };
const html = (p: Product) => renderToStaticMarkup(createElement(ProductDetailModal, { product: p, onClose: () => {} }));
const plus = (out: string) => {
  const m = out.match(/<button[^>]*aria-label="Tăng"[^>]*>/);
  if (!m) throw new Error('không thấy nút +');
  return m[0];
};

describe('ProductDetailModal: nút + (F1)', () => {
  test('tồn kho nhiều hơn 1: nút + bấm được, title "Tăng"', () => {
    expect(plus(html(latte))).not.toContain('disabled');
    expect(plus(html(latte))).toContain('title="Tăng"');
  });

  test('chỉ còn 1: nút + disabled kèm title giải thích', () => {
    const tag = plus(html({ ...latte, stock: 1 }));
    expect(tag).toContain('disabled');
    expect(tag).toContain('title="Đã chọn hết số lượng còn lại"');
  });
});

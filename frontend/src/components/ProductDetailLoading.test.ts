import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, expect, test, vi } from 'vitest';
import { ApiError } from '@/lib/api';
import type { AsyncState } from '@/lib/use-async';
import type { Product } from '@/lib/types';
import ProductDetailModal from './ProductDetailModal';

const state = vi.hoisted(() => ({ data: undefined, error: undefined, loading: true, retry: vi.fn() })) as AsyncState<Product> & { retry: () => void };
vi.mock('@/lib/use-async', () => ({ useAsync: () => state }));
const stale: Product = { id: 'p1', name: 'Old latte', price: 30000, stock: 5 };
const html = () => renderToStaticMarkup(createElement(ProductDetailModal, { product: stale, loadFromApi: true, onClose: () => {} }));
const add = (out: string) => out.match(/<button[^>]*>[^<]*(?:Thêm vào giỏ|Hết hàng)[\s\S]*?<\/button>/)?.[0] ?? '';

beforeEach(() => { state.data = undefined; state.error = undefined; state.loading = false; });

test('loading detail hides stale options and disables add', () => {
  state.loading = true;
  const out = html();
  expect(out).toContain('Đang tải sản phẩm');
  expect(out).toContain('aria-busy="true"');
  expect(out).not.toContain('Giá gốc:');
  expect(out).not.toContain('Trân châu');
  expect(add(out)).toContain('disabled');
});

test.each([404, 500, 0])('detail error %i disables add, supports retry except 404', (status) => {
  state.error = new ApiError('Không tải được sản phẩm.', status);
  const out = html();
  expect(out).toContain('role="alert"');
  expect(out).not.toContain('Giá gốc:');
  expect(add(out)).toContain('disabled');
  expect(out.includes('Thử lại')).toBe(status !== 404);
});

test('fresh detail replaces stale menu price and stock', () => {
  state.data = { ...stale, name: 'Fresh latte', price: 40000, stock: 1 };
  const out = html();
  expect(out).toContain('Fresh latte');
  expect(out).not.toContain('Old latte');
  expect(out).toContain('45.000đ');
  expect(add(out)).not.toContain('disabled');
});

test('product now out of stock cannot be added', () => {
  state.data = { ...stale, stock: 0 };
  expect(add(html())).toContain('disabled');
  expect(html()).toContain('Hết hàng');
});

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import ProductCard from './ProductCard';
import { LOW_STOCK } from '@/lib/stock';
import { formatVND } from '@/lib/pricing';
import type { Product } from '@/lib/types';

// Không có DOM: render lần đầu ra HTML (chưa bấm), kiểm chữ, nút và lớp. Hành vi bấm "Thêm vào giỏ"
// (addItem, addItemMessage, "Đã thêm ✓" 1,2 giây) do store/cart.test.ts, cart-limits.test.ts và timeout-slot.test.ts giữ.
const product = (over: Partial<Product> = {}): Product => ({
  id: 'p1',
  name: 'Latte',
  price: 35000,
  imageUrl: '/images/latte.svg',
  stock: 24,
  version: 1,
  ...over,
});
const html = (over: Partial<Product> = {}) => renderToStaticMarkup(createElement(ProductCard, { product: product(over) }));
const buttons = (out: string) => out.match(/<button\b[^>]*>(?:(?!<\/button>).)*<\/button>/g) ?? [];
const text = (out: string) => out.replace(/<[^>]+>/g, '');
const EMOJI = new RegExp('\\p{Emoji_Presentation}|\\uFE0F', 'u');

describe('ProductCard: còn hàng', () => {
  const out = html();

  test('là <article> lớp card; tên món trong h3 lớp display', () => {
    expect(out).toMatch(/^<article class="[^"]*card/);
    expect(out).toMatch(/<h3 class="[^"]*display[^"]*">Latte<\/h3>/);
  });

  test('giá định dạng formatVND trong phần tử lớp price', () => {
    expect(out).toMatch(new RegExp(`class="[^"]*price[^"]*">${formatVND(35000)}<`));
  });

  test('nhãn "Còn N", không có "Sắp hết" hay "Hết hàng"', () => {
    expect(text(out)).toContain('Còn 24');
    expect(out).not.toContain('Sắp hết');
    expect(out).not.toContain('Hết hàng');
  });

  test('2 nút thật type="button", đều bấm được', () => {
    const b = buttons(out);
    expect(b).toHaveLength(2);
    for (const btn of b) {
      expect(btn).toContain('type="button"');
      expect(btn).not.toContain('disabled');
    }
  });

  test('"Thêm vào giỏ" là viên mực (Button primary), nút không mang aria-live', () => {
    const [add] = buttons(out);
    expect(text(add ?? '')).toBe('Thêm vào giỏ');
    expect(add).toMatch(/class="[^"]*primary/);
    expect(add).not.toContain('aria-live');
  });

  test('đúng HAI vùng live luôn có mặt (role="status"): "Đã thêm" và thông báo từ chối, cả hai rỗng + visually-hidden khi chưa có gì; không aria-live nào', () => {
    const regions = out.match(/<[^>]*role="status"[^>]*>[^<]*<\/[a-z]+>/g) ?? [];
    expect(regions).toHaveLength(2);
    for (const r of regions) {
      expect(r).toMatch(/class="[^"]*visually-hidden/);
      expect(text(r)).toBe('');
    }
    expect(out).not.toContain('aria-live');
    // nằm sau nút "Thêm vào giỏ", ngoài nút
    expect(out.indexOf('role="status"')).toBeGreaterThan(out.indexOf('Thêm vào giỏ'));
    expect(buttons(out).some((b) => b.includes('role="status"'))).toBe(false);
  });

  test('nguồn: thông báo từ chối đi qua LiveNotice luôn được vẽ (không còn {notice && ...})', () => {
    const src = readFileSync(path.resolve(__dirname, 'ProductCard.tsx'), 'utf8');
    expect(src).toMatch(/<LiveNotice\s+message=\{notice\}\s+className=\{styles\.notice\}\s*\/>/);
    expect(src).not.toMatch(/\{notice\s*&&/);
  });

  test('nguồn: "Đã thêm ✓" vào vùng live chỉ khi added, rỗng khi không', () => {
    const src = readFileSync(path.resolve(__dirname, 'ProductCard.tsx'), 'utf8');
    expect(src).toMatch(/role="status"[^>]*>\s*\{added \? 'Đã thêm ✓' : ''\}\s*</);
  });

  test('"Tùy chọn size / topping" là nút dạng liên kết (Button link), không phải <a href="#">', () => {
    const [, options] = buttons(out);
    expect(text(options ?? '')).toBe('Tùy chọn size / topping');
    expect(options).toMatch(/class="[^"]*link/);
    expect(out).not.toContain('<a ');
    expect(out).not.toContain('href="#"');
  });

  test('chưa bấm: không có thông báo từ chối giỏ (lớp notice), chưa có "Đã thêm ✓"', () => {
    expect(out).not.toMatch(/class="[^"]*notice/);
    expect(out).not.toContain('Đã thêm');
  });
});

describe('ProductCard: sắp hết (stock ≤ LOW_STOCK)', () => {
  test('stock = LOW_STOCK: "Sắp hết, còn N"', () => {
    expect(text(html({ stock: LOW_STOCK }))).toContain(`Sắp hết, còn ${LOW_STOCK}`);
  });

  test('stock = 1: "Sắp hết, còn 1", vẫn thêm được', () => {
    const out = html({ stock: 1 });
    expect(text(out)).toContain('Sắp hết, còn 1');
    for (const btn of buttons(out)) expect(btn).not.toContain('disabled');
  });

  test('stock = LOW_STOCK + 1: "Còn N", không "Sắp hết"', () => {
    const out = html({ stock: LOW_STOCK + 1 });
    expect(text(out)).toContain(`Còn ${LOW_STOCK + 1}`);
    expect(out).not.toContain('Sắp hết');
  });
});

describe('ProductCard: hết hàng', () => {
  test.each([0, -1])('stock = %i: nhãn "Hết hàng" nền danger, cả 2 nút vô hiệu, thẻ có lớp out', (stock) => {
    const out = html({ stock });
    expect(out).toMatch(/<span class="[^"]*danger[^"]*">Hết hàng<\/span>/);
    const b = buttons(out);
    expect(b).toHaveLength(2);
    for (const btn of b) expect(btn).toContain('disabled=""');
    expect(out).toMatch(/^<article class="[^"]*\bout\b|^<article class="[^"]*_out_/);
    expect(text(out)).not.toMatch(/Còn \d/);
  });
});

describe('ProductCard: ô ảnh 4:3', () => {
  test('ảnh nằm trong ô lớp media, alt là tên món, ô không aria-hidden', () => {
    const out = html();
    expect(out).toMatch(/<div class="[^"]*media[^"]*"><img src="\/images\/latte\.svg" alt="Latte"/);
    expect(out).not.toContain('aria-hidden');
  });

  test('không có imageUrl: vẫn có ô màu trống, không có ảnh, không có ☕', () => {
    const out = html({ imageUrl: '' });
    expect(out).toMatch(/<div class="[^"]*media[^"]*"><\/div>/);
    expect(out).not.toContain('<img');
    expect(out).not.toContain('☕');
  });
});

describe('ProductCard: chữ hiển thị', () => {
  test.each([24, LOW_STOCK, 0])('stock = %i: không em-dash, không emoji', (stock) => {
    const out = html({ stock });
    expect(out).not.toContain('—');
    expect(out).not.toMatch(EMOJI);
  });
});

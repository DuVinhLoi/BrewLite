import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import MenuPage from '@/app/page';
import MenuSection from './MenuSection';
import { VOUCHER_CODE, VOUCHER_PERCENT } from '@/lib/promo';

// Render trang Menu ở lần vẽ đầu (useAsync đang tải, effect chưa chạy): hero, khối "Menu hôm nay" và lưới skeleton.
const page = renderToStaticMarkup(createElement(MenuPage));
const text = (out: string) => out.replace(/<[^>]+>/g, '');
// Ký tự mặc định hiện dạng emoji (☕…) hoặc bộ chọn biến thể emoji; ↗ và ✓ là ký tự chữ, không khớp.
const EMOJI = new RegExp('\\p{Emoji_Presentation}|\\uFE0F', 'u');

describe('Trang Menu (app/page.tsx)', () => {
  test('đúng một h1 (của hero); bỏ tiêu đề cũ và ghi chú dev', () => {
    expect(page.match(/<h1\b/g)).toHaveLength(1);
    expect(page).not.toContain('BrewLite — Menu');
    expect(page).not.toContain('Task 3');
  });

  test('CTA "#menu" trỏ tới section id="menu" có trên trang', () => {
    expect(page).toContain('href="#menu"');
    expect(page).toMatch(/<section[^>]*id="menu"/);
    expect(page.indexOf('href="#menu"')).toBeLessThan(page.indexOf('id="menu"'));
  });

  test('lưới món nằm trong section #menu', () => {
    const menu = page.slice(page.indexOf('id="menu"'));
    expect(menu).toContain('aria-label="Đang tải menu"');
  });

  test('đang tải: hero ẩn dòng "N món / giá từ X"', () => {
    expect(text(page)).not.toContain('giá từ');
    expect(text(page)).not.toMatch(/\d+ món/);
  });

  test('không em-dash trong chữ hiển thị', () => {
    expect(page).not.toContain('—');
  });
});

describe('MenuSection: đầu lưới "Menu hôm nay"', () => {
  const out = renderToStaticMarkup(createElement(MenuSection, null, createElement('p', null, 'lưới')));

  test('h2 "Menu hôm nay" lớp display, section gắn nhãn bằng h2', () => {
    expect(out).toMatch(/<h2[^>]*id="menu-heading"[^>]*class="[^"]*display[^"]*"[^>]*>Menu hôm nay<\/h2>/);
    expect(out).toMatch(/<section[^>]*aria-labelledby="menu-heading"/);
  });

  test('gạch chân vẽ tay là svg aria-hidden; sao cạnh tiêu đề alt=""', () => {
    expect(out).toMatch(/<svg[^>]*aria-hidden="true"/);
    for (const img of out.match(/<img\b[^>]*>/g) ?? []) expect(img).toContain('alt=""');
  });

  test('dòng nhắc mã dựng từ VOUCHER_CODE và VOUCHER_PERCENT', () => {
    expect(text(out)).toContain(`Nhập mã ${VOUCHER_CODE} khi thanh toán để giảm ${VOUCHER_PERCENT}%.`);
    expect(out).toContain(`<strong>${VOUCHER_CODE}</strong>`);
  });

  test('mã nguồn không viết cứng mã hay mức giảm', () => {
    const src = readFileSync(path.resolve(__dirname, 'MenuSection.tsx'), 'utf8');
    expect(src).not.toMatch(/BREWLITE10|10\s*%/);
  });

  test('children (lưới món) nằm sau khối đầu', () => {
    expect(out.indexOf('Menu hôm nay')).toBeLessThan(out.indexOf('lưới'));
  });

  test('không em-dash, không emoji', () => {
    expect(out).not.toContain('—');
    expect(out).not.toMatch(EMOJI);
  });
});

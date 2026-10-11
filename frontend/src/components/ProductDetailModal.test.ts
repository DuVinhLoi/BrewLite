import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import ProductDetailModal from './ProductDetailModal';
import type { Product, Size } from '@/lib/types';
import { calcLineTotal, calcUnitPrice, DEFAULT_SIZE, formatVND, SIZE_UPCHARGE, TOPPING_PRICES } from '@/lib/pricing';
import { blocks, mediaBody, missingClasses, motionOutsideNoPreference, readCss } from '@/test-utils/css';

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

// Giao diện nét mực (ui-visual-plan.md §6 mục 4, artboard DetailDoodle) + R24 (dialog, Esc, bẫy focus).
const text = (out: string) => out.replace(/<[^>]+>/g, '');
const buttonByText = (out: string, label: string) => {
  const m = Array.from(out.matchAll(/<button\b[^>]*>([\s\S]*?)<\/button>/g)).find((b) => text(b[1]).trim().startsWith(label));
  if (!m) throw new Error(`không thấy nút ${label}`);
  return m[0];
};

describe('ProductDetailModal: hộp thoại (R24)', () => {
  const out = html(latte);
  const dialog = out.match(/<div[^>]*role="dialog"[^>]*>/)?.[0] ?? '';

  test('đúng một role="dialog", aria-modal="true", tabindex="-1" để nhận focus lúc mở', () => {
    expect(out.match(/role="dialog"/g)).toHaveLength(1);
    expect(dialog).toContain('aria-modal="true"');
    expect(dialog).toContain('tabindex="-1"');
  });

  test('aria-labelledby trỏ tới h2 tên món (không còn aria-label)', () => {
    const id = /aria-labelledby="([^"]+)"/.exec(dialog)?.[1];
    expect(id).toBeTruthy();
    expect(dialog).not.toContain('aria-label=');
    expect(out).toMatch(new RegExp(`<h2[^>]*id="${id}"[^>]*>Latte</h2>`));
  });

  test('tiêu đề lớp display (Fraunces)', () => {
    expect(out).toMatch(/<h2[^>]*class="[^"]*display[^"]*"[^>]*>Latte<\/h2>/);
  });

  test('lớp phủ (đóng khi bấm ra ngoài) là thẻ ngoài cùng, không mang role="dialog"', () => {
    const overlay = out.match(/^<div[^>]*>/)?.[0] ?? '';
    expect(overlay).not.toBe('');
    expect(overlay).not.toContain('role="dialog"');
  });
});

describe('ProductDetailModal: nội dung', () => {
  const out = html(latte);

  test('giữ nguyên dòng "Giá gốc: … • Còn N"', () => {
    expect(text(out)).toContain(`Giá gốc: ${formatVND(latte.price)} • Còn ${latte.stock}`);
  });

  test('size là chip có aria-pressed, ghi phụ phí từ pricing.ts; mở sẵn size mặc định', () => {
    for (const s of ['S', 'M', 'L'] as Size[]) {
      const chip = buttonByText(out, s);
      expect(chip).toContain(`aria-pressed="${s === DEFAULT_SIZE}"`);
      expect(text(chip)).toContain(`+${formatVND(SIZE_UPCHARGE[s])}`);
    }
  });

  test('topping là chip có aria-pressed="false" lúc mở, ghi giá từ pricing.ts', () => {
    for (const [t, price] of Object.entries(TOPPING_PRICES)) {
      const chip = buttonByText(out, t);
      expect(chip).toContain('aria-pressed="false"');
      expect(text(chip)).toContain(`+${formatVND(price)}`);
    }
  });

  test('không còn radio / checkbox (thay bằng chip)', () => {
    expect(out).not.toContain('type="radio"');
    expect(out).not.toContain('type="checkbox"');
  });

  test('"Tạm tính" là số Fraunces, đúng giá size mặc định × 1', () => {
    const total = formatVND(calcLineTotal(calcUnitPrice(latte.price, DEFAULT_SIZE, []), 1));
    expect(text(out)).toContain(`Tạm tính: ${total}`);
    expect(out).toMatch(new RegExp(`<strong[^>]*class="[^"]*display[^"]*"[^>]*>${total}</strong>`));
  });

  test('nút "Đóng" và "Thêm vào giỏ • <tạm tính>"; mọi nút type="button"', () => {
    const total = formatVND(calcLineTotal(calcUnitPrice(latte.price, DEFAULT_SIZE, []), 1));
    expect(text(buttonByText(out, 'Đóng'))).toBe('Đóng');
    expect(text(buttonByText(out, 'Thêm vào giỏ'))).toBe(`Thêm vào giỏ • ${total}`);
    for (const b of out.match(/<button\b[^>]*>/g) ?? []) expect(b).toContain('type="button"');
  });

  test('nút −/+ giữ aria-label "Giảm" / "Tăng"', () => {
    expect(out).toMatch(/<button[^>]*aria-label="Giảm"/);
    expect(out).toMatch(/<button[^>]*aria-label="Tăng"/);
  });

  test('chưa có thông báo: vùng role="status" vẫn có mặt nhưng rỗng và visually-hidden (không dùng class notice)', () => {
    const regions = out.match(/<[^>]*role="status"[^>]*>[^<]*<\/[a-z]+>/g) ?? [];
    expect(regions).toHaveLength(1);
    expect(regions[0]).toMatch(/class="[^"]*visually-hidden/);
    expect(text(regions[0] ?? '')).toBe('');
    expect(out).not.toMatch(/class="[^"]*notice/);
  });

  test('nguồn: thông báo đi qua LiveNotice luôn được vẽ (không còn {notice && ...})', () => {
    const src = readFileSync(path.resolve(__dirname, 'ProductDetailModal.tsx'), 'utf8');
    expect(src).toMatch(/<LiveNotice\s+message=\{notice\}\s+className=\{styles\.notice\}\s*\/>/);
    expect(src).not.toMatch(/\{notice\s*&&/);
  });

  test('có ảnh: ảnh món alt là tên món; hình trang trí alt="" aria-hidden', () => {
    const withImg = html({ ...latte, imageUrl: '/images/latte.svg' });
    expect(withImg).toMatch(/<img[^>]*src="\/images\/latte\.svg"[^>]*alt="Latte"/);
    for (const img of (withImg.match(/<img\b[^>]*>/g) ?? []).filter((i) => !i.includes('/images/'))) {
      expect(img).toContain('alt=""');
      expect(img).toContain('aria-hidden="true"');
    }
  });

  test('không có ảnh: không vẽ thẻ img món', () => {
    expect(out).not.toContain('/images/');
  });

  test('không em-dash trong chữ hiển thị', () => {
    expect(text(out)).not.toContain('—');
  });
});

describe('ProductDetailModal.module.css (artboard DetailDoodle)', () => {
  const css = readCss(path.join(__dirname, 'ProductDetailModal.module.css'));
  const tsx = readFileSync(path.join(__dirname, 'ProductDetailModal.tsx'), 'utf8');

  test('mọi styles.X trong component đều có lớp .X', () => {
    expect(missingClasses(tsx, css)).toEqual([]);
  });

  test('chuyển động chỉ trong @media (prefers-reduced-motion: no-preference); không viết cứng hex', () => {
    expect(motionOutsideNoPreference(css)).toEqual([]);
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });

  test('lớp phủ là mực 50% (token, không hex)', () => {
    expect(blocks(css, '.overlay')).toMatch(/background:\s*color-mix\(in srgb,\s*var\(--ink\)\s*50%,\s*transparent\)/);
  });

  test('hộp thoại: viền mực, bo 28 (--radius-block), bóng cứng 8px (--shadow-modal), rộng tối đa 860, 2 cột 0.9fr / 1.1fr', () => {
    const d = blocks(css, '.dialog');
    expect(d).toMatch(/border:\s*var\(--stroke\)/);
    expect(d).toMatch(/border-radius:\s*var\(--radius-block\)/);
    expect(d).toMatch(/box-shadow:\s*var\(--shadow-modal\)/);
    expect(d).toMatch(/max-width:\s*860px/);
    expect(d).toMatch(/grid-template-columns:\s*minmax\(0,\s*0\.9fr\)\s+minmax\(0,\s*1\.1fr\)/);
  });

  test('dưới 760px: một cột', () => {
    const sm = mediaBody(css, /\(max-width:\s*760px\)/);
    expect(blocks(sm, '.dialog')).toMatch(/grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  });

  test('tiêu đề 42px; số tạm tính 30px tabular-nums', () => {
    expect(blocks(css, '.title')).toMatch(/font-size:\s*42px/);
    const total = blocks(css, '.totalValue');
    expect(total).toMatch(/font-size:\s*30px/);
    expect(total).toMatch(/font-variant-numeric:\s*tabular-nums/);
  });

  test('chip viên viền mực, đang chọn nền mực chữ trắng', () => {
    const chip = blocks(css, '.chip');
    expect(chip).toMatch(/border:\s*var\(--stroke\)/);
    expect(chip).toMatch(/border-radius:\s*var\(--radius-pill\)/);
    expect(chip).toMatch(/min-height:\s*44px/);
    const on = blocks(css, `.chip[aria-pressed='true']`);
    expect(on).toMatch(/background:\s*var\(--ink\)/);
    expect(on).toMatch(/color:\s*var\(--paper\)/);
  });

  test('nút −/+ tròn 44px viền mực', () => {
    const step = blocks(css, '.step');
    expect(step).toMatch(/width:\s*44px/);
    expect(step).toMatch(/height:\s*44px/);
    expect(step).toMatch(/border-radius:\s*var\(--radius-pill\)/);
    expect(step).toMatch(/border:\s*var\(--stroke\)/);
  });
});

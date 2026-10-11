import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import CartView from './CartView';
import type { CartItem } from '@/lib/types';
import { formatVND } from '@/lib/pricing';
import { MAX_LINES } from '@/lib/cart-limits';
import { blocks, mediaBody, missingClasses, motionOutsideNoPreference, readCss } from '@/test-utils/css';

// Phần hiển thị của /cart (bước "cart"), tách khỏi page.tsx để render HTML test được (page dùng useRouter).
// ui-visual-plan.md §6 mục 5 + mục 11 (giỏ trống), artboard CartDoodle.
const capp: CartItem = {
  key: 'p3|M|Kem cheese',
  productId: 'p3',
  name: 'Cappuccino',
  imageUrl: '/images/cappuccino.svg',
  size: 'M',
  toppings: ['Kem cheese'],
  quantity: 1,
  unitPrice: 58000,
  lineTotal: 58000,
};
const latte: CartItem = {
  key: 'p1|L|',
  productId: 'p1',
  name: 'Latte',
  size: 'L',
  toppings: [],
  quantity: 2,
  unitPrice: 45000,
  lineTotal: 90000,
};
const noop = () => {};
const view = (items: CartItem[], count = items.reduce((s, i) => s + i.quantity, 0), total = items.reduce((s, i) => s + i.lineTotal, 0)) =>
  renderToStaticMarkup(
    createElement(CartView, { items, count, total, onQtyChange: noop, onRemove: noop, onClear: noop, onCheckout: noop }),
  );
const text = (out: string) => out.replace(/<[^>]+>/g, '');
const buttonByText = (out: string, label: string) => {
  const m = Array.from(out.matchAll(/<button\b[^>]*>([\s\S]*?)<\/button>/g)).find((b) => text(b[1]).trim().startsWith(label));
  if (!m) throw new Error(`không thấy nút ${label}`);
  return m[0];
};

describe('CartView: giỏ có món', () => {
  const out = view([capp, latte]);

  test('h1 "Giỏ hàng (n món)" giữ nguyên chữ, n là tổng số ly; lớp display', () => {
    expect(out.match(/<h1\b/g)).toHaveLength(1);
    expect(out).toMatch(/<h1[^>]*class="[^"]*display[^"]*"[^>]*>Giỏ hàng \(3 món\)<\/h1>/);
  });

  test('mỗi dòng là article có h2 tên món, dòng size/topping, đơn giá "/ ly", thành tiền', () => {
    expect(out.match(/<article\b/g)).toHaveLength(2);
    expect(out).toMatch(/<h2[^>]*>Cappuccino<\/h2>/);
    expect(out).toMatch(/<h2[^>]*>Latte<\/h2>/);
    expect(text(out)).toContain('Size M • Kem cheese');
    expect(text(out)).toContain('Size L • Không topping');
    expect(text(out)).toContain(`${formatVND(58000)} / ly`);
    expect(text(out)).toContain(`${formatVND(45000)} / ly`);
    expect(text(out)).toContain(formatVND(90000));
  });

  test('ô ảnh: có imageUrl thì img trang trí (alt="" aria-hidden, tên món đã nằm cạnh); không có thì không vẽ img', () => {
    const img = /<img[^>]*src="\/images\/cappuccino\.svg"[^>]*>/.exec(out)?.[0] ?? '';
    expect(img).toContain('alt=""');
    expect(img).toContain('aria-hidden="true"');
    expect(out).not.toContain('alt="Cappuccino"');
    expect(out).not.toMatch(/<img[^>]*alt="Latte"/);
  });

  test('mỗi dòng có QtyStepper (Giảm số lượng, Tăng số lượng, Xóa món)', () => {
    for (const label of ['Giảm số lượng', 'Tăng số lượng', 'Xóa món']) {
      expect(out.match(new RegExp(`aria-label="${label}"`, 'g'))).toHaveLength(2);
    }
  });

  test('khối tổng: "Tổng", số Fraunces, câu nhắc mã giảm giá', () => {
    const total = formatVND(148000);
    expect(text(out)).toContain('Tổng');
    expect(out).toMatch(new RegExp(`<p[^>]*class="[^"]*display[^"]*"[^>]*>${total}</p>`));
    expect(text(out)).toContain('Mã giảm giá nhập ở bước thanh toán.');
  });

  test('CTA "Thanh toán • <tổng>" là Button cta (mũi tên ↗ aria-hidden), nút "Xóa hết"', () => {
    const cta = buttonByText(out, 'Thanh toán');
    expect(text(cta).replace('↗', '').trim()).toBe(`Thanh toán • ${formatVND(148000)}`);
    expect(cta).toMatch(/class="[^"]*cta/);
    expect(cta).toMatch(/<span[^>]*aria-hidden="true"[^>]*>↗<\/span>/);
    expect(text(buttonByText(out, 'Xóa hết'))).toBe('Xóa hết');
  });

  test('đúng một mũi tên cam ↗ (một CTA nhấn mỗi màn)', () => {
    expect(out.match(/↗/g)).toHaveLength(1);
  });

  test('dưới 20 dòng: không có câu "Giỏ đã đủ 20 dòng."', () => {
    expect(out).not.toContain('Giỏ đã đủ');
  });

  test('mọi nút type="button"; không href="#"; không em-dash', () => {
    for (const b of out.match(/<button\b[^>]*>/g) ?? []) expect(b).toContain('type="button"');
    expect(out).not.toContain('href="#"');
    expect(text(out)).not.toContain('—');
  });

  test('hình trang trí alt="" aria-hidden', () => {
    for (const img of (out.match(/<img\b[^>]*>/g) ?? []).filter((i) => i.includes('/doodles/'))) {
      expect(img).toContain('alt=""');
      expect(img).toContain('aria-hidden="true"');
    }
  });
});

describe('CartView: đủ 20 dòng', () => {
  test(`${MAX_LINES} dòng: câu "Giỏ đã đủ ${MAX_LINES} dòng." trong role="status"`, () => {
    const items = Array.from({ length: MAX_LINES }, (_, i) => ({ ...latte, key: `p${i}|L|`, productId: `p${i}` }));
    const out = view(items);
    expect(out).toMatch(new RegExp(`<p[^>]*role="status"[^>]*>Giỏ đã đủ ${MAX_LINES} dòng\\.</p>`));
  });
});

describe('CartView: giỏ trống', () => {
  const out = view([], 0, 0);

  test('h1 "Giỏ hàng trống" và câu gợi ý giữ nguyên chữ', () => {
    expect(out).toMatch(/<h1[^>]*>Giỏ hàng trống<\/h1>/);
    expect(text(out)).toContain('Hãy chọn vài món ngon từ menu nhé!');
  });

  test('hình cốc trang trí alt=""', () => {
    expect(out).toMatch(/<img[^>]*src="\/doodles\/mug\.svg"[^>]*alt=""/);
  });

  test('CTA "Về Menu ↗" là liên kết thật tới "/", mũi tên aria-hidden', () => {
    const link = /<a\b[^>]*>([\s\S]*?)<\/a>/.exec(out);
    expect(link?.[0]).toMatch(/href="\/"/);
    expect(text(link?.[1] ?? '').replace('↗', '').trim()).toBe('Về Menu');
    expect(link?.[1]).toMatch(/<span[^>]*aria-hidden="true"[^>]*>↗<\/span>/);
    expect(out.match(/↗/g)).toHaveLength(1);
  });

  test('không còn tiêu đề "Giỏ hàng (0 món)", nút thanh toán hay "Xóa hết"', () => {
    expect(out).not.toContain('món)');
    expect(out).not.toContain('Thanh toán');
    expect(out).not.toContain('Xóa hết');
  });
});

describe('CartView.module.css (artboard CartDoodle)', () => {
  const css = readCss(path.join(__dirname, 'CartView.module.css'));
  const tsx = readFileSync(path.join(__dirname, 'CartView.tsx'), 'utf8');

  test('mọi styles.X trong component đều có lớp .X', () => {
    expect(missingClasses(tsx, css)).toEqual([]);
  });

  test('chuyển động chỉ trong @media (prefers-reduced-motion: no-preference); không viết cứng hex', () => {
    expect(motionOutsideNoPreference(css)).toEqual([]);
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });

  test('tiêu đề clamp(40px, 5vw, 56px), line-height 1.12', () => {
    const t = blocks(css, '.title');
    expect(t).toMatch(/font-size:\s*clamp\(40px,\s*5vw,\s*56px\)/);
    expect(t).toMatch(/line-height:\s*1\.12/);
  });

  test('hai cột 1.6fr / minmax(300px, 1fr); dưới 860px một cột', () => {
    expect(blocks(css, '.grid')).toMatch(/grid-template-columns:\s*minmax\(0,\s*1\.6fr\)\s+minmax\(300px,\s*1fr\)/);
    const sm = mediaBody(css, /\(max-width:\s*860px\)/);
    expect(blocks(sm, '.grid')).toMatch(/grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  });

  test('thẻ dòng viền mực bo --radius-card; ô ảnh 104px bo --radius-tile', () => {
    const line = blocks(css, '.line');
    expect(line).toMatch(/border:\s*var\(--stroke\)/);
    expect(line).toMatch(/border-radius:\s*var\(--radius-card\)/);
    const thumb = blocks(css, '.thumb');
    expect(thumb).toMatch(/width:\s*104px/);
    expect(thumb).toMatch(/height:\s*104px/);
    expect(thumb).toMatch(/border-radius:\s*var\(--radius-tile\)/);
  });

  test('tên món 24px', () => {
    expect(blocks(css, '.name')).toMatch(/font-size:\s*24px/);
  });

  test('khối tổng nền --mist bo --radius-block; số tổng 48px tabular-nums', () => {
    const aside = blocks(css, '.summary');
    expect(aside).toMatch(/background:\s*var\(--mist\)/);
    expect(aside).toMatch(/border-radius:\s*var\(--radius-block\)/);
    const total = blocks(css, '.total');
    expect(total).toMatch(/font-size:\s*48px/);
    expect(total).toMatch(/font-variant-numeric:\s*tabular-nums/);
  });

  test('CTA "Về Menu" giống Button cta: bo --radius-cta, nền mực, chữ trắng, mũi tên --accent', () => {
    const cta = blocks(css, '.ctaLink');
    expect(cta).toMatch(/border-radius:\s*var\(--radius-cta\)/);
    expect(cta).toMatch(/background:\s*var\(--ink\)/);
    expect(cta).toMatch(/color:\s*var\(--paper\)/);
    expect(blocks(css, '.ctaArrow')).toMatch(/color:\s*var\(--accent\)/);
  });
});

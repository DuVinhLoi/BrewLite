import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import PaymentForm, { PaymentFormView } from './PaymentForm';
import type { CartItem } from '@/lib/types';
import { formatVND } from '@/lib/pricing';
import { VOUCHER_CODE, VOUCHER_RATE } from '@/lib/promo';
import { PAYMENT_METHODS } from '@/lib/payment';
import { blocks, mediaBody, missingClasses, motionOutsideNoPreference, readCss } from '@/test-utils/css';

// Màn Thanh toán: ui-visual-plan.md §6 mục 6, artboard PayDoodle. Không có DOM trong test: phần hiển thị thuần
// (PaymentFormView) nhận state qua props để vẽ từng trạng thái; PaymentForm giữ state và logic thanh toán như cũ.
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
const TOTAL = 148000;
const noop = () => {};
type ViewProps = Parameters<typeof PaymentFormView>[0];
const view = (over: Partial<ViewProps> = {}) => {
  const applied = over.applied ?? null;
  const discount = applied === VOUCHER_CODE ? Math.floor(TOTAL * VOUCHER_RATE) : 0;
  return renderToStaticMarkup(
    createElement(PaymentFormView, {
      total: TOTAL,
      discount,
      final: TOTAL - discount,
      items: [capp, latte],
      voucher: '',
      onVoucherChange: noop,
      applied,
      onApply: noop,
      method: 'WALLET',
      onMethodChange: noop,
      processing: false,
      error: null,
      onBack: noop,
      onConfirm: noop,
      ...over,
    }),
  );
};
const text = (out: string) => out.replace(/<[^>]+>/g, '');
const buttonByText = (out: string, label: string) => {
  const m = Array.from(out.matchAll(/<button\b[^>]*>([\s\S]*?)<\/button>/g)).find((b) => text(b[1]).trim().startsWith(label));
  if (!m) throw new Error(`không thấy nút ${label}`);
  return m[0];
};
const attr = (tag: string, name: string) => new RegExp(`\\b${name}="([^"]*)"`).exec(tag)?.[1];

describe('PaymentFormView: khung trang và form', () => {
  const out = view();

  test('đúng một h1 "Thanh toán" lớp display', () => {
    expect(out.match(/<h1\b/g)).toHaveLength(1);
    expect(out).toMatch(/<h1[^>]*class="[^"]*display[^"]*"[^>]*>Thanh toán<\/h1>/);
  });

  test('"Tổng: <tổng>" giữ nguyên chữ', () => {
    expect(text(out)).toContain(`Tổng: ${formatVND(TOTAL)}`);
  });

  test('ô mã giảm giá có <label> "Mã giảm giá" nối bằng for/id, gợi ý "Ví dụ: <VOUCHER_CODE>" nối bằng aria-describedby, không dùng placeholder làm nhãn', () => {
    const input = /<input\b[^>]*type="text"[^>]*>/.exec(out)?.[0] ?? '';
    expect(input).not.toBe('');
    const id = attr(input, 'id');
    expect(id).toBeTruthy();
    expect(out).toMatch(new RegExp(`<label[^>]*for="${id}"[^>]*>Mã giảm giá</label>`));
    const hintId = attr(input, 'aria-describedby');
    expect(hintId).toBeTruthy();
    expect(out).toMatch(new RegExp(`id="${hintId}"[^>]*>Ví dụ: ${VOUCHER_CODE}<`));
    expect(input).not.toContain('placeholder=');
    expect(input).toMatch(/autocomplete="off"/i);
  });

  test('nút "Áp dụng" là Button ghost', () => {
    const apply = buttonByText(out, 'Áp dụng');
    expect(text(apply)).toBe('Áp dụng');
    expect(apply).toMatch(/class="[^"]*ghost/);
  });

  test('"Thực trả" kèm số tiền Fraunces (lớp display)', () => {
    expect(text(out)).toContain('Thực trả');
    expect(out).toMatch(new RegExp(`<strong[^>]*class="[^"]*display[^"]*"[^>]*>${formatVND(TOTAL)}</strong>`));
  });

  test('"Phương thức" là fieldset + legend, 2 radio thật cùng name, nhãn bấm được; bỏ "(o)" / "( )"', () => {
    const fieldset = /<fieldset\b[^>]*>([\s\S]*?)<\/fieldset>/.exec(out)?.[1] ?? '';
    expect(fieldset).toMatch(/^<legend[^>]*>Phương thức<\/legend>/);
    const labels = Array.from(fieldset.matchAll(/<label\b[^>]*>([\s\S]*?)<\/label>/g), (m) => m[1]);
    expect(labels).toHaveLength(PAYMENT_METHODS.length);
    PAYMENT_METHODS.forEach((m, i) => {
      expect(labels[i]).toMatch(/<input\b[^>]*type="radio"/);
      expect(labels[i]).toContain('name="payment-method"');
      expect(labels[i]).toContain(`value="${m.value}"`);
      expect(text(labels[i]).trim()).toBe(m.label);
    });
    expect(text(out)).not.toContain('(o)');
    expect(text(out)).not.toContain('( )');
  });

  test('phương thức đang chọn: radio checked và nhãn có lớp methodOn; cái kia không', () => {
    const radios = Array.from(out.matchAll(/<label\b([^>]*)>\s*<input\b([^>]*)>/g)).filter((m) => m[2].includes('type="radio"'));
    expect(radios).toHaveLength(2);
    const [wallet, card] = radios;
    expect(wallet[2]).toContain('checked=""');
    expect(wallet[1]).toMatch(/methodOn/);
    expect(card[2]).not.toContain('checked');
    expect(card[1]).not.toMatch(/methodOn/);
    const cardOut = view({ method: 'CARD' });
    const [w2, c2] = Array.from(cardOut.matchAll(/<label\b([^>]*)>\s*<input\b([^>]*)>/g)).filter((m) => m[2].includes('type="radio"'));
    expect(c2[2]).toContain('checked=""');
    expect(c2[1]).toMatch(/methodOn/);
    expect(w2[1]).not.toMatch(/methodOn/);
  });

  test('dòng "Không dùng tiền mặt" nằm trong fieldset', () => {
    const fieldset = /<fieldset\b[^>]*>([\s\S]*?)<\/fieldset>/.exec(out)?.[1] ?? '';
    expect(text(fieldset)).toContain('Không dùng tiền mặt');
  });

  test('nút "← Quay lại giỏ" (ghost) và đúng một CTA "Xác nhận trả • <thực trả>" có mũi tên ↗ aria-hidden', () => {
    expect(text(buttonByText(out, '← Quay lại giỏ'))).toBe('← Quay lại giỏ');
    expect(buttonByText(out, '← Quay lại giỏ')).toMatch(/class="[^"]*ghost/);
    const cta = buttonByText(out, 'Xác nhận trả');
    expect(text(cta).replace('↗', '').trim()).toBe(`Xác nhận trả • ${formatVND(TOTAL)}`);
    expect(cta).toMatch(/class="[^"]*cta/);
    expect(cta).toMatch(/<span[^>]*aria-hidden="true"[^>]*>↗<\/span>/);
    expect(out.match(/↗/g)).toHaveLength(1);
  });

  test('chưa áp mã: vùng role="status" của kết quả mã có sẵn và rỗng; không có role="alert"', () => {
    expect(out).toMatch(/<div[^>]*role="status"[^>]*><\/div>/);
    expect(out).not.toContain('role="alert"');
    expect(text(out)).not.toContain('Đã áp');
    expect(text(out)).not.toContain('không hợp lệ');
  });

  test('mọi nút type="button"; không href="#"; không em-dash', () => {
    for (const b of out.match(/<button\b[^>]*>/g) ?? []) expect(b).toContain('type="button"');
    expect(out).not.toContain('href="#"');
    expect(text(out)).not.toContain('—');
  });
});

describe('PaymentFormView: kết quả mã giảm giá (giữ nguyên chữ)', () => {
  test(`mã đúng: "Đã áp ${VOUCHER_CODE}: −<giảm>" nền ok, trong vùng role="status"; Thực trả và CTA dùng số sau giảm`, () => {
    const discount = Math.floor(TOTAL * VOUCHER_RATE);
    const out = view({ applied: VOUCHER_CODE, voucher: VOUCHER_CODE });
    expect(out).toMatch(
      new RegExp(`role="status"[^>]*><p[^>]*class="[^"]*resultOk[^"]*"[^>]*>Đã áp ${VOUCHER_CODE}: −${formatVND(discount)}</p></div>`),
    );
    expect(out).toMatch(new RegExp(`<strong[^>]*class="[^"]*display[^"]*"[^>]*>${formatVND(TOTAL - discount)}</strong>`));
    expect(text(buttonByText(out, 'Xác nhận trả')).replace('↗', '').trim()).toBe(`Xác nhận trả • ${formatVND(TOTAL - discount)}`);
  });

  test('mã sai: "Mã <mã> không hợp lệ, tính giá gốc" nền danger, trong vùng role="status"; giá giữ nguyên', () => {
    const out = view({ applied: 'SAIMA', voucher: 'saima' });
    expect(out).toMatch(/role="status"[^>]*><p[^>]*class="[^"]*resultBad[^"]*"[^>]*>Mã SAIMA không hợp lệ, tính giá gốc<\/p><\/div>/);
    expect(text(buttonByText(out, 'Xác nhận trả')).replace('↗', '').trim()).toBe(`Xác nhận trả • ${formatVND(TOTAL)}`);
  });

  test('ô nhập hiện đúng giá trị đang gõ', () => {
    const out = view({ voucher: 'brew' });
    expect(/<input\b[^>]*type="text"[^>]*>/.exec(out)?.[0]).toContain('value="brew"');
  });
});

describe('PaymentFormView: đang gửi và lỗi', () => {
  test('đang gửi: CTA hiện "Đang xử lý…" và mọi nút, ô nhập, radio đều vô hiệu', () => {
    const out = view({ processing: true });
    expect(text(buttonByText(out, 'Đang xử lý…')).replace('↗', '').trim()).toBe('Đang xử lý…');
    for (const b of out.match(/<button\b[^>]*>/g) ?? []) expect(b).toContain('disabled=""');
    for (const i of out.match(/<input\b[^>]*>/g) ?? []) expect(i).toContain('disabled=""');
  });

  test('lỗi từ cổng thanh toán: hiện nguyên câu trong role="alert"', () => {
    const msg = 'Thanh toán thất bại. Giỏ hàng được giữ nguyên. Bạn có thể thử lại.';
    const out = view({ error: msg });
    expect(out).toMatch(new RegExp(`<p[^>]*role="alert"[^>]*>${msg.replace(/\./g, '\\.')}</p>`));
    expect(out.match(/role="alert"/g)).toHaveLength(1);
  });
});

describe('PaymentFormView: khối "Đơn của bạn" (chỉ đọc từ giỏ)', () => {
  const out = view();
  const aside = /<aside\b[^>]*>([\s\S]*?)<\/aside>/.exec(out)?.[0] ?? '';

  test('aside có h2 "Đơn của bạn" (display) đặt tên cho nó', () => {
    const id = attr(/<aside\b[^>]*>/.exec(aside)?.[0] ?? '', 'aria-labelledby');
    expect(id).toBeTruthy();
    expect(aside).toMatch(new RegExp(`<h2[^>]*id="${id}"[^>]*>Đơn của bạn</h2>`));
    expect(aside).toMatch(/<h2[^>]*class="[^"]*display/);
  });

  test('mỗi dòng giỏ là một <li>: "n× Tên (size + topping)" và thành tiền', () => {
    const lines = Array.from(aside.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/g), (m) => text(m[1]));
    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain('1× Cappuccino (M + Kem cheese)');
    expect(lines[0]).toContain(formatVND(58000));
    expect(lines[1]).toContain('2× Latte (L)');
    expect(lines[1]).toContain(formatVND(90000));
  });

  test('không có nút nào trong khối (chỉ đọc)', () => {
    expect(aside).not.toBe('');
    expect(aside).not.toContain('<button');
    expect(aside).not.toContain('<input');
  });

  test('ảnh món trang trí (alt="" aria-hidden, tên món đã nằm cạnh); không có ảnh thì không vẽ img', () => {
    const img = /<img[^>]*src="\/images\/cappuccino\.svg"[^>]*>/.exec(aside)?.[0] ?? '';
    expect(img).toContain('alt=""');
    expect(img).toContain('aria-hidden="true"');
    expect(aside).not.toContain('alt="Cappuccino"');
    expect(aside).not.toMatch(/alt="Latte"/);
  });

  test('hình moka, sao, lá trang trí: alt="" và aria-hidden', () => {
    for (const src of ['/doodles/moka.svg', '/doodles/sparkle.svg', '/doodles/leaf.svg']) {
      const img = new RegExp(`<img[^>]*src="${src.replace(/\./g, '\\.')}"[^>]*>`).exec(aside)?.[0] ?? '';
      expect(img).toContain('alt=""');
      expect(img).toContain('aria-hidden="true"');
    }
  });
});

describe('PaymentForm (render lần đầu, giữ state và logic)', () => {
  test('vẽ PaymentFormView: chưa áp mã, chưa lỗi, phương thức mặc định Ví điện tử, CTA dùng tổng gốc', () => {
    const out = renderToStaticMarkup(createElement(PaymentForm, { total: TOTAL, items: [capp, latte], onSuccess: noop, onBack: noop }));
    expect(out).toMatch(/<h1[^>]*>Thanh toán<\/h1>/);
    expect(out).not.toContain('role="alert"');
    expect(text(buttonByText(out, 'Xác nhận trả')).replace('↗', '').trim()).toBe(`Xác nhận trả • ${formatVND(TOTAL)}`);
    const checked = /<input\b[^>]*type="radio"[^>]*checked=""[^>]*>/.exec(out)?.[0] ?? '';
    expect(checked).toContain('value="WALLET"');
    expect(text(out)).toContain('1× Cappuccino (M + Kem cheese)');
  });
});

describe('PaymentForm.module.css (artboard PayDoodle)', () => {
  const css = readCss(path.join(__dirname, 'PaymentForm.module.css'));
  const tsx = readFileSync(path.join(__dirname, 'PaymentForm.tsx'), 'utf8');

  test('mọi styles.X trong component đều có lớp .X; tsx không còn style inline', () => {
    expect(missingClasses(tsx, css)).toEqual([]);
    expect(tsx).not.toMatch(/style=\{/);
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

  test('hai cột 1.35fr / minmax(300px, 1fr); dưới 860px một cột', () => {
    expect(blocks(css, '.grid')).toMatch(/grid-template-columns:\s*minmax\(0,\s*1\.35fr\)\s+minmax\(300px,\s*1fr\)/);
    const sm = mediaBody(css, /\(max-width:\s*860px\)/);
    expect(blocks(sm, '.grid')).toMatch(/grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  });

  test('thẻ form viền mực bo --radius-card', () => {
    const card = blocks(css, '.card');
    expect(card).toMatch(/border:\s*var\(--stroke\)/);
    expect(card).toMatch(/border-radius:\s*var\(--radius-card\)/);
  });

  test('ô nhập viền mực bo --radius-input; gợi ý màu --muted', () => {
    const input = blocks(css, '.input');
    expect(input).toMatch(/border:\s*var\(--stroke\)/);
    expect(input).toMatch(/border-radius:\s*var\(--radius-input\)/);
    expect(blocks(css, '.hint')).toMatch(/color:\s*var\(--muted\)/);
  });

  test('kết quả mã: đúng nền --ok-bg chữ --ok-ink; sai nền --danger-bg chữ --danger-ink', () => {
    const ok = blocks(css, '.resultOk');
    expect(ok).toMatch(/background:\s*var\(--ok-bg\)/);
    expect(ok).toMatch(/color:\s*var\(--ok-ink\)/);
    const bad = blocks(css, '.resultBad');
    expect(bad).toMatch(/background:\s*var\(--danger-bg\)/);
    expect(bad).toMatch(/color:\s*var\(--danger-ink\)/);
  });

  test('"Thực trả": gạch đứt mực phía trên, số 44px tabular-nums', () => {
    expect(blocks(css, '.final')).toMatch(/border-top:\s*2px dashed var\(--ink\)/);
    const value = blocks(css, '.finalValue');
    expect(value).toMatch(/font-size:\s*44px/);
    expect(value).toMatch(/font-variant-numeric:\s*tabular-nums/);
  });

  test('fieldset không viền, min-width 0 (không tràn ở 360px); phương thức viền mực, đang chọn nền --warn-bg', () => {
    const fs = blocks(css, '.methods');
    expect(fs).toMatch(/border:\s*0/);
    expect(fs).toMatch(/min-width:\s*0/);
    expect(blocks(css, '.method')).toMatch(/border:\s*var\(--stroke\)/);
    expect(blocks(css, '.methodOn')).toMatch(/background:\s*var\(--warn-bg\)/);
  });

  test('lỗi thanh toán nền --danger-bg chữ --danger-ink', () => {
    const err = blocks(css, '.error');
    expect(err).toMatch(/background:\s*var\(--danger-bg\)/);
    expect(err).toMatch(/color:\s*var\(--danger-ink\)/);
  });

  test('"Đơn của bạn" nền --mist bo --radius-block, che phần hình tràn', () => {
    const s = blocks(css, '.summary');
    expect(s).toMatch(/background:\s*var\(--mist\)/);
    expect(s).toMatch(/border-radius:\s*var\(--radius-block\)/);
    expect(s).toMatch(/overflow:\s*hidden/);
  });
});

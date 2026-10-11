import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import BaristaView from './BaristaView';
import { formatVND } from '@/lib/pricing';
import type { QueueOrder } from '@/lib/barista';
import { blocks, mediaBody, missingClasses, readCss } from '@/test-utils/css';

// Màn quầy nét mực: ui-visual-plan.md §6 mục 12, artboard BaristaDoodle. Không có trình duyệt trong CI: render ra HTML để kiểm
// cái barista thấy; không kiểm được thao tác bấm (poll, PATCH, hộp xác nhận nằm ở app/barista/page.tsx).
const order = (id: string, status: string, over: Partial<QueueOrder> = {}): QueueOrder => ({
  id,
  status,
  total: 88200,
  createdAt: '2026-10-09T13:41:12.000Z',
  items: [
    { productId: 'p3', productName: 'Cappuccino', quantity: 1, unitPrice: 53000, size: 'M', toppings: ['Kem cheese'] },
    { productId: 'p1', productName: 'Latte', quantity: 2, unitPrice: 40000, size: 'L', toppings: [] },
  ],
  ...over,
});

type Props = Parameters<typeof BaristaView>[0];
const noop = () => {};
const html = (over: Partial<Props>) =>
  renderToStaticMarkup(
    createElement(BaristaView, {
      token: 'tok',
      staff: true,
      orders: [],
      error: null,
      busyId: null,
      onAdvance: noop,
      onCancel: noop,
      ...over,
    }),
  );
const text = (out: string) => out.replace(/<[^>]+>/g, '');
// Cột là <section class="…col…"> lồng trong <section class="…page…">: chỉ bắt section có lớp col.
const columns = (out: string) =>
  Array.from(out.matchAll(/<section\b([^>]*class="[^"]*_col_[^"]*"[^>]*)>([\s\S]*?)<\/section>/g), (m) => ({ attrs: m[1], body: m[2] }));
const outer = (out: string) => /^<section\b[^>]*>/.exec(out)?.[0] ?? '';

const queue = [order('aaaaaaaa-1', 'PAID'), order('bbbbbbbb-2', 'PREPARING', { createdAt: '2026-10-09T13:38:05.000Z' })];

describe('BaristaView: chặn vai trò (giữ chữ cũ)', () => {
  test('token=undefined: chưa vẽ gì', () => {
    expect(html({ token: undefined })).toBe('');
  });

  test('không phải BARISTA/ADMIN: h1 "Quầy pha chế", câu cũ và liên kết /login, không có cột nào', () => {
    for (const token of [null, 'tok']) {
      const out = html({ token, staff: false });
      expect(out).toMatch(/<h1[^>]*>Quầy pha chế<\/h1>/);
      expect(text(out)).toContain('Trang này dành cho tài khoản quầy. Đăng nhập bằng barista@brewlite.vn.');
      expect(out).toMatch(/<a[^>]*href="\/login"[^>]*>Đăng nhập<\/a>/);
      expect(out).not.toContain('Chờ pha');
    }
  });
});

describe('BaristaView: hàng đợi (§6 mục 12)', () => {
  const out = html({ orders: queue });
  const cols = columns(out);

  test('h1 Fraunces "Quầy pha chế" và dòng "Tự tải lại mỗi 5 giây."', () => {
    expect(out.match(/<h1\b/g)).toHaveLength(1);
    expect(out).toMatch(/<h1[^>]*class="[^"]*display[^"]*"[^>]*>Quầy pha chế<\/h1>/);
    expect(text(out)).toContain('Tự tải lại mỗi 5 giây.');
  });

  test('3 cột đúng thứ tự QUEUE_COLUMNS, mỗi cột h2 kèm số đơn (số tabular, " đơn" chỉ cho trình đọc màn hình)', () => {
    expect(cols).toHaveLength(3);
    const titles = cols.map((c) => text(/<h2\b[^>]*>([\s\S]*?)<\/h2>/.exec(c.body)?.[1] ?? ''));
    expect(titles).toEqual(['Chờ pha1 đơn', 'Đang pha1 đơn', 'Sẵn sàng0 đơn']);
    expect(cols[0].body).toMatch(/<span[^>]*class="(?=[^"]*tabular)(?=[^"]*count)[^"]*"[^>]*>1<span class="visually-hidden"> đơn<\/span><\/span>/);
  });

  test('số đếm: Chờ pha nền mực, Đang pha nền warn, Sẵn sàng nền ok (lớp theo cột)', () => {
    expect(cols[0].body).toMatch(/class="[^"]*count[^"]*toneInk/);
    expect(cols[1].body).toMatch(/class="[^"]*count[^"]*toneWarn/);
    expect(cols[2].body).toMatch(/class="[^"]*count[^"]*toneOk/);
  });

  test('thẻ đơn: mã đơn 8 ký tự, tổng tabular, giờ trong <time>, dòng món "1× Cappuccino (M + Kem cheese)"', () => {
    const card = /<article\b[^>]*>([\s\S]*?)<\/article>/.exec(cols[0].body)?.[1] ?? '';
    expect(card).toMatch(/<strong[^>]*>#aaaaaaaa<\/strong>/);
    expect(card).toMatch(new RegExp(`<span[^>]*class="[^"]*tabular[^"]*"[^>]*>${formatVND(88200)}</span>`));
    const when = new Date('2026-10-09T13:41:12.000Z').toLocaleTimeString('vi-VN');
    expect(card).toContain(`<time dateTime="2026-10-09T13:41:12.000Z">${when}</time>`);
    expect(card).toContain('<li>1× Cappuccino (M + Kem cheese)</li>');
    expect(card).toContain('<li>2× Latte (L)</li>');
  });

  test('nút theo ACTION_LABEL; "Hủy (hết nguyên liệu)" chỉ ở cột Chờ pha', () => {
    expect(cols[0].body).toMatch(/<button[^>]*class="[^"]*advance[^"]*"[^>]*>Nhận pha<\/button>/);
    expect(cols[0].body).toMatch(/<button[^>]*class="[^"]*cancel[^"]*"[^>]*>Hủy \(hết nguyên liệu\)<\/button>/);
    expect(cols[1].body).toMatch(/>Pha xong<\/button>/);
    expect(cols[1].body).not.toContain('Hủy (hết nguyên liệu)');
    const ready = html({ orders: [order('cccccccc-3', 'READY')] });
    expect(columns(ready)[2].body).toMatch(/>Đã giao<\/button>/);
    expect(text(ready)).not.toContain('Hủy (hết nguyên liệu)');
  });

  test('mọi nút là type="button"', () => {
    for (const b of out.match(/<button\b[^>]*>/g) ?? []) expect(b).toContain('type="button"');
  });

  test('cột rỗng: cốc mờ trang trí (alt="", aria-hidden) và "Không có đơn"', () => {
    expect(cols[2].body).toMatch(/<img[^>]*src="\/doodles\/mug\.svg"[^>]*alt=""[^>]*aria-hidden="true"/);
    expect(text(cols[2].body)).toContain('Không có đơn');
    expect(text(cols[0].body)).not.toContain('Không có đơn');
  });

  test('đơn đang chuyển: cả hai nút của đơn đó khóa, nút tiến đơn ghi "Đang chuyển…"; đơn khác không khóa', () => {
    const busy = html({ orders: queue, busyId: 'aaaaaaaa-1' });
    const [paid, preparing] = columns(busy);
    expect(paid.body).toMatch(/<button[^>]*disabled=""[^>]*>Đang chuyển…<\/button>/);
    expect(paid.body).toMatch(/<button[^>]*disabled=""[^>]*>Hủy \(hết nguyên liệu\)<\/button>/);
    expect(preparing.body).not.toContain('disabled');
  });

  test('lỗi: role="alert" ở đầu trang (trên các cột), giữ nguyên câu lỗi', () => {
    const bad = html({ orders: queue, error: 'Trang này cần tài khoản quầy (Barista) hoặc quản trị.' });
    expect(bad).toMatch(/<p[^>]*role="alert"[^>]*>Trang này cần tài khoản quầy \(Barista\) hoặc quản trị\.<\/p>/);
    expect(bad.indexOf('role="alert"')).toBeLessThan(bad.indexOf('Chờ pha'));
    expect(out).not.toContain('role="alert"');
  });

  test('không style inline, không href="#", không em-dash, không ↗', () => {
    for (const o of [out, html({ staff: false })]) {
      expect(o).not.toContain('style=');
      expect(o).not.toContain('href="#"');
      expect(text(o)).not.toContain('—');
      expect(o).not.toContain('↗');
    }
    expect(outer(out)).toMatch(/class="[^"]*page/);
  });
});

describe('BaristaView.module.css (artboard BaristaDoodle, không chuyển động)', () => {
  const css = readCss(path.join(__dirname, 'BaristaView.module.css'));
  const tsx = readFileSync(path.join(__dirname, 'BaristaView.tsx'), 'utf8');

  test('mọi styles.X có lớp .X; tsx không style inline, không dùng Button chung (có :active scale); không viết cứng hex', () => {
    expect(missingClasses(tsx, css)).toEqual([]);
    expect(tsx).not.toMatch(/style=\{/);
    expect(tsx).not.toMatch(/from '[^']*ui\/Button'/);
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });

  test('không có chuyển động nào (kể cả trong no-preference)', () => {
    expect(css).not.toMatch(/transition|animation|@keyframes|transform:\s*scale/);
  });

  test('cột nền --mist bo --radius-card; lưới 3 cột, dưới 760px một cột', () => {
    const col = blocks(css, '.col');
    expect(col).toMatch(/background:\s*var\(--mist\)/);
    expect(col).toMatch(/border-radius:\s*var\(--radius-card\)/);
    expect(blocks(css, '.board')).toMatch(/grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/);
    expect(mediaBody(css, /max-width:\s*760px/)).toMatch(/\.board\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  });

  test('số đếm: mực / warn / ok; số tabular', () => {
    expect(blocks(css, '.toneInk')).toMatch(/background:\s*var\(--ink\)/);
    expect(blocks(css, '.toneWarn')).toMatch(/background:\s*var\(--warn-bg\)/);
    expect(blocks(css, '.toneWarn')).toMatch(/color:\s*var\(--warn-ink\)/);
    expect(blocks(css, '.toneOk')).toMatch(/background:\s*var\(--ok-bg\)/);
    expect(blocks(css, '.toneOk')).toMatch(/color:\s*var\(--ok-ink\)/);
  });

  test('thẻ đơn viền mực nền trắng; nút cao tối thiểu 44px; nút hủy viền đỏ nền trắng', () => {
    const card = blocks(css, '.card');
    expect(card).toMatch(/border:\s*var\(--stroke\)/);
    expect(card).toMatch(/background:\s*var\(--paper\)/);
    expect(blocks(css, '.advance')).toMatch(/min-height:\s*44px/);
    expect(blocks(css, '.advance')).toMatch(/background:\s*var\(--ink\)/);
    const cancel = blocks(css, '.cancel');
    expect(cancel).toMatch(/min-height:\s*44px/);
    expect(cancel).toMatch(/border:\s*2px solid var\(--danger-ink\)/);
    expect(cancel).toMatch(/background:\s*var\(--paper\)/);
  });

  test('cốc của cột rỗng mờ; h1 Fraunces', () => {
    expect(blocks(css, '.emptyMug')).toMatch(/opacity:\s*0\.6/);
    expect(blocks(css, '.title')).toMatch(/font-size:\s*clamp\(36px,\s*4\.4vw,\s*50px\)/);
  });
});

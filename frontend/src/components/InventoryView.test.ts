import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import InventoryView from './InventoryView';
import { formatVND } from '@/lib/pricing';
import type { InventoryItem } from '@/lib/admin';
import { blocks, missingClasses, readCss } from '@/test-utils/css';

// Màn Kho nét mực (/admin): ui-visual-plan.md §6 mục 13, artboard KhoDoodle. Không có trình duyệt trong CI: render ra HTML để kiểm
// cái admin thấy; không kiểm được thao tác bấm (PATCH, tải lại sau lỗi nằm ở app/admin/page.tsx).
const item = (over: Partial<InventoryItem>): InventoryItem => ({ id: 'p1', name: 'Latte', price: 35000, stock: 24, version: 1, imageUrl: '/images/latte.svg', ...over });
const items = [
  item({}),
  item({ id: 'p2', name: 'Americano', price: 40000, stock: 3, imageUrl: '/images/americano.svg' }),
  item({ id: 'p4', name: 'Trà đào', price: 39000, stock: 0, imageUrl: undefined }),
];

type Props = Parameters<typeof InventoryView>[0];
const noop = () => {};
const html = (over: Partial<Props>) =>
  renderToStaticMarkup(
    createElement(InventoryView, {
      token: 'tok',
      admin: true,
      items,
      drafts: {},
      error: null,
      busyId: null,
      onDelta: noop,
      onSet: noop,
      onDraft: noop,
      ...over,
    }),
  );
const text = (out: string) => out.replace(/<[^>]+>/g, '');
const rows = (out: string) => Array.from(out.matchAll(/<tbody>([\s\S]*?)<\/tbody>/g))[0]?.[1].match(/<tr\b[\s\S]*?<\/tr>/g) ?? [];

describe('InventoryView: chặn vai trò, đang tải (giữ chữ cũ)', () => {
  test('token=undefined: chưa vẽ gì', () => {
    expect(html({ token: undefined })).toBe('');
  });

  test('không phải ADMIN: h1 "Quản lý tồn kho", câu cũ và liên kết /login, không có bảng', () => {
    const out = html({ token: null, admin: false });
    expect(out).toMatch(/<h1[^>]*>Quản lý tồn kho<\/h1>/);
    expect(text(out)).toContain('Trang này dành cho quản trị. Đăng nhập bằng admin@brewlite.vn.');
    expect(out).toMatch(/<a[^>]*href="\/login"[^>]*>Đăng nhập<\/a>/);
    expect(out).not.toContain('<table');
  });

  test('chưa có danh sách: "Đang tải…", chưa có bảng hay dòng tóm tắt', () => {
    const out = html({ items: undefined });
    expect(text(out)).toContain('Đang tải…');
    expect(out).not.toContain('<table');
  });

  test('chưa có danh sách mà lỗi: chỉ khối lỗi, không "Đang tải…"', () => {
    const out = html({ items: undefined, error: 'Trang này cần tài khoản quản trị (Admin).' });
    expect(out).toContain('role="alert"');
    expect(text(out)).not.toContain('Đang tải…');
  });

  test('danh sách rỗng: "Chưa có món nào.", không có bảng', () => {
    const out = html({ items: [] });
    expect(text(out)).toContain('Chưa có món nào.');
    expect(out).not.toContain('<table');
  });
});

describe('InventoryView: bảng tồn kho (§6 mục 13)', () => {
  const out = html({});
  const [latte = '', americano = '', traDao = ''] = rows(out);

  test('h1 Fraunces "Quản lý tồn kho" và dòng tóm tắt từ stockBadge', () => {
    expect(out.match(/<h1\b/g)).toHaveLength(1);
    expect(out).toMatch(/<h1[^>]*class="[^"]*display[^"]*"[^>]*>Quản lý tồn kho<\/h1>/);
    expect(out).toMatch(/<p[^>]*>3 món\. 1 món sắp hết, 1 món hết hàng\.<\/p>/);
  });

  test('lỗi 409: role="alert" phía trên bảng, giữ nguyên câu của lib/admin.ts, burst trang trí', () => {
    const msg = 'Tồn kho vừa thay đổi (có đơn mới hoặc người khác sửa). Đã tải lại, hãy thử lại.';
    const bad = html({ error: msg });
    expect(bad).toMatch(/<div[^>]*role="alert"[^>]*><img[^>]*src="\/doodles\/burst\.svg"[^>]*alt=""[^>]*aria-hidden="true"[^>]*\/?><span>Tồn kho vừa thay đổi/);
    expect(text(bad)).toContain(msg);
    expect(bad.indexOf('role="alert"')).toBeLessThan(bad.indexOf('<table'));
    expect(out).not.toContain('role="alert"');
  });

  test('bảng trong khung cuộn ngang; tiêu đề cột đúng thứ tự, scope="col"', () => {
    expect(out).toMatch(/<div[^>]*class="[^"]*frame[^"]*"[^>]*><table/);
    const ths = Array.from(out.matchAll(/<th\b([^>]*)>([^<]*)<\/th>/g));
    expect(ths.map((m) => m[2])).toEqual(['Món', 'Giá', 'Tồn kho', 'Điều chỉnh nhanh', 'Đặt số']);
    for (const m of ths) expect(m[1]).toContain('scope="col"');
  });

  test('cột Món: ô ảnh 48px (ảnh món alt="" vì tên đứng ngay cạnh) và tên; món không có ảnh thì ô trống', () => {
    expect(latte).toMatch(/<span[^>]*class="[^"]*thumb[^"]*"[^>]*><img[^>]*src="\/images\/latte\.svg"[^>]*alt=""/);
    expect(latte).toMatch(/<span[^>]*class="[^"]*name[^"]*"[^>]*>Latte<\/span>/);
    expect(traDao).toMatch(/<span[^>]*class="[^"]*thumb[^"]*"[^>]*><\/span>/);
  });

  test('cột Giá tabular; Tồn kho: số lớn tabular kèm nhãn chữ của stockBadge (màu không là dấu hiệu duy nhất)', () => {
    expect(latte).toMatch(new RegExp(`<td[^>]*class="[^"]*price[^"]*"[^>]*>${formatVND(35000)}</td>`));
    expect(latte).toMatch(/<span[^>]*class="[^"]*stockNum[^"]*"[^>]*>24<\/span>/);
    expect(text(latte)).toContain('Còn hàng');
    expect(text(americano)).toContain('Sắp hết');
    expect(text(traDao)).toContain('Hết hàng');
  });

  test('Điều chỉnh nhanh: −1 / +1 / +10 có aria-label theo tên món; −1 khóa khi hết hàng', () => {
    expect(latte).toMatch(/<button[^>]*aria-label="Giảm 1 Latte"[^>]*>−1<\/button>/);
    expect(latte).toMatch(/<button[^>]*aria-label="Tăng 1 Latte"[^>]*>\+1<\/button>/);
    expect(latte).toMatch(/<button[^>]*aria-label="Tăng 10 Latte"[^>]*>\+10<\/button>/);
    expect(traDao).toMatch(/<button[^>]*aria-label="Giảm 1 Trà đào"[^>]*disabled=""[^>]*>−1<\/button>/);
    expect(latte).not.toMatch(/<button[^>]*aria-label="Giảm 1 Latte"[^>]*disabled/);
  });

  test('Đặt số: <label> ẩn gắn với ô nhập (không chỉ placeholder); ô number min 0 step 1; "Lưu" khóa khi giá trị sai', () => {
    expect(latte).toMatch(/<label[^>]*class="visually-hidden"[^>]*for="set-p1"[^>]*>Đặt tồn kho Latte<\/label>/);
    expect(latte).toMatch(/<input[^>]*id="set-p1"[^>]*type="number"[^>]*min="0"[^>]*step="1"/);
    expect(latte).toMatch(/<button[^>]*disabled=""[^>]*>Lưu<\/button>/);
    for (const [draft, ok] of [['12', true], ['0', true], ['-1', false], ['2.5', false], ['', false]] as const) {
      const row = rows(html({ drafts: { p1: draft } }))[0];
      expect(row).toContain(`value="${draft}"`);
      if (ok) expect(row).not.toMatch(/<button[^>]*disabled=""[^>]*>Lưu<\/button>/);
      else expect(row).toMatch(/<button[^>]*disabled=""[^>]*>Lưu<\/button>/);
    }
  });

  test('món đang gửi: mọi nút của dòng đó khóa, dòng khác không', () => {
    const busy = rows(html({ busyId: 'p1', drafts: { p1: '5', p2: '5' } }));
    expect((busy[0] ?? '').match(/<button[^>]*disabled=""/g)).toHaveLength(4);
    expect(busy[1]).not.toContain('disabled');
  });

  test('mọi nút type="button"; không style inline, không href="#", không em-dash, không ↗', () => {
    for (const b of out.match(/<button\b[^>]*>/g) ?? []) expect(b).toContain('type="button"');
    for (const o of [out, html({ admin: false })]) {
      expect(o).not.toContain('style=');
      expect(o).not.toContain('href="#"');
      expect(text(o)).not.toContain('—');
      expect(o).not.toContain('↗');
    }
  });
});

describe('InventoryView.module.css (artboard KhoDoodle, không chuyển động)', () => {
  const css = readCss(path.join(__dirname, 'InventoryView.module.css'));
  const tsx = readFileSync(path.join(__dirname, 'InventoryView.tsx'), 'utf8');

  test('mọi styles.X có lớp .X; tsx không style inline, không dùng Button chung; không viết cứng hex', () => {
    expect(missingClasses(tsx, css)).toEqual([]);
    expect(tsx).not.toMatch(/style=\{/);
    expect(tsx).not.toMatch(/from '[^']*ui\/Button'/);
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });

  test('không có chuyển động nào (kể cả trong no-preference)', () => {
    expect(css).not.toMatch(/transition|animation|@keyframes|transform:\s*scale/);
  });

  test('khung bảng: viền mực, bo --radius-card, overflow-x auto', () => {
    const frame = blocks(css, '.frame');
    expect(frame).toMatch(/border:\s*var\(--stroke\)/);
    expect(frame).toMatch(/border-radius:\s*var\(--radius-card\)/);
    expect(frame).toMatch(/overflow-x:\s*auto/);
  });

  test('cảnh báo nền --warn-bg; ô ảnh 48px; số tồn 24px đậm tabular', () => {
    expect(blocks(css, '.alert')).toMatch(/background:\s*var\(--warn-bg\)/);
    const thumb = blocks(css, '.thumb');
    expect(thumb).toMatch(/width:\s*48px/);
    expect(thumb).toMatch(/height:\s*48px/);
    const num = blocks(css, '.stockNum');
    expect(num).toMatch(/font-size:\s*24px/);
    expect(num).toMatch(/font-weight:\s*800/);
  });

  test('chip và nút Lưu, ô nhập cao tối thiểu 44px', () => {
    for (const sel of ['.chip', '.save', '.input']) expect(blocks(css, sel)).toMatch(/min-height:\s*44px/);
  });
});

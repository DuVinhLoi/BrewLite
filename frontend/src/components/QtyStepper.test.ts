import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import QtyStepper from './QtyStepper';
import { blocks, missingClasses, motionOutsideNoPreference, readCss } from '@/test-utils/css';

// Render ra HTML (không có trình duyệt trong CI) để kiểm nút + / - mà người dùng thấy ở giỏ.
const html = (quantity: number) =>
  renderToStaticMarkup(createElement(QtyStepper, { quantity, onChange: () => {}, onRemove: () => {} }));

// Lấy thẻ <button ...> theo aria-label để kiểm thuộc tính disabled / title của riêng nút đó.
const button = (out: string, label: string) => {
  const m = out.match(new RegExp(`<button[^>]*aria-label="${label}"[^>]*>`));
  if (!m) throw new Error(`không thấy nút ${label}`);
  return m[0];
};

describe('QtyStepper (render HTML)', () => {
  test('ở 99: nút + bị disabled và có title giải thích, nút - vẫn bấm được', () => {
    const out = html(99);
    const plus = button(out, 'Tăng số lượng');
    expect(plus).toContain('disabled');
    expect(plus).toContain('title="Tối đa 99 ly mỗi dòng"');
    expect(button(out, 'Giảm số lượng')).not.toContain('disabled');
  });

  test('dưới 99: nút + bấm được và không có title tối đa', () => {
    const plus = button(html(98), 'Tăng số lượng');
    expect(plus).not.toContain('disabled');
    expect(plus).not.toContain('Tối đa 99');
  });

  test('ở 1: nút - vẫn disabled như trước', () => {
    const minus = button(html(1), 'Giảm số lượng');
    expect(minus).toContain('disabled');
    expect(minus).toContain('Số lượng tối thiểu là 1');
  });
});

// Giao diện nét mực (ui-visual-plan.md §6 mục 5, artboard CartDoodle): nút −/+ tròn, nút chữ "Xóa".
describe('QtyStepper: giao diện', () => {
  test('mọi nút type="button"; nút "Xóa" giữ chữ và aria-label "Xóa món"', () => {
    const out = html(2);
    for (const b of out.match(/<button\b[^>]*>/g) ?? []) expect(b).toContain('type="button"');
    expect(out).toMatch(/<button[^>]*aria-label="Xóa món"[^>]*>Xóa<\/button>/);
  });

  test('số lượng có aria-live="polite", không còn style inline', () => {
    const out = html(2);
    expect(out).toMatch(/<span[^>]*aria-live="polite"[^>]*>2<\/span>/);
    expect(out).not.toContain('style=');
  });
});

describe('QtyStepper.module.css', () => {
  const css = readCss(path.join(__dirname, 'QtyStepper.module.css'));
  const tsx = readFileSync(path.join(__dirname, 'QtyStepper.tsx'), 'utf8');

  test('mọi styles.X trong component đều có lớp .X', () => {
    expect(missingClasses(tsx, css)).toEqual([]);
  });

  test('chuyển động chỉ trong @media (prefers-reduced-motion: no-preference); không viết cứng hex', () => {
    expect(motionOutsideNoPreference(css)).toEqual([]);
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });

  test('nút −/+ tròn 40px viền mực; vô hiệu thì mờ', () => {
    const step = blocks(css, '.step');
    expect(step).toMatch(/width:\s*40px/);
    expect(step).toMatch(/height:\s*40px/);
    expect(step).toMatch(/border:\s*var\(--stroke\)/);
    expect(step).toMatch(/border-radius:\s*var\(--radius-pill\)/);
    expect(blocks(css, '.step:disabled')).toMatch(/opacity:/);
  });

  test('"Xóa" là nút chữ gạch chân, cao tối thiểu 44px', () => {
    const remove = blocks(css, '.remove');
    expect(remove).toMatch(/text-decoration:\s*underline/);
    expect(remove).toMatch(/min-height:\s*44px/);
    expect(remove).toMatch(/background:\s*none|background:\s*transparent/);
  });
});

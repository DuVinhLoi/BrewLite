import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import QtyStepper from './QtyStepper';

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

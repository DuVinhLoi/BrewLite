import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import LiveNotice from './LiveNotice';

const render = (message: string | null) => renderToStaticMarkup(createElement(LiveNotice, { message, className: 'notice-x' }));

describe('LiveNotice: vùng live luôn có mặt', () => {
  test('không có thông báo: vẫn có <p role="status">, rỗng, visually-hidden (không chiếm chỗ), không dùng class của thông báo', () => {
    const out = render(null);
    expect(out).toMatch(/^<p\b[^>]*role="status"[^>]*><\/p>$/);
    expect(out).toMatch(/class="[^"]*visually-hidden/);
    expect(out).not.toContain('notice-x');
  });

  test('chuỗi rỗng cũng coi là không có thông báo', () => {
    expect(render('')).toMatch(/^<p\b[^>]*role="status"[^>]*class="visually-hidden"[^>]*><\/p>$|^<p\b[^>]*class="visually-hidden"[^>]*role="status"[^>]*><\/p>$/);
  });

  test('có thông báo: cùng phần tử role="status" chứa đúng chữ, mang class của thông báo, không visually-hidden', () => {
    const out = render('Giỏ đã đủ 20 dòng.');
    expect(out).toMatch(/^<p\b[^>]*role="status"[^>]*>Giỏ đã đủ 20 dòng\.<\/p>$/);
    expect(out).toContain('class="notice-x"');
    expect(out).not.toContain('visually-hidden');
  });

  test('không aria-live thừa (role="status" đã là polite)', () => {
    expect(render('x')).not.toContain('aria-live');
  });
});

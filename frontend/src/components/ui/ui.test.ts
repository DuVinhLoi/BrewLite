import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import Badge from './Badge';
import Button from './Button';
import Card from './Card';
import EmptyState from './EmptyState';
import ErrorState from './ErrorState';
import Skeleton from './Skeleton';

// Không có trình duyệt trong CI: render ra HTML, kiểm chữ và thuộc tính. Không kiểm được thao tác bấm.
const html = (el: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(el);

describe('Button', () => {
  test('mặc định type="button", hiện chữ, có lớp theo variant', () => {
    const out = html(createElement(Button, { variant: 'primary' }, 'Thêm vào giỏ'));
    expect(out).toContain('type="button"');
    expect(out).toContain('Thêm vào giỏ');
    expect(out).toMatch(/class="[^"]*primary/);
  });

  test('cta: có mũi tên ↗ trong span aria-hidden', () => {
    const out = html(createElement(Button, { variant: 'cta' }, 'Đặt cà phê'));
    expect(out).toMatch(/<span[^>]*aria-hidden="true"[^>]*>↗<\/span>/);
    expect(html(createElement(Button, { variant: 'primary' }, 'x'))).not.toContain('↗');
  });

  test('disabled được chuyển xuống nút', () => {
    expect(html(createElement(Button, { variant: 'ghost', disabled: true }, 'x'))).toContain('disabled=""');
  });
});

describe('Card', () => {
  test('bọc nội dung và nhận className thêm', () => {
    const out = html(createElement(Card, { className: 'them', children: 'Nội dung' }));
    expect(out).toContain('Nội dung');
    expect(out).toContain('them');
  });
});

describe('Badge', () => {
  test.each(['neutral', 'ink', 'ok', 'warn', 'danger'] as const)('tone %s: lớp tương ứng, hiện chữ', (tone) => {
    const out = html(createElement(Badge, { tone, children: 'Còn hàng' }));
    expect(out).toContain('Còn hàng');
    expect(out).toMatch(new RegExp(`class="[^"]*${tone}`));
  });
});

describe('EmptyState', () => {
  test('có tiêu đề, gợi ý và hành động', () => {
    const out = html(createElement(EmptyState, { title: 'Chưa có món nào.', hint: 'Quay lại sau.', action: createElement('a', { href: '/' }, 'Về Menu') }));
    expect(out).toContain('Chưa có món nào.');
    expect(out).toContain('Quay lại sau.');
    expect(out).toContain('Về Menu');
  });

  test('truyền doodle: có <img alt=""> trỏ đúng đường dẫn; không truyền thì không có img', () => {
    const withImg = html(createElement(EmptyState, { title: 'Giỏ trống', doodle: '/doodles/bag.svg' }));
    expect(withImg).toMatch(/<img[^>]*src="\/doodles\/bag\.svg"[^>]*>/);
    expect(withImg).toContain('alt=""');
    expect(html(createElement(EmptyState, { title: 'Giỏ trống' }))).not.toContain('<img');
  });
});

describe('ErrorState', () => {
  test('role="alert", hiện thông báo; có nút "Thử lại" chỉ khi truyền onRetry', () => {
    const withRetry = html(createElement(ErrorState, { message: 'Không tải được menu.', onRetry: () => {} }));
    expect(withRetry).toContain('role="alert"');
    expect(withRetry).toContain('Không tải được menu.');
    expect(withRetry).toContain('Thử lại');
    expect(html(createElement(ErrorState, { message: 'Lỗi' }))).not.toContain('Thử lại');
  });
});

describe('Skeleton', () => {
  test('aria-hidden, nhận chiều cao và chiều rộng', () => {
    const out = html(createElement(Skeleton, { height: 24, width: '60%' }));
    expect(out).toContain('aria-hidden="true"');
    expect(out).toContain('height:24px');
    expect(out).toContain('width:60%');
  });
});

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import HeaderView from './HeaderView';
import type { Role } from '@/lib/auth';

// Không có trình duyệt trong CI: render ra HTML, kiểm chữ, link và thuộc tính. Không kiểm được hình thật.
const noop = () => {};
const session = (role: Role, email = 'ai-do@brewlite.test') => ({ email, role });
const html = (props: Partial<Parameters<typeof HeaderView>[0]> = {}) =>
  renderToStaticMarkup(createElement(HeaderView, { session: null, pathname: '/', count: 0, onLogout: noop, ...props }));
const hasLink = (out: string, href: string) => out.includes(`href="${href}"`);
const ariaCurrent = (out: string) => out.match(/aria-current="page"/g) ?? [];

describe('HeaderView: logo', () => {
  test('bean.svg trang trí (alt rỗng) + chữ BrewLite trong link về "/", lớp display, không emoji', () => {
    const out = html();
    expect(out).toMatch(/<img[^>]*src="\/doodles\/bean\.svg"[^>]*alt=""/);
    // viewBox 0 0 90 64 -> 38 x 27: có cả width và height để header không giật khi ảnh tải
    expect(out).toMatch(/<img[^>]*src="\/doodles\/bean\.svg"[^>]*width="38"[^>]*height="27"/);
    expect(out).toMatch(/<a[^>]*href="\/"[^>]*>(?:(?!<\/a>).)*BrewLite<\/span>/);
    expect(out).toMatch(/class="[^"]*display[^"]*"[^>]*>BrewLite</);
    expect(out).not.toContain('☕');
  });
});

describe('HeaderView: nav theo vai trò', () => {
  test('khách: Menu, Lịch sử; không có Quầy, Kho', () => {
    const out = html();
    expect(out).toContain('aria-label="Chính"');
    expect(hasLink(out, '/')).toBe(true);
    expect(hasLink(out, '/history')).toBe(true);
    expect(hasLink(out, '/barista')).toBe(false);
    expect(hasLink(out, '/admin')).toBe(false);
  });

  test('CUSTOMER: như khách', () => {
    const out = html({ session: session('CUSTOMER') });
    expect(hasLink(out, '/barista')).toBe(false);
    expect(hasLink(out, '/admin')).toBe(false);
    expect(hasLink(out, '/history')).toBe(true);
  });

  test('BARISTA: có Quầy, không có Kho', () => {
    const out = html({ session: session('BARISTA') });
    expect(out).toContain('>Quầy</a>');
    expect(hasLink(out, '/barista')).toBe(true);
    expect(hasLink(out, '/admin')).toBe(false);
  });

  test('ADMIN: có Quầy và Kho', () => {
    const out = html({ session: session('ADMIN') });
    expect(hasLink(out, '/barista')).toBe(true);
    expect(hasLink(out, '/admin')).toBe(true);
    expect(out).toContain('>Kho</a>');
  });
});

describe('HeaderView: aria-current', () => {
  test.each([
    ['/', 'Menu'],
    ['/history', 'Lịch sử'],
    ['/history/x', 'Lịch sử'],
    ['/barista', 'Quầy'],
    ['/admin', 'Kho'],
  ])('pathname %s: đúng một mục "%s" có aria-current="page"', (pathname, label) => {
    const out = html({ session: session('ADMIN'), pathname });
    expect(ariaCurrent(out)).toHaveLength(1);
    expect(out).toMatch(new RegExp(`<a[^>]*aria-current="page"[^>]*>${label}</a>`));
  });

  test.each(['/cart', '/profile', '/login', null])('pathname %s không thuộc nav: không mục nào có aria-current', (pathname) => {
    expect(ariaCurrent(html({ session: session('ADMIN'), pathname }))).toHaveLength(0);
  });
});

describe('HeaderView: pill giỏ hàng', () => {
  test('nhãn "Xem giỏ hàng" giữ nguyên, link /cart, số ly kèm aria-label, icon giỏ ẩn với trình đọc', () => {
    const out = html({ count: 3 });
    expect(out).toContain('Xem giỏ hàng');
    expect(out).toMatch(/<a[^>]*href="\/cart"/);
    expect(out).toMatch(/<span[^>]*aria-label="3 món trong giỏ"[^>]*>3<\/span>/);
    expect(out).toMatch(/<svg[^>]*aria-hidden="true"/);
  });

  test('giỏ trống vẫn hiện số 0', () => {
    expect(html({ count: 0 })).toMatch(/aria-label="0 món trong giỏ"[^>]*>0</);
  });
});

describe('HeaderView: tài khoản', () => {
  test.each([
    ['CUSTOMER', 'Khách'],
    ['BARISTA', 'Quầy'],
    ['ADMIN', 'Quản trị'],
  ] as const)('%s: pill vai trò hiện "%s", link /profile, email ở title, không in email ra chữ', (role, label) => {
    const out = html({ session: session(role, 'a@b.test') });
    const pill = out.match(/<a[^>]*href="\/profile"[^>]*>(?:(?!<\/a>).)*<\/a>/)?.[0] ?? '';
    expect(pill).toContain('title="a@b.test"');
    expect(pill.endsWith(`${label}</a>`)).toBe(true);
    expect(out).not.toContain('>a@b.test<');
    expect(out).toContain('>Đăng xuất</button>');
    expect(out).not.toContain('Đăng nhập');
  });

  test('pill vai trò có icon người ẩn với trình đọc (cùng icon giỏ: đúng 2 svg khi đã đăng nhập)', () => {
    const out = html({ session: session('CUSTOMER') });
    expect(out.match(/<svg/g)).toHaveLength(2);
    expect(out.match(/<svg[^>]*aria-hidden="true"/g)).toHaveLength(2);
  });

  test('email rỗng: title rơi về "Đã đăng nhập"', () => {
    const pill = html({ session: session('CUSTOMER', '') }).match(/<a[^>]*href="\/profile"[^>]*>/)?.[0] ?? '';
    expect(pill).toContain('title="Đã đăng nhập"');
  });

  test('nút Đăng xuất là type="button"', () => {
    expect(html({ session: session('CUSTOMER') })).toMatch(/<button[^>]*type="button"[^>]*>Đăng xuất<\/button>/);
  });

  test('chưa đăng nhập: pill "Đăng nhập" tới /login, không có Đăng xuất, không có pill vai trò', () => {
    const out = html();
    expect(out).toMatch(/<a[^>]*href="\/login"[^>]*>Đăng nhập<\/a>/);
    expect(out).not.toContain('Đăng xuất');
    expect(hasLink(out, '/profile')).toBe(false);
    expect(out.match(/<svg/g)).toHaveLength(1); // chỉ icon giỏ; icon người dành riêng cho pill vai trò
  });
});

describe('HeaderView: chung', () => {
  const variants = [
    html(),
    html({ session: session('CUSTOMER'), count: 5 }),
    html({ session: session('BARISTA'), pathname: '/barista' }),
    html({ session: session('ADMIN'), pathname: '/admin' }),
  ];

  test('không emoji, không em-dash, không href="#"', () => {
    for (const out of variants) {
      expect(out).not.toMatch(new RegExp('\\p{Extended_Pictographic}', 'u'));
      expect(out).not.toContain('—');
      expect(out).not.toContain('href="#"');
    }
  });

  test('mọi <img> là hình trang trí: alt rỗng', () => {
    for (const out of variants) {
      const imgs = out.match(/<img[^>]*>/g) ?? [];
      expect(imgs.length).toBeGreaterThan(0);
      for (const img of imgs) expect(img).toContain('alt=""');
    }
  });

  test('là <header> chứa đúng một <nav>', () => {
    for (const out of variants) {
      expect(out.startsWith('<header')).toBe(true);
      expect(out.match(/<nav/g)).toHaveLength(1);
    }
  });
});

// Header không có chuyển động trừ phản hồi :active; mọi transition / animation / @keyframes phải nằm trong no-preference.
describe('Header.module.css: chuyển động', () => {
  const css = readFileSync(path.resolve(__dirname, 'Header.module.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

  // Với mỗi từ khóa chuyển động, lấy chuỗi các at-rule bao quanh nó (từ trong ra ngoài).
  function enclosingAtRules(index: number): string[] {
    const rules: string[] = [];
    let depth = 0;
    for (let i = index - 1; i >= 0; i--) {
      if (css[i] === '}') depth++;
      else if (css[i] === '{') {
        if (depth === 0) {
          const start = Math.max(css.lastIndexOf('}', i - 1), css.lastIndexOf('{', i - 1), css.lastIndexOf(';', i - 1)) + 1;
          rules.push(css.slice(start, i).trim());
        } else depth--;
      }
    }
    return rules;
  }

  test('có ít nhất một quy tắc (file không rỗng)', () => {
    expect(css.length).toBeGreaterThan(200);
  });

  test('transition / animation / @keyframes chỉ nằm trong @media (prefers-reduced-motion: no-preference)', () => {
    const hits = Array.from(css.matchAll(/transition|animation|@keyframes/g));
    for (const m of hits) {
      const rules = enclosingAtRules(m.index!);
      expect(rules.some((r) => r.startsWith('@media') && /prefers-reduced-motion:\s*no-preference/.test(r)), `"${m[0]}" ở vị trí ${m.index}`).toBe(true);
    }
  });
});

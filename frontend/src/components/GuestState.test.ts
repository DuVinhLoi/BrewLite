import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import GuestState from './GuestState';
import { safeNext } from '@/lib/session';
import { blocks, missingClasses, motionOutsideNoPreference, readCss } from '@/test-utils/css';

// Trạng thái "chưa đăng nhập" dùng chung cho Hồ sơ và Lịch sử: ui-visual-plan.md §6 mục 11, artboard StatesDoodle dòng 88 đến 92.
const out = renderToStaticMarkup(createElement(GuestState));
const text = out.replace(/<[^>]+>/g, '');

describe('GuestState (render HTML)', () => {
  test('hạt cà phê trang trí, h2 display "Bạn chưa đăng nhập.", câu gợi ý', () => {
    expect(out).toMatch(/<img[^>]*src="\/doodles\/bean\.svg"[^>]*alt=""[^>]*aria-hidden="true"/);
    expect(out).toMatch(/<h2[^>]*class="[^"]*display[^"]*"[^>]*>Bạn chưa đăng nhập\.<\/h2>/);
    expect(text).toContain('Đăng nhập để xem điểm tích lũy và lịch sử đơn.');
  });

  test('CTA "Đăng nhập" là liên kết thật tới /login (không phải nút, không href="#"), không có ↗', () => {
    expect(out).toMatch(/<a[^>]*href="\/login"[^>]*>Đăng nhập<\/a>/);
    expect(out).not.toContain('<button');
    expect(out).not.toContain('href="#"');
    expect(out).not.toContain('↗');
  });

  test('có nextPath: href = /login?next=<encodeURIComponent>, và giá trị next qua safeNext trả lại đúng đường dẫn', () => {
    for (const p of ['/history', '/profile']) {
      const withNext = renderToStaticMarkup(createElement(GuestState, { nextPath: p }));
      const href = /<a[^>]*href="([^"]*)"[^>]*>Đăng nhập<\/a>/.exec(withNext)?.[1];
      expect(href).toBe(`/login?next=${encodeURIComponent(p)}`);
      const next = new URLSearchParams((href ?? '').split('?')[1]).get('next');
      expect(safeNext(next)).toBe(p);
    }
  });

  test('có nextPath lạ (//host, https://...): vẫn encode, và safeNext từ chối ở đầu nhận', () => {
    const bad = renderToStaticMarkup(createElement(GuestState, { nextPath: '//evil.example' }));
    const href = /href="([^"]*)"/.exec(bad.replace(/<img[^>]*>/, ''))?.[1];
    expect(safeNext(new URLSearchParams((href ?? '').split('?')[1]).get('next'))).toBeNull();
  });

  test('không có nextPath: giữ nguyên href="/login", không ?next=', () => {
    expect(out).toContain('href="/login"');
    expect(out).not.toContain('next=');
  });

  test('không có h1 (trang bọc ngoài tự đặt tiêu đề), không style inline, không em-dash', () => {
    expect(out).not.toContain('<h1');
    expect(out).not.toContain('style=');
    expect(text).not.toContain('—');
  });
});

describe('GuestState.module.css (StatesDoodle)', () => {
  const css = readCss(path.join(__dirname, 'GuestState.module.css'));
  const tsx = readFileSync(path.join(__dirname, 'GuestState.tsx'), 'utf8');

  test('mọi styles.X trong component đều có lớp .X; không chuyển động ngoài no-preference; không viết cứng hex', () => {
    expect(missingClasses(tsx, css)).toEqual([]);
    expect(motionOutsideNoPreference(css)).toEqual([]);
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });

  test('CTA nền mực chữ trắng, bo --radius-cta, cao tối thiểu 48', () => {
    const cta = blocks(css, '.cta');
    expect(cta).toMatch(/background:\s*var\(--ink\)/);
    expect(cta).toMatch(/color:\s*var\(--paper\)/);
    expect(cta).toMatch(/border-radius:\s*var\(--radius-cta\)/);
    expect(cta).toMatch(/min-height:\s*48px/);
  });

  test('tiêu đề 28px; hạt 70px xoay -20deg', () => {
    expect(blocks(css, '.title')).toMatch(/font-size:\s*28px/);
    const bean = blocks(css, '.bean');
    expect(bean).toMatch(/width:\s*70px/);
    expect(bean).toMatch(/transform:\s*rotate\(-20deg\)/);
  });
});

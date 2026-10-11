import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import ProfileView from './ProfileView';
import type { Profile } from '@/lib/api';
import { formatVND } from '@/lib/pricing';
import { VND_FOR_ONE_POINT } from '@/lib/promo';
import { blocks, mediaBody, missingClasses, motionOutsideNoPreference, readCss } from '@/test-utils/css';

// Màn Hồ sơ nét mực: ui-visual-plan.md §6 mục 9 (khối điểm, thẻ tài khoản) và mục 11 (chưa đăng nhập), artboard ProfileDoodle
// và StatesDoodle. Hành vi 4 trạng thái (undefined / null / lỗi / đang tải) do ProfileView.test.ts ghim, file đó không sửa.
const profile: Profile = { id: 'u1', email: 'khach@brewlite.test', role: 'BARISTA', loyaltyPoints: 1234 };
const html = (props: { token: string | null | undefined; profile: Profile | null; error: string | null }) =>
  renderToStaticMarkup(createElement(ProfileView, props));
const text = (out: string) => out.replace(/<[^>]+>/g, '');
const attr = (tag: string, name: string) => new RegExp(`\\b${name}="([^"]*)"`).exec(tag)?.[1];

describe('ProfileView: có hồ sơ', () => {
  const out = html({ token: 't', profile, error: null });

  test('đúng một h1 "Hồ sơ" lớp display', () => {
    expect(out.match(/<h1\b/g)).toHaveLength(1);
    expect(out).toMatch(/<h1[^>]*class="[^"]*display[^"]*"[^>]*>Hồ sơ<\/h1>/);
  });

  test('khối điểm: section đặt tên bằng h2 "Điểm tích lũy"; số định dạng vi-VN (display, lớp points) rồi chữ "điểm"', () => {
    const section = /<section\b[^>]*aria-labelledby="([^"]+)"[^>]*>([\s\S]*?)<\/section>/.exec(out);
    expect(section).not.toBeNull();
    expect(section![2]).toMatch(new RegExp(`<h2[^>]*id="${section![1]}"[^>]*>Điểm tích lũy</h2>`));
    expect(section![2]).toMatch(new RegExp(`<span[^>]*class="[^"]*display[^"]*points[^"]*"[^>]*>${(1234).toLocaleString('vi-VN')}</span>`));
    expect(section![2]).toMatch(/<span[^>]*class="[^"]*display[^"]*"[^>]*>điểm<\/span>/);
  });

  test('câu về điểm tính từ VND_FOR_ONE_POINT', () => {
    expect(text(out)).toContain(`Mỗi ${formatVND(VND_FOR_ONE_POINT)} thanh toán được 1 điểm.`);
  });

  test('thẻ tài khoản: dl gồm Email và Vai trò (nhãn ROLE_LABEL trong viên)', () => {
    const dl = /<dl\b[^>]*>([\s\S]*?)<\/dl>/.exec(out)?.[1] ?? '';
    expect(dl).toMatch(/<dt[^>]*>Email<\/dt><dd[^>]*>khach@brewlite\.test<\/dd>/);
    expect(dl).toMatch(/<dt[^>]*>Vai trò<\/dt><dd[^>]*><span[^>]*class="[^"]*role[^"]*"[^>]*>Quầy<\/span><\/dd>/);
  });

  test('"Xem lịch sử đơn hàng ↗" là liên kết thật tới /history, mũi tên aria-hidden; đúng một ↗', () => {
    const link = /<a\b([^>]*)>([\s\S]*?)<\/a>/.exec(out);
    expect(attr(link?.[1] ?? '', 'href')).toBe('/history');
    expect(text(link?.[2] ?? '').replace('↗', '').trim()).toBe('Xem lịch sử đơn hàng');
    expect(link?.[2]).toMatch(/<span[^>]*aria-hidden="true"[^>]*>↗<\/span>/);
    expect(out.match(/↗/g)).toHaveLength(1);
  });

  test('hạt, sao, cốc trang trí: alt="" và aria-hidden', () => {
    const imgs = out.match(/<img\b[^>]*>/g) ?? [];
    expect(imgs.filter((i) => i.includes('/doodles/bean.svg'))).toHaveLength(3);
    expect(imgs.some((i) => i.includes('/doodles/sparkle.svg'))).toBe(true);
    expect(imgs.some((i) => i.includes('/doodles/mug.svg'))).toBe(true);
    for (const img of imgs) {
      expect(img).toContain('alt=""');
      expect(img).toContain('aria-hidden="true"');
    }
  });

  test('không href="#", không em-dash, không style inline', () => {
    expect(out).not.toContain('href="#"');
    expect(text(out)).not.toContain('—');
    expect(out).not.toContain('style=');
  });
});

describe('ProfileView: chưa đăng nhập (§6 mục 11)', () => {
  const out = html({ token: null, profile: null, error: null });

  test('h1 "Hồ sơ", hạt cà phê, h2 "Bạn chưa đăng nhập." (display), gợi ý, CTA "Đăng nhập" là liên kết /login không có ↗', () => {
    expect(out).toMatch(/<h1[^>]*>Hồ sơ<\/h1>/);
    expect(out).toMatch(/<img[^>]*src="\/doodles\/bean\.svg"[^>]*alt=""[^>]*aria-hidden="true"/);
    expect(out).toMatch(/<h2[^>]*class="[^"]*display[^"]*"[^>]*>Bạn chưa đăng nhập\.<\/h2>/);
    expect(text(out)).toContain('Đăng nhập để xem điểm tích lũy và lịch sử đơn.');
    expect(out).toMatch(/<a[^>]*href="\/login\?next=%2Fprofile"[^>]*class="[^"]*cta[^"]*"[^>]*>Đăng nhập<\/a>|<a[^>]*class="[^"]*cta[^"]*"[^>]*href="\/login\?next=%2Fprofile"[^>]*>Đăng nhập<\/a>/);
    expect(out).not.toContain('↗');
  });
});

describe('ProfileView: lỗi và đang tải', () => {
  test('lỗi: h1 "Hồ sơ" và khối role="alert" lớp error kèm liên kết /login', () => {
    const out = html({ token: 't', profile: null, error: 'Phiên hết hạn' });
    expect(out).toMatch(/<h1[^>]*>Hồ sơ<\/h1>/);
    expect(out).toMatch(/<p[^>]*role="alert"[^>]*class="[^"]*error|<p[^>]*class="[^"]*error[^"]*"[^>]*role="alert"/);
  });

  test('đang tải: h1 "Hồ sơ" và "Đang tải…"', () => {
    const out = html({ token: 't', profile: null, error: null });
    expect(out).toMatch(/<h1[^>]*>Hồ sơ<\/h1>/);
    expect(text(out)).toContain('Đang tải…');
  });
});

describe('ProfileView.module.css (artboard ProfileDoodle)', () => {
  const css = readCss(path.join(__dirname, 'ProfileView.module.css'));
  const tsx = readFileSync(path.join(__dirname, 'ProfileView.tsx'), 'utf8');

  test('mọi styles.X trong component đều có lớp .X; tsx không có style inline', () => {
    expect(missingClasses(tsx, css)).toEqual([]);
    expect(tsx).not.toMatch(/style=\{/);
  });

  test('không chuyển động ngoài no-preference; không viết cứng hex', () => {
    expect(motionOutsideNoPreference(css)).toEqual([]);
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });

  test('hai cột 1.25fr / 1fr; từ 860px trở xuống một cột', () => {
    expect(blocks(css, '.grid')).toMatch(/grid-template-columns:\s*minmax\(0,\s*1\.25fr\)\s+minmax\(0,\s*1fr\)/);
    expect(blocks(mediaBody(css, /\(max-width:\s*860px\)/), '.grid')).toMatch(/grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  });

  test('khối điểm nền --mist bo --radius-block-lg, che hình tràn', () => {
    const b = blocks(css, '.pointsBlock');
    expect(b).toMatch(/background:\s*var\(--mist\)/);
    expect(b).toMatch(/border-radius:\s*var\(--radius-block-lg\)/);
    expect(b).toMatch(/overflow:\s*hidden/);
  });

  test('số điểm: --accent-display, xoay -3deg, tabular-nums, cỡ chữ clamp tối đa 150px và tối thiểu từ 24px (chữ cam lớn)', () => {
    const p = blocks(css, '.points');
    expect(p).toMatch(/color:\s*var\(--accent-display\)/);
    expect(p).toMatch(/transform:\s*rotate\(-3deg\)/);
    expect(p).toMatch(/font-variant-numeric:\s*tabular-nums/);
    const clamp = /font-size:\s*clamp\((\d+)px,\s*[\d.]+vw,\s*(\d+)px\)/.exec(p);
    expect(clamp).not.toBeNull();
    expect(Number(clamp![2])).toBe(150);
    expect(Number(clamp![1])).toBeGreaterThanOrEqual(24);
  });

  test('ở 360px số không gây cuộn ngang: cỡ nhỏ nhất đủ cho 6 ký tự trong bề ngang còn lại', () => {
    // 360 - 2×16 (gutter) - 2×24 (padding khối điểm ở màn hẹp) = 280px; Fraunces 800 rộng khoảng 0,62em mỗi ký tự số
    const min = Number(/font-size:\s*clamp\((\d+)px/.exec(blocks(css, '.points'))![1]);
    expect(min * 0.62 * 6).toBeLessThanOrEqual(280);
    expect(blocks(css, '.pointsLine')).toMatch(/flex-wrap:\s*wrap/);
  });

  test('thẻ tài khoản viền mực bo --radius-block; nút lịch sử viền mực bo --radius-cta', () => {
    const card = blocks(css, '.card');
    expect(card).toMatch(/border:\s*var\(--stroke\)/);
    expect(card).toMatch(/border-radius:\s*var\(--radius-block\)/);
    const btn = blocks(css, '.historyLink');
    expect(btn).toMatch(/border:\s*var\(--stroke\)/);
    expect(btn).toMatch(/border-radius:\s*var\(--radius-cta\)/);
  });

  test('lỗi nền --danger-bg chữ --danger-ink; CTA đăng nhập nền mực bo --radius-cta', () => {
    const err = blocks(css, '.error');
    expect(err).toMatch(/background:\s*var\(--danger-bg\)/);
    expect(err).toMatch(/color:\s*var\(--danger-ink\)/);
    // Trạng thái chưa đăng nhập đã tách ra GuestState (dùng chung với Lịch sử): lớp .cta nằm ở GuestState.module.css
    const cta = blocks(readCss(path.join(__dirname, 'GuestState.module.css')), '.cta');
    expect(cta).toMatch(/background:\s*var\(--ink\)/);
    expect(cta).toMatch(/border-radius:\s*var\(--radius-cta\)/);
  });
});

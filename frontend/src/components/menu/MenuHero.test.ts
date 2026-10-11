import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import MenuHero from './MenuHero';
import { formatVND } from '@/lib/pricing';
import { VND_FOR_ONE_POINT, VOUCHER_CODE, VOUCHER_PERCENT, VOUCHER_RATE } from '@/lib/promo';
import type { MenuSummary } from '@/lib/menu-summary';

// Không có trình duyệt: render ra HTML, kiểm chữ, thuộc tính và lớp. Không kiểm được bố cục, góc xoay hay chuyển động thật.
const html = (summary: MenuSummary | null = null) => renderToStaticMarkup(createElement(MenuHero, { summary }));
const text = (out: string) => out.replace(/<[^>]+>/g, '');
const tags = (out: string, name: string) => out.match(new RegExp(`<${name}\\b[^>]*>`, 'g')) ?? [];
// Ký tự mặc định hiện dạng emoji (☕…) hoặc bộ chọn biến thể emoji; ↗ và ✓ là ký tự chữ, không khớp.
const EMOJI = new RegExp('\\p{Emoji_Presentation}|\\uFE0F', 'u');

describe('MenuHero: tiêu đề', () => {
  const out = html();

  test('đúng một h1 "Cà phê mỗi ngày / pha đúng vị", lớp display', () => {
    expect(tags(out, 'h1')).toHaveLength(1);
    expect(out).toMatch(/<h1[^>]*class="[^"]*display[^"]*"/);
    const h1 = out.slice(out.indexOf('<h1'), out.indexOf('</h1>'));
    // có khoảng trắng giữa hai dòng (tên truy cập "… ngày pha …", không dính chữ)
    expect(text(h1)).toBe('Cà phê mỗi ngày pha đúng vị');
  });

  test('dòng 2 có lớp màu nhấn riêng, dòng 1 thì không', () => {
    expect(out).toMatch(/<span class="[^"]*accentLine[^"]*">pha đúng vị<\/span>/);
    expect(out).toMatch(/<span class="(?![^"]*accentLine)[^"]*">Cà phê mỗi ngày<\/span>/);
  });
});

describe('MenuHero: hai số thật ở cột trái (chỉ lấy từ lib/promo.ts)', () => {
  const t = text(html());

  test('"10%" là VOUCHER_RATE đổi ra phần trăm, kèm mã từ VOUCHER_CODE', () => {
    expect(VOUCHER_PERCENT).toBe(Math.round(VOUCHER_RATE * 100));
    expect(t).toContain(`${Math.round(VOUCHER_RATE * 100)}%`);
    expect(t).toContain(`giảm với mã ${VOUCHER_CODE}`);
  });

  test('"+1" điểm cho mỗi VND_FOR_ONE_POINT, định dạng bằng formatVND', () => {
    expect(t).toContain('+1');
    expect(t).toContain(`điểm cho mỗi ${formatVND(VND_FOR_ONE_POINT)}`);
  });

  test('mã nguồn không viết cứng 10%, 10.000 hay BREWLITE10', () => {
    const src = readFileSync(path.resolve(__dirname, 'MenuHero.tsx'), 'utf8');
    expect(src).not.toMatch(/10\s*%|10\.000|10000|BREWLITE10|0\.1\b/);
  });
});

describe('MenuHero: CTA "Đặt cà phê ↗"', () => {
  const out = html();

  test('là <a href="#menu">, mũi tên nằm trong span aria-hidden', () => {
    const a = out.match(/<a\b[^>]*>(?:(?!<\/a>).)*<\/a>/g) ?? [];
    expect(a).toHaveLength(1);
    const link = a[0] ?? '';
    expect(link).toMatch(/^<a[^>]*href="#menu"/);
    expect(text(link).trim()).toBe('Đặt cà phê ↗');
    expect(link).toMatch(/<span[^>]*aria-hidden="true"[^>]*>↗<\/span>/);
  });

  test('không có button, không có href="#" trơn', () => {
    expect(out).not.toContain('<button');
    expect(out).not.toContain('href="#"');
  });

  test('câu mô tả bên phải', () => {
    expect(text(out)).toContain('Chọn món, thanh toán không tiền mặt, nhận ly khi quầy báo sẵn sàng.');
  });
});

describe('MenuHero: "N món / giá từ X"', () => {
  test('summary = null (đang tải, lỗi, menu rỗng): không hiện', () => {
    const t = text(html(null));
    expect(t).not.toMatch(/\d+ món/);
    expect(t).not.toContain('giá từ');
  });

  test('có summary: hiện N món và giá thấp nhất định dạng formatVND', () => {
    const t = text(html({ count: 4, minPrice: 35000 }));
    expect(t).toContain('4 món');
    expect(t).toContain(`giá từ ${formatVND(35000)}`);
  });

  test('số đi theo dữ liệu, không cố định', () => {
    const t = text(html({ count: 7, minPrice: 29000 }));
    expect(t).toContain('7 món');
    expect(t).toContain(`giá từ ${formatVND(29000)}`);
  });
});

describe('MenuHero: hình minh họa', () => {
  const out = html({ count: 4, minPrice: 35000 });
  const imgs = tags(out, 'img');
  const srcCount = (src: string) => imgs.filter((i) => i.includes(`src="${src}"`)).length;

  test('mọi ảnh là trang trí: alt=""', () => {
    expect(imgs.length).toBeGreaterThan(0);
    for (const img of imgs) expect(img).toContain('alt=""');
  });

  test('mọi svg inline có aria-hidden="true"', () => {
    const svgs = tags(out, 'svg');
    expect(svgs.length).toBeGreaterThanOrEqual(3);
    for (const svg of svgs) expect(svg).toContain('aria-hidden="true"');
  });

  test('cảnh bình moka nằm trong khối aria-hidden', () => {
    expect(out).toMatch(/<div[^>]*aria-hidden="true"[^>]*>(?:(?!<\/div>).)*src="\/doodles\/moka\.svg"/);
  });

  test('đủ bộ cảnh: túi, bình, cốc, 2 hạt, 2 lá, 4 sao (2 sparkle + 2 burst)', () => {
    expect(srcCount('/doodles/bag.svg')).toBe(1);
    expect(srcCount('/doodles/moka.svg')).toBe(1);
    expect(srcCount('/doodles/mug.svg')).toBe(1);
    expect(srcCount('/doodles/bean.svg')).toBe(2);
    expect(srcCount('/doodles/leaf.svg')).toBe(2);
    expect(srcCount('/doodles/sparkle.svg') + srcCount('/doodles/burst.svg')).toBe(4);
  });

  test('4 sao lệch pha: mỗi sao một lớp pha riêng', () => {
    const phases = imgs.filter((i) => /doodles\/(sparkle|burst)\.svg/.test(i)).map((i) => /class="([^"]*)"/.exec(i)?.[1] ?? '');
    expect(new Set(phases).size).toBe(4);
  });

  test('hơi nước và mũi tên là path inline có pathLength="1" (vẽ nét bằng stroke-dashoffset)', () => {
    expect((out.match(/<path[^>]*pathLength="1"/g) ?? []).length).toBeGreaterThanOrEqual(3);
  });

  test('cụm 3 vòng ảnh món', () => {
    expect(srcCount('/images/latte.svg')).toBe(1);
    expect(srcCount('/images/americano.svg')).toBe(1);
    expect(srcCount('/images/tra-dao.svg')).toBe(1);
  });

  test('dưới 760px ẩn đúng 3 thứ: túi, mũi tên, lá trái', () => {
    const hidden = out.match(/<[a-z]+\b[^>]*class="[^"]*hideSm[^"]*"[^>]*>/g) ?? [];
    expect(hidden).toHaveLength(3);
    expect(hidden.some((h) => h.includes('src="/doodles/bag.svg"'))).toBe(true);
    expect(hidden.some((h) => h.startsWith('<svg'))).toBe(true);
  });
});

describe('MenuHero: chữ hiển thị', () => {
  const out = html({ count: 4, minPrice: 35000 });

  test('không em-dash, không emoji', () => {
    expect(out).not.toContain('—');
    expect(out).not.toMatch(EMOJI);
  });
});

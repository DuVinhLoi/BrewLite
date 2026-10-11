import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

// Quy tắc chuyển động (ui-visual-plan.md §5): mọi transition / animation / @keyframes nằm trong
// @media (prefers-reduced-motion: no-preference); giảm chuyển động thì nét vẽ hiện đủ, nên stroke-dash* cũng chỉ ở trong đó.
const componentsDir = path.resolve(__dirname, '..');
const read = (rel: string) => readFileSync(path.join(componentsDir, rel), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

// Chuỗi các at-rule bao quanh vị trí index (từ trong ra ngoài).
function enclosingAtRules(css: string, index: number): string[] {
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

const inNoPreference = (css: string, index: number) =>
  enclosingAtRules(css, index).some((r) => r.startsWith('@media') && /prefers-reduced-motion:\s*no-preference/.test(r));

/** Thân (giữa { }) của khối có bộ chọn đúng bằng selector, ở mọi cấp. */
function blocks(css: string, selector: string): string[] {
  const out: string[] = [];
  const re = new RegExp(`(^|[{};])\\s*${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^{}]*)\\}`, 'g');
  for (const m of Array.from(css.matchAll(re))) out.push(m[2]);
  return out;
}

/** Nội dung của @media khớp điều kiện (lấy cân ngoặc). */
function mediaBody(css: string, condition: RegExp): string {
  const m = new RegExp(`@media[^{]*${condition.source}[^{]*\\{`).exec(css);
  if (!m) return '';
  let depth = 1;
  let i = m.index + m[0].length;
  const start = i;
  for (; i < css.length && depth > 0; i++) {
    if (css[i] === '{') depth++;
    else if (css[i] === '}') depth--;
  }
  return css.slice(start, i - 1);
}

const FILES = ['menu/MenuHero.module.css', 'menu/MenuSection.module.css', 'ProductCard.module.css', 'ProductGrid.module.css'];

// Lớp dùng trong component mà CSS không có thì Next render class="… undefined" (vitest không bắt được vì CSS module là proxy).
describe.each(FILES)('%s: mọi styles.X trong component đều có lớp .X', (rel) => {
  test('không thiếu lớp', () => {
    const css = read(rel);
    const tsx = readFileSync(path.join(componentsDir, rel.replace('.module.css', '.tsx')), 'utf8');
    const used = Array.from(new Set(Array.from(tsx.matchAll(/styles\.(\w+)/g), (m) => m[1])));
    expect(used.length).toBeGreaterThan(0);
    const missing = used.filter((name) => !new RegExp(`\\.${name}(?![\\w-])`).test(css));
    expect(missing).toEqual([]);
  });
});

describe.each(FILES)('%s: chuyển động và màu', (rel) => {
  const css = read(rel);

  test('file có nội dung', () => {
    expect(css.length).toBeGreaterThan(100);
  });

  test('transition / animation / @keyframes chỉ nằm trong @media (prefers-reduced-motion: no-preference)', () => {
    for (const m of Array.from(css.matchAll(/transition|animation|@keyframes/g))) {
      expect(inNoPreference(css, m.index!), `"${m[0]}" ở vị trí ${m.index}`).toBe(true);
    }
  });

  test('stroke-dasharray / stroke-dashoffset chỉ trong no-preference: mặc định nét vẽ hiện đủ', () => {
    for (const m of Array.from(css.matchAll(/stroke-dash(array|offset)/g))) {
      expect(inNoPreference(css, m.index!), `"${m[0]}" ở vị trí ${m.index}`).toBe(true);
    }
  });

  test('không viết cứng mã màu hex (dùng token trong globals.css)', () => {
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });
});

describe('MenuHero.module.css: bố cục', () => {
  const css = read('menu/MenuHero.module.css');

  test('hero overflow-x: clip; tiêu đề không overflow: hidden', () => {
    expect(blocks(css, '.hero').join(';')).toMatch(/overflow-x:\s*clip/);
    expect(blocks(css, '.hero').join(';')).not.toMatch(/overflow:\s*hidden/);
    expect(blocks(css, '.title').join(';')).not.toMatch(/overflow/);
    expect(blocks(css, '.line').join(';')).not.toMatch(/overflow/);
  });

  test('tiêu đề xoay -4deg, line-height 1.12, cỡ clamp(46px, 7.4vw, 104px)', () => {
    const title = blocks(css, '.title').join(';');
    expect(title).toMatch(/transform:\s*rotate\(-4deg\)/);
    expect(title).toMatch(/line-height:\s*1\.12/);
    expect(title).toMatch(/font-size:\s*clamp\(46px,\s*7\.4vw,\s*104px\)/);
  });

  test('dòng 2 dùng --accent-display (chữ cam lớn)', () => {
    expect(blocks(css, '.accentLine').join(';')).toMatch(/color:\s*var\(--accent-display\)/);
  });

  test('dưới 760px: một cột, ẩn .hideSm, khung hình cao 380px', () => {
    const sm = mediaBody(css, /\(max-width:\s*760px\)/);
    expect(sm).toMatch(/grid-template-columns:\s*minmax\(0,\s*1fr\)/);
    expect(blocks(sm, '.hideSm').join(';')).toMatch(/display:\s*none/);
    expect(blocks(sm, '.stage').join(';')).toMatch(/height:\s*380px/);
  });

  test('CTA giống Button cta: bo --radius-cta, nền mực, chữ trắng, mũi tên cam', () => {
    const cta = blocks(css, '.cta').join(';');
    expect(cta).toMatch(/border-radius:\s*var\(--radius-cta\)/);
    expect(cta).toMatch(/background:\s*var\(--ink\)/);
    expect(cta).toMatch(/color:\s*var\(--paper\)/);
    expect(blocks(css, '.ctaArrow').join(';')).toMatch(/color:\s*var\(--accent\)/);
  });

  test('hơi nước 1.8s trễ 0.3s, mũi tên 1.4s trễ 1s, bình nổi 6s, sao 3.2s, lá 5s', () => {
    const motion = mediaBody(css, /\(prefers-reduced-motion:\s*no-preference\)/);
    expect(motion).toMatch(/\.steam path\s*\{[^}]*animation:[^;]*1\.8s[^;]*\.3s/);
    expect(motion).toMatch(/\.arrow path\s*\{[^}]*animation:[^;]*1\.4s[^;]*1s/);
    expect(motion).toMatch(/\.moka\s*\{[^}]*animation:[^;]*6s/);
    expect(motion).toMatch(/\.spark\s*\{[^}]*animation:[^;]*3\.2s/);
    expect(motion).toMatch(/\.sway\s*\{[^}]*animation:[^;]*5s/);
  });

  test('keyframes draw: opacity 0 ở mốc 0%, hiện ngay sau đó; dash "1 2"; fill-mode both phủ cả lúc trễ (không chấm tròn)', () => {
    const motion = mediaBody(css, /\(prefers-reduced-motion:\s*no-preference\)/);
    const draw = /@keyframes draw\s*\{([\s\S]*?)\n  \}/.exec(motion)?.[1] ?? '';
    expect(draw).toMatch(/0%\s*\{[^}]*opacity:\s*0/);
    expect(draw).toMatch(/1%\s*\{[^}]*opacity:\s*1/);
    expect(draw).toMatch(/(to|100%)\s*\{[^}]*stroke-dashoffset:\s*0/);
    for (const sel of ['.steam path', '.arrow path']) {
      const b = blocks(motion, sel).join(';');
      expect(b, sel).toMatch(/stroke-dasharray:\s*1 2\s*;/);
      expect(b, sel).toMatch(/animation:[^;]*\bboth\b/);
    }
    // ngoài khối no-preference không có opacity: 0 của nét vẽ (giảm chuyển động thì nét hiện đủ)
    expect(css.replace(motion, '')).not.toMatch(/\.(steam|arrow)[^{]*\{[^}]*opacity:\s*0/);
  });
});

describe('ProductCard.module.css: thẻ món §6 mục 3', () => {
  const css = read('ProductCard.module.css');

  test('thẻ viền mực 2px, bo --radius-card', () => {
    const card = blocks(css, '.card').join(';');
    expect(card).toMatch(/border:\s*var\(--stroke\)/);
    expect(card).toMatch(/border-radius:\s*var\(--radius-card\)/);
  });

  test('ô ảnh 4:3, ảnh phủ kín (object-fit: cover; SVG món 240×180 nên không bị cắt)', () => {
    expect(blocks(css, '.media').join(';')).toMatch(/aspect-ratio:\s*4\s*\/\s*3/);
    const img = blocks(css, '.img').join(';');
    expect(img).toMatch(/object-fit:\s*cover/);
    expect(img).toMatch(/width:\s*100%/);
    expect(img).toMatch(/height:\s*100%/);
  });

  test('tên món 26px; giá --accent-ink, tabular-nums', () => {
    expect(blocks(css, '.name').join(';')).toMatch(/font-size:\s*26px/);
    const price = blocks(css, '.price').join(';');
    expect(price).toMatch(/color:\s*var\(--accent-ink\)/);
    expect(price).toMatch(/font-variant-numeric:\s*tabular-nums/);
  });

  test('hết hàng: ô ảnh mờ và xám', () => {
    const out = blocks(css, '.out .media').join(';');
    expect(out).toMatch(/opacity:\s*0?\.5/);
    expect(out).toMatch(/filter:\s*grayscale\(/);
  });

  test('"Đã thêm ✓" nền --ok-bg, chữ --ok-ink', () => {
    const added = blocks(css, '.card .added').join(';');
    expect(added).toMatch(/background:\s*var\(--ok-bg\)/);
    expect(added).toMatch(/color:\s*var\(--ok-ink\)/);
  });

  test('hover: nhấc 3px, xoay -1deg (trong no-preference), bóng cứng --shadow-card-hover', () => {
    const motion = mediaBody(css, /\(prefers-reduced-motion:\s*no-preference\)/);
    expect(motion).toMatch(/\.card:hover\s*\{[^}]*transform:\s*translateY\(-3px\)\s*rotate\(-1deg\)/);
    expect(css).toMatch(/\.card:hover\s*\{[^}]*box-shadow:\s*var\(--shadow-card-hover\)/);
  });
});

describe('ProductGrid.module.css', () => {
  const css = read('ProductGrid.module.css');

  test('lưới auto-fill, cột tối thiểu 250px (không vượt bề rộng khung ở màn rất hẹp)', () => {
    expect(blocks(css, '.grid').join(';')).toMatch(/grid-template-columns:\s*repeat\(auto-fill,\s*minmax\(min\(250px,\s*100%\),\s*1fr\)\)/);
  });
});

describe('MenuSection.module.css', () => {
  const css = read('menu/MenuSection.module.css');

  test('gạch chân vẽ bằng --accent (mảng cam, không phải chữ cam nhỏ)', () => {
    expect(blocks(css, '.underline').join(';')).toMatch(/color:\s*var\(--accent\)/);
  });

  test('tiêu đề "Menu hôm nay" cỡ clamp(40px, 5vw, 60px)', () => {
    expect(blocks(css, '.title').join(';')).toMatch(/font-size:\s*clamp\(40px,\s*5vw,\s*60px\)/);
  });
});

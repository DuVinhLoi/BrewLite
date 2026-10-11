import { readFileSync } from 'node:fs';

// Hàm đọc CSS Modules cho test (chỉ test import). Cùng cách làm với components/menu/menu-css.test.ts:
// mọi transition / animation / @keyframes phải nằm trong @media (prefers-reduced-motion: no-preference).

/** Đọc file CSS, bỏ comment. */
export const readCss = (file: string) => readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

/** Chuỗi các at-rule bao quanh vị trí index (từ trong ra ngoài). */
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

export const inNoPreference = (css: string, index: number) =>
  enclosingAtRules(css, index).some((r) => r.startsWith('@media') && /prefers-reduced-motion:\s*no-preference/.test(r));

/** Vị trí các chữ transition / animation / @keyframes nằm NGOÀI khối no-preference (mảng rỗng là đạt). */
export const motionOutsideNoPreference = (css: string) =>
  Array.from(css.matchAll(/transition|animation|@keyframes/g))
    .filter((m) => !inNoPreference(css, m.index!))
    .map((m) => `${m[0]}@${m.index}`);

/** Thân (giữa { }) của khối có bộ chọn đúng bằng selector, ở mọi cấp. */
export function blocks(css: string, selector: string): string {
  const out: string[] = [];
  const re = new RegExp(`(^|[{};])\\s*${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^{}]*)\\}`, 'g');
  for (const m of Array.from(css.matchAll(re))) out.push(m[2]);
  return out.join(';');
}

/** Nội dung của @media đầu tiên khớp điều kiện (lấy cân ngoặc). */
export function mediaBody(css: string, condition: RegExp): string {
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

/** Lớp styles.X dùng trong file tsx mà CSS không có (Next sẽ render class="undefined"). */
export function missingClasses(tsx: string, css: string): string[] {
  const used = Array.from(new Set(Array.from(tsx.matchAll(/styles\.(\w+)/g), (m) => m[1])));
  return used.filter((name) => !new RegExp(`\\.${name}(?![\\w-])`).test(css));
}

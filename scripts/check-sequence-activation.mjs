// Kiểm các khối PlantUML sequence trong một file Markdown (sơ đồ trạng thái được bỏ qua):
//  [activation] message vẽ trên lifeline không có activation: người gửi / tự gọi chưa active,
//               người nhận request không được bật activation ngay dòng lệnh kế tiếp, activation chưa đóng;
//  [dài]        nhãn message quá MAX_LINES dòng hoặc một dòng quá MAX_CHARS ký tự (chi tiết nên chuyển xuống `note`);
//  [giọng]      nhãn có "nhé", "giúp" hoặc mở đầu bằng "Tôi" (tài liệu dùng giọng trung tính);
//  [mất]        (chỉ khi có --base) chuỗi trong ngoặc kép, mã HTTP, hằng IN_HOA có ở bản gốc mà bản mới không còn,
//               tính trong cùng mục §2.x, cả message lẫn note. Đây là cảnh báo: mỗi dòng phải được giải thích trong report.
// PlantUML giữ activation theo thứ tự dòng chữ (không theo nhánh alt/else), nên quét tuần tự là khớp ảnh render.
// Dùng: node scripts/check-sequence-activation.mjs <file.md> [--only 2.2,2.3] [--base <file gốc.md>]
// Thoát 1 khi có [activation], [dài] hoặc [giọng]; [mất] không làm đổi mã thoát.
import { readFileSync } from 'node:fs';

const MAX_LINES = 2;
const MAX_CHARS = 90;
const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const file = args.find((a, i) => !a.startsWith('--') && !['--only', '--base'].includes(args[i - 1]));
const only = opt('--only') ? new Set(opt('--only').split(',')) : null;
const base = opt('--base');
if (!file) {
  console.error('usage: node scripts/check-sequence-activation.mjs <file.md> [--only 2.2,2.3] [--base <base.md>]');
  process.exit(2);
}

const MSG = /^\s*(\w+)\s*(-{1,2}>{1,2})\s*(\w+)\s*:\s*(.*)$/;
const DECL = /^\s*(actor|participant|database|boundary|control|entity|collections|queue)\s+(?:"[^"]*"|\S+)\s+as\s+(\w+)/;
const SKIP = /^\s*(note|end note|'|skinparam|autonumber|title|$)/;
const TOKENS = /"[^"\n]+"|\b[1-5]\d\d\b|\b[A-Z][A-Z0-9]*_[A-Z0-9_]+\b|\b(?:PENDING|PAID|PREPARING|READY|COMPLETED|CANCELLED|CUSTOMER|BARISTA|ADMIN|WALLET|CARD)\b/g;

// Đọc một file: trả về danh sách vấn đề và, theo từng mục, tập token của các khối sequence.
function scan(path) {
  const lines = readFileSync(path, 'utf8').split(/\r?\n/);
  const problems = [];
  const tokens = new Map();
  let section = '';
  let inBlock = false;
  let actors, declared, active, blockStart, blockLines;
  const report = (i, msg) => {
    if (!only || only.has(section)) problems.push(`${path}:${i + 1} [§${section}] ${msg}`);
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const h = line.match(/^###\s+(\d+\.\d+)\b/);
    if (h) section = h[1];
    if (/^```(plantuml|puml)\s*$/.test(line)) {
      inBlock = true;
      actors = new Set();
      declared = new Set();
      active = new Map();
      blockStart = i;
      blockLines = [];
      continue;
    }
    if (!inBlock) continue;
    if (/^```\s*$/.test(line)) {
      inBlock = false;
      if (declared.size === 0) continue; // sơ đồ trạng thái
      for (const [p, n] of active) if (n !== 0) report(blockStart, `[activation] khối kết thúc mà ${p} còn ${n} activation chưa đóng`);
      const set = tokens.get(section) ?? new Set();
      for (const t of blockLines.join('\n').match(TOKENS) ?? []) set.add(t);
      tokens.set(section, set);
      continue;
    }
    blockLines.push(line);
    const d = line.match(DECL);
    if (d) {
      declared.add(d[2]);
      if (d[1] === 'actor') actors.add(d[2]);
      continue;
    }
    const a = line.match(/^\s*(activate|deactivate)\s+(\w+)/);
    if (a) {
      const n = (active.get(a[2]) ?? 0) + (a[1] === 'activate' ? 1 : -1);
      if (n < 0) report(i, `[activation] deactivate ${a[2]} khi ${a[2]} không có activation`);
      active.set(a[2], Math.max(0, n));
      continue;
    }
    const m = line.match(MSG);
    if (!m) continue;
    const [, from, arrow, to, label] = m;
    if (!declared.has(from) || !declared.has(to)) continue;
    const isActive = (p) => actors.has(p) || (active.get(p) ?? 0) > 0;
    if (!isActive(from)) report(i, `[activation] ${from} gửi khi không có activation: ${line.trim().slice(0, 80)}`);
    // request (->) tới lifeline chưa active: hợp lệ nếu dòng lệnh kế tiếp là `activate <to>`
    if (from !== to && !isActive(to)) {
      let j = i + 1;
      while (j < lines.length && SKIP.test(lines[j])) j++;
      const activatesNext = new RegExp(`^\\s*activate\\s+${to}\\b`).test(lines[j] ?? '');
      if (!(arrow.startsWith('->') && activatesNext)) report(i, `[activation] ${to} nhận khi không có activation: ${line.trim().slice(0, 80)}`);
    }
    const parts = label.split('\\n');
    if (parts.length > MAX_LINES || parts.some((p) => [...p].length > MAX_CHARS)) {
      report(i, `[dài] nhãn ${parts.length} dòng, dòng dài nhất ${Math.max(...parts.map((p) => [...p].length))} ký tự: ${label.slice(0, 60)}…`);
    }
    if (/\bnhé\b|\bgiúp\b|^Tôi\b/u.test(label)) report(i, `[giọng] ${label.slice(0, 70)}`);
  }
  return { problems, tokens };
}

const cur = scan(file);
const problems = [...cur.problems];
if (base) {
  const old = scan(base);
  for (const [section, set] of old.tokens) {
    if (only && !only.has(section)) continue;
    const now = cur.tokens.get(section) ?? new Set();
    for (const t of set) if (!now.has(t)) problems.push(`${file} [§${section}] [mất] ${t}`);
  }
}

for (const p of problems) console.log(p);
const count = (tag) => problems.filter((p) => p.includes(`[${tag}]`)).length;
console.log(`${count('activation')} activation, ${count('dài')} dài, ${count('giọng')} giọng, ${count('mất')} mất`);
process.exit(count('activation') + count('dài') + count('giọng') ? 1 : 0);

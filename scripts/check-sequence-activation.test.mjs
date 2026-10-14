// Chạy: node --test scripts/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const script = join(here, 'check-sequence-activation.mjs');
const dir = mkdtempSync(join(tmpdir(), 'seq-check-'));
let n = 0;

// Ghi một khối plantuml vào file Markdown tạm (kèm tiêu đề mục §2.2) rồi trả về đường dẫn.
function fixture(body, heading = '### 2.2 Thử') {
  const path = join(dir, `f${n++}.md`);
  writeFileSync(path, `${heading}\n\n\`\`\`plantuml\n${body}\n\`\`\`\n`);
  return path;
}
function run(file, ...extra) {
  const r = spawnSync(process.execPath, [script, file, ...extra], { encoding: 'utf8' });
  const lines = r.stdout.trim().split('\n');
  return { code: r.status, out: r.stdout, last: lines[lines.length - 1] };
}

const HEAD = 'actor "Khách" as User\nparticipant "Giao diện" as FE\nparticipant "Máy chủ" as BE\ndatabase "CSDL" as DB';

test('nhãn có "nhé" bị bắt (ranh giới Unicode)', () => {
  const f = fixture(`${HEAD}\nUser -> FE : Mở\nactivate FE\nFE --> User : Xong rồi nhé\ndeactivate FE`);
  const r = run(f);
  assert.match(r.last, /^0 activation, 0 dài, 1 giọng, 0 mất$/);
  assert.equal(r.code, 1);
});

test('nhãn có "giúp" bị bắt', () => {
  const f = fixture(`${HEAD}\nUser -> FE : Mở\nactivate FE\nFE -> BE : Lưu\nactivate BE\nBE -> DB : Lưu giúp đơn\nactivate DB\nDB --> BE : ok\ndeactivate DB\nBE --> FE : ok\ndeactivate BE\ndeactivate FE`);
  const r = run(f);
  assert.match(r.last, /^0 activation, 0 dài, 1 giọng, 0 mất$/);
  assert.equal(r.code, 1);
});

test('"nhéo" không bị bắt nhầm', () => {
  const f = fixture(`${HEAD}\nUser -> FE : Mở\nactivate FE\nFE -> FE : Kiểm nhéo\ndeactivate FE`);
  const r = run(f);
  assert.match(r.last, /^0 activation, 0 dài, 0 giọng, 0 mất$/);
  assert.equal(r.code, 0);
});

test('nhãn mở bằng "Tôi" bị bắt, "Tôi" ghép chữ khác thì không', () => {
  const bad = run(fixture(`${HEAD}\nUser -> FE : Tôi muốn mua\nactivate FE\ndeactivate FE`));
  assert.match(bad.last, /1 giọng/);
  const ok = run(fixture(`${HEAD}\nUser -> FE : Tôiii\nactivate FE\ndeactivate FE`));
  assert.match(ok.last, /0 giọng/);
});

test('khai báo không có "as" vẫn là sơ đồ sequence', () => {
  const f = fixture('actor User\nparticipant FE\nUser -> FE : mở\nactivate FE\ndeactivate FE\nFE -> FE : x');
  const r = run(f);
  assert.match(r.out, /\[activation\]/);
  assert.match(r.last, /^1 activation, /);
  assert.equal(r.code, 1);
});

test('note nhiều dòng không chặn nhìn trước "activate <to>"', () => {
  const f = fixture(
    `${HEAD}\nUser -> FE : Mở\nactivate FE\nFE -> BE : req\nnote over BE\nchi tiết\nend note\nactivate BE\nBE --> FE : ok\ndeactivate BE\ndeactivate FE`,
  );
  const r = run(f);
  assert.match(r.last, /^0 activation, 0 dài, 0 giọng, 0 mất$/);
  assert.equal(r.code, 0);
});

test('sơ đồ trạng thái (không khai báo participant) bị bỏ qua', () => {
  const f = fixture('[*] --> PENDING\nPENDING --> PAID : Trả tiền\nPAID --> [*]');
  const r = run(f);
  assert.equal(r.last, '0 activation, 0 dài, 0 giọng, 0 mất');
  assert.equal(r.code, 0);
});

test('--base: chuỗi trong ngoặc kép biến mất thì báo [mất], mã thoát 0', () => {
  const body = (label) => `${HEAD}\nUser -> FE : Mở\nactivate FE\nFE --> User : ${label}\ndeactivate FE`;
  const base = fixture(body('Hiện "Món đã hết hàng."'));
  const cur = fixture(body('Hiện thông báo hết hàng'));
  const r = run(cur, '--base', base);
  assert.match(r.out, /\[mất\] "Món đã hết hàng\."/);
  assert.match(r.last, /^0 activation, 0 dài, 0 giọng, 1 mất$/);
  assert.equal(r.code, 0);
});

test('tài liệu thật thoát 0', () => {
  const r = run(join(here, '..', 'docs', 'user-sequence-specifications.md'));
  assert.match(r.last, /^0 activation, 0 dài, 0 giọng, \d+ mất$/);
  assert.equal(r.code, 0);
});

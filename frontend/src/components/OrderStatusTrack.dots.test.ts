import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import OrderStatusTrack from './OrderStatusTrack';
import { blocks, missingClasses, motionOutsideNoPreference, readCss } from '@/test-utils/css';

// Thanh 5 bước nét mực (ui-visual-plan.md §6 mục 7, artboard DoneDoodle dòng 29 đến 33 và 63 đến 71).
// OrderStatusTrack.test.ts (giữ nguyên, không sửa) kiểm nhãn, "✓ ", aria-current; file này kiểm chấm, nét nối và nhãn riêng.
const html = (status: string) => renderToStaticMarkup(createElement(OrderStatusTrack, { status }));
const items = (out: string) => Array.from(out.matchAll(/<li\b([^>]*)>([\s\S]*?)<\/li>/g), (m) => ({ attrs: m[1], body: m[2] }));

describe('OrderStatusTrack: chấm từng bước', () => {
  test('PAID: mỗi bước có chấm trang trí aria-hidden đứng trước nhãn; lớp done / current / todo theo bước', () => {
    const steps = items(html('PAID'));
    expect(steps).toHaveLength(5);
    for (const s of steps) expect(s.body).toMatch(/^<span[^>]*class="[^"]*dot[^"]*"[^>]*aria-hidden="true"[^>]*><\/span><span\b/);
    expect(steps[0].attrs).toMatch(/class="[^"]*done/);
    expect(steps[1].attrs).toMatch(/class="[^"]*current/);
    for (const s of steps.slice(2)) expect(s.attrs).toMatch(/class="[^"]*todo/);
  });

  test('aria-current nằm trên nhãn của bước hiện tại (trong li có lớp current)', () => {
    const steps = items(html('READY'));
    const current = steps.filter((s) => s.body.includes('aria-current="step"'));
    expect(current).toHaveLength(1);
    expect(current[0].attrs).toMatch(/class="[^"]*current/);
    expect(steps.filter((s) => /class="[^"]*done/.test(s.attrs))).toHaveLength(3);
  });

  test('chấm không chứa chữ (dấu ✓ chỉ nằm trong nhãn)', () => {
    for (const s of items(html('COMPLETED'))) expect(s.body).toMatch(/<span[^>]*dot[^>]*><\/span>/);
  });

  test('không có vùng aria-live trong thanh (F8: biên lai bọc MỘT vùng; /history có nhiều thanh)', () => {
    for (const st of ['PENDING', 'PAID', 'COMPLETED', 'PAYMENT_FAILED', 'CANCELLED', 'XYZ']) expect(html(st)).not.toContain('aria-live');
  });
});

describe('OrderStatusTrack: nhãn riêng thay thanh', () => {
  test('PAYMENT_FAILED: nhãn lớp failed, chữ màu --danger-ink (mã màu cũ làm fallback)', () => {
    const out = html('PAYMENT_FAILED');
    expect(out).toMatch(/<p[^>]*class="[^"]*badge[^"]*failed[^"]*"[^>]*style="color:var\(--danger-ink, #b91c1c\)"[^>]*data-status="PAYMENT_FAILED"[^>]*>Thanh toán lỗi<\/p>/);
  });

  test('CANCELLED và trạng thái lạ: nhãn lớp neutral, chữ màu --muted (mã màu cũ làm fallback)', () => {
    expect(html('CANCELLED')).toMatch(/<p[^>]*class="[^"]*badge[^"]*neutral[^"]*"[^>]*style="color:var\(--muted, #6b7280\)"[^>]*>Đã hủy<\/p>/);
    expect(html('XYZ')).toMatch(/<p[^>]*class="[^"]*badge[^"]*neutral[^"]*"[^>]*>XYZ<\/p>/);
  });
});

describe('OrderStatusTrack.module.css', () => {
  const css = readCss(path.join(__dirname, 'OrderStatusTrack.module.css'));
  const tsx = readFileSync(path.join(__dirname, 'OrderStatusTrack.tsx'), 'utf8');

  test('mọi styles.X trong component đều có lớp .X', () => {
    expect(missingClasses(tsx, css)).toEqual([]);
  });

  test('không có chuyển động; không viết cứng hex', () => {
    expect(motionOutsideNoPreference(css)).toEqual([]);
    expect(css).not.toMatch(/transition|animation|@keyframes/);
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });

  test('lưới 5 cột đều nhau, không tràn ngang (minmax(0, 1fr))', () => {
    expect(blocks(css, '.track')).toMatch(/grid-template-columns:\s*repeat\(5,\s*minmax\(0,\s*1fr\)\)/);
  });

  test('chấm 30px viền mực tròn: bước sau nền trắng, đã qua nền mực, hiện tại nền cam', () => {
    const dot = blocks(css, '.dot');
    expect(dot).toMatch(/width:\s*30px/);
    expect(dot).toMatch(/height:\s*30px/);
    expect(dot).toMatch(/border:\s*var\(--stroke\)/);
    expect(dot).toMatch(/border-radius:\s*var\(--radius-pill\)/);
    expect(dot).toMatch(/background:\s*var\(--paper\)/);
    expect(blocks(css, '.done .dot')).toMatch(/background:\s*var\(--ink\)/);
    expect(blocks(css, '.current .dot')).toMatch(/background:\s*var\(--accent\)/);
  });

  test('nét nối: mặc định đứt (chưa tới), liền khi bước là done hoặc current', () => {
    expect(blocks(css, '.step:not(:first-child)::before')).toMatch(/border-top:\s*2px dashed var\(--ink\)/);
    expect(blocks(css, '.done:not(:first-child)::before')).toMatch(/border-top-style:\s*solid/);
    expect(blocks(css, '.current:not(:first-child)::before')).toMatch(/border-top-style:\s*solid/);
  });

  test('nhãn riêng: failed nền --danger-bg, neutral nền --mist, viền theo màu chữ', () => {
    expect(blocks(css, '.badge')).toMatch(/border:\s*2px solid currentColor/);
    expect(blocks(css, '.failed')).toMatch(/background:\s*var\(--danger-bg\)/);
    expect(blocks(css, '.neutral')).toMatch(/background:\s*var\(--mist\)/);
  });
});

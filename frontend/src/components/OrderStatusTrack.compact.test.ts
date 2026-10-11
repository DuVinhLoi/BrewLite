import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import OrderStatusTrack from './OrderStatusTrack';
import { blocks, readCss } from '@/test-utils/css';

// Thanh 5 bước cỡ nhỏ cho thẻ đơn ở /history (ui-visual-plan.md §6 mục 10, artboard HistoryDoodle dòng 28 đến 32).
// Cùng markup với cỡ thường (OrderStatusTrack.test.ts và .dots.test.ts giữ nguyên, không sửa); chỉ thêm một lớp trên <ol>.
const html = (status: string, compact?: boolean) => renderToStaticMarkup(createElement(OrderStatusTrack, { status, compact }));
const strip = (out: string) => out.replace(/ class="[^"]*"/g, '');

describe('OrderStatusTrack compact', () => {
  test('cùng markup với cỡ thường, chỉ khác lớp: "✓ ", đúng một aria-current, data-status', () => {
    for (const st of ['PENDING', 'PAID', 'READY', 'COMPLETED']) expect(strip(html(st, true))).toBe(strip(html(st)));
    const out = html('PAID', true);
    expect(out).toContain('✓ Chờ thanh toán');
    expect(out.match(/aria-current="step"/g)).toHaveLength(1);
    expect(out).toContain('data-status="PAID"');
  });

  test('<ol> có thêm lớp compact; cỡ thường không có', () => {
    expect(html('PAID', true)).toMatch(/<ol[^>]*class="[^"]*track[^"]*compact[^"]*"/);
    expect(html('PAID')).not.toMatch(/compact/);
  });

  test('Thanh toán lỗi / Đã hủy vẫn là nhãn riêng (không có thanh) ở cỡ nhỏ', () => {
    expect(html('CANCELLED', true)).toBe(html('CANCELLED'));
    expect(html('PAYMENT_FAILED', true)).toBe(html('PAYMENT_FAILED'));
  });

  test('CSS: chấm 22px, chữ 12px, nét nối dời theo tâm chấm 11px (artboard dòng 28 đến 31)', () => {
    const css = readCss(path.join(__dirname, 'OrderStatusTrack.module.css'));
    expect(blocks(css, '.compact')).toMatch(/gap:\s*2px/);
    expect(blocks(css, '.compact .step')).toMatch(/font-size:\s*12px/);
    const dot = blocks(css, '.compact .dot');
    expect(dot).toMatch(/width:\s*22px/);
    expect(dot).toMatch(/height:\s*22px/);
    const line = blocks(css, '.compact .step:not(:first-child)::before');
    expect(line).toMatch(/top:\s*10px/);
    expect(line).toMatch(/right:\s*calc\(50% \+ 11px\)/);
  });
});

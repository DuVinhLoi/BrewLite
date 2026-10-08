import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import OrderStatusTrack from './OrderStatusTrack';

// Không có trình duyệt trong CI: render component ra HTML để kiểm cái giảng viên sẽ thấy trên màn hình.
const html = (status: string) => renderToStaticMarkup(createElement(OrderStatusTrack, { status }));

describe('OrderStatusTrack (render HTML)', () => {
  test('PAID: 5 nhãn đúng thứ tự, bước đầu có dấu ✓, đúng 1 bước hiện tại là "Đã thanh toán"', () => {
    const out = html('PAID');
    const labels = ['Chờ thanh toán', 'Đã thanh toán', 'Đang pha', 'Sẵn sàng', 'Hoàn tất'];
    const positions = labels.map((l) => out.indexOf(l));
    expect(positions.every((p) => p >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions); // đúng thứ tự trái → phải
    expect(out).toContain('✓ Chờ thanh toán');
    expect(out.match(/aria-current="step"/g)).toHaveLength(1);
    expect(out).toMatch(/aria-current="step"[^>]*>Đã thanh toán</);
  });

  test('COMPLETED: 4 bước đầu có ✓, bước hiện tại là "Hoàn tất"', () => {
    const out = html('COMPLETED');
    expect(out.match(/✓/g)).toHaveLength(4);
    expect(out).toMatch(/aria-current="step"[^>]*>Hoàn tất</);
  });

  test('PAYMENT_FAILED hiện nhãn đỏ, CANCELLED hiện nhãn xám, không có thanh 5 bước', () => {
    const failed = html('PAYMENT_FAILED');
    expect(failed).toContain('Thanh toán lỗi');
    expect(failed).toContain('#b91c1c');
    expect(failed).not.toContain('Đang pha');
    const cancelled = html('CANCELLED');
    expect(cancelled).toContain('Đã hủy');
    expect(cancelled).toContain('#6b7280');
    expect(cancelled).not.toContain('Sẵn sàng');
  });

  test('trạng thái lạ: giữ nguyên chữ, không vỡ', () => {
    expect(html('XYZ')).toContain('XYZ');
  });
});

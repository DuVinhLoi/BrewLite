import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import PaymentSuccess, { PaymentReceipt, receiptStatus } from './PaymentSuccess';
import { formatVND } from '@/lib/pricing';
import type { PaymentResult } from '@/lib/payment';
import type { OrderDetail } from '@/lib/types';

// Không có trình duyệt trong CI: render ra HTML. Effect (poll) không chạy khi render phía server,
// nên PaymentSuccess vẽ lần đầu bằng trạng thái trong PaymentResult; trạng thái poll được kiểm qua PaymentReceipt / receiptStatus.
const result: PaymentResult = {
  orderCode: '#3f2a9c1e',
  orderId: '3f2a9c1e-7b44-4d7e-9a10-aaaaaaaaaaaa',
  status: 'PAID',
  amount: 80000,
  method: 'WALLET',
  idempotencyKey: 'k',
  discount: 0,
  loyaltyPointsEarned: 0,
};
const polled = (status: string): OrderDetail => ({ id: result.orderId!, status, total: 80000, createdAt: '2026-10-09T10:00:00Z', items: [] });
const receipt = (status: string, r: PaymentResult = result) => renderToStaticMarkup(createElement(PaymentReceipt, { result: r, status, onHome: () => {} }));

// F8: đúng MỘT vùng aria-live cho cả màn biên lai (bọc thanh trạng thái), không đặt trong OrderStatusTrack
// để /history (nhiều thẻ đơn cùng poll) không có hàng loạt vùng live.
describe('aria-live ở biên lai', () => {
  const live = (out: string) => out.match(/aria-live="polite"/g) ?? [];

  test('biên lai có đúng 1 vùng aria-live, bọc quanh thanh trạng thái', () => {
    const out = receipt('PAID');
    expect(live(out)).toHaveLength(1);
    expect(out).toMatch(/aria-live="polite"[^>]*><ol[^>]*aria-label="Tiến trình đơn hàng"/);
  });

  test('trạng thái PAYMENT_FAILED / CANCELLED (nhãn thay thanh) vẫn chỉ 1 vùng aria-live', () => {
    expect(live(receipt('CANCELLED'))).toHaveLength(1);
    expect(live(receipt('PAYMENT_FAILED'))).toHaveLength(1);
  });
});

describe('receiptStatus (trạng thái biên lai hiện)', () => {
  test('có đơn đã poll → lấy trạng thái của nó', () => {
    expect(receiptStatus(result, polled('PREPARING'))).toBe('PREPARING');
    expect(receiptStatus(result, polled('CANCELLED'))).toBe('CANCELLED');
  });
  test('chưa có phản hồi đầu tiên (hoặc không poll được) → trạng thái trong kết quả thanh toán', () => {
    expect(receiptStatus(result, undefined)).toBe('PAID');
  });
});

describe('PaymentReceipt (render HTML)', () => {
  test('hiện thanh tiến trình theo trạng thái được truyền vào: PREPARING → bước hiện tại "Đang pha"', () => {
    const out = receipt('PREPARING');
    expect(out).toContain('data-status="PREPARING"');
    expect(out).toMatch(/aria-current="step"[^>]*>Đang pha</);
    expect(out).not.toContain('data-status="PAID"');
  });

  test('COMPLETED → "Hoàn tất"; CANCELLED → nhãn "Đã hủy" thay thanh 5 bước', () => {
    expect(receipt('COMPLETED')).toMatch(/aria-current="step"[^>]*>Hoàn tất</);
    const cancelled = receipt('CANCELLED');
    expect(cancelled).toContain('Đã hủy');
    expect(cancelled).not.toContain('Sẵn sàng');
  });

  test('vẫn hiện mã đơn, số tiền, phương thức, lời nhắn và nút về trang chủ', () => {
    const out = receipt('PAID');
    expect(out).toContain('Đặt hàng thành công');
    expect(out).toContain('#3f2a9c1e');
    expect(out).toContain('Ví điện tử');
    expect(out).toContain('Mời tới quầy lấy nước');
    expect(out).toContain('Về trang chủ');
  });
});

describe('PaymentReceipt: điểm thưởng và giảm giá', () => {
  test('có điểm → "+N điểm" (định dạng vi-VN, nghìn có dấu chấm)', () => {
    expect(receipt('PAID', { ...result, loyaltyPointsEarned: 8 })).toContain('+8 điểm');
    expect(receipt('PAID', { ...result, loyaltyPointsEarned: 1250 })).toContain('+1.250 điểm');
  });

  test('0 điểm → không hiện dòng điểm; 0 giảm → không hiện "Đã giảm"', () => {
    const out = receipt('PAID');
    expect(out).not.toMatch(/\+\d[\d.]* điểm/);
    expect(out).not.toContain('Đã giảm');
  });

  test('có giảm giá → "Đã giảm: <số tiền>" và vẫn giữ "Đã trả"', () => {
    const out = receipt('PAID', { ...result, amount: 36000, discount: 4000, loyaltyPointsEarned: 3 });
    expect(out).toContain('Đã giảm:');
    expect(out).toContain(formatVND(4000));
    expect(out).toContain('Đã trả:');
    expect(out).toContain(formatVND(36000));
    expect(out).toContain('+3 điểm');
  });
});

describe('PaymentSuccess (render lần đầu)', () => {
  test('có orderId: trước phản hồi đầu tiên vẫn hiện trạng thái PAID của kết quả thanh toán', () => {
    const out = renderToStaticMarkup(createElement(PaymentSuccess, { result, onHome: () => {} }));
    expect(out).toContain('data-status="PAID"');
    expect(out).toMatch(/aria-current="step"[^>]*>Đã thanh toán</);
    expect(out).toContain('#3f2a9c1e');
  });

  test('không có orderId (cổng mock): render bình thường với trạng thái của kết quả', () => {
    const { orderId: _omit, ...mock } = result;
    const out = renderToStaticMarkup(createElement(PaymentSuccess, { result: mock, onHome: () => {} }));
    expect(out).toContain('data-status="PAID"');
    expect(out).toContain('Đặt hàng thành công');
  });
});

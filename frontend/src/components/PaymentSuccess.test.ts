import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import PaymentSuccess, { PaymentReceipt, receiptStatus } from './PaymentSuccess';
import { formatVND } from '@/lib/pricing';
import type { PaymentResult } from '@/lib/payment';
import type { OrderDetail } from '@/lib/types';
import { blocks, mediaBody, missingClasses, motionOutsideNoPreference, readCss } from '@/test-utils/css';

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

// Giao diện nét mực: ui-visual-plan.md §6 mục 7, artboard DoneDoodle.
describe('PaymentReceipt: biên lai nét mực (DoneDoodle)', () => {
  const out = receipt('PAID', { ...result, loyaltyPointsEarned: 8 });
  const text = (s: string) => s.replace(/<[^>]+>/g, '');

  test('đúng một h1 "Đặt hàng thành công" lớp display', () => {
    expect(out.match(/<h1\b/g)).toHaveLength(1);
    expect(out).toMatch(/<h1[^>]*class="[^"]*display[^"]*"[^>]*>Đặt hàng thành công<\/h1>/);
  });

  test('cốc và 3 sao trang trí alt="" aria-hidden; mỗi sao một lớp bật lên (pop1, pop2, pop3)', () => {
    const imgs = out.match(/<img\b[^>]*>/g) ?? [];
    expect(imgs.some((i) => i.includes('src="/doodles/mug.svg"'))).toBe(true);
    for (const img of imgs) {
      expect(img).toContain('alt=""');
      expect(img).toContain('aria-hidden="true"');
    }
    for (const n of [1, 2, 3]) expect(imgs.filter((i) => new RegExp(`class="[^"]*pop${n}`).test(i))).toHaveLength(1);
  });

  test('"Mã đơn:" kèm mã trong strong lớp display (Fraunces)', () => {
    expect(out).toMatch(/Mã đơn: <strong[^>]*class="[^"]*display[^"]*"[^>]*>#3f2a9c1e<\/strong>/);
  });

  test('"+N điểm tích lũy" là nhãn riêng (lớp points); 0 điểm thì không có nhãn', () => {
    expect(out).toMatch(/<span[^>]*class="[^"]*points[^"]*"[^>]*>\+8 điểm tích lũy<\/span>/);
    expect(receipt('PAID')).not.toMatch(/class="[^"]*points/);
  });

  test('"Trạng thái:" nằm ngoài vùng live, đứng ngay trước nó', () => {
    expect(out).toMatch(/>Trạng thái:<\/p><div aria-live="polite"[^>]*><ol/);
  });

  test('"Đã trả: <số tiền> (phương thức)"; "Đã giảm" (khi có) nằm sau "Đã trả"', () => {
    expect(text(out)).toContain(`Đã trả: ${formatVND(80000)} (Ví điện tử)`);
    const withDiscount = text(receipt('PAID', { ...result, discount: 4000 }));
    expect(withDiscount.indexOf('Đã giảm:')).toBeGreaterThan(withDiscount.indexOf('Đã trả:'));
  });

  test('dải "Mời tới quầy lấy nước" là p lớp display + band, nằm trong thẻ biên lai', () => {
    expect(out).toMatch(/<p[^>]*class="[^"]*display[^"]*band[^"]*"[^>]*>Mời tới quầy lấy nước<\/p><\/div>/);
  });

  test('"Về trang chủ" là Button ghost type="button"; màn này không có mũi tên cam ↗', () => {
    const btn = /<button\b[^>]*>Về trang chủ<\/button>/.exec(out)?.[0] ?? '';
    expect(btn).toContain('type="button"');
    expect(btn).toMatch(/class="[^"]*ghost/);
    expect(out).not.toContain('↗');
  });

  test('không href="#", không em-dash', () => {
    expect(out).not.toContain('href="#"');
    expect(text(out)).not.toContain('—');
  });
});

describe('PaymentSuccess.module.css (artboard DoneDoodle)', () => {
  const css = readCss(path.join(__dirname, 'PaymentSuccess.module.css'));
  const tsx = readFileSync(path.join(__dirname, 'PaymentSuccess.tsx'), 'utf8');
  const motion = mediaBody(css, /\(prefers-reduced-motion:\s*no-preference\)/);

  test('mọi styles.X trong component đều có lớp .X; tsx không còn style inline', () => {
    expect(missingClasses(tsx, css)).toEqual([]);
    expect(tsx).not.toMatch(/style=\{/);
  });

  test('chuyển động chỉ trong @media (prefers-reduced-motion: no-preference); không viết cứng hex', () => {
    expect(motionOutsideNoPreference(css)).toEqual([]);
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });

  test('sao bật lên một lần: scale 0.4 → 1.15 → 1 trong 0.6s, lệch 0.15s', () => {
    const kf = /@keyframes\s+pop\s*\{([\s\S]*?\})\s*\}/.exec(motion)?.[1] ?? '';
    expect(kf).toMatch(/0%\s*\{[^}]*transform:\s*scale\(0\.4\)[^}]*opacity:\s*0/);
    expect(kf).toMatch(/60%\s*\{[^}]*transform:\s*scale\(1\.15\)/);
    expect(kf).toMatch(/100%\s*\{[^}]*transform:\s*scale\(1\)/);
    const one = blocks(motion, '.pop1');
    expect(one).toMatch(/animation:\s*pop 0\.6s[^;]*both/);
    expect(one).not.toMatch(/infinite/);
    expect(blocks(motion, '.pop2')).toMatch(/animation-delay:\s*0\.15s/);
    expect(blocks(motion, '.pop3')).toMatch(/animation-delay:\s*0\.3s/);
  });

  test('tiêu đề clamp(40px, 5.4vw, 64px), line-height 1.12, canh giữa', () => {
    const t = blocks(css, '.title');
    expect(t).toMatch(/font-size:\s*clamp\(40px,\s*5\.4vw,\s*64px\)/);
    expect(t).toMatch(/line-height:\s*1\.12/);
    expect(t).toMatch(/text-align:\s*center/);
  });

  test('thẻ biên lai rộng tối đa 640, viền mực bo --radius-card', () => {
    const card = blocks(css, '.card');
    expect(card).toMatch(/max-width:\s*640px/);
    expect(card).toMatch(/border:\s*var\(--stroke\)/);
    expect(card).toMatch(/border-radius:\s*var\(--radius-card\)/);
  });

  test('mã đơn 30px; nhãn điểm nền --ok-bg chữ --ok-ink bo tròn', () => {
    expect(blocks(css, '.codeValue')).toMatch(/font-size:\s*30px/);
    const pts = blocks(css, '.points');
    expect(pts).toMatch(/background:\s*var\(--ok-bg\)/);
    expect(pts).toMatch(/color:\s*var\(--ok-ink\)/);
    expect(pts).toMatch(/border-radius:\s*var\(--radius-pill\)/);
  });

  test('dải cam: nền --accent, chữ --ink 24px (chữ mực trên cam, cam chỉ làm nền)', () => {
    const band = blocks(css, '.band');
    expect(band).toMatch(/background:\s*var\(--accent\)/);
    expect(band).toMatch(/color:\s*var\(--ink\)/);
    expect(band).toMatch(/font-size:\s*24px/);
  });

  test('nút "Về trang chủ" bo --radius-cta như artboard', () => {
    expect(blocks(css, '.receipt .home')).toMatch(/border-radius:\s*var\(--radius-cta\)/);
  });
});

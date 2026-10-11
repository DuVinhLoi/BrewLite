import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import HistoryView from './HistoryView';
import { ApiError } from '@/lib/api';
import { formatVND } from '@/lib/pricing';
import type { HistoryOrder } from '@/lib/types';
import { blocks, missingClasses, readCss } from '@/test-utils/css';

// Màn Lịch sử nét mực: ui-visual-plan.md §6 mục 10 (thẻ đơn) và mục 11 (lịch sử rỗng, chưa đăng nhập), artboard HistoryDoodle
// và StatesDoodle. Hành vi (poll, hủy, lỗi, thứ tự nhánh) do HistoryView.test.ts ghim, file đó không sửa.
const order = (over: Partial<HistoryOrder> = {}): HistoryOrder => ({
  id: '3f2a9c1e-7b44-4d7e-9a10-aaaaaaaaaaaa',
  status: 'PAID',
  total: 80000,
  createdAt: '2026-10-09T10:00:00.000Z',
  items: [{ productId: 'p1', productName: 'Latte', quantity: 2, unitPrice: 40000, size: 'M', toppings: [] }],
  ...over,
});

type Props = Parameters<typeof HistoryView>[0];
const noop = () => {};
const html = (over: Partial<Props>) =>
  renderToStaticMarkup(
    createElement(HistoryView, {
      token: 'tok',
      orders: undefined,
      error: undefined,
      busyId: null,
      actionError: null,
      onCancel: noop,
      onRetry: noop,
      ...over,
    }),
  );
const text = (out: string) => out.replace(/<[^>]+>/g, '');
const articles = (out: string) => Array.from(out.matchAll(/<article\b([^>]*)>([\s\S]*?)<\/article>/g), (m) => ({ attrs: m[1], body: m[2] }));

const branches: Record<string, Partial<Props>> = {
  'chưa đăng nhập': { token: null },
  'đang tải': {},
  'lỗi': { error: new ApiError('Không kết nối được máy chủ.', 0) },
  'rỗng': { orders: [] },
  'danh sách': { orders: [order(), order({ id: 'bbbbbbbb-0000', status: 'CANCELLED' }), order({ id: 'cccccccc-0000', status: 'PAYMENT_FAILED' })] },
};

describe('HistoryView: khung chung mọi nhánh', () => {
  test.each(Object.entries(branches))('%s: section mở đầu bằng h1 "Lịch sử đơn hàng"; không style inline, không href="#", không em-dash', (_n, props) => {
    const out = html(props);
    expect(out).toMatch(/^<section[^>]*><h1>Lịch sử đơn hàng<\/h1>/);
    expect(out.match(/<h1\b/g)).toHaveLength(1);
    // Ngoại lệ duy nhất: nhãn riêng của OrderStatusTrack (màu chữ inline có fallback mà OrderStatusTrack.test.ts ghim)
    expect(out.replace(/<p\b[^>]*data-status="[^"]*"[^>]*>/g, '')).not.toContain('style=');
    expect(out).not.toContain('href="#"');
    expect(text(out)).not.toContain('—');
  });

  test('mọi hình trang trí alt="" (hình của thẻ đơn và tiêu đề còn aria-hidden)', () => {
    for (const props of Object.values(branches)) {
      for (const img of html(props).match(/<img\b[^>]*>/g) ?? []) expect(img).toContain('alt=""');
    }
  });
});

describe('HistoryView: thẻ đơn (§6 mục 10)', () => {
  const out = html(branches['danh sách']);
  const [paid, cancelled, failed] = articles(out);

  test('tiêu đề có túi hạt trang trí cạnh h1', () => {
    expect(out).toMatch(/<\/h1><img[^>]*src="\/doodles\/bag\.svg"[^>]*alt=""[^>]*aria-hidden="true"/);
  });

  test('đầu thẻ: mã đơn Fraunces (display), nhãn STATUS_LABEL tiếng Việt, tổng tiền tabular', () => {
    expect(paid.body).toMatch(/<strong[^>]*class="[^"]*display[^"]*"[^>]*>#3f2a9c1e<\/strong>/);
    expect(paid.body).toMatch(/<span[^>]*>Đã thanh toán<\/span>/);
    expect(paid.body).toMatch(new RegExp(`<span[^>]*class="[^"]*tabular[^"]*"[^>]*>${formatVND(80000)}</span>`));
  });

  test('bỏ dòng cũ "#id • STATUS • total": không còn mã trạng thái tiếng Anh trong chữ hiển thị, không còn " • "', () => {
    for (const code of ['PAID', 'CANCELLED', 'PAYMENT_FAILED']) expect(text(out)).not.toContain(code);
    expect(text(out)).not.toContain(' • ');
  });

  test('thời gian trong <time dateTime>, định dạng vi-VN', () => {
    const when = new Date('2026-10-09T10:00:00.000Z').toLocaleString('vi-VN');
    expect(paid.body).toContain(`<time dateTime="2026-10-09T10:00:00.000Z">${when}</time>`);
  });

  test('đơn đang chạy: thanh 5 bước cỡ nhỏ (lớp compact), không mờ', () => {
    expect(paid.body).toMatch(/<ol[^>]*class="[^"]*compact[^"]*"[^>]*data-status="PAID"/);
    expect(paid.attrs).not.toMatch(/faded/);
  });

  test('dòng món: ô ảnh 44px (hạt trang trí), chữ "2× Latte (M)" và đơn giá ở phần tử riêng', () => {
    const li = /<li\b[^>]*class="[^"]*item[^"]*"[^>]*>([\s\S]*?)<\/li>/.exec(paid.body)?.[1] ?? '';
    expect(li).toMatch(/<span[^>]*class="[^"]*thumb[^"]*"[^>]*><img[^>]*src="\/doodles\/bean\.svg"[^>]*alt=""[^>]*aria-hidden="true"/);
    expect(li).toMatch(/<span[^>]*>2× Latte \(M\)<\/span>/);
    expect(li).toMatch(new RegExp(`<span[^>]*class="[^"]*price[^"]*"[^>]*>${formatVND(40000)}</span>`));
  });

  test('nút viền đỏ "Hủy đơn" khi canCancel (PAID, PAYMENT_FAILED), không có ở CANCELLED', () => {
    expect(paid.body).toMatch(/<button[^>]*class="[^"]*cancel[^"]*"[^>]*>Hủy đơn<\/button>/);
    expect(failed.body).toContain('Hủy đơn');
    expect(cancelled.body).not.toContain('Hủy đơn');
  });

  test('đơn đã hủy / thanh toán lỗi: thẻ mờ (lớp faded), không có thanh 5 bước, nhãn riêng hiện đúng một lần', () => {
    expect(cancelled.attrs).toMatch(/class="[^"]*faded/);
    expect(failed.attrs).toMatch(/class="[^"]*faded/);
    expect(cancelled.body).not.toContain('<ol');
    expect(failed.body).not.toContain('<ol');
    expect(text(cancelled.body).match(/Đã hủy/g)).toHaveLength(1);
    expect(text(failed.body).match(/Thanh toán lỗi/g)).toHaveLength(1);
  });

  test('không có CTA cam (↗) ở nhánh danh sách', () => {
    expect(out).not.toContain('↗');
  });
});

describe('HistoryView: rỗng, chưa đăng nhập, lỗi (§6 mục 11)', () => {
  test('rỗng: túi hạt, h2 "Chưa có đơn hàng nào.", CTA "Xem menu ↗" là liên kết thật tới / (↗ aria-hidden, đúng một)', () => {
    const out = html({ orders: [] });
    expect(out).toMatch(/<img[^>]*src="\/doodles\/bag\.svg"[^>]*alt=""/);
    expect(out).toMatch(/<h2[^>]*>Chưa có đơn hàng nào\.<\/h2>/);
    const link = /<a\b([^>]*)>([\s\S]*?)<\/a>/.exec(out);
    expect(link?.[1]).toMatch(/href="\/"/);
    expect(text(link?.[2] ?? '').replace('↗', '').trim()).toBe('Xem menu');
    expect(link?.[2]).toMatch(/<span[^>]*aria-hidden="true"[^>]*>↗<\/span>/);
    expect(out.match(/↗/g)).toHaveLength(1);
  });

  test('chưa đăng nhập: GuestState (h2 "Bạn chưa đăng nhập.", hạt, CTA "Đăng nhập" tới /login)', () => {
    const out = html({ token: null });
    expect(out).toMatch(/<h2[^>]*class="[^"]*display[^"]*"[^>]*>Bạn chưa đăng nhập\.<\/h2>/);
    expect(out).toMatch(/<img[^>]*src="\/doodles\/bean\.svg"/);
    expect(out).toMatch(/<a[^>]*href="\/login"[^>]*>Đăng nhập<\/a>/);
  });

  test('lỗi: ErrorState có cốc trang trí, câu "Không tải được lịch sử: …" và "Thử lại"', () => {
    const out = html({ error: new ApiError('Không kết nối được máy chủ.', 0) });
    expect(out).toMatch(/role="alert"[^>]*><img[^>]*src="\/doodles\/mug\.svg"[^>]*alt=""/);
    expect(text(out)).toContain('Không tải được lịch sử: Không kết nối được máy chủ.');
    expect(text(out)).toContain('Thử lại');
  });

  test('đang tải: "Đang tải…" nằm trong section có tiêu đề', () => {
    expect(html({})).toMatch(/^<section[^>]*><h1>Lịch sử đơn hàng<\/h1>[\s\S]*Đang tải…[\s\S]*<\/section>$/);
  });
});

describe('HistoryView.module.css (artboard HistoryDoodle)', () => {
  const css = readCss(path.join(__dirname, 'HistoryView.module.css'));
  const tsx = readFileSync(path.join(__dirname, 'HistoryView.tsx'), 'utf8');

  test('mọi styles.X có lớp .X; tsx không style inline; không viết cứng hex', () => {
    expect(missingClasses(tsx, css)).toEqual([]);
    expect(tsx).not.toMatch(/style=\{/);
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });

  test('không có chuyển động nào trên trang (chỉ :active của Button dùng chung)', () => {
    expect(css).not.toMatch(/transition|animation|@keyframes/);
  });

  test('khung rộng tối đa 860px, căn giữa; h1 Fraunces cỡ tiêu đề trang', () => {
    const page = blocks(css, '.page');
    expect(page).toMatch(/max-width:\s*860px/);
    expect(page).toMatch(/margin:\s*0 auto/);
    const h1 = blocks(css, '.page > h1');
    expect(h1).toMatch(/font-family:\s*var\(--font-display\)/);
    expect(h1).toMatch(/font-weight:\s*800/);
    expect(h1).toMatch(/font-size:\s*clamp\(40px,\s*5vw,\s*56px\)/);
  });

  test('thẻ: viền mực, bo --radius-card; đơn mờ opacity 0.72', () => {
    const card = blocks(css, '.card');
    expect(card).toMatch(/border:\s*var\(--stroke\)/);
    expect(card).toMatch(/border-radius:\s*var\(--radius-card\)/);
    expect(css).toMatch(/\.faded[^{]*\{[^}]*opacity:\s*0\.72/);
  });

  test('ô ảnh 44px viền mực bo --radius-tile-sm; giá tabular màu --muted; mã đơn 26px', () => {
    const thumb = blocks(css, '.thumb');
    expect(thumb).toMatch(/width:\s*44px/);
    expect(thumb).toMatch(/height:\s*44px/);
    expect(thumb).toMatch(/border:\s*var\(--stroke\)/);
    expect(thumb).toMatch(/border-radius:\s*var\(--radius-tile-sm\)/);
    expect(blocks(css, '.price')).toMatch(/color:\s*var\(--muted\)/);
    expect(blocks(css, '.code')).toMatch(/font-size:\s*26px/);
  });

  test('nút "Hủy đơn" viền đỏ trên nền trắng (thắng nền --danger-bg của Button danger)', () => {
    const b = blocks(css, '.actions .cancel');
    expect(b).toMatch(/background:\s*var\(--paper\)/);
  });

  test('CTA "Xem menu": nền mực bo --radius-cta, ↗ màu --accent', () => {
    const cta = blocks(css, '.ctaLink');
    expect(cta).toMatch(/background:\s*var\(--ink\)/);
    expect(cta).toMatch(/border-radius:\s*var\(--radius-cta\)/);
    expect(blocks(css, '.ctaArrow')).toMatch(/color:\s*var\(--accent\)/);
  });
});

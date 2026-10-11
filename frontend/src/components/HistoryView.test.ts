import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import HistoryView from './HistoryView';
import { ApiError } from '@/lib/api';
import type { HistoryOrder } from '@/lib/types';

// Không có trình duyệt trong CI: render ra HTML để kiểm cái người dùng thấy trên /history. Không kiểm được thao tác bấm.
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

describe('HistoryView: trước khi có danh sách', () => {
  test('token=undefined (chưa đọc sessionStorage): chưa vẽ gì, tránh nháy "chưa đăng nhập"', () => {
    expect(html({ token: undefined })).toBe('');
  });

  test('token=null: "Bạn chưa đăng nhập" và link /login', () => {
    const out = html({ token: null });
    expect(out).toContain('Bạn chưa đăng nhập');
    expect(out).toContain('href="/login?next=%2Fhistory"'); // đăng nhập xong quay lại /history (safeNext)
  });

  test('có token, chưa có dữ liệu, chưa lỗi: "Đang tải…"', () => {
    expect(html({})).toContain('Đang tải…');
  });

  test('lỗi tải lúc chưa có danh sách: ErrorState role="alert" với câu "Không tải được lịch sử: …" và nút "Thử lại"', () => {
    const out = html({ error: new ApiError('Không kết nối được máy chủ.', 0) });
    expect(out).toContain('role="alert"');
    expect(out).toContain('Không tải được lịch sử: Không kết nối được máy chủ.');
    expect(out).toContain('Thử lại');
    expect(out).not.toContain('Đang tải…');
    expect(out).toMatch(/^<section[^>]*><h1>Lịch sử đơn hàng<\/h1>/);
  });

  test('danh sách rỗng: "Chưa có đơn hàng nào." nằm trong section có tiêu đề "Lịch sử đơn hàng"', () => {
    const out = html({ orders: [] });
    expect(out).toContain('Chưa có đơn hàng nào.');
    expect(out).toMatch(/^<section[^>]*><h1>Lịch sử đơn hàng<\/h1>/);
    expect(out).toMatch(/<\/section>$/);
  });

  test('danh sách rỗng kèm lỗi poll: khối lỗi và "Chưa có đơn hàng nào." cùng nằm trong section có tiêu đề', () => {
    const out = html({ orders: [], error: new ApiError('Máy chủ trả lỗi (mã 503).', 503) });
    expect(out).toMatch(/^<section[^>]*><h1>Lịch sử đơn hàng<\/h1>/);
    expect(out).toContain('Không tải được lịch sử: Máy chủ trả lỗi (mã 503).');
    expect(out).toContain('Chưa có đơn hàng nào.');
    expect(out.indexOf('Không tải được lịch sử')).toBeLessThan(out.indexOf('Chưa có đơn hàng nào.'));
    expect(out).toMatch(/<\/section>$/);
  });
});

describe('HistoryView: có danh sách', () => {
  test('hiện mã đơn, trạng thái, thanh tiến trình và dòng món', () => {
    const out = html({ orders: [order()] });
    expect(out).toContain('#3f2a9c1e');
    expect(out).toContain('data-status="PAID"');
    expect(out).toContain('2× Latte');
  });

  test('nút "Hủy đơn" chỉ ở đơn hủy được (PAID có, COMPLETED / CANCELLED / PREPARING không)', () => {
    expect(html({ orders: [order()] })).toContain('Hủy đơn');
    for (const status of ['COMPLETED', 'CANCELLED', 'PREPARING', 'READY']) {
      expect(html({ orders: [order({ status })] })).not.toContain('Hủy đơn');
    }
  });

  test('đơn đang hủy: nút khóa và đổi chữ "Đang xử lý…"', () => {
    const o = order();
    const out = html({ orders: [o], busyId: o.id });
    expect(out).toContain('Đang xử lý…');
    expect(out).toContain('disabled=""');
  });

  test('lỗi thao tác hiện dưới đúng thẻ đơn có lỗi', () => {
    const a = order({ id: 'aaaaaaaa-0000' });
    const b = order({ id: 'bbbbbbbb-0000' });
    const out = html({ orders: [a, b], actionError: { id: b.id, message: 'Không tìm thấy đơn.' } });
    expect(out.match(/Không tìm thấy đơn\./g)).toHaveLength(1);
    expect(out.indexOf('Không tìm thấy đơn.')).toBeGreaterThan(out.indexOf('#bbbbbbbb'));
  });

  // Poll nền gặp lỗi tạm (mất mạng, 5xx) khi đã có danh sách: giữ danh sách cũ, báo lỗi kèm "Thử lại"; poll tự khỏi lỗi ở lần sau
  test('lỗi poll khi đã có danh sách: danh sách cũ vẫn hiện, kèm khối lỗi và "Thử lại"', () => {
    const out = html({ orders: [order()], error: new ApiError('Máy chủ trả lỗi (mã 503).', 503) });
    expect(out).toContain('2× Latte');
    expect(out).toContain('Không tải được lịch sử: Máy chủ trả lỗi (mã 503).');
    expect(out).toContain('role="alert"');
    expect(out).toContain('Thử lại');
  });

  test('mỗi thẻ đơn có thanh trạng thái nhưng /history không có vùng aria-live nào (tránh nhiều vùng live cùng đọc sau mỗi lần poll)', () => {
    const out = html({ orders: [order(), order({ id: 'bbbbbbbb-0000', status: 'CANCELLED' }), order({ id: 'cccccccc-0000', status: 'READY' })] });
    expect(out.match(/data-status=/g)).toHaveLength(3);
    expect(out).not.toContain('aria-live');
  });

  test('không có lỗi thì không có khối lỗi', () => {
    const out = html({ orders: [order()] });
    expect(out).not.toContain('Không tải được lịch sử');
    expect(out).not.toContain('Thử lại');
  });
});

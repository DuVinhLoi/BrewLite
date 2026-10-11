import { describe, expect, test } from 'vitest';
import { itemLine, needsPolling, sortNewestFirst } from './history';
import { formatVND } from './pricing';
import type { HistoryItem, HistoryOrder } from './types';

const item = (over: Partial<HistoryItem> = {}): HistoryItem => ({
  productId: '3f2a9c1e-7b44-4d7e-9a10-aaaaaaaaaaaa',
  productName: 'Latte',
  quantity: 2,
  unitPrice: 40000,
  size: 'M',
  toppings: [],
  ...over,
});

// UC07: dòng món trong lịch sử hiện tên món do backend gắn, không còn 8 ký tự đầu của mã món.
describe('itemLine', () => {
  test('hiện số lượng, tên món, size và giá; không lộ mã món', () => {
    const line = itemLine(item());
    expect(line).toBe(`2× Latte (M) — ${formatVND(40000)}`);
    expect(line).not.toContain('3f2a9c1e');
  });

  test('có topping: nối sau dấu cộng, cách nhau dấu phẩy', () => {
    expect(itemLine(item({ size: 'L', toppings: ['Trân châu', 'Kem cheese'] }))).toBe(
      `2× Latte (L + Trân châu, Kem cheese) — ${formatVND(40000)}`,
    );
  });

  test('thiếu size → M; thiếu toppings → như không có topping', () => {
    expect(itemLine(item({ size: undefined, toppings: undefined }))).toBe(`2× Latte (M) — ${formatVND(40000)}`);
  });

  test('món đã bị xóa: backend gửi productId làm productName, dòng vẫn hiện được', () => {
    expect(itemLine(item({ productName: 'p-deleted' }))).toContain('p-deleted');
  });

  // Backend cũ hoặc phản hồi lạ: không in 'undefined' / để trống, rơi về 8 ký tự đầu của mã món
  test.each([
    ['thiếu field productName', undefined],
    ['productName rỗng', ''],
    ['productName không phải chuỗi', 42],
  ])('%s → 8 ký tự đầu của productId', (_name, productName) => {
    const line = itemLine(item({ productName: productName as unknown as string }));
    expect(line).toBe(`2× 3f2a9c1e (M) — ${formatVND(40000)}`);
    expect(line).not.toContain('undefined');
  });
});

describe('sortNewestFirst', () => {
  const order = (id: string, createdAt: string): HistoryOrder => ({ id, status: 'PAID', total: 1, createdAt, items: [item()] });

  test('đơn mới nhất lên đầu, không đổi mảng gốc', () => {
    const input = [order('a', '2026-10-09T09:00:00Z'), order('c', '2026-10-09T11:00:00Z'), order('b', '2026-10-09T10:00:00Z')];
    const before = input.map((o) => o.id);
    expect(sortNewestFirst(input).map((o) => o.id)).toEqual(['c', 'b', 'a']);
    expect(input.map((o) => o.id)).toEqual(before);
  });
});

// Ruling R14: /history poll GET /orders/me chỉ khi còn đơn do quầy đẩy (PAID / PREPARING / READY).
describe('needsPolling', () => {
  const withStatus = (...statuses: string[]): HistoryOrder[] =>
    statuses.map((status, i) => ({ id: `o${i}`, status, total: 1, createdAt: '2026-10-09T10:00:00Z', items: [item()] }));

  test('có đơn PAID / PREPARING / READY → poll tiếp', () => {
    expect(needsPolling(withStatus('PAID'))).toBe(true);
    expect(needsPolling(withStatus('PREPARING'))).toBe(true);
    expect(needsPolling(withStatus('READY'))).toBe(true);
  });

  test('trộn: một đơn do quầy đẩy là đủ để poll tiếp', () => {
    expect(needsPolling(withStatus('COMPLETED', 'PAID', 'CANCELLED'))).toBe(true);
    expect(needsPolling(withStatus('PENDING', 'PAYMENT_FAILED', 'READY'))).toBe(true);
  });

  test('chỉ có đơn PENDING / PAYMENT_FAILED / trạng thái lạ → dừng ngay (chỉ người dùng đẩy được, không poll mãi)', () => {
    expect(needsPolling(withStatus('PENDING'))).toBe(false);
    expect(needsPolling(withStatus('PAYMENT_FAILED'))).toBe(false);
    expect(needsPolling(withStatus('XYZ'))).toBe(false);
    expect(needsPolling(withStatus('PENDING', 'PAYMENT_FAILED', 'XYZ'))).toBe(false);
  });

  test('mọi đơn đã COMPLETED / CANCELLED → dừng', () => {
    expect(needsPolling(withStatus('COMPLETED', 'CANCELLED', 'COMPLETED'))).toBe(false);
  });

  test('chưa có đơn nào → dừng (không có gì để chờ cập nhật)', () => {
    expect(needsPolling([])).toBe(false);
  });
});

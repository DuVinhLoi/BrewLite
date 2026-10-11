import { describe, expect, test } from 'vitest';
import { addItemMessage, MAX_LINES, MAX_QTY, maxModalQty } from './cart-limits';
import { MAX_LINES as STORE_MAX_LINES, MAX_QTY as STORE_MAX_QTY } from '@/store/cart';

describe('addItemMessage', () => {
  test('mỗi lý do từ chối có một câu riêng, không emoji, không gạch dài', () => {
    expect(addItemMessage('MAX_LINES')).toBe('Giỏ đã đủ 20 dòng.');
    expect(addItemMessage('MAX_QTY')).toBe('Mỗi dòng tối đa 99 ly.');
    expect(addItemMessage('OUT_OF_STOCK')).toBe('Món đã hết hàng.');
    expect(addItemMessage('AT_STOCK_LIMIT')).toBe('Bạn đã thêm hết số lượng còn lại.');
    for (const r of ['MAX_LINES', 'MAX_QTY', 'OUT_OF_STOCK', 'AT_STOCK_LIMIT'] as const) {
      expect(addItemMessage(r)).not.toContain('—');
      expect(addItemMessage(r)).not.toContain('✓');
    }
  });
});

describe('hằng giới hạn (một nguồn: lib/cart-limits)', () => {
  test('20 dòng, 99 ly; store re-export đúng các hằng này', () => {
    expect(MAX_LINES).toBe(20);
    expect(MAX_QTY).toBe(99);
    expect(STORE_MAX_LINES).toBe(MAX_LINES);
    expect(STORE_MAX_QTY).toBe(MAX_QTY);
  });
});

describe('maxModalQty (trần của nút + trong ProductDetailModal)', () => {
  test('tồn kho nhỏ hơn 99 thì trần là tồn kho', () => {
    expect(maxModalQty(5)).toBe(5);
    expect(maxModalQty(99)).toBe(99);
  });
  test('tồn kho lớn hơn 99 thì trần là MAX_QTY, không chạy tới 500', () => {
    expect(maxModalQty(500)).toBe(99);
  });
  test('hết hàng hoặc tồn kho âm: tối thiểu 1 (modal không mở cho món hết hàng)', () => {
    expect(maxModalQty(0)).toBe(1);
    expect(maxModalQty(-3)).toBe(1);
  });
});

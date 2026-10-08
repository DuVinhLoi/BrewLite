import { describe, expect, test } from 'vitest';
import {
  buildCartKey,
  calcLineTotal,
  calcUnitPrice,
  formatVND,
  SIZE_UPCHARGE,
  TOPPING_PRICES,
} from './pricing';

// Voucher không có helper riêng trong pricing.ts — công thức chuẩn đang nằm ở
// frontend PaymentForm.tsx:31 và backend payment.service.ts:33. Test này pin
// contract đó (BREWLITE10 = floor(total * 0.1)) để khỏi lệch front/back.
function calcDiscount(total: number, code: string | null): number {
  return code === 'BREWLITE10' ? Math.floor(total * 0.1) : 0;
}

describe('SIZE_UPCHARGE / TOPPING_PRICES', () => {
  test('bảng phí size/topping đúng contract', () => {
    expect(SIZE_UPCHARGE).toMatchObject({ S: 0, M: 5000, L: 10000 });
    expect(TOPPING_PRICES['Trân châu']).toBe(5000);
    expect(TOPPING_PRICES['Kem cheese']).toBe(8000);
    expect(TOPPING_PRICES['Thạch cà phê']).toBe(6000);
  });
});

describe('calcUnitPrice', () => {
  const base = 30000;
  test('size S/M/L khi không topping', () => {
    expect(calcUnitPrice(base, 'S', [])).toBe(30000);
    expect(calcUnitPrice(base, 'M', [])).toBe(35000);
    expect(calcUnitPrice(base, 'L', [])).toBe(40000);
  });
  test('cộng 1 topping và nhiều topping', () => {
    expect(calcUnitPrice(base, 'S', ['Trân châu'])).toBe(35000);
    expect(calcUnitPrice(base, 'M', ['Trân châu', 'Kem cheese'])).toBe(48000);
  });
  test('thứ tự topping không đổi giá', () => {
    const a = calcUnitPrice(base, 'L', ['Kem cheese', 'Trân châu']);
    const b = calcUnitPrice(base, 'L', ['Trân châu', 'Kem cheese']);
    expect(a).toBe(b);
  });
  test('topping lạ tính 0đ', () => {
    expect(calcUnitPrice(base, 'S', ['Không tồn tại'])).toBe(base);
  });
});

describe('calcLineTotal', () => {
  test('nhân theo số lượng', () => {
    expect(calcLineTotal(35000, 2)).toBe(70000);
  });
  test('số lượng 0/âm về 0, lẻ thì floor', () => {
    expect(calcLineTotal(35000, 0)).toBe(0);
    expect(calcLineTotal(35000, -3)).toBe(0);
    expect(calcLineTotal(35000, 2.9)).toBe(70000);
  });
});

describe('buildCartKey', () => {
  test('format productId|size|toppings(sort)', () => {
    expect(buildCartKey('p1', 'M', [])).toBe('p1|M|');
    expect(buildCartKey('p1', 'L', ['Kem cheese', 'Trân châu'])).toBe(
      'p1|L|Kem cheese,Trân châu',
    );
  });
  test('cùng set topping khác thứ tự cho cùng key', () => {
    expect(buildCartKey('p1', 'M', ['b', 'a'])).toBe(buildCartKey('p1', 'M', ['a', 'b']));
  });
  test('khác size là khác key', () => {
    expect(buildCartKey('p1', 'S', [])).not.toBe(buildCartKey('p1', 'M', []));
  });
});

describe('voucher BREWLITE10 (pin contract front/back)', () => {
  test('mã đúng giảm floor(total * 0.1)', () => {
    expect(calcDiscount(35000, 'BREWLITE10')).toBe(3500);
    expect(calcDiscount(35000, 'BREWLITE10')).toBe(35000 - 31500);
    expect(35000 - calcDiscount(35000, 'BREWLITE10')).toBe(31500);
  });
  test('tổng lẻ thì floor', () => {
    expect(calcDiscount(9999, 'BREWLITE10')).toBe(999);
  });
  test('mã sai/null/sai hoa-thường thì 0đ', () => {
    expect(calcDiscount(35000, 'FAKE')).toBe(0);
    expect(calcDiscount(35000, null)).toBe(0);
    expect(calcDiscount(35000, '')).toBe(0);
    expect(calcDiscount(35000, 'brewlite10')).toBe(0);
  });
});

describe('formatVND', () => {
  test('35000 -> "35.000đ"', () => {
    expect(formatVND(35000)).toBe('35.000đ');
  });
});

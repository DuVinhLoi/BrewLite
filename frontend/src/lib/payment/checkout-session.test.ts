import { afterEach, describe, expect, test } from 'vitest';
import { CHECKOUT_KEY, cartFingerprint, clearCheckout, dropsCheckout, loadCheckout, rememberOrder } from './checkout-session';
import { PaymentError } from './types';

const cart = [
  { productId: 'p1', quantity: 2, size: 'L', toppings: ['Trân châu', 'Kem cheese'] },
  { productId: 'p2', quantity: 1 },
];

afterEach(() => sessionStorage.clear());

describe('loadCheckout (phiên thanh toán của tab)', () => {
  test('cùng giỏ → cùng phiên: reload hoặc quay lại giỏ vẫn giữ 2 key và mã đơn', () => {
    const a = loadCheckout(cart);
    rememberOrder('order-1');
    const b = loadCheckout(cart); // = sau reload: đọc lại từ sessionStorage
    expect(b).toEqual({ ...a, orderId: 'order-1' });
    expect(a.orderKey).not.toBe(a.payKey);
  });

  test('đổi thứ tự dòng hoặc thứ tự topping vẫn là cùng giỏ', () => {
    const a = loadCheckout(cart);
    const b = loadCheckout([{ productId: 'p2', quantity: 1 }, { productId: 'p1', quantity: 2, size: 'L', toppings: ['Kem cheese', 'Trân châu'] }]);
    expect(b.payKey).toBe(a.payKey);
  });

  test('giỏ đổi (số lượng khác) → phiên mới: key mới, không mang mã đơn cũ', () => {
    const a = loadCheckout(cart);
    rememberOrder('order-1');
    const b = loadCheckout([{ ...cart[0], quantity: 3 }, cart[1]]);
    expect(b.orderId).toBeUndefined();
    expect(b.payKey).not.toBe(a.payKey);
    expect(b.orderKey).not.toBe(a.orderKey);
  });

  test('clearCheckout → lần sau là phiên mới', () => {
    const a = loadCheckout(cart);
    clearCheckout();
    expect(loadCheckout(cart).payKey).not.toBe(a.payKey);
  });

  test('dữ liệu hỏng trong sessionStorage → phiên mới, không ném lỗi', () => {
    sessionStorage.setItem(CHECKOUT_KEY, '{oops');
    expect(loadCheckout(cart).cart).toBe(cartFingerprint(cart));
  });
});

describe('dropsCheckout (bỏ đơn đang giữ khi chắc chắn không trả tiếp được)', () => {
  test.each([
    ['mất kết nối (chưa biết kết quả)', new PaymentError('x', 'o1'), false],
    ['lỗi máy chủ 5xx', new PaymentError('x', 'o1', 500, 'db down'), false],
    ['cổng từ chối', new PaymentError('x', 'o1', 400, 'Payment failed'), false],
    ['kẹt kho, đã hoàn tiền', new PaymentError('x', 'o1', 409, 'Out of stock'), false],
    ['cần đăng nhập lại', new PaymentError('x', 'o1', 401), false],
    ['đơn đã hủy hoặc đang pha', new PaymentError('x', 'o1', 400, 'Invalid transition CANCELLED -> PAID'), true],
    ['đơn của tài khoản khác', new PaymentError('x', 'o1', 403), true],
    ['đơn không còn', new PaymentError('x', 'o1', 404, 'Order not found'), true],
    ['key đã dùng cho đơn khác', new PaymentError('x', 'o1', 422), true],
    ['lỗi tạo đơn 400 (chưa có đơn)', new PaymentError('x', undefined, 400, 'Unknown topping: x'), false],
    ['lỗi không phải PaymentError', new Error('x'), false],
  ])('%s → %s', (_name, e, expected) => {
    expect(dropsCheckout(e)).toBe(expected);
  });
});

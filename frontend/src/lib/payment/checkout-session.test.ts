import { afterEach, describe, expect, test } from 'vitest';
import { saveToken } from '../auth';
import {
  CHECKOUT_KEY,
  cartFingerprint,
  clearCheckout,
  clearCheckoutIfOtherUser,
  dropsCheckout,
  isUnauthorizedPayment,
  loadCheckout,
  rememberOrder,
} from './checkout-session';
import { PaymentError } from './types';

// JWT giả: chỉ payload (frontend không kiểm chữ ký)
const tokenOf = (sub: string) => `h.${Buffer.from(JSON.stringify({ sub })).toString('base64url')}.s`;

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

describe('phiên thanh toán gắn với tài khoản (userId = sub của JWT)', () => {
  test('phiên mới ghi userId của token đang đăng nhập; rememberOrder và tải lại vẫn giữ userId', () => {
    saveToken(tokenOf('u1'));
    expect(loadCheckout(cart).userId).toBe('u1');
    rememberOrder('order-1');
    expect(loadCheckout(cart)).toMatchObject({ userId: 'u1', orderId: 'order-1' });
  });

  test('không có token (hoặc token hỏng) → phiên không có userId', () => {
    expect(loadCheckout(cart).userId).toBeUndefined();
    sessionStorage.clear();
    saveToken('abc');
    expect(loadCheckout(cart).userId).toBeUndefined();
  });
});

describe('clearCheckoutIfOtherUser (sau đăng nhập: chỉ bỏ phiên của tài khoản khác)', () => {
  test('cùng tài khoản đăng nhập lại (hết phiên giữa lúc trả tiền) → giữ nguyên mã đơn và 2 key', () => {
    saveToken(tokenOf('u1'));
    const a = loadCheckout(cart);
    rememberOrder('order-1');

    clearCheckoutIfOtherUser('u1');

    expect(loadCheckout(cart)).toEqual({ ...a, orderId: 'order-1' });
  });

  test('tài khoản khác → xóa: không còn mã đơn, key mới', () => {
    saveToken(tokenOf('u1'));
    const a = loadCheckout(cart);
    rememberOrder('order-1');

    clearCheckoutIfOtherUser('u2');

    expect(sessionStorage.getItem(CHECKOUT_KEY)).toBeNull();
    const b = loadCheckout(cart);
    expect(b.orderId).toBeUndefined();
    expect(b.payKey).not.toBe(a.payKey);
    expect(b.orderKey).not.toBe(a.orderKey);
  });

  test('phiên cũ không có userId (lưu trước khi có trường này) → vẫn đọc được, nhưng sau đăng nhập bị xóa', () => {
    const legacy = { cart: cartFingerprint(cart), orderKey: 'ok-1', payKey: 'pk-1', orderId: 'order-0' };
    sessionStorage.setItem(CHECKOUT_KEY, JSON.stringify(legacy));
    expect(loadCheckout(cart)).toEqual(legacy);

    clearCheckoutIfOtherUser('u1');

    expect(sessionStorage.getItem(CHECKOUT_KEY)).toBeNull();
  });

  test('đăng nhập mà token không có sub (userId null) → xóa cho chắc', () => {
    saveToken(tokenOf('u1'));
    loadCheckout(cart);
    clearCheckoutIfOtherUser(null);
    expect(sessionStorage.getItem(CHECKOUT_KEY)).toBeNull();
  });

  test('dữ liệu hỏng hoặc chưa có phiên → không ném lỗi, kho không còn mục hỏng', () => {
    expect(() => clearCheckoutIfOtherUser('u1')).not.toThrow();
    for (const raw of ['{oops', 'null', '"chuỗi"', '42']) {
      sessionStorage.setItem(CHECKOUT_KEY, raw);
      expect(() => clearCheckoutIfOtherUser('u1')).not.toThrow();
      expect(sessionStorage.getItem(CHECKOUT_KEY)).toBeNull();
    }
  });
});

describe('isUnauthorizedPayment (PaymentForm gọi handleUnauthorized khi true)', () => {
  test('PaymentError 401 (từ POST /orders hoặc POST /payments, có hoặc không có orderId) → true', () => {
    expect(isUnauthorizedPayment(new PaymentError('x', undefined, 401))).toBe(true);
    expect(isUnauthorizedPayment(new PaymentError('x', 'o1', 401, 'Unauthorized'))).toBe(true);
  });

  test.each([
    ['PaymentError mã khác', new PaymentError('x', 'o1', 403)],
    ['PaymentError 500', new PaymentError('x', 'o1', 500)],
    ['PaymentError mất kết nối (không có status)', new PaymentError('x', 'o1')],
    ['Error thường có status 401', Object.assign(new Error('x'), { status: 401 })],
    ['Error thường', new Error('x')],
    ['không phải Error', { status: 401 }],
    ['undefined', undefined],
    ['null', null],
    ['chuỗi', 'Unauthorized'],
  ])('%s → false', (_name, e) => {
    expect(isUnauthorizedPayment(e)).toBe(false);
  });
});

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
import { LOYALTY_RATE, VND_FOR_ONE_POINT, VND_PER_POINT, VOUCHER_CODE, VOUCHER_RATE } from './promo';

// Hằng số thật nằm ở backend/src/payment/payment.service.ts: đọc thẳng từ mã nguồn để 2 bên không lệch nhau.
const backendFile = fileURLToPath(new URL('../../../backend/src/payment/payment.service.ts', import.meta.url));
// String.raw: giữ nguyên \s (trong template literal thường, \s thành chữ "s" và regex không bao giờ khớp).
const constOf = (src: string, name: string): string | undefined =>
  src.match(new RegExp(String.raw`^const ${name}\s*=\s*([^;]+);`, 'm'))?.[1].trim();

describe('promo (hằng số khuyến mãi / tích điểm)', () => {
  test('VND_FOR_ONE_POINT = 10.000 đ cho mỗi điểm (câu "điểm cho mỗi 10.000 ₫" ở trang chủ)', () => {
    expect(VND_FOR_ONE_POINT).toBe(10000);
  });

  // Không skip khi thiếu file: monorepo luôn có backend, thiếu thì phải đỏ chứ không lặng lẽ bỏ qua.
  test('khớp 4 hằng số trong backend/src/payment/payment.service.ts', () => {
    const src = readFileSync(backendFile, 'utf8');
    expect(constOf(src, 'VOUCHER_CODE')).toBe(`'${VOUCHER_CODE}'`);
    expect(Number(constOf(src, 'VOUCHER_RATE'))).toBe(VOUCHER_RATE);
    expect(Number(constOf(src, 'LOYALTY_RATE'))).toBe(LOYALTY_RATE);
    expect(Number(constOf(src, 'VND_PER_POINT'))).toBe(VND_PER_POINT);
  });
});

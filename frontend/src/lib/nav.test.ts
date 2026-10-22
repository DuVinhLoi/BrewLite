import { describe, expect, test } from 'vitest';
import { isActive, navLinks } from './nav';

// Nav của header: khách chỉ có Menu và Lịch sử; nhân viên không có giao diện web (thao tác qua Swagger).
describe('navLinks', () => {
  test('luôn là Menu, Lịch sử', () => {
    expect(navLinks().map((l) => l.label)).toEqual(['Menu', 'Lịch sử']);
    expect(navLinks().map((l) => l.href)).toEqual(['/', '/history']);
  });
});

describe('isActive', () => {
  test('"/" chỉ khớp đúng "/", không khớp mọi đường dẫn khác', () => {
    expect(isActive('/', '/')).toBe(true);
    expect(isActive('/history', '/')).toBe(false);
    expect(isActive('/cart', '/')).toBe(false);
  });

  test('các mục còn lại khớp đúng hoặc theo tiền tố có dấu "/"', () => {
    expect(isActive('/history', '/history')).toBe(true);
    expect(isActive('/history/abc', '/history')).toBe(true);
    expect(isActive('/cart', '/cart')).toBe(true);
    expect(isActive('/profile/edit', '/profile')).toBe(true);
  });

  test('tiền tố chung chữ nhưng khác đoạn không khớp (/historyx, /profiles)', () => {
    expect(isActive('/historyx', '/history')).toBe(false);
    expect(isActive('/profiles', '/profile')).toBe(false);
  });

  test('pathname null (chưa biết) không mục nào đang chọn', () => {
    expect(isActive(null, '/')).toBe(false);
    expect(isActive(null, '/history')).toBe(false);
  });
});

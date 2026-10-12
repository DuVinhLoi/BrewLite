import { describe, expect, test } from 'vitest';
import { isActive, navLinks, staffRedirect } from './nav';

// Nav của header: chỉ ẩn/hiện theo vai trò (server mới chặn quyền), route giữ nguyên.
const hrefs = (role: Parameters<typeof navLinks>[0]) => navLinks(role).map((l) => l.href);
const labels = (role: Parameters<typeof navLinks>[0]) => navLinks(role).map((l) => l.label);

describe('navLinks', () => {
  test('khách chưa đăng nhập (null) và CUSTOMER: Menu, Lịch sử', () => {
    for (const role of [null, 'CUSTOMER'] as const) {
      expect(labels(role)).toEqual(['Menu', 'Lịch sử']);
      expect(hrefs(role)).toEqual(['/', '/history']);
    }
  });

  test('BARISTA: chỉ Quầy (/barista)', () => {
    expect(labels('BARISTA')).toEqual(['Quầy']);
    expect(hrefs('BARISTA')).toEqual(['/barista']);
  });

  test('ADMIN: Quầy và Kho (/admin), không có Menu, Lịch sử', () => {
    expect(labels('ADMIN')).toEqual(['Quầy', 'Kho']);
    expect(hrefs('ADMIN')).toEqual(['/barista', '/admin']);
  });
});

describe('staffRedirect', () => {
  test.each(['/', '/cart', '/history', '/profile'])('BARISTA ở %s → /barista', (p) => {
    expect(staffRedirect(p, 'BARISTA')).toBe('/barista');
  });

  test.each(['/', '/cart', '/history', '/profile'])('ADMIN ở %s → /admin', (p) => {
    expect(staffRedirect(p, 'ADMIN')).toBe('/admin');
  });

  test.each(['/barista', '/admin', '/login'])('nhân viên ở %s → null', (p) => {
    expect(staffRedirect(p, 'BARISTA')).toBeNull();
    expect(staffRedirect(p, 'ADMIN')).toBeNull();
  });

  test('CUSTOMER hoặc null luôn null', () => {
    for (const p of ['/', '/cart', '/history', '/profile']) {
      expect(staffRedirect(p, 'CUSTOMER')).toBeNull();
      expect(staffRedirect(p, null)).toBeNull();
    }
  });

  test('pathname null → null', () => {
    expect(staffRedirect(null, 'BARISTA')).toBeNull();
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
    expect(isActive('/barista', '/barista')).toBe(true);
    expect(isActive('/admin/stock', '/admin')).toBe(true);
  });

  test('tiền tố chung chữ nhưng khác đoạn không khớp (/historyx, /administrator)', () => {
    expect(isActive('/historyx', '/history')).toBe(false);
    expect(isActive('/administrator', '/admin')).toBe(false);
  });

  test('pathname null (chưa biết) không mục nào đang chọn', () => {
    expect(isActive(null, '/')).toBe(false);
    expect(isActive(null, '/history')).toBe(false);
  });
});

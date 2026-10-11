import { describe, expect, test } from 'vitest';
import { isActive, navLinks } from './nav';

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

  test('BARISTA: thêm Quầy (/barista), không có Kho', () => {
    expect(labels('BARISTA')).toEqual(['Menu', 'Quầy', 'Lịch sử']);
    expect(hrefs('BARISTA')).toEqual(['/', '/barista', '/history']);
  });

  test('ADMIN: thêm Quầy và Kho (/admin)', () => {
    expect(labels('ADMIN')).toEqual(['Menu', 'Quầy', 'Kho', 'Lịch sử']);
    expect(hrefs('ADMIN')).toEqual(['/', '/barista', '/admin', '/history']);
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

import { describe, expect, test } from 'vitest';
import { homeFor, roleFromToken } from './auth';

// JWT giả: chỉ phần payload quan trọng (frontend không kiểm chữ ký, server mới là nơi chặn quyền)
const fakeJwt = (payload: object) =>
  `h.${Buffer.from(JSON.stringify(payload)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}.s`;

describe('roleFromToken', () => {
  test.each(['CUSTOMER', 'BARISTA', 'ADMIN'])('đọc role %s', (role) => {
    expect(roleFromToken(fakeJwt({ sub: 'u', role }))).toBe(role);
  });
  test('token cũ không có role → CUSTOMER', () => {
    expect(roleFromToken(fakeJwt({ sub: 'u' }))).toBe('CUSTOMER');
  });
  test('không có token / token hỏng → null', () => {
    expect(roleFromToken(null)).toBeNull();
    expect(roleFromToken('abc')).toBeNull();
  });
});

test('homeFor: barista → /barista, admin → /admin, khách → /', () => {
  expect(homeFor('BARISTA')).toBe('/barista');
  expect(homeFor('ADMIN')).toBe('/admin');
  expect(homeFor('CUSTOMER')).toBe('/');
});

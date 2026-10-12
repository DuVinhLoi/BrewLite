import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import ProfileView from './ProfileView';
import type { Profile } from '@/lib/api';

// Không có trình duyệt trong CI: render ra HTML để kiểm cái người dùng thấy trên /profile.
const profile: Profile = { id: 'u1', email: 'khach@brewlite.test', role: 'CUSTOMER', loyaltyPoints: 12 };
const html = (props: { token: string | null | undefined; profile: Profile | null; error: string | null }) =>
  renderToStaticMarkup(createElement(ProfileView, props));

describe('ProfileView (render HTML)', () => {
  test('token=null (đã đọc, chưa đăng nhập): hiện "Bạn chưa đăng nhập" và link /login, không trắng trang', () => {
    const out = html({ token: null, profile: null, error: null });
    expect(out).toContain('Bạn chưa đăng nhập');
    expect(out).toContain('href="/login?next=%2Fprofile"'); // đăng nhập xong quay lại /profile (safeNext)
  });

  test('token=undefined (chưa đọc sessionStorage): chưa vẽ gì, tránh nháy "chưa đăng nhập"', () => {
    expect(html({ token: undefined, profile: null, error: null })).toBe('');
  });

  test('có token và profile: hiện email và điểm tích lũy', () => {
    const out = html({ token: 't', profile, error: null });
    expect(out).toContain('khach@brewlite.test');
    expect(out).toContain('điểm');
  });

  test('có token, chưa có profile: "Đang tải…"; có lỗi: role="alert" kèm link đăng nhập', () => {
    expect(html({ token: 't', profile: null, error: null })).toContain('Đang tải…');
    const err = html({ token: 't', profile: null, error: 'Phiên hết hạn' });
    expect(err).toContain('role="alert"');
    expect(err).toContain('Phiên hết hạn');
    expect(err).toContain('href="/login"');
  });
});

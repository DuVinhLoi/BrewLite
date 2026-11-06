import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { router } from '../../../vitest.setup';
import { json, line, mockApi, renderShop } from '@/test/helpers';
import { AuthScreen } from './AuthScreen';

function fill(email: string, password: string) {
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: email } });
  fireEvent.change(screen.getByLabelText('Mật khẩu'), { target: { value: password } });
}

describe('UNIT-T17 authentication validation (FR-08, FR-09, NFR-06)', () => {
  it.each([['invalid', 'Test12345', 'Email không hợp lệ'], ['test@example.invalid', 'abc', 'Mật Khẩu cần ít nhất 8 ký tự gồm chữ và số'], ['test@example.invalid', '12345678', 'Mật Khẩu cần ít nhất 8 ký tự gồm chữ và số'], ['test@example.invalid', 'abcdefgh', 'Mật Khẩu cần ít nhất 8 ký tự gồm chữ và số'], ['test@example.invalid', 'Abc1234', 'Mật Khẩu cần ít nhất 8 ký tự gồm chữ và số']])('blocks invalid registration %s / %s before calling API', async (email, password, message) => {
    renderShop(<AuthScreen register />);
    fill(email, password);
    fireEvent.click(screen.getByRole('button', { name: 'Tạo tài khoản' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(message);
    expect(fetch).not.toHaveBeenCalled();
  });
  it('blocks missing login credentials before calling API', () => {
    renderShop(<AuthScreen />);
    fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }));
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Mật khẩu')).toHaveAttribute('aria-invalid', 'true');
    expect(fetch).not.toHaveBeenCalled();
  });
  it.each([[400, 'Dữ liệu đăng nhập không hợp lệ'], [401, 'Email hoặc mật khẩu không đúng']])('shows API %i errors without authenticating', async (status, message) => {
    mockApi(() => json({ statusCode: status, error: status === 400 ? 'VALIDATION_ERROR' : 'UNAUTHORIZED', message }, status));
    renderShop(<AuthScreen />);
    fill('test@example.invalid', 'Wrong12345');
    fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(message);
    expect(router.push).not.toHaveBeenCalled();
    expect(sessionStorage.getItem('brewlite-session')).toBeNull();
  });
  it.each([['//evil', '/'], ['/\\evil', '/'], ['https://evil.example/', '/'], ['HTTPS://evil.example/', '/'], ['http://', '/'], ['/\t/evil.example/', '/'], ['/\n/evil.example/', '/'], ['//[', '/'], ['/.//evil.example/', '/'], ['/x/..//evil.example/', '/'], ['/./\\evil.example/', '/'], ['/%2e//evil.example/', '/'], ['/./\t/evil.example/', '/'], ['checkout', '/'], ['/%2F/evil', '/%2F/evil'], ['/checkout', '/checkout'], ['/orders/1?x=1', '/orders/1?x=1']])('after login follows next=%s to %s and never leaves the site (AC-F09.3)', async (next, destination) => {
    window.history.replaceState(null, '', `/login?next=${encodeURIComponent(next)}`);
    mockApi(() => json({ accessToken: 'fake-token', user: { email: 'test@example.invalid', role: 'CUSTOMER' } }));
    renderShop(<AuthScreen />);
    fill('test@example.invalid', 'Test12345');
    fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }));
    await waitFor(() => expect(router.push).toHaveBeenCalledTimes(1));
    expect(router.push).toHaveBeenCalledWith(destination);
  });
  it('registers then logs in, returns to checkout, and preserves the cart', async () => {
    window.history.replaceState(null, '', '/register?next=/checkout');
    const requests: string[] = [];
    mockApi((path) => {
      requests.push(path);
      return path === '/auth/register' ? json({ id: 'test-user', email: 'test@example.invalid', role: 'CUSTOMER' }, 201) : json({ accessToken: 'fake-token', user: { email: 'test@example.invalid', role: 'CUSTOMER' } });
    });
    renderShop(<AuthScreen register />, [line]);
    fill('test@example.invalid', 'Test12345');
    fireEvent.click(screen.getByRole('button', { name: 'Tạo tài khoản' }));
    await waitFor(() => expect(router.push).toHaveBeenCalledWith('/checkout'));
    expect(requests).toEqual(['/auth/register', '/auth/login']);
    expect(screen.getByRole('button', { name: 'Đăng xuất' })).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('brewlite-cart')!)).toEqual([line]);
  });
});

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { TOKEN_KEY, getToken, saveToken } from './auth';
import { handleUnauthorized, postLoginTarget, safeNext, setRedirect } from './session';

afterEach(() => {
  setRedirect(null);
  vi.unstubAllGlobals();
  sessionStorage.removeItem(TOKEN_KEY);
});

describe('handleUnauthorized', () => {
  beforeEach(() => saveToken('h.p.s'));

  test('xóa token rồi chuyển về /login (đã xóa xong mới chuyển trang)', () => {
    let tokenWhenRedirected: string | null = 'chưa gọi';
    const redirect = vi.fn(() => {
      tokenWhenRedirected = getToken();
    });
    setRedirect(redirect);

    handleUnauthorized();

    expect(redirect).toHaveBeenCalledTimes(1);
    expect(redirect).toHaveBeenCalledWith('/login');
    expect(tokenWhenRedirected).toBeNull();
    expect(getToken()).toBeNull();
  });

  test('đang ở trang khác: kèm ?next= là đường dẫn hiện tại (đã mã hóa)', () => {
    vi.stubGlobal('window', { location: { pathname: '/history', search: '?tab=1&x=a b' } });
    const redirect = vi.fn();
    setRedirect(redirect);

    handleUnauthorized();

    expect(redirect).toHaveBeenCalledWith('/login?next=' + encodeURIComponent('/history?tab=1&x=a b'));
  });

  test('đang ở /login thì không kèm next (tránh vòng lặp)', () => {
    vi.stubGlobal('window', { location: { pathname: '/login', search: '?next=%2Fcart' } });
    const redirect = vi.fn();
    setRedirect(redirect);

    handleUnauthorized();

    expect(redirect).toHaveBeenCalledWith('/login');
  });

  test('setRedirect(null) trả về mặc định: không có window thì không làm gì và không ném lỗi', () => {
    setRedirect(vi.fn());
    setRedirect(null);
    expect(() => handleUnauthorized()).not.toThrow();
    expect(getToken()).toBeNull();
  });
});

describe('safeNext (chống open redirect sau đăng nhập)', () => {
  test.each(['/', '/cart', '/history?tab=1', '/barista', '/a/b?c=d#e'])('nhận đường dẫn tương đối %s', (p) => {
    expect(safeNext(p)).toBe(p);
  });

  test.each([
    ['//evil.com', 'hai dấu gạch chéo (URL theo giao thức hiện tại)'],
    ['///evil.com', 'ba dấu gạch chéo'],
    ['/\\evil.com', 'gạch chéo rồi gạch ngược (trình duyệt coi như //)'],
    ['\\\\evil.com', 'hai gạch ngược'],
    ['https://evil.com', 'URL tuyệt đối'],
    ['http://evil.com/cart', 'URL tuyệt đối http'],
    ['javascript:alert(1)', 'scheme javascript'],
    ['/redirect?to=https://evil.com', 'chứa ://'],
    ['evil.com', 'không bắt đầu bằng /'],
    ['cart', 'đường dẫn không có / đầu'],
    [' /cart', 'có khoảng trắng đầu'],
    ['/\t/evil.com', 'tab bị trình duyệt bỏ đi thành //'],
    ['/\n/evil.com', 'xuống dòng bị trình duyệt bỏ đi thành //'],
    ['/car\u0000t', 'ký tự điều khiển NUL'],
    ['', 'rỗng'],
  ])('từ chối %j (%s)', (raw) => {
    expect(safeNext(raw)).toBeNull();
  });

  test('không phải chuỗi / thiếu: null', () => {
    expect(safeNext(null)).toBeNull();
    expect(safeNext(undefined)).toBeNull();
    expect(safeNext(42 as unknown as string)).toBeNull();
    expect(safeNext({} as unknown as string)).toBeNull();
  });
});

// Trang /login chỉ gọi hàm này: ?next= hợp lệ thì về đó, không thì về trang theo role.
describe('postLoginTarget (đích sau đăng nhập)', () => {
  test.each([
    ['?next=%2Fcart', 'CUSTOMER', '/cart'],
    ['?next=%2Fhistory%3Ftab%3D1', 'CUSTOMER', '/history?tab=1'],
    ['?x=1&next=%2Fbarista', 'CUSTOMER', '/barista'],
    ['?next=%2Fbarista', 'BARISTA', '/barista'],
    ['?next=%2Fadmin', 'BARISTA', '/admin'],
    ['?next=%2Fadmin', 'ADMIN', '/admin'],
  ] as const)('next hợp lệ thắng role: %s (%s) → %s', (search, role, expected) => {
    expect(postLoginTarget(search, role)).toBe(expected);
  });

  test.each([
    ['?next=%2Fhistory', 'BARISTA', '/barista'],
    ['?next=%2Fhistory%3Ftab%3D1', 'BARISTA', '/barista'],
    ['?next=%2Fcart', 'ADMIN', '/admin'],
    ['?next=%2Fprofile', 'ADMIN', '/admin'],
    ['?next=%2F', 'BARISTA', '/barista'],
    ['?next=%2Fhistory', 'CUSTOMER', '/history'],
  ] as const)('nhân viên có next là trang khách: %s (%s) → %s', (search, role, expected) => {
    expect(postLoginTarget(search, role)).toBe(expected);
  });

  test.each([
    ['?next=%2F%2Fevil.com', 'hai dấu gạch chéo'],
    ['?next=https%3A%2F%2Fevil.com', 'URL tuyệt đối'],
    ['?next=javascript%3Aalert(1)', 'scheme javascript'],
    ['?next=%2F%5Cevil.com', 'gạch chéo rồi gạch ngược'],
    ['?next=cart', 'không bắt đầu bằng /'],
    ['?next=', 'rỗng'],
  ])('next độc %s (%s) bị bỏ, về trang theo role', (search) => {
    expect(postLoginTarget(search, 'CUSTOMER')).toBe('/');
    expect(postLoginTarget(search, 'BARISTA')).toBe('/barista');
  });

  test.each([
    ['', 'CUSTOMER', '/'],
    ['?x=1', 'CUSTOMER', '/'],
    ['', 'BARISTA', '/barista'],
    ['', 'ADMIN', '/admin'],
  ] as const)('thiếu next: %j (%s) → %s', (search, role, expected) => {
    expect(postLoginTarget(search, role)).toBe(expected);
  });
});

import { afterEach, describe, expect, test } from 'vitest';
import { ROLE_LABEL, TOKEN_KEY, clearToken, getToken, homeFor, roleFromToken, saveToken, sessionFromToken } from './auth';

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

// sessionStorage riêng của từng tab; localStorage (storage giả của vitest.setup.ts) dùng chung như các tab cùng origin
class TabStorage {
  private data = new Map<string, string>();
  get length() {
    return this.data.size;
  }
  clear() {
    this.data.clear();
  }
  getItem(k: string) {
    return this.data.has(k) ? this.data.get(k)! : null;
  }
  key(i: number) {
    return Array.from(this.data.keys())[i] ?? null;
  }
  removeItem(k: string) {
    this.data.delete(k);
  }
  setItem(k: string, v: string) {
    this.data.set(k, String(v));
  }
}
const realSession = globalThis.sessionStorage;
const useTab = (tab: unknown) => Object.defineProperty(globalThis, 'sessionStorage', { value: tab, configurable: true, writable: true });

describe('mỗi tab một phiên đăng nhập (sessionStorage)', () => {
  afterEach(() => {
    useTab(realSession);
    localStorage.removeItem(TOKEN_KEY);
  });

  test('đăng nhập barista ở tab 2 không đổi phiên khách ở tab 1 (reload tab 1 vẫn là khách)', () => {
    const tab1 = new TabStorage();
    const tab2 = new TabStorage();
    useTab(tab1);
    saveToken(fakeJwt({ sub: 'u1', email: 'demo@brewlite.vn', role: 'CUSTOMER' }));
    useTab(tab2);
    saveToken(fakeJwt({ sub: 'b1', email: 'barista@brewlite.vn', role: 'BARISTA' }));
    useTab(tab1); // reload tab 1 = đọc lại token của tab 1
    expect(roleFromToken(getToken())).toBe('CUSTOMER');
    useTab(tab2);
    expect(roleFromToken(getToken())).toBe('BARISTA');
  });

  test('clearToken chỉ đăng xuất tab hiện tại', () => {
    const tab1 = new TabStorage();
    const tab2 = new TabStorage();
    useTab(tab1);
    saveToken(fakeJwt({ sub: 'u1', role: 'CUSTOMER' }));
    useTab(tab2);
    saveToken(fakeJwt({ sub: 'b1', role: 'BARISTA' }));
    clearToken();
    expect(getToken()).toBeNull();
    useTab(tab1);
    expect(roleFromToken(getToken())).toBe('CUSTOMER');
  });

  test('saveToken dọn token kiểu cũ còn trong localStorage (trước đây dùng chung mọi tab)', () => {
    localStorage.setItem(TOKEN_KEY, 'old-shared-token');
    useTab(new TabStorage());
    saveToken(fakeJwt({ sub: 'u1', role: 'CUSTOMER' }));
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });
});

describe('sessionFromToken', () => {
  test('đọc email và role từ JWT', () => {
    expect(sessionFromToken(fakeJwt({ sub: 'u1', email: 'demo@brewlite.vn', role: 'ADMIN' }))).toEqual({ email: 'demo@brewlite.vn', role: 'ADMIN' });
  });

  test('thiếu email → chuỗi rỗng; role lạ → CUSTOMER; token hỏng → null', () => {
    expect(sessionFromToken(fakeJwt({ sub: 'u1', role: 'ROOT' }))).toEqual({ email: '', role: 'CUSTOMER' });
    expect(sessionFromToken('abc')).toBeNull();
    expect(sessionFromToken(null)).toBeNull();
  });

  test('nhãn vai trò tiếng Việt cho header', () => {
    expect(ROLE_LABEL).toEqual({ CUSTOMER: 'Khách', BARISTA: 'Quầy', ADMIN: 'Quản trị' });
  });
});

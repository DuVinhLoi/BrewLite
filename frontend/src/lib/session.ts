// ============================================================
// FEATURE: Hết phiên đăng nhập (401) giữa chừng + đường dẫn quay lại sau đăng nhập (?next=).
// Giỏ hàng (localStorage) và phiên thanh toán của tab không bị xóa: đăng nhập lại cùng tài khoản là trả tiếp được
// (trang /login chỉ bỏ phiên thanh toán khi đăng nhập tài khoản khác: clearCheckoutIfOtherUser).
// ============================================================

import { clearToken, homeFor, type Role } from './auth';
import { staffRedirect } from './nav';

type Redirect = (to: string) => void;

// Chuyển trang cứng (replace) để mọi state còn giữ token cũ trong bộ nhớ bị bỏ; không có window (test, SSR) thì không làm gì.
const browserRedirect: Redirect = (to) => {
  if (typeof window !== 'undefined') window.location.replace(to);
};

let redirect: Redirect = browserRedirect;

/** Chỉ test dùng: thay hàm chuyển trang; truyền null để trả về mặc định. */
export function setRedirect(fn: Redirect | null): void {
  redirect = fn ?? browserRedirect;
}

/** 401 từ API có xác thực: xóa token của tab rồi về /login kèm ?next= là trang đang xem (trừ khi đang ở /login). */
export function handleUnauthorized(): void {
  clearToken();
  const here = typeof window !== 'undefined' ? window.location : null;
  const onLogin = !here || here.pathname === '/login';
  redirect(onLogin ? '/login' : `/login?next=${encodeURIComponent(here.pathname + here.search)}`);
}

/**
 * Chống open redirect: chỉ nhận đường dẫn tương đối trong chính site, bắt đầu bằng đúng một "/".
 * Từ chối "//host", "/\host", "https://...", "javascript:...", ký tự điều khiển (trình duyệt bỏ tab / xuống dòng nên "/\t/host" thành "//host").
 */
export function safeNext(raw: string | null | undefined): string | null {
  if (typeof raw !== 'string' || !raw.startsWith('/')) return null;
  if (raw[1] === '/' || raw[1] === '\\') return null;
  if (raw.includes('://') || /[\u0000-\u001f\u007f]/.test(raw)) return null;
  return raw;
}

/**
 * Đích sau đăng nhập: ?next= trong chuỗi query (window.location.search) nếu qua safeNext, không thì trang theo role.
 * Nhân viên có next là trang khách thì về trang nhà (không nháy qua trang khách); next=/admin giữ nguyên, trang đó tự kiểm quyền.
 */
export function postLoginTarget(search: string, role: Role): string {
  const next = safeNext(new URLSearchParams(search).get('next'));
  if (next === null || staffRedirect(next.split(/[?#]/)[0], role) !== null) return homeFor(role);
  return next;
}

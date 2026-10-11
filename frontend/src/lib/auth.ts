// ============================================================
// FEATURE: Phiên đăng nhập của tab + vai trò phía FE (mở rộng §3.2). Role chỉ để điều hướng / ẩn hiện;
// quyền thật do backend chặn (JwtAuthGuard + RolesGuard).
// ============================================================

export type Role = 'CUSTOMER' | 'BARISTA' | 'ADMIN';

export const TOKEN_KEY = 'brewlite-token';

export const ROLE_LABEL: Record<Role, string> = { CUSTOMER: 'Khách', BARISTA: 'Quầy', ADMIN: 'Quản trị' };

// Mỗi tab một phiên: token nằm trong sessionStorage của tab. localStorage dùng chung mọi tab cùng origin nên
// đăng nhập barista ở tab 2 từng ghi đè phiên khách ở tab 1. Reload vẫn giữ phiên; tab mở mới bằng URL phải đăng nhập lại.
const tabStore = (): Storage | null => (typeof sessionStorage !== 'undefined' ? sessionStorage : null);

export const getToken = (): string | null => tabStore()?.getItem(TOKEN_KEY) ?? null;

export function saveToken(token: string): void {
  tabStore()?.setItem(TOKEN_KEY, token);
  // dọn token kiểu cũ (dùng chung mọi tab) còn sót từ bản trước
  if (typeof localStorage !== 'undefined') localStorage.removeItem(TOKEN_KEY);
}

export function clearToken(): void {
  tabStore()?.removeItem(TOKEN_KEY);
}

export interface SessionInfo {
  email: string;
  role: Role;
}

// Payload (phần giữa) của JWT; token thiếu, hỏng hoặc payload không phải JSON → null. Không kiểm chữ ký.
function payloadOf(token: string | null): Record<string, unknown> | null {
  const part = token?.split('.')[1];
  if (!part) return null;
  try {
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(part.length / 4) * 4, '=');
    return JSON.parse(atob(b64));
  } catch {
    return null;
  }
}

export function sessionFromToken(token: string | null): SessionInfo | null {
  const payload = payloadOf(token);
  if (!payload) return null;
  const role: Role = payload.role === 'BARISTA' || payload.role === 'ADMIN' ? payload.role : 'CUSTOMER';
  return { email: typeof payload.email === 'string' ? payload.email : '', role };
}

/** BARISTA và ADMIN là nhân viên (vào được Quầy); giao diện chỉ ẩn/hiện, quyền thật do backend chặn. */
export const isStaff = (role: Role | null): boolean => role === 'BARISTA' || role === 'ADMIN';

export const roleFromToken = (token: string | null): Role | null => sessionFromToken(token)?.role ?? null;

/** Mã tài khoản (claim `sub`) của token; token thiếu, hỏng hoặc không có sub → null, không ném lỗi. */
export function userIdFromToken(token: string | null): string | null {
  const sub = payloadOf(token)?.sub;
  return typeof sub === 'string' && sub ? sub : null;
}

const HOME: Record<Role, string> = { CUSTOMER: '/', BARISTA: '/barista', ADMIN: '/admin' };
export const homeFor = (role: Role): string => HOME[role];

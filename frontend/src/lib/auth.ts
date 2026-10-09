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

export function sessionFromToken(token: string | null): SessionInfo | null {
  const part = token?.split('.')[1];
  if (!part) return null;
  try {
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(part.length / 4) * 4, '=');
    const payload = JSON.parse(atob(b64));
    const role: Role = payload.role === 'BARISTA' || payload.role === 'ADMIN' ? payload.role : 'CUSTOMER';
    return { email: typeof payload.email === 'string' ? payload.email : '', role };
  } catch {
    return null;
  }
}

export const roleFromToken = (token: string | null): Role | null => sessionFromToken(token)?.role ?? null;

const HOME: Record<Role, string> = { CUSTOMER: '/', BARISTA: '/barista', ADMIN: '/admin' };
export const homeFor = (role: Role): string => HOME[role];

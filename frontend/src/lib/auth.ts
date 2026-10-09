// ============================================================
// FEATURE: Vai trò người dùng phía FE (mở rộng §3.2). Chỉ để điều hướng / ẩn hiện;
// quyền thật do backend chặn (JwtAuthGuard + RolesGuard).
// ============================================================

export type Role = 'CUSTOMER' | 'BARISTA' | 'ADMIN';

export const TOKEN_KEY = 'brewlite-token';

export const getToken = (): string | null =>
  typeof localStorage !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;

export function roleFromToken(token: string | null): Role | null {
  const part = token?.split('.')[1];
  if (!part) return null;
  try {
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(part.length / 4) * 4, '=');
    const payload = JSON.parse(atob(b64));
    return payload.role === 'BARISTA' || payload.role === 'ADMIN' ? payload.role : 'CUSTOMER';
  } catch {
    return null;
  }
}

const HOME: Record<Role, string> = { CUSTOMER: '/', BARISTA: '/barista', ADMIN: '/admin' };
export const homeFor = (role: Role): string => HOME[role];

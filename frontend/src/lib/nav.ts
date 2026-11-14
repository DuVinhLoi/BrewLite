import { homeFor, isStaff, type Role } from '@/lib/auth';

// Nav của header: chỉ ẩn/hiện theo vai trò (server mới chặn quyền). Khách: Menu, Lịch sử. Nhân viên chỉ thấy Quầy (BARISTA) hoặc Quầy, Kho (ADMIN).
export interface NavLink {
  href: string;
  label: string;
}

export function navLinks(role: Role | null): NavLink[] {
  if (!isStaff(role)) {
    return [
      { href: '/', label: 'Menu' },
      { href: '/history', label: 'Lịch sử' },
    ];
  }
  const links: NavLink[] = [{ href: '/barista', label: 'Quầy' }];
  if (role === 'ADMIN') links.push({ href: '/admin', label: 'Kho' });
  return links;
}

// Trang của khách: nhân viên không dùng, mở ra thì bị chuyển về trang nhà (server vẫn chặn API bằng 403).
export const CUSTOMER_ROUTES = ['/', '/cart', '/history', '/profile'];

/** Nhân viên đang ở trang khách thì trả trang nhà của vai trò, không thì null. */
export function staffRedirect(pathname: string | null, role: Role | null): string | null {
  if (role === null || !isStaff(role)) return null;
  return CUSTOMER_ROUTES.some((href) => isActive(pathname, href)) ? homeFor(role) : null;
}

// "/" chỉ khớp đúng "/" (không thì mọi trang đều sáng Menu); mục khác khớp đúng hoặc theo đoạn đường dẫn.
export function isActive(pathname: string | null, href: string): boolean {
  if (pathname === null) return false;
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

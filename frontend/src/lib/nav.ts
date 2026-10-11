import { isStaff, type Role } from '@/lib/auth';

// Nav của header: chỉ ẩn/hiện theo vai trò (server mới chặn quyền). Thứ tự hiển thị: Menu, Quầy, Kho, Lịch sử.
export interface NavLink {
  href: string;
  label: string;
}

export function navLinks(role: Role | null): NavLink[] {
  const links: NavLink[] = [{ href: '/', label: 'Menu' }];
  if (isStaff(role)) links.push({ href: '/barista', label: 'Quầy' });
  if (role === 'ADMIN') links.push({ href: '/admin', label: 'Kho' });
  links.push({ href: '/history', label: 'Lịch sử' });
  return links;
}

// "/" chỉ khớp đúng "/" (không thì mọi trang đều sáng Menu); mục khác khớp đúng hoặc theo đoạn đường dẫn.
export function isActive(pathname: string | null, href: string): boolean {
  if (pathname === null) return false;
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

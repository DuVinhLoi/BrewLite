// Nav của header: khách chỉ có Menu và Lịch sử. Nhân viên (BARISTA/ADMIN) không có giao diện web, họ thao tác qua Swagger /docs.
export interface NavLink {
  href: string;
  label: string;
}

export function navLinks(): NavLink[] {
  return [
    { href: '/', label: 'Menu' },
    { href: '/history', label: 'Lịch sử' },
  ];
}

// "/" chỉ khớp đúng "/" (không thì mọi trang đều sáng Menu); mục khác khớp đúng hoặc theo đoạn đường dẫn.
export function isActive(pathname: string | null, href: string): boolean {
  if (pathname === null) return false;
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

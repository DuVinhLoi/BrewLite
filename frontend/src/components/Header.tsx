'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type CSSProperties } from 'react';
import { ROLE_LABEL, clearToken, getToken, sessionFromToken, type SessionInfo } from '@/lib/auth';
import { clearCheckout } from '@/lib/payment/checkout-session';
import { useCart } from '@/store/cart';

// FEATURE: App header — logo + badge tổng số ly trong giỏ + link Quầy/Kho theo vai trò (chỉ ẩn/hiện, server mới chặn quyền)
// + tài khoản đang đăng nhập của TAB này (mỗi tab một phiên, xem lib/auth.ts) và nút Đăng xuất.
export default function Header() {
  const count = useCart((s) => s.count);
  // Header nằm trong layout: App Router không mount lại layout sau router.push('/barista'),
  // nên đọc lại phiên mỗi lần đổi trang (không thì phải F5 mới thấy tài khoản / link Quầy, Kho sau khi đăng nhập).
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<SessionInfo | null>(null);
  useEffect(() => setSession(sessionFromToken(getToken())), [pathname]);
  const role = session?.role ?? null;

  // Chỉ đăng xuất tab này; bỏ luôn đơn đang thanh toán dở của tab
  function logout() {
    clearToken();
    clearCheckout();
    setSession(null);
    router.push('/login');
  }

  return (
    <header style={styles.bar}>
      <Link href="/" style={styles.brand}>
        BrewLite ☕
      </Link>
      <nav style={styles.nav}>
        <Link href="/" style={styles.link}>
          Menu
        </Link>
        {(role === 'BARISTA' || role === 'ADMIN') && (
          <Link href="/barista" style={styles.link}>
            Quầy
          </Link>
        )}
        {role === 'ADMIN' && (
          <Link href="/admin" style={styles.link}>
            Kho
          </Link>
        )}
        <Link href="/history" style={styles.link}>
          Lịch sử
        </Link>
        {session ? (
          <>
            <span style={styles.who} title={session.email}>
              {session.email || 'Đã đăng nhập'} · {ROLE_LABEL[session.role]}
            </span>
            <button type="button" onClick={logout} style={styles.logout}>
              Đăng xuất
            </button>
          </>
        ) : (
          <Link href="/login" style={styles.link}>
            Đăng nhập
          </Link>
        )}
        <Link href="/cart" style={styles.cartLink}>
          Xem giỏ hàng
          <span style={styles.badge} aria-label={`${count} món trong giỏ`}>
            {count}
          </span>
        </Link>
      </nav>
    </header>
  );
}

const styles: Record<string, CSSProperties> = {
  bar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 20px',
    borderBottom: '1px solid #e5e7eb',
    background: '#fff',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  brand: { fontWeight: 800, fontSize: 20, textDecoration: 'none', color: '#065f46' },
  nav: { display: 'flex', gap: 16, alignItems: 'center' },
  link: { textDecoration: 'none', color: '#111827', fontWeight: 600 },
  who: { fontSize: 13, color: '#374151' },
  logout: { background: 'transparent', border: '1px solid #d1d5db', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontWeight: 600 },
  cartLink: {
    position: 'relative',
    textDecoration: 'none',
    color: '#fff',
    background: '#065f46',
    padding: '8px 14px',
    borderRadius: 8,
    fontWeight: 700,
    paddingRight: 44,
  },
  badge: {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: 'translateY(-50%)',
    background: '#fff',
    color: '#065f46',
    borderRadius: 999,
    minWidth: 24,
    height: 24,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 13,
    fontWeight: 800,
    padding: '0 6px',
  },
};

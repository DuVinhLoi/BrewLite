'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { clearToken, getToken, sessionFromToken, type SessionInfo } from '@/lib/auth';
import { clearCheckout } from '@/lib/payment/checkout-session';
import { useCart } from '@/store/cart';
import HeaderView from './HeaderView';

// FEATURE: App header — nối phiên của TAB này (mỗi tab một phiên, xem lib/auth.ts), badge tổng số ly trong giỏ
// và Đăng xuất vào HeaderView (phần hiển thị thuần).
export default function Header() {
  const count = useCart((s) => s.count);
  // Header nằm trong layout: App Router không mount lại layout sau router.push(...),
  // nên đọc lại phiên mỗi lần đổi trang (không thì phải F5 mới thấy tài khoản sau khi đăng nhập).
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<SessionInfo | null>(null);
  useEffect(() => {
    setSession(sessionFromToken(getToken()));
  }, [pathname]);

  // Chỉ đăng xuất tab này; bỏ luôn đơn đang thanh toán dở của tab
  function logout() {
    clearToken();
    clearCheckout();
    setSession(null);
    router.push('/login');
  }

  return <HeaderView session={session} pathname={pathname} count={count} onLogout={logout} />;
}

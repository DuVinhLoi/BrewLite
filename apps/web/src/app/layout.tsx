import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import { ShopProvider } from '@/components/shop/ShopProvider';

export const metadata: Metadata = {
  title: 'BrewLite – Thực đơn',
  description: 'Thực đơn đồ uống BrewLite: cà phê, trà và thức uống pha chế mỗi ngày.',
};

/** Tạo khung HTML tiếng Việt và bọc các trang trong ShopProvider để dùng chung giỏ hàng, phiên đăng nhập. */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <body><ShopProvider>{children}</ShopProvider></body>
    </html>
  );
}

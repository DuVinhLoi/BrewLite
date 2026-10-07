import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Header from '@/components/Header';
import './globals.css';

export const metadata: Metadata = {
  title: 'BrewLite — Đặt cà phê không tiền mặt',
  description: 'Task 3 Menu + Task 5 Giỏ hàng',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <Header />
        <main style={{ maxWidth: 1024, margin: '0 auto', padding: '20px' }}>{children}</main>
      </body>
    </html>
  );
}

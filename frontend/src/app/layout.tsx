import type { Metadata } from 'next';
import { Be_Vietnam_Pro, Fraunces } from 'next/font/google';
import type { ReactNode } from 'react';
import Header from '@/components/Header';
import './globals.css';

// Cả hai font có subset vietnamese: bắt buộc để không rớt dấu tiếng Việt (ui-visual-plan.md §3.2).
const display = Fraunces({
  subsets: ['vietnamese', 'latin'],
  axes: ['SOFT', 'WONK', 'opsz'],
  display: 'swap',
  variable: '--font-display',
});

const body = Be_Vietnam_Pro({
  subsets: ['vietnamese', 'latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-body',
});

export const metadata: Metadata = {
  title: 'BrewLite: Đặt cà phê không tiền mặt',
  description: 'Chọn món, thanh toán không tiền mặt và nhận ly khi quầy báo sẵn sàng.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi" className={`${display.variable} ${body.variable}`}>
      <body>
        <Header />
        <main>{children}</main>
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'BrewLite – Thực đơn',
  description: 'Thực đơn đồ uống BrewLite: cà phê, trà và thức uống pha chế mỗi ngày.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}

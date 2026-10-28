import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import { ShopProvider } from '@/components/shop/ShopProvider';

export const metadata: Metadata = {
  title: 'BrewLite – Thực đơn',
  description: 'Thực đơn đồ uống BrewLite: cà phê, trà và thức uống pha chế mỗi ngày.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <body><ShopProvider>{children}</ShopProvider></body>
    </html>
  );
}

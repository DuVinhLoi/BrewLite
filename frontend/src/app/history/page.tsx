'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatVND } from '@/lib/pricing';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

interface HistoryItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  size?: string;
  toppings?: string[];
}

interface HistoryOrder {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  items: HistoryItem[];
}

export default function HistoryPage() {
  const [token, setToken] = useState<string | null>(null);
  const [orders, setOrders] = useState<HistoryOrder[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setToken(localStorage.getItem('brewlite-token'));
  }, []);

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/orders/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(Array.isArray(data.message) ? data.message.join(', ') : (data.message ?? 'Không tải được lịch sử'));
        return data as HistoryOrder[];
      })
      .then((list) => setOrders([...list].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))))
      .catch((e) => setError(e instanceof Error ? e.message : 'Lỗi không xác định'));
  }, [token]);

  if (token === null) return null;
  if (!token)
    return (
      <section style={{ maxWidth: 480, margin: '40px auto' }}>
        <h1>Lịch sử đơn hàng</h1>
        <p>
          Bạn chưa đăng nhập. <Link href="/login">Đăng nhập</Link>
        </p>
      </section>
    );
  if (error) return <p style={{ color: 'red' }}>Không tải được lịch sử: {error}</p>;
  if (orders === null) return <p>Đang tải…</p>;
  if (orders.length === 0) return <p>Chưa có đơn hàng nào.</p>;

  return (
    <section style={{ maxWidth: 640, margin: '24px auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <h1>Lịch sử đơn hàng</h1>
      {orders.map((o) => (
        <article key={o.id} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12 }}>
          <p style={{ margin: 0, fontWeight: 700 }}>
            #{o.id.slice(0, 8)} • {o.status} • {formatVND(o.total)}
          </p>
          <p style={{ margin: '4px 0', fontSize: 13, color: '#6b7280' }}>
            {new Date(o.createdAt).toLocaleString('vi-VN')}
          </p>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14 }}>
            {o.items.map((i, idx) => (
              <li key={idx}>
                {i.quantity}× {i.productId.slice(0, 8)} ({i.size ?? 'M'}
                {i.toppings?.length ? ` + ${i.toppings.join(', ')}` : ''}) — {formatVND(i.unitPrice)}
              </li>
            ))}
          </ul>
        </article>
      ))}
    </section>
  );
}

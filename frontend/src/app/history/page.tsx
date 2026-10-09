'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatVND } from '@/lib/pricing';
import { cancelOrder } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { canCancel } from '@/lib/order-status';
import OrderStatusTrack from '@/components/OrderStatusTrack';

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
  const [reload, setReload] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<{ id: string; message: string } | null>(null);

  useEffect(() => {
    setToken(getToken());
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
  }, [token, reload]);

  // 1 thao tác PATCH /orders/:id trên đơn: khóa nút của đơn đó, lỗi hiện dưới thẻ đơn, thành công thì tải lại danh sách
  async function act(o: HistoryOrder, run: (token: string) => Promise<void>) {
    if (!token) return;
    setBusyId(o.id);
    setActionError(null);
    try {
      await run(token);
      setReload((n) => n + 1);
    } catch (e) {
      setActionError({ id: o.id, message: e instanceof Error ? e.message : 'Lỗi không xác định' });
    } finally {
      setBusyId(null);
    }
  }

  // UC06 KB2/KB3: PATCH /orders/:id CANCELLED; đơn PAID có hoàn tiền nên hỏi xác nhận trước
  function onCancel(o: HistoryOrder) {
    if (o.status === 'PAID' && !window.confirm('Đơn đã thanh toán. Hủy đơn sẽ hoàn tiền và hoàn lại kho. Bạn chắc chắn muốn hủy?')) return;
    return act(o, (t) => cancelOrder(o.id, t));
  }

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
      {orders.map((o) => {
        return (
          <article key={o.id} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12 }}>
            <p style={{ margin: 0, fontWeight: 700 }}>
              #{o.id.slice(0, 8)} • {o.status} • {formatVND(o.total)}
            </p>
            <p style={{ margin: '4px 0', fontSize: 13, color: '#6b7280' }}>
              {new Date(o.createdAt).toLocaleString('vi-VN')}
            </p>
            <OrderStatusTrack status={o.status} />
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14 }}>
              {o.items.map((i, idx) => (
                <li key={idx}>
                  {i.quantity}× {i.productId.slice(0, 8)} ({i.size ?? 'M'}
                  {i.toppings?.length ? ` + ${i.toppings.join(', ')}` : ''}) — {formatVND(i.unitPrice)}
                </li>
              ))}
            </ul>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              {canCancel(o.status) && (
                <button
                  onClick={() => onCancel(o)}
                  disabled={busyId === o.id}
                  style={{ padding: '6px 12px', border: '1px solid #b91c1c', color: '#b91c1c', background: '#fff', borderRadius: 6, cursor: 'pointer' }}
                >
                  {busyId === o.id ? 'Đang xử lý…' : 'Hủy đơn'}
                </button>
              )}
            </div>
            {actionError?.id === o.id && (
              <p role="alert" style={{ margin: '6px 0 0', fontSize: 13, color: 'red' }}>
                {actionError.message}
              </p>
            )}
          </article>
        );
      })}
    </section>
  );
}

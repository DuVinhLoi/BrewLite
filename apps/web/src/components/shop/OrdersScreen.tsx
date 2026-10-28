'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { shopApi, statusLabels, type Order } from '@/lib/shop';
import { formatVnd } from '@/lib/format';
import { useShop } from './ShopProvider';
import { ApiError } from '@/lib/api';
export function OrdersScreen({ id }: { id?: string }) {
  const { session, ready } = useShop();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState('');
  const [expired, setExpired] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!session) return;
    let active = true; let loading = false; let terminal = false;
    async function load() {
      if (loading || terminal) return; loading = true;
      try {
        const result = await shopApi<Order | Order[]>(id ? `/orders/${encodeURIComponent(id)}` : '/orders/me', {}, session!.token);
        if (active) { terminal = !Array.isArray(result) && ['COMPLETED', 'CANCELLED'].includes(result.status); setOrders(Array.isArray(result) ? result : [result]); setError(''); setExpired(false); }
      } catch (err) { if (active) { setError((err as Error).message); setExpired(err instanceof ApiError && err.status === 401); } }
      finally { loading = false; }
    }
    void load(); const timer = id ? setInterval(() => void load(), 5000) : undefined;
    return () => { active = false; if (timer) clearInterval(timer); };
  }, [session, id, attempt]);
  async function cancel(order: Order) {
    if (!window.confirm('Bạn chắc chắn muốn hủy đơn?')) return;
    setBusy(true);
    try {
      await shopApi(`/orders/${order.id}`, { method: 'PATCH', body: JSON.stringify({ status: 'CANCELLED' }) }, session!.token);
      const key = `brewlite-checkout:${session!.email}`;
      try { const saved = JSON.parse(sessionStorage.getItem(key) ?? 'null'); if (saved?.orderId === order.id) sessionStorage.removeItem(key); } catch { /* No saved checkout. */ }
      setAttempt((value) => value + 1);
    } catch (err) { setError((err as Error).message); } finally { setBusy(false); }
  }
  if (!ready) return <main className="shop-page" role="status">Đang tải…</main>;
  if (!session || expired) return <main className="shop-page"><Link href={`/login?next=${encodeURIComponent(id ? `/orders/${id}` : '/orders')}`}>Đăng nhập để xem đơn hàng</Link></main>;
  return <main className="shop-page"><h1>{id ? 'Chi tiết đơn hàng' : 'Lịch sử đơn hàng'}</h1>{error && <div role="alert"><p>{error}</p><button onClick={() => setAttempt((value) => value + 1)}>Thử lại</button></div>}{!orders && !error && <p role="status">Đang tải đơn hàng…</p>}{orders?.length === 0 && <p>Bạn chưa có đơn hàng nào</p>}{orders?.map((order) => <article className="shop-line" key={order.id}><h2>Mã đơn: {order.id}</h2><p role="status">{statusLabels[order.status] ?? order.status}</p>{id && <ol aria-label="Tiến trình đơn">{['PAID', 'PREPARING', 'READY', 'COMPLETED'].map((step) => <li key={step} aria-current={step === order.status ? 'step' : undefined}>{statusLabels[step]}{step === order.status ? ' (Hiện tại)' : ''}</li>)}</ol>}<p>{new Date(order.createdAt).toLocaleString('vi-VN')}</p>{order.items.map((item) => <p key={item.id}>{item.name} · Size {item.size} · {item.toppings.join(', ') || 'Không topping'} × {item.quantity} — {formatVnd(item.lineTotal)}</p>)}<p>Tổng tiền: {formatVnd(order.total)}</p>{order.payments?.map((payment) => <p key={payment.id}>{payment.method === 'WALLET' ? 'Ví điện tử' : 'Thẻ'} · {payment.status === 'SUCCESS' ? 'Đã trả' : 'Thất bại'} · {formatVnd(payment.amount)} · {new Date(payment.createdAt).toLocaleString('vi-VN')}</p>)}{!id && <Link href={`/orders/${order.id}`}>Xem chi tiết</Link>}{id && session.role === 'CUSTOMER' && ['PENDING', 'PAYMENT_FAILED'].includes(order.status) && <div className="shop-actions"><Link href={`/checkout?order=${order.id}`}>Thử thanh toán</Link><button disabled={busy} onClick={() => void cancel(order)}>Hủy đơn</button></div>}</article>)}<Link href="/">Quay lại menu</Link></main>;
}
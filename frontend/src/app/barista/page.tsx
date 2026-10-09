'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import type { CSSProperties } from 'react';
import { formatVND } from '@/lib/pricing';
import { advanceOrder, cancelOrder } from '@/lib/api';
import { nextStatus } from '@/lib/order-status';
import { getToken, roleFromToken } from '@/lib/auth';
import { ACTION_LABEL, QUEUE_COLUMNS, fetchQueue, groupQueue, type QueueOrder } from '@/lib/barista';

// FEATURE: Màn quầy (UC08–UC12, mở rộng §3.2). Tự tải lại mỗi 5 giây; mọi chuyển trạng thái do backend kiểm (assertTransition).
const POLL_MS = 5000;

export default function BaristaPage() {
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const [orders, setOrders] = useState<QueueOrder[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => setToken(getToken()), []);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setOrders(await fetchQueue(token));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi không xác định');
    }
  }, [token]);

  useEffect(() => {
    load();
    const t = setInterval(load, POLL_MS);
    return () => clearInterval(t);
  }, [load]);

  async function act(o: QueueOrder, run: (t: string) => Promise<void>) {
    if (!token) return;
    setBusyId(o.id);
    try {
      await run(token);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi không xác định');
    } finally {
      setBusyId(null);
    }
  }

  if (token === undefined) return null;
  const role = roleFromToken(token);
  if (role !== 'BARISTA' && role !== 'ADMIN')
    return (
      <section>
        <h1>Quầy pha chế</h1>
        <p>Trang này dành cho tài khoản quầy. <Link href="/login">Đăng nhập</Link> bằng barista@brewlite.vn.</p>
      </section>
    );

  const cols = groupQueue(orders);
  return (
    <section>
      <h1>Quầy pha chế</h1>
      {error && <p role="alert" style={{ color: '#b91c1c' }}>{error}</p>}
      <div style={styles.board}>
        {QUEUE_COLUMNS.map((c) => (
          <div key={c.status} style={styles.col}>
            <h2 style={{ fontSize: 16 }}>{c.title} ({cols[c.status].length})</h2>
            {cols[c.status].length === 0 && <p style={{ color: '#6b7280', fontSize: 13 }}>Không có đơn</p>}
            {cols[c.status].map((o) => {
              const next = nextStatus(o.status);
              return (
                <article key={o.id} style={styles.card}>
                  <p style={{ margin: 0, fontWeight: 700 }}>#{o.id.slice(0, 8)} • {formatVND(o.total)}</p>
                  <p style={{ margin: '2px 0', fontSize: 12, color: '#6b7280' }}>{new Date(o.createdAt).toLocaleTimeString('vi-VN')}</p>
                  <ul style={{ margin: '4px 0', paddingLeft: 18, fontSize: 14 }}>
                    {o.items.map((i, idx) => (
                      <li key={idx}>
                        {i.quantity}× {i.productName} ({i.size ?? 'M'}{i.toppings?.length ? ` + ${i.toppings.join(', ')}` : ''})
                      </li>
                    ))}
                  </ul>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {next && (
                      <button disabled={busyId === o.id} style={styles.primary} onClick={() => act(o, (t) => advanceOrder(o.id, next, t))}>
                        {busyId === o.id ? 'Đang chuyển…' : ACTION_LABEL[c.status]}
                      </button>
                    )}
                    {c.status === 'PAID' && (
                      <button
                        disabled={busyId === o.id}
                        style={styles.danger}
                        onClick={() => window.confirm('Hủy đơn vì hết nguyên liệu? Khách được hoàn tiền, kho được hoàn lại.') && act(o, (t) => cancelOrder(o.id, t))}
                      >
                        Hủy (hết nguyên liệu)
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}

const styles: Record<string, CSSProperties> = {
  board: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 },
  col: { background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 10, padding: 10 },
  card: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 10, marginBottom: 8 },
  primary: { padding: '6px 12px', background: '#065f46', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700 },
  danger: { padding: '6px 12px', border: '1px solid #b91c1c', color: '#b91c1c', background: '#fff', borderRadius: 6, cursor: 'pointer' },
};

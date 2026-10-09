'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import type { CSSProperties } from 'react';
import { formatVND } from '@/lib/pricing';
import { getToken, roleFromToken } from '@/lib/auth';
import { adjustStock, fetchInventory, stockBadge, type InventoryItem } from '@/lib/admin';

// FEATURE: Màn tồn kho (UC14, mở rộng §3.2): xem mọi món kể cả hết hàng, đặt số hoặc cộng/trừ.
const TONE: Record<'out' | 'low' | 'ok', string> = { out: '#b91c1c', low: '#92400e', ok: '#065f46' };

export default function AdminPage() {
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => setToken(getToken()), []);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setItems(await fetchInventory(token));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi không xác định');
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  async function change(p: InventoryItem, body: { mode: 'set' | 'delta'; value: number }) {
    if (!token) return;
    setBusyId(p.id);
    try {
      const updated = await adjustStock(token, p.id, { ...body, version: p.version });
      setItems((list) => list.map((x) => (x.id === updated.id ? updated : x)));
      setDraft((d) => ({ ...d, [p.id]: '' }));
      setError(null);
    } catch (e) {
      // tải lại TRƯỚC rồi mới hiện lỗi: load() thành công gọi setError(null), làm sau sẽ xóa mất thông báo 409/400
      await load();
      setError(e instanceof Error ? e.message : 'Lỗi không xác định');
    } finally {
      setBusyId(null);
    }
  }

  if (token === undefined) return null;
  if (roleFromToken(token) !== 'ADMIN')
    return (
      <section>
        <h1>Quản lý tồn kho</h1>
        <p>Trang này dành cho quản trị. <Link href="/login">Đăng nhập</Link> bằng admin@brewlite.vn.</p>
      </section>
    );

  return (
    <section>
      <h1>Quản lý tồn kho</h1>
      {error && <p role="alert" style={{ color: '#b91c1c' }}>{error}</p>}
      <table style={styles.table}>
        <thead>
          <tr><th style={styles.th}>Món</th><th style={styles.th}>Giá</th><th style={styles.th}>Tồn kho</th><th style={styles.th}>Điều chỉnh</th></tr>
        </thead>
        <tbody>
          {items.map((p) => {
            const b = stockBadge(p.stock);
            const busy = busyId === p.id;
            const n = Number(draft[p.id]);
            return (
              <tr key={p.id}>
                <td style={styles.td}>{p.name}</td>
                <td style={styles.td}>{formatVND(p.price)}</td>
                <td style={styles.td}>
                  <strong>{p.stock}</strong> <span style={{ color: TONE[b.tone], fontSize: 12 }}>{b.label}</span>
                </td>
                <td style={styles.td}>
                  <button disabled={busy || p.stock <= 0} onClick={() => change(p, { mode: 'delta', value: -1 })}>−1</button>{' '}
                  <button disabled={busy} onClick={() => change(p, { mode: 'delta', value: 1 })}>+1</button>{' '}
                  <button disabled={busy} onClick={() => change(p, { mode: 'delta', value: 10 })}>+10</button>{' '}
                  <input
                    type="number" min={0} step={1} placeholder="Đặt số" style={{ width: 80 }}
                    value={draft[p.id] ?? ''} onChange={(e) => setDraft((d) => ({ ...d, [p.id]: e.target.value }))}
                  />{' '}
                  <button disabled={busy || draft[p.id] === undefined || draft[p.id] === '' || !Number.isInteger(n) || n < 0} onClick={() => change(p, { mode: 'set', value: n })}>
                    Lưu
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

const styles: Record<string, CSSProperties> = {
  table: { width: '100%', borderCollapse: 'collapse', background: '#fff' },
  th: { textAlign: 'left', borderBottom: '2px solid #e5e7eb', padding: 8 },
  td: { borderBottom: '1px solid #f1f5f9', padding: 8 },
};

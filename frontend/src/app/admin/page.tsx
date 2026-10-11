'use client';

import { useCallback, useEffect, useState } from 'react';
import { getToken, roleFromToken } from '@/lib/auth';
import { adjustStock, fetchInventory, type InventoryItem } from '@/lib/admin';
import InventoryView from '@/components/InventoryView';

// FEATURE: Màn tồn kho (UC14, mở rộng §3.2): xem mọi món kể cả hết hàng, đặt số hoặc cộng/trừ.
// Phần vẽ ở components/InventoryView.tsx; trang này giữ tải bảng, PATCH và thứ tự "tải lại rồi mới báo lỗi".
export default function AdminPage() {
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const [items, setItems] = useState<InventoryItem[] | undefined>(undefined); // undefined = chưa có danh sách
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
      setItems((list) => list?.map((x) => (x.id === updated.id ? updated : x)));
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

  return (
    <InventoryView
      token={token}
      admin={roleFromToken(token ?? null) === 'ADMIN'}
      items={items}
      drafts={draft}
      error={error}
      busyId={busyId}
      onDelta={(p, value) => change(p, { mode: 'delta', value })}
      onSet={(p, value) => change(p, { mode: 'set', value })}
      onDraft={(id, value) => setDraft((d) => ({ ...d, [id]: value }))}
    />
  );
}

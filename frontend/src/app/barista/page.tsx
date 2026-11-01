'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { advanceOrder, cancelOrder } from '@/lib/api';
import { getToken, roleFromToken } from '@/lib/auth';
import { POLL_MS, QueueAuthError, fetchQueue, isStaff, type QueueOrder } from '@/lib/barista';
import BaristaView from '@/components/BaristaView';

// FEATURE: Màn quầy (US-10, mở rộng §3.2). Tự tải lại mỗi POLL_MS (5 giây); mọi chuyển trạng thái do backend kiểm (assertTransition).
// Phần vẽ ở components/BaristaView.tsx; trang này giữ poll, PATCH và hộp xác nhận hủy.
export default function BaristaPage() {
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const [orders, setOrders] = useState<QueueOrder[] | undefined>(undefined); // undefined = chưa tải xong lần đầu
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [halted, setHalted] = useState(false); // gặp 401/403 thì ngừng tự tải lại
  const started = useRef(0); // số thứ tự lần tải; kết quả cũ hơn lần đã áp dụng thì bỏ (tránh bản cũ ghi đè sau khi vừa PATCH)
  const applied = useRef(0);

  useEffect(() => setToken(getToken()), []);

  const staff = isStaff(roleFromToken(token ?? null));

  const load = useCallback(async () => {
    if (!token || !staff) return;
    const mine = ++started.current;
    try {
      const data = await fetchQueue(token);
      if (mine < applied.current) return;
      applied.current = mine;
      setOrders(data);
      setError(null);
    } catch (e) {
      if (mine < applied.current) return;
      applied.current = mine;
      if (e instanceof QueueAuthError) setHalted(true);
      setError(e instanceof Error ? e.message : 'Lỗi không xác định');
    }
  }, [token, staff]);

  useEffect(() => {
    if (!staff || halted) return;
    load();
    const t = setInterval(load, POLL_MS);
    return () => clearInterval(t);
  }, [load, staff, halted]);

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

  return (
    <BaristaView
      token={token}
      staff={staff}
      orders={orders}
      error={error}
      busyId={busyId}
      onAdvance={(o, to) => act(o, (t) => advanceOrder(o.id, to, t))}
      onCancel={(o) => {
        if (window.confirm('Hủy đơn vì hết nguyên liệu? Khách được hoàn tiền, kho được hoàn lại.')) act(o, (t) => cancelOrder(o.id, t));
      }}
    />
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import { cancelOrder, getMyOrders } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { needsPolling, sortNewestFirst } from '@/lib/history';
import type { HistoryOrder } from '@/lib/types';
import { POLL_INTERVAL_MS, usePolling } from '@/lib/use-order-poll';
import HistoryView from '@/components/HistoryView';

export default function HistoryPage() {
  // undefined = chưa đọc sessionStorage, null = đã đọc và chưa đăng nhập (trước đây dùng null cho cả hai nên nhánh "chưa đăng nhập" không bao giờ hiện)
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<{ id: string; message: string } | null>(null);

  useEffect(() => {
    setToken(getToken());
  }, []);

  // Tự cập nhật (US-09): GET /orders/me mỗi 3 giây đến khi không còn đơn PAID / PREPARING / READY (R14). Chưa có token thì không gọi API.
  // data là state của lõi poll: lúc làm mới (sau khi hủy, "Thử lại") danh sách cũ vẫn ở đó đến khi có danh sách mới.
  const { data, error, refresh } = usePolling(() => (token ? () => getMyOrders(token) : undefined), (list) => !needsPolling(list), POLL_INTERVAL_MS, [token]);
  const orders = useMemo(() => (data ? sortNewestFirst(data) : undefined), [data]);

  // 1 thao tác PATCH /orders/:id trên đơn: khóa nút của đơn đó, lỗi hiện dưới thẻ đơn, thành công thì làm mới danh sách ngay
  async function act(o: HistoryOrder, run: (token: string) => Promise<void>) {
    if (!token) return;
    setBusyId(o.id);
    setActionError(null);
    try {
      await run(token);
      refresh();
    } catch (e) {
      setActionError({ id: o.id, message: e instanceof Error ? e.message : 'Lỗi không xác định' });
    } finally {
      setBusyId(null);
    }
  }

  // Hủy đơn (US-10): PATCH /orders/:id CANCELLED; đơn PAID có hoàn tiền nên hỏi xác nhận trước
  function onCancel(o: HistoryOrder) {
    if (o.status === 'PAID' && !window.confirm('Đơn đã thanh toán. Hủy đơn sẽ hoàn tiền và hoàn lại kho. Bạn chắc chắn muốn hủy?')) return;
    return act(o, (t) => cancelOrder(o.id, t));
  }

  return <HistoryView token={token} orders={orders} error={error} busyId={busyId} actionError={actionError} onCancel={onCancel} onRetry={refresh} />;
}

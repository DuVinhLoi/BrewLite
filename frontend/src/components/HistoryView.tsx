import Link from 'next/link';
import { formatVND } from '@/lib/pricing';
import type { ApiError } from '@/lib/api';
import { itemLine } from '@/lib/history';
import { canCancel } from '@/lib/order-status';
import type { HistoryOrder } from '@/lib/types';
import ErrorState from './ui/ErrorState';
import OrderStatusTrack from './OrderStatusTrack';

// Phần hiển thị của /history, tách khỏi page.tsx để render HTML test được (Next 14 không cho file trang export thêm tên khác).
// token: undefined = chưa đọc sessionStorage, null = đã đọc và chưa đăng nhập, chuỗi = đã đăng nhập.
// orders: đã sắp mới nhất trước; undefined = chưa có danh sách nào. Khi đang làm mới (poll, sau khi hủy) danh sách cũ vẫn ở đây.
interface Props {
  token: string | null | undefined;
  orders: HistoryOrder[] | undefined;
  error: ApiError | undefined;
  busyId: string | null;
  actionError: { id: string; message: string } | null;
  onCancel: (o: HistoryOrder) => void;
  onRetry: () => void;
}

export default function HistoryView({ token, orders, error, busyId, actionError, onCancel, onRetry }: Props) {
  if (token === undefined) return null;
  if (!token)
    return (
      <section style={{ maxWidth: 480, margin: '40px auto' }}>
        <h1>Lịch sử đơn hàng</h1>
        <p>
          Bạn chưa đăng nhập. <Link href="/login">Đăng nhập</Link>
        </p>
      </section>
    );

  // Lỗi tải hoặc lỗi poll nền: nếu đã có danh sách thì giữ danh sách, khối lỗi nằm phía trên; poll tự xóa lỗi ở lần thành công sau, "Thử lại" hỏi ngay.
  const errorBlock = error && <ErrorState message={`Không tải được lịch sử: ${error.message}`} onRetry={onRetry} />;
  if (!orders && !errorBlock) return <p>Đang tải…</p>;

  // Mọi nhánh có nội dung (lỗi, rỗng, danh sách) dùng chung một section có tiêu đề.
  return (
    <section style={{ maxWidth: 640, margin: '24px auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <h1>Lịch sử đơn hàng</h1>
      {errorBlock}
      {orders && orders.length === 0 && <p>Chưa có đơn hàng nào.</p>}
      {orders?.map((o) => {
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
                <li key={idx}>{itemLine(i)}</li>
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

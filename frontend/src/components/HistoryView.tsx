import Link from 'next/link';
import type { ReactNode } from 'react';
import { formatVND } from '@/lib/pricing';
import type { ApiError } from '@/lib/api';
import { isFaded, itemLine, statusBadge } from '@/lib/history';
import { canCancel } from '@/lib/order-status';
import type { HistoryOrder } from '@/lib/types';
import Badge from './ui/Badge';
import Button from './ui/Button';
import EmptyState from './ui/EmptyState';
import ErrorState from './ui/ErrorState';
import GuestState from './GuestState';
import OrderStatusTrack from './OrderStatusTrack';
import styles from './HistoryView.module.css';

// Phần hiển thị của /history, tách khỏi page.tsx để render HTML test được (Next 14 không cho file trang export thêm tên khác).
// token: undefined = chưa đọc sessionStorage, null = đã đọc và chưa đăng nhập, chuỗi = đã đăng nhập.
// orders: đã sắp mới nhất trước; undefined = chưa có danh sách nào. Khi đang làm mới (poll, sau khi hủy) danh sách cũ vẫn ở đây.
// Giao diện nét mực: ui-visual-plan.md §6 mục 10 (artboard HistoryDoodle) và mục 11 (lịch sử rỗng, chưa đăng nhập; StatesDoodle).
interface Props {
  token: string | null | undefined;
  orders: HistoryOrder[] | undefined;
  error: ApiError | undefined;
  busyId: string | null;
  actionError: { id: string; message: string } | null;
  onCancel: (o: HistoryOrder) => void;
  onRetry: () => void;
}

// Mọi nhánh (trừ lúc chưa đọc token) dùng chung một section mở đầu bằng h1 "Lịch sử đơn hàng" (h1 không có thuộc tính:
// HistoryView.test.ts ghim đúng "<section…><h1>Lịch sử đơn hàng</h1>"; kiểu chữ đặt qua .page > h1). Túi hạt cạnh tiêu đề chỉ
// hiện khi có danh sách (trạng thái rỗng đã có túi hạt của nó).
function Page({ bag = false, children }: { bag?: boolean; children: ReactNode }) {
  return (
    <section className={styles.page}>
      <h1>Lịch sử đơn hàng</h1>
      {bag && <img src="/doodles/bag.svg" alt="" aria-hidden="true" width={78} height={78} className={styles.bag} />}
      {children}
    </section>
  );
}

function OrderCard({ o, busy, actionError, onCancel }: { o: HistoryOrder; busy: boolean; actionError: string | null; onCancel: () => void }) {
  const badge = statusBadge(o.status);
  const cancellable = canCancel(o.status);
  return (
    <article className={isFaded(o.status) ? `${styles.card} ${styles.faded}` : styles.card}>
      <div className={styles.head}>
        <strong className={`display ${styles.code}`}>{`#${o.id.slice(0, 8)}`}</strong>
        {/* Có thanh 5 bước thì nhãn STATUS_LABEL ở đây; không có (Thanh toán lỗi, Đã hủy, lạ) thì nhãn riêng của OrderStatusTrack */}
        {badge ? <Badge tone={badge.tone}>{badge.label}</Badge> : <OrderStatusTrack status={o.status} />}
        <span className={`tabular ${styles.total}`}>{formatVND(o.total)}</span>
      </div>
      <p className={`tabular ${styles.when}`}>
        <time dateTime={o.createdAt}>{new Date(o.createdAt).toLocaleString('vi-VN')}</time>
      </p>
      {badge && <OrderStatusTrack status={o.status} compact />}
      <ul className={styles.items}>
        {o.items.map((i, idx) => (
          <li key={idx} className={styles.item}>
            {/* GET /orders/me chỉ trả productId và productName, không có ảnh: ô 44px dùng hạt trang trí thay ảnh món */}
            <span className={styles.thumb}>
              <img src="/doodles/bean.svg" alt="" aria-hidden="true" width={28} height={20} />
            </span>
            <span className={styles.itemText}>{itemLine(i)}</span>
            <span className={`tabular ${styles.price}`}>{formatVND(i.unitPrice)}</span>
          </li>
        ))}
      </ul>
      {(cancellable || actionError) && (
        <div className={styles.actions}>
          {cancellable && (
            <Button variant="danger" className={styles.cancel} onClick={onCancel} disabled={busy}>
              {busy ? 'Đang xử lý…' : 'Hủy đơn'}
            </Button>
          )}
          {actionError && (
            <p role="alert" className={styles.actionError}>
              {actionError}
            </p>
          )}
        </div>
      )}
    </article>
  );
}

export default function HistoryView({ token, orders, error, busyId, actionError, onCancel, onRetry }: Props) {
  if (token === undefined) return null;
  if (!token)
    return (
      <Page>
        <GuestState />
      </Page>
    );

  // Lỗi tải hoặc lỗi poll nền: nếu đã có danh sách thì giữ danh sách, khối lỗi nằm phía trên; poll tự xóa lỗi ở lần thành công sau, "Thử lại" hỏi ngay.
  const errorBlock = error && <ErrorState doodle="/doodles/mug.svg" message={`Không tải được lịch sử: ${error.message}`} onRetry={onRetry} />;
  if (!orders && !errorBlock)
    return (
      <Page>
        <p className={styles.loading}>Đang tải…</p>
      </Page>
    );

  return (
    <Page bag={!!orders && orders.length > 0}>
      {errorBlock}
      {orders && orders.length === 0 && (
        <EmptyState
          titleAs="h2"
          doodle="/doodles/bag.svg"
          title="Chưa có đơn hàng nào."
          action={
            <Link href="/" className={styles.ctaLink}>
              Xem menu{' '}
              <span className={styles.ctaArrow} aria-hidden="true">
                ↗
              </span>
            </Link>
          }
        />
      )}
      {orders?.map((o) => (
        <OrderCard
          key={o.id}
          o={o}
          busy={busyId === o.id}
          actionError={actionError?.id === o.id ? actionError.message : null}
          onCancel={() => onCancel(o)}
        />
      ))}
    </Page>
  );
}

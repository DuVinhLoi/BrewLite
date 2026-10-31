import Link from 'next/link';
import type { ReactNode } from 'react';
import { formatVND } from '@/lib/pricing';
import { itemLine } from '@/lib/history';
import type { OrderStatus } from '@/lib/order-status';
import { QUEUE_COLUMNS, cardActions, groupQueue, pollNote, type QueueColumn, type QueueOrder } from '@/lib/barista';
import styles from './BaristaView.module.css';

// Phần hiển thị của /barista, tách khỏi page.tsx để render HTML test được (Next 14 không cho file trang export thêm tên khác).
// Poll, PATCH và hộp xác nhận hủy ở page.tsx; ở đây chỉ vẽ.
// token: undefined = chưa đọc sessionStorage; staff = role trong JWT là BARISTA hoặc ADMIN (isStaff).
// Giao diện nét mực: ui-visual-plan.md §6 mục 12 (artboard BaristaDoodle). Màn làm việc: không có chuyển động nào,
// nên không dùng components/ui/Button (có :active scale).
interface Props {
  token: string | null | undefined;
  staff: boolean;
  orders: QueueOrder[] | undefined; // undefined = chưa tải xong lần đầu (theo mẫu InventoryView)
  error: string | null;
  busyId: string | null;
  onAdvance: (o: QueueOrder, to: OrderStatus) => void;
  onCancel: (o: QueueOrder) => void;
}

// Màu số đếm ở đầu cột (artboard dòng 101 đến 103): Chờ pha nền mực, Đang pha nền warn, Sẵn sàng nền ok.
const COUNT_TONE: Record<QueueColumn, string> = { PAID: styles.toneInk, PREPARING: styles.toneWarn, READY: styles.toneOk };

// Dòng "Tự tải lại mỗi 5 giây." chỉ có khi đang xem hàng đợi (trang chặn vai trò không tự tải lại).
function Page({ note = false, children }: { note?: boolean; children: ReactNode }) {
  return (
    <section className={styles.page}>
      <div className={styles.head}>
        <h1 className={`display ${styles.title}`}>Quầy pha chế</h1>
        {note && <p className={styles.note}>{pollNote()}</p>}
      </div>
      {children}
    </section>
  );
}

function OrderCard({ o, column, busy, onAdvance, onCancel }: { o: QueueOrder; column: QueueColumn; busy: boolean } & Pick<Props, 'onAdvance' | 'onCancel'>) {
  const { advance, cancel } = cardActions(column, busy);
  return (
    <article className={styles.card}>
      <div className={styles.cardHead}>
        <strong className={styles.code}>{`#${o.id.slice(0, 8)}`}</strong>
        <span className={`tabular ${styles.total}`}>{formatVND(o.total)}</span>
      </div>
      <p className={`tabular ${styles.when}`}>
        <time dateTime={o.createdAt}>{new Date(o.createdAt).toLocaleTimeString('vi-VN')}</time>
      </p>
      <ul className={styles.items}>
        {o.items.map((i, idx) => (
          <li key={idx}>{itemLine(i)}</li>
        ))}
      </ul>
      <div className={styles.actions}>
        <button type="button" className={styles.advance} disabled={busy} onClick={() => onAdvance(o, advance.to)}>
          {advance.label}
        </button>
        {cancel && (
          <button type="button" className={styles.cancel} disabled={busy} onClick={() => onCancel(o)}>
            Hủy (hết nguyên liệu)
          </button>
        )}
      </div>
    </article>
  );
}

export default function BaristaView({ token, staff, orders, error, busyId, onAdvance, onCancel }: Props) {
  if (token === undefined) return null;
  if (!staff)
    return (
      <Page>
        <p className={styles.gate}>
          Trang này dành cho tài khoản quầy. <Link href="/login">Đăng nhập</Link> bằng barista@brewlite.vn.
        </p>
      </Page>
    );

  const cols = orders && groupQueue(orders);
  return (
    <Page note>
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
      {!orders && !error && <p className={styles.loading}>Đang tải…</p>}
      {cols && (
        <div className={styles.board}>
          {QUEUE_COLUMNS.map((c) => (
            <section key={c.status} className={styles.col}>
              <h2 className={styles.colHead}>
                {c.title}
                <span className={`tabular ${styles.count} ${COUNT_TONE[c.status]}`}>
                  {cols[c.status].length}
                  <span className="visually-hidden"> đơn</span>
                </span>
              </h2>
              {cols[c.status].length === 0 && (
                <div className={styles.empty}>
                  <img src="/doodles/mug.svg" alt="" aria-hidden="true" width={64} height={64} className={styles.emptyMug} />
                  <p className={styles.emptyText}>Không có đơn</p>
                </div>
              )}
              {cols[c.status].map((o) => (
                <OrderCard key={o.id} o={o} column={c.status} busy={busyId === o.id} onAdvance={onAdvance} onCancel={onCancel} />
              ))}
            </section>
          ))}
        </div>
      )}
    </Page>
  );
}

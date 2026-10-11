import Link from 'next/link';
import type { ReactNode } from 'react';
import { formatVND } from '@/lib/pricing';
import { inventorySummary, parseStockDraft, quickSteps, stockBadge, type InventoryItem } from '@/lib/admin';
import Badge, { type BadgeTone } from './ui/Badge';
import styles from './InventoryView.module.css';

// Phần hiển thị của /admin (màn Kho), tách khỏi page.tsx để render HTML test được (Next 14 không cho file trang export thêm tên khác).
// PATCH và tải lại sau lỗi ở page.tsx; ở đây chỉ vẽ.
// token: undefined = chưa đọc sessionStorage; admin = role trong JWT là ADMIN. items: undefined = chưa có danh sách.
// Giao diện nét mực: ui-visual-plan.md §6 mục 13 (artboard KhoDoodle). Màn làm việc: không có chuyển động nào,
// nên không dùng components/ui/Button (có :active scale).
interface Props {
  token: string | null | undefined;
  admin: boolean;
  items: InventoryItem[] | undefined;
  drafts: Record<string, string>;
  error: string | null;
  busyId: string | null;
  onDelta: (p: InventoryItem, delta: number) => void;
  onSet: (p: InventoryItem, value: number) => void;
  onDraft: (id: string, value: string) => void;
}

// Màu nhãn tồn kho; chữ của nhãn (stockBadge) luôn đi kèm, màu không là dấu hiệu duy nhất.
const BADGE_TONE: Record<'out' | 'low' | 'ok', BadgeTone> = { out: 'danger', low: 'warn', ok: 'ok' };

function Page({ children }: { children: ReactNode }) {
  return (
    <section className={styles.page}>
      <h1 className={`display ${styles.title}`}>Quản lý tồn kho</h1>
      {children}
    </section>
  );
}

function Row({ p, draft, busy, onDelta, onSet, onDraft }: { p: InventoryItem; draft: string | undefined; busy: boolean } & Pick<Props, 'onDelta' | 'onSet' | 'onDraft'>) {
  const badge = stockBadge(p.stock);
  const value = parseStockDraft(draft);
  return (
    <tr>
      <td className={styles.first}>
        <div className={styles.product}>
          {/* Ảnh món là trang trí ở đây: tên món đứng ngay cạnh */}
          <span className={styles.thumb}>{p.imageUrl ? <img src={p.imageUrl} alt="" width={48} height={48} /> : null}</span>
          <span className={styles.name}>{p.name}</span>
        </div>
      </td>
      <td className={`tabular ${styles.price}`}>{formatVND(p.price)}</td>
      <td>
        <div className={styles.stock}>
          <span className={`tabular ${styles.stockNum}`}>{p.stock}</span>
          <Badge tone={BADGE_TONE[badge.tone]}>{badge.label}</Badge>
        </div>
      </td>
      <td>
        <div className={styles.chips}>
          {quickSteps(p.name, p.stock, busy).map((q) => (
            <button key={q.delta} type="button" className={`tabular ${styles.chip}`} aria-label={q.label} disabled={q.disabled} onClick={() => onDelta(p, q.delta)}>
              {q.text}
            </button>
          ))}
        </div>
      </td>
      <td className={styles.last}>
        <div className={styles.set}>
          <label className="visually-hidden" htmlFor={`set-${p.id}`}>
            {`Đặt tồn kho ${p.name}`}
          </label>
          <input
            id={`set-${p.id}`}
            type="number"
            min={0}
            step={1}
            placeholder="Đặt số"
            className={`tabular ${styles.input}`}
            value={draft ?? ''}
            onChange={(e) => onDraft(p.id, e.target.value)}
          />
          <button type="button" className={styles.save} disabled={busy || value === null} onClick={() => value !== null && onSet(p, value)}>
            Lưu
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function InventoryView({ token, admin, items, drafts, error, busyId, onDelta, onSet, onDraft }: Props) {
  if (token === undefined) return null;
  if (!admin)
    return (
      <Page>
        <p className={styles.gate}>
          Trang này dành cho quản trị. <Link href="/login">Đăng nhập</Link> bằng admin@brewlite.vn.
        </p>
      </Page>
    );

  return (
    <Page>
      {items && <p className={styles.summary}>{inventorySummary(items)}</p>}
      {error && (
        <div role="alert" className={styles.alert}>
          <img src="/doodles/burst.svg" alt="" aria-hidden="true" width={20} height={20} className={styles.alertIcon} />
          <span>{error}</span>
        </div>
      )}
      {!items && !error && <p className={styles.loading}>Đang tải…</p>}
      {items && items.length > 0 && (
        <div className={styles.frame}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col" className={styles.first}>
                  Món
                </th>
                <th scope="col" className={styles.priceHead}>
                  Giá
                </th>
                <th scope="col">Tồn kho</th>
                <th scope="col">Điều chỉnh nhanh</th>
                <th scope="col" className={styles.last}>
                  Đặt số
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <Row key={p.id} p={p} draft={drafts[p.id]} busy={busyId === p.id} onDelta={onDelta} onSet={onSet} onDraft={onDraft} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Page>
  );
}

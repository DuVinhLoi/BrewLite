import Link from 'next/link';
import type { CartItem } from '@/lib/types';
import { formatVND } from '@/lib/pricing';
import QtyStepper from '../QtyStepper';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';
import styles from './CartView.module.css';

// Phần hiển thị của /cart ở bước "cart", tách khỏi page.tsx để render HTML test được (page dùng useRouter).
// Giao diện nét mực: ui-visual-plan.md §6 mục 5 và mục 11 (giỏ trống), artboard CartDoodle.
interface Props {
  items: CartItem[];
  /** Tổng số ly (store.count), dùng cho "Giỏ hàng (n món)". */
  count: number;
  total: number;
  onQtyChange: (key: string, quantity: number) => void;
  onRemove: (key: string) => void;
  onClear: () => void;
  onCheckout: () => void;
}

export default function CartView({ items, count, total, onQtyChange, onRemove, onClear, onCheckout }: Props) {
  if (items.length === 0) {
    return (
      <EmptyState
        size="lg"
        titleAs="h1"
        doodle="/doodles/mug.svg"
        title="Giỏ hàng trống"
        hint="Hãy chọn vài món ngon từ menu nhé!"
        action={
          <Link href="/" className={styles.ctaLink}>
            Về Menu{' '}
            <span className={styles.ctaArrow} aria-hidden="true">
              ↗
            </span>
          </Link>
        }
      />
    );
  }

  return (
    <section className={styles.cart} aria-labelledby="cart-title">
      <div className={styles.head}>
        <h1 id="cart-title" className={`display ${styles.title}`}>
          Giỏ hàng ({count} món)
        </h1>
        <img src="/doodles/sparkle.svg" alt="" aria-hidden="true" width={30} height={30} className={styles.sparkle} />
      </div>

      <div className={styles.grid}>
        <div className={styles.lines}>
          {items.map((item) => (
            <article key={item.key} className={styles.line}>
              {/* Ô ảnh 104px: SVG món đã có nền màu theo món; không có ảnh thì ô trống nền mist */}
              <div className={styles.thumb}>
                {item.imageUrl ? <img src={item.imageUrl} alt="" aria-hidden="true" width={104} height={104} className={styles.thumbImg} /> : null}
              </div>
              <div className={styles.info}>
                <h2 className={`display ${styles.name}`}>{item.name}</h2>
                <p className={styles.meta}>
                  Size {item.size}
                  {item.toppings.length > 0 ? ` • ${item.toppings.join(', ')}` : ' • Không topping'}
                </p>
                <p className={`${styles.meta} ${styles.unit}`}>{formatVND(item.unitPrice)} / ly</p>
              </div>
              <div className={styles.side}>
                <QtyStepper quantity={item.quantity} onChange={(q) => onQtyChange(item.key, q)} onRemove={() => onRemove(item.key)} />
                <strong className={styles.lineTotal}>{formatVND(item.lineTotal)}</strong>
              </div>
            </article>
          ))}
        </div>

        <aside className={styles.summary} aria-label="Tổng giỏ hàng">
          <img src="/doodles/mug.svg" alt="" aria-hidden="true" width={108} height={102} className={styles.mug} />
          <p className={styles.totalLabel}>Tổng</p>
          <p className={`display ${styles.total}`}>{formatVND(total)}</p>
          <p className={styles.note}>Chọn ví điện tử hoặc thẻ ngân hàng ở bước thanh toán.</p>
          <Button variant="cta" fullWidth onClick={onCheckout} className={styles.checkout}>
            Thanh toán • {formatVND(total)}
          </Button>
          <Button variant="ghost" fullWidth onClick={onClear} className={styles.clear}>
            Xóa hết
          </Button>
        </aside>
      </div>
    </section>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import type { Product } from '@/lib/types';
import { stockBadge } from '@/lib/stock';
import { formatVND } from '@/lib/pricing';
import { useCart } from '@/store/cart';
import { addItemMessage } from '@/lib/cart-limits';
import { createTimeoutSlot } from '@/lib/timeout-slot';
import Badge from './ui/Badge';
import Button from './ui/Button';
import ProductDetailModal from './ProductDetailModal';
import styles from './ProductCard.module.css';

// FEATURE: Product card: nút "Thêm vào giỏ" dùng size M mặc định (tùy chọn size/topping ở ProductDetailModal).
// Giao diện nét mực: ui-visual-plan.md §6 mục 3, artboard MenuDoodle.
export default function ProductCard({ product }: { product: Product }) {
  const addItem = useCart((s) => s.addItem);
  const [added, setAdded] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [customizing, setCustomizing] = useState(false);
  // Cùng ngưỡng với màn Kho (stockBadge, LOW_STOCK trong lib/stock.ts): hết hàng khi stock <= 0, sắp hết khi stock <= LOW_STOCK.
  const { tone } = stockBadge(product.stock);
  const outOfStock = tone === 'out';
  // Một timer "Đã thêm ✓" duy nhất: lần bấm sau đặt lại hoặc hủy nó, rời màn thì dọn (không setAdded sau unmount).
  const addedTimer = useRef(createTimeoutSlot());
  useEffect(() => {
    const slot = addedTimer.current;
    return () => slot.clear();
  }, []);

  const handleAdd = () => {
    if (outOfStock) return;
    const result = addItem(product);
    if (result.ok) {
      setNotice(null);
      setAdded(true);
      addedTimer.current.set(() => setAdded(false), 1200);
    } else {
      // Bị từ chối thì không bao giờ hiện "Đã thêm ✓".
      addedTimer.current.clear();
      setAdded(false);
      setNotice(addItemMessage(result.reason));
    }
  };

  return (
    <>
      <article className={outOfStock ? `${styles.card} ${styles.out}` : styles.card}>
        {/* Ô 4:3: ảnh món (SVG 240×180 đã có nền màu) phủ kín ô; không có ảnh thì ô trống nền mist */}
        <div className={styles.media}>
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} width={240} height={180} className={styles.img} />
          ) : null}
        </div>
        <h3 className={`display ${styles.name}`}>{product.name}</h3>
        <div className={styles.meta}>
          <span className={styles.price}>{formatVND(product.price)}</span>
          {outOfStock ? (
            <Badge tone="danger">Hết hàng</Badge>
          ) : (
            <span className={styles.stock}>{tone === 'low' ? `Sắp hết, còn ${product.stock}` : `Còn ${product.stock}`}</span>
          )}
        </div>
        <Button
          variant="primary"
          fullWidth
          onClick={handleAdd}
          disabled={outOfStock}
          className={added ? `${styles.addBtn} ${styles.added}` : styles.addBtn}
        >
          {outOfStock ? 'Hết hàng' : added ? 'Đã thêm ✓' : 'Thêm vào giỏ'}
        </Button>
        {/* Vùng live riêng (luôn có mặt, rỗng khi chưa thêm): trình đọc màn hình báo "Đã thêm ✓" thay vì đọc nhãn nút đổi chữ */}
        <span role="status" className="visually-hidden">
          {added ? 'Đã thêm ✓' : ''}
        </span>
        {notice && (
          <p role="status" className={styles.notice}>
            {notice}
          </p>
        )}
        <Button variant="link" onClick={() => setCustomizing(true)} disabled={outOfStock} className={styles.options}>
          Tùy chọn size / topping
        </Button>
      </article>
      {/* Modal nằm ngoài <article>: rê chuột trên lớp phủ không kích hover của thẻ. Nếu nằm trong, transform khi hover
          làm thẻ thành khối chứa của lớp phủ position: fixed và modal bị co vào trong thẻ. */}
      {customizing && <ProductDetailModal product={product} onClose={() => setCustomizing(false)} />}
    </>
  );
}

'use client';

import { useState } from 'react';
import type { Product } from '@/lib/types';
import { formatVND } from '@/lib/pricing';
import { useCart } from '@/store/cart';
import Badge from './ui/Badge';
import Button from './ui/Button';
import styles from './ProductCard.module.css';

// FEATURE: Product card — add the existing default size M without toppings.
export default function ProductCard({ product }: { product: Product }) {
  const addItem = useCart((s) => s.addItem);
  const [added, setAdded] = useState(false);
  const outOfStock = product.stock <= 0;

  const handleAdd = () => {
    if (outOfStock) return;
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <article className={outOfStock ? `${styles.card} ${styles.out}` : styles.card}>
      <div className={styles.media}>
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} width={240} height={180} className={styles.img} />
        ) : null}
      </div>
      <h3 className={`display ${styles.name}`}>{product.name}</h3>
      <div className={styles.meta}>
        <span className={styles.price}>{formatVND(product.price)}</span>
        {outOfStock ? <Badge tone="danger">Hết hàng</Badge> : <span className={styles.stock}>Còn {product.stock}</span>}
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
      <span role="status" className="visually-hidden">{added ? 'Đã thêm ✓' : ''}</span>
    </article>
  );
}

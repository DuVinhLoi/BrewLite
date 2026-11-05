import Image from 'next/image';
import type { Product } from '@/lib/api';
import { formatVnd } from '@/lib/format';
import { stockBadge } from '@/lib/stock';
import styles from './ProductCard.module.css';

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  const badge = stockBadge(product.stock);
  const soldOut = product.stock <= 0;

  return (
    <article className={soldOut ? `${styles.card} ${styles.soldOut}` : styles.card}>
      <div className={styles.imageWrap}>
        <Image
          src={product.imageUrl}
          alt={product.name}
          width={400}
          height={300}
          className={styles.image}
        />
      </div>
      <div className={styles.body}>
        <h3 className={styles.name}>{product.name}</h3>
        <div className={styles.meta}>
          <p className={styles.price}>{formatVnd(product.price)}</p>
          <p className={`${styles.stock} ${styles[badge.tone]}`}>{soldOut ? 'Hết hàng' : 'Còn hàng'}</p>
        </div>
        <form action={`/products/${encodeURIComponent(product.id)}`}><button type="submit" className={styles.addButton} disabled={soldOut}>
          Thêm vào giỏ
        </button></form>
      </div>
    </article>
  );
}

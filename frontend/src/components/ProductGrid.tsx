'use client';

import type { Product } from '@/lib/types';
import EmptyState from './ui/EmptyState';
import ErrorState from './ui/ErrorState';
import Skeleton from './ui/Skeleton';
import ProductCard from './ProductCard';
import styles from './ProductGrid.module.css';

interface Props {
  products: Product[];
  loading: boolean;
  error: string | null;
  fromMock: boolean;
  onRetry: () => void;
}

// FEATURE: Menu grid — loading skeleton / empty / error + retry.
export default function ProductGrid({ products, loading, error, fromMock, onRetry }: Props) {
  if (loading) {
    return (
      <div className={styles.grid} aria-busy="true" aria-label="Đang tải menu">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={styles.skeletonCard}>
            <Skeleton height={120} />
            <Skeleton height={16} />
            <Skeleton height={16} width="50%" />
            <Skeleton height={40} />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.state}>
        <ErrorState doodle="/doodles/mug.svg" message="Không tải được menu." detail={error} onRetry={onRetry} />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className={styles.state}>
        <EmptyState doodle="/doodles/bag.svg" title="Chưa có món nào." hint="Menu đang trống. Quay lại sau nhé!" />
      </div>
    );
  }

  return (
    <div>
      {fromMock && (
        <p style={{ fontSize: 13, color: '#92400e', background: '#fef3c7', padding: '8px 12px', borderRadius: 8 }}>
          Đang hiển thị menu mẫu vì chưa cấu hình NEXT_PUBLIC_API_URL. Đặt biến này (xem .env.example) để dùng API thật.
        </p>
      )}
      <div className={styles.grid}>
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}

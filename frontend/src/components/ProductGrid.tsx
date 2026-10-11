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

// FEATURE: Menu grid: loading skeleton / empty / error + retry.
export default function ProductGrid({ products, loading, error, fromMock, onRetry }: Props) {
  if (loading) {
    return (
      <div className={styles.grid} aria-busy="true" role="status" aria-label="Đang tải menu">
        {Array.from({ length: 4 }).map((_, i) => (
          // Cùng dáng thẻ món (ProductCard): ô ảnh 4:3, dòng tên, dòng giá, nút viên
          <div key={i} className={styles.skeletonCard}>
            <Skeleton aspectRatio="4 / 3" className={styles.skeletonMedia} />
            <Skeleton height={26} width="70%" />
            <Skeleton height={18} width="45%" />
            <Skeleton height={46} className={styles.skeletonButton} />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <ErrorState doodle="/doodles/mug.svg" message="Không tải được menu." detail={error} onRetry={onRetry} />;
  }

  if (products.length === 0) {
    return <EmptyState doodle="/doodles/bag.svg" title="Chưa có món nào." hint="Menu đang trống. Quay lại sau nhé!" />;
  }

  return (
    <div>
      {fromMock && (
        <p className={styles.mockBanner}>
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

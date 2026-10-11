'use client';

import { getProducts } from '@/lib/api';
import { useAsync } from '@/lib/use-async';
import ProductGrid from '@/components/ProductGrid';

// ============================================================
// FEATURE: Menu page (Task 3) — GET /products, render lưới + loading/empty/error.
// ============================================================
export default function MenuPage() {
  const { data, error, loading, retry } = useAsync(getProducts, []);

  return (
    <section>
      <h1 style={{ margin: '8px 0 4px' }}>BrewLite — Menu</h1>
      <p style={{ color: '#6b7280', marginTop: 0 }}>
        Chọn món, thêm vào giỏ rồi thanh toán không tiền mặt. (Task 3: hiển thị menu)
      </p>
      <ProductGrid
        products={data?.data ?? []}
        loading={loading}
        error={error?.message ?? null}
        fromMock={data?.fromMock ?? false}
        onRetry={retry}
      />
    </section>
  );
}

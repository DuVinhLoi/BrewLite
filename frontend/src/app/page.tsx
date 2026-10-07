'use client';

import { useCallback, useEffect, useState } from 'react';
import { getProducts } from '@/lib/api';
import type { Product } from '@/lib/types';
import ProductGrid from '@/components/ProductGrid';

/**
 * Task 3 — Trang Menu (Frontend):
 * - Gọi GET /products, render lưới sản phẩm
 * - Có loading / empty / error state (tiêu chí chấp nhận)
 */
export default function MenuPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromMock, setFromMock] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, fromMock } = await getProducts();
      setProducts(data);
      setFromMock(fromMock);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi không xác định');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <section>
      <h1 style={{ margin: '8px 0 4px' }}>BrewLite — Menu</h1>
      <p style={{ color: '#6b7280', marginTop: 0 }}>
        Chọn món, thêm vào giỏ rồi thanh toán không tiền mặt. (Task 3: hiển thị menu)
      </p>
      <ProductGrid products={products} loading={loading} error={error} fromMock={fromMock} onRetry={load} />
    </section>
  );
}

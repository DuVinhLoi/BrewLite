'use client';

import { useCallback, useEffect, useState } from 'react';
import { getProducts } from '@/lib/api';
import type { Product } from '@/lib/types';
import ProductGrid from '@/components/ProductGrid';
import MenuHero from '@/components/menu/MenuHero';
import MenuSection from '@/components/menu/MenuSection';

// ============================================================
// FEATURE: Menu page (Task 3) — GET /products, render lưới + loading/empty/error.
// ============================================================
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
    <>
      <MenuHero summary={!loading && !error && products.length > 0 ? {
        count: products.length,
        minPrice: Math.min(...products.map((product) => product.price)),
      } : null} />
      <MenuSection>
        <ProductGrid products={products} loading={loading} error={error} fromMock={fromMock} onRetry={load} />
      </MenuSection>
    </>
  );
}

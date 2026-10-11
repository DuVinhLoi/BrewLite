'use client';

import { getProducts } from '@/lib/api';
import { menuSummary } from '@/lib/menu-summary';
import { useAsync } from '@/lib/use-async';
import MenuHero from '@/components/menu/MenuHero';
import MenuSection from '@/components/menu/MenuSection';
import ProductGrid from '@/components/ProductGrid';

// ============================================================
// FEATURE: Menu page (Task 3): GET /products, hero + lưới món với loading / empty / error.
// ============================================================
export default function MenuPage() {
  const { data, error, loading, retry } = useAsync(getProducts, []);
  const products = data?.data ?? [];
  // "N món / giá từ X" chỉ hiện khi menu tải xong và có món: đang tải hoặc lỗi thì ẩn.
  const summary = loading || error ? null : menuSummary(products);

  return (
    <>
      <MenuHero summary={summary} />
      <MenuSection>
        <ProductGrid
          products={products}
          loading={loading}
          error={error?.message ?? null}
          fromMock={data?.fromMock ?? false}
          onRetry={retry}
        />
      </MenuSection>
    </>
  );
}

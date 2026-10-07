'use client';

import type { CSSProperties } from 'react';
import type { Product } from '@/lib/types';
import ProductCard from './ProductCard';

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
      <div style={gridStyle} aria-busy="true" aria-label="Đang tải menu">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={skeletonStyle}>
            <div style={{ height: 120, background: '#e5e7eb', borderRadius: 8 }} />
            <div style={{ height: 16, background: '#e5e7eb', borderRadius: 4 }} />
            <div style={{ height: 16, width: '50%', background: '#e5e7eb', borderRadius: 4 }} />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div style={emptyStyle} role="alert">
        <p style={{ fontSize: 18, fontWeight: 700 }}>Không tải được menu 😢</p>
        <p style={{ color: '#6b7280' }}>{error}</p>
        <button onClick={onRetry} style={retryStyle}>
          Thử lại
        </button>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div style={emptyStyle}>
        <p style={{ fontSize: 18, fontWeight: 700 }}>Chưa có món nào</p>
        <p style={{ color: '#6b7280' }}>Menu đang trống. Quay lại sau nhé!</p>
      </div>
    );
  }

  return (
    <div>
      {fromMock && (
        <p style={{ fontSize: 13, color: '#92400e', background: '#fef3c7', padding: '8px 12px', borderRadius: 8 }}>
          Đang hiển thị menu mẫu (backend GET /products chưa chạy). Set NEXT_PUBLIC_API_URL để dùng API thật.
        </p>
      )}
      <div style={gridStyle}>
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}

const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
  gap: 16,
  marginTop: 16,
};

const skeletonStyle: CSSProperties = {
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  padding: 16,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};

const emptyStyle: CSSProperties = {
  textAlign: 'center',
  padding: '48px 16px',
  border: '1px dashed #d1d5db',
  borderRadius: 12,
  marginTop: 16,
  background: '#fff',
};

const retryStyle: CSSProperties = {
  background: '#065f46',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  padding: '10px 18px',
  fontWeight: 700,
  cursor: 'pointer',
};

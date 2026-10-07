'use client';

import { useState } from 'react';
import type { CSSProperties } from 'react';
import type { Product } from '@/lib/types';
import { formatVND } from '@/lib/pricing';
import { useCart } from '@/store/cart';

/**
 * Task 3: thẻ sản phẩm trong lưới Menu.
 * LƯU Ý PHẠM VI: chỉ làm Task 3 + Task 5, KHÔNG làm Task 4.
 * Nên nút "Thêm" dùng option mặc định (size M, không topping).
 * Màn hình chọn size/topping chi tiết thuộc Task 4 — để nhóm Task 4 làm tiếp.
 */
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
    <div style={styles.card}>
      <div style={styles.thumb} aria-hidden>
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.imageUrl} alt={product.name} style={styles.img} />
        ) : (
          <span style={styles.emoji}>☕</span>
        )}
      </div>
      <h3 style={styles.name}>{product.name}</h3>
      <p style={styles.price}>{formatVND(product.price)}</p>
      <p style={styles.stock}>{outOfStock ? 'Hết hàng' : `Còn ${product.stock}`}</p>
      <button onClick={handleAdd} disabled={outOfStock} style={outOfStock ? styles.btnDisabled : styles.btn}>
        {outOfStock ? 'Hết hàng' : added ? 'Đã thêm ✓' : 'Thêm vào giỏ'}
      </button>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  card: {
    border: '1px solid #e5e7eb',
    borderRadius: 12,
    padding: 16,
    background: '#fff',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  thumb: {
    height: 120,
    borderRadius: 8,
    background: '#f3f4f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  emoji: { fontSize: 44 },
  img: { width: '100%', height: '100%', objectFit: 'cover' },
  name: { margin: 0, fontSize: 16 },
  price: { margin: 0, fontWeight: 800, color: '#065f46' },
  stock: { margin: 0, fontSize: 13, color: '#6b7280' },
  btn: {
    marginTop: 4,
    background: '#065f46',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '10px 12px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  btnDisabled: {
    marginTop: 4,
    background: '#e5e7eb',
    color: '#6b7280',
    border: 'none',
    borderRadius: 8,
    padding: '10px 12px',
    fontWeight: 700,
  },
};

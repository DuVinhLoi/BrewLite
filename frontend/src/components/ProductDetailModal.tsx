'use client';

import { useState } from 'react';
import type { CSSProperties } from 'react';
import type { Product, Size } from '@/lib/types';
import { calcLineTotal, calcUnitPrice, formatVND, SIZE_UPCHARGE, TOPPING_PRICES, DEFAULT_SIZE } from '@/lib/pricing';
import { useCart } from '@/store/cart';
import { addItemMessage, MAX_QTY, maxModalQty } from '@/lib/cart-limits';

const SIZES: Size[] = ['S', 'M', 'L'];
const TOPPINGS = Object.keys(TOPPING_PRICES);

// UC01 steps 111-114: size/topping/qty picked here, price recomputed on client, no server call.
export default function ProductDetailModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const addItem = useCart((s) => s.addItem);
  const [size, setSize] = useState<Size>(DEFAULT_SIZE);
  const [toppings, setToppings] = useState<string[]>([]);
  const [qty, setQty] = useState(1);
  const [notice, setNotice] = useState<string | null>(null);

  const unit = calcUnitPrice(product.price, size, toppings);
  // Trần theo tồn kho và MAX_QTY: addItem từ chối (không cắt) khi xin quá 99, nên bộ chọn không được đi quá đó.
  const maxQty = maxModalQty(product.stock);
  const atMax = qty >= maxQty;
  const plusTitle = !atMax ? 'Tăng' : product.stock < MAX_QTY ? 'Đã chọn hết số lượng còn lại' : `Tối đa ${MAX_QTY} ly mỗi dòng`;

  // Đổi số lượng / size / topping thì thông báo từ lần thêm trước không còn đúng: xóa.
  const toggleTopping = (t: string) => {
    setNotice(null);
    setToppings((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };
  const pickSize = (s: Size) => {
    setNotice(null);
    setSize(s);
  };
  const changeQty = (delta: number) => {
    setNotice(null);
    setQty((q) => Math.min(maxQty, Math.max(1, q + delta)));
  };

  const handleAdd = () => {
    const result = addItem(product, { size, toppings, quantity: Math.min(Math.max(1, qty), maxQty) });
    // Bị từ chối thì giữ modal mở và báo lý do, không đóng như đã thêm.
    if (result.ok) onClose();
    else setNotice(addItemMessage(result.reason));
  };

  return (
    <div style={styles.overlay} onClick={onClose} role="dialog" aria-modal="true" aria-label={product.name}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ margin: '0 0 4px' }}>{product.name}</h2>
        <p style={styles.base}>Giá gốc: {formatVND(product.price)} • Còn {product.stock}</p>

        <p style={styles.label}>Size</p>
        {SIZES.map((s) => (
          <label key={s} style={styles.row}>
            <input type="radio" name="size" checked={size === s} onChange={() => pickSize(s)} />
            {s} (+{formatVND(SIZE_UPCHARGE[s])})
          </label>
        ))}

        <p style={styles.label}>Topping</p>
        {TOPPINGS.map((t) => (
          <label key={t} style={styles.row}>
            <input type="checkbox" checked={toppings.includes(t)} onChange={() => toggleTopping(t)} />
            {t} (+{formatVND(TOPPING_PRICES[t] ?? 0)})
          </label>
        ))}

        <p style={styles.label}>Số lượng</p>
        <div style={styles.qtyRow}>
          <button style={styles.qtyBtn} onClick={() => changeQty(-1)} aria-label="Giảm">−</button>
          <strong>{qty}</strong>
          <button
            style={atMax ? { ...styles.qtyBtn, opacity: 0.35, cursor: 'not-allowed' } : styles.qtyBtn}
            onClick={() => changeQty(1)}
            disabled={atMax}
            aria-label="Tăng"
            title={plusTitle}
          >
            +
          </button>
        </div>

        <p style={styles.total}>Tạm tính: <strong>{formatVND(calcLineTotal(unit, qty))}</strong></p>
        {notice && <p role="status" style={styles.base}>{notice}</p>}
        <div style={styles.actions}>
          <button style={styles.backBtn} onClick={onClose}>Đóng</button>
          <button style={styles.addBtn} onClick={handleAdd}>Thêm vào giỏ • {formatVND(calcLineTotal(unit, qty))}</button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 },
  modal: { background: '#fff', borderRadius: 12, padding: 20, maxWidth: 420, width: '100%', maxHeight: '90vh', overflowY: 'auto' },
  base: { margin: '0 0 8px', fontSize: 13, color: '#6b7280' },
  label: { fontWeight: 800, margin: '12px 0 4px' },
  row: { display: 'flex', gap: 8, alignItems: 'center', padding: '6px 0', cursor: 'pointer' },
  qtyRow: { display: 'flex', gap: 12, alignItems: 'center' },
  qtyBtn: { width: 32, height: 32, borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontSize: 16 },
  total: { fontSize: 17, margin: '14px 0 0' },
  actions: { display: 'flex', gap: 12, marginTop: 12 },
  backBtn: { background: 'transparent', border: '1px solid #d1d5db', borderRadius: 8, padding: '12px 16px', cursor: 'pointer', fontWeight: 700 },
  addBtn: { flex: 1, background: '#065f46', color: '#fff', border: 'none', borderRadius: 8, padding: 12, fontWeight: 800, cursor: 'pointer' },
};

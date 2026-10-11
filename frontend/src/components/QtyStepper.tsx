'use client';

import { MAX_QTY } from '@/lib/cart-limits';
import styles from './QtyStepper.module.css';

interface Props {
  quantity: number;
  onChange: (next: number) => void;
  onRemove: () => void;
}

// FEATURE: Qty stepper — trừ dừng ở 1, cộng dừng ở MAX_QTY (99, khớp backend), xóa món bằng nút Xóa riêng.
// Giao diện nét mực (ui-visual-plan.md §6 mục 5): nút −/+ tròn viền mực, "Xóa" là nút chữ.
export default function QtyStepper({ quantity, onChange, onRemove }: Props) {
  const atMin = quantity <= 1;
  const atMax = quantity >= MAX_QTY;
  return (
    <div className={styles.row}>
      <button
        type="button"
        onClick={() => onChange(quantity - 1)}
        disabled={atMin}
        className={styles.step}
        aria-label="Giảm số lượng"
        title={atMin ? 'Số lượng tối thiểu là 1' : 'Giảm số lượng'}
      >
        −
      </button>
      <span className={styles.qty} aria-live="polite">
        {quantity}
      </span>
      <button
        type="button"
        onClick={() => onChange(quantity + 1)}
        disabled={atMax}
        className={styles.step}
        aria-label="Tăng số lượng"
        title={atMax ? `Tối đa ${MAX_QTY} ly mỗi dòng` : 'Tăng số lượng'}
      >
        +
      </button>
      <button type="button" onClick={onRemove} className={styles.remove} aria-label="Xóa món">
        Xóa
      </button>
    </div>
  );
}

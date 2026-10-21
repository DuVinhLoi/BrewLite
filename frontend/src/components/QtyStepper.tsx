'use client';

import styles from './QtyStepper.module.css';

interface Props {
  quantity: number;
  onChange: (next: number) => void;
  onRemove: () => void;
}

// FEATURE: Qty stepper — minimum one; remove a line with its separate button.
export default function QtyStepper({ quantity, onChange, onRemove }: Props) {
  const atMin = quantity <= 1;
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
      <span className={styles.qty} aria-live="polite">{quantity}</span>
      <button type="button" onClick={() => onChange(quantity + 1)} className={styles.step} aria-label="Tăng số lượng">
        +
      </button>
      <button type="button" onClick={onRemove} className={styles.remove} aria-label="Xóa món">
        Xóa
      </button>
    </div>
  );
}

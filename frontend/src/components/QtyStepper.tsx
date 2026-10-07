'use client';

import type { CSSProperties } from 'react';

interface Props {
  quantity: number;
  onChange: (next: number) => void;
  onRemove: () => void;
}

/** Task 5: nút tăng/giảm số lượng + xóa dòng giỏ. Số lượng tối thiểu là 1 (nút trừ mờ khi đang ở 1). */
export default function QtyStepper({ quantity, onChange, onRemove }: Props) {
  const atMin = quantity <= 1;
  return (
    <div style={styles.row}>
      <button
        onClick={() => onChange(quantity - 1)}
        disabled={atMin}
        style={atMin ? { ...styles.step, ...styles.stepDisabled } : styles.step}
        aria-label="Giảm số lượng"
        title={atMin ? 'Số lượng tối thiểu là 1' : 'Giảm số lượng'}
      >
        −
      </button>
      <span style={styles.qty} aria-live="polite">
        {quantity}
      </span>
      <button onClick={() => onChange(quantity + 1)} style={styles.step} aria-label="Tăng số lượng">
        +
      </button>
      <button onClick={onRemove} style={styles.remove} aria-label="Xóa món">
        Xóa
      </button>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  row: { display: 'flex', alignItems: 'center', gap: 8 },
  step: {
    width: 32,
    height: 32,
    borderRadius: 8,
    border: '1px solid #d1d5db',
    background: '#fff',
    fontSize: 18,
    fontWeight: 800,
    cursor: 'pointer',
  },
  stepDisabled: {
    opacity: 0.35,
    cursor: 'not-allowed',
  },
  qty: { minWidth: 28, textAlign: 'center', fontWeight: 800 },
  remove: {
    marginLeft: 8,
    background: 'transparent',
    border: 'none',
    color: '#dc2626',
    cursor: 'pointer',
    fontWeight: 700,
  },
};

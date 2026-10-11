import type { ReactNode } from 'react';
import styles from './Badge.module.css';

// Màu không phải dấu hiệu duy nhất: luôn có chữ trong children (ví dụ "Còn hàng", "Hết hàng").
export type BadgeTone = 'neutral' | 'ink' | 'ok' | 'warn' | 'danger';

export default function Badge({ tone, children }: { tone: BadgeTone; children: ReactNode }) {
  return <span className={`${styles.badge} ${styles[tone]}`}>{children}</span>;
}

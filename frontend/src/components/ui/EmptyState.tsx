import type { ReactNode } from 'react';
import styles from './EmptyState.module.css';

interface Props {
  title: string;
  hint?: string;
  action?: ReactNode;
  /** Đường dẫn SVG trang trí, ví dụ '/doodles/bag.svg'. Vẽ bằng <img alt="">. */
  doodle?: string;
}

export default function EmptyState({ title, hint, action, doodle }: Props) {
  return (
    <div className={styles.empty}>
      {doodle && <img src={doodle} alt="" width={96} height={96} className={styles.doodle} />}
      <p className={`${styles.title} display`}>{title}</p>
      {hint && <p className={styles.hint}>{hint}</p>}
      {action}
    </div>
  );
}

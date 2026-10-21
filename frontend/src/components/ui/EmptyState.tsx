import type { ReactNode } from 'react';
import styles from './EmptyState.module.css';

interface Props {
  title: string;
  hint?: string;
  action?: ReactNode;
  /** Đường dẫn SVG trang trí, ví dụ '/doodles/bag.svg'. Vẽ bằng <img alt="">. */
  doodle?: string;
  /** Thẻ của tiêu đề. Mặc định <p>; trang mà trạng thái rỗng là cả trang (giỏ trống) dùng 'h1'. */
  titleAs?: 'p' | 'h1' | 'h2';
  /** 'lg': trạng thái chiếm cả trang (tiêu đề 48px, hình 160px), artboard CartDoodle. */
  size?: 'md' | 'lg';
}

export default function EmptyState({ title, hint, action, doodle, titleAs: Title = 'p', size = 'md' }: Props) {
  return (
    <div className={size === 'lg' ? `${styles.empty} ${styles.lg}` : styles.empty}>
      {doodle && <img src={doodle} alt="" width={96} height={96} className={styles.doodle} />}
      <Title className={`${styles.title} display`}>{title}</Title>
      {hint && <p className={styles.hint}>{hint}</p>}
      {action}
    </div>
  );
}

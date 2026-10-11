import styles from './Skeleton.module.css';

type Size =
  | { height: number; aspectRatio?: string }
  /** Ô theo tỉ lệ (ví dụ '4 / 3' cho ô ảnh món): dùng thay cho height. */
  | { aspectRatio: string; height?: number };

// Phải có height hoặc aspectRatio (ít nhất một), nếu không khối cao 0 và không thấy gì.
type Props = Size & {
  width?: number | string;
  /** Lớp thêm (bo góc, khoảng cách) cộng vào lớp skeleton, giữ nhịp mờ đậm chung. */
  className?: string;
};

export default function Skeleton({ height, width = '100%', aspectRatio, className }: Props) {
  const cls = [styles.skeleton, className ?? ''].filter(Boolean).join(' ');
  return <div aria-hidden="true" className={cls} style={{ height, width, aspectRatio }} />;
}

import Button from './Button';
import styles from './ErrorState.module.css';

interface Props {
  message: string;
  /** Chi tiết lỗi (ví dụ câu có mã HTTP), hiện dưới message, trong cùng khối role="alert". */
  detail?: string;
  onRetry?: () => void;
  /** Đường dẫn SVG trang trí, ví dụ '/doodles/mug.svg'. */
  doodle?: string;
}

export default function ErrorState({ message, detail, onRetry, doodle }: Props) {
  return (
    <div role="alert" className={styles.error}>
      {doodle && <img src={doodle} alt="" width={72} height={72} />}
      <p className={styles.message}>{message}</p>
      {detail && <p className={styles.detail}>{detail}</p>}
      {onRetry && (
        <Button variant="ghost" onClick={onRetry}>
          Thử lại
        </Button>
      )}
    </div>
  );
}

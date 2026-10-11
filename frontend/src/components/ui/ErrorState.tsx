import Button from './Button';
import styles from './ErrorState.module.css';

interface Props {
  message: string;
  onRetry?: () => void;
  /** Đường dẫn SVG trang trí, ví dụ '/doodles/mug.svg'. */
  doodle?: string;
}

export default function ErrorState({ message, onRetry, doodle }: Props) {
  return (
    <div role="alert" className={styles.error}>
      {doodle && <img src={doodle} alt="" width={72} height={72} />}
      <p className={styles.message}>{message}</p>
      {onRetry && (
        <Button variant="ghost" onClick={onRetry}>
          Thử lại
        </Button>
      )}
    </div>
  );
}

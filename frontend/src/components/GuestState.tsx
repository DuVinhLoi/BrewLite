import Link from 'next/link';
import styles from './GuestState.module.css';

// Trạng thái "chưa đăng nhập" dùng chung cho /profile và /history (ui-visual-plan.md §6 mục 11, artboard StatesDoodle).
// Trang bọc ngoài tự đặt h1 của mình; ở đây là h2. CTA là liên kết thật tới /login, nút mực không có ↗ (như artboard).
// nextPath (đường dẫn trong site, ví dụ "/history"): đăng nhập xong LoginView đưa khách về đúng trang (postLoginTarget / safeNext, lib/session.ts).
export default function GuestState({ nextPath }: { nextPath?: string }) {
  return (
    <div className={styles.guest}>
      <img src="/doodles/bean.svg" alt="" aria-hidden="true" width={70} height={50} className={styles.bean} />
      <h2 className={`display ${styles.title}`}>Bạn chưa đăng nhập.</h2>
      <p className={styles.hint}>Đăng nhập để xem điểm tích lũy và lịch sử đơn.</p>
      <Link href={nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : '/login'} className={styles.cta}>
        Đăng nhập
      </Link>
    </div>
  );
}

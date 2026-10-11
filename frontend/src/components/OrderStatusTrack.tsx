import { statusTrack, type TrackStep } from '@/lib/order-status';
import styles from './OrderStatusTrack.module.css';

// FEATURE: Thanh tiến trình trạng thái đơn (sơ đồ §9.1): Chờ thanh toán → Đã thanh toán → Đang pha → Sẵn sàng → Hoàn tất.
// Nét mực (ui-visual-plan.md §6 mục 7, artboard DoneDoodle): chấm bước đã qua nền mực và nhãn có "✓ ", bước hiện tại chấm cam
// và nhãn đậm (aria-current="step"), bước sau chấm trắng; nét nối liền tới bước hiện tại, đứt sau đó.
// PAYMENT_FAILED (đỏ) và CANCELLED (xám) hiện nhãn riêng thay thanh tiến trình.
// Không đặt aria-live ở đây: /history có nhiều thanh cùng poll. Biên lai (PaymentSuccess) bọc thanh trong MỘT vùng aria-live="polite".

const STEP_CLASS: Record<TrackStep['state'], string> = {
  done: styles.done,
  current: styles.current,
  todo: styles.todo,
};

// Màu chữ của nhãn riêng lấy từ token; mã màu cũ (#b91c1c, #6b7280) giữ làm fallback của var() vì
// OrderStatusTrack.test.ts (giữ nguyên, không sửa) kiểm "nhãn đỏ / nhãn xám" bằng đúng hai chuỗi này.
const BADGE = {
  failed: { className: styles.failed, color: 'var(--danger-ink, #b91c1c)' },
  cancelled: { className: styles.neutral, color: 'var(--muted, #6b7280)' },
  unknown: { className: styles.neutral, color: 'var(--muted, #6b7280)' },
};

// compact: cỡ nhỏ cho thẻ đơn ở /history (§6 mục 10, artboard HistoryDoodle): cùng markup, chỉ thêm lớp trên <ol>.
export default function OrderStatusTrack({ status, compact = false }: { status: string; compact?: boolean }) {
  const track = statusTrack(status);

  if (track.kind !== 'steps') {
    const badge = BADGE[track.kind];
    return (
      <p className={`${styles.badge} ${badge.className}`} style={{ color: badge.color }} data-status={status}>
        {track.label}
      </p>
    );
  }

  return (
    <ol className={compact ? `${styles.track} ${styles.compact}` : styles.track} aria-label="Tiến trình đơn hàng" data-status={status}>
      {track.steps.map((step) => (
        <li key={step.status} className={`${styles.step} ${STEP_CLASS[step.state]}`}>
          <span className={styles.dot} aria-hidden="true" />
          <span className={styles.label} aria-current={step.state === 'current' ? 'step' : undefined}>
            {step.state === 'done' ? '✓ ' : ''}
            {step.label}
          </span>
        </li>
      ))}
    </ol>
  );
}

import type { CSSProperties } from 'react';
import { statusTrack } from '@/lib/order-status';

// FEATURE: Thanh tiến trình trạng thái đơn (sơ đồ §9.1): Chờ thanh toán → Đã thanh toán → Đang pha → Sẵn sàng → Hoàn tất.
// Bước đã qua tô xanh, bước hiện tại tô đậm; PAYMENT_FAILED (đỏ) và CANCELLED (xám) hiện nhãn riêng thay thanh tiến trình.
export default function OrderStatusTrack({ status }: { status: string }) {
  const track = statusTrack(status);

  if (track.kind !== 'steps') {
    const color = track.kind === 'failed' ? '#b91c1c' : '#6b7280';
    return (
      <p style={{ ...styles.badge, color, borderColor: color }} data-status={status}>
        {track.label}
      </p>
    );
  }

  return (
    <ol style={styles.track} aria-label="Tiến trình đơn hàng" data-status={status}>
      {track.steps.map((step) => (
        <li
          key={step.status}
          aria-current={step.state === 'current' ? 'step' : undefined}
          style={{
            ...styles.step,
            ...(step.state === 'done' ? styles.done : {}),
            ...(step.state === 'current' ? styles.current : {}),
          }}
        >
          {step.state === 'done' ? '✓ ' : ''}
          {step.label}
        </li>
      ))}
    </ol>
  );
}

const styles: Record<string, CSSProperties> = {
  track: { display: 'flex', flexWrap: 'wrap', gap: 6, listStyle: 'none', padding: 0, margin: '8px 0' },
  step: {
    fontSize: 12,
    padding: '3px 8px',
    borderRadius: 999,
    border: '1px solid #d1d5db',
    color: '#6b7280',
    background: '#fff',
  },
  done: { color: '#065f46', borderColor: '#065f46', background: '#ecfdf5' },
  current: { color: '#fff', borderColor: '#065f46', background: '#065f46', fontWeight: 800 },
  badge: { display: 'inline-block', margin: '8px 0', fontSize: 13, fontWeight: 700, padding: '3px 10px', border: '1px solid', borderRadius: 999 },
};

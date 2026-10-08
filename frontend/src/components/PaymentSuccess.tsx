'use client';

import type { CSSProperties } from 'react';
import { formatVND } from '@/lib/pricing';
import { PAYMENT_METHODS, type PaymentResult } from '@/lib/payment';
import OrderStatusTrack from './OrderStatusTrack';

// FEATURE: Payment success (wireframe màn 5) — mã đơn PAID + nút về trang chủ.
export default function PaymentSuccess({
  result,
  onHome,
}: {
  result: PaymentResult;
  onHome: () => void;
}) {
  const methodLabel = PAYMENT_METHODS.find((m) => m.value === result.method)?.label ?? result.method;

  return (
    <section style={styles.wrap}>
      <div style={styles.check}>✓</div>
      <h1>Đặt hàng thành công</h1>
      <div style={styles.card}>
        <p>
          Mã đơn: <strong>{result.orderCode}</strong>
        </p>
        <p style={{ marginBottom: 0 }}>Trạng thái:</p>
        <OrderStatusTrack status={result.status} />
        <p>
          Đã trả: <strong>{formatVND(result.amount)}</strong> ({methodLabel})
        </p>
      </div>
      <p style={styles.note}>Mời tới quầy lấy nước</p>
      <button onClick={onHome} style={styles.homeBtn}>
        Về trang chủ
      </button>
    </section>
  );
}

const styles: Record<string, CSSProperties> = {
  wrap: { textAlign: 'center', padding: '32px 16px' },
  check: { fontSize: 48, color: '#065f46', fontWeight: 800 },
  card: {
    display: 'inline-block',
    textAlign: 'left',
    border: '1px solid #e5e7eb',
    borderRadius: 12,
    padding: '16px 24px',
    background: '#fff',
    marginTop: 8,
  },
  note: { color: '#6b7280' },
  homeBtn: {
    background: '#065f46',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '12px 24px',
    fontSize: 16,
    fontWeight: 800,
    cursor: 'pointer',
  },
};

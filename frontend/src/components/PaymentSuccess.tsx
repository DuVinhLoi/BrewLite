'use client';

import type { CSSProperties } from 'react';
import { formatVND } from '@/lib/pricing';
import { PAYMENT_METHODS, type PaymentResult } from '@/lib/payment';
import type { OrderDetail } from '@/lib/types';
import { useOrderPoll } from '@/lib/use-order-poll';
import OrderStatusTrack from './OrderStatusTrack';

/** Trạng thái biên lai hiện: của đơn vừa poll được; chưa có phản hồi đầu tiên (hoặc không poll: cổng mock) thì của kết quả thanh toán. */
export function receiptStatus(result: PaymentResult, polled: OrderDetail | undefined): string {
  return polled?.status ?? result.status;
}

// FEATURE: Payment success (wireframe màn 5) — mã đơn + trạng thái đơn tự cập nhật (poll GET /orders/:id mỗi 3 giây
// đến COMPLETED / CANCELLED) + nút về trang chủ. Khi poll lỗi thì giữ trạng thái cuối đã biết.
export default function PaymentSuccess({
  result,
  onHome,
}: {
  result: PaymentResult;
  onHome: () => void;
}) {
  const { order } = useOrderPoll(result.orderId);
  return <PaymentReceipt result={result} status={receiptStatus(result, order)} onHome={onHome} />;
}

// Phần hiển thị thuần (render HTML test được, không cần effect).
export function PaymentReceipt({
  result,
  status,
  onHome,
}: {
  result: PaymentResult;
  status: string;
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
        {/* MỘT vùng live cho cả biên lai: trình đọc màn hình báo khi bước trạng thái đổi sau mỗi lần poll */}
        <div aria-live="polite">
          <OrderStatusTrack status={status} />
        </div>
        <p>
          Đã trả: <strong>{formatVND(result.amount)}</strong> ({methodLabel})
        </p>
        {result.discount > 0 && (
          <p>
            Đã giảm: <strong>{formatVND(result.discount)}</strong>
          </p>
        )}
        {result.loyaltyPointsEarned > 0 && (
          <p>
            <strong>+{result.loyaltyPointsEarned.toLocaleString('vi-VN')} điểm</strong>
          </p>
        )}
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

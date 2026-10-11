'use client';

import { formatVND } from '@/lib/pricing';
import { PAYMENT_METHODS, type PaymentResult } from '@/lib/payment';
import type { OrderDetail } from '@/lib/types';
import { useOrderPoll } from '@/lib/use-order-poll';
import OrderStatusTrack from './OrderStatusTrack';
import Button from './ui/Button';
import styles from './PaymentSuccess.module.css';

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
// Giao diện nét mực: ui-visual-plan.md §6 mục 7, artboard DoneDoodle.
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
    <section className={styles.receipt} aria-labelledby="done-title">
      {/* Cốc và 3 sao bật lên một lần (chỉ khi không giảm chuyển động) */}
      <div className={styles.hero}>
        <img src="/doodles/mug.svg" alt="" aria-hidden="true" width={170} height={160} className={styles.mug} />
        <img src="/doodles/sparkle.svg" alt="" aria-hidden="true" width={34} height={34} className={`${styles.spark} ${styles.pop1}`} />
        <img src="/doodles/burst.svg" alt="" aria-hidden="true" width={36} height={36} className={`${styles.spark} ${styles.pop2}`} />
        <img src="/doodles/sparkle.svg" alt="" aria-hidden="true" width={24} height={24} className={`${styles.spark} ${styles.pop3}`} />
      </div>
      <h1 id="done-title" className={`display ${styles.title}`}>
        Đặt hàng thành công
      </h1>

      <div className={styles.card}>
        <div className={styles.head}>
          <p className={styles.code}>
            Mã đơn: <strong className={`display ${styles.codeValue}`}>{result.orderCode}</strong>
          </p>
          {result.loyaltyPointsEarned > 0 && (
            <span className={styles.points}>+{result.loyaltyPointsEarned.toLocaleString('vi-VN')} điểm tích lũy</span>
          )}
        </div>
        <div className={styles.status}>
          <p className={styles.statusLabel}>Trạng thái:</p>
          {/* MỘT vùng live cho cả biên lai: trình đọc màn hình báo khi bước trạng thái đổi sau mỗi lần poll */}
          <div aria-live="polite">
            <OrderStatusTrack status={status} />
          </div>
        </div>
        <p className={styles.line}>
          Đã trả: <strong className={styles.amount}>{formatVND(result.amount)}</strong> ({methodLabel})
        </p>
        {result.discount > 0 && (
          <p className={styles.line}>
            Đã giảm: <strong className={styles.amount}>{formatVND(result.discount)}</strong>
          </p>
        )}
        <p className={`display ${styles.band}`}>Mời tới quầy lấy nước</p>
      </div>

      <Button variant="ghost" onClick={onHome} className={styles.home}>
        Về trang chủ
      </Button>
    </section>
  );
}

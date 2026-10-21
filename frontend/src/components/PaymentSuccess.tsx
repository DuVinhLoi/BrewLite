'use client';

import { formatVND } from '@/lib/pricing';
import { PAYMENT_METHODS, type PaymentResult } from '@/lib/payment';
import Badge from './ui/Badge';
import Button from './ui/Button';
import styles from './PaymentSuccess.module.css';

// FEATURE: Payment receipt — existing order code, PAID status, amount, and home action.
export default function PaymentSuccess({
  result,
  onHome,
}: {
  result: PaymentResult;
  onHome: () => void;
}) {
  const methodLabel = PAYMENT_METHODS.find((m) => m.value === result.method)?.label ?? result.method;

  return (
    <section className={styles.receipt} aria-labelledby="done-title">
      <div className={styles.hero}>
        <img src="/doodles/mug.svg" alt="" aria-hidden="true" width={170} height={160} className={styles.mug} />
        <img src="/doodles/sparkle.svg" alt="" aria-hidden="true" width={34} height={34} className={`${styles.spark} ${styles.pop1}`} />
        <img src="/doodles/burst.svg" alt="" aria-hidden="true" width={36} height={36} className={`${styles.spark} ${styles.pop2}`} />
        <img src="/doodles/sparkle.svg" alt="" aria-hidden="true" width={24} height={24} className={`${styles.spark} ${styles.pop3}`} />
      </div>
      <h1 id="done-title" className={`display ${styles.title}`}>Đặt hàng thành công</h1>
      <div className={styles.card}>
        <div className={styles.head}>
          <p className={styles.code}>
            Mã đơn: <strong className={`display ${styles.codeValue}`}>{result.orderCode}</strong>
          </p>
          <Badge tone="ok">{result.status}</Badge>
        </div>
        <p className={styles.line}>
          Trạng thái: <strong>{result.status}</strong>
        </p>
        <p className={styles.line}>
          Đã trả: <strong className={styles.amount}>{formatVND(result.amount)}</strong> ({methodLabel})
        </p>
        <p className={`display ${styles.band}`}>Mời tới quầy lấy nước</p>
      </div>
      <Button variant="ghost" onClick={onHome} className={styles.home}>Về trang chủ</Button>
    </section>
  );
}

'use client';

import { useState } from 'react';
import { formatVND } from '@/lib/pricing';
import { useCart } from '@/store/cart';
import {
  PAYMENT_METHODS,
  getPaymentGateway,
  newIdempotencyKey,
  type PaymentMethod,
  type PaymentResult,
} from '@/lib/payment';
import Button from './ui/Button';
import styles from './PaymentForm.module.css';

// FEATURE: Payment presentation uses the existing PaymentGateway contract.
export default function PaymentForm({
  total,
  onSuccess,
  onBack,
}: {
  total: number;
  onSuccess: (result: PaymentResult) => void;
  onBack: () => void;
}) {
  const items = useCart((s) => s.items);
  const [method, setMethod] = useState<PaymentMethod>('WALLET');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (processing) return;
    setProcessing(true);
    setError(null);
    try {
      const result = await getPaymentGateway().pay({
        amount: total,
        method,
        idempotencyKey: newIdempotencyKey(),
      });
      onSuccess(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Thanh toán thất bại, vui lòng thử lại.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <section className={styles.page} aria-labelledby="pay-title">
      <h1 id="pay-title" className={`display ${styles.title}`}>Thanh toán</h1>
      <div className={styles.grid}>
        <div className={styles.card} aria-busy={processing}>
          <div className={styles.final}>
            <span className={styles.finalLabel}>Tổng thanh toán</span>
            <strong className={`display ${styles.finalValue}`}>{formatVND(total)}</strong>
          </div>
          <fieldset className={styles.methods}>
            <legend className={styles.legend}>Phương thức</legend>
            {PAYMENT_METHODS.map((m) => (
              <label key={m.value} className={method === m.value ? `${styles.method} ${styles.methodOn}` : styles.method}>
                <input
                  type="radio"
                  name="payment-method"
                  value={m.value}
                  checked={method === m.value}
                  onChange={() => setMethod(m.value)}
                  disabled={processing}
                  className={styles.radio}
                />
                <span>{m.label}</span>
              </label>
            ))}
            <p className={styles.note}>Không dùng tiền mặt</p>
          </fieldset>
          {error && <p role="alert" className={styles.error}>{error}</p>}
          <div className={styles.actions}>
            <Button variant="ghost" onClick={onBack} disabled={processing} className={styles.back}>
              ← Quay lại giỏ
            </Button>
            <Button variant="cta" onClick={handleConfirm} disabled={processing} className={styles.confirm}>
              {processing ? 'Đang xử lý…' : `Xác nhận trả • ${formatVND(total)}`}
            </Button>
          </div>
        </div>
        <aside className={styles.summary} aria-labelledby="pay-order-title">
          <img src="/doodles/leaf.svg" alt="" aria-hidden="true" width={170} height={94} className={styles.leaf} />
          <img src="/doodles/sparkle.svg" alt="" aria-hidden="true" width={28} height={28} className={styles.sparkle} />
          <img src="/doodles/moka.svg" alt="" aria-hidden="true" width={150} height={200} className={styles.moka} />
          <h2 id="pay-order-title" className={`display ${styles.summaryTitle}`}>Đơn của bạn</h2>
          <ul className={styles.lines}>
            {items.map((item) => (
              <li key={item.key} className={styles.line}>
                <span className={styles.thumb}>
                  {item.imageUrl ? <img src={item.imageUrl} alt="" aria-hidden="true" width={56} height={56} className={styles.thumbImg} /> : null}
                </span>
                <span className={styles.lineName}>
                  {item.quantity}× {item.name}{' '}
                  <span className={styles.lineOpts}>({[item.size, ...item.toppings].join(' + ')})</span>
                </span>
                <span className={styles.lineTotal}>{formatVND(item.lineTotal)}</span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </section>
  );
}

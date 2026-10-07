'use client';

import { useState } from 'react';
import type { CSSProperties } from 'react';
import { formatVND } from '@/lib/pricing';
import {
  PAYMENT_METHODS,
  getPaymentGateway,
  newIdempotencyKey,
  type PaymentMethod,
  type PaymentResult,
} from '@/lib/payment';

// ============================================================
// FEATURE: Payment form (wireframe màn 4) — chỉ gọi PaymentGateway,
// đổi mock <-> backend thật không sửa file này. Lỗi -> ở lại màn này, giữ giỏ (US-05).
// ============================================================
export default function PaymentForm({
  total,
  onSuccess,
  onBack,
}: {
  total: number;
  onSuccess: (result: PaymentResult) => void;
  onBack: () => void;
}) {
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
    <section>
      <h1>Thanh toán</h1>
      <div style={styles.card}>
        <p style={styles.total}>
          Tổng: <strong>{formatVND(total)}</strong>
        </p>
        <p style={styles.label}>Phương thức</p>
        {PAYMENT_METHODS.map((m) => (
          <label key={m.value} style={styles.radio}>
            <input
              type="radio"
              name="payment-method"
              checked={method === m.value}
              onChange={() => setMethod(m.value)}
              disabled={processing}
            />
            {method === m.value ? '(o)' : '( )'} {m.label}
          </label>
        ))}
        <p style={styles.note}>Không dùng tiền mặt</p>
        {error && (
          <p role="alert" style={styles.error}>
            {error}
          </p>
        )}
        <div style={styles.actions}>
          <button onClick={onBack} disabled={processing} style={styles.backBtn}>
            ← Quay lại giỏ
          </button>
          <button onClick={handleConfirm} disabled={processing} style={styles.payBtn}>
            {processing ? 'Đang xử lý…' : `Xác nhận trả • ${formatVND(total)}`}
          </button>
        </div>
      </div>
    </section>
  );
}

const styles: Record<string, CSSProperties> = {
  card: { border: '1px solid #e5e7eb', borderRadius: 12, padding: 20, background: '#fff' },
  total: { fontSize: 18, margin: '0 0 12px' },
  label: { fontWeight: 800, margin: '12px 0 8px' },
  radio: { display: 'flex', gap: 8, alignItems: 'center', padding: '8px 0', cursor: 'pointer' },
  note: { fontSize: 13, color: '#6b7280' },
  error: {
    fontSize: 14,
    color: '#b91c1c',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    padding: '8px 12px',
    borderRadius: 8,
  },
  actions: { display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' },
  backBtn: {
    background: 'transparent',
    border: '1px solid #d1d5db',
    borderRadius: 8,
    padding: '12px 16px',
    cursor: 'pointer',
    fontWeight: 700,
  },
  payBtn: {
    flex: 1,
    background: '#065f46',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    fontWeight: 800,
    cursor: 'pointer',
  },
};

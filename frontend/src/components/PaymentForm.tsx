'use client';

import { useState } from 'react';
import { formatVND } from '@/lib/pricing';
import { VOUCHER_CODE, VOUCHER_RATE } from '@/lib/promo';
import { PAYMENT_METHODS, PaymentError, getPaymentGateway } from '@/lib/payment';
import type { PaymentMethod, PaymentResult } from '@/lib/payment';
import { clearCheckout, dropsCheckout, isUnauthorizedPayment, loadCheckout, rememberOrder } from '@/lib/payment/checkout-session';
import { handleUnauthorized } from '@/lib/session';
import type { CartItem } from '@/lib/types';
import Button from './ui/Button';
import styles from './PaymentForm.module.css';

// ============================================================
// FEATURE: Payment form (wireframe màn 4) — chỉ gọi PaymentGateway,
// đổi mock <-> backend thật không sửa file này. Lỗi -> ở lại màn này, giữ giỏ (US-05).
// Giao diện nét mực: ui-visual-plan.md §6 mục 6, artboard PayDoodle (phần vẽ ở PaymentFormView).
// ============================================================
export default function PaymentForm({
  total,
  items,
  onSuccess,
  onBack,
}: {
  total: number;
  /** Dòng giỏ (store): gửi POST /orders (cổng API chỉ lấy productId, quantity, size, toppings) và vẽ khối "Đơn của bạn". */
  items: CartItem[];
  onSuccess: (result: PaymentResult) => void;
  onBack: () => void;
}) {
  const [method, setMethod] = useState<PaymentMethod>('WALLET');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [voucher, setVoucher] = useState('');
  const [applied, setApplied] = useState<string | null>(null);
  // Phiên thanh toán của tab (lib/payment/checkout-session.ts): mã đơn + key tạo đơn + key trả tiền, gắn với nội dung giỏ.
  // Reload, hoặc quay lại giỏ rồi vào lại mà giỏ không đổi, vẫn trả tiếp đúng đơn đó với cùng key (US-08, phương án A).
  const [checkout, setCheckout] = useState(() => loadCheckout(items));
  const [orderId, setOrderId] = useState<string | undefined>(checkout.orderId);

  const discount = applied === VOUCHER_CODE ? Math.floor(total * VOUCHER_RATE) : 0;
  const final = total - discount;

  const handleConfirm = async () => {
    if (processing) return;
    setProcessing(true);
    setError(null);
    try {
      const result = await getPaymentGateway().pay({
        amount: final,
        method,
        idempotencyKey: checkout.payKey,
        ...(orderId ? { orderId } : { items, orderIdempotencyKey: checkout.orderKey }),
        ...(applied ? { voucherCode: applied } : {}),
      });
      clearCheckout();
      onSuccess(result);
    } catch (e) {
      if (dropsCheckout(e)) {
        // đơn đang giữ không trả tiếp được (đã hủy, đang pha, của tài khoản khác…): lần bấm sau tạo đơn mới
        clearCheckout();
        setCheckout(loadCheckout(items));
        setOrderId(undefined);
      } else if (e instanceof PaymentError && e.orderId) {
        rememberOrder(e.orderId);
        setOrderId(e.orderId);
      }
      // hết phiên (401): xóa token, về /login?next=…; handleUnauthorized không đụng tới giỏ và phiên thanh toán của tab,
      // và đăng nhập lại cùng tài khoản cũng giữ phiên đó (login chỉ bỏ khi là tài khoản khác: clearCheckoutIfOtherUser)
      if (isUnauthorizedPayment(e)) handleUnauthorized();
      setError(e instanceof Error ? e.message : 'Thanh toán thất bại, vui lòng thử lại.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <PaymentFormView
      total={total}
      discount={discount}
      final={final}
      items={items}
      voucher={voucher}
      onVoucherChange={setVoucher}
      applied={applied}
      onApply={() => setApplied(voucher.trim().toUpperCase() || null)}
      method={method}
      onMethodChange={setMethod}
      processing={processing}
      error={error}
      onBack={onBack}
      onConfirm={handleConfirm}
    />
  );
}

interface ViewProps {
  total: number;
  discount: number;
  /** Thực trả = total - discount (PaymentForm tính). */
  final: number;
  items: CartItem[];
  voucher: string;
  onVoucherChange: (value: string) => void;
  /** Mã đã bấm "Áp dụng" (đã viết hoa), null khi chưa áp. */
  applied: string | null;
  onApply: () => void;
  method: PaymentMethod;
  onMethodChange: (method: PaymentMethod) => void;
  /** Đang gửi: mọi nút, ô nhập, radio vô hiệu. */
  processing: boolean;
  /** Câu lỗi của cổng thanh toán (PaymentError.message). */
  error: string | null;
  onBack: () => void;
  onConfirm: () => void;
}

// Phần hiển thị thuần (render HTML test được): form bên trái, khối "Đơn của bạn" chỉ đọc bên phải.
export function PaymentFormView({
  total,
  discount,
  final,
  items,
  voucher,
  onVoucherChange,
  applied,
  onApply,
  method,
  onMethodChange,
  processing,
  error,
  onBack,
  onConfirm,
}: ViewProps) {
  return (
    <section className={styles.page} aria-labelledby="pay-title">
      <h1 id="pay-title" className={`display ${styles.title}`}>
        Thanh toán
      </h1>

      <div className={styles.grid}>
        <div className={styles.card}>
          <p className={styles.total}>
            Tổng: <strong className={styles.totalValue}>{formatVND(total)}</strong>
          </p>

          <div>
            <label htmlFor="pay-voucher" className={styles.fieldLabel}>
              Mã giảm giá
            </label>
            <div className={styles.voucherRow}>
              <input
                id="pay-voucher"
                type="text"
                className={styles.input}
                value={voucher}
                onChange={(e) => onVoucherChange(e.target.value)}
                disabled={processing}
                autoComplete="off"
                aria-describedby="pay-voucher-hint"
              />
              <Button variant="ghost" onClick={onApply} disabled={processing} className={styles.apply}>
                Áp dụng
              </Button>
            </div>
            <span id="pay-voucher-hint" className={styles.hint}>
              Ví dụ: {VOUCHER_CODE}
            </span>
            {/* Vùng live luôn có sẵn để trình đọc màn hình báo kết quả mỗi lần bấm "Áp dụng" */}
            <div role="status">
              {applied &&
                (applied === VOUCHER_CODE ? (
                  <p className={`${styles.result} ${styles.resultOk}`}>
                    Đã áp {applied}: −{formatVND(discount)}
                  </p>
                ) : (
                  <p className={`${styles.result} ${styles.resultBad}`}>Mã {applied} không hợp lệ, tính giá gốc</p>
                ))}
            </div>
          </div>

          <div className={styles.final}>
            <span className={styles.finalLabel}>Thực trả</span>
            <strong className={`display ${styles.finalValue}`}>{formatVND(final)}</strong>
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
                  onChange={() => onMethodChange(m.value)}
                  disabled={processing}
                  className={styles.radio}
                />
                <span>{m.label}</span>
              </label>
            ))}
            <p className={styles.note}>Không dùng tiền mặt</p>
          </fieldset>

          {error && (
            <p role="alert" className={styles.error}>
              {error}
            </p>
          )}

          <div className={styles.actions}>
            <Button variant="ghost" onClick={onBack} disabled={processing} className={styles.back}>
              ← Quay lại giỏ
            </Button>
            <Button variant="cta" onClick={onConfirm} disabled={processing} className={styles.confirm}>
              {processing ? 'Đang xử lý…' : `Xác nhận trả • ${formatVND(final)}`}
            </Button>
          </div>
        </div>

        <aside className={styles.summary} aria-labelledby="pay-order-title">
          <img src="/doodles/leaf.svg" alt="" aria-hidden="true" width={170} height={94} className={styles.leaf} />
          <img src="/doodles/sparkle.svg" alt="" aria-hidden="true" width={28} height={28} className={styles.sparkle} />
          <img src="/doodles/moka.svg" alt="" aria-hidden="true" width={150} height={200} className={styles.moka} />
          <h2 id="pay-order-title" className={`display ${styles.summaryTitle}`}>
            Đơn của bạn
          </h2>
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

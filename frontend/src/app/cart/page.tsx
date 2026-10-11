'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MAX_LINES } from '@/lib/cart-limits';
import { useCart } from '@/store/cart';
import { formatVND } from '@/lib/pricing';
import type { PaymentResult } from '@/lib/payment';
import QtyStepper from '@/components/QtyStepper';
import PaymentForm from '@/components/PaymentForm';
import PaymentSuccess from '@/components/PaymentSuccess';

type Step = 'cart' | 'payment' | 'success';

// ============================================================
// FEATURE: Cart page (Task 5) — giỏ (số lượng >= 1) + thanh toán 3 bước:
// cart -> payment (Ví/Thẻ) -> success (mã đơn PAID, giỏ xóa rỗng).
// ============================================================
export default function CartPage() {
  const items = useCart((s) => s.items);
  const total = useCart((s) => s.total);
  const count = useCart((s) => s.count);
  const updateQty = useCart((s) => s.updateQty);
  const removeItem = useCart((s) => s.removeItem);
  const clear = useCart((s) => s.clear);
  const router = useRouter();

  const [step, setStep] = useState<Step>('cart');
  const [lastOrder, setLastOrder] = useState<PaymentResult | null>(null);

  const handlePaymentSuccess = (result: PaymentResult) => {
    clear(); // thanh toán xong -> giỏ về rỗng
    setLastOrder(result);
    setStep('success');
  };

  if (step === 'success' && lastOrder) {
    return <PaymentSuccess result={lastOrder} onHome={() => router.push('/')} />;
  }

  if (step === 'payment') {
    return <PaymentForm total={total} items={items} onSuccess={handlePaymentSuccess} onBack={() => setStep('cart')} />;
  }

  if (items.length === 0) {
    return (
      <section style={{ textAlign: 'center', padding: '48px 16px' }}>
        <h1>Giỏ hàng trống</h1>
        <p style={{ color: '#6b7280' }}>Hãy chọn vài món ngon từ menu nhé!</p>
        <Link
          href="/"
          style={{
            display: 'inline-block',
            background: '#065f46',
            color: '#fff',
            padding: '10px 18px',
            borderRadius: 8,
            textDecoration: 'none',
            fontWeight: 700,
          }}
        >
          Về Menu
        </Link>
      </section>
    );
  }

  return (
    <section>
      <h1>Giỏ hàng ({count} món)</h1>
      {items.length >= MAX_LINES && (
        <p role="status" style={{ fontSize: 13, color: '#6b7280' }}>
          Giỏ đã đủ {MAX_LINES} dòng.
        </p>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.map((item) => (
          <div
            key={item.key}
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: 12,
              padding: 16,
              background: '#fff',
              display: 'flex',
              justifyContent: 'space-between',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <div>
              <p style={{ margin: 0, fontWeight: 800 }}>{item.name}</p>
              <p style={{ margin: '4px 0', fontSize: 13, color: '#6b7280' }}>
                Size {item.size}
                {item.toppings.length > 0 ? ` • ${item.toppings.join(', ')}` : ' • Không topping'}
              </p>
              <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>{formatVND(item.unitPrice)} / ly</p>
            </div>
            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
              <QtyStepper quantity={item.quantity} onChange={(q) => updateQty(item.key, q)} onRemove={() => removeItem(item.key)} />
              <strong>{formatVND(item.lineTotal)}</strong>
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 16,
          borderTop: '1px dashed #d1d5db',
          paddingTop: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <button
          onClick={clear}
          style={{ background: 'transparent', border: '1px solid #d1d5db', borderRadius: 8, padding: '10px 14px', cursor: 'pointer' }}
        >
          Xóa hết
        </button>
        <p style={{ fontSize: 18, margin: 0 }}>
          Tổng: <strong>{formatVND(total)}</strong>
        </p>
      </div>

      <button
        style={{
          marginTop: 12,
          width: '100%',
          background: '#065f46',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          padding: 14,
          fontSize: 16,
          fontWeight: 800,
          cursor: 'pointer',
        }}
        onClick={() => setStep('payment')}
      >
        Thanh toán • {formatVND(total)}
      </button>
      <p style={{ fontSize: 13, color: '#6b7280' }}>
        Giá cuối cùng do máy chủ tính lại khi tạo đơn (POST /orders), nên tổng tiền luôn khớp với giá hiện hành.
      </p>
    </section>
  );
}

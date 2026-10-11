'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/store/cart';
import type { PaymentResult } from '@/lib/payment';
import CartView from '@/components/cart/CartView';
import PaymentForm from '@/components/PaymentForm';
import PaymentSuccess from '@/components/PaymentSuccess';

type Step = 'cart' | 'payment' | 'success';

// ============================================================
// FEATURE: Cart page (Task 5) — giỏ (số lượng >= 1) + thanh toán 3 bước:
// cart -> payment (Ví/Thẻ) -> success (mã đơn PAID, giỏ xóa rỗng).
// Phần hiển thị bước "cart" (kể cả giỏ trống) nằm ở components/cart/CartView.tsx.
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

  return (
    <CartView
      items={items}
      count={count}
      total={total}
      onQtyChange={updateQty}
      onRemove={removeItem}
      onClear={clear}
      onCheckout={() => setStep('payment')}
    />
  );
}

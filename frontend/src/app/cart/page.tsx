'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/store/cart';
import type { PaymentResult } from '@/lib/payment';
import CartView from '@/components/cart/CartView';
import PaymentForm from '@/components/PaymentForm';
import PaymentSuccess from '@/components/PaymentSuccess';

type Step = 'cart' | 'payment' | 'success';

// FEATURE: Existing cart -> payment -> success flow with develop-agile's presentation.
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
    clear();
    setLastOrder(result);
    setStep('success');
  };

  if (step === 'success' && lastOrder) {
    return <PaymentSuccess result={lastOrder} onHome={() => router.push('/')} />;
  }

  if (step === 'payment') {
    return <PaymentForm total={total} onSuccess={handlePaymentSuccess} onBack={() => setStep('cart')} />;
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

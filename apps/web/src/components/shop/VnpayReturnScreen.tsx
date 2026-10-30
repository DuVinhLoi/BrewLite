'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ApiError } from '@/lib/api';
import { checkoutKey, paidStatuses, pendingPayment, shopApi, verifyingText, vnpayMessage, type Order, type PaymentSync, type VnpayReturn } from '@/lib/shop';
import { useShop } from './ShopProvider';
const POLL_INTERVAL_MS = 2000;
const POLL_LIMIT_MS = 30000;
type View =
  | { kind: 'checking' }
  | { kind: 'verifying' }
  | { kind: 'failed'; orderId: string; code: string }
  | { kind: 'cancelled' | 'unpaid'; orderId: string }
  | { kind: 'missing' }
  | { kind: 'error'; message: string };
export function VnpayReturnScreen() {
  const { ready, session, clear, logout } = useShop(); const router = useRouter();
  const query = useSearchParams().toString();
  const [view, setView] = useState<View>({ kind: 'checking' });
  const [attempt, setAttempt] = useState(0);
  const returnPath = `/payment/vnpay-return?${query}`;
  useEffect(() => {
    if (!ready || !session) return;
    let active = true; let timer: ReturnType<typeof setTimeout> | undefined;
    const token = session.token; const key = checkoutKey(session.email);
    const readOrder = (orderId: string) => shopApi<Order>(`/orders/${encodeURIComponent(orderId)}`, {}, token);
    // The return query is only a hint to find the order; a signed answer gives the IDs, otherwise trust only this browser's checkout session.
    async function locate() {
      try {
        const result = await shopApi<VnpayReturn>(`/payments/vnpay/return?${query}`);
        if (result.valid) return { orderId: result.orderId, code: result.responseCode };
      } catch { /* Fall back to the checkout session. */ }
      try {
        const saved = JSON.parse(sessionStorage.getItem(key) ?? 'null');
        if (typeof saved?.orderId === 'string') return { orderId: saved.orderId, code: '' };
      } catch { /* No saved checkout. */ }
      return null;
    }
    // True when the DB shows a final state for the order; the VNPay code only picks the failure wording.
    function settle(order: Order, code: string): boolean {
      if (paidStatuses.includes(order.status)) {
        try { const saved = JSON.parse(sessionStorage.getItem(key) ?? 'null'); if (saved?.orderId === order.id) { clear(); sessionStorage.removeItem(key); } } catch { /* No saved checkout. */ }
        router.replace(`/orders/${encodeURIComponent(order.id)}`);
      } else if (order.status === 'PAYMENT_FAILED') setView({ kind: 'failed', orderId: order.id, code });
      else if (order.status === 'CANCELLED') setView({ kind: 'cancelled', orderId: order.id });
      else if (!pendingPayment(order)) setView({ kind: 'unpaid', orderId: order.id });
      else return false;
      return true;
    }
    // One sync call (QueryDR on the API side); 409 = still processing, 502 = VNPay unreachable.
    async function syncOnce(order: Order, code: string) {
      const waiting = pendingPayment(order);
      if (!waiting) return;
      try {
        await shopApi<PaymentSync>(`/payments/${encodeURIComponent(waiting.id)}/sync`, { method: 'POST' }, token);
      } catch (err) {
        if (!(err instanceof ApiError) || (err.status !== 409 && err.status !== 502)) throw err;
        if (active) setView({ kind: 'verifying' });
        return;
      }
      const latest = await readOrder(order.id);
      if (active && !settle(latest, code)) setView({ kind: 'verifying' });
    }
    async function check() {
      const target = await locate();
      if (!active) return;
      if (!target) { setView({ kind: 'missing' }); return; }
      // The first visit waits for the IPN by polling; "Kiểm tra lại" skips the wait.
      const limit = attempt === 0 ? POLL_LIMIT_MS : 0; const started = Date.now();
      while (active) {
        const order = await readOrder(target.orderId);
        if (!active || settle(order, target.code)) return;
        if (Date.now() - started >= limit) { await syncOnce(order, target.code); return; }
        await new Promise<void>((resolve) => { timer = setTimeout(resolve, POLL_INTERVAL_MS); });
      }
    }
    check().catch((err) => {
      if (!active) return;
      if (err instanceof ApiError && err.status === 401) { logout(); router.push(`/login?next=${encodeURIComponent(returnPath)}&expired=1`); }
      else setView({ kind: 'error', message: (err as Error).message });
    });
    return () => { active = false; clearTimeout(timer); };
  }, [ready, session, query, returnPath, attempt, router, clear, logout]);
  function recheck() { setView({ kind: 'checking' }); setAttempt((value) => value + 1); }
  if (!ready) return <main className="shop-page" role="status">Đang tải…</main>;
  if (!session) return <main className="shop-page"><Link href={`/login?next=${encodeURIComponent(returnPath)}`}>Đăng nhập để xem kết quả thanh toán</Link></main>;
  return <main className="shop-page"><h1>Kết quả thanh toán VNPay</h1>
    {(view.kind === 'checking' || view.kind === 'verifying') && <p role="status">{verifyingText}</p>}
    {view.kind === 'verifying' && <button onClick={recheck}>Kiểm tra lại</button>}
    {view.kind === 'failed' && <><p role="alert">{vnpayMessage(view.code)}. Đơn của bạn vẫn được giữ, bạn có thể thử lại hoặc chọn phương thức khác.</p><Link className="shop-button" href={`/checkout?order=${encodeURIComponent(view.orderId)}`}>Thử lại</Link><Link href={`/orders/${encodeURIComponent(view.orderId)}`}>Xem hoặc hủy đơn</Link></>}
    {view.kind === 'cancelled' && <><p role="status">Đơn đã bị hủy.</p><Link href="/">Quay lại menu</Link></>}
    {view.kind === 'unpaid' && <><p role="status">Đơn chưa có giao dịch thanh toán nào đang chờ.</p><Link href={`/checkout?order=${encodeURIComponent(view.orderId)}`}>Quay lại thanh toán</Link></>}
    {view.kind === 'missing' && <><p role="alert">Không xác định được đơn hàng của giao dịch này. Hãy kiểm tra lịch sử đơn hàng.</p><Link href="/orders">Lịch sử đơn hàng</Link></>}
    {view.kind === 'error' && <div role="alert"><p>{view.message}</p><button onClick={recheck}>Thử lại</button></div>}
  </main>;
}

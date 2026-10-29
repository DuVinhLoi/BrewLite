'use client';
import Link from 'next/link';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError } from '@/lib/api';
import { shopApi, cartTotal, type CartLine, type Order } from '@/lib/shop';
import { formatVnd } from '@/lib/format';
import { useShop } from './ShopProvider';
function lineSummary(line: CartLine) { return `${line.quantity} × ${line.name} · Size ${line.size} · ${line.toppings.join(', ') || 'Không topping'}`; }
export function CheckoutScreen() {
  const shop = useShop(); const { ready, session, clear, logout } = shop; const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [method, setMethod] = useState('WALLET'); const [card, setCard] = useState(''); const [cardError, setCardError] = useState('');
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const [inventoryConflict, setInventoryConflict] = useState(false);
  const [loaded, setLoaded] = useState(false); const [blocked, setBlocked] = useState(false);
  const [unknownCreate, setUnknownCreate] = useState(false); const [attempt, setAttempt] = useState(0);
  const inFlight = useRef(false); const paymentKey = useRef('');
  const storageKey = `brewlite-checkout:${session?.email ?? ''}`;
  useEffect(() => {
    if (!ready || !session) return;
    let active = true;
    Promise.resolve().then(async () => {
      setLoaded(false); setBlocked(false); setError('');
      try {
        const saved = JSON.parse(sessionStorage.getItem(storageKey) ?? 'null');
        const requested = new URLSearchParams(window.location.search).get('order');
        if (saved?.phase === 'creating' && !requested) {
          setUnknownCreate(true); setBlocked(true); setError('Chưa xác định được kết quả tạo đơn. Hãy kiểm tra lịch sử trước khi tạo đơn khác.');
        } else {
          const id = requested ?? saved?.orderId;
          paymentKey.current = id === saved?.orderId && typeof saved?.key === 'string' ? saved.key : crypto.randomUUID();
          if (id) {
            const existing = await shopApi<Order>(`/orders/${encodeURIComponent(id)}`, {}, session!.token);
            if (!active) return;
            if (['PAID', 'PREPARING', 'READY', 'COMPLETED'].includes(existing.status)) {
              if (saved?.orderId === existing.id) { clear(); sessionStorage.removeItem(storageKey); }
              router.replace(`/orders/${encodeURIComponent(existing.id)}`); return;
            }
            if (existing.status === 'CANCELLED') sessionStorage.removeItem(storageKey);
            setUnknownCreate(false); setOrder(existing);
            if (existing.status !== 'CANCELLED') sessionStorage.setItem(storageKey, JSON.stringify({ orderId: existing.id, key: paymentKey.current }));
          }
        }
      } catch (err) {
        if (!active) return;
        setBlocked(true); setError((err as Error).message);
        if (err instanceof ApiError && err.status === 401) { logout(); router.push('/login?next=/checkout&expired=1'); }
      }
      if (active) setLoaded(true);
    });
    return () => { active = false; };
  }, [ready, session, storageKey, attempt, router, clear, logout]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session || inFlight.current || blocked || inventoryConflict) return;
    if (method === 'CARD' && !/^\d{16}$/.test(card)) { setCardError('Số thẻ demo phải gồm 16 chữ số'); return; }
    setCardError('');
    inFlight.current = true; setBusy(true); setError('');
    let creating = false;
    try {
      let pending = order;
      if (!pending) {
        // Keep an uncertainty marker before sending: a lost response must never create another reservation automatically.
        sessionStorage.setItem(storageKey, JSON.stringify({ phase: 'creating' })); creating = true;
        pending = await shopApi<Order>('/orders', { method: 'POST', body: JSON.stringify({ items: shop.cart.map(({ productId, size, toppings, quantity }) => ({ productId, size, toppings, quantity })) }) }, session.token);
        creating = false; setOrder(pending);
      }
      if (!paymentKey.current) paymentKey.current = crypto.randomUUID();
      sessionStorage.setItem(storageKey, JSON.stringify({ orderId: pending.id, key: paymentKey.current }));
      await shopApi('/payments', { method: 'POST', headers: { 'Idempotency-Key': paymentKey.current }, body: JSON.stringify({ orderId: pending.id, paymentMethod: method, ...(method === 'CARD' ? { cardNumber: card } : {}) }) }, session.token);
      clear(); sessionStorage.removeItem(storageKey); router.push(`/orders/${encodeURIComponent(pending.id)}`);
    } catch (err) {
      const uncertain = creating && (!(err instanceof ApiError) || err.status >= 500);
      if (uncertain) {
        setUnknownCreate(true); setBlocked(true); setError('Chưa xác định được kết quả tạo đơn. Hãy kiểm tra lịch sử trước khi tạo đơn khác.');
      } else {
        if (creating) sessionStorage.removeItem(storageKey);
        if (err instanceof ApiError && err.status === 401) { logout(); router.push('/login?next=/checkout&expired=1'); }
        else if (err instanceof ApiError && err.status === 402) setError('Thanh toán không thành công. Đơn của bạn vẫn được giữ, bạn có thể thử lại hoặc chọn phương thức khác.');
        else if (creating && err instanceof ApiError && err.status === 409) { setInventoryConflict(true); setError(`${err.message}. Nguyên liệu đã thay đổi. Vui lòng sửa giỏ hàng rồi kiểm tra lại.`); }
        else setError((err as Error).message);
      }
    } finally { inFlight.current = false; setBusy(false); }
  }
  function startAgain() {
    sessionStorage.removeItem(storageKey); setOrder(null); setUnknownCreate(false); setBlocked(false); setError(''); paymentKey.current = crypto.randomUUID(); router.replace('/checkout');
  }
  if (!ready) return <main className="shop-page" role="status">Đang tải…</main>;
  if (!session) return <main className="shop-page"><Link href="/login?next=/checkout">Đăng nhập để đặt đơn</Link></main>;
  if (session.role !== 'CUSTOMER') return <main className="shop-page"><p role="alert">Chỉ khách hàng được đặt và thanh toán đơn.</p></main>;
  if (!loaded) return <main className="shop-page" role="status">Đang tải phiên thanh toán…</main>;
  const payable = !order || ['PENDING', 'PAYMENT_FAILED'].includes(order.status);
  return <main className="shop-page"><h1>Thanh toán mô phỏng</h1><p>Chỉ dùng số thẻ demo. Không nhập thông tin thẻ thật.</p>{order && <p>Mã đơn: {order.id}</p>}<h2>Tóm tắt đơn</h2><ul>{order ? order.items.map((item) => <li key={item.id}>{lineSummary(item)}</li>) : shop.cart.map((line) => <li key={line.key}>{lineSummary(line)}</li>)}</ul><p className="shop-total">Tổng tiền: {formatVnd(order?.total ?? cartTotal(shop.cart))}</p><form onSubmit={submit}><label>Phương thức<select aria-label="Phương thức" value={method} disabled={busy} onChange={(event) => { setMethod(event.target.value); setCardError(''); }}><option value="WALLET">Ví điện tử</option><option value="CARD">Thẻ</option></select></label>{method === 'CARD' && <><label>Số thẻ demo<input inputMode="numeric" autoComplete="off" maxLength={16} value={card} disabled={busy} aria-invalid={cardError !== ''} aria-describedby={cardError ? 'card-error' : undefined} onChange={(event) => { setCard(event.target.value); setCardError(''); }} /></label>{cardError && <p id="card-error">{cardError}</p>}</>}{error && <p role="alert">{error}</p>}<button disabled={busy || blocked || inventoryConflict || !payable || (!order && !shop.cart.length)}>{busy ? 'Đang xử lý…' : order ? 'Thử lại thanh toán' : 'Xác nhận trả'}</button></form>{inventoryConflict && <Link className="shop-button" href="/cart">Sửa giỏ hàng</Link>}{blocked && !unknownCreate && <button onClick={() => setAttempt((value) => value + 1)}>Thử tải lại đơn</button>}{unknownCreate && <><Link href="/orders">Kiểm tra lịch sử đơn hàng</Link><button onClick={startAgain}>Đã kiểm tra lịch sử, bắt đầu đơn mới</button></>}{order?.status === "CANCELLED" && <button onClick={startAgain}>Bắt đầu đơn mới</button>}{order && <Link href={`/orders/${order.id}`}>Xem hoặc hủy đơn hiện tại</Link>}<Link href="/cart">Quay lại giỏ hàng</Link></main>;
}

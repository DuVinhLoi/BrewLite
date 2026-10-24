'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError } from '@/lib/api';
import { shopApi, cartTotal, type Order } from '@/lib/shop';
import { formatVnd } from '@/lib/format';
import { useShop } from './ShopProvider';

export function CheckoutScreen() {
  const shop = useShop();
  const { ready, session, cart, clear, logout } = shop;
  const router = useRouter();

  const [order, setOrder] = useState<Order | null>(null);
  const [method, setMethod] = useState<'WALLET' | 'CARD'>('WALLET');
  const [card, setCard] = useState('');
  const [cardError, setCardError] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [unknownCreate, setUnknownCreate] = useState(false);

  const inFlight = useRef(false);
  const paymentKey = useRef('');
  const storageKey = `brewlite-checkout:${session?.email ?? ''}`;

  useEffect(() => {
    if (!ready || !session) return;

    let active = true;

    Promise.resolve().then(async () => {
      setLoaded(false);
      setBlocked(false);
      setError('');

      try {
        const saved = JSON.parse(sessionStorage.getItem(storageKey) ?? 'null');
        const requested = new URLSearchParams(window.location.search).get('order');

        if (saved?.phase === 'creating' && !requested) {
          setUnknownCreate(true);
          setBlocked(true);
          setError('Chưa xác định được kết quả tạo đơn. Hãy kiểm tra lịch sử trước khi tạo đơn khác.');
        } else {
          const id = requested ?? saved?.orderId;
          paymentKey.current = id === saved?.orderId && typeof saved?.key === 'string' ? saved.key : crypto.randomUUID();

          if (id) {
            const existing = await shopApi<Order>(`/orders/${encodeURIComponent(id)}`, {}, session.token);
            if (!active) return;

            if (['PAID', 'PREPARING', 'READY', 'COMPLETED'].includes(existing.status)) {
              if (saved?.orderId === existing.id) {
                clear();
                sessionStorage.removeItem(storageKey);
              }
              router.replace(`/orders/${encodeURIComponent(existing.id)}`);
              return;
            }

            if (existing.status === 'CANCELLED') sessionStorage.removeItem(storageKey);
            setUnknownCreate(false);
            setOrder(existing);

            if (existing.status !== 'CANCELLED') {
              sessionStorage.setItem(storageKey, JSON.stringify({ orderId: existing.id, key: paymentKey.current }));
            }
          }
        }
      } catch (err) {
        if (!active) return;
        setBlocked(true);
        setError((err as Error).message);
        if (err instanceof ApiError && err.status === 401) {
          logout();
          router.push('/login?next=/checkout&expired=1');
        }
      }

      if (active) setLoaded(true);
    });

    return () => {
      active = false;
    };
  }, [ready, session, storageKey, router, clear, logout]);

  useEffect(() => {
    if (method !== 'CARD') {
      setCardError('');
      return;
    }

    if (!card) {
      setCardError('');
      return;
    }

    setCardError(/^\d{16}$/.test(card) ? '' : 'Số thẻ demo phải gồm 16 chữ số');
  }, [method, card]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session || inFlight.current || blocked) return;

    if (method === 'CARD' && !/^\d{16}$/.test(card)) {
      setCardError('Số thẻ demo phải gồm 16 chữ số');
      return;
    }

    setCardError('');
    inFlight.current = true;
    setBusy(true);
    setError('');

    let creating = false;

    try {
      let pending = order;
      if (!pending) {
        sessionStorage.setItem(storageKey, JSON.stringify({ phase: 'creating' }));
        creating = true;
        pending = await shopApi<Order>(
          '/orders',
          {
            method: 'POST',
            body: JSON.stringify({
              items: shop.cart.map(({ productId, size, toppings, quantity }) => ({
                productId,
                size,
                toppings,
                quantity,
              })),
            }),
          },
          session.token,
        );
        creating = false;
        setOrder(pending);
      }

      if (!paymentKey.current) paymentKey.current = crypto.randomUUID();
      sessionStorage.setItem(storageKey, JSON.stringify({ orderId: pending.id, key: paymentKey.current }));

      await shopApi(
        '/payments',
        {
          method: 'POST',
          headers: { 'Idempotency-Key': paymentKey.current },
          body: JSON.stringify({
            orderId: pending.id,
            paymentMethod: method,
            ...(method === 'CARD' ? { cardNumber: card } : {}),
          }),
        },
        session.token,
      );

      clear();
      sessionStorage.removeItem(storageKey);
      router.push(`/orders/${encodeURIComponent(pending.id)}`);
    } catch (err) {
      const uncertain = creating && (!(err instanceof ApiError) || err.status >= 500);
      if (uncertain) {
        setUnknownCreate(true);
        setBlocked(true);
        setError('Chưa xác định được kết quả tạo đơn. Hãy kiểm tra lịch sử trước khi tạo đơn khác.');
      } else {
        if (creating) sessionStorage.removeItem(storageKey);
        if (err instanceof ApiError && err.status === 401) {
          logout();
          router.push('/login?next=/checkout&expired=1');
        } else if (err instanceof ApiError && err.status === 402) {
          setError('Thanh toán không thành công. Đơn của bạn vẫn được giữ, bạn có thể thử lại hoặc chọn hình thức khác.');
        } else {
          setError((err as Error).message);
        }
      }
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  function startAgain() {
    sessionStorage.removeItem(storageKey);
    setOrder(null);
    setUnknownCreate(false);
    setBlocked(false);
    setError('');
    setCardError('');
    paymentKey.current = crypto.randomUUID();
    router.replace('/checkout');
  }

  const summaryLines = ((order?.items?.length ? order.items : cart) as Array<{
    id?: string;
    key?: string;
    name: string;
    size: string;
    toppings: string[];
    quantity: number;
    unitPrice?: number;
    lineTotal?: number;
  }>).map((line) => ({
    id: line.id ?? line.key ?? `${line.name}-${line.size}`,
    key: line.key ?? line.id ?? `${line.name}-${line.size}`,
    name: line.name,
    size: line.size,
    toppings: line.toppings,
    quantity: line.quantity,
    lineTotal: line.lineTotal ?? (line.unitPrice ?? 0) * line.quantity,
  }));

  const total = order?.total ?? cartTotal(cart);

  if (!ready) return <main className="shop-page" role="status">Đang tải…</main>;
  if (!session) return <main className="shop-page"><Link href="/login?next=/checkout">Đăng nhập để đặt đơn</Link></main>;
  if (session.role !== 'CUSTOMER') return <main className="shop-page"><p role="alert">Chỉ khách hàng được đặt và thanh toán đơn.</p></main>;
  if (!loaded) return <main className="shop-page" role="status">Đang tải phiên thanh toán…</main>;

  const payable = !order || ['PENDING', 'PAYMENT_FAILED'].includes(order.status);

  return (
    <main className="shop-page">
      <h1>Thanh toán mô phỏng</h1>
      <p>Chỉ dùng số thẻ demo. Không nhập thông tin thẻ thật.</p>
      {order && <p>Mã đơn: {order.id}</p>}

      {error && <p role="alert">{error}</p>}
      {unknownCreate && <p role="alert">{error}</p>}

      {summaryLines.length > 0 && (
        <section aria-label="Tóm tắt đơn hàng">
          <h2>Tóm tắt đơn</h2>
          <ul>
            {summaryLines.map((line) => (
              <li key={line.key}>
                <span>{line.name}</span>
                <span>{line.size}</span>
                {line.toppings.length > 0 && <span>{line.toppings.join(', ')}</span>}
                <span>x{line.quantity}</span>
                <span>{formatVnd(line.lineTotal)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {payable && (
        <form onSubmit={submit}>
          <fieldset>
            <legend>Phương thức thanh toán</legend>

            <label>
              <input
                type="radio"
                name="payment-method"
                checked={method === 'WALLET'}
                onChange={() => setMethod('WALLET')}
              />
              Ví
            </label>

            <label>
              <input
                type="radio"
                name="payment-method"
                checked={method === 'CARD'}
                onChange={() => setMethod('CARD')}
              />
              Thẻ
            </label>
          </fieldset>

          {method === 'CARD' && (
            <div>
              <label htmlFor="card-number">Số thẻ demo</label>
              <input
                id="card-number"
                type="text"
                inputMode="numeric"
                value={card}
                aria-invalid={Boolean(cardError)}
                aria-describedby={cardError ? 'card-error' : undefined}
                onChange={(event) => setCard(event.target.value.replace(/\D/g, '').slice(0, 16))}
              />
              {cardError && <p id="card-error">{cardError}</p>}
            </div>
          )}

          <p>Tổng tiền: {formatVnd(total)}</p>

          <button type="submit" disabled={busy}>
            {busy ? 'Đang xử lý…' : 'Xác nhận trả'}
          </button>
          {order && (
            <button type="button" onClick={startAgain}>
              Thử lại
            </button>
          )}
        </form>
      )}
    </main>
  );
}

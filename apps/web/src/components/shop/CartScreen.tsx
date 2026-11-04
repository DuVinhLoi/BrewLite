'use client';
import Link from 'next/link';
import { cartTotal, type CartLine } from '@/lib/shop';
import { formatVnd } from '@/lib/format';
import { useShop } from './ShopProvider';
import { shortageMessage } from '@/lib/inventory';
import { useAvailability } from './useAvailability';
export function CartScreen() {
  const { cart, ready, session } = useShop();
  const availability = useAvailability(ready ? cart : []);
  if (!ready) return <main className="shop-page" role="status">Đang tải giỏ hàng…</main>;
  return <main className="shop-page"><h1>Giỏ hàng</h1>{!cart.length && <p>Giỏ hàng trống</p>}{cart.map((line) => <CartItem key={line.key} line={line} />)}<p className="shop-total">Tổng tiền: {formatVnd(cartTotal(cart))}</p>
  {availability.error && <p role="alert">{availability.error}</p>}
  {availability.result && !availability.result.canOrder && <p role="alert">{shortageMessage(availability.result)}. Giảm số lượng hoặc xóa món để tiếp tục.</p>}
  {cart.length && availability.result?.canOrder ? <Link className="shop-button" href={session ? '/checkout' : '/login?next=/checkout'}>Thanh toán</Link> : <button disabled>Thanh toán</button>}<Link href="/">Tiếp tục chọn món</Link></main>;
}

function CartItem({ line }: { line: CartLine }) {
  const { cart, quantity } = useShop();
  const availability = useAvailability(line.quantity < 99 ? cart.map((item) => item.key === line.key ? { ...item, quantity: item.quantity + 1 } : item) : []);
  const canIncrease = line.quantity < 99 && !availability.loading && !availability.error && availability.result?.canOrder;
  return <article className="shop-line"><h2>{line.name}</h2><p>Size {line.size} · {line.toppings.join(', ') || 'Không topping'}</p><p>{formatVnd(line.unitPrice)}</p><p>Thành tiền: {formatVnd(line.unitPrice * line.quantity)}</p><div className="shop-actions"><button aria-label={`Giảm ${line.name}`} onClick={() => {
    if (line.quantity === 1 && !window.confirm(`Xóa ${line.name} khỏi giỏ hàng?`)) return;
    quantity(line.key, line.quantity - 1);
  }}>−</button><output aria-label={`Số lượng ${line.name}`}>{line.quantity}</output><button aria-label={`Tăng ${line.name}`} disabled={!canIncrease} onClick={() => { if (canIncrease) quantity(line.key, line.quantity + 1); }}>+</button><button onClick={() => quantity(line.key, 0)}>Xóa</button></div>
    {availability.error && <p role="alert">{availability.error}</p>}
  </article>;
}

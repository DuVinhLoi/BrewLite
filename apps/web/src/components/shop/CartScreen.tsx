'use client';
import Link from 'next/link';
import { cartTotal } from '@/lib/shop';
import { formatVnd } from '@/lib/format';
import { useShop } from './ShopProvider';
export function CartScreen() {
  const { cart, ready, quantity, session } = useShop();
  if (!ready) return <main className="shop-page" role="status">Đang tải giỏ hàng…</main>;
  return <main className="shop-page"><h1>Giỏ hàng</h1>{!cart.length && <p>Giỏ hàng trống</p>}{cart.map((line) => <article className="shop-line" key={line.key}><h2>{line.name}</h2><p>Size {line.size} · {line.toppings.join(', ') || 'Không topping'}</p><p>{formatVnd(line.unitPrice)}</p><p>Thành tiền: {formatVnd(line.unitPrice * line.quantity)}</p><div className="shop-actions"><button aria-label={`Giảm ${line.name}`} onClick={() => {
    if (line.quantity === 1 && !window.confirm(`Xóa ${line.name} khỏi giỏ hàng?`)) return;
    quantity(line.key, line.quantity - 1);
  }}>−</button><output aria-label={`Số lượng ${line.name}`}>{line.quantity}</output><button aria-label={`Tăng ${line.name}`} disabled={line.quantity >= 99} onClick={() => quantity(line.key, line.quantity + 1)}>+</button><button onClick={() => quantity(line.key, 0)}>Xóa</button></div></article>)}<p className="shop-total">Tổng tiền: {formatVnd(cartTotal(cart))}</p>{cart.length ? <Link className="shop-button" href={session ? '/checkout' : '/login?next=/checkout'}>Thanh toán</Link> : <button disabled>Thanh toán</button>}<Link href="/">Tiếp tục chọn món</Link></main>;
}

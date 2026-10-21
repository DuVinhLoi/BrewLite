'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { Product } from '@/lib/api';
import { shopApi, priceFor, cartKey, type Options } from '@/lib/shop';
import { formatVnd } from '@/lib/format';
import { useShop } from './ShopProvider';
export function ProductDetail({ id }: { id: string }) {
  const shop = useShop();
  const [data, setData] = useState<{ product: Product; options: Options } | null>(null);
  const [error, setError] = useState('');
  const [size, setSize] = useState('M');
  const [toppings, setToppings] = useState<string[]>([]);
  const [notice, setNotice] = useState('');
  useEffect(() => {
    let active = true;
    Promise.all([shopApi<Product>(`/products/${encodeURIComponent(id)}`), shopApi<Options>('/catalog/options')]).then(([product, options]) => { if (active) setData({ product, options }); }).catch((err: Error) => { if (active) setError(err.message); });
    return () => { active = false; };
  }, [id]);
  if (error) return <main className="shop-page"><p role="alert">{error}</p><Link href="/">Quay lại menu</Link></main>;
  if (!data) return <main className="shop-page" role="status">Đang tải sản phẩm…</main>;
  const { product, options } = data;
  const price = priceFor(product, size, toppings, options);
  function add() {
    try { shop.add({ key: cartKey(product.id, size, toppings), productId: product.id, name: product.name, size, toppings, quantity: 1, unitPrice: price }); setNotice('Đã thêm vào giỏ hàng'); }
    catch (err) { setNotice((err as Error).message); }
  }
  return <main className="shop-page"><Link href="/">← Thực đơn</Link><h1>{product.name}</h1><p>{product.description}</p><fieldset><legend>Size</legend>{Object.entries(options.sizes).map(([name, extra]) => <label key={name}><input type="radio" name="size" value={name} checked={size === name} onChange={() => setSize(name)} />{name} (+{formatVnd(extra)})</label>)}</fieldset><fieldset><legend>Topping</legend>{Object.entries(options.toppings).map(([name, extra]) => <label key={name}><input type="checkbox" checked={toppings.includes(name)} onChange={(event) => setToppings(event.target.checked ? [...toppings, name] : toppings.filter((item) => item !== name))} />{name} (+{formatVnd(extra)})</label>)}</fieldset><p className="shop-total">{formatVnd(price)}</p><button disabled={!shop.ready || product.stock <= 0} onClick={add}>{product.stock <= 0 ? 'Hết hàng' : 'Thêm vào giỏ'}</button><p role="status">{notice}</p><Link href="/cart">Xem giỏ hàng</Link></main>;
}
'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { Product } from '@/lib/api';
import { shopApi, priceFor, cartKey, addLine, type Options } from '@/lib/shop';
import { checkAvailability, shortageMessage } from '@/lib/inventory';
import { formatVnd } from '@/lib/format';
import { useShop } from './ShopProvider';
import { useAvailability, useRemainingQuantity } from './useAvailability';

export function ProductDetail({ id }: { id: string }) {
  const shop = useShop();
  const [data, setData] = useState<{ product: Product; options: Options } | null>(null);
  const [error, setError] = useState('');
  const [size, setSize] = useState('M');
  const [toppings, setToppings] = useState<string[]>([]);
  const [notice, setNotice] = useState('');
  const [addError, setAddError] = useState('');
  const [busy, setBusy] = useState(false);
  const adding = useRef(false);
  const pendingAdd = useRef<AbortController | null>(null);
  const [quantityInput, setQuantityInput] = useState('1');
  const availability = useAvailability([{ productId: id, size, toppings, quantity: 1 }]);
  const capacity = useRemainingQuantity(shop.cart, { productId: id, size, toppings, quantity: 1 }, availability.result?.lines[0]?.cups ?? 0, shop.ready && !availability.loading && !availability.error);
  useEffect(() => () => { pendingAdd.current?.abort(); }, [id, shop.cart]);
  useEffect(() => {
    let active = true;
    Promise.all([shopApi<Product>(`/products/${encodeURIComponent(id)}`), shopApi<Options>('/catalog/options')]).then(([product, options]) => { if (active) setData({ product, options }); }).catch((err: Error) => { if (active) setError(err.message); });
    return () => { active = false; };
  }, [id]);
  if (error) return <main className="shop-page"><p role="alert">{error}</p><Link href="/">Quay lại menu</Link></main>;
  if (!data) return <main className="shop-page" role="status">Đang tải sản phẩm…</main>;
  const { product, options } = data;
  const price = priceFor(product, size, toppings, options);
  const selectedKey = cartKey(product.id, size, toppings);
  const selectedLineQuantity = shop.cart.find((line) => line.key === selectedKey)?.quantity ?? 0;
  const choice = availability.result?.lines[0];
  const remaining = capacity.remaining;
  const quantity = Number(quantityInput);
  const validQuantity = quantityInput.trim() !== '' && Number.isInteger(quantity) && quantity >= 1 && quantity <= remaining;
  const quantityError = shop.ready && remaining > 0 && !validQuantity ? `Số lượng phải là số nguyên từ 1 đến ${remaining}` : '';
  const canAdd = shop.ready && choice?.sellable && remaining > 0 && validQuantity && !busy && !availability.loading && !availability.error && !capacity.loading && !capacity.error;
  async function add() {
    if (!canAdd || adding.current) return;
    const controller = new AbortController();
    pendingAdd.current = controller;
    adding.current = true; setBusy(true); setAddError(''); setNotice('');
    try {
      const line = { key: selectedKey, productId: product.id, name: product.name, size, toppings, quantity, unitPrice: price };
      const next = addLine(shop.cart, line);
      const result = await checkAvailability(next, controller.signal);
      if (controller.signal.aborted) return;
      if (!result.canOrder) { setAddError(shortageMessage(result)); return; }
      shop.add(line); setQuantityInput('1'); setNotice('Đã thêm vào giỏ hàng');
    } catch (err) { if (!controller.signal.aborted) setAddError((err as Error).message); }
    finally { pendingAdd.current = null; adding.current = false; setBusy(false); }
  }
  function changed() { setQuantityInput('1'); setNotice(''); setAddError(''); }
  return <main className="shop-page">
    <Link href="/">← Thực đơn</Link><h1>{product.name}</h1><p>{product.description}</p>
    <fieldset disabled={busy}><legend>Size</legend>{Object.entries(options.sizes).map(([name, extra]) => <label key={name}><input type="radio" name="size" value={name} checked={size === name} onChange={() => { setSize(name); changed(); }} />{name} (+{formatVnd(extra)})</label>)}</fieldset>
    <fieldset disabled={busy}><legend>Topping</legend>{Object.entries(options.toppings).map(([name, extra]) => <label key={name}><input type="checkbox" checked={toppings.includes(name)} onChange={(event) => { setToppings(event.target.checked ? [...toppings, name] : toppings.filter((item) => item !== name)); changed(); }} />{name} (+{formatVnd(extra)})</label>)}</fieldset>
    <p className="shop-total">{formatVnd(price)}</p>
    <label htmlFor="product-quantity">Số lượng</label><input id="product-quantity" type="number" min={1} max={remaining} step={1} value={quantityInput} disabled={!shop.ready || busy || capacity.loading || remaining === 0} aria-invalid={Boolean(quantityError)} aria-describedby={quantityError ? 'product-quantity-error' : undefined} onChange={(event) => { const value = event.target.value; setQuantityInput(Number(value) > remaining ? String(remaining) : value); setNotice(''); setAddError(''); }} />
    {quantityError && <p id="product-quantity-error">{quantityError}</p>}
    {availability.error && <p role="alert">{availability.error}</p>}
    {capacity.error && <p role="alert">{capacity.error}</p>}
    {addError && <p role="alert">{addError}</p>}
    <button disabled={!canAdd} onClick={() => void add()}>{busy ? 'Đang kiểm tra giỏ…' : 'Thêm vào giỏ'}</button>
    <p role="status">{!shop.ready ? 'Đang tải giỏ hàng…' : selectedLineQuantity >= 99 ? 'Mỗi dòng tối đa 99 ly' : notice}</p>
    <Link href="/cart">Xem giỏ hàng</Link>
  </main>;
}

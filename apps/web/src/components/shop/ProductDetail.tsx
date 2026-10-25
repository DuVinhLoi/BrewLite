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
  const [quantityInput, setQuantityInput] = useState('1');
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
  // Stock is shared by every variant of the product; the 99 cap applies to the selected line only.
  const productQuantity = shop.cart
    .filter((line) => line.productId === product.id)
    .reduce((sum, line) => sum + line.quantity, 0);
  const selectedLineQuantity = shop.cart.find((line) => line.key === selectedKey)?.quantity ?? 0;
  const remaining = Math.max(0, Math.min(product.stock - productQuantity, 99 - selectedLineQuantity));
  const quantity = Number(quantityInput);
  const validQuantity = quantityInput.trim() !== ''
    && Number.isInteger(quantity) && quantity >= 1 && quantity <= remaining;
  const quantityError = shop.ready && remaining > 0 && !validQuantity
    ? `Số lượng phải là số nguyên từ 1 đến ${remaining}` : '';
  const canAdd = shop.ready && remaining > 0 && validQuantity;
  const statusMessage = !shop.ready ? 'Đang tải giỏ hàng…'
    : remaining === 0 ? 'Đã đạt số lượng tối đa còn lại' : notice;
  function add() {
    if (!canAdd) return;
    try {
      shop.add({ key: selectedKey, productId: product.id, name: product.name, size, toppings, quantity, unitPrice: price });
      setNotice('Đã thêm vào giỏ hàng');
    } catch (err) {
      setNotice((err as Error).message);
    }
  }
  return (
    <main className="shop-page">
      <Link href="/">← Thực đơn</Link>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      <fieldset>
        <legend>Size</legend>
        {Object.entries(options.sizes).map(([name, extra]) => (
          <label key={name}>
            <input
              type="radio"
              name="size"
              value={name}
              checked={size === name}
              onChange={() => {
                setSize(name);
                setQuantityInput('1');
                setNotice('');
              }}
            />
            {name} (+{formatVnd(extra)})
          </label>
        ))}
      </fieldset>
      <fieldset>
        <legend>Topping</legend>
        {Object.entries(options.toppings).map(([name, extra]) => (
          <label key={name}>
            <input
              type="checkbox"
              checked={toppings.includes(name)}
              onChange={(event) => {
                setToppings(event.target.checked ? [...toppings, name] : toppings.filter((item) => item !== name));
                setQuantityInput('1');
                setNotice('');
              }}
            />
            {name} (+{formatVnd(extra)})
          </label>
        ))}
      </fieldset>
      <p className="shop-total">{formatVnd(price)}</p>
      <label htmlFor="product-quantity">Số lượng</label>
      <input
        id="product-quantity"
        type="number"
        min={1}
        max={remaining > 0 ? remaining : undefined}
        step={1}
        value={quantityInput}
        disabled={!shop.ready || remaining === 0}
        aria-invalid={Boolean(quantityError)}
        aria-describedby={quantityError ? 'product-quantity-error' : undefined}
        onChange={(event) => {
          setQuantityInput(event.target.value);
          setNotice('');
        }}
      />
      {quantityError && <p id="product-quantity-error">{quantityError}</p>}
      <button disabled={!canAdd} onClick={add}>{product.stock <= 0 ? 'Hết hàng' : 'Thêm vào giỏ'}</button>
      <p role="status">{statusMessage}</p>
      <Link href="/cart">Xem giỏ hàng</Link>
    </main>
  );
}

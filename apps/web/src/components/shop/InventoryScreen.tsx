'use client';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { ApiError } from '@/lib/api';
import { shopApi } from '@/lib/shop';
import { validAmount, type Ingredient, type StockMovement } from '@/lib/inventory';
import { useShop } from './ShopProvider';

type InventoryData = { ingredients: Ingredient[]; movements: StockMovement[] };
async function loadInventory(token: string, signal?: AbortSignal): Promise<InventoryData> {
  const [ingredients, movements] = await Promise.all([
    shopApi<Ingredient[]>('/inventory/ingredients', { signal }, token),
    shopApi<StockMovement[]>('/inventory/movements', { signal }, token),
  ]);
  return { ingredients, movements };
}

export function InventoryScreen() {
  const { session, ready } = useShop();
  if (!ready) return <main className="shop-page" role="status">Đang tải phiên…</main>;
  if (!session) return <main className="shop-page"><h1>Kho nguyên liệu</h1><Link href="/login?next=/inventory">Đăng nhập nhân viên</Link></main>;
  if (session.role !== 'BARISTA') return <main className="shop-page"><p role="alert">Chỉ nhân viên pha chế được quản lý kho nguyên liệu.</p><Link href="/">Quay lại thực đơn</Link></main>;
  return <InventoryWorkspace key={session.token} token={session.token} />;
}

function InventoryWorkspace({ token }: { token: string }) {
  const [data, setData] = useState<InventoryData | null>(null);
  const [error, setError] = useState('');
  const [expired, setExpired] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState('');
  const pendingLoad = useRef<AbortController | null>(null);
  const load = useCallback(() => {
    pendingLoad.current?.abort();
    const controller = new AbortController();
    pendingLoad.current = controller;
    return loadInventory(token, controller.signal).then((result) => {
      if (!controller.signal.aborted) setData(result);
    }).catch((err: Error) => {
      if (!controller.signal.aborted) { setError(err.message); setExpired(err instanceof ApiError && err.status === 401); }
    }).finally(() => { if (!controller.signal.aborted) setRefreshing(false); });
  }, [token]);
  useEffect(() => { void load(); return () => pendingLoad.current?.abort(); }, [load]);
  function refresh() { setRefreshing(true); setError(''); return load(); }
  if (expired) return <main className="shop-page"><p role="alert">Phiên nhân viên đã hết hạn.</p><Link href="/login?next=/inventory">Đăng nhập lại</Link></main>;
  const ingredient = data?.ingredients.find((item) => item.id === selectedIngredient) ?? data?.ingredients[0];
  return <main className="shop-page inventory-page">
    <header className="inventory-heading"><div><h1>Kho nguyên liệu</h1><p>Theo dõi tồn kho, nhập nguyên liệu và kiểm đếm.</p></div><button disabled={refreshing} onClick={() => void refresh()}>{refreshing ? 'Đang tải…' : 'Làm mới kho'}</button></header>
    {error && <p role="alert">{error}</p>}
    {!data && !error && <p role="status">Đang tải kho nguyên liệu…</p>}
    {data && <>
      <section aria-labelledby="balances-title" className="inventory-section"><h2 id="balances-title">Số dư nguyên liệu</h2><p>Khả dụng = tồn kho trừ phần giữ cho đơn chưa hoàn tất. Nước và đá không giới hạn.</p>
        {!data.ingredients.length && <p>Chưa có nguyên liệu.</p>}
        <div className="inventory-balances">{data.ingredients.map((item) => <article className="shop-line" key={item.id}><h3>{item.name}</h3><p>Tồn kho: {item.onHand} {item.unit}</p><p>Đang giữ: {item.reserved} {item.unit}</p><p className="inventory-available">{item.tracked ? `Khả dụng: ${item.available} ${item.unit}` : 'Không giới hạn'}</p></article>)}</div>
      </section>
      {ingredient && <section className="shop-line" aria-labelledby="movement-title"><h2 id="movement-title">Nhập kho / kiểm đếm</h2><label>Nguyên liệu<select value={ingredient.id} onChange={(event) => setSelectedIngredient(event.target.value)}>{data.ingredients.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><MovementForm key={ingredient.id} ingredient={ingredient} token={token} onSaved={refresh} /></section>}
      <section className="inventory-section" aria-labelledby="history-title"><h2 id="history-title">Lịch sử biến động</h2><p>100 biến động gần nhất, mới nhất trước.</p>{!data.movements.length && <p>Chưa có biến động.</p>}{data.movements.map((movement) => <article className="shop-line" key={movement.id}><h3>{movement.ingredient.name} · {movement.kind === 'RECEIVE' ? 'Nhập kho' : 'Kiểm đếm'}</h3><p>{Number(movement.quantity) > 0 ? '+' : ''}{movement.quantity} {movement.ingredient.unit} · Tồn sau: {movement.onHandAfter} {movement.ingredient.unit}</p><p>{movement.reason}</p><p>{movement.actor.email} · {new Date(movement.createdAt).toLocaleString('vi-VN')}</p></article>)}</section>
    </>}
  </main>;
}

function MovementForm({ ingredient, token, onSaved }: { ingredient: Ingredient; token: string; onSaved: () => Promise<void> }) {
  const [kind, setKind] = useState('RECEIVE');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState<string>(ingredient.unit);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const units = ingredient.unit === 'g' ? ['g', 'kg'] : ingredient.unit === 'ml' ? ['ml', 'l'] : ['piece'];
  async function submit(event: FormEvent) {
    event.preventDefault(); if (busy) return; setError(''); setNotice('');
    if (!validAmount(quantity, unit, kind === 'ADJUST')) { setError('Số lượng không hợp lệ'); return; }
    if (!reason.trim() || reason.trim().length > 500) { setError('Nhập lý do từ 1 đến 500 ký tự.'); return; }
    setBusy(true);
    try {
      await shopApi(`/inventory/ingredients/${encodeURIComponent(ingredient.id)}/movements`, { method: 'POST', body: JSON.stringify({ kind, quantity, unit, reason: reason.trim() }) }, token);
      setQuantity(''); setReason(''); setNotice('Đã lưu biến động'); await onSaved();
    } catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  }
  return <form noValidate onSubmit={(event) => void submit(event)}>
    <fieldset disabled={busy}><legend>Ghi nhận {ingredient.name}</legend><label>Loại biến động<select value={kind} onChange={(event) => { setKind(event.target.value); setError(''); }}><option value="RECEIVE">Nhập thêm</option><option value="ADJUST">Kiểm đếm tổng tồn</option></select></label>
      <p>{kind === 'RECEIVE' ? 'Cộng lượng nhập vào tồn kho hiện tại.' : `Nhập tổng thực tế đã đếm, không phải lượng chênh lệch. Tổng không được thấp hơn ${ingredient.reserved} ${ingredient.unit} đang giữ.`}</p>
      <label>Số lượng nhập / tổng kiểm đếm<input inputMode="decimal" value={quantity} onChange={(event) => setQuantity(event.target.value)} required /></label><label>Đơn vị<select value={unit} onChange={(event) => setUnit(event.target.value)}>{units.map((value) => <option key={value}>{value}</option>)}</select></label>
      <label>Lý do<input value={reason} onChange={(event) => setReason(event.target.value)} maxLength={500} required /></label>
    </fieldset>{error && <p role="alert">{error}</p>}<p role="status">{notice}</p><button disabled={busy}>{busy ? 'Đang lưu…' : 'Lưu biến động'}</button>
  </form>;
}

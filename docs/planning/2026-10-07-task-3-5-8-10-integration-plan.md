# Task 3–5 + 8–10 Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire menu → cart → voucher → checkout end-to-end against the sequence spec, with payments verified by tests and the whole flow demoable via docker-compose.

**Architecture:** Keep the existing seam design: frontend codes against documented REST contracts (`GET /products`, `POST /orders`, `POST /payments`); backend keeps `I*Repository` contracts + `PaymentService` charge-first logic with In-Memory stubs for tests. No new DB tables, no new deps.

**Tech Stack:** Next.js 14 + Zustand (persist), NestJS 10 + class-validator, Jest 29 + ts-jest, Postgres 16 (teammate scope, not installed here).

## Global Constraints

- Exactly 5 DB entities (`User, Product, Order, OrderItem, Payment`) — no `Promotion` table; `BREWLITE10` validates inline in `PaymentService` (`backend/src/payment/payment.service.ts:10-11,33`).
- Money is integer VND; voucher `discount = floor(total * 0.1)`; loyalty `floor(finalAmount * 0.1 / 1000)`.
- HTTP codes: first payment `201`, idempotency replay `200` (no second gateway call), gateway fail `400` + `PAYMENT_FAILED`, stock conflict `409`, missing JWT `401`.
- Payment order is charge-first then deduct-with-compensate, per sequence 2.4 (`charge` then group DB update) — matches `payment.service.ts:46-72`. Do not reorder.
- Frontend has no test runner (no jest/vitest in `frontend/package.json`) — `npm run build` (tsc + next) is the gate. Do not add one.
- Teammate-owned (do NOT implement here): `GET /products` (Task 2), `POST /orders` + JWT (Tasks 6–7), `GET /orders/me`. Our plan consumes them as contracts with mock fallback.
- `PATCH /orders/:id` stays in `PaymentController` until the teammate `OrderController` exists; the route + `cancelOrder` logic are already correct and covered by tests, so the move is a deferred cosmetic follow-up, not part of DONE.
- Deviation from design spec `docs/planning/specs/2026-10-07-task-3-5-8-10-design.md` §2 (NEW ProductModule/OrderModule/AuthModule): deferred — those are teammate Tasks 2/6/7 and `@prisma/client` / JWT deps are not installed. If you are the teammate owner, implement those modules to the contracts in Task 4 below.

---

### Task 1: Backend — remove `shouldSimulateFailure` test hook from the public DTO

**Files:**
- Modify: `backend/src/payment/dto/create-payment.dto.ts` (delete lines 14–17)
- Modify: `backend/src/payment/payment.service.ts:47` (drop passthrough)
- Modify: `backend/src/payment/mock-payment-gateway.service.ts:7-9` (explicit test hook)
- Test: `backend/test/payment-failure.spec.ts` (new)

**Interfaces:**
- Consumes: `PaymentService.processPayment(dto, key)`, `MockPaymentGatewayService.charge/refund`, `InMemory*Repo.save` (existing, unchanged signatures).
- Produces: `MockPaymentGatewayService.failNextCharge(): void` (used by Task 2 retry test).

- [ ] **Step 1: Write the failing test**

```ts
import { PaymentService } from '../src/payment/payment.service';
import { MockPaymentGatewayService } from '../src/payment/mock-payment-gateway.service';
import { InMemoryOrderRepo } from '../src/stubs/in-memory-order.repo';
import { InMemoryProductRepo } from '../src/stubs/in-memory-product.repo';
import { InMemoryPaymentRepo } from '../src/stubs/in-memory-payment.repo';
import { InMemoryUserRepo } from '../src/stubs/in-memory-user.repo';
import { OrderStatus } from '../src/contracts/order.contract';

test('gateway failure -> PAYMENT_FAILED, cart kept (order retryable)', async () => {
  const orders = new InMemoryOrderRepo();
  const products = new InMemoryProductRepo();
  const payments = new InMemoryPaymentRepo();
  const users = new InMemoryUserRepo();
  const gateway = new MockPaymentGatewayService();
  const svc = new PaymentService(orders, products, payments, users, gateway);
  await products.save({ id: 'p1', name: 'Latte', price: 35000, stock: 10, version: 1 });
  await users.save({ id: 'u1', email: 'a@b.c', loyaltyPoints: 0 });
  await orders.save({ id: 'o1', userId: 'u1', status: OrderStatus.PENDING, total: 35000, items: [{ productId: 'p1', quantity: 1, unitPrice: 35000 }], createdAt: new Date() });

  gateway.failNextCharge();
  await expect(svc.processPayment({ orderId: 'o1', paymentMethod: 'WALLET' }, 'K-F1')).rejects.toThrow('Payment failed');
  expect((await orders.findById('o1'))!.status).toBe(OrderStatus.PAYMENT_FAILED);
  expect((await products.findById('p1'))!.stock).toBe(10);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- test/payment-failure.spec.ts` (workdir `backend/`)
Expected: FAIL with `gateway.failNextCharge is not a function`

- [ ] **Step 3: Implement — gateway hook + drop DTO passthrough**

In `backend/src/payment/mock-payment-gateway.service.ts`, replace the `charge` method:

```ts
private failNext = false;

/** Test-only hook: next charge() throws. Replaces the old shouldSimulateFailure DTO flag. */
failNextCharge(): void {
  this.failNext = true;
}

async charge(opts: { amount: number; method: string }): Promise<void> {
  this.callCount++;
  if (this.failNext) {
    this.failNext = false;
    throw new Error('Mock charge failed');
  }
}
```

In `backend/src/payment/payment.service.ts:47`, replace with:

```ts
await this.gateway.charge({ amount: finalAmount, method: dto.paymentMethod });
```

In `backend/src/payment/dto/create-payment.dto.ts`, delete the `shouldSimulateFailure` field and the now-unused `IsBoolean` import:

```ts
import { IsIn, IsOptional, IsString } from 'class-validator';

export class CreatePaymentDto {
  @IsString()
  orderId!: string;

  @IsIn(['WALLET', 'CARD'])
  paymentMethod!: 'WALLET' | 'CARD';

  @IsOptional()
  @IsString()
  voucherCode?: string;
}
```

- [ ] **Step 4: Run tests to verify all pass**

Run: `npm test` (workdir `backend/`)
Expected: PASS — 18/18 (14 state-machine + 3 existing integration + 1 new)

- [ ] **Step 5: Commit**

```bash
git add backend/src/payment/dto/create-payment.dto.ts backend/src/payment/payment.service.ts backend/src/payment/mock-payment-gateway.service.ts backend/test/payment-failure.spec.ts
git commit -m "refactor(backend): replace shouldSimulateFailure DTO flag with gateway.failNextCharge hook"
```

---

### Task 2: Backend — pin voucher/loyalty math, retry flow, and PENDING-cancel coverage

**Files:**
- Modify: `backend/test/order-payment.integration.spec.ts` (append tests; existing 3 untouched)

**Interfaces:**
- Consumes: `PaymentService.processPayment/cancelOrder`, `MockPaymentGatewayService.failNextCharge` (Task 1), `OrderStatus` enum.
- Produces: nothing new (pure coverage).

- [ ] **Step 1: Append the pinning tests**

Append to `backend/test/order-payment.integration.spec.ts`:

```ts
test('voucher BREWLITE10: discount floor(total*0.1), loyalty floor(final*0.1/1000)', async () => {
  const { orders, products, users, svc } = setup();
  await products.save({ id: 'p1', name: 'Latte', price: 35000, stock: 10, version: 1 });
  await users.save({ id: 'u1', email: 'a@b.c', loyaltyPoints: 0 });
  await orders.save({ id: 'o1', userId: 'u1', status: OrderStatus.PENDING, total: 35000, items: [{ productId: 'p1', quantity: 1, unitPrice: 35000 }], createdAt: new Date() });

  const r = await svc.processPayment({ orderId: 'o1', paymentMethod: 'WALLET', voucherCode: 'BREWLITE10' }, 'K-V1');
  expect(r.discount).toBe(3500);
  expect(r.amount).toBe(31500);
  expect(r.loyaltyPointsEarned).toBe(3);
  expect((await users.findById('u1'))!.loyaltyPoints).toBe(3);
});

test('wrong voucher code: discount 0, full charge', async () => {
  const { orders, products, users, svc } = setup();
  await products.save({ id: 'p1', name: 'Latte', price: 35000, stock: 10, version: 1 });
  await users.save({ id: 'u1', email: 'a@b.c', loyaltyPoints: 0 });
  await orders.save({ id: 'o1', userId: 'u1', status: OrderStatus.PENDING, total: 35000, items: [{ productId: 'p1', quantity: 1, unitPrice: 35000 }], createdAt: new Date() });

  const r = await svc.processPayment({ orderId: 'o1', paymentMethod: 'CARD', voucherCode: 'FAKE' }, 'K-V2');
  expect(r.discount).toBe(0);
  expect(r.amount).toBe(35000);
});

test('PAYMENT_FAILED -> retry with new key succeeds (PAYMENT_FAILED -> PENDING -> PAID)', async () => {
  const { orders, products, users, gateway, svc } = setup();
  await products.save({ id: 'p1', name: 'Latte', price: 20000, stock: 5, version: 1 });
  await users.save({ id: 'u1', email: 'a@b.c', loyaltyPoints: 0 });
  await orders.save({ id: 'o1', userId: 'u1', status: OrderStatus.PENDING, total: 20000, items: [{ productId: 'p1', quantity: 1, unitPrice: 20000 }], createdAt: new Date() });

  gateway.failNextCharge();
  await expect(svc.processPayment({ orderId: 'o1', paymentMethod: 'WALLET' }, 'K-R1')).rejects.toThrow();
  const r = await svc.processPayment({ orderId: 'o1', paymentMethod: 'WALLET' }, 'K-R2');
  expect(r.isCached).toBe(false);
  expect(r.status).toBe('PAID');
  expect((await orders.findById('o1'))!.status).toBe(OrderStatus.PAID);
});

test('PENDING -> CANCELLED without payment touches no stock', async () => {
  const { orders, products, users, svc } = setup();
  await products.save({ id: 'p1', name: 'Latte', price: 20000, stock: 5, version: 1 });
  await users.save({ id: 'u1', email: 'a@b.c', loyaltyPoints: 0 });
  await orders.save({ id: 'o1', userId: 'u1', status: OrderStatus.PENDING, total: 20000, items: [{ productId: 'p1', quantity: 1, unitPrice: 20000 }], createdAt: new Date() });

  await svc.cancelOrder('o1');
  expect((await orders.findById('o1'))!.status).toBe(OrderStatus.CANCELLED);
  expect((await products.findById('p1'))!.stock).toBe(5);
});
```

- [ ] **Step 2: Run tests**

Run: `npm test` (workdir `backend/`)
Expected: PASS — 22/22. These pin existing behavior (spec 2.4/2.5); a FAIL here means `payment.service.ts` regressed, not the test.

- [ ] **Step 3: Commit**

```bash
git add backend/test/order-payment.integration.spec.ts
git commit -m "test(backend): pin voucher/loyalty math, failed-retry, pending-cancel"
```

---

### Task 3: Frontend — `ProductDetailModal` (size/topping/qty, live price) + card wiring

**Files:**
- Create: `frontend/src/components/ProductDetailModal.tsx`
- Modify: `frontend/src/components/ProductCard.tsx` (add modal state + "Tùy chọn" button; quick "Thêm" untouched)

**Interfaces:**
- Consumes: `Product, Size` (`lib/types.ts`), `calcUnitPrice, calcLineTotal, formatVND, SIZE_UPCHARGE, TOPPING_PRICES, DEFAULT_SIZE` (`lib/pricing.ts`), `useCart.addItem` (`store/cart.ts`).
- Produces: `ProductDetailModal({ product, onClose })` used by `ProductCard`.

- [ ] **Step 1: Create the modal**

`frontend/src/components/ProductDetailModal.tsx`:

```tsx
'use client';

import { useState } from 'react';
import type { CSSProperties } from 'react';
import type { Product, Size } from '@/lib/types';
import { calcLineTotal, calcUnitPrice, formatVND, SIZE_UPCHARGE, TOPPING_PRICES, DEFAULT_SIZE } from '@/lib/pricing';
import { useCart } from '@/store/cart';

const SIZES: Size[] = ['S', 'M', 'L'];
const TOPPINGS = Object.keys(TOPPING_PRICES);

// UC01 steps 111-114: size/topping/qty picked here, price recomputed on client, no server call.
export default function ProductDetailModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const addItem = useCart((s) => s.addItem);
  const [size, setSize] = useState<Size>(DEFAULT_SIZE);
  const [toppings, setToppings] = useState<string[]>([]);
  const [qty, setQty] = useState(1);

  const unit = calcUnitPrice(product.price, size, toppings);
  const maxQty = Math.max(1, product.stock);

  const toggleTopping = (t: string) =>
    setToppings((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const handleAdd = () => {
    addItem(product, { size, toppings, quantity: Math.min(Math.max(1, qty), maxQty) });
    onClose();
  };

  return (
    <div style={styles.overlay} onClick={onClose} role="dialog" aria-modal="true" aria-label={product.name}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ margin: '0 0 4px' }}>{product.name}</h2>
        <p style={styles.base}>Giá gốc: {formatVND(product.price)} • Còn {product.stock}</p>

        <p style={styles.label}>Size</p>
        {SIZES.map((s) => (
          <label key={s} style={styles.row}>
            <input type="radio" name="size" checked={size === s} onChange={() => setSize(s)} />
            {s} (+{formatVND(SIZE_UPCHARGE[s])})
          </label>
        ))}

        <p style={styles.label}>Topping</p>
        {TOPPINGS.map((t) => (
          <label key={t} style={styles.row}>
            <input type="checkbox" checked={toppings.includes(t)} onChange={() => toggleTopping(t)} />
            {t} (+{formatVND(TOPPING_PRICES[t] ?? 0)})
          </label>
        ))}

        <p style={styles.label}>Số lượng</p>
        <div style={styles.qtyRow}>
          <button style={styles.qtyBtn} onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Giảm">−</button>
          <strong>{qty}</strong>
          <button style={styles.qtyBtn} onClick={() => setQty((q) => Math.min(maxQty, q + 1))} aria-label="Tăng">+</button>
        </div>

        <p style={styles.total}>Tạm tính: <strong>{formatVND(calcLineTotal(unit, qty))}</strong></p>
        <div style={styles.actions}>
          <button style={styles.backBtn} onClick={onClose}>Đóng</button>
          <button style={styles.addBtn} onClick={handleAdd}>Thêm vào giỏ • {formatVND(calcLineTotal(unit, qty))}</button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 },
  modal: { background: '#fff', borderRadius: 12, padding: 20, maxWidth: 420, width: '100%', maxHeight: '90vh', overflowY: 'auto' },
  base: { margin: '0 0 8px', fontSize: 13, color: '#6b7280' },
  label: { fontWeight: 800, margin: '12px 0 4px' },
  row: { display: 'flex', gap: 8, alignItems: 'center', padding: '6px 0', cursor: 'pointer' },
  qtyRow: { display: 'flex', gap: 12, alignItems: 'center' },
  qtyBtn: { width: 32, height: 32, borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontSize: 16 },
  total: { fontSize: 17, margin: '14px 0 0' },
  actions: { display: 'flex', gap: 12, marginTop: 12 },
  backBtn: { background: 'transparent', border: '1px solid #d1d5db', borderRadius: 8, padding: '12px 16px', cursor: 'pointer', fontWeight: 700 },
  addBtn: { flex: 1, background: '#065f46', color: '#fff', border: 'none', borderRadius: 8, padding: 12, fontWeight: 800, cursor: 'pointer' },
};
```

- [ ] **Step 2: Wire it into `ProductCard`**

In `frontend/src/components/ProductCard.tsx`: add import `import ProductDetailModal from './ProductDetailModal';`, add `const [customizing, setCustomizing] = useState(false);` next to `added`, and render below the quick-add button:

```tsx
<button onClick={() => setCustomizing(true)} disabled={outOfStock} style={outOfStock ? styles.btnDisabled : styles.btn}>
  Tùy chọn size / topping
</button>
{customizing && <ProductDetailModal product={product} onClose={() => setCustomizing(false)} />}
```

Keep the existing quick "Thêm vào giỏ" button unchanged.

- [ ] **Step 3: Build to verify**

Run: `npm run build` (workdir `frontend/`)
Expected: `✓ Compiled successfully`, no type errors.

- [ ] **Step 4: Manual check + commit**

Manual: `npm run dev`, open menu, click "Tùy chọn", pick L + Trân châu, price updates instantly, add → header badge increments, F5 keeps cart (persist).
```bash
git add frontend/src/components/ProductDetailModal.tsx frontend/src/components/ProductCard.tsx
git commit -m "feat(frontend): product detail modal with size/topping live pricing"
```

---

### Task 4: Frontend — voucher `BREWLITE10` + 2-step checkout (`POST /orders` → `POST /payments`)

**Files:**
- Modify: `frontend/src/lib/payment/types.ts` (extend `PaymentRequest`)
- Modify: `frontend/src/lib/payment/api-gateway.ts` (create order, send voucher)
- Modify: `frontend/src/components/PaymentForm.tsx` (voucher input, final amount)
- Modify: `frontend/src/app/cart/page.tsx:42` (pass `items` into `PaymentForm`)

**Interfaces:**
- Consumes: `PaymentGateway.pay`, `useCart` items, `formatVND`; backend contracts below.
- Produces: checkout flow `createOrder → pay(orderId, voucherCode)` with `Idempotency-Key` header.
- Backend contracts (teammate Tasks 6–7; graceful fallback if absent):
  - `POST /orders` body `{ items: [{ productId, quantity, unitPrice, size?, toppings? }] }`, header `Authorization: Bearer <token>` → `201 { id, status: 'PENDING', total, createdAt }`; no token → `401`.
  - Token source: `localStorage.getItem('brewlite-token')` (key owned by Task 7; confirm with owner, update this one line if different).
  - `POST /payments` body `{ orderId, paymentMethod, voucherCode? }`, header `Idempotency-Key` → `201` new / `200` replay.

- [ ] **Step 1: Extend `PaymentRequest`**

In `frontend/src/lib/payment/types.ts`, replace the `PaymentRequest` interface:

```ts
export interface CartLine {
  productId: string;
  quantity: number;
  unitPrice: number;
  size?: string;
  toppings?: string[];
}

export interface PaymentRequest {
  amount: number;
  method: PaymentMethod;
  /** Chống trừ tiền 2 lần khi retry (header Idempotency-Key, Task 8/10). */
  idempotencyKey: string;
  /** Có khi Task 6 xong; mock tự sinh mã đơn demo. */
  orderId?: string;
  /** Dòng giỏ để tạo đơn Task 6 khi chưa có orderId. */
  items?: CartLine[];
  /** Mã giảm giá UC05a, backend validate nội bộ. */
  voucherCode?: string;
}
```

- [ ] **Step 2: 2-step `ApiPaymentGateway`**

Replace `frontend/src/lib/payment/api-gateway.ts` with:

```ts
import type { PaymentGateway } from './gateway';
import type { CartLine, PaymentRequest, PaymentResult } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

// FEATURE: Real payment gateway (Task 8) — POST /orders (Task 6) rồi POST /payments,
// kết quả chuẩn hóa về PaymentResult nên UI giữ nguyên. Bật bằng NEXT_PUBLIC_PAYMENT_MODE=api.
export class ApiPaymentGateway implements PaymentGateway {
  readonly name = 'api';

  private async createOrderId(items: CartLine[]): Promise<string> {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('brewlite-token') : null;
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ items }),
      });
    } catch {
      throw new Error('Chưa có POST /orders (Task 6) — để demo, dùng NEXT_PUBLIC_PAYMENT_MODE=mock.');
    }
    if (res.status === 401) throw new Error('Bạn cần đăng nhập trước khi đặt đơn (thiếu JWT).');
    if (!res.ok) throw new Error(`Tạo đơn thất bại (mã ${res.status}). Giỏ hàng được giữ nguyên.`);
    const json = await res.json();
    if (!json?.id) throw new Error('Tạo đơn thất bại: backend không trả mã đơn.');
    return String(json.id);
  }

  async pay(req: PaymentRequest): Promise<PaymentResult> {
    const orderId = req.orderId ?? (req.items?.length ? await this.createOrderId(req.items) : undefined);
    if (!orderId) {
      throw new Error('Thiếu orderId: cần Task 6 (POST /orders) tạo đơn trước khi gọi POST /payments.');
    }
    const res = await fetch(`${API_BASE}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': req.idempotencyKey,
      },
      body: JSON.stringify({ orderId, paymentMethod: req.method, ...(req.voucherCode ? { voucherCode: req.voucherCode } : {}) }),
    });
    if (!res.ok) {
      // Lỗi -> UI giữ giỏ (US-05).
      const text = await res.text().catch(() => '');
      throw new Error(text || `Thanh toán thất bại (mã ${res.status}). Giỏ hàng được giữ nguyên.`);
    }
    const json = await res.json();
    return {
      orderCode: `#${String(json.orderId ?? orderId).slice(0, 8)}`,
      status: 'PAID',
      amount: Number(json.amount ?? req.amount),
      method: req.method,
      idempotencyKey: req.idempotencyKey,
    };
  }
}
```

- [ ] **Step 3: Voucher UI in `PaymentForm`**

`PaymentForm` props become `{ total, items, onSuccess, onBack }` where `items: CartLine[]`. Add state `voucher` + `applied` (+ derived `discount = applied === 'BREWLITE10' ? Math.floor(total * 0.1) : 0`, `final = total - discount`). Key changes to `frontend/src/components/PaymentForm.tsx`:

```tsx
import type { CartLine } from '@/lib/payment/types';

export default function PaymentForm({ total, items, onSuccess, onBack }: {
  total: number;
  items: CartLine[];
  onSuccess: (result: PaymentResult) => void;
  onBack: () => void;
}) {
  const [method, setMethod] = useState<PaymentMethod>('WALLET');
  const [voucher, setVoucher] = useState('');
  const [applied, setApplied] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const discount = applied === 'BREWLITE10' ? Math.floor(total * 0.1) : 0;
  const final = total - discount;

  const handleConfirm = async () => {
    if (processing) return;
    setProcessing(true);
    setError(null);
    try {
      const result = await getPaymentGateway().pay({
        amount: final,
        method,
        idempotencyKey: newIdempotencyKey(),
        items,
        ...(applied ? { voucherCode: applied } : {}),
      });
      onSuccess(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Thanh toán thất bại, vui lòng thử lại.');
    } finally {
      setProcessing(false);
    }
  };
  // ... render: Tổng {formatVND(total)}, voucher input + "Áp dụng" (setApplied(voucher.trim().toUpperCase())),
  // Giảm giá -{formatVND(discount)} khi applied, Thực trả {formatVND(final)}, pay button `Xác nhận trả • ${formatVND(final)}`
}
```

Render block to insert after the total line (keep existing method radios, note, error, actions):

```tsx
<div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
  <input
    placeholder="Mã giảm giá (BREWLITE10)"
    value={voucher}
    onChange={(e) => setVoucher(e.target.value)}
    disabled={processing}
    style={{ flex: 1, border: '1px solid #d1d5db', borderRadius: 8, padding: '10px 12px' }}
  />
  <button onClick={() => setApplied(voucher.trim().toUpperCase() || null)} disabled={processing} style={styles.backBtn}>
    Áp dụng
  </button>
</div>
{applied && (
  <p style={{ fontSize: 14, color: applied === 'BREWLITE10' ? '#065f46' : '#b91c1c' }}>
    {applied === 'BREWLITE10' ? `Đã áp ${applied}: −${formatVND(discount)}` : `Mã ${applied} không hợp lệ, tính giá gốc.`}
  </p>
)}
<p style={styles.total}>Thực trả: <strong>{formatVND(final)}</strong></p>
```

In `frontend/src/app/cart/page.tsx`, change line 42 to pass items (they already satisfy `CartLine`):

```tsx
return <PaymentForm total={total} items={items} onSuccess={handlePaymentSuccess} onBack={() => setStep('cart')} />;
```

- [ ] **Step 4: Build to verify**

Run: `npm run build` (workdir `frontend/`)
Expected: `✓ Compiled successfully`, no type errors.

- [ ] **Step 5: Manual check + commit**

Manual (mock mode default): cart → payment → type `brewlite10` → Áp dụng → shows −10% and reduced "Xác nhận trả" amount → success screen shows same amount (mock echoes `amount: final`).
```bash
git add frontend/src/lib/payment/types.ts frontend/src/lib/payment/api-gateway.ts frontend/src/components/PaymentForm.tsx frontend/src/app/cart/page.tsx
git commit -m "feat(frontend): voucher input plus two-step order-then-pay checkout"
```

---

### Task 5: DONE gate — tests, builds, contract smoke, compose

- [ ] **Step 1: Backend tests**

Run: `npm test` (workdir `backend/`)
Expected: PASS — 22/22 (14 state-machine + 8 payment/failure/integration).

- [ ] **Step 2: Backend build**

Run: `npm run build` (workdir `backend/`)
Expected: clean `tsc`, no errors.

- [ ] **Step 3: Frontend build**

Run: `npm run build` (workdir `frontend/`)
Expected: `✓ Compiled successfully`.

- [ ] **Step 4: Payment contract smoke (backend runs standalone — In-Memory stubs, no DB needed)**

Run (workdir `backend/`, two terminals or background):
1. `npm run start:dev`, wait for `Nest application successfully started` on `:3000`.
2. `KEY=$(node -e "console.log(require('crypto').randomUUID())")` — PowerShell: `$KEY = [guid]::NewGuid().ToString()`.
3. Seed an order first via jest? No — live server has empty In-Memory stores. Smoke limits to: `POST /payments` with unknown order → expect `404 Order not found` (proves validation pipe + route live); double-POST same key on a seeded order is covered by jest (Task 1–2), skip live seeding (YAGNI).
4. `GET /products` → expect `404` until teammate Task 2 lands; frontend `fromMock: true` fallback covers demo.

Expected: payments route live with correct 404-before-seed behavior; stop server after.

- [ ] **Step 5: Compose smoke**

Run: `docker compose up --build` (repo root)
Expected: `db`, `backend`, `frontend` healthy; `http://localhost:3001` shows menu (mock badge until teammate endpoints land); `Ctrl+C` + `docker compose down`.

- [ ] **Step 6: Commit (only if Task 5 changed files; otherwise skip — no empty commit)**

---

## File map (all touched)

| File | Task | Action |
|---|---|---|
| `backend/src/payment/dto/create-payment.dto.ts` | 1 | delete hook field |
| `backend/src/payment/payment.service.ts` | 1 | drop passthrough (line 47) |
| `backend/src/payment/mock-payment-gateway.service.ts` | 1 | add `failNextCharge` |
| `backend/test/payment-failure.spec.ts` | 1 | new |
| `backend/test/order-payment.integration.spec.ts` | 2 | append 4 tests |
| `frontend/src/components/ProductDetailModal.tsx` | 3 | new |
| `frontend/src/components/ProductCard.tsx` | 3 | modal wiring |
| `frontend/src/lib/payment/types.ts` | 4 | `CartLine`, extend request |
| `frontend/src/lib/payment/api-gateway.ts` | 4 | 2-step checkout |
| `frontend/src/components/PaymentForm.tsx` | 4 | voucher UI |
| `frontend/src/app/cart/page.tsx` | 4 | pass `items` |

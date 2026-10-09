# Demo mượt: mỗi tab một phiên, giữ đơn đang trả dở, dữ liệu demo bền — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: dùng `.agents/skills/subagent-driven-development` (khuyên dùng) hoặc `.agents/skills/executing-plans` để làm plan theo từng task. Các bước dùng checkbox (`- [ ]`) để đánh dấu.

**Goal:** Demo khách và barista cùng lúc trên 2 tab của một trình duyệt mà không tab nào bị đổi tài khoản; đơn đang trả dở không mất khi reload; lịch sử đơn và tồn kho giữ qua các lần bật container; quầy chỉ hiện đơn khách thật sự đặt.

**Architecture:** Token chuyển từ `localStorage` (chung mọi tab) sang `sessionStorage` (riêng từng tab) sau một module duy nhất `frontend/src/lib/auth.ts`. Phiên thanh toán của tab (mã đơn và 2 Idempotency-Key) lưu `sessionStorage`, gắn với dấu vân tay giỏ, trong module mới `frontend/src/lib/payment/checkout-session.ts`. Seed chỉ tạo dữ liệu còn thiếu, không xóa đơn, không đặt lại kho. Dữ liệu smoke test tách bằng tài khoản `@smoke.test` và lệnh dọn `npm run smoke:clean`.

**Tech Stack:** Next.js 14 (client components), vitest 3 (môi trường `node`, storage giả ở `frontend/vitest.setup.ts`), NestJS 10 + Prisma 6 + PostgreSQL 16, jest 29 (ts-jest).

## Bối cảnh và chẩn đoán (2026-10-09, skill `diagnosing-bugs`)

| Lỗi người dùng gặp | Nguyên nhân đã xác nhận | Bằng chứng |
|---|---|---|
| Đăng nhập khách ở tab 1, barista ở tab 2, reload tab 1 thành barista | Token nằm ở `localStorage` key `brewlite-token`, dùng chung mọi tab cùng origin `localhost:3001`; đăng nhập sau ghi đè đăng nhập trước | Harness 2 tab với `getToken()` thật: đỏ 3/3 lần, `expected 'BARISTA' to be 'CUSTOMER'`. Backend nhận 2 token song song (khách 200, barista 200, khách lại 200) nên backend không có lỗi. Chỉ 1 chỗ ghi (`frontend/src/app/login/page.tsx:33`, ghi thẳng `localStorage`) và 1 chỗ đọc (`getToken()`) |
| Quầy có sẵn đơn chưa pha mà khách demo chưa đặt | Volume `brewlite_pgdata` giữ 11 đơn `PAID` của `demo@brewlite.vn` do agent smoke test tạo bằng curl (key `pay-smoke-…`, `K-…`, `K2-…`, `dc-wallet-…`) và vài lần thử giao diện; DB còn 14 tài khoản test (`e2e-*`, `rv1-*`, `rv2-*`, `rv409-*`) | Truy vấn bảng `Order` / `Payment` |
| (Phát hiện thêm) Lịch sử demo không giữ được qua các lần bật container | `backend/prisma/seed.ts` chạy mỗi lần container backend khởi động. Seed **xóa rồi tạo lại `order-1042`** (kèm biên lai) trong lịch sử `demo@brewlite.vn` và **đặt lại tồn kho 4 món về 10** | Đọc `seed.ts:28-53`; DB hiện kho 4 món đều 10 / `version` 1 dù có 11 đơn `PAID` |
| (Báo cáo phương án A) Reload hoặc rời màn Thanh toán mất `orderId` và key | `orderId`, `orderKey`, `payKey` chỉ là state React của `PaymentForm` | `frontend/src/components/PaymentForm.tsx:31-37` |

## Quyết định người dùng đã chốt (2026-10-09)

| # | Quyết định |
|---|---|
| Q1 | Mỗi tab một phiên: token ở `sessionStorage` |
| Q2 | Dữ liệu demo **giữ qua các lần bật container** (lần trước demo 2 ly, lần sau đăng nhập lại lịch sử vẫn còn 2 ly). Không reset tự động |
| Q3 | Header hiện tài khoản của tab và nút Đăng xuất |
| Q4 | Giữ đơn đang thanh toán dở khi reload hoặc rời màn Thanh toán: làm luôn |

## Global Constraints

- Nhánh `fix/backend-hardening` (HEAD `66e66fc`), chưa merge. Mỗi task 1 commit sau khi test xanh. **Không merge, không push.**
- Rule `.claude/rules/doc-code-sync.md`: đổi hành vi thì sửa sơ đồ sequence, mục C, Phần III và test trong **cùng commit** với code. Sơ đồ PlantUML đã sửa phải render được (PlantUML 1.2024.7 từ Maven Central, SHA-1 `cb57b315d96413d55622edaa8c4b234e2ebf4b1f`, tải vào thư mục tạm, không commit).
- Mốc test: backend `npx jest` **122 pass / 2 skip**, `npx tsc --noEmit` sạch; frontend `npx vitest run` **94 pass**, `npx tsc --noEmit` sạch.
- Không thêm phụ thuộc npm. Chữ hiển thị tiếng Việt, message lỗi backend tiếng Anh, comment tiếng Việt.
- Không xóa dữ liệu trong DB compose đang dùng (volume `brewlite_pgdata`) khi người dùng chưa xác nhận. Smoke test trên stack chỉ dùng tài khoản email đuôi `@smoke.test`, không dùng tài khoản demo.
- Skill: `.agents/skills/test-driven-development` (test đỏ trước), `.agents/skills/systematic-debugging` khi test đỏ ngoài dự kiến, `.agents/skills/verification-before-completion` trước khi báo xong, `.agents/skills/requesting-code-review` ở Task 6.

## File Structure

| File | Trách nhiệm | Task |
|---|---|---|
| `frontend/src/lib/auth.ts` | Phiên đăng nhập của tab: đọc/ghi/xóa token (`sessionStorage`), giải mã email + role | 1 |
| `frontend/vitest.setup.ts` | Storage giả cho test: thêm `sessionStorage` | 1 |
| `frontend/src/app/login/page.tsx` | Ghi token qua `saveToken()`, bỏ phiên thanh toán cũ | 1, 2 |
| `frontend/src/lib/payment/checkout-session.ts` (mới) | Phiên thanh toán của tab: mã đơn + 2 key theo dấu vân tay giỏ | 2 |
| `frontend/src/lib/payment/types.ts` | `PaymentError` mang thêm mã HTTP và message backend | 2 |
| `frontend/src/lib/payment/api-gateway.ts` | Điền `status`, `detail` cho `PaymentError` | 2 |
| `frontend/src/components/PaymentForm.tsx` | Dùng phiên thanh toán thay cho state tạm | 2 |
| `frontend/src/components/Header.tsx` | Hiện tài khoản của tab + Đăng xuất | 3 |
| `backend/prisma/seed.ts` | Chỉ tạo dữ liệu còn thiếu | 4 |
| `backend/prisma/clean-smoke.ts` (mới) | Dọn tài khoản `@smoke.test` cùng đơn, biên lai, hoàn kho | 5 |
| `backend/package.json` | Script `smoke:clean` | 5 |
| `docs/user-sequence-specifications.md`, `README.md`, `docs/develop-status-report.md`, `.claude/rules/doc-code-sync.md` | Tài liệu theo rule | 1–6 |

---

### Task 0: Chuẩn bị

- [x] **Step 1:** `git branch --show-current` ra `fix/backend-hardening`; `git status --short` chỉ còn file plan này.
- [x] **Step 2:** Chạy mốc test (Global Constraints). Lệch mốc thì dừng và báo người dùng.
- [x] **Step 3:** Commit plan.

```bash
git add docs/planning/2026-10-09-demo-session-plan.md
git commit -m "docs: plan demo mượt (phien theo tab, giu don dang tra, du lieu demo ben)"
```

---

### Task 1: Mỗi tab một phiên đăng nhập (`sessionStorage`)

**Files:**
- Modify: `frontend/src/lib/auth.ts` (thay cả file)
- Modify: `frontend/vitest.setup.ts:26-32`
- Modify: `frontend/src/app/login/page.tsx:5,33`
- Modify: `frontend/src/lib/payment/api-gateway.test.ts:1-13,23`
- Test: `frontend/src/lib/auth.test.ts`
- Docs: `docs/user-sequence-specifications.md` (§2.3 sơ đồ dòng 283, §2.3 mục C, §2.6 sơ đồ dòng 675), `README.md` (mục "Demo end-to-end")

**Interfaces:**
- Produces: `saveToken(token: string): void`, `clearToken(): void`, `getToken(): string | null` (đọc `sessionStorage`), `interface SessionInfo { email: string; role: Role }`, `sessionFromToken(token: string | null): SessionInfo | null`, `ROLE_LABEL: Record<Role, string>`; giữ nguyên `TOKEN_KEY`, `roleFromToken`, `homeFor`, `Role`.

- [x] **Step 1: Thêm `sessionStorage` giả cho vitest.** Trong `frontend/vitest.setup.ts`, thay khối `if (typeof globalThis.localStorage === 'undefined') { … }` cuối file bằng:

```ts
// localStorage (giỏ hàng) và sessionStorage (token + phiên thanh toán của tab) đều cần cho test
for (const name of ['localStorage', 'sessionStorage'] as const) {
  if (typeof globalThis[name] === 'undefined') {
    Object.defineProperty(globalThis, name, {
      value: new MemoryStorage(),
      configurable: true,
      writable: true,
    });
  }
}
```

- [x] **Step 2: Viết test đỏ.** Trong `frontend/src/lib/auth.test.ts`, đổi 2 dòng import đầu thành:

```ts
import { afterEach, describe, expect, test } from 'vitest';
import { ROLE_LABEL, TOKEN_KEY, clearToken, getToken, homeFor, roleFromToken, saveToken, sessionFromToken } from './auth';
```

rồi thêm vào cuối file:

```ts
// sessionStorage riêng của từng tab; localStorage (storage giả của vitest.setup.ts) dùng chung như các tab cùng origin
class TabStorage {
  private data = new Map<string, string>();
  get length() {
    return this.data.size;
  }
  clear() {
    this.data.clear();
  }
  getItem(k: string) {
    return this.data.has(k) ? this.data.get(k)! : null;
  }
  key(i: number) {
    return [...this.data.keys()][i] ?? null;
  }
  removeItem(k: string) {
    this.data.delete(k);
  }
  setItem(k: string, v: string) {
    this.data.set(k, String(v));
  }
}
const realSession = globalThis.sessionStorage;
const useTab = (tab: unknown) => Object.defineProperty(globalThis, 'sessionStorage', { value: tab, configurable: true, writable: true });

describe('mỗi tab một phiên đăng nhập (sessionStorage)', () => {
  afterEach(() => {
    useTab(realSession);
    localStorage.removeItem(TOKEN_KEY);
  });

  test('đăng nhập barista ở tab 2 không đổi phiên khách ở tab 1 (reload tab 1 vẫn là khách)', () => {
    const tab1 = new TabStorage();
    const tab2 = new TabStorage();
    useTab(tab1);
    saveToken(fakeJwt({ sub: 'u1', email: 'demo@brewlite.vn', role: 'CUSTOMER' }));
    useTab(tab2);
    saveToken(fakeJwt({ sub: 'b1', email: 'barista@brewlite.vn', role: 'BARISTA' }));
    useTab(tab1); // reload tab 1 = đọc lại token của tab 1
    expect(roleFromToken(getToken())).toBe('CUSTOMER');
    useTab(tab2);
    expect(roleFromToken(getToken())).toBe('BARISTA');
  });

  test('clearToken chỉ đăng xuất tab hiện tại', () => {
    const tab1 = new TabStorage();
    const tab2 = new TabStorage();
    useTab(tab1);
    saveToken(fakeJwt({ sub: 'u1', role: 'CUSTOMER' }));
    useTab(tab2);
    saveToken(fakeJwt({ sub: 'b1', role: 'BARISTA' }));
    clearToken();
    expect(getToken()).toBeNull();
    useTab(tab1);
    expect(roleFromToken(getToken())).toBe('CUSTOMER');
  });

  test('saveToken dọn token kiểu cũ còn trong localStorage (trước đây dùng chung mọi tab)', () => {
    localStorage.setItem(TOKEN_KEY, 'old-shared-token');
    useTab(new TabStorage());
    saveToken(fakeJwt({ sub: 'u1', role: 'CUSTOMER' }));
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });
});

describe('sessionFromToken', () => {
  test('đọc email và role từ JWT', () => {
    expect(sessionFromToken(fakeJwt({ sub: 'u1', email: 'demo@brewlite.vn', role: 'ADMIN' }))).toEqual({ email: 'demo@brewlite.vn', role: 'ADMIN' });
  });

  test('thiếu email → chuỗi rỗng; role lạ → CUSTOMER; token hỏng → null', () => {
    expect(sessionFromToken(fakeJwt({ sub: 'u1', role: 'ROOT' }))).toEqual({ email: '', role: 'CUSTOMER' });
    expect(sessionFromToken('abc')).toBeNull();
    expect(sessionFromToken(null)).toBeNull();
  });

  test('nhãn vai trò tiếng Việt cho header', () => {
    expect(ROLE_LABEL).toEqual({ CUSTOMER: 'Khách', BARISTA: 'Quầy', ADMIN: 'Quản trị' });
  });
});
```

- [x] **Step 3: Chạy cho thấy đỏ.**

Run: `cd frontend && npx vitest run src/lib/auth.test.ts`
Expected: FAIL, `saveToken is not a function` (chưa export).

- [x] **Step 4: Viết lại `frontend/src/lib/auth.ts`:**

```ts
// ============================================================
// FEATURE: Phiên đăng nhập của tab + vai trò phía FE (mở rộng §3.2). Role chỉ để điều hướng / ẩn hiện;
// quyền thật do backend chặn (JwtAuthGuard + RolesGuard).
// ============================================================

export type Role = 'CUSTOMER' | 'BARISTA' | 'ADMIN';

export const TOKEN_KEY = 'brewlite-token';

export const ROLE_LABEL: Record<Role, string> = { CUSTOMER: 'Khách', BARISTA: 'Quầy', ADMIN: 'Quản trị' };

// Mỗi tab một phiên: token nằm trong sessionStorage của tab. localStorage dùng chung mọi tab cùng origin nên
// đăng nhập barista ở tab 2 từng ghi đè phiên khách ở tab 1. Reload vẫn giữ phiên; tab mở mới bằng URL phải đăng nhập lại.
const tabStore = (): Storage | null => (typeof sessionStorage !== 'undefined' ? sessionStorage : null);

export const getToken = (): string | null => tabStore()?.getItem(TOKEN_KEY) ?? null;

export function saveToken(token: string): void {
  tabStore()?.setItem(TOKEN_KEY, token);
  // dọn token kiểu cũ (dùng chung mọi tab) còn sót từ bản trước
  if (typeof localStorage !== 'undefined') localStorage.removeItem(TOKEN_KEY);
}

export function clearToken(): void {
  tabStore()?.removeItem(TOKEN_KEY);
}

export interface SessionInfo {
  email: string;
  role: Role;
}

export function sessionFromToken(token: string | null): SessionInfo | null {
  const part = token?.split('.')[1];
  if (!part) return null;
  try {
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(part.length / 4) * 4, '=');
    const payload = JSON.parse(atob(b64));
    const role: Role = payload.role === 'BARISTA' || payload.role === 'ADMIN' ? payload.role : 'CUSTOMER';
    return { email: typeof payload.email === 'string' ? payload.email : '', role };
  } catch {
    return null;
  }
}

export const roleFromToken = (token: string | null): Role | null => sessionFromToken(token)?.role ?? null;

const HOME: Record<Role, string> = { CUSTOMER: '/', BARISTA: '/barista', ADMIN: '/admin' };
export const homeFor = (role: Role): string => HOME[role];
```

- [x] **Step 5: Trang login ghi token qua `saveToken()`.** Trong `frontend/src/app/login/page.tsx` đổi dòng import:

```ts
import { homeFor, roleFromToken, saveToken } from '@/lib/auth';
```

và dòng 33 `localStorage.setItem(TOKEN_KEY, data.accessToken);` thành:

```ts
        saveToken(data.accessToken);
```

- [x] **Step 6: Test gateway dùng `saveToken()` / `clearToken()`.** Trong `frontend/src/lib/payment/api-gateway.test.ts`, thêm import `import { clearToken, saveToken } from '../auth';`, đổi `localStorage.removeItem('brewlite-token');` trong `afterEach` thành `clearToken();`, đổi `localStorage.setItem('brewlite-token', 'tok-1');` thành `saveToken('tok-1');`.

- [x] **Step 7: Chạy cho thấy xanh.**

Run: `cd frontend && npx vitest run && npx tsc --noEmit`
Expected: PASS, 100 test (94 + 6), tsc không lỗi.

- [x] **Step 8: Tài liệu.** Trong `docs/user-sequence-specifications.md`:
  - §2.3 sơ đồ, thay `    FE -> FE : Lưu mã Token vào localStorage (key "brewlite-token")` bằng `    FE -> FE : Lưu mã Token vào sessionStorage của tab (key "brewlite-token"):\nmỗi tab một phiên, tab khác không bị ghi đè`.
  - §2.3 mục C, thêm sau gạch "Vai trò (`User.role`)": `* **Phiên đăng nhập theo tab:** token lưu ở `sessionStorage` (`saveToken()` / `getToken()` / `clearToken()` trong `frontend/src/lib/auth.ts`): đăng nhập barista ở tab này không đổi phiên khách ở tab khác, reload vẫn giữ, tab mở mới bằng URL phải đăng nhập lại. Test: `frontend/src/lib/auth.test.ts`.`
  - §2.6 sơ đồ, thay `alt Chưa đăng nhập (không có token "brewlite-token")` bằng `alt Chưa đăng nhập trong tab này (sessionStorage không có "brewlite-token")`.
  - `README.md`, sau bước 4 của mục "Demo end-to-end", thêm đoạn: `Demo khách và quầy cùng lúc: mỗi tab trình duyệt giữ phiên đăng nhập riêng (token nằm trong sessionStorage của tab). Tab 1 đăng nhập khách, tab 2 đăng nhập barista; reload tab nào cũng giữ đúng tài khoản của tab đó. Tab mở mới bằng cách gõ URL phải đăng nhập lại; "Nhân bản tab" của trình duyệt mang theo phiên của tab gốc.`
- [x] **Step 9:** Render lại khối PlantUML §2.3 và §2.6, mở PNG kiểm.
- [x] **Step 10: Commit.**

```bash
git add frontend/src/lib/auth.ts frontend/src/lib/auth.test.ts frontend/vitest.setup.ts frontend/src/app/login/page.tsx frontend/src/lib/payment/api-gateway.test.ts docs/user-sequence-specifications.md README.md
git commit -m "fix(frontend): moi tab mot phien dang nhap (token o sessionStorage)"
```

---

### Task 2: Giữ đơn đang thanh toán dở khi reload hoặc quay lại giỏ

**Files:**
- Create: `frontend/src/lib/payment/checkout-session.ts`
- Test: `frontend/src/lib/payment/checkout-session.test.ts`
- Modify: `frontend/src/lib/payment/types.ts` (`PaymentError`)
- Modify: `frontend/src/lib/payment/api-gateway.ts` (các `throw new PaymentError`)
- Modify: `frontend/src/lib/payment/api-gateway.test.ts` (thêm 1 test)
- Modify: `frontend/src/components/PaymentForm.tsx:6,30-37,42-60`
- Modify: `frontend/src/app/login/page.tsx` (bỏ phiên thanh toán khi đăng nhập)
- Docs: `docs/user-sequence-specifications.md` (§2.3 sơ đồ, §2.4 dòng 309, 429, 453, mục C dòng 474, §2.5 dòng 495), `docs/develop-status-report.md:111,123`

**Interfaces:**
- Consumes: `newIdempotencyKey()`, `CartLine`, `PaymentError` từ `./types`.
- Produces: `CHECKOUT_KEY = 'brewlite-checkout'`, `interface CheckoutState { cart: string; orderKey: string; payKey: string; orderId?: string }`, `cartFingerprint(items: CartLine[]): string`, `loadCheckout(items: CartLine[]): CheckoutState`, `rememberOrder(orderId: string): void`, `clearCheckout(): void`, `dropsCheckout(e: unknown): boolean`; `PaymentError(message: string, orderId?: string, status?: number, detail?: string)`.

- [x] **Step 1: Viết test đỏ** `frontend/src/lib/payment/checkout-session.test.ts`:

```ts
import { afterEach, describe, expect, test } from 'vitest';
import { CHECKOUT_KEY, cartFingerprint, clearCheckout, dropsCheckout, loadCheckout, rememberOrder } from './checkout-session';
import { PaymentError } from './types';

const cart = [
  { productId: 'p1', quantity: 2, size: 'L', toppings: ['Trân châu', 'Kem cheese'] },
  { productId: 'p2', quantity: 1 },
];

afterEach(() => sessionStorage.clear());

describe('loadCheckout (phiên thanh toán của tab)', () => {
  test('cùng giỏ → cùng phiên: reload hoặc quay lại giỏ vẫn giữ 2 key và mã đơn', () => {
    const a = loadCheckout(cart);
    rememberOrder('order-1');
    const b = loadCheckout(cart); // = sau reload: đọc lại từ sessionStorage
    expect(b).toEqual({ ...a, orderId: 'order-1' });
    expect(a.orderKey).not.toBe(a.payKey);
  });

  test('đổi thứ tự dòng hoặc thứ tự topping vẫn là cùng giỏ', () => {
    const a = loadCheckout(cart);
    const b = loadCheckout([{ productId: 'p2', quantity: 1 }, { productId: 'p1', quantity: 2, size: 'L', toppings: ['Kem cheese', 'Trân châu'] }]);
    expect(b.payKey).toBe(a.payKey);
  });

  test('giỏ đổi (số lượng khác) → phiên mới: key mới, không mang mã đơn cũ', () => {
    const a = loadCheckout(cart);
    rememberOrder('order-1');
    const b = loadCheckout([{ ...cart[0], quantity: 3 }, cart[1]]);
    expect(b.orderId).toBeUndefined();
    expect(b.payKey).not.toBe(a.payKey);
    expect(b.orderKey).not.toBe(a.orderKey);
  });

  test('clearCheckout → lần sau là phiên mới', () => {
    const a = loadCheckout(cart);
    clearCheckout();
    expect(loadCheckout(cart).payKey).not.toBe(a.payKey);
  });

  test('dữ liệu hỏng trong sessionStorage → phiên mới, không ném lỗi', () => {
    sessionStorage.setItem(CHECKOUT_KEY, '{oops');
    expect(loadCheckout(cart).cart).toBe(cartFingerprint(cart));
  });
});

describe('dropsCheckout (bỏ đơn đang giữ khi chắc chắn không trả tiếp được)', () => {
  test.each([
    ['mất kết nối (chưa biết kết quả)', new PaymentError('x', 'o1'), false],
    ['lỗi máy chủ 5xx', new PaymentError('x', 'o1', 500, 'db down'), false],
    ['cổng từ chối', new PaymentError('x', 'o1', 400, 'Payment failed'), false],
    ['kẹt kho, đã hoàn tiền', new PaymentError('x', 'o1', 409, 'Out of stock'), false],
    ['cần đăng nhập lại', new PaymentError('x', 'o1', 401), false],
    ['đơn đã hủy hoặc đang pha', new PaymentError('x', 'o1', 400, 'Invalid transition CANCELLED -> PAID'), true],
    ['đơn của tài khoản khác', new PaymentError('x', 'o1', 403), true],
    ['đơn không còn', new PaymentError('x', 'o1', 404, 'Order not found'), true],
    ['key đã dùng cho đơn khác', new PaymentError('x', 'o1', 422), true],
    ['lỗi tạo đơn 400 (chưa có đơn)', new PaymentError('x', undefined, 400, 'Unknown topping: x'), false],
    ['lỗi không phải PaymentError', new Error('x'), false],
  ])('%s → %s', (_name, e, expected) => {
    expect(dropsCheckout(e)).toBe(expected);
  });
});
```

Thêm vào `describe('ApiPaymentGateway retry', …)` trong `frontend/src/lib/payment/api-gateway.test.ts`:

```ts
  test('PaymentError mang mã HTTP và message backend để giao diện quyết định giữ hay bỏ đơn đang trả dở', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(json(400, { message: 'Payment failed' }))
      .mockResolvedValueOnce(json(400, { message: 'Invalid transition CANCELLED -> PAID' }))
      .mockRejectedValueOnce(new TypeError('Failed to fetch'));
    vi.stubGlobal('fetch', fetchMock);
    const gw = new ApiPaymentGateway();
    const req = { amount: 1, method: 'WALLET' as const, idempotencyKey: 'k', orderId: 'o1' };
    expect(await gw.pay(req).catch((e) => e)).toMatchObject({ orderId: 'o1', status: 400, detail: 'Payment failed' });
    expect(await gw.pay(req).catch((e) => e)).toMatchObject({ status: 400, detail: 'Invalid transition CANCELLED -> PAID' });
    const net = await gw.pay(req).catch((e) => e);
    expect(net).toBeInstanceOf(PaymentError);
    expect(net.status).toBeUndefined();
  });
```

- [x] **Step 2: Chạy cho thấy đỏ.**

Run: `cd frontend && npx vitest run src/lib/payment`
Expected: FAIL, không import được `./checkout-session`; test gateway mới đỏ vì `status` là `undefined`.

- [x] **Step 3: `PaymentError` mang mã HTTP.** Trong `frontend/src/lib/payment/types.ts`, thay class `PaymentError` và comment phía trên bằng:

```ts
/**
 * Lỗi thanh toán. `orderId`: đơn đã tạo → lần thử lại trả tiếp đơn này (UC06 KB1), không tạo đơn mới.
 * `status`: mã HTTP (không có khi mất kết nối); `detail`: message gốc của backend. PaymentForm dùng hai trường này
 * (`dropsCheckout()`) để quyết định giữ hay bỏ đơn đang trả dở.
 */
export class PaymentError extends Error {
  constructor(
    message: string,
    readonly orderId?: string,
    readonly status?: number,
    readonly detail?: string,
  ) {
    super(message);
    this.name = 'PaymentError';
  }
}
```

- [x] **Step 4: Gateway điền `status` và `detail`.** Trong `frontend/src/lib/payment/api-gateway.ts`:
  - `createOrderId()`: thay 2 dòng xử lý 401 và `!res.ok` bằng

```ts
    if (res.status === 401) throw new PaymentError('Bạn cần đăng nhập trước khi đặt đơn (thiếu JWT).', undefined, 401);
    if (!res.ok) throw new PaymentError(`Tạo đơn thất bại (mã ${res.status}). Giỏ hàng được giữ nguyên.`, undefined, res.status, await readMessage(res));
```

  - `pay()`: thay 3 nhánh 401, 403, `!res.ok` bằng

```ts
    if (res.status === 401) throw new PaymentError('Bạn cần đăng nhập trước khi thanh toán (thiếu hoặc hết hạn JWT). Giỏ hàng được giữ nguyên.', orderId, 401);
    if (res.status === 403) throw new PaymentError('Bạn không có quyền thanh toán đơn này (đơn thuộc tài khoản khác). Giỏ hàng được giữ nguyên.', orderId, 403);
    if (!res.ok) {
      // Lỗi -> UI giữ giỏ (US-05). Backend trả JSON { message, ... }: chỉ lấy message, không đẩy JSON thô lên UI.
      const detail = await readMessage(res);
      throw new PaymentError(paymentErrorMessage(res.status, detail), orderId, res.status, detail);
    }
```

- [x] **Step 5: Tạo `frontend/src/lib/payment/checkout-session.ts`:**

```ts
import { PaymentError, newIdempotencyKey, type CartLine } from './types';

// ============================================================
// FEATURE: Phiên thanh toán của tab (UC06 KB1 + phương án A): mã đơn + key tạo đơn + key trả tiền,
// gắn với đúng nội dung giỏ. Lưu sessionStorage nên reload, hoặc "Quay lại giỏ" rồi vào lại, vẫn trả tiếp
// đúng đơn đó với đúng key (không tạo đơn mới, không trừ tiền 2 lần). Giỏ đổi thì bỏ, tạo phiên mới.
// ============================================================

export const CHECKOUT_KEY = 'brewlite-checkout';

export interface CheckoutState {
  /** Dấu vân tay giỏ (cartFingerprint) lúc tạo phiên. */
  cart: string;
  orderKey: string;
  payKey: string;
  orderId?: string;
}

const tabStore = (): Storage | null => (typeof sessionStorage !== 'undefined' ? sessionStorage : null);

/** Dấu vân tay nội dung giỏ: chỉ các trường gửi POST /orders, không phụ thuộc thứ tự dòng hay thứ tự topping. */
export function cartFingerprint(items: CartLine[]): string {
  const lines = items.map((i) => JSON.stringify([i.productId, i.quantity, i.size ?? '', [...(i.toppings ?? [])].sort()]));
  return JSON.stringify(lines.sort());
}

function read(): CheckoutState | null {
  try {
    const raw = tabStore()?.getItem(CHECKOUT_KEY);
    return raw ? (JSON.parse(raw) as CheckoutState) : null;
  } catch {
    return null;
  }
}

/** Phiên thanh toán cho giỏ này: dùng lại phiên đã lưu nếu cùng giỏ, không thì tạo phiên mới (2 key mới) và lưu. */
export function loadCheckout(items: CartLine[]): CheckoutState {
  const cart = cartFingerprint(items);
  const saved = read();
  if (saved && saved.cart === cart) return saved;
  const fresh: CheckoutState = { cart, orderKey: newIdempotencyKey(), payKey: newIdempotencyKey() };
  tabStore()?.setItem(CHECKOUT_KEY, JSON.stringify(fresh));
  return fresh;
}

/** Ghi lại mã đơn đã tạo để lần thử lại (kể cả sau reload) trả tiếp đúng đơn này. */
export function rememberOrder(orderId: string): void {
  const saved = read();
  if (saved) tabStore()?.setItem(CHECKOUT_KEY, JSON.stringify({ ...saved, orderId }));
}

export function clearCheckout(): void {
  tabStore()?.removeItem(CHECKOUT_KEY);
}

/**
 * Lỗi cho thấy đơn đang giữ không trả tiếp được: bỏ phiên, lần bấm sau tạo đơn mới với key mới.
 * Giữ phiên khi chưa biết kết quả (mất kết nối, 5xx), khi cổng từ chối (400 "Payment failed"),
 * khi kẹt kho đã hoàn tiền (409) hoặc khi cần đăng nhập lại (401).
 */
export function dropsCheckout(e: unknown): boolean {
  if (!(e instanceof PaymentError) || e.status === undefined) return false;
  if (e.status === 403 || e.status === 404 || e.status === 422) return true;
  return e.status === 400 && e.orderId !== undefined && e.detail !== 'Payment failed';
}
```

- [x] **Step 6: `PaymentForm` dùng phiên thanh toán.** Trong `frontend/src/components/PaymentForm.tsx`:
  - dòng import `@/lib/payment` bỏ `newIdempotencyKey`; thêm `import { clearCheckout, dropsCheckout, loadCheckout, rememberOrder } from '@/lib/payment/checkout-session';`
  - thay khối từ comment "Đơn đã tạo ở lần trả lỗi trước…" tới `const [payKey] = useState(newIdempotencyKey);` bằng

```tsx
  // Phiên thanh toán của tab (lib/payment/checkout-session.ts): mã đơn + key tạo đơn + key trả tiền, gắn với nội dung giỏ.
  // Reload, hoặc quay lại giỏ rồi vào lại mà giỏ không đổi, vẫn trả tiếp đúng đơn đó với cùng key (UC06 KB1, phương án A).
  const [checkout, setCheckout] = useState(() => loadCheckout(items));
  const [orderId, setOrderId] = useState<string | undefined>(checkout.orderId);
```

  - thay thân `try { … } catch (e) { … }` trong `handleConfirm` bằng

```tsx
    try {
      const result = await getPaymentGateway().pay({
        amount: final,
        method,
        idempotencyKey: checkout.payKey,
        ...(orderId ? { orderId } : { items, orderIdempotencyKey: checkout.orderKey }),
        ...(applied ? { voucherCode: applied } : {}),
      });
      clearCheckout();
      onSuccess(result);
    } catch (e) {
      if (dropsCheckout(e)) {
        // đơn đang giữ không trả tiếp được (đã hủy, đang pha, của tài khoản khác…): lần bấm sau tạo đơn mới
        clearCheckout();
        setCheckout(loadCheckout(items));
        setOrderId(undefined);
      } else if (e instanceof PaymentError && e.orderId) {
        rememberOrder(e.orderId);
        setOrderId(e.orderId);
      }
      setError(e instanceof Error ? e.message : 'Thanh toán thất bại, vui lòng thử lại.');
    } finally {
```

- [x] **Step 7: Đăng nhập bỏ phiên thanh toán của tài khoản trước.** Trong `frontend/src/app/login/page.tsx` thêm `import { clearCheckout } from '@/lib/payment/checkout-session';` và ngay sau `saveToken(data.accessToken);`:

```ts
        clearCheckout(); // tài khoản mới trong tab: bỏ đơn đang trả dở của phiên trước
```

- [x] **Step 8: Chạy cho thấy xanh.**

Run: `cd frontend && npx vitest run && npx tsc --noEmit`
Expected: PASS, 117 test (100 + 16 + 1), tsc không lỗi.

- [x] **Step 9: Tài liệu.** Trong `docs/user-sequence-specifications.md`:
  - §2.3 sơ đồ, ngay sau dòng lưu token (đã sửa ở Task 1), thêm `    FE -> FE : Bỏ đơn đang thanh toán dở của tab (clearCheckout)`.
  - §2.4 dòng 309, thay cả gạch "Thử lại sau khi lỗi" bằng: `   - **Thử lại sau khi lỗi:** giao diện giữ `orderId` của đơn vừa tạo cùng 2 key (`orderKey`, `payKey`) trong `sessionStorage` của tab, gắn với nội dung giỏ, nên lần bấm tiếp theo **chỉ gọi `POST /payments`** với `orderId` cũ và **cùng key trả tiền** (UC06 KB1), không tạo đơn mới, kể cả sau khi reload hoặc quay lại giỏ rồi vào lại (giỏ không đổi). Dùng lại key an toàn vì lần trả lỗi không lưu key (xem mục C). Giỏ đổi, hoặc backend báo đơn không trả tiếp được (400 sai trạng thái, 403, 404, 422), thì bỏ phiên đó và tạo đơn mới.`
  - §2.4 sơ đồ dòng 429, thay `FE -> FE : Giữ orderId #1042 để lần thử lại\nchỉ gọi POST /payments (cùng key)` bằng `FE -> FE : Lưu orderId #1042 + 2 key vào sessionStorage\n(theo giỏ): thử lại, kể cả sau reload,\nchỉ gọi POST /payments (cùng key)`.
  - §2.4 sơ đồ dòng 453, thay `FE -> FE : Giữ orderId #1042 để thử lại` bằng `FE -> FE : Lưu orderId #1042 + 2 key vào sessionStorage để thử lại`.
  - §2.4 mục C dòng 474, thay cả gạch "Thứ tự gọi ở Frontend" bằng: `* **Thứ tự gọi ở Frontend:** `PaymentForm` → `ApiPaymentGateway.pay()` gọi `POST /orders` rồi `POST /payments` trong cùng một lần bấm "Xác nhận trả". Lỗi ném `PaymentError` mang `orderId` (khi đơn đã tạo), mã HTTP (`status`, không có khi mất kết nối) và message backend (`detail`). Phiên thanh toán của tab nằm ở `frontend/src/lib/payment/checkout-session.ts`: `loadCheckout(items)` trả `{ orderKey, payKey, orderId? }` lưu `sessionStorage` (key `brewlite-checkout`) theo dấu vân tay giỏ (`cartFingerprint`), nên reload hoặc quay lại giỏ rồi vào lại mà giỏ không đổi vẫn trả tiếp đúng đơn với đúng `payKey`; `rememberOrder()` ghi `orderId`; trả xong, đăng nhập hoặc đăng xuất thì `clearCheckout()`. `dropsCheckout(e)` bỏ phiên khi đơn đang giữ không trả tiếp được (400 khác "Payment failed", 403, 404, 422), giữ phiên khi mất kết nối, 5xx, 400 "Payment failed", 401, 409. Test: `frontend/src/lib/payment/checkout-session.test.ts`, `frontend/src/lib/payment/api-gateway.test.ts`.`
  - §2.5 dòng 495, trong Kịch bản 1 thay `Màn Thanh toán vẫn mở và giữ `orderId` của đơn lỗi;` bằng `Màn Thanh toán giữ `orderId` của đơn lỗi (lưu `sessionStorage` của tab, nên reload hoặc quay lại giỏ rồi vào lại mà giỏ không đổi vẫn giữ);`.
  - `docs/develop-status-report.md` dòng 111, thay câu `Còn lại: rời màn thanh toán hoặc reload thì mất `orderId` và key (chưa lưu `sessionStorage`).` bằng `Reload hoặc rời màn rồi vào lại (giỏ không đổi) nay cũng giữ được `orderId` và key: plan `docs/planning/2026-10-09-demo-session-plan.md` Task 2.`; dòng 123 bỏ vế `; lưu `orderId` và key vào `sessionStorage` để cứu cả trường hợp reload`.
- [x] **Step 10:** Render lại khối PlantUML §2.3, §2.4, §2.5, mở PNG kiểm.
- [x] **Step 11: Commit.**

```bash
git add frontend/src/lib/payment/checkout-session.ts frontend/src/lib/payment/checkout-session.test.ts frontend/src/lib/payment/types.ts frontend/src/lib/payment/api-gateway.ts frontend/src/lib/payment/api-gateway.test.ts frontend/src/components/PaymentForm.tsx frontend/src/app/login/page.tsx docs/user-sequence-specifications.md docs/develop-status-report.md
git commit -m "feat(frontend): giu don dang thanh toan do qua reload (sessionStorage theo gio)"
```

---

### Task 3: Header hiện tài khoản của tab và nút Đăng xuất

**Files:**
- Modify: `frontend/src/components/Header.tsx` (thay cả file)
- Docs: `docs/user-sequence-specifications.md` (§2.3 sơ đồ thêm luồng đăng xuất, §2.3 mục C)

**Interfaces:**
- Consumes: `getToken`, `clearToken`, `sessionFromToken`, `SessionInfo`, `ROLE_LABEL` (Task 1); `clearCheckout` (Task 2).

Header dùng `useRouter` của Next nên không render được trong vitest môi trường `node`. Logic đã có test ở Task 1 (`sessionFromToken`, `ROLE_LABEL`) và Task 2 (`clearCheckout`); phần hiển thị kiểm bằng mắt ở Task 6.

- [x] **Step 1: Viết lại `frontend/src/components/Header.tsx`:**

```tsx
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type CSSProperties } from 'react';
import { ROLE_LABEL, clearToken, getToken, sessionFromToken, type SessionInfo } from '@/lib/auth';
import { clearCheckout } from '@/lib/payment/checkout-session';
import { useCart } from '@/store/cart';

// FEATURE: App header — logo + badge tổng số ly trong giỏ + link Quầy/Kho theo vai trò (chỉ ẩn/hiện, server mới chặn quyền)
// + tài khoản đang đăng nhập của TAB này (mỗi tab một phiên, xem lib/auth.ts) và nút Đăng xuất.
export default function Header() {
  const count = useCart((s) => s.count);
  // Header nằm trong layout: App Router không mount lại layout sau router.push('/barista'),
  // nên đọc lại phiên mỗi lần đổi trang (không thì phải F5 mới thấy tài khoản / link Quầy, Kho sau khi đăng nhập).
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<SessionInfo | null>(null);
  useEffect(() => setSession(sessionFromToken(getToken())), [pathname]);
  const role = session?.role ?? null;

  // Chỉ đăng xuất tab này; bỏ luôn đơn đang thanh toán dở của tab
  function logout() {
    clearToken();
    clearCheckout();
    setSession(null);
    router.push('/login');
  }

  return (
    <header style={styles.bar}>
      <Link href="/" style={styles.brand}>
        BrewLite ☕
      </Link>
      <nav style={styles.nav}>
        <Link href="/" style={styles.link}>
          Menu
        </Link>
        {(role === 'BARISTA' || role === 'ADMIN') && (
          <Link href="/barista" style={styles.link}>
            Quầy
          </Link>
        )}
        {role === 'ADMIN' && (
          <Link href="/admin" style={styles.link}>
            Kho
          </Link>
        )}
        <Link href="/history" style={styles.link}>
          Lịch sử
        </Link>
        {session ? (
          <>
            <span style={styles.who} title={session.email}>
              {session.email || 'Đã đăng nhập'} · {ROLE_LABEL[session.role]}
            </span>
            <button type="button" onClick={logout} style={styles.logout}>
              Đăng xuất
            </button>
          </>
        ) : (
          <Link href="/login" style={styles.link}>
            Đăng nhập
          </Link>
        )}
        <Link href="/cart" style={styles.cartLink}>
          Xem giỏ hàng
          <span style={styles.badge} aria-label={`${count} món trong giỏ`}>
            {count}
          </span>
        </Link>
      </nav>
    </header>
  );
}

const styles: Record<string, CSSProperties> = {
  bar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 20px',
    borderBottom: '1px solid #e5e7eb',
    background: '#fff',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  brand: { fontWeight: 800, fontSize: 20, textDecoration: 'none', color: '#065f46' },
  nav: { display: 'flex', gap: 16, alignItems: 'center' },
  link: { textDecoration: 'none', color: '#111827', fontWeight: 600 },
  who: { fontSize: 13, color: '#374151' },
  logout: { background: 'transparent', border: '1px solid #d1d5db', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontWeight: 600 },
  cartLink: {
    position: 'relative',
    textDecoration: 'none',
    color: '#fff',
    background: '#065f46',
    padding: '8px 14px',
    borderRadius: 8,
    fontWeight: 700,
    paddingRight: 44,
  },
  badge: {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: 'translateY(-50%)',
    background: '#fff',
    color: '#065f46',
    borderRadius: 999,
    minWidth: 24,
    height: 24,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 13,
    fontWeight: 800,
    padding: '0 6px',
  },
};
```

- [x] **Step 2: Chạy.**

Run: `cd frontend && npx tsc --noEmit && npx vitest run`
Expected: tsc không lỗi; vitest 117 pass.

- [x] **Step 3: Tài liệu.** Trong `docs/user-sequence-specifications.md`:
  - §2.3 sơ đồ, chèn trước `@enduml` (sau `deactivate FE` cuối luồng 2):

```
== LUỒNG 3: ĐĂNG XUẤT (chỉ ở giao diện, không gọi API) ==
User -> FE : Bấm "Đăng xuất" trên header
activate FE
FE -> FE : Xóa token và đơn đang thanh toán dở của tab (sessionStorage)
FE --> User : Về trang Đăng nhập (tab khác giữ nguyên phiên)
deactivate FE
```

  - §2.3 mục C, thêm sau gạch "Phiên đăng nhập theo tab": `* **Header và Đăng xuất:** `frontend/src/components/Header.tsx` hiện email + nhãn vai trò (`ROLE_LABEL`: Khách / Quầy / Quản trị) của tab, đọc lại mỗi lần đổi trang; "Đăng xuất" gọi `clearToken()` + `clearCheckout()` rồi về `/login`, chỉ tab đó bị đăng xuất. JWT không bị thu hồi ở backend (stateless, hết hạn sau 7 ngày).`
- [x] **Step 4:** Render lại khối PlantUML §2.3, mở PNG kiểm.
- [x] **Step 5: Commit.**

```bash
git add frontend/src/components/Header.tsx docs/user-sequence-specifications.md
git commit -m "feat(frontend): header hien tai khoan cua tab va nut Dang xuat"
```

---

### Task 4: Dữ liệu demo giữ qua các lần khởi động (seed không xóa đơn, không đặt lại kho)

**Files:**
- Modify: `backend/prisma/seed.ts` (thay cả file)
- Test: `backend/test/seed-images.spec.ts` (thay test `order-1042`)
- Docs: `README.md:89`, `docs/user-sequence-specifications.md:824` (§2.8), `.claude/rules/doc-code-sync.md:42`

- [x] **Step 1: Viết test đỏ.** Trong `backend/test/seed-images.spec.ts`: xóa dòng `import { SIZE_UPCHARGE, Size } from '../src/order/pricing';`; thay cả test `'order-1042: total = giá Latte + phụ thu size theo bảng giá (order/pricing.ts)'` bằng

```ts
  // Dữ liệu demo giữ qua các lần khởi động: seed chạy mỗi lần container backend lên (CMD của backend/Dockerfile),
  // nên không được xóa / tạo đơn, biên lai, cũng không đặt lại tồn kho hay điểm thưởng của dữ liệu đã có
  test('seed không đụng đơn / biên lai và không đặt lại tồn kho của món đã có', () => {
    expect(src).not.toMatch(/db\.(order|orderItem|payment)\./);
    const updates = [...src.matchAll(/update:\s*\{([^}]*)\}/g)].map((m) => m[1]);
    expect(updates.length).toBeGreaterThan(0);
    for (const u of updates) expect(u).not.toMatch(/\b(stock|version|loyaltyPoints)\b/);
  });
```

- [x] **Step 2: Chạy cho thấy đỏ.**

Run: `cd backend && npx jest seed-images`
Expected: FAIL. Seed hiện có `db.order.` và `stock` trong `update`.

- [x] **Step 3: Viết lại `backend/prisma/seed.ts`:**

```ts
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

// Seed chạy mỗi lần container backend khởi động (CMD của backend/Dockerfile) nên chỉ TẠO dữ liệu còn thiếu:
// 3 tài khoản demo (mật khẩu demo được đặt lại), 4 món (tồn kho 10 chỉ khi tạo mới). Không đụng đơn, biên lai,
// điểm thưởng hay tồn kho đã có: lịch sử demo giữ qua các lần khởi động lại.
async function main() {
  const db = new PrismaClient();
  try {
    await db.user.upsert({
      where: { id: 'u1' },
      create: { id: 'u1', email: 'demo@brewlite.vn', passwordHash: await bcrypt.hash('demo1234', 10), loyaltyPoints: 0, role: 'CUSTOMER' },
      update: { email: 'demo@brewlite.vn', passwordHash: await bcrypt.hash('demo1234', 10), role: 'CUSTOMER' },
    });
    // Mở rộng ngoài đề (§3.2): tài khoản quầy + quản trị cho demo /barista, /admin
    for (const s of [
      { id: 'staff-barista', email: 'barista@brewlite.vn', password: 'barista1234', role: 'BARISTA' },
      { id: 'staff-admin', email: 'admin@brewlite.vn', password: 'admin1234', role: 'ADMIN' },
    ]) {
      const passwordHash = await bcrypt.hash(s.password, 10);
      // upsert theo email (unique): DB cũ đã có sẵn email này dưới id khác thì update thay vì lỗi P2002 làm container không khởi động
      await db.user.upsert({
        where: { email: s.email },
        create: { id: s.id, email: s.email, passwordHash, role: s.role, loyaltyPoints: 0 },
        update: { email: s.email, passwordHash, role: s.role },
      });
    }
    // imageUrl: SVG tĩnh trong frontend/public/images (đề §8 Task 2 cần ảnh). update chỉ ghi ảnh để DB cũ có ảnh,
    // không đặt lại tồn kho: số đã bán và số Admin chỉnh giữ qua các lần khởi động
    for (const p of [
      { id: 'p1', name: 'Latte', price: 35000, imageUrl: '/images/latte.svg' },
      { id: 'p2', name: 'Americano', price: 40000, imageUrl: '/images/americano.svg' },
      { id: 'p3', name: 'Cappuccino', price: 45000, imageUrl: '/images/cappuccino.svg' },
      { id: 'p4', name: 'Trà đào', price: 39000, imageUrl: '/images/tra-dao.svg' },
    ]) {
      await db.product.upsert({
        where: { id: p.id },
        create: { ...p, stock: 10, version: 1 },
        update: { imageUrl: p.imageUrl },
      });
    }
    console.log('seeded: u1 (CUSTOMER), staff-barista, staff-admin, p1..p4 (tồn kho 10 khi tạo mới); giữ nguyên đơn và tồn kho đã có');
  } finally {
    await db.$disconnect();
  }
}

main();
```

- [x] **Step 4: Chạy cho thấy xanh.**

Run: `cd backend && npx jest seed-images && npx jest && npx tsc --noEmit`
Expected: PASS; toàn bộ backend 122 pass / 2 skip (thay 1 test bằng 1 test); tsc không lỗi.

- [x] **Step 5: Tài liệu.**
  - `README.md` dòng 89, thay cả gạch "Seed chạy lại mỗi lần container backend khởi động." bằng: `- **Seed chạy lại mỗi lần container backend khởi động.** Nó tạo lại `barista@brewlite.vn` / `admin@brewlite.vn` với đúng mật khẩu ghi ở bảng trên (mật khẩu đã đổi sẽ bị đặt lại khi khởi động lại). Seed chỉ tạo tài khoản và món còn thiếu: đơn, biên lai, điểm thưởng và tồn kho đã có được giữ qua các lần khởi động lại (làm lại từ đầu: xem mục "Dữ liệu demo"). Chỉ phù hợp cho demo.`
  - `docs/user-sequence-specifications.md` dòng 824 (§2.8 mục A), thay cả gạch "Seed đặt lại kho" bằng: `* **Tồn kho giữ qua các lần khởi động:** `seed.ts` chỉ đặt tồn kho 10 khi tạo món mới; món đã có giữ nguyên số Admin chỉnh và số đã bán sau khi container backend khởi động lại.`
  - `.claude/rules/doc-code-sync.md` dòng 42, thay `(seed đặt lại mật khẩu và tồn kho mỗi lần backend khởi động)` bằng `(seed đặt lại mật khẩu demo mỗi lần backend khởi động; đơn và tồn kho được giữ)`. Người dùng duyệt plan này nghĩa là duyệt dòng sửa rule này.
- [x] **Step 6: Commit.**

```bash
git add backend/prisma/seed.ts backend/test/seed-images.spec.ts README.md docs/user-sequence-specifications.md .claude/rules/doc-code-sync.md
git commit -m "fix(seed): chi tao du lieu con thieu, giu don va ton kho qua cac lan khoi dong"
```

---

### Task 5: Tách dữ liệu smoke test khỏi dữ liệu demo

**Files:**
- Create: `backend/prisma/clean-smoke.ts`
- Modify: `backend/package.json` (thêm script)
- Test: `backend/test/pg-smoke-clean.integration.spec.ts` (chỉ chạy khi có `DATABASE_URL`)
- Docs: `README.md` (mục mới "Dữ liệu demo"), `.claude/rules/doc-code-sync.md` (mục "Phạm vi")

**Interfaces:**
- Produces: `SMOKE_EMAIL_SUFFIX = '@smoke.test'`, `cleanSmokeData(db: PrismaClient): Promise<{ users: number; orders: number }>`.

- [x] **Step 1: Viết test đỏ** `backend/test/pg-smoke-clean.integration.spec.ts`:

```ts
import { PrismaService } from '../src/prisma/prisma.service';
import { cleanSmokeData } from '../prisma/clean-smoke';

// Chạy với Postgres thật: DATABASE_URL=postgresql://brewlite:brewlite@localhost:5432/brewlite. Không có thì skip.
const pg = process.env.DATABASE_URL ? describe : describe.skip;

pg('smoke:clean trên Postgres', () => {
  let db: PrismaService;
  const run = crypto.randomUUID().slice(0, 8);
  const smokeId = `u-smoke-${run}`;
  const keepId = `u-keep-${run}`;
  const productId = `p-smoke-${run}`;
  const orderIds = [`o-smoke-paid-${run}`, `o-smoke-cancel-${run}`, `o-keep-${run}`];

  beforeAll(async () => {
    db = new PrismaService();
    await db.$connect();
    await db.product.create({ data: { id: productId, name: 'Smoke', price: 10000, stock: 3, version: 1 } }); // 5 - 2 đã bán cho đơn smoke PAID
    await db.user.create({ data: { id: smokeId, email: `smoke-${run}@smoke.test`, passwordHash: 'x', loyaltyPoints: 2 } });
    await db.user.create({ data: { id: keepId, email: `keep-${run}@example.com`, passwordHash: 'x' } });
    const order = (id: string, userId: string, status: string, qty: number) =>
      db.order.create({ data: { id, userId, status, total: 10000 * qty, items: { create: [{ productId, size: 'S', qty, lineTotal: 10000 * qty }] } } });
    await order(orderIds[0], smokeId, 'PAID', 2);
    await order(orderIds[1], smokeId, 'CANCELLED', 1);
    await order(orderIds[2], keepId, 'PAID', 1);
    await db.payment.create({ data: { orderId: orderIds[0], idempotencyKey: `smoke-pay-${run}`, amount: 20000, method: 'WALLET' } });
  });

  afterAll(async () => {
    await db.payment.deleteMany({ where: { orderId: { in: orderIds } } });
    await db.orderItem.deleteMany({ where: { orderId: { in: orderIds } } });
    await db.order.deleteMany({ where: { id: { in: orderIds } } });
    await db.user.deleteMany({ where: { id: { in: [smokeId, keepId] } } });
    await db.product.deleteMany({ where: { id: productId } });
    await db.$disconnect();
  });

  test('xóa tài khoản @smoke.test cùng đơn và biên lai, hoàn kho đơn đã trừ kho, giữ dữ liệu người khác', async () => {
    const r = await cleanSmokeData(db);
    expect(r.users).toBeGreaterThanOrEqual(1);
    expect(await db.user.findUnique({ where: { id: smokeId } })).toBeNull();
    expect(await db.order.count({ where: { id: { in: orderIds.slice(0, 2) } } })).toBe(0);
    expect(await db.payment.count({ where: { idempotencyKey: `smoke-pay-${run}` } })).toBe(0);
    expect(await db.order.findUnique({ where: { id: orderIds[2] } })).not.toBeNull();
    const p = await db.product.findUnique({ where: { id: productId } });
    expect(p!.stock).toBe(5); // 3 + 2 của đơn smoke PAID; đơn CANCELLED đã hoàn kho lúc hủy nên không cộng
    expect(p!.version).toBe(2); // mọi lần đổi tồn kho đều tăng version
  });
});
```

- [x] **Step 2: Chạy cho thấy đỏ** (cần DB compose: `docker compose up -d db`).

Run: `cd backend && DATABASE_URL=postgresql://brewlite:brewlite@localhost:5432/brewlite npx jest pg-smoke-clean`
Expected: FAIL, `Cannot find module '../prisma/clean-smoke'`.

- [x] **Step 3: Tạo `backend/prisma/clean-smoke.ts`:**

```ts
import { PrismaClient } from '@prisma/client';

// Dữ liệu smoke test trên DB demo: tài khoản email đuôi @smoke.test cùng mọi đơn, biên lai của họ.
// Chạy: docker compose exec backend npm run smoke:clean (hoặc đặt DATABASE_URL rồi npm run smoke:clean).
export const SMOKE_EMAIL_SUFFIX = '@smoke.test';

// Trạng thái đã trừ kho (trừ lúc lên PAID). CANCELLED đã hoàn kho lúc hủy; PENDING / PAYMENT_FAILED chưa trừ.
const STOCK_TAKEN = ['PAID', 'PREPARING', 'READY', 'COMPLETED'];

export async function cleanSmokeData(db: PrismaClient): Promise<{ users: number; orders: number }> {
  const users = await db.user.findMany({ where: { email: { endsWith: SMOKE_EMAIL_SUFFIX } }, select: { id: true } });
  const userIds = users.map((u) => u.id);
  const orders = await db.order.findMany({ where: { userId: { in: userIds } }, include: { items: true } });
  const orderIds = orders.map((o) => o.id);
  await db.$transaction(async (tx) => {
    // hoàn kho đơn smoke đã trừ kho, tăng version như mọi lần đổi tồn kho
    for (const o of orders) {
      if (!STOCK_TAKEN.includes(o.status)) continue;
      for (const i of o.items) await tx.product.update({ where: { id: i.productId }, data: { stock: { increment: i.qty }, version: { increment: 1 } } });
    }
    await tx.payment.deleteMany({ where: { orderId: { in: orderIds } } });
    await tx.orderItem.deleteMany({ where: { orderId: { in: orderIds } } });
    await tx.order.deleteMany({ where: { id: { in: orderIds } } });
    await tx.user.deleteMany({ where: { id: { in: userIds } } });
  });
  return { users: userIds.length, orders: orderIds.length };
}

if (require.main === module) {
  const db = new PrismaClient();
  cleanSmokeData(db)
    .then((r) => console.log(`smoke:clean: xóa ${r.users} tài khoản ${SMOKE_EMAIL_SUFFIX}, ${r.orders} đơn`))
    .finally(() => db.$disconnect());
}
```

- [x] **Step 4: Thêm script** vào `"scripts"` của `backend/package.json`:

```json
    "smoke:clean": "ts-node prisma/clean-smoke.ts"
```

- [x] **Step 5: Chạy cho thấy xanh.**

Run: `cd backend && DATABASE_URL=postgresql://brewlite:brewlite@localhost:5432/brewlite npx jest pg- && env -u DATABASE_URL npx jest && npx tsc --noEmit`
Expected: các suite pg pass (3 test); không có `DATABASE_URL` thì 122 pass / 3 skip; tsc không lỗi.

- [x] **Step 6: Tài liệu.**
  - `README.md`, thêm mục mới ngay trước "### Lưu ý bảo mật (chỉ dành cho demo)":

```markdown
### Dữ liệu demo

- Đơn, biên lai, điểm thưởng và tồn kho nằm trong volume `brewlite_pgdata`, giữ nguyên qua `docker compose restart`, `down` rồi `up` (không có `-v`). Đăng nhập lại tài khoản demo vẫn thấy lịch sử các buổi trước; quầy hiện đơn khách đã trả mà chưa giao.
- Smoke test hoặc thử API bằng curl trên stack này: đăng ký tài khoản email đuôi `@smoke.test`, không dùng tài khoản demo. Xong thì dọn: `docker compose exec backend npm run smoke:clean` (xóa các tài khoản `@smoke.test` cùng đơn, biên lai của họ, hoàn kho các đơn đã trừ kho).
- Làm lại từ đầu (DB trống, chỉ có 3 tài khoản demo và 4 món): `docker compose down -v` rồi `docker compose up -d --build`. Lệnh này xóa mọi đơn và lịch sử.
```

  - `.claude/rules/doc-code-sync.md`, mục "Phạm vi", thêm gạch cuối: `- Smoke test hoặc thử API trên DB compose: dùng tài khoản email `@smoke.test`, không dùng tài khoản demo; xong chạy `docker compose exec backend npm run smoke:clean`.` Người dùng duyệt plan này nghĩa là duyệt dòng thêm vào rule này.
- [x] **Step 7: Commit.**

```bash
git add backend/prisma/clean-smoke.ts backend/package.json backend/test/pg-smoke-clean.integration.spec.ts README.md .claude/rules/doc-code-sync.md
git commit -m "feat(backend): smoke:clean don du lieu smoke (@smoke.test) khoi DB demo"
```

---

### Task 6: Chốt chặn trên stack thật

- [ ] **Step 1: Toàn bộ test.** Backend `npx jest` (không `DATABASE_URL`: 122 pass / 3 skip) + `npx tsc --noEmit`; suite pg có `DATABASE_URL` (`npx jest pg-`: 3 pass); frontend `npx vitest run` (117 pass) + `npx tsc --noEmit`.
- [ ] **Step 2: Dựng stack.** `docker compose up -d --build`; `docker compose logs backend | grep seeded` thấy dòng log mới của seed.
- [ ] **Step 3: Smoke bằng curl, chỉ dùng tài khoản `@smoke.test`.**
  1. `POST /auth/register` `smoke-<số>@smoke.test`, đăng nhập lấy token. Ghi `stock` của `p1` (`GET /products`).
  2. `POST /orders` (Idempotency-Key K1) với `p1` × 1 → `POST /payments` (K2) → 201.
  3. Barista (`barista@brewlite.vn`) `GET /orders?status=PAID,PREPARING,READY` thấy đơn ở bước 2.
  4. `docker compose restart backend`, chờ backend lên. `GET /orders/me` (token smoke) vẫn có đơn `PAID`; `stock` của `p1` vẫn bằng số ghi ở bước 1 trừ 1 (seed không đặt lại).
  5. `docker compose exec backend npm run smoke:clean` → log `xóa 1 tài khoản @smoke.test, 1 đơn`. Barista `GET /orders?status=…` không còn đơn đó; `stock` của `p1` trở lại số ở bước 1.
- [ ] **Step 4: Chạy skill `.agents/skills/requesting-code-review`** cho cả nhánh (so với `develop`). Sửa finding (commit riêng nếu có).
- [ ] **Step 5: Báo cáo.** Thêm mục "7. Demo mượt (2026-10-09)" vào `docs/develop-status-report.md`: commit từng task, số test mới, kết quả smoke. Cập nhật số test ở `docs/scrum-process.md`. Tick plan này. Commit `docs: bao cao demo muot`.
- [ ] **Step 6: Báo người dùng.** Gồm danh sách commit, kết quả test và smoke, và 2 việc cần người dùng:
  1. **Kiểm bằng mắt trên trình duyệt:**
     - tab 1 đăng nhập khách, tab 2 đăng nhập barista, reload cả hai vẫn đúng tài khoản; header mỗi tab hiện email + vai trò;
     - khách đặt và trả 1 đơn, tab barista thấy đơn ở cột "Chờ pha" trong 5 giây;
     - Đăng xuất ở tab 1 không làm tab 2 mất phiên;
     - với `MOCK_GATEWAY_DECLINE_METHOD=CARD`: trả Thẻ lỗi → reload → bấm "Thanh toán" → trả Ví thành công, `/history` chỉ có 1 đơn.
  2. **Xác nhận làm sạch DB demo một lần.** Volume hiện tại còn rác do agent smoke test tạo trên tài khoản demo trước khi có quy ước `@smoke.test`: 11 đơn `PAID` đang hiện ở quầy, 14 tài khoản test, đơn `order-1042` cũ. `smoke:clean` không dọn được phần này. Nếu người dùng đồng ý: `docker compose down -v && docker compose up -d --build`. **Không tự chạy khi chưa có xác nhận.**

---

## Không làm (có lý do)

- **Token riêng theo vai trò trong `localStorage`:** người dùng chọn mỗi tab một phiên (Q1).
- **Reset dữ liệu tự động:** người dùng muốn dữ liệu demo giữ qua các lần bật container (Q2). Làm sạch chỉ bằng `smoke:clean` (dữ liệu smoke) hoặc `down -v` (làm lại từ đầu, có xác nhận).
- **Test render `Header`:** cần router của Next và DOM, môi trường vitest là `node`; không thêm phụ thuộc. Logic của header đã có test ở Task 1 và 2.
- **Biên lai cũ khi đơn đã bị hủy ở tab khác:** đã đưa vào backlog (cần đổi cả backend và giao diện).
- **Giỏ hàng chặn 20 dòng:** để sang đợt cải thiện UI.

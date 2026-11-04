# P3 – Hướng dẫn sửa branch `a2/task5-p3-checkout`

> Bản plan bàn giao cho Phú trên branch `a2/task5-p3-checkout`. Card gốc: [card-task5-p3.md](card-task5-p3.md). Commit bàn giao chỉ thêm file plan này; phạm vi sửa code vẫn là 2 file trong card.
>
> Người làm tự gõ code và giải thích được từng dòng khi vấn đáp (mục 5).

- **Thư mục làm việc:** checkout/worktree của Phú trên branch `a2/task5-p3-checkout`. Đường dẫn trên máy đã kiểm: `E:\CNPM\BrewLite\.worktrees\task5-p3`.
- **Branch:** `a2/task5-p3-checkout`, track `origin/a2/task5-p3-checkout`. Mốc code được đánh giá: `20bb3f3`, gồm 2 commit của phu (`f99e5dd`, `20bb3f3`), trước commit bàn giao plan.
- **Base của PR:** `origin/feat/assignment2-task5-delivery` = `f3c9159`
- **Chuẩn bị trên máy Phú:** chạy `npm --prefix apps/web ci` nếu chưa cài dependencies.

## 1. Vì sao 2 commit hiện tại chưa merge được

Kiểm trên bản sao của `20bb3f3` ngày 2026-10-24:

- **Test đỏ.** `npm --prefix apps/web test` ra `Tests 2 failed | 22 passed (24)`, lỗi `Unable to find a label with the text of: Thẻ` ở `CheckoutScreen.test.tsx:62,77`. Có 3 nguyên nhân:
  - test truy vấn ngay sau `render`, trong khi màn hình còn ở trạng thái "Đang tải phiên thanh toán…";
  - mock `useShop` trả về object `session` mới ở mỗi lần render, làm effect chạy lại liên tục;
  - test 2 đòi lỗi hiện ngay khi gõ, trái với card (card yêu cầu báo lỗi khi bấm "Xác nhận trả").
- **Lint đỏ.** `CheckoutScreen.tsx:94` gọi `setCardError('')` trong `useEffect`, vi phạm rule `react-hooks/set-state-in-effect`.
- **Hai `role="alert"` cùng lúc** khi `unknownCreate` (dòng 234 và 235). E2E `tests/e2e/checkout.spec.ts:70` sẽ đỏ do strict mode.
- **Xóa chức năng ngoài phạm vi card, E2E sẽ đỏ:**
  - ô select "Phương thức" thành radio: E2E dòng 50, 56, 83;
  - mất nút "Thử lại thanh toán" (dòng 57, 107, 130) và "Thử tải lại đơn" (dòng 104, 106);
  - mất link "Kiểm tra lịch sử đơn hàng" (dòng 74), "Bắt đầu đơn mới", "Xem hoặc hủy đơn hiện tại", "Quay lại giỏ hàng".
- **Lỗi logic mới:**
  - nút "Xác nhận trả" chỉ còn bị khóa khi `busy`, mất các điều kiện `blocked`, `!payable` và giỏ rỗng;
  - nút "Thử lại" mới gọi `startAgain()`, làm **bỏ đơn đang giữ**.

## 2. Hướng sửa

Lấy lại `CheckoutScreen.tsx` của branch delivery rồi chỉ thêm đúng 3 thứ card yêu cầu. Lý do:

- diff của PR chỉ còn khoảng 6 chỗ, dễ review;
- toàn bộ luồng cũ (retry, khôi phục đơn, 401, mất phản hồi) được giữ nguyên;
- E2E không phải sửa;
- giữ đúng kiểu viết gọn một dòng của các file cùng thư mục (`CartScreen.tsx`).

Viết lại `CheckoutScreen.test.tsx` theo mẫu `CartScreen.test.tsx`. Hai commit code cũ và commit bàn giao plan vẫn nằm trong lịch sử; ta thêm commit sửa code tiếp theo lên trên, **không rebase, không force-push**.

## 3. Các bước

Mọi lệnh chạy ở thư mục gốc của worktree. Kiểm trước:

```text
git branch --show-current    # a2/task5-p3-checkout
git status --porcelain       # kết quả rỗng: không có thay đổi chưa commit
```

### Bước 1. Lấy lại file component của branch delivery

```text
git fetch origin
git restore --source=origin/feat/assignment2-task5-delivery -- apps/web/src/components/shop/CheckoutScreen.tsx
```

Sau lệnh này file giống hệt `f3c9159`. Số dòng ở bước 3 tính theo bản này.

### Bước 2. Viết test trước (test đỏ)

Ghi đè `apps/web/src/components/shop/CheckoutScreen.test.tsx` bằng nội dung sau:

```tsx
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ApiError } from '@/lib/api';
import { shopApi } from '@/lib/shop';
import { useShop } from './ShopProvider';
import { CheckoutScreen } from './CheckoutScreen';

const router = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));
vi.mock('./ShopProvider', () => ({ useShop: vi.fn() }));
vi.mock('@/lib/shop', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/lib/shop')>()), shopApi: vi.fn() }));

const line = {
  key: 'cappuccino-L-pearls', productId: 'cappuccino', name: 'Cappuccino',
  size: 'L', toppings: ['Trân châu'], quantity: 2, unitPrice: 62000,
};
// One stable object: CheckoutScreen's effect depends on session, a new object per render would loop.
const store = {
  cart: [line], ready: true, session: { token: 'token-1', email: 'demo@test.local', role: 'CUSTOMER' },
  add: vi.fn(), quantity: vi.fn(), clear: vi.fn(), login: vi.fn(), logout: vi.fn(),
};
const order = {
  id: 'order-1', status: 'PAYMENT_FAILED', total: 35000, createdAt: '2026-10-25T00:00:00.000Z',
  items: [{ id: 'item-1', productId: 'latte', name: 'Latte', size: 'M', toppings: [], quantity: 1, unitPrice: 35000, lineTotal: 35000 }],
};
const cardError = 'Số thẻ demo phải gồm 16 chữ số';

async function renderCheckout() {
  vi.mocked(useShop).mockReturnValue(store);
  render(<CheckoutScreen />);
  await screen.findByRole('heading', { name: 'Thanh toán mô phỏng' });
}

function chooseCard(number: string) {
  fireEvent.change(screen.getByRole('combobox', { name: 'Phương thức' }), { target: { value: 'CARD' } });
  fireEvent.change(screen.getByLabelText('Số thẻ demo'), { target: { value: number } });
}

beforeEach(() => { vi.mocked(shopApi).mockReset(); sessionStorage.clear(); });

describe('CheckoutScreen: AC-F14.5, UC-04 bước 2, C3', () => {
  it('UNIT-P3-01: số thẻ thiếu chữ số báo lỗi tại ô và không gọi API', async () => {
    await renderCheckout();
    chooseCard('1234');
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận trả' }));
    const input = screen.getByLabelText('Số thẻ demo');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription(cardError);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(shopApi).not.toHaveBeenCalled();
  });

  it('UNIT-P3-02: sửa số thẻ hoặc đổi phương thức thì lỗi tại ô biến mất', async () => {
    await renderCheckout();
    chooseCard('1234');
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận trả' }));
    fireEvent.change(screen.getByLabelText('Số thẻ demo'), { target: { value: '12345' } });
    expect(screen.getByLabelText('Số thẻ demo')).toHaveAttribute('aria-invalid', 'false');
    expect(screen.queryByText(cardError)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận trả' }));
    expect(screen.getByText(cardError)).toBeInTheDocument();
    fireEvent.change(screen.getByRole('combobox', { name: 'Phương thức' }), { target: { value: 'WALLET' } });
    fireEvent.change(screen.getByRole('combobox', { name: 'Phương thức' }), { target: { value: 'CARD' } });
    expect(screen.queryByText(cardError)).not.toBeInTheDocument();
  });

  it('UNIT-P3-03: chưa có đơn thì tóm tắt các dòng trong giỏ', async () => {
    await renderCheckout();
    expect(screen.getByRole('heading', { name: 'Tóm tắt đơn' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual(['2 × Cappuccino · Size L · Trân châu']);
    expect(screen.getByText('Tổng tiền: 124.000đ', { exact: true })).toBeInTheDocument();
  });

  it('UNIT-P3-04: thanh toán lại đơn PAYMENT_FAILED thì tóm tắt các dòng của đơn', async () => {
    sessionStorage.setItem('brewlite-checkout:demo@test.local', JSON.stringify({ orderId: order.id, key: 'key-1' }));
    vi.mocked(shopApi).mockResolvedValueOnce(order);
    await renderCheckout();
    expect(screen.getByText('Mã đơn: order-1')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual(['1 × Latte · Size M · Không topping']);
    expect(screen.getByRole('button', { name: 'Thử lại thanh toán' })).toBeEnabled();
  });

  it('UNIT-P3-05: thanh toán bị từ chối 402 chỉ hiện một alert và giữ giỏ', async () => {
    vi.mocked(shopApi).mockResolvedValueOnce({ ...order, status: 'PENDING' }).mockRejectedValueOnce(new ApiError('Thẻ bị từ chối', 402));
    await renderCheckout();
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận trả' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Đơn của bạn vẫn được giữ');
    expect(screen.getAllByRole('alert')).toHaveLength(1);
    expect(store.clear).not.toHaveBeenCalled();
  });
});
```

Chạy:

```text
npm --prefix apps/web test -- src/components/shop/CheckoutScreen.test.tsx
```

Kết quả mong đợi: `Tests  4 failed | 1 passed (5)`. Chép output đỏ vào mô tả PR. UNIT-P3-05 pass ngay từ đầu vì code delivery đã bắt 402; test này để chặn hồi quy alert trùng.

### Bước 3. Sửa `apps/web/src/components/shop/CheckoutScreen.tsx`

Có 6 chỗ sửa (A–F). Số dòng tính theo bản delivery.

**A. Dòng 6, import thêm type `CartLine`:**

```tsx
// cũ
import { shopApi, cartTotal, type Order } from '@/lib/shop';
// mới
import { shopApi, cartTotal, type CartLine, type Order } from '@/lib/shop';
```

**B. Chèn ngay sau dòng 8** (`import { useShop } ...`), trước `export function CheckoutScreen()`:

```tsx
function lineSummary(line: CartLine) { return `${line.quantity} × ${line.name} · Size ${line.size} · ${line.toppings.join(', ') || 'Không topping'}`; }
```

**C. Dòng 12, thêm state lỗi riêng cho ô thẻ:**

```tsx
// cũ
  const [method, setMethod] = useState('WALLET'); const [card, setCard] = useState('');
// mới
  const [method, setMethod] = useState('WALLET'); const [card, setCard] = useState(''); const [cardError, setCardError] = useState('');
```

**D. Dòng 55, lỗi thẻ vào state riêng thay vì `error` chung:**

```tsx
// cũ
    if (method === 'CARD' && !/^\d{16}$/.test(card)) { setError('Số thẻ demo phải gồm 16 chữ số'); return; }
// mới
    if (method === 'CARD' && !/^\d{16}$/.test(card)) { setCardError('Số thẻ demo phải gồm 16 chữ số'); return; }
```

**E. Dòng 77, bỏ 502 (C3):**

```tsx
// cũ
        else if (err instanceof ApiError && [402, 502].includes(err.status)) setError(...);
// mới
        else if (err instanceof ApiError && err.status === 402) setError(...);
```

Giữ nguyên câu thông báo trong `setError(...)`.

**F. Dòng 90 (JSX).** Sửa 3 đoạn, phần còn lại giữ nguyên.

F1. Chèn phần tóm tắt **ngay trước** `<p className="shop-total">`:

```tsx
<h2>Tóm tắt đơn</h2><ul>{order ? order.items.map((item) => <li key={item.id}>{lineSummary(item)}</li>) : shop.cart.map((line) => <li key={line.key}>{lineSummary(line)}</li>)}</ul>
```

F2. Đổi phương thức thì xóa lỗi thẻ:

```tsx
// cũ
onChange={(event) => setMethod(event.target.value)}
// mới
onChange={(event) => { setMethod(event.target.value); setCardError(''); }}
```

F3. Ô số thẻ: thêm `aria-*`, xóa lỗi khi gõ, hiện lỗi **ngoài** `<label>`:

```tsx
// cũ
{method === 'CARD' && <label>Số thẻ demo<input inputMode="numeric" autoComplete="off" maxLength={16} value={card} disabled={busy} onChange={(event) => setCard(event.target.value)} /></label>}
// mới
{method === 'CARD' && <><label>Số thẻ demo<input inputMode="numeric" autoComplete="off" maxLength={16} value={card} disabled={busy} aria-invalid={cardError !== ''} aria-describedby={cardError ? 'card-error' : undefined} onChange={(event) => { setCard(event.target.value); setCardError(''); }} /></label>{cardError && <p id="card-error">{cardError}</p>}</>}
```

**Không** đụng `{error && <p role="alert">{error}</p>}`, nút submit, các nút và link phía sau.

### Bước 4. Kiểm (P3-5 trong card)

```text
npm --prefix apps/web run lint
npm --prefix apps/web run typecheck
npm --prefix apps/web test
npm --prefix apps/web run build
npm --prefix apps/web run test:e2e
git grep -n "502" -- apps/web/src
git diff --name-only origin/feat/assignment2-task5-delivery...HEAD
git diff --check
```

Kết quả mong đợi:

- lint, typecheck và build exit 0;
- test ra `Tests  27 passed (27)`;
- `git grep` không ra dòng nào;
- lệnh `diff --name-only` chỉ ra 2 file code `apps/web/src/components/shop/CheckoutScreen.tsx`, `apps/web/src/components/shop/CheckoutScreen.test.tsx` và file plan `docs/planning/handoff/2026-10-21-req-sync/P3-FIX.md` đã được bàn giao bằng commit riêng. Không thêm đường dẫn nào khác.

E2E cần một Postgres test riêng, API chạy ở cổng 4105 và web ở cổng 3105; Playwright tự bật API và web. Trên Windows, chạy bằng PowerShell ở thư mục gốc worktree. Docker Desktop phải đang chạy.

```powershell
# 1. Postgres test riêng, cổng 55432 để không đụng cổng 5432 dùng chung
docker run -d --name brewlite-p3-e2e -e POSTGRES_USER=brewlite -e POSTGRES_PASSWORD=e2e-local-only -e POSTGRES_DB=brewlite_test -p 127.0.0.1:55432:5432 postgres:16-alpine

# 2. Biến môi trường (chỉ sống trong cửa sổ PowerShell này)
$env:DATABASE_URL = 'postgresql://brewlite:e2e-local-only@127.0.0.1:55432/brewlite_test?schema=public'
$env:TEST_DATABASE_URL = $env:DATABASE_URL
$env:NEXT_PUBLIC_API_URL = 'http://127.0.0.1:4105'

# 3. API: cài, tạo bảng, nạp 8 sản phẩm, build
npm --prefix apps/api ci
npm --prefix apps/api run prisma:generate
npm --prefix apps/api run prisma:migrate
npm --prefix apps/api run prisma:seed
npm --prefix apps/api run build

# 4. Build lại web SAU KHI đặt NEXT_PUBLIC_API_URL, rồi chạy E2E
npm --prefix apps/web run build
npm --prefix apps/web run test:e2e

# 5. Dọn DB test
docker rm -f brewlite-p3-e2e
```

- Phải build lại web ở bước 4. Biến `NEXT_PUBLIC_API_URL` được gắn vào lúc build; nếu thiếu, web gọi `localhost:4000` và E2E đỏ.
- Nếu máy chưa có trình duyệt của Playwright: `npx --prefix apps/web playwright install chromium`.
- Cảnh báo `"next start" does not work with "output: standalone"` có sẵn từ trước, không làm E2E đỏ.
- Kết quả mong đợi: `6 passed`.

### Bước 5. Commit và PR

```text
git add apps/web/src/components/shop/CheckoutScreen.tsx apps/web/src/components/shop/CheckoutScreen.test.tsx
git commit -m "feat(web): show order summary and inline card error on checkout"
```

Không thêm trailer `Co-Authored-By`. Push lên `origin/a2/task5-p3-checkout` (push thường, **không** `--force`) chỉ khi phu và chủ Task 5 đã đồng ý, vì đây là branch của phu. Sau đó mở PR vào `feat/assignment2-task5-delivery`, **không** vào `develop-Assignment2`. Mô tả PR ghi:

- AC đã đạt: AC-F14.5, UC-04 bước 2, C3;
- mã test UNIT-P3-01 đến 05;
- output đỏ ở bước 2 và output xanh ở bước 4.

Không sửa `docs/traceability-matrix.md`.

## 4. Đối chiếu với card

- **P3-2, lỗi tại ô:**
  - state `cardError` riêng (C, D);
  - `<p id="card-error">` nằm ngay dưới ô, ô có `aria-invalid` và `aria-describedby` (F3);
  - không thêm `role="alert"`;
  - xóa lỗi khi gõ hoặc đổi phương thức (F2, F3).
- **P3-3, tóm tắt đơn:**
  - chưa có đơn thì lặp `shop.cart`, key `line.key`;
  - có đơn thì lặp `order.items`, key `item.id`;
  - chỉ có một chuỗi "Tổng tiền" (F1).
- **P3-4, C3:** `err.status === 402` (E).

## 5. Giải thích từng chỗ (chuẩn bị vấn đáp)

- **`lineSummary` đặt ngoài component:** hàm thuần, không dùng state, nên không cần tạo lại mỗi lần render. Chuỗi theo đúng kiểu "Size … · topping" của `CartScreen.tsx:9`; không có topping thì hiện "Không topping".
- **Kiểu tham số `CartLine`:** `Order.items` có kiểu `CartLine & { id; lineTotal }` (`lib/shop.ts:4`), nên dùng được cho cả dòng giỏ lẫn dòng đơn.
- **Key `item.id` cho dòng đơn:** server lưu dòng đơn trong DB và không trả `key` (`checkout.service.ts:32` chỉ thêm `name`, `unitPrice`, `lineTotal`). `id` là khóa ổn định duy nhất.
- **Tách `cardError` khỏi `error`:** `error` hiện trong `role="alert"` chung của trang. Lỗi định dạng thẻ thuộc về một ô nên phải hiện cạnh ô (AC-F14.5). Nếu thêm alert thứ hai, E2E `getByRole('main').getByRole('alert')` sẽ gặp 2 phần tử và đỏ.
- **Kiểm thẻ trong `submit`, không trong `useEffect`:** lỗi chỉ cần xuất hiện khi người dùng bấm trả. Effect gọi `setState` đồng bộ gây render thừa, và React 19 lint cấm (`react-hooks/set-state-in-effect`).
- **Xóa lỗi trong `onChange`:** đây là phản hồi trực tiếp cho thao tác của người dùng, nên đặt trong handler là đúng chỗ, không cần effect.
- **`aria-invalid={cardError !== ''}`:** báo cho trình đọc màn hình ô đang sai. `aria-describedby="card-error"` nối ô với đoạn lỗi, nên trình đọc màn hình đọc lỗi khi focus vào ô.
- **`<p id="card-error">` nằm ngoài `<label>`:** nếu đặt trong label, câu lỗi bị gộp vào tên của ô, làm `getByLabel('Số thẻ demo', { exact: true })` của E2E không tìm được ô nữa.
- **Bỏ 502:** sau C3, mock thanh toán chỉ còn từ chối bằng 402 `PAYMENT_DECLINED`. Lỗi 5xx khác rơi xuống nhánh `setError(err.message)`.
- **Trong test:**
  - `store` là một object cố định: effect của component phụ thuộc `session`, object mới mỗi lần render làm effect chạy lặp;
  - `findByRole` chờ effect tải phiên xong;
  - `importOriginal` giữ `cartTotal` thật, chỉ mock `shopApi`;
  - dùng `combobox` vì E2E đang chọn phương thức bằng `selectOption`.

## 6. Kết quả áp thử (2026-10-25)

Áp đúng bước 1–3 lên bản sao của `f3c9159`, ngoài repo:

- **Test đỏ trước khi sửa:** `Tests  4 failed | 1 passed (5)`. Các lỗi:
  - `toHaveAttribute("aria-invalid", "true")`;
  - `toHaveAttribute("aria-invalid", "false")`;
  - `Unable to find an accessible element with the role "heading" and name "Tóm tắt đơn"`;
  - `Unable to find an accessible element with the role "listitem"`.
- **Sau khi sửa:**
  - `vitest run`: `Test Files  7 passed (7)`, `Tests  27 passed (27)`;
  - `tsc --noEmit`: exit 0;
  - `eslint .`: exit 0;
  - `next build`: exit 0, có route `/checkout`.
- **E2E (lần 2, trên worktree tạm từ `20bb3f3`, làm đúng bước 1–4, Postgres 16 ở cổng 55432):**
  - kiểm bước 4: lint, typecheck, `Tests 27 passed (27)` đều xanh; `git grep 502` ra 0 dòng; `diff --name-only` chỉ ra 2 file;
  - migrate và seed exit 0 (`Seed xong: 8 sản phẩm`), API build exit 0, web build exit 0;
  - `npm run test:e2e`: **`6 passed (12.9s)`**, gồm E2E-S2-01 đến E2E-S2-06.
- **Đối chứng: E2E trên code gốc của phu (`20bb3f3`): `5 failed, 1 passed`.**
  - S2-02 và S2-04: `locator.selectOption: Test timeout`, vì không còn select "Phương thức".
  - S2-03: `strict mode violation: getByRole('main').getByRole('alert') resolved to 2 elements`.
  - S2-05: `expect(locator).toBeDisabled() failed`, vì nút không còn bị khóa khi `blocked`.
  - S2-06: `locator.click: Test timeout`, vì không còn nút "Thử lại thanh toán".

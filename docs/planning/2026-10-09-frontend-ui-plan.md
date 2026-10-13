# Kế hoạch UI hệ thống BrewLite có checkpoint

> **For agentic workers:** Dùng superpowers:subagent-driven-development hoặc superpowers:executing-plans để làm từng task. Mỗi task kết thúc bằng một checkpoint: dừng, chạy kiểm, chờ người duyệt rồi mới sang task sau. Bước dùng checkbox `- [ ]`.

**Goal:** Hoàn thiện giao diện frontend cho 5 màn wireframe đề §7, nối đủ các chỗ backend đã có mà frontend chưa dùng, và đưa dự án về trạng thái bàn giao được.

**Architecture:** Giữ Next.js 14 (App Router) + React 18 + store giỏ hàng hiện có (`frontend/src/store/cart.ts`), không đổi backend ngoài đúng 1 thay đổi nhỏ ở Task 3 (thêm `productName` cho `GET /orders/me`). Thay inline style bằng token CSS trong `globals.css` và một bộ component dùng chung nhỏ. Mỗi màn được thêm trạng thái loading / rỗng / lỗi theo cùng một mẫu.

**Tech Stack:** Next.js 14.2.35, React 18.3.1, TypeScript, Vitest, NestJS + Prisma + Postgres (backend, chỉ đọc và thêm 1 trường), Docker Compose.

**Spec:** `docs/BrewLite-CongNghePhanMem-fixed.md` §7 (wireframe), §9–§11 (tiêu chí và DoD), `docs/use-case-specifications.md`, `docs/user-sequence-specifications.md`, `docs/checkpoints/2026-10-09-backend-checkpoint.md` (mục 7: danh sách việc frontend).

## Global Constraints

- Điểm xuất phát: `develop` @ `eef05d6`. Làm trên nhánh riêng (ví dụ `feat/ui-system`), một task một commit hoặc một nhóm commit nhỏ, không merge và không push khi chưa được duyệt.
- Kiểm trước mỗi checkpoint: `cd frontend && npx vitest run && npx tsc --noEmit && npx next build`. Mốc đầu đợt UI (checkpoint backend): 117 test pass, tsc sạch, build 7 route. Sau Giai đoạn 0 (thêm `/users/me`, `/profile` và test `ProfileView`): 123 test pass.
- Đổi hành vi backend thì sửa test, sơ đồ sequence, mục C và Phần III trong cùng commit (rule `doc-code-sync`).
- Smoke trên compose chỉ dùng tài khoản `@smoke.test`; không dùng tài khoản demo (`demo@brewlite.vn`, `barista@brewlite.vn`, `admin@brewlite.vn`) để thử ghi dữ liệu.
- Không `docker compose down -v` nếu chưa có xác nhận.
- Layout chạy được ở chiều rộng điện thoại, lề 16px, không cuộn ngang.
- Không thêm dependency UI lớn (thư viện component, Tailwind) nếu không được duyệt. Dùng CSS thuần với token.

## Review Focus

Các đầu vào và tình huống dễ làm hỏng trải nghiệm nhưng không nằm trong test nào của plan gốc. Mỗi dòng gắn với task sở hữu.

1. Token hết hạn hoặc bị 401 giữa phiên: đang ở Giỏ hoặc Thanh toán thì phải đưa về `/login`, không hiện lỗi trơ. → Task 2.
2. Reload khi đang trả dở: đơn `PENDING` giữ lại, không tạo đơn thứ hai, không mất giỏ. → Task 5.
3. Backend tắt hoặc menu rỗng: màn Menu hiện lỗi có nút thử lại, không trắng trang. → Task 2.
4. Tên món dài và nhiều topping ở chiều rộng 360px: không tràn, không đẩy nút ra ngoài màn. → Task 7.
5. Đơn đổi trạng thái khi khách đang xem biên lai (`PAID` → `PREPARING` → `READY`): biên lai cập nhật, dừng poll khi `COMPLETED` hoặc `CANCELLED`. → Task 4.

---

## Checkpoint 0: Xuất phát (không đổi code)

- [ ] Chạy lệnh kiểm đầu phiên trong `docs/checkpoints/2026-10-09-backend-checkpoint.md` mục 8, xác nhận đúng số liệu.
- [ ] Chụp 5 màn hiện tại (desktop và 360px) vào `docs/checkpoints/ui-baseline/` để so sánh sau.
- [ ] Ghi `docs/checkpoints/2026-10-09-ui-checkpoint-0.md`: số test, tsc, build, ảnh baseline.
- **Dừng.** Người duyệt xác nhận baseline và trả lời 5 câu hỏi ở mục "Quyết định cần người chốt".

---

### Task 1: Token thiết kế và bộ component dùng chung

**Files:**
- Modify: `frontend/src/app/globals.css` (thêm token trên `:root`, dark mode không cần)
- Create: `frontend/src/components/ui/Button.tsx`, `Card.tsx`, `Badge.tsx`, `EmptyState.tsx`, `ErrorState.tsx`, `Skeleton.tsx`
- Create: `frontend/src/components/ui/ui.test.ts` (không phải `.tsx`: `vitest.config.ts` chỉ chạy `src/**/*.test.ts`)
- Modify: `frontend/src/app/layout.tsx` (font, metadata, bỏ `maxWidth` inline của `main`)

**Interfaces:**
- Consumes: không có.
- Produces:
  - `Button`: `{ variant: 'primary' | 'cta' | 'ghost' | 'link' | 'danger'; size?: 'md' | 'lg'; fullWidth?: boolean } & ButtonHTMLAttributes<HTMLButtonElement>`
  - `Card`: `{ children: ReactNode; className?: string }`
  - `Badge`: `{ tone: 'neutral' | 'ink' | 'ok' | 'warn' | 'danger'; children: ReactNode }`
  - `EmptyState`: `{ title: string; hint?: string; action?: ReactNode; doodle?: string }` (`doodle` là đường dẫn SVG, vẽ bằng `<img alt="">`)
  - `ErrorState`: `{ message: string; onRetry?: () => void }`
  - `Skeleton`: `{ height: number; width?: number | string }`

- [ ] **Step 1: Xác nhận cách test component trong repo**

Repo không có và không thêm `@testing-library/react` hay `jsdom`. Test component theo mẫu `renderToStaticMarkup` trong file `.test.ts`, giống `frontend/src/components/OrderStatusTrack.test.ts`. Không mô phỏng DOM nên không kiểm được việc bấm: test chỉ khẳng định nút "Thử lại" có mặt khi truyền `onRetry` và vắng khi không truyền.

- [ ] **Step 2: Viết test cho từng component (lỗi trước)**

Mỗi component một `test`: dựng bằng `createElement`, render bằng `renderToStaticMarkup`, assert text và thuộc tính. Ví dụ `Button` với `variant="primary"` có lớp tương ứng; `ErrorState` với `onRetry` có nút "Thử lại"; `EmptyState` truyền `doodle` có `<img alt="">`; `Badge` đúng lớp theo `tone`.

Run: `cd frontend && npx vitest run src/components/ui`
Expected: FAIL (module chưa tồn tại).

- [ ] **Step 3: Thêm token và component**

Token, font, hình khối, icon theo `ui-visual-plan.md` §3. Component dùng class CSS Modules, không inline style. Chữ mặc định tiếng Việt, không emoji.

- [ ] **Step 4: Chạy test để thấy pass**

Run: `cd frontend && npx vitest run src/components/ui`
Expected: PASS, tất cả test mới.

- [ ] **Step 5: Kiểm tổng thể và commit**

Run: `cd frontend && npx vitest run && npx tsc --noEmit`
Expected: 123 test cũ (đo sau Giai đoạn 0: 119 sau commit `/users/me`, thêm 4 của `ProfileView`) và test mới đều pass; tsc sạch.

```bash
git add frontend/src/components/ui frontend/src/app/globals.css frontend/src/app/layout.tsx frontend/package.json frontend/package-lock.json
git commit -m "feat(frontend): token thiết kế và component UI dùng chung"
```

### Checkpoint 1: Nền đã có, chưa đổi màn nào

- [ ] Chạy kiểm: vitest, tsc, next build đều xanh.
- [ ] Ghi `docs/checkpoints/2026-10-09-ui-checkpoint-1.md` (số test mới, commit hash).
- **Dừng.** Người duyệt bộ token và component trước khi áp vào màn.

---

### Task 2: Mẫu trạng thái loading / rỗng / lỗi và xử lý 401

**Files:**
- Create: `frontend/src/lib/use-async.ts` (hook `{ data, error, loading, retry }`)
- Create: `frontend/src/lib/use-async.test.ts`
- Modify: `frontend/src/lib/api.ts` (chuẩn hóa lỗi: 401 → xóa token và chuyển về `/login`)
- Modify: `frontend/src/lib/api.test.ts`
- Modify: `frontend/src/app/page.tsx`, `frontend/src/components/ProductGrid.tsx` (áp mẫu cho Menu)

**Interfaces:**
- Consumes: `Skeleton`, `EmptyState`, `ErrorState` (Task 1).
- Produces:
  - `useAsync<T>(fn: () => Promise<T>, deps: unknown[]): { data: T | undefined; error: ApiError | undefined; loading: boolean; retry: () => void }`
  - `ApiError` có `status: number` và `message: string`.

- [ ] **Step 1: Viết test lỗi trước**

Test: `useAsync` ở trạng thái `loading` ban đầu; khi fn reject thì `error` có `status`; `retry()` gọi lại fn. Test `api.ts`: response 401 xóa token trong `auth.ts` và gọi hàm redirect (inject được để test).

Run: `cd frontend && npx vitest run src/lib/use-async.test.ts src/lib/api.test.ts`
Expected: FAIL.

- [ ] **Step 2: Cài hook và chuẩn hóa lỗi**

Redirect dùng `router.replace('/login?next=...')`; hàm redirect được truyền vào để tách khỏi Next router khi test.

- [ ] **Step 3: Áp mẫu cho Menu**

Menu hiện: skeleton khi loading, `EmptyState` khi danh sách rỗng, `ErrorState` với "Thử lại" khi lỗi.

- [ ] **Step 4: Chạy test và kiểm tay**

Run: `cd frontend && npx vitest run`
Expected: pass. Kiểm tay: tắt backend (`docker compose stop backend`), mở Menu thấy lỗi có nút thử lại, bật lại bấm "Thử lại" thì có menu.

- [ ] **Step 5: Commit**

```bash
git commit -am "feat(frontend): mẫu trạng thái async và xử lý 401 chung"
```

### Task 3: Lịch sử hiện tên món, nối `productName` từ backend

**Files:**
- Modify: `backend/src/order/order.service.ts` (`listMine()` trả `productName`, cùng cách `listQueue()` đang làm)
- Modify: `backend/src/order/*.spec.ts` hoặc test `listMine` tương ứng (test trước)
- Modify: `frontend/src/lib/types.ts` (thêm `productName` vào kiểu đơn của lịch sử)
- Modify: `frontend/src/app/history/page.tsx:104` (hiện tên món thay mã 8 ký tự)
- Modify: `docs/user-sequence-specifications.md` (UC lịch sử: ghi `productName` trong response)

**Interfaces:**
- Consumes: `useAsync` (Task 2).
- Produces: `GET /orders/me` item có `productName: string` (tên món đầu tiên hoặc tên các món ngăn cách bằng ", " — quyết định ở Quyết định 3).

- [ ] **Step 1: Test backend lỗi trước**

Assert: `listMine()` trả `productName` đúng cho đơn có một món và đơn có nhiều món.

Run: `cd backend && npx jest order`
Expected: FAIL.

- [ ] **Step 2: Sửa `listMine()` và test pass**

Run: `cd backend && npx jest && npx tsc --noEmit`
Expected: 122 pass / 3 skip như checkpoint; test mới pass.

- [ ] **Step 3: Sửa history và test frontend**

Run: `cd frontend && npx vitest run`
Expected: pass.

- [ ] **Step 4: Commit (backend và tài liệu sync trong cùng commit)**

```bash
git commit -am "feat(orders): GET /orders/me trả productName; lịch sử hiện tên món"
```

### Checkpoint 2: Nối dữ liệu đã có

- [ ] Kiểm: jest backend, vitest frontend, tsc cả hai, build.
- [ ] Smoke trên compose bằng `@smoke.test`: tạo 1 đơn nhiều món, xem lịch sử có tên món. Dọn bằng `docker compose exec backend npm run smoke:clean`.
- [ ] Ghi `docs/checkpoints/2026-10-09-ui-checkpoint-2.md`.
- **Dừng.**

---

### Task 4: Biên lai và lịch sử tự cập nhật trạng thái

**Files:**
- Modify: `frontend/src/lib/order-status.ts` (hàm `isTerminal(status)`: `COMPLETED`, `CANCELLED`)
- Create: `frontend/src/lib/use-order-poll.ts`
- Create: `frontend/src/lib/use-order-poll.test.ts`
- Modify: `frontend/src/components/PaymentSuccess.tsx`, `frontend/src/components/OrderStatusTrack.tsx`, `frontend/src/app/history/page.tsx`
- Modify: `docs/user-sequence-specifications.md` (mục biên lai: nêu polling `GET /orders/:id`)

**Interfaces:**
- Consumes: `GET /orders/:id` (có sẵn ở backend), `isTerminal` (cùng task).
- Produces: `useOrderPoll(orderId: string | undefined, intervalMs = 3000): { order: OrderDetail | undefined; error?: ApiError }`. Dừng khi `isTerminal` hoặc khi unmount.

- [ ] **Step 1: Test lỗi trước**

Assert với fake timers: poll gọi `GET /orders/:id` mỗi 3s; dừng khi nhận `COMPLETED`; dừng khi unmount; không poll khi `orderId` undefined.

Run: `cd frontend && npx vitest run src/lib/use-order-poll.test.ts`
Expected: FAIL.

- [ ] **Step 2: Cài hook và nối vào hai màn**

- [ ] **Step 3: Test pass và kiểm tay**

Run: `cd frontend && npx vitest run`
Expected: pass. Kiểm tay (2 tab, 2 phiên): đổi trạng thái đơn ở `/barista` thì biên lai đổi theo trong vòng 3s.

- [ ] **Step 4: Commit**

```bash
git commit -am "feat(frontend): biên lai và lịch sử tự cập nhật trạng thái đơn"
```

### Task 5: Điểm thưởng hiện trên biên lai; khôi phục khi reload giữa lúc trả

**Files:**
- Modify: `frontend/src/lib/payment/types.ts` (`PaymentResult` thêm `discount: number`, `loyaltyPointsEarned: number`)
- Modify: `frontend/src/lib/payment/api-gateway.ts` và test (map 2 trường từ `POST /payments`)
- Modify: `frontend/src/components/PaymentSuccess.tsx` (hiện "+N điểm")
- Modify: `frontend/src/lib/payment/checkout-session.ts` và test (giữ đơn đang trả qua reload — đã có, chỉ kiểm lại)

**Interfaces:**
- Consumes: `POST /payments` đã trả `discount`, `loyaltyPointsEarned` (backend có sẵn).
- Produces: `PaymentResult` với hai trường mới.

- [ ] **Step 1: Test lỗi trước** (api-gateway map đủ hai trường; checkout-session giữ `orderId` sau reload)

Run: `cd frontend && npx vitest run src/lib/payment`
Expected: FAIL ở phần map.

- [ ] **Step 2: Sửa type và map**

- [ ] **Step 3: Test pass và kiểm tay**

Kiểm: trả đơn có voucher `BREWLITE10`; reload ở bước trả dở; số tiền và điểm đúng, không tạo đơn thứ hai (xem `/history`).

- [ ] **Step 4: Commit**

```bash
git commit -am "feat(frontend): hiện discount và điểm thưởng sau thanh toán"
```

**Lưu ý:** khách đã xem được tổng điểm: `GET /users/me` và trang `/profile` đã làm ở Giai đoạn 0 (commit `f41c0a8`, sửa lỗi trang trắng ở `8713770`). Task này chỉ cần hiện "+N điểm" trên biên lai (Quyết định 2: đã làm).

### Task 6: Giỏ hàng chặn 20 dòng và 99 ly ở phía UI

**Files:**
- Modify: `frontend/src/store/cart.ts` (hằng `MAX_LINES = 20`, `MAX_QTY = 99`; `addItem` trả về lý do khi vượt)
- Modify: `frontend/src/store/cart.test.ts`
- Modify: `frontend/src/components/QtyStepper.tsx`, `frontend/src/app/cart/page.tsx`

**Interfaces:**
- Produces: `addItem(...)` trả `{ ok: true } | { ok: false; reason: 'MAX_LINES' | 'MAX_QTY' }`.

- [ ] **Step 1: Test lỗi trước** (dòng thứ 21 bị từ chối; qty 100 bị từ chối)

Run: `cd frontend && npx vitest run src/store/cart.test.ts` — Expected: FAIL.

- [ ] **Step 2: Cài và nối UI (nút tăng bị disable, hiện thông báo)**

- [ ] **Step 3: Chạy test pass; commit**

```bash
git commit -am "feat(frontend): giỏ hàng chặn 20 dòng và 99 ly như backend"
```

### Checkpoint 3: Luồng khách hoàn chỉnh (Menu → Chi tiết → Giỏ → Thanh toán → Biên lai)

- [ ] Kiểm: vitest, tsc, build.
- [ ] Demo tay trên compose với tài khoản `@smoke.test`: đặt 1 đơn, xem biên lai cập nhật khi barista bấm, xem lịch sử có tên món và điểm.
- [ ] Ghi `docs/checkpoints/2026-10-09-ui-checkpoint-3.md`, kèm ảnh.
- **Dừng.** Người duyệt luồng khách trước khi làm tiếp phần giao diện.

---

### Task 7a: Bộ minh họa nét mực

Đặc tả ở `ui-visual-plan.md` §4. Làm trước Task 7 vì các màn dùng bộ hình này.

**Files:**
- Create: `frontend/public/doodles/{moka,mug,bag,bean,leaf,sparkle,burst}.svg` (chép từ `docs/superpowers/canvas/doodles/` của checkout chính, chỉ đọc)
- Modify: `frontend/public/images/{latte,americano,cappuccino,tra-dao}.svg` (`viewBox="0 0 240 180"`, thêm ô nền bo góc theo màu §3.1, bọc hình ly gốc trong `<g transform="translate(20 0)">`)
- Create: `frontend/src/lib/doodles.test.ts` (đọc file bằng `node:fs`: nhỏ hơn 2 KB, có `viewBox`, không có `<style`, `<script`, `<text`, `gradient`; 4 ảnh món có `viewBox` đúng `0 0 240 180`)

**Interfaces:** không đổi. `image` của sản phẩm vẫn là chuỗi đường dẫn.

- [ ] **Step 1: Viết `doodles.test.ts` (lỗi trước), chép hình, chạy lại cho xanh.**
- [ ] **Step 2: Commit riêng.**

### Task 7: Áp token và layout cho các màn, bảo đảm điện thoại

Phạm vi và thứ tự màn theo `ui-visual-plan.md` §6 (13 mục), đối chiếu từng artboard. Mỗi màn một commit.

**Files:**
- Modify: các màn và component liệt kê ở `ui-visual-plan.md` §6, gồm `frontend/src/app/page.tsx` (Menu), `components/ProductDetailModal.tsx` (Chi tiết), `app/cart/page.tsx` (Giỏ), `components/PaymentForm.tsx` (Thanh toán), `components/PaymentSuccess.tsx` (Xác nhận), `components/Header.tsx`, và `components/ProfileView.tsx` (Hồ sơ)
- Modify: `frontend/src/app/globals.css` (media query cho 360px, 768px)
- Create: test render nhỏ cho từng màn trong file `.test.ts` (kiểm class, không kiểm pixel)

**Interfaces:**
- Consumes: toàn bộ `components/ui/*` (Task 1), bộ hình (Task 7a), `useAsync` (Task 2), `useOrderPoll` (Task 4).

- [ ] **Step 1: Thay inline style bằng class và token, từng màn một, commit từng màn.**

Thứ tự và phạm vi: theo `ui-visual-plan.md` §6. Mỗi màn: chạy `npx vitest run` sau khi đổi.

- [ ] **Step 2: Kiểm layout ở 360px và 1280px**

Run: `cd frontend && npx next dev` rồi chụp bằng trình duyệt ở hai chiều rộng.
Expected: không cuộn ngang; tên món dài xuống dòng; nút chính đủ rộng; modal không vượt màn hình.

- [ ] **Step 3: Commit từng màn**

```bash
git commit -am "style(frontend): màn Menu dùng token và layout điện thoại"
```

### Task 8: Ảnh món thật (thay bằng Task 7a)

> **Thay bằng Task 7a.** Quyết định 1 và 4 đã chốt: dùng bộ SVG nét mực. Không cần ảnh chụp thật; phần dưới giữ lại để tham chiếu, không làm.

**Files:**
- Replace: `frontend/public/images/*.svg` (ảnh tạm) bằng ảnh thật
- Modify: `frontend/src/lib/mock-products.ts` hoặc dữ liệu ảnh từ backend (theo đường dẫn đã có)
- Modify: `backend/prisma/seed.ts` (đường dẫn ảnh) nếu đổi tên file

**Interfaces:** không đổi kiểu. `image` của sản phẩm vẫn là chuỗi đường dẫn.

- [ ] **Step 1: Chờ người cung cấp ảnh (Quyết định 4).** Nếu chưa có, giữ SVG và đánh dấu việc này là còn mở trong checkpoint.
- [ ] **Step 2: Kiểm `next/image` không lỗi, `alt` có tên món; commit.**

### Task 9: Đối chiếu với wireframe và bảo đảm trạng thái đồng nhất

**Files:**
- Modify: các màn đã làm ở Task 7 cho khớp wireframe §7 (thứ tự phần tử, nút, dòng "Mời tới quầy lấy nước", "Mã đơn: #xxxxxxxx")
- Modify: `docs/user-sequence-specifications.md` nếu có chênh lệch có chủ đích (ghi rõ)

**Interfaces:** không đổi.

- [ ] **Step 1: Lập bảng 5 dòng: wireframe / hiện tại / khớp hay lệch có chủ đích.**
- [ ] **Step 2: Sửa chỗ lệch không có chủ đích; test pass; commit.**

### Checkpoint 4: UI xong

- [ ] Kiểm: vitest, tsc, build, backend jest.
- [ ] Ghi checklist 5 màn ở 360px và 1280px vào `docs/checkpoints/2026-10-09-ui-checkpoint-4.md`, kèm đường dẫn ảnh.
- **Dừng.** Người duyệt giao diện trước khi chuyển sang đóng gói.

---

### Task 10: Đóng gói production và lint

**Files:**
- Modify: `frontend/Dockerfile` (chuyển từ `npm run dev` sang `next build` + `next start`)
- Modify: `docker-compose.yml` nếu cổng hoặc biến môi trường đổi
- Create: `frontend/.eslintrc.json` (theo quyết định 5)
- Modify: `frontend/package.json` (script `lint`)

**Interfaces:** không đổi.

- [ ] **Step 1: Test trước: `docker compose build frontend` thành công; `docker compose up -d` và `curl -sf localhost:3000` trả 200.**
- [ ] **Step 2: Sửa Dockerfile; chạy lại kiểm trên.**
- [ ] **Step 3: `npm run lint` không lỗi (hoặc chỉ lỗi đã ghi nhận có chủ đích).**
- [ ] **Step 4: Commit**

```bash
git commit -am "build(frontend): Dockerfile production và cấu hình ESLint"
```

### Task 11: Kiểm thử cuối và bàn giao

**Files:**
- Modify: `docs/develop-status-report.md` (mục mới cho đợt UI)
- Modify: `docs/scrum-process.md` (các chỗ `[nhóm điền]` liên quan đến UI, nếu người duyệt yêu cầu)
- Modify: `README.md` (cách chạy, tài khoản demo, ảnh)

**Interfaces:** không đổi.

- [ ] **Step 1: Chạy checklist đầy đủ trên compose với `@smoke.test`: đăng ký, đặt, trả, đổi trạng thái barista, lịch sử, admin +10 kho. Dọn bằng `smoke:clean`.**
- [ ] **Step 2: Kiểm các 5 điểm Review Focus bằng tay, ghi kết quả.**
- [ ] **Step 3: Cập nhật tài liệu; commit.**

### Checkpoint 5 (cuối): Sẵn sàng bàn giao

- [ ] Toàn bộ lệnh kiểm chạy xanh; ghi số liệu thật, không ước lượng.
- [ ] Ghi `docs/checkpoints/2026-10-09-ui-checkpoint-5.md`.
- [ ] Chưa push và chưa merge vào `main`. Chờ người duyệt rồi làm theo lệnh của họ.

---

## Quyết định cần người chốt

Các mục dưới đây không chặn Checkpoint 0 và Task 1–2. Mỗi mục có mặc định, dùng nếu không có phản hồi.

1. **Phạm vi có ảnh thật không?** Đã chốt: bộ SVG nét mực (Task 7a). Task 8 bị thay.
2. **Tổng điểm thưởng cho khách có làm không?** Đã làm: `GET /users/me` và trang `/profile` (commit `f41c0a8`).
3. **`productName` của đơn nhiều món hiện thế nào?** Mặc định: ghép tên các món bằng ", " và cắt sau 60 ký tự.
4. **Ai cung cấp ảnh món và định dạng?** Đã chốt: bộ SVG nét mực, không cần ảnh ngoài (Task 7a).
5. **ESLint dùng cấu hình nào?** Mặc định: `next/core-web-vitals`, chạy `next lint` một lần trước Task 10.

## Self-review

- **Phủ spec:** §7 (5 màn) → Task 7, 9. §9 tiêu chí và backlog nối backend → Task 3, 4, 5, 6. §10 "không lỗi build" → Checkpoint 4, 5. §11 bàn giao → Task 10, 11. Checkpoint backend mục 7 A, B, C: A → Task 3–6; B → Task 1, 7, 8; C → Task 10, 11. Không có mục nào trong checkpoint backend không có task.
- **Kiểu nhất quán:** `useAsync`, `ApiError`, `useOrderPoll`, `isTerminal`, `addItem` được định nghĩa ở task trước khi task sau dùng.
- **Tỷ lệ:** plan ngắn hơn spec và không chứa code đầy đủ.
- **Chỗ còn mở:** Task 8 phụ thuộc ảnh; Task 10 phụ thuộc quyết định 5; Task 3 là thay đổi backend duy nhất trong plan, đã kèm test và đồng bộ tài liệu.

## Execution Handoff

Plan đã lưu tại `docs/planning/2026-10-09-frontend-ui-plan.md` (nhánh `worktree-ui-plan-checkpoint`, chưa commit).

Bạn duyệt plan và chọn cách làm:

- **Subagent-driven**: mỗi task một subagent làm, một reviewer kiểm trước khi sang task sau. Kỹ hơn, tốn context hơn.
- **Native**: tôi làm từng task trong phiên này, kiểm ở mỗi checkpoint. Nhanh và rẻ hơn, không có reviewer độc lập đến cuối.

Tôi đề xuất **Native**, vì 11 task nối nhau theo các interface nhỏ và mỗi checkpoint đã có người duyệt. Bạn chốt cách làm và trả lời 5 quyết định ở trên (hoặc để mặc định) rồi tôi bắt đầu từ Checkpoint 0.

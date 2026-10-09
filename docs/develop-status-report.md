# Báo cáo hiện trạng nhánh `develop` — đối chiếu 10 task (Mục 8) + API (12.1) + thực thể (12.2)

> Ngày: 2026-10-08 (cập nhật 2026-10-09). HEAD khi viết: `b290706`; HEAD khi cập nhật: `259f9ff`, thêm hai merge ngày 2026-10-09 là `0e8773b` (sửa 3 lỗi review: hoàn tiền mọi lỗi sau charge, compose không đọc `DATABASE_URL` từ `.env`, thông báo lỗi thanh toán tiếng Việt) và `e938c18` (Order State Machine hiện trên giao diện). Phạm vi: những gì đã nâng cấp để đạt yêu cầu và những gì chưa đạt.
> Cập nhật 2026-10-08 — mọi sửa của phiên này ĐÃ COMMIT qua nhánh `fix/review-docs-code` (`b6a2f76` code+test, `652b5f6` docs) rồi merge `--no-ff` về `develop` (`b290706`, **chưa push**): CORS, giá tính ở server, khóa thanh toán song song, FE giữ `orderId` khi trả lỗi, `POST /payments` gắn `JwtAuthGuard` + kiểm tra chủ đơn; docs UC05 (mục 2.4 A + sơ đồ B) bổ sung bước 401/403 theo đúng thứ tự guard → chủ đơn → cache → charge, 8/8 khối PlantUML trong 2 file spec render lại không lỗi; kèm sửa build `frontend/package.json` nâng `@types/node` lên `^20.19.0` + cập nhật `package-lock.json` (trước đó `npm ci` trong image `node:20-alpine` / npm 10.8.2 fail vì vite qua vitest có peer `@types/node ^20.19.0 || >=22.12.0` còn lock ghim 20.14.0 nên thiếu entry cho bản 26.6.4). Các dòng Task 3/6/9/10 và mục 2 đã sửa cho khớp code.
> Lưu ý: commit `b6a2f76` gồm cả thay đổi FE đang dở trong working tree lúc commit (nút Hủy ở `/history` + `cancelOrder()`, `getProducts()` bỏ fallback menu mẫu, test `api.test.ts` và `pricing-table.spec.ts`) — chúng nằm trong scope `frontend/src/**` + `backend/test/**` của kế hoạch và test xanh nên đi kèm. Kế hoạch 5 task P1 (đã xong hết) ở `docs/planning/2026-10-08-p1-must-do-plan.md` — thư mục này trước nằm ở `docs/superpowers/` (bị `.gitignore`), đã chuyển sang `docs/planning/` và commit ở `259f9ff`.
> Lưu ý demo (cập nhật sau plan `docs/planning/2026-10-09-barista-admin-plan.md`): nút "Quầy (demo)" trên `/history` đã **gỡ**; tiến đơn do Barista làm ở `/barista` (mục 5). Ô chưa tick ở `2026-10-09-order-state-machine-visible-plan.md` (bấm "Quầy (demo)" 3 lần đến `COMPLETED` để chụp slide) không còn áp dụng: thay bằng chụp `/barista` và thanh tiến trình ở `/history` (cần người làm).
> Nguồn chuẩn duy nhất cho yêu cầu là `docs/BrewLite-CongNghePhanMem-fixed.md`; file này chỉ ghi trạng thái + bằng chứng, không chép lại code.

## 1. Đã đạt (đủ điều kiện tính điểm cả 10 task)

| Task | Nâng cấp | Bằng chứng (file/commit kiểm chứng) |
|---|---|---|
| 1 Khởi tạo | Có sẵn từ trước | `docker compose ps` 3 service Up; `.env.example` đầy đủ |
| 2 `GET /products` | `ProductModule`: list lọc `stock > 0`, detail 404; seed 4 món | `backend/test/order-product.spec.ts`; smoke `GET /products` → 4 món |
| 3 Menu FE | Có sẵn: skeleton loading + mock-banner. `getProducts()` (`lib/api.ts`) chỉ trả menu mẫu khi **chưa cấu hình** `NEXT_PUBLIC_API_URL`; đã cấu hình thì lỗi mạng/HTTP ném lỗi → `ProductGrid` hiện error + "Thử lại", rỗng → "Chưa có món nào" (hết nhánh code chết) | `frontend/src/components/ProductGrid.tsx`; `frontend/src/lib/api.test.ts` (5 test `getProducts`); `npm run build` sạch |
| 4 Tùy chọn món | Mới `ProductDetailModal.tsx`: Size S/M/L, 3 topping, số lượng, giá live từ `lib/pricing.ts` | commit `e14ccb6`; build sạch |
| 5 Giỏ hàng | Có sẵn Zustand + persist + badge `Header`; nối `items` sang checkout | `frontend/src/store/cart.ts`, `cart/page.tsx`; build sạch |
| 6 `POST /orders` | Mới `OrderModule` + `JwtAuthGuard`: giá tính hoàn toàn ở server (`product.price` + size/topping theo `backend/src/order/pricing.ts`; DTO không nhận `unitPrice` của client), thiếu size → M, topping lạ 400, sp lạ 404, 401 thiếu JWT | `order-product.spec.ts` (tổng 100000 + test size mặc định/topping lạ); smoke `PENDING` + `401` |
| 7 JWT | Mới `AuthModule`: register (409 trùng, bcrypt hash), login (401 đồng nhất), guard; trang `/login` lưu `brewlite-token` | `backend/test/auth.spec.ts` (6 test); smoke token + đăng nhập `demo@brewlite.vn/demo1234` (xem README) |
| 8 Thanh toán | Xóa `shouldSimulateFailure` khỏi DTO; voucher passthrough; checkout 2 bước `POST /orders` → `POST /payments` + `Idempotency-Key` | idempotent 1-charge, fail giữ giỏ + retry, refund thực thu; smoke thật `201 amount=40500` → replay `200` |
| 9 Bàn giao | Mới `/history` (token-gated, mới-nhất-trước); seed login demo; compose boot (migrate + seed + start); mục demo trong README; `EXTRA_TASKS.md` | API smoke qua compose có (xem Task 8). **Demo end-to-end qua compose đã kiểm lại 2026-10-08** (`docker compose up --build` → 3 service Up): menu `GET /products` trả dữ liệu thật (`p1`–`p4`), trang :3001 không còn banner "menu mẫu", header `Access-Control-Allow-Origin: http://localhost:3001` có đúng; đăng nhập `demo@brewlite.vn/demo1234` OK; đơn size L + topping "Trân châu" server tự tính `total=50000` (giá client gửi kèm bị bỏ qua), `BREWLITE10` → `amount=45000`/`discount=5000` khớp số trên màn hình; `/orders/me` có đơn mới ở đầu, trạng thái `PAID`; bỏ token → `POST /payments` 401; người lạ trả đơn của chủ → 403. Bằng chứng: commit `b6a2f76` (code fix CORS/pricing/lock/auth) + merge `b290706`. Lưu ý: các bước trên chạy bằng script qua đúng endpoint FE gọi; thao tác bấm chuột trên trình duyệt để con người xác nhận lần cuối |
| 10 Nghiệp vụ | PG adapters (`Prisma*Repo`, chọn theo `DATABASE_URL`); fix mapping `OrderItem`, restore tăng version, refund cộng dồn, hash pass-through; pin toán voucher/loyalty, guard-allow, cancel các nhánh | suite backend **68 pass + 1 pg-skip** (`npx jest`, chạy lại 2026-10-09, trước phần mở rộng Barista + Admin: hiện **92 pass + 1 skip**, mục 5; thêm test hoàn tiền cho mọi lỗi sau charge và test chốt cấu hình compose/.env; gồm `pricing-table.spec.ts` pin bảng giá BE/FE và test 2 request song song cùng key / khác key cùng đơn chỉ charge 1 lần); pg suite đã chạy lại trên DB compose (`DATABASE_URL=postgresql://brewlite:brewlite@localhost:5432/brewlite npx jest test/pg-payment.integration.spec.ts`) sau bản đổi chữ ký `processPayment(userId, dto, key)`: pass; state machine 14 test |

Thực thể (Mục 12.2): đủ 5 bảng đúng field trong `backend/prisma/schema.prisma`; migration `20261007163647_init` đã apply (`idempotencyKey @unique` có thật trong DB).

**Docs đã đồng bộ với code (commit `652b5f6`):**
- `user-sequence-specifications.md` mục 2.4 (UC04+UC05+UC05a): mục A thêm bước đầu "Xác thực & phân quyền (chạy trước mọi nhánh)" — `JwtAuthGuard` 401, đọc đơn 404/403, kể cả khi key trỏ biên lai của đơn khác; sơ đồ B thêm `alt Thiếu/sai token` (401, dừng) trước bước xếp hàng khóa và `alt Không phải chủ đơn` (404/403, dừng) sau khóa → mục A, sơ đồ B, mục C, bảng Phần III giờ mô tả cùng thứ tự **guard → chủ đơn → cache → charge**.
- Kiểm tra render: 8/8 khối `plantuml` trong 2 file spec (`user-sequence-specifications.md`, `use-case-specifications.md`) render PNG không lỗi, không warning (plantuml.jar 1.2026.8, Java 24; sequence/use-case diagram không cần Graphviz).
- Cột UC06 trong bảng Phần III đã ghi FE có nút Hủy ở `/history` (`cancelOrder()` trong `lib/api.ts`), thanh tiến trình 5 bước và nút "Quầy (demo)" (`advanceOrder()`), khớp code. Sơ đồ trạng thái PlantUML (9 mũi tên §9.1) và Kịch bản 4 nằm ở §2.5 `docs/user-sequence-specifications.md`; Use Case gốc không thêm UC/tác nhân Barista. *(Lịch sử tại thời điểm đó; nay nút "Quầy (demo)" và Kịch bản 4 đã gỡ, Use Case gốc có Barista/Admin, xem mục 5.)*

## 2. Chưa đạt / còn nợ

1. **Barista / `GET /orders` (queue quầy): ban đầu KHÔNG LÀM, nay đã làm như mở rộng ngoài đề (2026-10-09, mục 5); `GET /orders/:id` làm.** Đối chiếu đề gốc `BrewLite-CongNghePhanMem.pdf` (2026-10-08): §12.1 gốc chỉ có 7 endpoint, **không có** `GET /orders`, `GET /orders/:id`, `PATCH /orders/:id` — 3 dòng này do bản `-fixed.md` thêm vào, nay đã tách thành ghi chú "mở rộng của nhóm". Quyết định 2026-10-08 là không dựng barista/admin vì đề bài không yêu cầu; sau đó nhóm chốt lại 16 UC trên biểu đồ Use Case gốc nên đã hiện thực UC08–UC12 và UC14 (UC13, UC15 là backlog), xem mục 5. `GET /orders/:id` vẫn có để receipt poll trạng thái. Tồn kho khi thanh toán không đổi: trừ khi pay, hoàn khi cancel/kẹt kho, khóa `version` — đã xong trong luồng thanh toán.
2. ~~Frontend không có test runner~~ — **đã xử lý** (merge `feat/frontend-tests`): vitest `pricing` + `cart` + `api-gateway` + `api` + `order-status` + `OrderStatusTrack` (render HTML), **71 pass** (`npx vitest run`, chạy lại 2026-10-09, trước phần mở rộng Barista + Admin: hiện **86 pass**, mục 5; `order-status.test.ts` ghim đúng 9 mũi tên §9.1 và đọc thẳng `ALLOWED` của backend). UI component (Task 3/4/9-UI) vẫn chỉ có build + smoke tay.
3. **pg suite mặc định skip** — chỉ chạy khi có `DATABASE_URL`; đã chạy lại trên DB compose 2026-10-08 (bằng chứng ở dòng Task 10).
4. ~~Ghi sau charge chưa bọc `$transaction`~~ — **đã xử lý** (merge `feature/payment-tx`): trừ kho + `PAID` + cộng điểm + biên lai nằm trong 1 `runInTransaction`; kẹt kho → rollback + hoàn tiền + `PAYMENT_FAILED` + 409 (đã cập nhật UC 2.4 trong `docs/user-sequence-specifications.md`). Hủy đơn `PAID` cũng đã bọc transaction: refund (cổng ngoài) → `runInTransaction` { hoàn kho mọi món + `CANCELLED` }, test rollback ở `order-payment.integration.spec.ts`; giới hạn còn lại: refund nằm ngoài transaction nên transaction lỗi sau refund thì tiền đã hoàn mà đơn vẫn `PAID`. Còn lại: khóa chống thanh toán song song là khóa trong tiến trình, chỉ đúng với 1 instance backend.
5. **TailwindCSS / Passport / React Query không dùng** — quyết định có chủ ý (Mục 6 cho phép chọn: inline-style thay Tailwind, Zustand thay React Query, guard tự viết thay Passport). Không phải thiếu sót.
6. `PATCH /orders/:id` còn nằm ở `PaymentController` thay vì `OrderController` — đúng hành vi, đã test; dời khi refactor (cosmetic).
7. **Đơn `PAYMENT_FAILED` bị bỏ lại — quyết định: không dọn tự động (2026-10-08).** Bấm "← Quay lại giỏ" cố ý bỏ `orderId` (giỏ có thể đã đổi) nên lần sau tạo đơn mới và đơn lỗi cũ nằm lại. Không dọn vì: đơn `PAYMENT_FAILED` chưa trừ kho và chưa thu tiền (kho chỉ trừ khi `PAID`) nên không gây hại; tự hủy khi tạo đơn mới thêm một lời gọi ngầm và phải giữ `orderId` cũ qua `cart/page.tsx`. Khách tự hủy được ở `/history` bằng nút "Hủy đơn" (đơn `PAYMENT_FAILED` hủy hợp lệ, không hoàn tiền). Đổi ý thì làm theo Task 6 của `docs/planning/2026-10-08-p2-tech-debt-plan.md`.
8. **Khóa thanh toán cho nhiều instance — không áp dụng.** Compose chạy 1 backend nên giữ khóa trong tiến trình (`withLock`, ghi chú `ponytail:` trong `payment.service.ts`); chỉ đổi sang `pg_advisory_xact_lock` / `SELECT … FOR UPDATE` khi scale > 1 instance.

## 3. Ghi chú ngoài phạm vi 3-5-8-10

Các task của teammate do nhánh này tự code để demo (chi tiết xem `EXTRA_TASKS.md` ở root): Task 2, Task 4-UI (modal), Task 6, Task 7, Task 9 (history + compose + seed).

## 4. Chia việc qua worktree (mỗi agent 1 worktree, 1 nhánh)

> Lịch sử: cả 3 nhánh dưới đây đã merge về `develop` (`a92dc00`, `c26455e`, `61602da`) và worktree đã xóa.

Nhánh `develop` là nhánh tích hợp, không code trực tiếp. Agent nhận worktree + làm xong thì review rồi merge về `develop`.

| Worktree (thư mục) | Nhánh | Việc | Phạm vi file (cấm lấn) | Xong khi |
|---|---|---|---|---|
| `../BrewLite-wt-fe-tests` | `feat/frontend-tests` | Gap 2: dựng vitest + test `pricing.ts` (size/topping/voucher math), `cart.ts` (add/qty/total/persist key) | `frontend/**` only; **không đổi** UI/logic | `npm test` xanh trong worktree |
| `../BrewLite-wt-pay-tx` | `feat/payment-tx` | Gap 4: bọc 3 lệnh ghi sau charge trong transaction nguyên tử (giữ seam `I*Repository` cho cả InMemory + Prisma) | `payment.service.ts`, contracts, cả 2 bộ repo impl; **không đổi** hành vi API | full suite xanh + pg suite trên DB của checkout chính |
| `../BrewLite-wt-order-advance` | `feat/order-advance` | Gap 1 (thay thế quầy): mở rộng `PATCH /orders/:id` cho tiến đơn + thêm `GET /orders/:id`; test guard-owner/401/thứ tự sai | `backend/src/order/*`, `UpdateOrderStatusDto`, `backend/test/order-*.spec.ts`; **không đụng** logic charge/refund | curl demo `PAID→PREPARING→READY→COMPLETED` + test xanh |
| (checkout chính `E:/CNPM/BrewLite`) | `develop` | Tích hợp: merge từng nhánh sau review; chạy demo compose; push | — | smoke E2E xanh |

Quy tắc chung:
- Tạo worktree: `git worktree add ../BrewLite-<tên> -b <nhánh> develop` (từ checkout chính, khi `develop` sạch).
- Test mặc định chạy InMemory (không cần DB) nên các agent không giẫm port; pg suite chỉ chạy ở checkout chính (DB compose `:5432`).
- Xóa worktree sau merge: `git worktree remove ../BrewLite-<tên>` + `git branch -d <nhánh>`.
- Gap 3 (pg skip mặc định) và Gap 5 (Tailwind/Passport/React Query — quyết định không làm) không cần worktree.

## 5. Mở rộng ngoài đề: Barista + Admin (2026-10-09)

> Nhánh `feat/barista-admin` (plan `docs/planning/2026-10-09-barista-admin-plan.md`). Đề gốc chỉ yêu cầu MVP phân hệ Khách hàng (§3.2); phần này là mở rộng của nhóm để Order State Machine §9.1 có người vận hành thật, bám biểu đồ Use Case gốc 16 UC (Bản 1 trong `docs/use-case-specifications.md`).

**Tóm tắt**
- **Phạm vi:** UC08–UC12 (Pha chế) và UC14 (kiểm & điều chỉnh tồn kho món, Admin) **đã hiện thực**. UC13 (quản lý món & thực đơn) và UC15 (quản lý mã giảm giá) **chưa hiện thực** (backlog §11.4; UC15 còn trái chốt voucher nội bộ).
- **Vai trò:** `User.role` (`CUSTOMER` / `BARISTA` / `ADMIN`), JWT mang `role`, `RolesGuard` + `@Roles()`. Không thêm bảng (vẫn 5 thực thể). Seed: `demo@brewlite.vn` / `demo1234`, `barista@brewlite.vn` / `barista1234`, `admin@brewlite.vn` / `admin1234`.
- **API:** `GET /orders?status=PAID,PREPARING,READY` (BARISTA/ADMIN, FIFO, kèm tên món); `PATCH /orders/:id` theo vai trò (khách chỉ hủy đơn của mình; BARISTA/ADMIN tiến đơn và chỉ hủy đơn `PAID`, `PENDING` / `PAYMENT_FAILED` → 403, từ `PREPARING` → 400); `GET /admin/products` và `PATCH /admin/products/:id/stock` (ADMIN, optimistic lock theo `version`: lệch 409, âm 400).
- **Giao diện:** `/barista` (3 cột Chờ pha / Đang pha / Sẵn sàng; nút Nhận pha / Pha xong / Đã giao; "Hủy (hết nguyên liệu)" chỉ ở cột Chờ pha; tự tải lại mỗi 5 giây), `/admin` (bảng tồn kho, −1 / +1 / +10, nhập số rồi Lưu, báo 409), đăng nhập điều hướng theo vai trò đọc từ JWT.
- **Lịch sử:** nút "Quầy (demo)" ở `/history` và biến `NEXT_PUBLIC_DEMO_COUNTER` đã gỡ (commit `fe0c06e`); các chỗ ở mục 1–2 nhắc tới chúng là lịch sử.
- **Commit:** `b495fbf` (role + `RolesGuard` + seed), `8b97687` (hàng đợi quầy), `de96087` (`PATCH /orders/:id` theo vai trò, UC12), `1538017` (API tồn kho), `fe0c06e` (FE đọc vai trò), `d9117a3` (`/barista`), `56f4027` (`/admin`).

**Số test mới** (chạy lại 2026-10-09): backend 68 pass / 1 skip → **92 pass / 1 skip** (+24; `cd backend && npx jest`, suite pg vẫn skip khi không có `DATABASE_URL`); frontend 71 → **86 pass** (+15; `cd frontend && npx vitest run`).

**Docs đồng bộ:** `use-case-specifications.md` (Bản 1 là gốc, UC13 / UC15 ghi "chưa hiện thực"), `user-sequence-specifications.md` (§2.7 UC08–UC12, §2.8 UC14, §2.5 bỏ Kịch bản 4, sơ đồ trạng thái theo Barista, bảng đồng bộ 14 UC), `BrewLite-CongNghePhanMem-fixed.md` §12 (chỉ ghi chú của nhóm), `README.md`. Kiểm tra render: 11/11 khối `plantuml` trong 2 file spec render SVG không lỗi (plantuml-1.2026.8.jar, sha256 khớp trang release, Java 24, `PLANTUML_SECURITY_PROFILE=SANDBOX`, exit 0); 14 nhãn UC của Bản 1 (trừ UC13, UC15) xuất hiện nguyên văn trong `user-sequence-specifications.md`.

**Còn lại:** chưa có bằng chứng chạy end-to-end trên compose (Postgres thật) cho các màn mới; `scripts/demo-state-machine.sh` đã chuyển sang tài khoản barista cho các lệnh `PATCH` tiến đơn (khách vẫn tạo đơn, trả tiền và đọc trạng thái; thêm bước kiểm khách tự tiến đơn bị 403); chạy trên stack compose thật xem README mục "Demo State Machine".

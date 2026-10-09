# Báo cáo hiện trạng nhánh `develop` — đối chiếu 10 task (Mục 8) + API (12.1) + thực thể (12.2)

> Ngày: 2026-10-08 (cập nhật 2026-10-09). HEAD khi viết: `b290706`; HEAD khi cập nhật: `259f9ff`, thêm hai merge ngày 2026-10-09 là `0e8773b` (sửa 3 lỗi review: hoàn tiền mọi lỗi sau charge, compose không đọc `DATABASE_URL` từ `.env`, thông báo lỗi thanh toán tiếng Việt) và `e938c18` (Order State Machine hiện trên giao diện). Phạm vi: những gì đã nâng cấp để đạt yêu cầu và những gì chưa đạt.
> Cập nhật 2026-10-08 — mọi sửa của phiên này ĐÃ COMMIT qua nhánh `fix/review-docs-code` (`b6a2f76` code+test, `652b5f6` docs) rồi merge `--no-ff` về `develop` (`b290706`, **chưa push**): CORS, giá tính ở server, khóa thanh toán song song, FE giữ `orderId` khi trả lỗi, `POST /payments` gắn `JwtAuthGuard` + kiểm tra chủ đơn; docs UC05 (mục 2.4 A + sơ đồ B) bổ sung bước 401/403 theo đúng thứ tự guard → chủ đơn → cache → charge, 8/8 khối PlantUML trong 2 file spec render lại không lỗi; kèm sửa build `frontend/package.json` nâng `@types/node` lên `^20.19.0` + cập nhật `package-lock.json` (trước đó `npm ci` trong image `node:20-alpine` / npm 10.8.2 fail vì vite qua vitest có peer `@types/node ^20.19.0 || >=22.12.0` còn lock ghim 20.14.0 nên thiếu entry cho bản 26.6.4). Các dòng Task 3/6/9/10 và mục 2 đã sửa cho khớp code.
> Lưu ý: commit `b6a2f76` gồm cả thay đổi FE đang dở trong working tree lúc commit (nút Hủy ở `/history` + `cancelOrder()`, `getProducts()` bỏ fallback menu mẫu, test `api.test.ts` và `pricing-table.spec.ts`) — chúng nằm trong scope `frontend/src/**` + `backend/test/**` của kế hoạch và test xanh nên đi kèm. Kế hoạch 5 task P1 (đã xong hết) trước nằm ở `docs/planning/2026-10-08-p1-must-do-plan.md`, đã xóa khỏi thư mục khi tick hết (xem `git show da047b6:docs/planning/2026-10-08-p1-must-do-plan.md`). Thư mục `docs/planning/` trước nằm ở `docs/superpowers/` (bị `.gitignore`), đã chuyển sang và commit ở `259f9ff`.
> Lưu ý demo (cập nhật sau plan `docs/planning/2026-10-09-barista-admin-plan.md` (đã xóa sau merge `4974abd`; bản đầy đủ: `git show 4974abd:docs/planning/2026-10-09-barista-admin-plan.md`)): nút "Quầy (demo)" trên `/history` đã **gỡ**; tiến đơn do Barista làm ở `/barista` (mục 5). Ô chưa tick ở `2026-10-09-order-state-machine-visible-plan.md` trước ghi bấm "Quầy (demo)" 3 lần đến `COMPLETED`; nay đã đổi thành checklist `/barista` (khách đặt và trả, `barista@…` bấm Nhận pha → Pha xong → Đã giao, chụp `/barista` và thanh tiến trình ở `/history`), vẫn cần người làm.
> Dọn `docs/planning/` (2026-10-09, commit `b5fe9db`): xóa 2 plan đã tick hết (`p1-must-do`, `review-3-bugs`), rút gọn 2 plan còn ô chưa tick (`p2-tech-debt` chỉ còn Task 7; `order-state-machine-visible` chỉ còn mục kiểm chứng cuối). Bản đầy đủ trước khi rút gọn: `git show da047b6:docs/planning/<tên file>`.
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
| 10 Nghiệp vụ | PG adapters (`Prisma*Repo`, chọn theo `DATABASE_URL`); fix mapping `OrderItem`, restore tăng version, refund cộng dồn, hash pass-through; pin toán voucher/loyalty, guard-allow, cancel các nhánh | suite backend **68 pass + 1 pg-skip** (`npx jest`, chạy lại 2026-10-09, trước phần mở rộng Barista + Admin: hiện **104 pass + 1 skip** (103 sau mục 5, +1 `bootstrap-env.spec.ts` khi bắt buộc `DATABASE_URL`); thêm test hoàn tiền cho mọi lỗi sau charge và test chốt cấu hình compose/.env; gồm `pricing-table.spec.ts` pin bảng giá BE/FE và test 2 request song song cùng key / khác key cùng đơn chỉ charge 1 lần); pg suite đã chạy lại trên DB compose (`DATABASE_URL=postgresql://brewlite:brewlite@localhost:5432/brewlite npx jest test/pg-payment.integration.spec.ts`) sau bản đổi chữ ký `processPayment(userId, dto, key)`: pass; state machine 14 test |

Thực thể (Mục 12.2): đủ 5 bảng đúng field trong `backend/prisma/schema.prisma`; migration `20261007163647_init` đã apply (`idempotencyKey @unique` có thật trong DB).

**Docs đã đồng bộ với code (commit `652b5f6`):**
- `user-sequence-specifications.md` mục 2.4 (UC04+UC05+UC05a): mục A thêm bước đầu "Xác thực & phân quyền (chạy trước mọi nhánh)" — `JwtAuthGuard` 401, đọc đơn 404/403, kể cả khi key trỏ biên lai của đơn khác; sơ đồ B thêm `alt Thiếu/sai token` (401, dừng) trước bước xếp hàng khóa và `alt Không phải chủ đơn` (404/403, dừng) sau khóa → mục A, sơ đồ B, mục C, bảng Phần III giờ mô tả cùng thứ tự **guard → chủ đơn → cache → charge**.
- Kiểm tra render: 8/8 khối `plantuml` trong 2 file spec (`user-sequence-specifications.md`, `use-case-specifications.md`) render PNG không lỗi, không warning (plantuml.jar 1.2026.8, Java 24; sequence/use-case diagram không cần Graphviz).
- Cột UC06 trong bảng Phần III đã ghi FE có nút Hủy ở `/history` (`cancelOrder()` trong `lib/api.ts`), thanh tiến trình 5 bước và nút "Quầy (demo)" (`advanceOrder()`), khớp code. Sơ đồ trạng thái PlantUML (9 mũi tên §9.1) và Kịch bản 4 nằm ở §2.5 `docs/user-sequence-specifications.md`; Use Case gốc không thêm UC/tác nhân Barista. *(Lịch sử tại thời điểm đó; nay nút "Quầy (demo)" và Kịch bản 4 đã gỡ, Use Case gốc có Barista/Admin, xem mục 5.)*

## 2. Chưa đạt / còn nợ

1. **Barista / `GET /orders` (queue quầy): ban đầu KHÔNG LÀM, nay đã làm như mở rộng ngoài đề (2026-10-09, mục 5); `GET /orders/:id` làm.** Đối chiếu đề gốc `BrewLite-CongNghePhanMem.pdf` (2026-10-08): §12.1 gốc chỉ có 7 endpoint, **không có** `GET /orders`, `GET /orders/:id`, `PATCH /orders/:id` — 3 dòng này do bản `-fixed.md` thêm vào, nay đã tách thành ghi chú "mở rộng của nhóm". Quyết định 2026-10-08 là không dựng barista/admin vì đề bài không yêu cầu; sau đó nhóm chốt lại 16 UC trên biểu đồ Use Case gốc nên đã hiện thực UC08–UC12 và UC14 (UC13, UC15 là backlog), xem mục 5. `GET /orders/:id` vẫn có để receipt poll trạng thái. Tồn kho khi thanh toán không đổi: trừ khi pay, hoàn khi cancel/kẹt kho, khóa `version` — đã xong trong luồng thanh toán.
2. ~~Frontend không có test runner~~ — **đã xử lý** (merge `feat/frontend-tests`): vitest `pricing` + `cart` + `api-gateway` + `api` + `order-status` + `OrderStatusTrack` (render HTML), **71 pass** (`npx vitest run`, chạy lại 2026-10-09, trước phần mở rộng Barista + Admin: hiện **89 pass**, mục 5; `order-status.test.ts` ghim đúng 9 mũi tên §9.1 và đọc thẳng `ALLOWED` của backend). UI component (Task 3/4/9-UI) vẫn chỉ có build + smoke tay.
3. **pg suite mặc định skip** — chỉ chạy khi có `DATABASE_URL`; đã chạy lại trên DB compose 2026-10-08 (bằng chứng ở dòng Task 10).
4. ~~Ghi sau charge chưa bọc `$transaction`~~ — **đã xử lý** (merge `feature/payment-tx`): trừ kho + `PAID` + cộng điểm + biên lai nằm trong 1 `runInTransaction`; kẹt kho → rollback + hoàn tiền + `PAYMENT_FAILED` + 409 (đã cập nhật UC 2.4 trong `docs/user-sequence-specifications.md`). Hủy đơn `PAID` cũng đã bọc transaction: refund (cổng ngoài) → `runInTransaction` { hoàn kho mọi món + `CANCELLED` }, test rollback ở `order-payment.integration.spec.ts`; giới hạn còn lại: refund nằm ngoài transaction nên transaction lỗi sau refund thì tiền đã hoàn mà đơn vẫn `PAID`, hủy lại sẽ hoàn lần 2. Người dùng đã chốt (2026-10-09) ghi nhận có chủ đích, không sửa code; giới hạn đã ghi ở mục C của UC06 / UC12 trong `docs/user-sequence-specifications.md`. Còn lại: khóa chống thanh toán song song là khóa trong tiến trình, chỉ đúng với 1 instance backend.
5. **TailwindCSS / Passport / React Query không dùng** — quyết định có chủ ý (Mục 6 cho phép chọn: inline-style thay Tailwind, Zustand thay React Query, guard tự viết thay Passport). Không phải thiếu sót.
6. `PATCH /orders/:id` còn nằm ở `PaymentController` thay vì `OrderController` — đúng hành vi, đã test; dời khi refactor (cosmetic).
7. **Đơn `PAYMENT_FAILED` bị bỏ lại — quyết định: không dọn tự động (2026-10-08).** Bấm "← Quay lại giỏ" cố ý bỏ `orderId` (giỏ có thể đã đổi) nên lần sau tạo đơn mới và đơn lỗi cũ nằm lại. Không dọn vì: đơn `PAYMENT_FAILED` chưa trừ kho và chưa thu tiền (kho chỉ trừ khi `PAID`) nên không gây hại; tự hủy khi tạo đơn mới thêm một lời gọi ngầm và phải giữ `orderId` cũ qua `cart/page.tsx`. Khách tự hủy được ở `/history` bằng nút "Hủy đơn" (đơn `PAYMENT_FAILED` hủy hợp lệ, không hoàn tiền). Đổi ý thì làm theo Task 6 trong `da047b6:docs/planning/2026-10-08-p2-tech-debt-plan.md` (đã rút khỏi file plan khi quyết định xong).
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

> Nhánh `feat/barista-admin` (plan `docs/planning/2026-10-09-barista-admin-plan.md` (đã xóa sau merge `4974abd`; bản đầy đủ: `git show 4974abd:docs/planning/2026-10-09-barista-admin-plan.md`)). Đề gốc chỉ yêu cầu MVP phân hệ Khách hàng (§3.2); phần này là mở rộng của nhóm để Order State Machine §9.1 có người vận hành thật, bám biểu đồ Use Case gốc 16 UC (Bản 1 trong `docs/use-case-specifications.md`).

**Tóm tắt**
- **Phạm vi:** UC08–UC12 (Pha chế) và UC14 (kiểm & điều chỉnh tồn kho món, Admin) **đã hiện thực**. UC13 (quản lý món & thực đơn) và UC15 (quản lý mã giảm giá) **chưa hiện thực** (backlog §11.4; UC15 còn trái chốt voucher nội bộ).
- **Vai trò:** `User.role` (`CUSTOMER` / `BARISTA` / `ADMIN`), JWT mang `role`, `RolesGuard` + `@Roles()`. Không thêm bảng (vẫn 5 thực thể). Seed: `demo@brewlite.vn` / `demo1234`, `barista@brewlite.vn` / `barista1234`, `admin@brewlite.vn` / `admin1234`.
- **API:** `GET /orders?status=PAID,PREPARING,READY` (BARISTA/ADMIN, FIFO, kèm tên món); `PATCH /orders/:id` theo vai trò (khách chỉ hủy đơn của mình; BARISTA/ADMIN tiến đơn và chỉ hủy đơn `PAID`, `PENDING` / `PAYMENT_FAILED` → 403, từ `PREPARING` → 400); `GET /admin/products` và `PATCH /admin/products/:id/stock` (ADMIN, optimistic lock theo `version`: lệch 409, âm 400).
- **Giao diện:** `/barista` (3 cột Chờ pha / Đang pha / Sẵn sàng; nút Nhận pha / Pha xong / Đã giao; "Hủy (hết nguyên liệu)" chỉ ở cột Chờ pha; tự tải lại mỗi 5 giây), `/admin` (bảng tồn kho, −1 / +1 / +10, nhập số rồi Lưu, báo 409), đăng nhập điều hướng theo vai trò đọc từ JWT.
- **Lịch sử:** nút "Quầy (demo)" ở `/history` và biến `NEXT_PUBLIC_DEMO_COUNTER` đã gỡ (commit `fe0c06e`); các chỗ ở mục 1–2 nhắc tới chúng là lịch sử.
- **Commit:** `b495fbf` (role + `RolesGuard` + seed), `8b97687` (hàng đợi quầy), `de96087` (`PATCH /orders/:id` theo vai trò, UC12), `1538017` (API tồn kho), `fe0c06e` (FE đọc vai trò), `d9117a3` (`/barista`), `56f4027` (`/admin`).

**Số test mới** (chạy lại 2026-10-09): backend 68 pass / 1 skip → **103 pass / 1 skip** (+35; `cd backend && npx jest`, suite pg vẫn skip khi không có `DATABASE_URL`); frontend 71 → **89 pass** (+18; `cd frontend && npx vitest run`). Con số đã gồm các sửa sau review cuối nhánh (vai trò lạ không bị coi là staff, `?status=` lặp trả 400, chặn tồn kho vượt Int32, `/barista` ngừng tải lại khi 401/403).

**Docs đồng bộ:** `use-case-specifications.md` (Bản 1 là gốc, UC13 / UC15 ghi "chưa hiện thực"), `user-sequence-specifications.md` (§2.7 UC08–UC12, §2.8 UC14, §2.5 bỏ Kịch bản 4, sơ đồ trạng thái theo Barista, bảng đồng bộ 14 UC), `BrewLite-CongNghePhanMem-fixed.md` §12 (chỉ ghi chú của nhóm), `README.md`. Kiểm tra render: 11/11 khối `plantuml` trong 2 file spec render SVG không lỗi (plantuml-1.2026.8.jar, sha256 khớp trang release, Java 24, `PLANTUML_SECURITY_PROFILE=SANDBOX`, exit 0); 14 nhãn UC của Bản 1 (trừ UC13, UC15) xuất hiện nguyên văn trong `user-sequence-specifications.md`.

**Đã chạy trên compose thật (2026-10-09, DB mới):** stack compose dựng từ worktree trên một Postgres mới; migration + seed chạy xong, có 3 user (ADMIN, BARISTA, CUSTOMER). `scripts/demo-state-machine.sh` (đã chuyển sang tài khoản barista cho các lệnh `PATCH` tiến đơn; khách vẫn tạo đơn, trả tiền và đọc trạng thái; thêm bước kiểm khách tự tiến đơn bị 403) thoát 0: khách tiến đơn 403, barista `PREPARING` → `READY` → `COMPLETED`, `CANCELLED` trên `COMPLETED` 400. Smoke vai trò + tồn kho bằng curl đều đúng: khách `GET /orders` 403; barista `GET /orders` 200; barista `GET /admin/products` 403; không token 401; admin cộng +5 cho p4 (9 → 14); `version` cũ 409; kết quả âm 400; món không tồn tại 404. `pg-payment.integration.spec.ts` pass trên đúng DB đó (chạy qua cổng host phụ 55432 vì máy này có dịch vụ PostgreSQL cục bộ cũng nghe 5432). Cách chạy script xem README mục "Demo State Machine".

**Đồng bộ đề → code → tài liệu (2026-10-09, `db47dda`):** đã đối chiếu và sửa `use-case-specifications.md` + `user-sequence-specifications.md` theo code (plan `docs/planning/2026-10-09-doc-code-sync-plan.md`, rule `.claude/rules/doc-code-sync.md`). Chạy lại suite pg trên Postgres compose (`localhost:5432`, volume cũ nên `prisma migrate deploy` áp thêm migration `user_role`; trước đó `npx prisma generate`): `pg-payment.integration.spec.ts` pass (1 test). Chạy lại không có `DATABASE_URL`: backend `npx jest` 104 pass / 1 skip (gồm `bootstrap-env.spec.ts`: thiếu `DATABASE_URL` thì backend không khởi động), frontend `npx vitest run` 89 pass.

**Còn lại:** chưa có bước duyệt tay trên trình duyệt (`/barista`, `/admin`, `/history` của khách); việc này người dùng sẽ tự làm.

## 6. Hoàn thiện nghiệp vụ backend theo đề (2026-10-09, nhánh `fix/backend-hardening`)

> Nguồn: `/code-review` toàn bộ backend (2 trục Standards và Spec) rồi chạy thử lại từng lỗi; plan `docs/planning/2026-10-09-backend-hardening-plan.md` (Task 0 → Task 9, mỗi task 1 commit, chưa merge, chưa push).

| Task | Commit | Nội dung |
|---|---|---|
| 1 | `9344b9c` | Topping trùng khóa prototype (`constructor`) trước đây ra `total = NaN` rồi Postgres 500: nay 400. `quantity` tối đa 99, tối đa 20 dòng, tổng đơn vượt Int32 → 400 `Order total too large`. |
| 2 | `facd300` | Hủy đơn `PAID` chỉ hoàn số thực thu; không có biên lai thì không gọi hoàn tiền (bỏ nhánh hoàn theo `order.total`). |
| 3 | `a37842f` | Key `Idempotency-Key` đã dùng cho đơn khác (cùng chủ) → 422, không trả biên lai đơn cũ. |
| 4 | `bd3fb8b` | `Idempotency-Key` cho `POST /orders` (đề §9 tiêu chí b): cột `Order.idempotencyKey @unique` (migration `20261009120000_order_idempotency_key`), cùng key cùng người → 200 trả lại đơn cũ, người khác → 422, song song → 1 đơn (bắt `P2002`). Frontend giữ 1 key tạo đơn. |
| 5 | `751e734` | Ảnh món: 4 SVG tĩnh ở `frontend/public/images`, seed đặt `imageUrl`, menu mẫu dùng cùng bộ ảnh. |
| 6 | `a4ba4d5` | `MOCK_GATEWAY_DECLINE_METHOD` (`CARD` / `WALLET`) để demo `PAYMENT_FAILED` không sửa code. |
| 7 | `049327b` | Đơn seed `order-1042` đổi size M → S để 35.000đ đúng bảng giá. |
| 8 | `2b819ed` | Dọn smell, không đổi hành vi: repo in-memory lưu/trả bản sao, `toRole()`, xóa mã chết, `PrismaModule` toàn cục, hằng thay chuỗi. |
| 9 | `cbf1f85`, `8230566`, `7081334` + commit báo cáo | Finding sau review: key quá dài (3200 ký tự ngẫu nhiên) làm cả `POST /orders` và `POST /payments` trả 500 → nay 400 `Idempotency-Key too long` (> 255 ký tự); sửa kiểu trong `mock-products.test.ts`; giỏ hàng chặn 99 mỗi dòng khớp DTO. |

**Số test (chạy lại 2026-10-09):** backend `npx jest` **122 pass / 2 skip** (không có `DATABASE_URL`; baseline 104 / 1 skip), **124 pass** khi có Postgres (gồm 2 test pg); `npx tsc --noEmit` sạch ở cả backend và frontend; frontend `npx vitest run` **94 pass** (baseline 89).

**Smoke trên compose thật** (`docker compose up -d --build`, DB mới migrate + seed): `GET /products` có `imageUrl` cho 4 món và `:3001/images/latte.svg` trả 200; `POST /orders` hai lần cùng key → cùng `id`, lần 2 là 200; topping `constructor` → 400; key khác chủ → 422; key đơn cũ gửi kèm đơn khác → 422; `MOCK_GATEWAY_DECLINE_METHOD=CARD` → trả Thẻ 400 (đơn `PAYMENT_FAILED`), thử lại bằng Ví → 201 (đơn `PAID`); tắt biến → dựng lại backend, biến rỗng. Thời gian (`curl -w %{time_total}`, đề §4.2 yêu cầu API < 500ms): `GET /products` 5ms, `POST /orders` 15ms, `POST /payments` 16ms.

**PlantUML:** 9 khối của `user-sequence-specifications.md` và 2 khối của `use-case-specifications.md` render bằng PlantUML 1.2024.7 (SHA-1 khớp trang Maven), exit 0, 8 sơ đồ sequence + 1 sơ đồ trạng thái; đã mở PNG sơ đồ §2.4 xem nhánh `Idempotency-Key` ở bước 2a và nhánh 422 ở bước 21, không có "Syntax Error".

**Giới hạn còn lại (chưa sửa, cần quyết định):**
- ~~Mất phản hồi sau khi đã trả tiền~~ — **đã sửa** (phương án A, nhánh `fix/backend-hardening`): `PaymentForm` giữ một key trả tiền cho cả phiên màn Thanh toán, bấm lại cùng key thì backend trả lại biên lai cũ (200) thay vì 400 `PAID -> PAID`. Lần trả lỗi (cổng từ chối, kẹt kho đã hoàn tiền) không lưu key nên thử lại cùng key vẫn trừ tiền lại được. Reload hoặc rời màn rồi vào lại (giỏ không đổi) nay cũng giữ được `orderId` và key: plan `docs/planning/2026-10-09-demo-session-plan.md` Task 2.
- Chưa kiểm bằng mắt trên trình duyệt: ảnh món có hiện thay cho ☕ không, màn Thanh toán khi đổi Thẻ → Ví (môi trường làm việc không có trình duyệt).
- Giỏ hàng chưa chặn quá 20 dòng khác nhau (DTO chặn 20); cần 21 tổ hợp size/topping khác nhau mới gặp.

### 6.1 Phương án A: giữ một key trả tiền cho mỗi màn Thanh toán (2026-10-09)

> Plan `docs/planning/2026-10-09-payment-retry-key-plan.md`. Commit: `57fd521` (plan), `1998d45` (test ghim hành vi backend), `4c1675c` (frontend + tài liệu).

- **Lỗi đã sửa:** đã trả tiền mà mất phản hồi, bấm lại thì giao diện sinh key mới nên backend trả 400 `Invalid transition PAID -> PAID`. Nay `PaymentForm` giữ `payKey` (cạnh `orderKey`), bấm lại cùng key thì backend trả lại biên lai cũ (200, `isCached: true`).
- **Vì sao an toàn:** backend chỉ lưu key khi trả thành công; lần lỗi (cổng từ chối, kẹt kho đã hoàn tiền) không lưu key nên thử lại cùng key vẫn trừ tiền lại được. `PaymentForm` chỉ render khi `step === 'payment'` (`cart/page.tsx:41`), nên mỗi lần vào lại màn thanh toán là một instance mới với cặp key mới.
- **Test mới:** 2 test backend ghim "lỗi rồi thử lại cùng key" (Thẻ bị từ chối → Ví; kẹt kho 409 → nhập kho), 1 test gateway frontend (`/payments` rớt mạng rồi thử lại cùng key → `PAID`, chỉ 1 lần `POST /orders`). Không có test bấm nút trong component (vitest chạy môi trường `node`, không có jsdom hay testing-library; không thêm phụ thuộc).
- **Smoke compose:** trả 2 lần cùng key → 201 rồi 200, cùng `paymentId`; `MOCK_GATEWAY_DECLINE_METHOD=CARD` (qua `.env`) → Thẻ với K2 trả 400, Ví cùng K2 trả 201, 1 biên lai theo K2; xóa biến, dựng lại backend → Thẻ trả được (201).
- **Không làm:** hủy ở tab khác rồi bấm lại cùng key vẫn nhận biên lai cũ kèm đơn `CANCELLED` (cache trả kết quả đã lưu, đúng §2.4; muốn sửa phải đổi backend và giao diện).

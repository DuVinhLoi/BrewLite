# Kế hoạch: đồng bộ đề, code và tài liệu UC / sequence

- Ngày: 2026-10-09. Nhánh `develop` @ `79cfb62`.
- Nguồn chuẩn: `docs/BrewLite-CongNghePhanMem-fixed.md` (đề): §8 10 task, §9 Task 10 + State Machine §9.1, §12 API và 5 thực thể.
- Thứ tự ưu tiên: đề → code → tài liệu. Code lệch đề thì sửa code. Tài liệu lệch code thì sửa tài liệu. Chưa rõ thì hỏi người dùng.
- Đã kiểm trong phiên này: backend `npx jest` 103 pass / 1 skip (suite pg skip vì thiếu `DATABASE_URL`), frontend `npx vitest run` 89 pass. Chưa chạy stack compose, chưa thử trên trình duyệt.
- Ràng buộc: không commit, push, merge khi người dùng chưa duyệt.

## 1. Ánh xạ Task → UC → sequence → code → test

Sequence = mục trong `docs/user-sequence-specifications.md`. Đường dẫn code/test rút gọn: `be/` = `backend/`, `fe/` = `frontend/src/`.

| Đề | UC | Sequence | Code chính | Test | Trạng thái |
|---|---|---|---|---|---|
| Task 1 Khởi tạo | — | — | `frontend/`, `backend/`, `README.md`, `.env.example` | `be/test/compose-env.spec.ts` | Xong |
| Task 2 `GET /products` | UC01 | §2.1 | `be/src/product/product.controller.ts`, `product.service.ts`, `be/src/prisma/prisma-product.repo.ts` | `be/test/order-product.spec.ts` | Xong |
| Task 3 Trang Menu | UC01 | §2.1 | `fe/app/page.tsx`, `fe/components/ProductGrid.tsx`, `fe/lib/api.ts` (`getProducts`) | `fe/lib/api.test.ts` | Xong |
| Task 4 Chi tiết + tùy chọn | UC01 | §2.1 | `fe/components/ProductDetailModal.tsx`, `fe/lib/pricing.ts`, `be/src/order/pricing.ts` | `fe/lib/pricing.test.ts`, `be/test/pricing-table.spec.ts` | Xong; xem Q4 |
| Task 5 Giỏ hàng | UC02 | §2.2 | `fe/store/cart.ts`, `fe/app/cart/page.tsx`, `fe/components/QtyStepper.tsx`, `Header.tsx` (badge) | `fe/store/cart.test.ts` | Xong |
| Task 6 `POST /orders` | UC04 | §2.4 bước 2a | `be/src/order/order.controller.ts`, `order.service.ts`, `dto/create-order.dto.ts` | `be/test/order-product.spec.ts`, `fe/lib/payment/api-gateway.test.ts` | Xong |
| Task 7 JWT | UC03 | §2.3 | `be/src/auth/*`, `fe/app/login/page.tsx`, `fe/lib/auth.ts` | `be/test/auth.spec.ts`, `fe/lib/auth.test.ts` | Xong |
| Task 8 Thanh toán | UC05, UC06 KB1 | §2.4 bước 2b, §2.5 | `be/src/payment/payment.service.ts` (`processPayment`), `payment.controller.ts`, `mock-payment-gateway.service.ts`, `fe/components/PaymentForm.tsx`, `fe/lib/payment/api-gateway.ts` | `be/test/order-payment.integration.spec.ts`, `payment-failure.spec.ts`, `fe/lib/payment/api-gateway.test.ts` | Xong |
| Task 9 Xác nhận, lịch sử, bàn giao | UC07 | §2.6 | `fe/components/PaymentSuccess.tsx`, `fe/app/history/page.tsx`, `OrderController.mine()`, `docker-compose.yml`, `be/Dockerfile`, `be/prisma/seed.ts` | `be/test/order-product.spec.ts` (`listMine`), `fe/components/OrderStatusTrack.test.ts` | Code xong; còn F4 |
| Task 10.1 State Machine | UC06, UC09–UC12 | §2.5 (B2), §2.7 | `be/src/state-machine/order-state.machine.ts`, `fe/lib/order-status.ts` | `be/src/state-machine/order-state.machine.spec.ts`, `be/test/order-advance.spec.ts`, `fe/lib/order-status.test.ts` | Xong (tiêu chí a) |
| Task 10.2 Idempotent | UC05 | §2.4 | `payment.service.ts` (`withLock`, cache theo `Payment.idempotencyKey @unique`) | `order-payment.integration.spec.ts` "(b) …" | Xong (tiêu chí b) |
| Task 10.3 Tồn kho đồng thời | UC05 | §2.4 | `payment.service.ts` (`runInTransaction`), `prisma-product.repo.ts` (`deductStockWithOptimisticLock`) | `order-payment.integration.spec.ts` "(c) …", `be/test/pg-payment.integration.spec.ts` | Xong (tiêu chí c); suite pg chưa chạy (F3) |
| Task 10.4 Voucher + điểm | UC05a | §2.4 bước 1 | `payment.service.ts` (`VOUCHER_CODE`, `LOYALTY_RATE`), `PaymentForm.tsx` | `order-payment.integration.spec.ts` (voucher), `fe/lib/pricing.test.ts` (voucher) | Xong |
| Task 8 + 10 Hủy đơn | UC06 KB2/KB3 | §2.5 | `payment.service.ts` (`cancelOrderAs`, `cancel`), `fe/app/history/page.tsx`, `fe/lib/api.ts` (`cancelOrder`) | `order-payment.integration.spec.ts` (cancel …), `order-advance.spec.ts`, `fe/lib/api.test.ts` | Xong; rủi ro D1 |
| Mở rộng §3.2 | UC08 | §2.7 | `OrderController.queue()`, `OrderService.listQueue()`, `fe/app/barista/page.tsx`, `fe/lib/barista.ts` | `be/test/barista-queue.spec.ts`, `be/test/roles.spec.ts`, `fe/lib/barista.test.ts` | Xong |
| Mở rộng §3.2 | UC09–UC11 | §2.7 | `PaymentService.advanceOrder()`, `PaymentController.update()`, `fe/lib/api.ts` (`advanceOrder`) | `order-advance.spec.ts`, `fe/lib/api.test.ts` | Xong |
| Mở rộng §3.2 | UC12 | §2.7 | `PaymentService.cancelOrderAs()` → `cancel()` | `order-advance.spec.ts` (UC12), `order-payment.integration.spec.ts` (cancel PAID atomic) | Xong; rủi ro D1 |
| Mở rộng §3.2 | UC14 | §2.8 | `be/src/product/admin-product.controller.ts`, `ProductService.adjustStock()`, `fe/app/admin/page.tsx`, `fe/lib/admin.ts` | `be/test/admin-inventory.spec.ts`, `fe/lib/admin.test.ts` | Xong |
| Backlog | UC13, UC15 | — | — | — | Chưa làm, đúng quy ước |

Endpoint ↔ controller ↔ bảng CSDL: xem ma trận Phần III của `docs/user-sequence-specifications.md` (nguồn duy nhất, không chép lại ở đây). Đã đối chiếu: đủ 7 endpoint đề §12.1 + 5 endpoint mở rộng, `ALLOWED` khớp 9 mũi tên §9.1, schema đúng 5 thực thể §12.2.

## 2. Đã sửa trong tài liệu (người dùng duyệt 2026-10-09, commit cùng plan)

`docs/use-case-specifications.md`:

- [x] §1 Barista: hàng đợi gồm `PAID`, `PREPARING`, `READY` (trước ghi chỉ `PAID`).
- [x] Đổi tên UC08 thành "Xem hàng đợi đơn (PAID / PREPARING / READY)" ở sơ đồ Bản 1 và bảng §4. Cùng tên ở bảng Phần II và Phần III của file sequence. Xem Q3.

`docs/user-sequence-specifications.md`:

- [x] §1.2: In-Memory chỉ để test; chạy rời không DB thì kho rỗng và mỗi module giữ kho RAM riêng. Đã kiểm bằng script: `OrderService.orders !== PaymentService.orders` khi thiếu `DATABASE_URL`.
- [x] §2.1: ví dụ giá ghi rõ giá gốc 45.000đ (size S) + L + Trân châu = 60.000đ; modal mở sẵn size M.
- [x] §2.2: sơ đồ thêm nhánh Xóa / Xóa hết; phản hồi thật là nút "Đã thêm ✓" (không có toast); mục C ghi đúng Zustand `persist` key `brewlite-cart`, `CartItem.key`, chặn tồn kho chỉ ở `addItem`.
- [x] §2.3: note 400 (ValidationPipe) cho register/login; đăng nhập thành công điều hướng theo `role` (`/`, `/barista`, `/admin`), trả `{ accessToken, user }`.
- [x] §2.4: thứ tự đầy đủ "guard → validate → khóa → chủ đơn → cache → kiểm trạng thái → charge"; thêm 400 thiếu `Idempotency-Key`; thêm bước kiểm trạng thái (đơn đã `PAID` + key mới → 400, không charge) và `PAYMENT_FAILED → PENDING`; nhánh lỗi transaction gồm 409 / 404 / 500 (trước chỉ vẽ 409); lỗi ở `POST /orders` thì không gọi `POST /payments`.
- [x] §2.5: bỏ tham chiếu số dòng `docs:301-322`, `docs:313` (sai dòng) → `đề §9.1`; KB1 không còn chữ "hoặc"; KB1 ghi transaction đúng thứ tự (trừ kho → `PAID` → điểm → biên lai); KB2 gồm cả `PAYMENT_FAILED`; KB3 thêm bước đọc biên lai `SUCCESS`, `group` transaction, note rủi ro hoàn 2 lần và không thu hồi điểm.
- [x] §2.6: biên lai đúng màn `PaymentSuccess` ("Mời tới quầy lấy nước", mã 8 ký tự, xóa giỏ); lịch sử có nhánh chưa đăng nhập (không gọi API), 401, rỗng; hiện đủ 7 trạng thái.
- [x] §2.7: tài khoản `barista@…` đánh dấu demo, seed đặt lại mật khẩu; A.3 sửa "trong 1 transaction" (refund ngoài transaction); sơ đồ UC08 có `loop` 5 giây + nhánh 401/403 dừng polling; UC09–UC11 có nhánh 403 / 404 / 400; UC12 có nhánh 404 / 403 (`PENDING` / `PAYMENT_FAILED`) / 400, đọc biên lai, `group` transaction, tải lại hàng đợi.
- [x] §2.8: tài khoản `admin@…` đánh dấu demo; seed đặt lại kho về 10; sơ đồ có 401/403, 400 DTO, 404, 409 (2 chỗ: so `version` và `updateMany` 0 dòng), 400 âm / `Stock too large`; giao diện tải lại bảng trước khi báo mọi lỗi (trước chỉ vẽ cho 409).
- [x] Phần III: UC05 ghi đủ 409/404/500 và 400 không charge; UC12 sửa "trong 1 transaction"; UC14 thêm 404 và vượt Int32; Agent Rules §2(c) ghi rõ kho bị trừ lúc `POST /payments`.
- [x] Kiểm cú pháp: 11 khối PlantUML của 2 file đều được PlantUML 1.2024.7 nhận đúng loại (`-syntax`), 8 sơ đồ sequence render ra PNG không lỗi.

## 3. Cần người dùng quyết

- [x] **D1. Rủi ro hoàn tiền 2 lần khi hủy đơn `PAID`** (UC06 KB3, UC12). `PaymentService.cancel()` gọi `gateway.refund` trước, rồi mới chạy transaction hoàn kho + `CANCELLED`. Transaction lỗi thì đơn vẫn `PAID`, hủy lại sẽ hoàn lần 2. **Người dùng chốt (a) ngày 2026-10-09: không sửa code.**
  - (a) **Đã chọn: ghi nhận có chủ đích.** Cổng là mock, khóa `order:<id>` chặn hủy song song, transaction chỉ lỗi khi DB lỗi hoặc món trong đơn đã bị xóa. Đã ghi giới hạn ở §2.5 KB3, §2.7, mục C; code có comment `ponytail:`. Không đổi code.
  - (b) Sửa: trước khi gọi `refund`, ghi một dòng `Payment` `status = 'REFUNDED'` (cùng bảng, key `refund:<orderId>`), `collected` trừ phần đã hoàn nên hủy lại không hoàn lần 2. Không thêm bảng nhưng phải chặn client gửi key dạng `refund:…` vào `POST /payments`, sửa `PaymentStatus`, thêm test. Làm theo `tdd`.
- [ ] **D2. Chạy rời backend không DB.** Mỗi module có kho in-memory riêng nên `POST /orders` rồi `POST /payments` trả 404 khi thiếu `DATABASE_URL`.
  - (a) **Đề xuất: chỉ sửa tài liệu** (đã sửa §1.2). Còn 1 dòng chú thích trong `.env.example` ("Không đặt DATABASE_URL thì backend dùng kho in-memory (không cần DB)") nên thêm "chỉ để test, không chạy được luồng đặt + trả"; chưa sửa vì nằm ngoài `docs/`.
  - (b) Sửa code: gom 4 repo in-memory vào 1 module `@Global()` dùng chung. Chỉ cần nếu muốn demo không có Postgres.
- [ ] **Q3. Tên UC08 trên Bản 1.** Đã đổi "(PAID)" thành "(PAID / PREPARING / READY)". Nếu muốn giữ tên cũ trên bản nộp thì hoàn lại 4 chỗ và thay bằng một câu chú thích ở bảng §4.
- [ ] **Q4. Task 4 "Màn hình chi tiết".** Hiện là modal trên trang Menu; `GET /products/:id` có ở backend nhưng giao diện chưa gọi. Wireframe (2) của đề có nút "←" như một trang riêng. Cần chốt modal có được tính là "màn hình chi tiết" không.
- [x] **D5. Rule đồng bộ.** Người dùng duyệt ngày 2026-10-09, đã chuyển vào `.claude/rules/doc-code-sync.md` (xem mục 5).

## 4. Việc tiếp theo (không cần quyết)

- [ ] **F1.** `docs/planning/2026-10-09-order-state-machine-visible-plan.md` còn bước "bấm Quầy (demo)", nút này đã bỏ khi merge `4974abd`. Thay bằng checklist ở `docs/checkpoints/2026-10-09-checkpoint.md` §4.1 (`/barista`).
- [ ] **F2.** `backend/src/main.ts` gọi `app.listen(3000)` cố định, nên biến `PORT` trong `docker-compose.yml` và `.env.example` không có tác dụng. Sửa thành `process.env.PORT ?? 3000` hoặc bỏ biến khỏi 2 file cấu hình.
- [ ] **F3.** Chạy suite pg: `docker compose up -d db`, rồi trong `backend/`: `npx prisma generate`, `npx prisma migrate deploy`, `DATABASE_URL=postgresql://brewlite:brewlite@localhost:5432/brewlite npx jest pg-payment`.
- [ ] **F4.** Thử tay trên trình duyệt theo checkpoint §4.1 (khách đặt + trả, `/barista` tiến đơn, `/admin` +10).
- [ ] **F5.** Ghi chú nhóm ở đề §12.2 chưa liệt kê `Payment.createdAt` (code có, dùng sắp biên lai). Thêm vào nếu muốn bảng thực thể khớp schema tuyệt đối.
- [ ] **F6.** `README.md`, `docs/develop-status-report.md`, `docs/scrum-process.md` chưa audit lại theo lần sửa này. Phần README về tài khoản demo và seed đã khớp code.

## 5. Rule

`.claude/rules/doc-code-sync.md`. Claude Code tự nạp các file `.claude/rules/*.md`; frontmatter `paths` giới hạn rule chỉ nạp khi làm việc với file khớp mẫu (bỏ frontmatter nếu muốn luôn nạp).

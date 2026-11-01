# Minh chứng 10 task — BrewLite

> Đối chiếu từng task của đề `docs/BrewLite-CongNghePhanMem-fixed.md` §8 (và §9 cho Task 10) với bằng chứng chạy được: request Postman, test tự động và màn hình cần chụp. Tiêu chí chấp nhận đầy đủ của từng story: `docs/product-backlog.md` (US-*n* = Task *n*).

## 1. Công cụ kiểm thử API: Postman

Ở thời điểm hiện tại nhóm **kiểm thử API bằng Postman**, không dùng Swagger. Swagger UI (`http://localhost:3000/docs`) vẫn còn trong code backend nhưng không dùng để test, demo hay làm minh chứng.

- Collection: `docs/postman/BrewLite.postman_collection.json` (Postman v2.1, 74 request, 137 assertion). Mỗi task là một thư mục `Task 01` … `Task 10`; Task 10 chia 4 thư mục con (a)–(d) theo đề §9.
- Thư mục `00 Chuẩn bị` đăng ký 2 khách email `@smoke.test` (không dùng tài khoản khách demo), đăng nhập tài khoản quầy và quản trị demo, lưu token vào biến collection. Các thư mục sau dùng lại các biến này nên **phải chạy theo thứ tự**.
- Biến collection: `baseUrl` = `http://localhost:3000` (backend), `webUrl` = `http://localhost:3001` (frontend).
- Kết quả lần chạy gần nhất: `docs/postman/results/2026-10-21-run.txt`.

### 1.1 Cách chạy

1. Dựng stack với cổng thanh toán giả từ chối Thẻ, để thấy nhánh `PAYMENT_FAILED` của Task 8:

   ```bash
   MOCK_GATEWAY_DECLINE_METHOD=CARD docker compose up -d --build
   # PowerShell: $env:MOCK_GATEWAY_DECLINE_METHOD='CARD'; docker compose up -d --build
   ```

2. Chạy collection, chọn một trong hai cách:
   - **Postman app:** Import → chọn file collection → chuột phải tên collection → **Run collection** → giữ đúng thứ tự → **Run**. Chụp màn hình kết quả Runner làm minh chứng.
   - **Postman CLI:** `postman collection run docs/postman/BrewLite.postman_collection.json`. Không cần `postman login`; cuối lệnh sẽ có dòng nhắc đăng nhập để đẩy kết quả lên cloud, bỏ qua được.
3. Dọn dữ liệu thử: `docker compose exec backend npm run smoke:clean` (xóa tài khoản `@smoke.test` cùng đơn, biên lai của họ, hoàn kho).
4. Tắt nhánh lỗi: chạy lại `docker compose up -d backend` khi không đặt `MOCK_GATEWAY_DECLINE_METHOD`.

Chạy lại nhiều lần được: mỗi lần dùng email và `Idempotency-Key` mới (theo `runId`). Mỗi lần chạy trừ 5 ly của món còn nhiều hàng nhất; `smoke:clean` hoàn lại số này.

### 1.2 Kết quả lần chạy ngày 2026-10-21

Nhánh `develop-agile`, stack `docker compose` chạy `MOCK_GATEWAY_DECLINE_METHOD=CARD`, Postman CLI 1.75.0:

```text
|                requests |                  74 |                  0 |
|            test-scripts |                  74 |                  0 |
|      prerequest-scripts |                  86 |                  0 |
|              assertions |                 137 |                  0 |
| total run duration: 7.5 s                                          |
| average response time: 14 ms [min: 2 ms, max: 108 ms, s.d.: 23 ms] |
```

Thời gian phản hồi lớn nhất 108 ms, dưới mức 500 ms của đề §4.2. Sau khi chạy, `smoke:clean` báo `xóa 3 tài khoản @smoke.test, 8 đơn`.

Test tự động chạy cùng ngày:

- Backend `cd backend && npx jest`: `Tests: 3 skipped, 170 passed, 173 total` (3 test Postgres chỉ chạy khi có `DATABASE_URL`).
- Frontend `cd frontend && npx vitest run`: `Test Files 46 passed (46)`, `Tests 733 passed (733)`.

## 2. Minh chứng từng task

Mỗi task gồm: tiêu chí của đề, request Postman (mã trong tên request, ví dụ `T06.5`), test tự động, ảnh nhóm cần chụp và người thực hiện theo git (cách tra ở mục 3). Task 3, 4, 5 là giao diện nên Postman chỉ kiểm phần server; phần hiển thị chứng minh bằng vitest và ảnh chụp trình duyệt.

### Task 1 — Khởi tạo dự án và cấu trúc

Đề §8: monorepo `frontend` (Next.js) + `backend` (NestJS), chạy được "Hello", có README, Git, `.env.example`.

- Postman `Task 01`: `T01.1` `GET {{webUrl}}/` trả 200 HTML có chữ "BrewLite"; `T01.2` `GET {{baseUrl}}/products` trả 200 JSON.
- File: `README.md`, `.env.example`, `frontend/package.json`, `backend/package.json`, `docker-compose.yml`.
- Test: `backend/test/bootstrap-env.spec.ts` (thiếu `DATABASE_URL` thì dừng), `backend/test/task47-auth.spec.ts` (thiếu `JWT_SECRET` thì dừng).
- Ảnh cần chụp: cây thư mục repo; `git log --oneline`; Runner Postman thư mục `Task 01`.
- Người thực hiện: commit chính `4518a94` (Thuan-Test, 10-07 20:11: README, `.env.example`, compose 3 service, Dockerfile). Trước đó `2910b17` (DuVinhLoi, 09-30 15:49) khởi tạo repo, các file còn rỗng. Số commit vào file của task: Thuan-Test 33, Thuan-Lap 3, DuVinhLoi 2, baothien-s 1.

### Task 2 — API danh sách sản phẩm

Đề §8: `GET /products` trả JSON menu (id, tên, giá, ảnh).

- Postman `Task 02`: `T02.1` trả mảng, mỗi món có `id`, `name`, `price`, `imageUrl`, không có món `stock = 0`; `T02.2` `GET /products/:id` trả đúng món; `T02.3` id không có trả 404.
- File: `backend/src/product/product.controller.ts`, `backend/prisma/seed.ts`.
- Test: `backend/test/order-product.spec.ts` (ca "product list excludes stock-0", "product detail unknown → NotFound").
- Ảnh cần chụp: Postman `T02.1` (tab Body và Test Results).
- Người thực hiện: commit chính `ec19345` (Thuan-Test, 10-07 23:43, chung commit với Task 6). Số commit vào file của task: Thuan-Test 14, Thuan-Lap 3.

### Task 3 — Trang Menu (Frontend)

Đề §8: Next.js gọi `/products`, render lưới sản phẩm, có loading / empty state.

- Postman `Task 03`: `T03.1` trang `/` trả 200; `T03.2` ảnh `imageUrl` của món tải được (`image/svg+xml`).
- File: `frontend/src/components/ProductGrid.tsx`, `frontend/src/lib/api.ts` (`getProducts`).
- Test: `frontend/src/components/ProductGrid.test.ts` (loading, empty, lỗi + "Thử lại"), `frontend/src/lib/api.test.ts`.
- Ảnh cần chụp: trang Menu `http://localhost:3001` có lưới món; trạng thái loading (DevTools → Network → Slow 3G); trạng thái lỗi (tắt backend: `docker compose stop backend`).
- Người thực hiện: commit chính `9ea0933` (baothien-s, 10-07 16:27, chung commit với Task 5, vào develop qua PR #3). Số commit vào file của task: Thuan-Test 8, Thuan-Lap 2, baothien-s 2, DuVinhLoi 1.

### Task 4 — Chi tiết và tùy chọn sản phẩm

Đề §8: chọn size (S/M/L) và topping, tính giá theo tùy chọn.

- Postman `Task 04`: `T04.1` size L + Trân châu + Kem cheese thì `unitPrice` = giá gốc + 10.000 + 13.000; `T04.2` size S không topping thì bằng giá gốc; `T04.3` topping lạ trả 400 `Unknown topping`. Backend tính giá bằng cùng bảng giá với frontend.
- File: `frontend/src/components/ProductDetailModal.tsx`, `frontend/src/lib/pricing.ts`, `backend/src/order/pricing.ts`.
- Test: `frontend/src/lib/pricing.test.ts`, `frontend/src/components/ProductDetailModal.test.ts`, `frontend/src/lib/product-detail.test.ts`, `backend/test/pricing-table.spec.ts` (bảng giá hai phía trùng nhau).
- Ảnh cần chụp: modal chi tiết món trước và sau khi đổi size/topping (giá thay đổi).
- Người thực hiện: commit chính `c432dee` (Thuan-Test, 10-07 21:10: modal chi tiết, giá đổi theo size/topping). Hoàn thiện ở `32831dc` (DuVinhLoi, 10-13 19:11, PR #4: tải chi tiết qua `GET /products/:id`, trạng thái loading / lỗi của modal, test `product-detail.test.ts`). Số commit vào file của task: Thuan-Test 5, baothien-s 2, DuVinhLoi 1.

### Task 5 — Giỏ hàng (Cart)

Đề §8: thêm / sửa số lượng / xóa, lưu state (Zustand), tự tính tổng, badge số lượng.

- Postman `Task 05` (phía API của giỏ): `T05.1` giỏ 2 dòng thì `total` = tổng `quantity × unitPrice`; `T05.2` 21 dòng trả 400; `T05.3` 100 ly một dòng trả 400 (giới hạn 20 dòng, 1–99 ly trùng giới hạn của giỏ).
- File: `frontend/src/store/cart.ts`, `frontend/src/components/cart/CartView.tsx`, `frontend/src/components/HeaderView.tsx`.
- Test: `frontend/src/store/cart.test.ts`, `frontend/src/lib/cart-limits.test.ts`, `frontend/src/components/cart/CartView.test.ts`, `frontend/src/components/QtyStepper.test.ts`, `frontend/src/components/HeaderView.test.ts`.
- Ảnh cần chụp: giỏ hàng có 2 món và tổng tiền; badge trên header; tải lại trang (F5) giỏ vẫn còn.
- Người thực hiện: commit chính `9ea0933` (baothien-s, 10-07 16:27, chung commit với Task 3). Hoàn thiện ở `b3a2392` (Thuan-Test, 10-08 14:31: test vitest cho giỏ) và `6ee4236` (Thuan-Test, 10-11 11:52: giới hạn 20 dòng / 99 ly). Số commit vào file của task: Thuan-Test 8, baothien-s 2.

### Task 6 — API tạo đơn hàng

Đề §8: `POST /orders` nhận giỏ hàng, validate (class-validator), lưu `PENDING`, trả mã đơn.

- Postman `Task 06`: `T06.1` không token trả 401; `T06.2` giỏ rỗng trả 400; `T06.3` size `XL` trả 400; `T06.4` món không có trả 404; `T06.5` đơn hợp lệ trả 201, `status` `PENDING`, có `id`, gửi kèm `unitPrice: 1` vẫn bị server bỏ qua và tự tính giá; `T06.6` token quầy trả 403.
- File: `backend/src/order/order.controller.ts`, `backend/src/order/dto/create-order.dto.ts`, `backend/src/order/pricing.ts`.
- Test: `backend/test/order-product.spec.ts`, `backend/test/pricing-table.spec.ts`, `backend/test/customer-only.spec.ts`.
- Ảnh cần chụp: Postman `T06.5` (Body có `id`, `status: "PENDING"`) và `T06.2` (400 với thông báo lỗi validate).
- Người thực hiện: commit chính `ec19345` (Thuan-Test, 10-07 23:43). Hoàn thiện ở `62837cc` (Thuan-Test, 10-08 22:54: server tự tính giá, bỏ giá client gửi). Số commit vào file của task: Thuan-Test 10, Thuan-Lap 2.

### Task 7 — Đăng ký / Đăng nhập (JWT)

Đề §8: `POST /auth/register`, `/auth/login`; băm mật khẩu (bcrypt); phát JWT; guard bảo vệ route đặt đơn.

- Postman `Task 07`: `T07.1` đăng ký trả 201, không có `passwordHash`; `T07.2` trùng email (viết hoa) trả 409; `T07.3` email sai, mật khẩu ngắn trả 400; `T07.4` đăng nhập trả JWT 3 phần, `role` `CUSTOMER`; `T07.5` sai mật khẩu và `T07.6` email không tồn tại cùng trả 401 `Invalid credentials`; `T07.7` token giả trả 401. Guard route đặt đơn: `T06.1`.
- File: `backend/src/auth/auth.controller.ts`, `backend/src/auth/auth.service.ts` (bcrypt), `backend/src/auth/jwt-auth.guard.ts`, `frontend/src/app/login/page.tsx`.
- Test: `backend/test/auth.spec.ts`, `backend/test/task47-auth.spec.ts`, `backend/test/roles.spec.ts`, `frontend/src/lib/login.test.ts`, `frontend/src/lib/session.test.ts`, `frontend/src/components/LoginView.test.ts`.
- Ảnh cần chụp: Postman `T07.4` (có `accessToken`), `T07.5` (401); bảng `User` trong DB có `passwordHash` dạng `$2a$…` (`docker compose exec db psql -U brewlite -c 'select email, left("passwordHash", 7) from "User" limit 3;'`).
- Người thực hiện: commit chính `ccf7a41` (Thuan-Test, 10-07 23:41: register / login, guard, trang đăng nhập). Hoàn thiện ở `cace4c3` (Thuan-Lap, 10-09 08:20: vai trò `CUSTOMER` / `BARISTA` / `ADMIN` trong JWT, `RolesGuard`) và `32831dc` (DuVinhLoi, 10-13 19:11, PR #4: chuẩn hóa email, bắt buộc `JWT_SECRET`, test `task47-auth.spec.ts`). Số commit vào file của task: Thuan-Test 12, Thuan-Lap 2, DuVinhLoi 1.

### Task 8 — Thanh toán không tiền mặt

Đề §8 và §4.3: chọn Ví/Thẻ, gọi `POST /payments`; đơn `PENDING` → `PAID` khi thành công, `PAYMENT_FAILED` khi lỗi, giỏ giữ nguyên.

- Postman `Task 08`: `T08.1` trả bằng Ví trả 201 `PAID` kèm `paymentId`; `T08.2` đọc lại đơn thấy `PAID`; `T08.3`–`T08.5` trả bằng Thẻ bị cổng giả từ chối trả 400 `Payment failed`, đơn sang `PAYMENT_FAILED`; `T08.6` thử lại bằng Ví trả 201 `PAID` trên **cùng đơn cũ**; `T08.7` thiếu `Idempotency-Key` trả 400; `T08.8` phương thức `CASH` trả 400.
- File: `backend/src/payment/payment.controller.ts`, `backend/src/payment/payment.service.ts`, `backend/src/payment/mock-payment-gateway.service.ts`, `frontend/src/components/PaymentForm.tsx`.
- Test: `backend/test/payment-failure.spec.ts`, `backend/test/order-payment.integration.spec.ts`, `frontend/src/components/PaymentForm.test.ts`, `frontend/src/lib/payment/api-gateway.test.ts`, `frontend/src/lib/payment/checkout-session.test.ts`.
- Ảnh cần chụp: Postman `T08.4` và `T08.5`; màn Thanh toán trên web báo lỗi khi chọn Thẻ, giỏ vẫn còn.
- Người thực hiện: commit chính `bd1adc3` (Thuan-Test, 10-07 10:54, chung commit với Task 10, vào develop qua PR #2). Hoàn thiện ở `390907d` (Thuan-Test, 10-07 21:12: checkout 2 bước trên web), `ee0dd1e` (Thuan-Test, 10-07 23:13: lưu Postgres qua Prisma) và `62837cc` (Thuan-Test, 10-08 22:54: khóa chống thanh toán song song, kiểm chủ đơn). Số commit vào file của task: Thuan-Test 26, Thuan-Lap 3, baothien-s 2.

### Task 9 — Xác nhận, lịch sử đơn và bàn giao

Đề §8: màn xác nhận (mã đơn, trạng thái), `GET /orders/me`, `docker-compose` chạy cả 3, README, demo end-to-end.

- Postman `Task 09`: `T09.1` `GET /orders/:id` có `id`, `status`, `total`, `items`; `T09.2` `GET /orders/me` có các đơn vừa tạo, sắp xếp mới nhất trước, mỗi dòng có `productName`; `T09.3`, `T09.4` khách B không thấy và không đọc được đơn của khách A (403); `T09.5` mã đơn lạ trả 404; `T09.6` trang `/history` của frontend trả 200.
- File: `backend/src/order/order.controller.ts`, `frontend/src/app/history/page.tsx`, `frontend/src/components/PaymentSuccess.tsx`, `docker-compose.yml`, `README.md`.
- Test: `backend/test/order-product.spec.ts` (ca "listMine returns newest-first"), `backend/test/compose-env.spec.ts`, `frontend/src/components/HistoryView.test.ts`, `frontend/src/components/PaymentSuccess.test.ts`, `frontend/src/lib/history.test.ts`, `frontend/src/lib/use-order-poll.test.ts`.
- Ảnh cần chụp: `docker compose ps` có 3 service `db`, `backend`, `frontend`; màn biên lai có mã đơn và trạng thái `PAID`; trang `/history`.
- Người thực hiện: commit chính `e2cfd1d` (Thuan-Test, 10-07 23:45: trang lịch sử, seed tài khoản demo, compose khởi động đủ 3 service). Số commit vào file của task: Thuan-Test 14, Thuan-Lap 2, baothien-s 2, DuVinhLoi 1.

### Task 10 — Nghiệp vụ backend (đề §9)

Tiêu chí chấm của đề: test chứng minh (a) chặn chuyển trạng thái sai; (b) 2 lần cùng Idempotency-Key chỉ tạo 1 đơn; (c) đặt đồng thời không vượt tồn kho.

**(a) Order State Machine.** Postman `Task 10 / (a)`:

- `T10a.1` khách tự tiến đơn trả 403 `Only staff can advance orders`.
- `T10a.2` quầy nhảy cóc `PAID` → `READY` trả 400 `Invalid transition PAID -> READY`.
- `T10a.3`, `T10a.5`, `T10a.6` quầy tiến `PREPARING` → `READY` → `COMPLETED`, mỗi bước 200; `T10a.4` khách hủy đơn đang `PREPARING` trả 400.
- `T10a.7` `COMPLETED` → `CANCELLED` trả 400 `Invalid transition COMPLETED -> CANCELLED`; `T10a.8` đơn vẫn `COMPLETED`.
- `T10a.9` hàng đợi quầy `GET /orders?status=PAID` có đơn đã trả; `T10a.10` quầy hủy đơn `PAID` trả 200 `CANCELLED`.
- Code: `backend/src/state-machine/order-state.machine.ts` (`assertTransition`), `backend/src/payment/payment.service.ts` (`advanceOrder`, `cancelOrderAs`).
- Test: `backend/src/state-machine/order-state.machine.spec.ts`, `backend/test/order-advance.spec.ts`, `backend/test/barista-queue.spec.ts`, `frontend/src/lib/order-status.test.ts`.
- Trên web (mở rộng đề §3.2): màn Quầy `/barista` làm cùng các bước bằng nút "Nhận pha", "Pha xong", "Đã giao" và "Hủy (hết nguyên liệu)" (chỉ ở cột Chờ pha). Code `frontend/src/app/barista/page.tsx`, `frontend/src/components/BaristaView.tsx`, `frontend/src/lib/barista.ts`; test `frontend/src/lib/barista.test.ts`, `frontend/src/components/BaristaView.test.ts`. Kiểm tay: tab khách giữ biên lai, tab quầy bấm từng nút, biên lai và `/history` đổi bước trong khoảng 3 giây.

**(b) Thanh toán idempotent.** Postman `Task 10 / (b)`:

- `T10b.2`, `T10b.3` `POST /orders` 2 lần cùng key: lần 1 trả 201, lần 2 trả 200 cùng `id`, `isCached: true`.
- `T10b.5`, `T10b.6` `POST /payments` 2 lần cùng key: lần 2 trả 200 cùng `paymentId`.
- `T10b.7` điểm thưởng chỉ cộng 1 lần; `T10b.8` tồn kho chỉ trừ 1 lần (đúng 2 ly); `T10b.9` khách khác dùng lại key trả 422.
- Test: `backend/test/order-payment.integration.spec.ts` (ca "(b) same Idempotency-Key charges once").

**(c) Tồn kho khi đặt đồng thời.** Postman `Task 10 / (c)`:

- `T10c.1` ghi kho với `version` cũ trả 409 `Stock changed, reload` (optimistic locking theo `Product.version`).
- `T10c.2` trừ quá số còn lại trả 400 `Stock cannot be negative`.
- `T10c.3` khách gọi API kho trả 403.
- Postman Runner gửi request tuần tự nên không tạo được tải đồng thời. Phần "nhiều khách đặt cùng lúc" chứng minh bằng test `backend/test/order-payment.integration.spec.ts` (ca "(c) concurrent stock never negative") và `backend/test/pg-payment.integration.spec.ts` (Postgres thật, chạy khi có `DATABASE_URL`, cách chạy ở `README.md`).

**(d) Khuyến mãi và điểm thưởng.** Postman `Task 10 / (d)`:

- `T10d.3` trả với `BREWLITE10`: `discount` = `floor(total × 0.1)`, `amount` = `total − discount`, `loyaltyPointsEarned` = `floor(amount × 0.1 / 1000)`. Lần chạy 2026-10-21: đơn 58.000đ được giảm 5.800đ, trả 52.200đ, cộng 5 điểm.
- `T10d.4` `GET /users/me` thấy điểm đã cộng; `T10d.6` mã sai `SAIMA` thì `discount` = 0.
- Test: `backend/test/order-payment.integration.spec.ts` (voucher `BREWLITE10`).

Ảnh cần chụp cho Task 10: Runner Postman thư mục `Task 10` (đủ 4 thư mục con), cửa sổ terminal `npx jest order-state order-advance order-payment` xanh; trang `/history` của khách tự chuyển bước sau khi chạy `T10a.3`–`T10a.6`.

Người thực hiện Task 10:

- Commit chính `bd1adc3` (Thuan-Test, 10-07 10:54, chung commit với Task 8): idempotency, State Machine, optimistic lock, điểm thưởng.
- Thuan-Test hoàn thiện ở `a227b3d` (10-08 14:25: các bước ghi sau khi trừ tiền nằm trong 1 transaction) và `23571d5` (10-08 14:31: tiến đơn `PAID` → `PREPARING` → `READY` → `COMPLETED`).
- Thuan-Lap làm phần quầy và kho: `f23ae4a` (10-09 08:23: hàng đợi `GET /orders?status=`), `3a1292e` (10-09 08:27: `PATCH /orders/:id` theo vai trò), `1de3ee8` (10-09 08:31: API kho của Admin có optimistic lock), `a6c0433` (10-09 09:06: script `scripts/demo-state-machine.sh`).
- Số commit vào file của task (State Machine, `payment.service.ts` và các test (a)–(c)): Thuan-Test 18, Thuan-Lap 2.

## 3. Cách tra người thực hiện

Số liệu lấy từ `git log` của nhánh `develop-agile` tại HEAD `bf75474` (145 commit không phải merge), tra ngày 2026-10-21. Giờ ghi theo múi giờ của người commit.

- **Commit chính** là commit đầu tiên đưa chức năng của task vào code, khớp cột "Commit chính" ở `docs/scrum-process.md` mục 2. Lịch sử đã được viết lại một lần (xem `docs/checkpoints/`), nên hash trong tài liệu này là hash hiện tại. Ví dụ: `d1be546` ở `docs/scrum-process.md` nay là `bd1adc3`, cùng tác giả, giờ và tiêu đề.
- **Số commit vào file của task** đếm mọi commit không phải merge có sửa các file code và test chính của task:

  ```bash
  git log --no-merges --format='%an' HEAD -- <các file của task> | sort | uniq -c | sort -rn
  ```

  Con số này gồm cả commit sửa nhỏ (comment, refactor), nên chỉ cho biết ai đã đụng vào phần code đó, không đo khối lượng công việc.
- **Danh tính git chưa phải tên thành viên.** `Thuan-Test` và `Trần Vĩnh Thuận` cùng một email; `Thuan-Lap` và `Thuan-AFK666` cùng một email khác. `Saturlen` và `phu` chỉ có commit trên nhánh khác (`develop-Assignment2`, `feat/a2task-3-architecture`), không có trong `develop-agile`. Bảng ánh xạ danh tính ↔ thành viên: **[nhóm điền]** (cùng ô ở `docs/scrum-process.md` mục 1).
- Collection Postman và tài liệu này được viết ngày 2026-10-21 và chưa commit; sau khi commit, ghi hash vào đây: **[nhóm điền]**.

## 4. Thư mục ảnh minh chứng

Ảnh chụp đặt trong `docs/postman/screenshots/` (nhóm tạo khi chụp), tên theo mã task, ví dụ `task06-T06.5.png`, `task10a-runner.png`. Chưa có ảnh nào trong repo ở thời điểm viết tài liệu này: **[nhóm chụp và điền]**.

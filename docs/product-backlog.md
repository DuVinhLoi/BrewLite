# Product Backlog — BrewLite

> Nguồn: đề `docs/BrewLite-CongNghePhanMem-fixed.md` (§2.3 Sprint, §3 sản phẩm, §4 yêu cầu, §8 backlog 10 task, §9 Task 10, §10 DoD, §12 API). Backlog này **không thêm story ngoài đề**. Mỗi story ứng 1–1 với một Task của §8 (US-*n* = Task *n*) và có 1 điểm, tổng 10 điểm.
> Cột "Bằng chứng" của mỗi story là endpoint / file / test có thật trong repo, kèm thư mục Postman của task trong `docs/postman/BrewLite.postman_collection.json`. Bảng minh chứng đầy đủ (request, kết quả chạy, ảnh cần chụp): `docs/minh-chung-10-task.md`. Quy tắc đồng bộ đề, code và file này: `.claude/rules/doc-code-sync.md`.

## 1. Product Vision và các bên liên quan

**Product Vision (đề §3.1):** *"BrewLite giúp khách hàng đặt và thanh toán đồ uống **không dùng tiền mặt** chỉ trong vài chạm, giảm thời gian xếp hàng và nhận đơn nhanh tại quầy."*

Các bên liên quan (đề §3.2): khách hàng, nhân viên quầy/Barista, quản lý cửa hàng/Product Owner, giảng viên nghiệm thu, nhóm phát triển, đơn vị thanh toán (mô phỏng bằng mock payment).

- **Barista nằm ngoài MVP** (đề §3.2: "nằm ngoài phạm vi MVP và là phần mở rộng"). Nhóm làm thêm **màn Quầy** `/barista` để State Machine (US-10) có người vận hành trên web; **không có** màn quản trị kho. Backend giữ vai trò `BARISTA` / `ADMIN`; phần API của nhân viên vẫn kiểm bằng **Postman** (`docs/postman/BrewLite.postman_collection.json`).
- Đăng nhập tài khoản nhân viên (BARISTA hoặc ADMIN) trên web thì vào thẳng `/barista`; header chỉ có mục "Quầy", không có giỏ hàng; mở trang khách (`/`, `/cart`, `/history`, `/profile`) bị chuyển về `/barista`. ADMIN chỉnh kho qua API.
- **Kiểm thử API bằng Postman.** Ở thời điểm hiện tại nhóm không dùng Swagger để test hay demo; Swagger UI `/docs` vẫn còn trong code.

## 2. Tổng quan backlog

| Story | Task (đề §8) | Sprint (đề §2.3) | Điểm |
|---|---|---|---:|
| US-01 Khởi tạo dự án | 1 | 1 | 1 |
| US-02 API danh sách sản phẩm | 2 | 1 | 1 |
| US-03 Trang Menu | 3 | 1 | 1 |
| US-04 Chi tiết và tùy chọn sản phẩm | 4 | 1 | 1 |
| US-05 Giỏ hàng | 5 | 2 | 1 |
| US-06 API tạo đơn hàng | 6 | 2 | 1 |
| US-07 Đăng ký / Đăng nhập (JWT) | 7 | 2 | 1 |
| US-08 Thanh toán không tiền mặt | 8 | 3 | 1 |
| US-09 Xác nhận, lịch sử đơn và bàn giao | 9 | 3 | 1 |
| US-10 Nghiệp vụ backend | 10 | 3 | 1 |
| | | **Tổng** | **10** |

Mục tiêu từng Sprint (đề §2.3): Sprint 1 "Nền tảng và hiển thị menu" (US-01…04), Sprint 2 "Giỏ hàng, đặt đơn, đăng nhập" (US-05…07), Sprint 3 "Thanh toán, bàn giao và nghiệp vụ nâng cao" (US-08…10).

> **Lưu ý đánh số.** Đề §4.3 đặt mã "US-05" cho story *Thanh toán không tiền mặt*, trong khi Task 5 của §8 là Giỏ hàng. Backlog này đánh số theo Task nên story thanh toán là **US-08**; nguyên văn story và AC của đề §4.3 được giữ trong US-08.

## 3. User story

### US-01 — Khởi tạo dự án và cấu trúc (Task 1, Sprint 1, 1 điểm)

*Là một* thành viên nhóm phát triển, *tôi muốn* một repo có cấu trúc `frontend` và `backend` chạy được ngay, *để* cả nhóm làm việc trên cùng một nền chung. (Task 1 là task kỹ thuật nên người dùng của story là nhóm phát triển.)

Tiêu chí chấp nhận:
- Repo có 2 thư mục `frontend` (Next.js) và `backend` (NestJS) chạy được.
- Có `README.md` hướng dẫn chạy, `.env.example` và lịch sử Git.
- Backend thiếu `DATABASE_URL` hoặc `JWT_SECRET` thì dừng ngay với lỗi nêu rõ biến thiếu, không chạy với cấu hình sai.

Bằng chứng: `README.md`, `.env.example`, `backend/package.json`, `frontend/package.json`; test `backend/test/bootstrap-env.spec.ts` (thiếu `DATABASE_URL`), `backend/test/task47-auth.spec.ts` (thiếu `JWT_SECRET`). Postman: thư mục `Task 01`.

### US-02 — API danh sách sản phẩm (Task 2, Sprint 1, 1 điểm)

*Là một* khách hàng, *tôi muốn* lấy được danh sách đồ uống từ hệ thống, *để* biết quán có món gì và giá bao nhiêu.

Tiêu chí chấp nhận:
- `GET /products` trả 200 và JSON menu gồm `id`, `name`, `price`, `imageUrl` từ dữ liệu seed (4 món trong `backend/prisma/seed.ts`).
- Món hết hàng (`stock = 0`) không có trong menu.
- `GET /products/:id` trả chi tiết một món; id không có thì trả 404.

Bằng chứng: `backend/src/product/product.controller.ts`, `backend/prisma/seed.ts`; test `backend/test/order-product.spec.ts` (ca "product list excludes stock-0", "product detail unknown → NotFound"). Postman: thư mục `Task 02`.

### US-03 — Trang Menu (Task 3, Sprint 1, 1 điểm)

*Là một* khách hàng, *tôi muốn* xem menu đồ uống có hình, tên, giá, *để* chọn món nhanh.

Tiêu chí chấp nhận:
- Trang `/` gọi `GET /products` và render lưới sản phẩm, mỗi thẻ có hình, tên, giá (đề §4.1 mục 1).
- Khi đang tải hiện trạng thái loading (khung xương); danh sách rỗng hiện trạng thái empty.
- Khi gọi API lỗi hiện thông báo lỗi kèm nút "Thử lại", không hiện lưới rỗng như thể menu trống.

Bằng chứng: `frontend/src/components/ProductGrid.tsx`, `frontend/src/lib/api.ts` (`getProducts`); test `frontend/src/components/ProductGrid.test.ts`, `frontend/src/lib/api.test.ts`. Postman: thư mục `Task 03`.

### US-04 — Chi tiết và tùy chọn sản phẩm (Task 4, Sprint 1, 1 điểm)

*Là một* khách hàng, *tôi muốn* xem chi tiết món và chọn size, topping, *để* đặt đúng khẩu vị và biết giá cuối.

Tiêu chí chấp nhận:
- Màn chi tiết cho chọn size S/M/L và topping (đề §4.1 mục 2).
- Đơn giá = giá món + phụ thu size (S +0, M +5.000, L +10.000) + giá từng topping (Trân châu 5.000, Kem cheese 8.000, Thạch cà phê 6.000); giá hiển thị đổi ngay khi đổi tùy chọn.
- Bảng giá ở frontend trùng bảng giá ở backend (backend là nơi tính giá thật, xem US-06).

Bằng chứng: `frontend/src/components/ProductDetailModal.tsx`, `frontend/src/lib/pricing.ts`, `GET /products/:id`; test `frontend/src/lib/pricing.test.ts`, `frontend/src/components/ProductDetailModal.test.ts`, `frontend/src/lib/product-detail.test.ts`, `backend/test/pricing-table.spec.ts`. Postman: thư mục `Task 04`.

### US-05 — Giỏ hàng (Task 5, Sprint 2, 1 điểm)

*Là một* khách hàng, *tôi muốn* quản lý giỏ hàng, *để* gom nhiều món rồi thanh toán một lần.

Tiêu chí chấp nhận:
- Thêm, sửa số lượng, xóa món trong giỏ; tổng tiền tự tính lại sau mỗi thay đổi (đề §4.1 mục 3).
- State giỏ lưu bằng Zustand và giữ lại khi tải lại trang (localStorage).
- Header có badge tổng số ly trong giỏ.
- Giỏ tối đa 20 dòng, mỗi dòng tối đa 99 ly, khớp giới hạn của `POST /orders` (US-06).

Bằng chứng: `frontend/src/store/cart.ts`, `frontend/src/components/cart/CartView.tsx`, `frontend/src/components/HeaderView.tsx`; test `frontend/src/store/cart.test.ts`, `frontend/src/lib/cart-limits.test.ts`, `frontend/src/components/cart/CartView.test.ts`, `frontend/src/components/QtyStepper.test.ts`, `frontend/src/components/HeaderView.test.ts`. Postman: thư mục `Task 05`.

### US-06 — API tạo đơn hàng (Task 6, Sprint 2, 1 điểm)

*Là một* khách hàng, *tôi muốn* gửi giỏ hàng lên hệ thống để tạo đơn, *để* có mã đơn trước khi thanh toán.

Tiêu chí chấp nhận:
- `POST /orders` nhận giỏ hàng, validate bằng `class-validator` (tối đa 20 dòng, số lượng 1 đến 99, size S/M/L); dữ liệu sai trả 400.
- Lưu đơn ở trạng thái `PENDING` và trả mã đơn.
- Server tự tính tổng tiền từ giá món, size, topping; client không gửi được giá.
- Cần JWT của khách (xem US-07); món không tồn tại trả 404.

Bằng chứng: `backend/src/order/order.controller.ts`, `backend/src/order/pricing.ts`, `backend/src/order/dto/create-order.dto.ts`; test `backend/test/order-product.spec.ts`, `backend/test/pricing-table.spec.ts`. Postman: thư mục `Task 06`.

### US-07 — Đăng ký / Đăng nhập (JWT) (Task 7, Sprint 2, 1 điểm)

*Là một* khách hàng, *tôi muốn* đăng ký và đăng nhập, *để* đặt đơn và xem lịch sử đơn của riêng mình.

Tiêu chí chấp nhận:
- `POST /auth/register` băm mật khẩu bằng bcrypt, không trả `passwordHash`; email trùng trả 409.
- `POST /auth/login` đúng thông tin thì phát JWT; sai mật khẩu và email không tồn tại cùng trả 401 với cùng một thông điệp.
- Route đặt đơn có guard: không kèm token hợp lệ trả 401.
- Trang `/login` có tab Đăng nhập / Đăng ký, báo lỗi bằng tiếng Việt; hết phiên (401) thì quay lại `/login`.

Bằng chứng: `backend/src/auth/auth.controller.ts`, `backend/src/auth/jwt-auth.guard.ts`, `frontend/src/app/login/page.tsx`; test `backend/test/auth.spec.ts`, `backend/test/task47-auth.spec.ts`, `backend/test/roles.spec.ts`, `frontend/src/lib/login.test.ts`, `frontend/src/lib/session.test.ts`, `frontend/src/components/LoginView.test.ts`. Postman: thư mục `Task 07`.

### US-08 — Thanh toán không tiền mặt (Task 8, Sprint 3, 1 điểm)

Nguyên văn đề §4.3:

> *Là một* khách hàng, *tôi muốn* thanh toán đơn bằng ví điện tử/thẻ, *để* tôi không cần mang tiền mặt.

Tiêu chí chấp nhận (nguyên văn đề §4.3, kèm cách kiểm):
- Khi giỏ hàng có ít nhất 1 sản phẩm, nút "Thanh toán" hiển thị tổng tiền.
- Chọn phương thức (Ví / Thẻ) rồi xác nhận ⇒ `POST /orders` tạo đơn `PENDING` trước, `POST /payments` thành công mới chuyển `PAID` (2 bước, khớp Task 6 + 8).
- Nếu thanh toán lỗi, đơn ở trạng thái `PAYMENT_FAILED` và giỏ hàng được giữ nguyên.
- Sau khi thành công, hiển thị mã đơn và màn hình xác nhận.

Cách kiểm lỗi thanh toán: đặt `MOCK_GATEWAY_DECLINE_METHOD=CARD`, chọn Thẻ thì đơn sang `PAYMENT_FAILED`; chọn lại Ví thì đơn cũ sang `PAID`, không tạo đơn mới (README, mục "Demo thanh toán lỗi").

Bằng chứng: `POST /payments` (`backend/src/payment/payment.controller.ts`, `backend/src/payment/mock-payment-gateway.service.ts`), `frontend/src/components/PaymentForm.tsx`, `frontend/src/lib/payment/api-gateway.ts`; test `backend/test/payment-failure.spec.ts`, `backend/test/order-payment.integration.spec.ts`, `frontend/src/components/PaymentForm.test.ts`, `frontend/src/lib/payment/api-gateway.test.ts`, `frontend/src/lib/payment/checkout-session.test.ts`. Postman: thư mục `Task 08`.

### US-09 — Xác nhận, lịch sử đơn và bàn giao (Task 9, Sprint 3, 1 điểm)

*Là một* khách hàng, *tôi muốn* thấy xác nhận đơn và xem lại các đơn đã đặt, *để* biết đơn của mình đang ở đâu; *và là* nhóm phát triển, *tôi muốn* bàn giao bản chạy được cho khách hàng (giảng viên).

Tiêu chí chấp nhận:
- Màn xác nhận hiện mã đơn và trạng thái (đề §4.1 mục 6).
- `GET /orders/me` trả lịch sử đơn của người đăng nhập, mới nhất trước; trang `/history` hiển thị và tự cập nhật mỗi 3 giây đến khi không còn đơn `PAID` / `PREPARING` / `READY`.
- `docker compose up --build` chạy đủ 3 service (frontend `:3001`, backend `:3000`, db `:5432`).
- README đủ hướng dẫn chạy; demo end-to-end chọn món, giỏ hàng, thanh toán, xác nhận chạy được (đề §11).

Bằng chứng: `GET /orders/me` (`backend/src/order/order.controller.ts`), `frontend/src/app/history/page.tsx`, `frontend/src/components/PaymentSuccess.tsx`, `docker-compose.yml`, `README.md`; test `backend/test/order-product.spec.ts` (ca "listMine returns newest-first"), `backend/test/compose-env.spec.ts`, `frontend/src/components/HistoryView.test.ts`, `frontend/src/components/PaymentSuccess.test.ts`, `frontend/src/lib/history.test.ts`, `frontend/src/lib/use-order-poll.test.ts`. Postman: thư mục `Task 09`.

### US-10 — Nghiệp vụ backend (Task 10, Sprint 3, 1 điểm)

*Là một* chủ cửa hàng (Product Owner), *tôi muốn* nghiệp vụ đặt hàng và thanh toán đúng khi bị gọi lặp lại hoặc đồng thời, *để* không thu tiền hai lần và không bán quá tồn kho.

Tiêu chí chấp nhận, theo 4 yêu cầu và tiêu chí chấm của đề §9:
- **(a) Order State Machine.** Luồng `PENDING` → `PAID` → `PREPARING` → `READY` → `COMPLETED`; chuyển trạng thái không có mũi tên trong đề §9.1 bị chặn bằng `assertTransition`, trả 400 `Invalid transition`. Kiểm qua Postman (thư mục `Task 10 / (a)`): đăng nhập `POST /auth/login` bằng tài khoản barista, gửi JWT dạng Bearer, rồi `PATCH /orders/{id}` lần lượt `PREPARING`, `READY`, `COMPLETED` đều trả 200; sau `COMPLETED` gọi `PATCH` sang `CANCELLED` trả 400. Khách không tự tiến đơn (403).
- **(a) trên web, màn Quầy `/barista`** (mở rộng đề §3.2). Đăng nhập `barista@brewlite.vn` thấy 3 cột Chờ pha / Đang pha / Sẵn sàng (`GET /orders?status=PAID,PREPARING,READY`, đơn cũ nhất trước, tự tải lại mỗi 5 giây). Nút "Nhận pha", "Pha xong", "Đã giao" gửi `PATCH /orders/:id` lần lượt `PREPARING`, `READY`, `COMPLETED`; "Hủy (hết nguyên liệu)" chỉ có ở cột Chờ pha và hỏi xác nhận trước khi gửi `CANCELLED`. Biên lai và `/history` của khách (tab khác) đổi bước theo trong vòng 3 giây.
- **(b) Thanh toán idempotent.** Gửi 2 lần cùng `Idempotency-Key` chỉ tạo 1 đơn (`POST /orders`) và chỉ trừ tiền 1 lần (`POST /payments`); gửi lặp trả kết quả cũ với mã 200.
- **(c) Tồn kho đồng thời.** Nhiều khách đặt cùng lúc dùng transaction và optimistic locking (`Product.version`): tồn kho không bao giờ âm.
- **(d) Khuyến mãi và điểm thưởng.** Mã `BREWLITE10` giảm 10% (`floor(total * 0.1)`); điểm thưởng `floor(finalAmount * 0.1 / 1000)` cộng sau khi đơn `PAID` (chốt của nhóm, đề §9).

Bằng chứng: `backend/src/state-machine/order-state.machine.ts`, `backend/src/payment/payment.service.ts`, `PATCH /orders/:id`, `scripts/demo-state-machine.sh` (dự phòng); test `backend/src/state-machine/order-state.machine.spec.ts` (a), `backend/test/order-advance.spec.ts`, `backend/test/order-payment.integration.spec.ts` (ca "(b) same Idempotency-Key charges once", "(c) concurrent stock never negative", voucher `BREWLITE10`), `backend/test/pg-payment.integration.spec.ts` (Postgres thật, chỉ chạy khi có `DATABASE_URL`), `frontend/src/lib/order-status.test.ts`. Màn Quầy: `frontend/src/app/barista/page.tsx`, `frontend/src/components/BaristaView.tsx`, `frontend/src/lib/barista.ts`, `frontend/src/lib/api.ts` (`advanceOrder`, `cancelOrder`); test `frontend/src/lib/barista.test.ts`, `frontend/src/components/BaristaView.test.ts`, `frontend/src/lib/api.test.ts`, `frontend/src/lib/nav.test.ts`, `backend/test/barista-queue.spec.ts`. Postman: thư mục `Task 10`.

## 4. API mở rộng của nhóm (đề §12.1)

Đề §12.1 giữ 7 endpoint tối thiểu; nhóm hiện thực thêm 6 endpoint mở rộng (ghi chú nhóm trong đề). Phần dành cho nhân viên kiểm bằng Postman; hàng đợi và tiến đơn có thêm màn Quầy `/barista`, kho chỉ qua API:

- `PATCH /orders/:id`: khách hủy đơn của mình; BARISTA/ADMIN tiến đơn `PREPARING` → `READY` → `COMPLETED` và hủy đơn `PAID` (US-10). Giao diện: nút trên thẻ đơn ở `/barista`.
- `GET /orders?status=`: hàng đợi quầy, mặc định `PAID,PREPARING,READY`; chỉ BARISTA/ADMIN. Giao diện: `/barista`, tự tải lại mỗi 5 giây.
- `GET /admin/products` và `PATCH /admin/products/:id/stock`: xem và chỉnh tồn kho; chỉ ADMIN, không có màn hình.
- `GET /orders/:id` (chi tiết đơn của chủ đơn) và `GET /users/me` (hồ sơ và điểm tích lũy, trang `/profile`) dành cho khách và có giao diện.

## 5. Quy ước làm việc

Definition of Done, Definition of Ready, kế hoạch Sprint, burndown và Review/Demo: `docs/scrum-process.md`.

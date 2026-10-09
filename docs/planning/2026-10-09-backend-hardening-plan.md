# Kế hoạch: hoàn thiện nghiệp vụ backend theo đề (sau `/code-review` 2026-10-09)

> Dành cho session thợ code. Làm hết Task 0 → Task 9 trong một lượt. Mỗi task 1 commit trên nhánh riêng, không merge, không push.

- **Nguồn:** `/code-review` toàn bộ backend (`69a28ad...HEAD`, 2 trục Standards + Spec), đã đối chiếu lại bằng chạy thử. Spec: `docs/BrewLite-CongNghePhanMem-fixed.md` (đề), `docs/user-sequence-specifications.md`, `docs/use-case-specifications.md`.
- **Mục tiêu:** backend làm đúng đề và đúng tài liệu; sau đó mới cải thiện UI (plan khác).
- **Rule bắt buộc:** `.claude/rules/doc-code-sync.md`. Đổi hành vi thì sửa sơ đồ sequence, mục C, Phần III và test trong **cùng commit** với code.

## Quyết định người dùng đã chốt (2026-10-09)

| # | Quyết định |
|---|---|
| Q1 | Tiêu chí (b) của đề: thêm `Idempotency-Key` cho `POST /orders` (cột `Order.idempotencyKey`, không thêm bảng) |
| Q2 | Ảnh món: file tĩnh `frontend/public/images/*.svg`, seed đặt `imageUrl = '/images/<món>.svg'`; giai đoạn UI sẽ thay ảnh thật |
| Q3 | Demo nhánh thanh toán lỗi: biến môi trường backend `MOCK_GATEWAY_DECLINE_METHOD` (`CARD` / `WALLET`), mặc định tắt |
| Q4 | Khóa JWT mặc định công khai: giữ cho demo, chỉ thêm comment `ponytail:` trỏ README "Lưu ý bảo mật" |
| Q5 | Nhánh `fix/backend-hardening` từ `develop`, mỗi task 1 commit sau khi test xanh, không merge, không push |
| — | Đã chốt trước: D1 (hoàn tiền trước transaction khi hủy) giữ nguyên; backend bắt buộc `DATABASE_URL`; khóa trong tiến trình cho 1 instance; nhánh `useDb` giữ |

## Ràng buộc chung

- Đúng 5 thực thể. Thêm dữ liệu thì thêm cột, ghi chú ở đề §12.2 như `User.role`.
- Mọi đổi trạng thái đơn qua `assertTransition`. Mọi đổi `Product.stock` tăng `version`.
- Message lỗi backend tiếng Anh, chữ hiển thị cho người dùng tiếng Việt, comment tiếng Việt.
- `backend/tsconfig.json` target ES2021, không có `Object.hasOwn`: dùng `Object.prototype.hasOwnProperty.call(obj, key)`.
- Lệnh test: `cd backend && npx jest` (mốc 104 pass / 1 skip), `cd frontend && npx vitest run` (mốc 89 pass), `npx tsc --noEmit` ở `backend/`. Suite pg: `docker compose up -d db`, trong `backend/`: `npx prisma generate`, `npx prisma migrate deploy`, `DATABASE_URL=postgresql://brewlite:brewlite@localhost:5432/brewlite npx jest pg-payment`.
- Skill: `tdd` cho mỗi thay đổi hành vi (test đỏ trước rồi mới sửa); `ponytail` (diff nhỏ nhất, xóa trước thêm); `uml` khi sửa khối PlantUML; `code-review` ở Task 9.
- Kiểm PlantUML đã sửa: trích khối ra `.puml`, render bằng PlantUML 1.2024.7 (`https://repo1.maven.org/maven2/net/sourceforge/plantuml/plantuml/1.2024.7/plantuml-1.2024.7.jar`, SHA-1 `cb57b315d96413d55622edaa8c4b234e2ebf4b1f`, tải vào thư mục tạm, không commit), mở PNG xem không có "Syntax Error".

## Task 0: Chuẩn bị

- [x] `git status --short` sạch (trừ file plan này), `git switch -c fix/backend-hardening develop`.
- [x] Chạy mốc test (backend, frontend, tsc). Lệch mốc thì dừng và báo người dùng. *(104 pass / 1 skip, 89 pass, tsc sạch.)*
- [x] Commit file plan này: `docs: plan backend-hardening`.

## Task 1: Validate đầu vào `POST /orders` (Spec 5, Standards 1)

Lỗi đã tái hiện: topping `"constructor"` / `"toString"` lọt DTO và service (`t in TOPPING_PRICES` nhận khóa prototype), đơn có `total = NaN`, Postgres trả 500. `quantity` không có giới hạn trên nên tổng vượt Int32 cũng ra 500.

- [x] Test đỏ trong `backend/test/order-product.spec.ts`: topping `constructor` → 400; `quantity: 100` → lỗi DTO; 21 dòng → lỗi DTO; món giá rất lớn làm tổng > `2147483647` → 400 `Order total too large`.
- [x] `backend/src/order/order.service.ts`: kiểm topping bằng `hasOwnProperty.call`; sau khi tính `total`, vượt `2147483647` → `BadRequestException('Order total too large')`.
- [x] `backend/src/order/dto/create-order.dto.ts`: `quantity` thêm `@Max(99)`, `items` thêm `@ArrayMaxSize(20)`.
- [x] `backend/src/order/order.controller.ts:29`: thay `!(s in OrderStatus)` bằng `!Object.values(OrderStatus).includes(s as OrderStatus)`.
- [x] Tài liệu: `user-sequence` §2.4 (A.2, note DTO ở sơ đồ bước 2a), Phần III dòng UC04.
- [x] Commit `fix(backend): chan topping khoa prototype, gioi han so luong va tong don`.

## Task 2: Hoàn đúng số thực thu khi hủy đơn `PAID` (Standards 3)

- [x] Test đỏ trong `backend/test/order-payment.integration.spec.ts`: đơn `PAID` không có biên lai `SUCCESS` → hủy thành công (hoàn kho + `CANCELLED`) nhưng `gateway.refunds` rỗng.
- [x] `backend/src/payment/payment.service.ts:150`: bỏ nhánh `: order.total`; chỉ gọi `refund` khi `collected > 0`.
- [x] Tài liệu: `user-sequence` §2.5 mục C (quy tắc `PAID -> CANCELLED`) và §2.7 mục C: "không có biên lai thì không gọi hoàn tiền".
- [x] Commit `fix(backend): huy don PAID chi hoan so thuc thu`.

## Task 3: Một Idempotency-Key dùng cho đơn khác → 422 (Spec 6)

Hiện tại cùng chủ gửi key K đã dùng cho đơn A kèm `orderId` B thì nhận 200 `status: 'PAID'` với biên lai của A, trong khi B vẫn `PENDING`. Theo bản nháp IETF `Idempotency-Key`, dùng lại key cho payload khác thì trả 422. Không dùng 409 vì frontend đã gán 409 cho "hết hàng, đã hoàn tiền".

- [x] Test đỏ: key của đơn `o1` gửi kèm `o2` (cùng chủ) → `UnprocessableEntityException`, cổng không bị gọi, `o2` vẫn `PENDING`. Giữ nguyên test cũ "khác chủ → 403".
- [x] `payment.service.ts` (nhánh cache hit): sau 2 kiểm 404/403 của `hitOrder`, ném `UnprocessableEntityException('Idempotency-Key already used for another order')`.
- [x] Tài liệu: `user-sequence` §2.4 (A.3 "Xác thực & phân quyền", note ở `alt Không phải chủ đơn`, mục C dòng "Chỉ chủ đơn mới thanh toán được"), Phần III UC05.
- [x] Commit `fix(backend): Idempotency-Key dung cho don khac tra 422`.

## Task 4: `Idempotency-Key` cho `POST /orders` (Spec 2, quyết định Q1)

Đề §9 tiêu chí (b): "gửi 2 lần cùng Idempotency-Key chỉ tạo 1 đơn".

- [x] `backend/prisma/schema.prisma`: `Order.idempotencyKey String? @unique`. Migration viết tay như `20261009000000_user_role`: `backend/prisma/migrations/20261009120000_order_idempotency_key/migration.sql` gồm `ALTER TABLE "Order" ADD COLUMN "idempotencyKey" TEXT;` và `CREATE UNIQUE INDEX "Order_idempotencyKey_key" ON "Order"("idempotencyKey");`. Chạy `npx prisma generate`, `npx prisma migrate deploy` trên DB compose.
- [x] Contract `order.contract.ts`: `OrderDto.idempotencyKey?`, `IOrderRepository.findByIdempotencyKey(key, tx?)`. Cài ở `PrismaOrderRepo` và `InMemoryOrderRepo`; `save` lưu key.
- [x] Hành vi (header tùy chọn, frontend luôn gửi):
  - không có key → tạo đơn như cũ, 201;
  - key đã có, cùng người → trả lại đúng đơn cũ, **200**, không tạo đơn mới;
  - key thuộc người khác → 422;
  - 2 request song song cùng key → vẫn chỉ 1 đơn (bắt lỗi unique `P2002` khi `save`, đọc lại theo key).
- [x] `OrderController.create()` đọc header `idempotency-key`, đặt 200/201 như `PaymentController.pay()`.
- [x] Frontend: `PaymentForm.tsx` giữ 1 key tạo đơn (`useState(() => newIdempotencyKey())`) cho tới khi rời màn thanh toán; `PaymentRequest` thêm `orderIdempotencyKey?`; `ApiPaymentGateway.createOrderId()` gửi header `Idempotency-Key`. Key này khác key của `POST /payments`.
- [x] Test backend: 2 lần cùng key → cùng `id`, kho chỉ có 1 đơn, lần 2 là 200; khác người → 422; không key → 2 đơn. Thêm 1 case vào suite pg (2 request song song cùng key → 1 đơn). Test frontend (`api-gateway.test.ts`): `POST /orders` có header; lỗi mạng rồi thử lại dùng cùng key.
- [x] Tài liệu:
  - đề `BrewLite-CongNghePhanMem-fixed.md` §12.2: ghi chú nhóm thêm `Order.idempotencyKey`, sửa danh sách `Order(...)`;
  - `user-sequence` §2.4 (A.2, sơ đồ bước 2a có header và nhánh "key đã dùng → 200 đơn cũ", mục C), Phần III UC04, Agent Rules §2(b): "chỉ tạo 1 đơn (`POST /orders`) và chỉ trừ tiền 1 lần (`POST /payments`)";
  - `use-case` §4 dòng UC04.
- [x] Commit `feat: Idempotency-Key cho POST /orders (tieu chi b)`.

## Task 5: Ảnh món (Spec 1, quyết định Q2)

Đề §8 Task 2: "`GET /products` trả về JSON menu (id, tên, giá, ảnh)". Hiện seed không đặt `imageUrl`.

- [x] Tạo `frontend/public/images/{latte,americano,cappuccino,tra-dao}.svg`: SVG phẳng đơn giản (cốc, màu riêng từng món), mỗi file vài KB.
- [x] `backend/prisma/seed.ts`: đặt `imageUrl` cho p1–p4 ở cả `create` lẫn `update` (DB cũ được cập nhật khi khởi động lại).
- [x] `frontend/src/lib/mock-products.ts`: `imageUrl` dùng cùng bộ ảnh ("Cà phê sữa" dùng `latte.svg`). Sửa comment dòng 1 cho đúng code: menu mẫu chỉ dùng khi chưa cấu hình `NEXT_PUBLIC_API_URL`.
- [x] Kiểm trên compose: `GET /products` có `imageUrl`, trang menu hiện ảnh thay cho ☕.
- [x] Tài liệu: `user-sequence` §2.1 mục C (nguồn ảnh).
- [x] Commit `feat: anh mon cho menu (seed imageUrl + SVG tinh)`.

## Task 6: Demo nhánh thanh toán lỗi bằng biến môi trường (Spec 3, quyết định Q3)

- [x] Test đỏ trong `backend/test/payment-failure.spec.ts`: đặt `process.env.MOCK_GATEWAY_DECLINE_METHOD = 'CARD'` (khôi phục sau test). Trả bằng `CARD` → 400, đơn `PAYMENT_FAILED`; thử lại cùng đơn bằng `WALLET` với key mới → `PAID` (UC06 KB1).
- [x] `backend/src/payment/mock-payment-gateway.service.ts`: `charge()` ném lỗi khi `process.env.MOCK_GATEWAY_DECLINE_METHOD === opts.method` (đọc lúc gọi). Giữ `failNextCharge()` cho test cũ.
- [x] `docker-compose.yml` (backend): `MOCK_GATEWAY_DECLINE_METHOD: ${MOCK_GATEWAY_DECLINE_METHOD:-}`. `.env.example`: dòng mẫu đã comment kèm giải thích.
- [x] README: mục demo thanh toán lỗi (đặt biến trong `.env`, `docker compose up -d backend`, trả bằng Thẻ → lỗi, đổi sang Ví → thành công).
- [x] Tài liệu: `user-sequence` §2.4 mục C (Mock Gateway), §2.5 KB1 (cách gây lỗi khi demo).
- [x] Commit `feat: cong gia tu choi theo MOCK_GATEWAY_DECLINE_METHOD de demo PAYMENT_FAILED`.

## Task 7: Đơn seed `order-1042` khớp bảng giá (Spec 7)

- [x] `backend/prisma/seed.ts`: đơn `order-1042` đổi size `M` → `S` để giữ `35000` đúng bảng giá (S +0), sửa comment dòng 5 và `console.log`.
- [x] Commit `fix(seed): order-1042 dung bang gia`.

## Task 8: Dọn smell (Standards 2, 4–10)

Không đổi hành vi; toàn bộ test giữ xanh sau mỗi bước.

- [x] **Hằng giả trong `assertTransition` (Standards 5):** repo in-memory (`backend/src/stubs/*`) lưu bản sao khi `save` và trả bản sao khi đọc (`structuredClone`), giống Prisma. Nhánh bù lỗi trong `payment.service.ts` dùng `order.status` thật thay cho `assertTransition(OrderStatus.PENDING, …)`, xóa comment giải thích về stub.
- [x] **Chuẩn hóa role (Standards 6):** `toRole()` ở `jwt-auth.guard.ts:16` và `auth.service.ts:34`.
- [x] **Code chết (Standards 7):**
  - xóa `auth/current-user.decorator.ts` và dòng export;
  - xóa `IPaymentRepository.findByOrderId` cùng 2 bản cài;
  - xóa `runInTransaction` khỏi `IProductRepository`, `IPaymentRepository`, `IUserRepository` và các bản cài (chỉ `orders.runInTransaction` được gọi);
  - `PaymentStatus` bỏ `'FAILED'`.
- [x] **Một `PrismaService` (Standards 8):** tạo `PrismaModule` `@Global()` (providers/exports `PrismaService` khi `useDb`), import ở `AppModule`, bỏ `PrismaService` khỏi providers của 4 module. Gom phần map row → DTO trong `prisma-product.repo.ts` và `prisma-user.repo.ts` thành `toDto` như 2 repo còn lại.
- [x] **Hằng thay chuỗi (Standards 9):** `OrderStatus.PAID` ở `payment.service.ts:62,135`; `DEFAULT_SIZE` ở `prisma-order.repo.ts:65`.
- [x] **Tên tham số (Standards 10):** `_orderId` / `_amount` → `orderId` / `amount` trong `mock-payment-gateway.service.ts`.
- [x] **Khóa JWT (Standards 2, quyết định Q4):** comment `ponytail:` ở `auth.module.ts:18` trỏ README "Lưu ý bảo mật".
- [x] **Giới hạn chưa ghi (Standards 4):** `user-sequence` §2.4 mục C ghi giới hạn `ponytail: sequential stock loop`.
- [x] Commit `refactor(backend): don smell sau code-review (khong doi hanh vi)`.

## Task 9: Kiểm chứng cuối và báo cáo

- [x] Backend jest, `tsc --noEmit`, suite pg (sau `migrate deploy`), frontend vitest. Ghi số test mới.
- [x] `docker compose up -d --build`. Smoke bằng curl:
  - `GET /products` có `imageUrl`;
  - `POST /orders` 2 lần cùng key → cùng `id`, lần 2 là 200;
  - topping `constructor` → 400;
  - đặt `MOCK_GATEWAY_DECLINE_METHOD=CARD` → trả Thẻ 400, trả Ví 201.
  - Đo thời gian `GET /products`, `POST /orders`, `POST /payments` (`curl -w '%{time_total}'`) làm bằng chứng đề §4.2 "API < 500ms".
- [x] Render lại mọi khối PlantUML đã sửa, mở PNG kiểm.
- [x] Chạy skill `code-review` với fixed point `develop`. Sửa finding (commit riêng nếu có).
- [x] Cập nhật số test và tóm tắt đợt sửa ở `docs/develop-status-report.md`, `docs/scrum-process.md`. Tick plan này. Commit `docs: bao cao backend-hardening`.
- [x] Báo người dùng: tên nhánh, danh sách commit, kết quả test và smoke, finding còn lại. Chờ duyệt rồi mới merge.

## Không làm (có lý do)

- **Báo hết hàng giả khi thanh toán đồng thời (Spec 4):** không tái hiện. 3, 8, 20, 40 thanh toán đồng thời cùng 1 món trên Postgres compose đều `PAID`, kho trừ đúng; 40 đơn mất 310ms (đo 2026-10-09).
- **`cancelOrderAs` kiểm quyền ngoài khóa, `cancelOrder` để public (Standards 11):** đơn `PAID` không quay lại `PENDING` nên kiểm trước khóa không tạo kẽ hở; `cancelOrder` chỉ test gọi, không có route nào.

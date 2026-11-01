# BrewLite — đặt cà phê không tiền mặt (BTL Công nghệ Phần mềm, SGU)

> Khách chọn món → giỏ hàng → thanh toán Ví/Thẻ → nhận mã đơn tại quầy. Spec đầy đủ: `docs/BrewLite-CongNghePhanMem-fixed.md`, sơ đồ activity: `docs/activity-diagrams.md`, class diagram: `docs/class-diagrams.md`, Product Backlog (10 user story + tiêu chí chấp nhận): `docs/product-backlog.md`, quy trình Scrum: `docs/scrum-process.md`.

| Thành phần | Công nghệ | Chạy local |
|---|---|---|
| Frontend | Next.js 14 + Zustand | `:3001` |
| Backend | NestJS 10 + class-validator | `:3000` |
| CSDL | PostgreSQL 16 + Prisma (schema 5 entity) | `:5432` |
| Thanh toán | Mock gateway (`MockPaymentGatewayService`), dữ liệu lưu Postgres qua Prisma | — |

## Chạy nhanh

```bash
cp .env.example .env   # tùy chọn: compose đã có mặc định dev
docker compose up --build
# Frontend http://localhost:3001, Backend http://localhost:3000/products; test API bằng Postman: docs/postman/
```

Frontend trong compose là bản production (`next build` rồi `next start`), không có hot reload: sửa mã frontend thì chạy lại `docker compose up -d --build frontend` (hoặc `docker compose up -d --build` để dựng lại backend và frontend; db dùng image `postgres:16` nên không có gì để dựng). `NEXT_PUBLIC_API_URL` và `NEXT_PUBLIC_PAYMENT_MODE` được nhúng lúc `next build` (qua `args:` của service `frontend`), nên đổi một trong hai trong `.env` thì phải chạy `docker compose up -d --build frontend`; `up` không kèm `--build` không đổi gì. Muốn hot reload, chạy rời bằng `npm run dev` như dưới.

`DATABASE_URL` trong `.env` (host `localhost`) chỉ dành cho **chạy rời** ở dưới. Compose bỏ qua biến đó: backend trong container luôn nối `db:5432`, nên `cp .env.example .env` rồi `docker compose up` vẫn chạy đúng. `.env` đã nằm trong `.gitignore`, đừng commit.

Chạy rời từng phần:

```bash
cd backend && npm install && npm test   # jest dùng kho in-memory, không cần DB
cd frontend && npm install && npm run dev   # http://localhost:3001
cd frontend && npm test                     # vitest
cd frontend && npm run lint                 # ESLint next/core-web-vitals: 0 lỗi; cảnh báo no-img-element là có chủ đích (ảnh SVG tĩnh)
```

Backend không tự đọc file `.env` và **bắt buộc có `DATABASE_URL` và `JWT_SECRET`**: thiếu `DATABASE_URL` thì dừng ngay với lỗi `DATABASE_URL is required` (kho in-memory chỉ dành cho jest), thiếu hoặc để rỗng `JWT_SECRET` thì dừng với lỗi `JWT_SECRET is required`. Muốn chạy rời: bật DB (`docker compose up -d db`), đặt `DATABASE_URL=postgresql://brewlite:brewlite@localhost:5432/brewlite` và một `JWT_SECRET` bất kỳ trong shell (bash: `export`; PowerShell: `$env:DATABASE_URL=...`), chạy `npx prisma migrate deploy` và `npx ts-node prisma/seed.ts` một lần (như `CMD` của `backend/Dockerfile`; không seed thì menu rỗng và chưa có tài khoản demo) rồi `npm run start:dev`.

`NEXT_PUBLIC_PAYMENT_MODE=mock` demo UI không cần backend; `=api` cắm `POST /payments` thật.

## Tiến độ 10 task (đã merge vào develop)

Cả 10 task đã có trên nhánh này; mỗi task ứng 1 user story US-01…US-10 trong `docs/product-backlog.md` (US-*n* = Task *n*). Kiểm thử: backend `npm test` 170 pass / 3 skip (suite Postgres, chạy khi có `DATABASE_URL`), frontend `npm test` 733 pass; số đo ngày 2026-10-15 trên nhánh `develop-agile` (đã gồm `backend/test/swagger.spec.ts`). Bằng chứng từng story (endpoint, file, test): cột "Bằng chứng" của `docs/product-backlog.md`; `docs/develop-status-report.md` chỉ là tài liệu lịch sử.

| Task | Hiện thực chính |
|---|---|
| 1 Khởi tạo | `frontend/` + `backend/`, README, `.env.example`, `docker-compose.yml` |
| 2 `GET /products` | `ProductModule`, lọc `stock > 0`, `GET /products/:id` trả 404 khi không có |
| 3 Menu | `ProductGrid`: loading / lỗi + thử lại / rỗng |
| 4 Size/Topping | `ProductDetailModal` + `lib/pricing.ts` |
| 5 Giỏ hàng | Zustand + localStorage, badge số lượng |
| 6 `POST /orders` | JWT, `class-validator`, server tự tính giá (`backend/src/order/pricing.ts`), đơn `PENDING` |
| 7 JWT | `POST /auth/register` (bcrypt, 409 trùng email), `POST /auth/login`, `JwtAuthGuard` |
| 8 Thanh toán | `POST /payments` Ví/Thẻ, `PAID` / `PAYMENT_FAILED`, thử lại giữ đơn cũ |
| 9 Bàn giao | màn xác nhận, `/history` (`GET /orders/me`), compose 3 service, seed tài khoản demo |
| 10 Nghiệp vụ | State Machine `assertTransition`, Idempotency-Key, optimistic lock + transaction, voucher `BREWLITE10` + điểm thưởng |

## API (7 endpoint tối thiểu + 6 mở rộng) và Entity (5)

Tối thiểu theo đề §12.1: `GET /products`, `GET /products/:id`, `POST /auth/register`, `POST /auth/login`, `POST /orders`, `POST /payments`, `GET /orders/me`. Các endpoint khách (`POST /orders`, `POST /payments`, `GET /orders/me`, cùng `GET /orders/:id` và `GET /users/me` bên dưới) chỉ dành cho CUSTOMER (`@Roles(CUSTOMER)`): token BARISTA/ADMIN nhận 403 `Insufficient role`. Trên web, tài khoản nhân viên (BARISTA hoặc ADMIN) đăng nhập xong vào thẳng màn Quầy `/barista`; mở trang khách thì bị chuyển về `/barista`.
Mở rộng của nhóm: `PATCH /orders/:id` (Task 10; khách hủy đơn của mình, BARISTA/ADMIN tiến đơn + hủy đơn `PAID`), `GET /orders/:id` (chi tiết đơn, chỉ chủ đơn, chỉ CUSTOMER), `GET /users/me` (hồ sơ + tổng điểm tích lũy, trang `/profile`, chỉ CUSTOMER). Thêm 3 endpoint cho Barista/Admin (mở rộng ngoài MVP §3.2, nhóm kiểm bằng Postman): `GET /orders?status=PAID,PREPARING,READY` (BARISTA/ADMIN, có giao diện ở màn Quầy `/barista`), `GET /admin/products` và `PATCH /admin/products/:id/stock` (chỉ ADMIN, **chỉ gọi qua API, không có màn hình**). Xem mục 12 trong `docs/BrewLite-CongNghePhanMem-fixed.md`.
`Product(stock,version)`, `User(loyaltyPoints, role)`, `Order(idempotencyKey unique)`, `OrderItem(size,toppings)`, `Payment(idempotencyKey unique, discount, loyaltyPointsEarned)`.
Voucher `BREWLITE10` −10% validate nội bộ trong `PaymentService`, không bảng riêng.

## Giao diện

Giao diện theo phong cách "nét mực" (font Fraunces + Be Vietnam Pro, bộ hình minh họa SVG ở `frontend/public/doodles` và `frontend/public/images`). 10 màn: Header, Menu, Chi tiết món, Giỏ hàng (`/cart`), Thanh toán, Đặt hàng thành công (biên lai), Đăng nhập / Đăng ký (`/login`), Hồ sơ (`/profile`), Lịch sử (`/history`) và Quầy (`/barista`, cho BARISTA và ADMIN). Thanh toán và biên lai nằm trong `/cart`. Màn Quầy có 3 cột Chờ pha / Đang pha / Sẵn sàng, tự tải lại mỗi 5 giây; nút "Nhận pha", "Pha xong", "Đã giao" tiến đơn, "Hủy (hết nguyên liệu)" chỉ có ở cột Chờ pha. Chưa có màn quản trị kho: Admin chỉnh kho qua API (nhóm dùng Postman).

**Chưa có ảnh chụp màn hình.** Đợt làm giao diện chạy trong môi trường không có trình duyệt nên chưa ai nhìn các màn bằng mắt và chưa chụp ảnh. Việc kiểm hình ảnh còn lại (1280, 1024, 760 và 360px) và kết quả kiểm thử cuối: `docs/develop-status-report.md` mục 8.

## Demo end-to-end

```bash
cp .env.example .env   # hoặc bỏ qua: compose đã có default dev sẵn
docker compose up --build
# Frontend http://localhost:3001, Backend http://localhost:3000; test API bằng Postman: docs/postman/
```

Tài khoản demo (seed sẵn trong `backend/prisma/seed.ts`):

| Vai trò | Email | Mật khẩu | Dùng ở đâu |
|---|---|---|---|
| Khách | `demo@brewlite.vn` | `demo1234` | web `:3001` (và Postman) |
| Quầy (Barista) | `barista@brewlite.vn` | `barista1234` | web `:3001/barista` (và Postman) |
| Quản trị (Admin) | `admin@brewlite.vn` | `admin1234` | web `:3001/barista`; chỉnh kho chỉ qua Postman |

1. Mở `:3001`, đăng nhập tài khoản khách (bảng trên).
2. Menu → bấm món mở modal chọn size/topping → thêm vào giỏ.
3. Vào giỏ → nhập voucher `BREWLITE10` → thanh toán → xem biên lai.
4. Mở `/history` xem đơn vừa đặt (mới nhất trước).

Mỗi tab trình duyệt giữ phiên đăng nhập riêng (token nằm trong sessionStorage của tab): reload tab nào cũng giữ đúng tài khoản của tab đó. Tab mở mới bằng cách gõ URL phải đăng nhập lại; "Nhân bản tab" của trình duyệt mang theo phiên của tab gốc.

Lưu ý: test pg (`backend/npm test` suite có DB thật) cần `DATABASE_URL` trỏ Postgres chạy được;
không có `DATABASE_URL` thì các test pg tự skip, suite còn lại vẫn xanh.
Chạy suite pg: `docker compose up -d db`, rồi trong `backend/`: `npx prisma generate` (chạy lại mỗi khi schema đổi), `npx prisma migrate deploy`, đặt `DATABASE_URL` như trên và `npx jest pg-payment`.

### Demo thanh toán lỗi (`PAYMENT_FAILED`)

Cổng thanh toán là bản giả nên mặc định luôn thành công. Muốn xem nhánh lỗi: đặt `MOCK_GATEWAY_DECLINE_METHOD=CARD` trong `.env` (bỏ dấu `#` ở dòng mẫu trong `.env.example`), chạy `docker compose up -d backend`, rồi ở màn Thanh toán chọn **Thẻ ngân hàng** → báo thanh toán thất bại, đơn sang `PAYMENT_FAILED`, giỏ hàng được giữ. Đổi sang **Ví điện tử** và bấm lại → thanh toán được, đơn cũ sang `PAID` (không tạo đơn mới). Xóa dòng biến rồi `docker compose up -d backend` để tắt.

### Dữ liệu demo

- Đơn, biên lai, điểm thưởng và tồn kho nằm trong volume `brewlite_pgdata`, giữ nguyên qua `docker compose restart`, `down` rồi `up` (không có `-v`). Đăng nhập lại tài khoản demo vẫn thấy lịch sử các buổi trước; màn Quầy `/barista` (hoặc `GET /orders?status=` bằng Postman, tài khoản barista) vẫn liệt kê đơn khách đã trả mà chưa giao.
- Smoke test hoặc thử API bằng curl trên stack này: đăng ký tài khoản email đuôi `@smoke.test`, không dùng tài khoản demo. Xong thì dọn: `docker compose exec backend npm run smoke:clean` (xóa các tài khoản `@smoke.test` cùng đơn, biên lai của họ, hoàn kho các đơn đã trừ kho).
- Làm lại từ đầu (DB trống, chỉ có 3 tài khoản demo và 4 món): `docker compose down -v` rồi `docker compose up -d --build`. Lệnh này xóa mọi đơn và lịch sử.

### Lưu ý bảo mật (chỉ dành cho demo)

- **Khóa JWT mặc định là công khai.** Mã không còn khóa mặc định (thiếu `JWT_SECRET` thì backend không khởi động), nhưng các giá trị mẫu (`dev-secret` trong `docker-compose.yml`, `change-me-in-production` trong `.env.example`) nằm ngay trong repo này. Vì JWT nay mang `role`, ai biết khóa đều tự ký được token ADMIN. Với mọi thứ ngoài bản demo cục bộ, hãy đặt `JWT_SECRET` riêng và kín. Compose cũng công bố cổng 3000/3001/5432 trên mọi giao diện mạng của máy chạy, nên đừng để cấu hình mặc định chạy trên máy truy cập được từ ngoài.
- **Seed chạy lại mỗi lần container backend khởi động.** Nó tạo lại `barista@brewlite.vn` / `admin@brewlite.vn` với đúng mật khẩu ghi ở bảng trên (mật khẩu đã đổi sẽ bị đặt lại khi khởi động lại). Seed chỉ tạo tài khoản và món còn thiếu: đơn, biên lai, điểm thưởng và tồn kho đã có được giữ qua các lần khởi động lại (làm lại từ đầu: xem mục "Dữ liệu demo"). Chỉ phù hợp cho demo.
- **Giới hạn đã biết.** Vai trò được đọc từ JWT (hạn 7 ngày), nên đổi vai trò trong DB chỉ có hiệu lực sau khi token hết hạn hoặc đăng nhập lại. Quầy/Admin hủy đơn `PAID` thì hoàn tiền và hoàn kho nhưng không thu hồi điểm thưởng đã cộng (giống khi khách tự hủy).

## Demo State Machine (đề §9 + §9.1, tiêu chí a)

Luồng `PENDING → PAID → PREPARING → READY → COMPLETED` (cùng nhánh `PAYMENT_FAILED`, `CANCELLED`) xem được trên giao diện khách: `/history` và màn biên lai hiện **thanh 5 bước** (bước đã qua chấm mực kèm dấu ✓, bước hiện tại chấm cam và chữ đậm, bước sau chấm trắng; `Thanh toán lỗi` đỏ, `Đã hủy` xám) và **tự cập nhật mỗi 3 giây** (biên lai gọi `GET /orders/:id` đến khi đơn `COMPLETED` / `CANCELLED`; `/history` gọi `GET /orders/me` đến khi không còn đơn `PAID` / `PREPARING` / `READY`). Khách chỉ xem và hủy đơn của mình (nút "Hủy đơn" chỉ còn khi đơn chưa vào quầy, `PREPARING` trở đi backend chặn 400); khách không tự tiến đơn (403). Tiến đơn là việc của nhân viên quầy (ngoài MVP theo đề §3.2), làm trên **màn Quầy** `/barista`. Mỗi tab trình duyệt giữ một phiên đăng nhập riêng, nên khách và quầy mở hai tab cạnh nhau được:

1. Tab 1: khách `demo@brewlite.vn` (demo) đặt và trả một đơn trên web (đơn sang `PAID`), giữ nguyên biên lai; mở thêm `/history` nếu muốn xem cả lịch sử.
2. Tab 2: đăng nhập `barista@brewlite.vn` (mật khẩu demo ở bảng trên), web vào thẳng `/barista`; đơn vừa trả nằm cuối cột Chờ pha (đơn cũ nhất trước).
3. Bấm "Nhận pha", rồi "Pha xong", rồi "Đã giao": thẻ đơn chuyển sang cột Đang pha, Sẵn sàng, rồi rời quầy.
4. Sau mỗi lần bấm, biên lai và `/history` của khách tự chuyển bước trong khoảng 3 giây, không cần tải lại trang.

Kiểm cùng luồng qua API (Postman): import `docs/postman/BrewLite.postman_collection.json`, `POST /auth/login` bằng tài khoản barista, dán `accessToken` vào **Authorization → Bearer Token**, rồi `PATCH /orders/{id}` với `{ "status": "PREPARING" }`, `READY`, `COMPLETED` (cả ba 200); `PATCH` sang `CANCELLED` trên đơn đã `COMPLETED` phải trả 400 `Invalid transition COMPLETED -> CANCELLED`. Chạy cả thư mục `Task 10 / (a)` thì collection tự làm các bước này trên đơn của khách `@smoke.test`.

Dự phòng nếu giao diện trục trặc (cần compose đang chạy, đã seed tài khoản khách và quầy):

```bash
bash scripts/demo-state-machine.sh   # đăng nhập → tạo đơn → trả → PREPARING → READY → COMPLETED → thử COMPLETED → CANCELLED (phải 400)
```

Test chứng minh chặn chuyển trạng thái sai (tiêu chí a của đề):

```bash
cd backend && npx jest order-state order-advance              # State Machine + tiến đơn theo vai trò + chặn người lạ
cd backend && npx jest roles barista-queue admin-inventory    # RolesGuard, hàng đợi quầy, tồn kho Admin (kho không có giao diện)
cd backend && npx jest swagger                                 # tài liệu Swagger có PATCH /orders/{id} với enum OrderStatus
cd frontend && npx vitest run src/lib/order-status.test.ts    # bảng chuyển trạng thái FE = 9 mũi tên §9.1 = ALLOWED của backend
cd frontend && npx vitest run src/lib/barista.test.ts src/components/BaristaView.test.ts   # màn Quầy: cột, nút theo cột, poll 5 giây
```

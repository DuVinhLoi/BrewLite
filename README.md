# BrewLite — đặt cà phê không tiền mặt (BTL Công nghệ Phần mềm, SGU)

> Khách chọn món → giỏ hàng → thanh toán Ví/Thẻ → nhận mã đơn tại quầy. Spec đầy đủ: `docs/BrewLite-CongNghePhanMem-fixed.md`, sequence chi tiết: `docs/user-sequence-specifications.md`.

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
# Frontend http://localhost:3001, Backend http://localhost:3000/products
```

`DATABASE_URL` trong `.env` (host `localhost`) chỉ dành cho **chạy rời** ở dưới. Compose bỏ qua biến đó: backend trong container luôn nối `db:5432`, nên `cp .env.example .env` rồi `docker compose up` vẫn chạy đúng. `.env` đã nằm trong `.gitignore`, đừng commit.

Chạy rời từng phần:

```bash
cd backend && npm install && npm test   # jest dùng kho in-memory, không cần DB
cd frontend && npm install && npm run dev   # http://localhost:3001
```

Backend không tự đọc file `.env` và **bắt buộc có `DATABASE_URL`**: thiếu thì dừng ngay với lỗi `DATABASE_URL is required` (kho in-memory chỉ dành cho jest). Muốn chạy rời: bật DB (`docker compose up -d db`), đặt `DATABASE_URL=postgresql://brewlite:brewlite@localhost:5432/brewlite` trong shell (bash: `export`; PowerShell: `$env:DATABASE_URL=...`), chạy `npx prisma migrate deploy` và `npx ts-node prisma/seed.ts` một lần (như `CMD` của `backend/Dockerfile`; không seed thì menu rỗng và chưa có tài khoản demo) rồi `npm run start:dev`.

`NEXT_PUBLIC_PAYMENT_MODE=mock` demo UI không cần backend; `=api` cắm `POST /payments` thật.

## Tiến độ 10 task (đã merge vào develop)

Cả 10 task đã có trên `develop`. Kiểm thử: backend `npm test` 104 pass / 1 skip (suite Postgres, chạy khi có `DATABASE_URL`), frontend `npm test` 89 pass (đã gồm phần mở rộng Barista + Admin ngoài đề, xem mục Demo State Machine). Bằng chứng từng task: `docs/develop-status-report.md`.

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

## API (7 endpoint tối thiểu + 5 mở rộng) và Entity (5)

Tối thiểu theo đề §12.1: `GET /products`, `GET /products/:id`, `POST /auth/register`, `POST /auth/login`, `POST /orders`, `POST /payments`, `GET /orders/me`.
Mở rộng của nhóm: `PATCH /orders/:id` (Task 10; khách hủy đơn của mình, BARISTA/ADMIN tiến đơn + hủy đơn `PAID`), `GET /orders/:id` (chi tiết đơn, chỉ chủ đơn). Thêm 3 endpoint cho Barista/Admin (mở rộng ngoài MVP §3.2): `GET /orders?status=PAID,PREPARING,READY` (UC08, BARISTA/ADMIN), `GET /admin/products` và `PATCH /admin/products/:id/stock` (UC14, chỉ ADMIN). Xem mục 12 trong `docs/BrewLite-CongNghePhanMem-fixed.md`.
`Product(stock,version)`, `User(loyaltyPoints, role)`, `Order`, `OrderItem(size,toppings)`, `Payment(idempotencyKey unique, discount, loyaltyPointsEarned)`.
Voucher `BREWLITE10` −10% validate nội bộ trong `PaymentService`, không bảng riêng.

## Demo end-to-end

```bash
cp .env.example .env   # hoặc bỏ qua: compose đã có default dev sẵn
docker compose up --build
# Frontend http://localhost:3001, Backend http://localhost:3000
```

Tài khoản demo (seed sẵn trong `backend/prisma/seed.ts`):

| Vai trò | Email | Mật khẩu | Vào sau đăng nhập |
|---|---|---|---|
| Khách | `demo@brewlite.vn` | `demo1234` | `/` |
| Quầy (Barista) | `barista@brewlite.vn` | `barista1234` | `/barista` |
| Quản trị (Admin) | `admin@brewlite.vn` | `admin1234` | `/admin` |

1. Mở `:3001`, đăng nhập tài khoản khách (bảng trên).
2. Menu → bấm món mở modal chọn size/topping → thêm vào giỏ.
3. Vào giỏ → nhập voucher `BREWLITE10` → thanh toán → xem biên lai.
4. Mở `/history` xem đơn vừa đặt (mới nhất trước).

Lưu ý: test pg (`backend/npm test` suite có DB thật) cần `DATABASE_URL` trỏ Postgres chạy được;
không có `DATABASE_URL` thì các test pg tự skip, suite còn lại vẫn xanh.
Chạy suite pg: `docker compose up -d db`, rồi trong `backend/`: `npx prisma generate` (chạy lại mỗi khi schema đổi), `npx prisma migrate deploy`, đặt `DATABASE_URL` như trên và `npx jest pg-payment`.

### Lưu ý bảo mật (chỉ dành cho demo)

- **Khóa JWT mặc định là công khai.** Giá trị mặc định (`dev-secret` trong `docker-compose.yml`, `brewlite-dev-secret` trong mã, `change-me-in-production` trong `.env.example`) nằm ngay trong repo này. Vì JWT nay mang `role`, ai biết khóa đều tự ký được token ADMIN. Với mọi thứ ngoài bản demo cục bộ, hãy đặt `JWT_SECRET` riêng và kín. Compose cũng công bố cổng 3000/3001/5432 trên mọi giao diện mạng của máy chạy, nên đừng để cấu hình mặc định chạy trên máy truy cập được từ ngoài.
- **Seed chạy lại mỗi lần container backend khởi động.** Nó tạo lại `barista@brewlite.vn` / `admin@brewlite.vn` với đúng mật khẩu ghi ở bảng trên (mật khẩu đã đổi sẽ bị đặt lại khi khởi động lại), đồng thời đặt lại tồn kho 4 món về 10; chỉ phù hợp cho demo.
- **Giới hạn đã biết.** Vai trò được đọc từ JWT (hạn 7 ngày), nên đổi vai trò trong DB chỉ có hiệu lực sau khi token hết hạn hoặc đăng nhập lại. Quầy/Admin hủy đơn `PAID` thì hoàn tiền và hoàn kho nhưng không thu hồi điểm thưởng đã cộng (giống khi khách tự hủy).

## Demo State Machine (đề §9 + §9.1, tiêu chí a)

Luồng `PENDING → PAID → PREPARING → READY → COMPLETED` (cùng nhánh `PAYMENT_FAILED`, `CANCELLED`) xem được trên giao diện: `/history` và màn biên lai hiện **thanh 5 bước** (bước đã qua tô xanh, bước hiện tại đậm; `Thanh toán lỗi` đỏ, `Đã hủy` xám). Khách chỉ xem và hủy đơn của mình (nút "Hủy đơn" chỉ còn khi đơn chưa vào quầy, `PREPARING` trở đi backend chặn 400); khách không tự tiến đơn (403). Tiến đơn là việc của Barista (UC09–UC11), mở rộng ngoài MVP theo đề §3.2:

1. Khách `demo@brewlite.vn` đặt và trả một đơn (đơn sang `PAID`), mở `/history` xem thanh tiến trình.
2. Đăng nhập `barista@brewlite.vn` / `barista1234` thì vào thẳng `/barista`: đơn nằm ở cột **Chờ pha**. Bấm **Nhận pha** → **Pha xong** → **Đã giao** (trang tự tải lại mỗi 5 giây). Hoặc bấm **Hủy (hết nguyên liệu)** để hủy đơn `PAID` (UC12: hoàn tiền + hoàn kho).
3. Quay lại `/history` của khách (tải lại trang) thấy thanh tiến trình đã chuyển.

Dự phòng nếu giao diện trục trặc (cần compose đang chạy, đã seed tài khoản khách và quầy):

```bash
bash scripts/demo-state-machine.sh   # đăng nhập → tạo đơn → trả → PREPARING → READY → COMPLETED → thử COMPLETED → CANCELLED (phải 400)
```

Test chứng minh chặn chuyển trạng thái sai (tiêu chí a của đề):

```bash
cd backend && npx jest order-state order-advance              # State Machine + tiến đơn theo vai trò + chặn người lạ
cd backend && npx jest roles barista-queue admin-inventory    # RolesGuard, hàng đợi quầy, tồn kho Admin
cd frontend && npx vitest run src/lib/order-status.test.ts    # bảng chuyển trạng thái FE = 9 mũi tên §9.1 = ALLOWED của backend
```

## Demo tồn kho (UC14, chỉ Admin)

Đăng nhập `admin@brewlite.vn` / `admin1234` thì vào thẳng `/admin`: bảng mọi món, kể cả món hết hàng. Bấm `−1` / `+1` / `+10` hoặc nhập số rồi `Lưu`. Nếu trong lúc đó có đơn vừa trừ kho (hoặc người khác vừa sửa) thì backend trả 409, trang tự tải lại và báo thử lại trên số mới; không cho tồn kho âm (400). Món đặt về 0 biến khỏi menu của khách.

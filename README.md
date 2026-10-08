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
cd backend && npm install && npm test && npm run start:dev   # không đặt DATABASE_URL: dùng kho in-memory, không cần DB
cd frontend && npm install && npm run dev   # http://localhost:3001
```

Backend không tự đọc file `.env`. Muốn chạy rời với Postgres: bật DB (`docker compose up -d db`), đặt `DATABASE_URL=postgresql://brewlite:brewlite@localhost:5432/brewlite` trong shell (bash: `export`; PowerShell: `$env:DATABASE_URL=...`), chạy `npx prisma migrate deploy` một lần rồi `npm run start:dev`.

`NEXT_PUBLIC_PAYMENT_MODE=mock` demo UI không cần backend; `=api` cắm `POST /payments` thật.

## Tiến độ 10 task (đã merge vào develop)

Cả 10 task đã có trên `develop`. Kiểm thử: backend `npm test` 62 pass / 1 skip (suite Postgres, chạy khi có `DATABASE_URL`), frontend `npm test` 46 pass. Bằng chứng từng task: `docs/develop-status-report.md`.

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

## API (7 endpoint tối thiểu + 2 mở rộng) và Entity (5)

Tối thiểu theo đề §12.1: `GET /products`, `GET /products/:id`, `POST /auth/register`, `POST /auth/login`, `POST /orders`, `POST /payments`, `GET /orders/me`.
Mở rộng của nhóm: `PATCH /orders/:id` (hủy / tiến trạng thái đơn, Task 10), `GET /orders/:id` (chi tiết đơn) — chỉ chủ đơn. Không có `GET /orders` (hàng đợi quầy, Barista ngoài MVP). Xem mục 12 trong `docs/BrewLite-CongNghePhanMem-fixed.md`.
`Product(stock,version)`, `User(loyaltyPoints)`, `Order`, `OrderItem(size,toppings)`, `Payment(idempotencyKey unique, discount, loyaltyPointsEarned)`.
Voucher `BREWLITE10` −10% validate nội bộ trong `PaymentService`, không bảng riêng.

## Demo end-to-end

```bash
cp .env.example .env   # hoặc bỏ qua: compose đã có default dev sẵn
docker compose up --build
# Frontend http://localhost:3001, Backend http://localhost:3000
```

1. Mở `:3001`, đăng nhập `demo@brewlite.vn` / `demo1234` (seed sẵn trong `backend/prisma/seed.ts`).
2. Menu → bấm món mở modal chọn size/topping → thêm vào giỏ.
3. Vào giỏ → nhập voucher `BREWLITE10` → thanh toán → xem biên lai.
4. Mở `/history` xem đơn vừa đặt (mới nhất trước).

Lưu ý: test pg (`backend/npm test` suite có DB thật) cần `DATABASE_URL` trỏ Postgres chạy được;
không có `DATABASE_URL` thì các test pg tự skip, suite còn lại vẫn xanh.

# BrewLite — đặt cà phê không tiền mặt (BTL Công nghệ Phần mềm, SGU)

> Khách chọn món → giỏ hàng → thanh toán Ví/Thẻ → nhận mã đơn tại quầy. Spec đầy đủ: `docs/BrewLite-CongNghePhanMem-fixed.md`, sequence chi tiết: `docs/user-sequence-specifications.md`.

| Thành phần | Công nghệ | Chạy local |
|---|---|---|
| Frontend | Next.js 14 + Zustand | `:3001` |
| Backend | NestJS 10 + class-validator | `:3000` |
| CSDL | PostgreSQL 16 + Prisma (schema 5 entity) | `:5432` |
| Thanh toán | Mock gateway (stub In-Memory, chưa cần DB thật) | — |

## Chạy nhanh

```bash
cp .env.example .env
docker compose up --build
# Frontend http://localhost:3001, Backend http://localhost:3000/payments
```

Chạy rời từng phần:

```bash
cd backend && npm install && npm test && npm run start:dev
cd frontend && npm install && npm run dev   # http://localhost:3001
```

`NEXT_PUBLIC_PAYMENT_MODE=mock` demo UI không cần backend; `=api` cắm `POST /payments` thật.

## Tiến độ 10 task (theo PR đã merge vào develop)

| Task | Trạng thái |
|---|---|
| 1 Khởi tạo, 2 `GET /products`, 4 detail, 6 `POST /orders`, 7 JWT, 9 compose/bàn giao | còn teammate |
| 3 Menu, 5 Giỏ (frontend, mock data) | đã có trên develop |
| 8 `POST /payments` + 10 state-machine/idempotent/tồn kho/loyalty (stub In-Memory, `jest` 17/17) | đã có trên develop |

## API (10 endpoint) và Entity (5)

`GET /products`, `GET /products/:id`, `POST /auth/register`, `POST /auth/login`, `POST /orders`, `POST /payments`, `GET /orders/me`, `PATCH /orders/:id`, `GET /orders`, `GET /orders/:id` — xem mục 12 trong docs.
`Product(stock,version)`, `User(loyaltyPoints)`, `Order`, `OrderItem(size,toppings)`, `Payment(idempotencyKey unique, discount, loyaltyPointsEarned)`.
Voucher `BREWLITE10` −10% validate nội bộ trong `PaymentService`, không bảng riêng.

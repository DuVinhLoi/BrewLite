# Architecture Overview

## 1. Scope

BrewLite Assignment 2 tập trung vào hai mảng lớn:

1. Yêu cầu kinh doanh và frontend flow: menu, giỏ hàng, voucher, thanh toán, xác nhận đơn, lịch sử đơn.
2. Hạ tầng và kiến trúc kỹ thuật: web application, API, database, health checks, deployment.

## 2. Container / runtime view

```text
Browser / PWA
  -> Next.js Web App
      -> REST API (NestJS)
          -> PostgreSQL
          -> Payment Simulator / Gateway

CI/CD pipeline
  -> Build image
  -> Smoke test /health + /products
  -> Deploy to Vercel + Render
```

### Components

- `apps/web`: giao diện người dùng mobile-first, dùng Next.js, quản lý giỏ hàng và modal tùy chọn size/topping.
- `apps/api`: API REST, bảo vệ JWT, xử lý đơn hàng và thanh toán.
- `PostgreSQL`: dữ liệu nghiệp vụ: User, Product, Order, OrderItem, Payment.
- `Payment simulator`: mô phỏng charge/refund, không lưu trạng thái nhạy cảm như cardNumber.
- `CI/CD`: build, smoke test, deploy, rollback nếu health check thất bại.

## 3. Module and domain separation

### Frontend

- `app/`: các màn hình chính
- `components/`: card, modal, cart, payment form
- `store/`: Zustand state cho giỏ hàng
- `lib/`: pricing, api client, payment gateway abstraction

### Backend

- `controllers/`: endpoints REST
- `services/`: business logic
- `modules/`: domain modules như product, order, payment, auth
- `repositories/`: truy cập DB hoặc abstraction contract
- `dto/`: validation request

## 4. Data flow

1. Người dùng mở menu, frontend gọi `GET /products`.
2. Chọn món, thêm vào giỏ hàng trong client state.
3. Khi thanh toán, frontend tạo đơn bằng `POST /orders` (nếu cần).
4. `POST /payments` thực hiện payment với `Idempotency-Key`.
5. Hệ thống cập nhật trạng thái đơn và ghi nhận giao dịch.
6. `GET /orders/me` trả lịch sử đơn của người dùng đang đăng nhập.
7. Health check `/health` xác nhận DB đang sống và service sẵn sàng phục vụ.

## 5. Quality attributes

### NFR-01: Tính cô lập trách nhiệm
Mỗi layer có nhiệm vụ rõ ràng: UI, business logic, persistence, deployment.

### NFR-03: Bảo mật
JWT và kiểm tra quyền truy cập cho tài nguyên khách hàng.

### NFR-12: Tính nhất quán trong thanh toán
`Idempotency-Key` + `orderId` + trạng thái đơn đảm bảo không trừ tiền lặp.

### NFR-13: Không vượt tồn kho
Transaction kiểm tra và cập nhật tồn kho có điều kiện `stock >= n`.

### NFR-15: Health check
`GET /health` trả `200` khi DB đang sẵn sàng, `503` khi không.

### NFR-16: Truy vết deployment
CD phải gắn tag theo SHA hoặc semantic version và smoke test trên /health, /products, và web app.

### NFR-17: Có thể rollback
Deployment phải có smoke test và health check để dừng pipeline nếu service không sẵn sàng.

## 6. ADR traceability

| ADR | Chủ đề | Ảnh hưởng |
|---|---|---|
| ADR-001 | Monorepo | Dễ quản lý frontend/backend trong một repo |
| ADR-002 | NestJS layers | Tách rõ controller/service/repository |
| ADR-003 | Containerization | Đồng bộ env dev/test/production |
| ADR-004 | Vercel + Render | Deployment production và health check |
| ADR-005 | Idempotency + lock | Bảo vệ payment và stock consistency |

## 7. Deployment notes

- Deployment không lưu `APP_VERSION` trong repo như biến môi trường public.
- `GET /health` chỉ trả `status` và `database`, không cache nhầm lẫn.
- Smoke test cần kiểm tra `/health`, `/products`, và UI root page trước khi sign off deploy.

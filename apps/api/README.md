# BrewLite API — NestJS + PostgreSQL

Code Sprint 1 và Sprint 2 nằm trong `src/catalog`, `src/auth`, `src/checkout`; Prisma ở `prisma/`.
Product API giữ contract Task 4. Hướng dẫn env, migration/seed, chạy và kiểm thử: [README root](../../README.md).

```powershell
npm.cmd ci
npm.cmd run prisma:generate
npm.cmd run prisma:migrate
npm.cmd run prisma:seed
npm.cmd run start:dev
```

API mặc định cổng 4000, CORS cho `http://localhost:3000` (đổi bằng `CORS_ORIGINS`).
Cần DATABASE_URL của database demo riêng và JWT_SECRET >=32 ký tự trong `.env` của app.
Seed không ghi đè sản phẩm có sẵn; SEED_DEMO_USERS=true chỉ dùng demo/test, không production.

## API hiện có

- Public: GET /products, GET /products/:id, GET /catalog/options, POST /auth/register, POST /auth/login, GET /health.
- CUSTOMER: POST /orders, POST /payments, GET /orders/me; chi tiết/hủy đơn của chính mình.
- BARISTA: GET /orders/:id; PATCH trạng thái PREPARING, READY, COMPLETED theo vòng đời.
- Đăng ký bcrypt cost 12, JWT HS256 một giờ; server tính giá, giữ tồn và tạo đơn trong transaction.
- Health: 200 `{status:'ok',database:'up'}`; 503 `{status:'error',database:'down'}`.
- [Collection Barista](../../tests/postman/BrewLite-Sprint2.postman_collection.json).

## Thanh toán và triển khai

API replay theo chủ đơn/`orderId`/key/`paymentMethod` (BR-05, FR-16); simulator không lưu trạng thái. Số thẻ không tham gia fingerprint và không được lưu/log. Request cùng key/phương thức trên cùng đơn đã trả được replay; đổi phương thức hoặc key sau khi PAID trả 409 `ORDER_NOT_PAYABLE`. Cùng key trên đơn khác được xử lý độc lập. Migration mới bỏ ràng buộc key xuyên đơn, giữ index mỗi đơn tối đa một Payment SUCCESS; không sửa migration đã phát hành.
Simulator chỉ có thành công hoặc decline (402 `PAYMENT_DECLINED`); lần thất bại không khóa key. Health giữ contract DB up/down bên trên.
Render chạy image API gắn full commit SHA, dùng Render Postgres **Internal Database URL**, `/health`, `JWT_SECRET`, `CORS_ORIGINS` và tắt auto-deploy. Docker CMD chạy `prisma migrate deploy` trước server. Seed là thao tác opt-in riêng, không reset dữ liệu. Chi tiết [deployment](../../docs/deployment.md).

```powershell
npm.cmd run lint
npm.cmd test -- --runInBand
npm.cmd run test:integration
npm.cmd run build
```

Integration chỉ chạy khi TEST_DATABASE_URL là database test riêng hợp lệ. `prisma:migrate` dùng `prisma migrate deploy`; không reset DB hoặc sửa migration đã phát hành.
Kiến trúc và ADR (Task 3): [docs/architecture](../../docs/architecture/architecture.md).
Nhóm phải hiểu và giải thích được code khi vấn đáp.

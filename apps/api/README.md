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

## Trạng thái đồng bộ Pha A

CR-5.0 lần 1 đã lấy SRS mới từ develop-Assignment2. Code thanh toán chưa được sửa trong Pha A:
CR-5.1 sẽ đổi replay theo chủ đơn/orderId/key/paymentMethod, không so số thẻ và bỏ unique key xuyên đơn bằng migration mới;
CR-5.2 sẽ chỉ giữ lỗi decline. Không coi code hiện tại đã đạt D2/D3/C3 mới.
Production chốt Render image + Render Postgres internal URL; Docker startup/CD sẽ cập nhật ở Pha B CR-5.3.

```powershell
npm.cmd run lint
npm.cmd test -- --runInBand
npm.cmd run test:integration
npm.cmd run build
```

Integration chỉ chạy khi TEST_DATABASE_URL là database test riêng hợp lệ. `prisma:migrate` dùng `prisma migrate deploy`; không reset DB hoặc sửa migration đã phát hành.
Kiến trúc và ADR (Task 3): [docs/architecture](../../docs/architecture/architecture.md).
Nhóm phải hiểu và giải thích được code khi vấn đáp.

# BrewLite API — NestJS + PostgreSQL

Sprint 1 có module `catalog`, Prisma `Product`, migration và seed 8 đồ uống. Hợp đồng theo [SRS mục 3.3 và FR-01/03](../../docs/requirements/srs.md), truy vết trong [ma trận](../../docs/traceability-matrix.md).

## Chạy từ thư mục này

Dùng Node 24.19.0. Tạo database PostgreSQL demo, copy `.env.example` thành `.env` và điền `DATABASE_URL`. Chi tiết biến/URL/cổng ở [README gốc](../../README.md#chạy-local).

```powershell
npm.cmd ci
npm.cmd run prisma:generate
npm.cmd run prisma:migrate
npm.cmd run prisma:seed
npm.cmd run start:dev
```

API mặc định cổng 4000, CORS cho `http://localhost:3000`. Seed upsert theo ID: chạy lại không tạo trùng nhưng đặt lại dữ liệu mẫu, chỉ chạy với DB demo. Không có tài khoản/auth ở Sprint 1.

## Endpoint và test

- `GET /products`: mảng Product, `200 []` khi chưa có dữ liệu.
- `GET /products/:id`: Product hoặc `404 PRODUCT_NOT_FOUND`.
- Product: `id`, `name`, `description`, `price` (VND nguyên), `imageUrl`, `stock`. Ảnh được web phục vụ.
- `test/products.e2e-spec.ts`: `API-T01` danh sách, `API-T02` chi tiết, `API-T03` không tồn tại, `API-T04` rỗng, `API-T05` lỗi DB không lộ chi tiết trong HTTP response. NestJS/HTTP chạy thật; Prisma provider được mock, không cần DB cho test.

```powershell
npm.cmd run lint
npm.cmd test -- --runInBand
npm.cmd run build
npm.cmd run start:prod
```

`prisma:migrate` chạy migration đã lưu bằng `prisma migrate deploy`; không dùng reset. Tài khoản, đơn/thanh toán, các lớp domain còn lại, `GET /health`, Docker và test tích hợp DB tự động thuộc Task 5. Kiến trúc/ADR Task 3 chưa được chốt trong checkout này.

Phạm vi Task 5 theo baseline mới nhất: [SRS](../../docs/requirements/srs.md) và [kế hoạch A2](../../docs/planning/2026-10-15-assignment2-plan.md). Thanh toán mô phỏng phải chống thu trùng theo `orderId` và phục hồi sau restart (AC-F16.7); Barista có Postman collection (AC-F24.4); health check có version/SHA và không cache (AC-N15.1–3). Các mục này chưa được hiện thực trong Sprint 1.

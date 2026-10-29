# BrewLite API — NestJS + PostgreSQL

Code nằm trong `src/catalog`, `src/auth`, `src/checkout`, `src/inventory`; Prisma ở `prisma/`.
Product API trả `stock` tính từ nguyên liệu cho size S không topping. Hướng dẫn env, migration/seed và chạy: [README root](../../README.md).

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
- Public: POST /inventory/availability; BARISTA: xem nguyên liệu/lịch sử/công thức, nhập/kiểm đếm kho và thay công thức. [Contract](../../docs/inventory-contract.md).
- Đăng ký bcrypt cost 12, JWT HS256 một giờ; server tính giá, giữ tồn và tạo đơn trong transaction.
- Health: 200 `{status:'ok',database:'up'}`; 503 `{status:'error',database:'down'}`.
- Snapshot nguyên liệu được giữ khi tạo đơn, tiêu thụ khi thanh toán thành công và giải phóng khi chủ đơn hủy. Đơn cũ `inventoryTracked=false` giữ cơ chế cũ, không đoán nguyên liệu.

## Thanh toán và triển khai

API replay theo chủ đơn/`orderId`/key/`paymentMethod` (BR-05, FR-16); kết quả thanh toán đến từ VNPay sandbox qua IPN hoặc QueryDR (`POST /payments/:id/sync`). Số thẻ chỉ nhập trên trang VNPay, API không nhận, không lưu và không log. Request cùng key/phương thức trên cùng đơn đã trả được replay; đổi phương thức hoặc key sau khi PAID trả 409 `ORDER_NOT_PAYABLE`. Cùng key trên đơn khác được xử lý độc lập. Migration mới bỏ ràng buộc key xuyên đơn, giữ index mỗi đơn tối đa một Payment SUCCESS; không sửa migration đã phát hành.
`POST /payments` chỉ tạo `Payment PENDING` và trả `paymentUrl` (không còn 402 `PAYMENT_DECLINED`); thất bại đến qua IPN hoặc QueryDR và không khóa key. Thiếu `VNP_TMN_CODE`, `VNP_HASH_SECRET` hoặc `WEB_URL` thì API vẫn khởi động, chỉ tạo URL mới trả 502 `PAYMENT_PROVIDER_ERROR`. Health giữ contract DB up/down bên trên.
Render chạy image API gắn full commit SHA, dùng Render Postgres **Internal Database URL**, `/health`, `JWT_SECRET`, `CORS_ORIGINS` và tắt auto-deploy. Docker CMD chạy `prisma migrate deploy` trước server. Seed là thao tác opt-in riêng, không reset dữ liệu. Chi tiết [deployment](../../docs/deployment.md).

```powershell
npm.cmd run lint
npm.cmd run build
```

Theo yêu cầu chủ dự án, toàn bộ test đã được xóa sau khi chạy kiểm chứng; kết quả ở [báo cáo kho](../../docs/inventory-verification.md). `prisma:migrate` dùng `prisma migrate deploy`; không reset DB hoặc sửa migration đã phát hành. [Runbook](../../docs/inventory-runbook.md) hướng dẫn kiểm kê và chuyển đổi.
Kiến trúc và ADR (Task 3): [docs/architecture](../../docs/architecture/architecture.md).
Nhóm phải hiểu và giải thích được code khi vấn đáp.

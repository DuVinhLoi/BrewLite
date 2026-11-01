---
paths:
  - "backend/src/**"
  - "backend/prisma/**"
  - "frontend/src/**"
  - "docs/BrewLite-CongNghePhanMem-fixed.md"
  - "docs/product-backlog.md"
  - "docs/activity-diagrams.md"
  - "docs/class-diagrams.md"
---

# Đồng bộ đề, code và Product Backlog

Ba nguồn, theo thứ tự ưu tiên:

1. **Đề** `docs/BrewLite-CongNghePhanMem-fixed.md`: §8 (10 task), §9 (Task 10, State Machine §9.1), §12 (API, 5 thực thể).
2. **Code** `backend/src`, `frontend/src`: làm đúng đề.
3. **Product Backlog** `docs/product-backlog.md` (10 user story US-01…US-10, tiêu chí chấp nhận và cột "Bằng chứng"), `docs/activity-diagrams.md` (AD1, AD2) và `docs/class-diagrams.md` (CD1–CD4): mô tả đúng code.

Code lệch đề thì sửa code. Backlog lệch code thì sửa backlog. Chưa rõ bên nào đúng thì hỏi người dùng trước khi sửa.

## Khi đổi hành vi

Hành vi là: endpoint, guard / vai trò, chuyển trạng thái, mã HTTP, thứ tự side effect (gọi Mock Gateway, ghi DB, transaction), câu thông báo giao diện mà tiêu chí chấp nhận trích. Trong cùng commit với code, cập nhật:

- tiêu chí chấp nhận của story liên quan trong `docs/product-backlog.md`;
- cột "Bằng chứng" (endpoint, file, tên test) nếu file hoặc test đổi tên hay bị xóa;
- `activity-diagrams.md` khi đổi nhánh rẽ, thứ tự bước hoặc endpoint trong luồng đặt món – thanh toán (AD1) hay luồng nhân viên xử lý hàng đợi (AD2);
- `class-diagrams.md` khi đổi `backend/prisma/schema.prisma`, `backend/src/contracts/*.ts`, hoặc chữ ký public của controller / service / repo;
- test chứng minh hành vi mới.

## Backlog khớp đề và code

- Chỉ có story nằm trong đề: US-*n* ứng 1–1 với Task *n* của đề §8. Cần thêm story thì hỏi người dùng trước.
- Mỗi tiêu chí chấp nhận phải kiểm chứng được (lệnh, endpoint, mã HTTP hoặc test). Tiêu chí lấy từ đề §4.1, §4.3, §8, §9; story thanh toán giữ nguyên văn đề §4.3.
- Mọi đường dẫn file và tên test trong cột "Bằng chứng" phải tồn tại. Grep lại sau khi đổi tên hoặc xóa.
- BARISTA và ADMIN dùng chung màn Quầy `/barista` (hàng đợi `GET /orders?status=`, tiến / hủy đơn `PATCH /orders/:id`; mở rộng đề §3.2, thuộc US-10). Tồn kho (`/admin/products`) chỉ qua API, chưa có màn Kho; thêm màn hình nhân viên khác thì hỏi người dùng trước. Nhóm kiểm API bằng Postman (`docs/postman/`). Không dùng Swagger để test hay làm minh chứng.
- Tham chiếu đề bằng số mục, ví dụ `đề §9.1`.

## Phạm vi

- Đúng 5 thực thể của đề §12.2. Cần thêm dữ liệu thì thêm cột và ghi chú như `User.role`.
- Mật khẩu chỉ ghi cho tài khoản demo của `backend/prisma/seed.ts`, luôn kèm chữ "demo" (seed đặt lại mật khẩu demo mỗi lần backend khởi động; đơn và tồn kho được giữ).
- Smoke test hoặc thử API trên DB compose: dùng tài khoản email `@smoke.test`, không dùng tài khoản demo; xong chạy `docker compose exec backend npm run smoke:clean`.

## Xong khi

- `cd backend && npx jest` và `cd frontend && npx vitest run` xanh. Schema Prisma đổi thì chạy `npx prisma generate` trong `backend/` trước.
- Mọi khối PlantUML đã sửa render được, không ra ảnh "Syntax Error".
- Grep tên hàm, endpoint, mã lỗi vừa đổi trong `docs/product-backlog.md` và `README.md`: không còn chỗ nào tả hành vi cũ.

Viết tiếng Việt, cùng văn phong các file trong `docs/`.

---
paths:
  - "backend/src/**"
  - "backend/prisma/**"
  - "frontend/src/**"
  - "docs/BrewLite-CongNghePhanMem-fixed.md"
  - "docs/use-case-specifications.md"
  - "docs/user-sequence-specifications.md"
  - "docs/activity-diagrams.md"
  - "docs/class-diagrams.md"
---

# Đồng bộ đề, code và tài liệu UC / sequence

Ba nguồn, theo thứ tự ưu tiên:

1. **Đề** `docs/BrewLite-CongNghePhanMem-fixed.md`: §8 (10 task), §9 (Task 10, State Machine §9.1), §12 (API, 5 thực thể).
2. **Code** `backend/src`, `frontend/src`: làm đúng đề.
3. **Tài liệu** `docs/use-case-specifications.md` (cột Trạng thái ở bảng §4), `docs/user-sequence-specifications.md` (sơ đồ §2.x, mục C, ma trận Phần III), `docs/activity-diagrams.md` (AD1, AD2) và `docs/class-diagrams.md` (CD1–CD4): mô tả đúng code.

Code lệch đề thì sửa code. Tài liệu lệch code thì sửa tài liệu. Chưa rõ bên nào đúng thì hỏi người dùng trước khi sửa.

## Khi đổi hành vi

Hành vi là: endpoint, guard / vai trò, chuyển trạng thái, mã HTTP, thứ tự side effect (gọi Mock Gateway, ghi DB, transaction), câu thông báo giao diện mà sơ đồ trích. Trong cùng commit với code, cập nhật:

- sơ đồ sequence của UC đó và mục C bên dưới sơ đồ;
- `activity-diagrams.md` khi đổi nhánh rẽ, thứ tự bước hoặc endpoint trong luồng đặt món – thanh toán (AD1) hay luồng quầy pha chế (AD2);
- `class-diagrams.md` khi đổi `backend/prisma/schema.prisma`, `backend/src/contracts/*.ts`, hoặc chữ ký public của controller / service / repo;
- dòng UC trong ma trận Phần III;
- cột Trạng thái ở bảng UC §4 khi UC đổi trạng thái;
- test chứng minh hành vi mới.

## Sơ đồ khớp code

- Bước đi đúng thứ tự gọi trong code, kể cả thứ tự kiểm (ví dụ `POST /payments`: guard → validate → khóa → chủ đơn → cache → kiểm trạng thái → charge).
- Mỗi lỗi người dùng gặp được qua giao diện là một nhánh `alt` / `else` có mã HTTP. Lỗi chỉ gặp khi gọi API tay (DTO sai, thiếu header) ghi bằng `note` kèm mã HTTP.
- `group` transaction chỉ bao các lệnh ghi DB nằm trong cùng một `runInTransaction`. Lời gọi Mock Gateway (charge, refund) vẽ bên ngoài `group`, ghi chữ "ngoài transaction".
- Giới hạn có chủ đích (comment `ponytail:` trong code) ghi ở mục C của UC.
- Tham chiếu đề bằng số mục, ví dụ `đề §9.1`.
- `node scripts/check-sequence-activation.mjs docs/user-sequence-specifications.md` ra `0 activation, 0 dài, 0 giọng`: mọi mũi tên đi ra từ vạch kích hoạt, nhãn tối đa 2 dòng × 90 ký tự (chi tiết để ở `note`), không dùng "nhé" / "giúp" / "Tôi…".

## Phạm vi

- Đúng 5 thực thể của đề §12.2. Cần thêm dữ liệu thì thêm cột và ghi chú như `User.role`.
- Sơ đồ sequence và dòng Phần III chỉ dành cho UC đã hiện thực. UC13, UC15 (backlog) chỉ có trên biểu đồ Bản 1 và bảng §4.
- Mật khẩu chỉ ghi cho tài khoản demo của `backend/prisma/seed.ts`, luôn kèm chữ "demo" (seed đặt lại mật khẩu demo mỗi lần backend khởi động; đơn và tồn kho được giữ).
- Smoke test hoặc thử API trên DB compose: dùng tài khoản email `@smoke.test`, không dùng tài khoản demo; xong chạy `docker compose exec backend npm run smoke:clean`.

## Xong khi

- `cd backend && npx jest` và `cd frontend && npx vitest run` xanh. Schema Prisma đổi thì chạy `npx prisma generate` trong `backend/` trước.
- Mọi khối PlantUML đã sửa render được, không ra ảnh "Syntax Error".
- Grep tên hàm, endpoint, mã lỗi vừa đổi trong các file tài liệu ở mục 3: không còn chỗ nào tả hành vi cũ.

Viết tiếng Việt, cùng văn phong các file trong `docs/`.

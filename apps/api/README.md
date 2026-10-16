# apps/api — NestJS + PostgreSQL

> Thư mục này **chưa có code**. Giảng viên cấm vibecoding: code ở Task 4 và Task 5 do nhóm viết; agent AI chỉ viết code vào `apps/` khi người dùng yêu cầu rõ (xem `.claude/rules/doc-code-sync.md`).

Đề A2 yêu cầu backend dùng **NestJS**, dữ liệu lưu trong **PostgreSQL** (đề A2 §1.1).

## Nhóm phải nộp ở đây

Task 4.3 (Sprint 1, đề A2 §6.3):
- `GET /products` và `GET /products/:id`;
- migration và seed để tái tạo database;
- test API (gợi ý Jest + supertest).

Task 5.1 (Sprint 2, đề A2 §7.1):
- đăng ký, đăng nhập, JWT và guard;
- tạo đơn hàng với validate;
- thanh toán Ví/Thẻ mô phỏng;
- trạng thái đơn và lịch sử đơn; khách hủy đơn chưa thanh toán (FR-25) là Could, tùy chọn nếu còn thời gian;
- Barista đổi trạng thái qua `GET /orders/:id`, `PATCH /orders/:id`, kèm Postman collection và hướng dẫn chạy (FR-24, AC-F24.4);
- 7 lớp domain theo class diagram: `User`, `Product`, `Order`, `OrderItem`, `Payment`, `Promotion`, `LoyaltyTransaction` (đề A2 §4.3); `Promotion` và `LoyaltyTransaction` chưa cần luồng runtime (FR-17/18 ngoài bản nộp).

Task 5.2 và 5.3:
- unit test cho nghiệp vụ quan trọng (state machine, tính giá);
- integration test cho tạo đơn và thanh toán;
- `GET /health`;
- log dạng JSON, cấu hình qua biến môi trường;
- `Dockerfile` để build image đẩy lên container registry;
- migration chạy an toàn khi deploy (chỉ migration cộng thêm).

## Ràng buộc

- Cấu trúc module theo domain, thống nhất với `docs/architecture/architecture.md`.
- Mỗi endpoint truy vết được tới `FR-xx` trong `docs/requirements/srs.md` và ghi vào `docs/traceability-matrix.md`.
- Mỗi thay đổi đi qua nhánh `a2/task-<n>-<tên>` và pull request vào `develop-Assignment2`.
- Kế hoạch chi tiết: `docs/planning/2026-10-15-assignment2-plan.md`.

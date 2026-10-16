# apps/web — Next.js mobile-first / PWA

> Thư mục này **chưa có code**. Giảng viên cấm vibecoding: code ở Task 4 và Task 5 do nhóm viết; agent AI chỉ viết code vào `apps/` khi người dùng yêu cầu rõ (xem `.claude/rules/doc-code-sync.md`).

Đề A2 yêu cầu frontend dùng **Next.js**, mobile-first / PWA (đề A2 §1.1).

## Nhóm phải nộp ở đây

Task 4.3 (Sprint 1, đề A2 §6.3):
- màn hình menu mobile-first, gọi `GET /products` của `apps/api`;
- trạng thái loading, empty và error;
- test component hoặc luồng chính (gợi ý Vitest + Testing Library);
- `.env.example` (hoặc dùng `.env.example` ở gốc) nêu `NEXT_PUBLIC_API_URL`.

Task 5.1 (Sprint 2, đề A2 §7.1):
- chi tiết sản phẩm, chọn size và topping;
- giỏ hàng và tính tổng tiền;
- đăng ký, đăng nhập, lưu JWT;
- tạo đơn, thanh toán Ví/Thẻ mô phỏng;
- màn xác nhận, trạng thái và lịch sử đơn;
- validate và xử lý lỗi ở frontend;
- web app manifest cho PWA (NFR-10; không cần service worker).

Task 5.2 và 5.3:
- `Dockerfile` nếu chạy web trong `docker-compose.yml` local;
- cấu hình deploy production (nền tảng nhóm chọn trong ADR 004).

## Ràng buộc

- Mỗi thay đổi đi qua nhánh `a2/task-<n>-<tên>` và pull request vào `develop-Assignment2`.
- Mỗi chức năng phải truy vết được tới mã `FR-xx` trong `docs/requirements/srs.md` và ghi vào `docs/traceability-matrix.md`.
- Kế hoạch chi tiết: `docs/planning/2026-10-15-assignment2-plan.md`.

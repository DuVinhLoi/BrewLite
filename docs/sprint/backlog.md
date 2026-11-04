# Product Backlog — Assignment 2

Backlog lưu trong repository cho đề A2 §6.1. Ngày cập nhật: 2026-10-21. Trạng thái phản ánh checkout `a2/Task4`, không thay cho nghiệm thu Sprint hoặc lịch sử PR. Nhóm chưa cung cấp phân công cá nhân/ngày Sprint hoặc URL GitHub Projects; các item bên dưới chưa được gán cá nhân trong hồ sơ này.

## Sprint 1 — xem menu và nền tảng kỹ thuật

| ID | Hạng mục | Truy vết | Trạng thái / điều kiện hoàn tất |
|---|---|---|---|
| A2-1 | Chốt yêu cầu minimum | Task 1, FR/NFR trong SRS | Đã có baseline qua PR #5, commit `0130ae0` |
| A2-2 | Activity, sequence, class diagram | Task 2, đề §4 | Đã có source/ảnh từ base qua PR #7/#8; đã đồng bộ vào Task 4, chưa rà lại toàn bộ nội dung trong phiên kiểm CI |
| A2-3 | Kiến trúc, ADR, deployment diagram | Task 3, đề §5 | Chưa có tạo phẩm bắt buộc trong checkout |
| A2-4.1 | Setup repo, README/env, branch/PR, DoD, backlog | Task 4.1, NFR-07 | Có tạo phẩm trên draft PR #9; chờ review/nghiệm thu và cấu hình protection |
| A2-4.2 | Quản lý tài liệu qua PR | Task 4.2 | Task 1–2 đã có; chờ Task 3 và review |
| A2-4.3a | API menu/chi tiết, migration, seed 8 món | Task 4.3, FR-01/03, NFR-16 | Có source, test/build local và CI xanh PR #9; chờ Task 3, review/nghiệm thu DB |
| A2-4.3b | Menu mobile, loading/empty/error | Task 4.3, FR-01/02, NFR-09/11 | Có source và test component; chờ review/nghiệm thu thiết bị |
| A2-4.4 | CI hai app, required check, chứng cứ xanh/đỏ | Task 4.4, NFR-17 | [Đã có PR #9 xanh, #10 đỏ đã đóng và log GitHub](../evidence/ci/github-runs.md); chưa đạt chặn merge, cần chủ repo xử lý giới hạn gói và bật required `ci` |
| A2-S1 | Review/Retrospective và tag `a2-v0.1.0` | Kế hoạch B.3/B.5 | Chưa thực hiện; chỉ tạo tag sau khi chấp nhận Sprint 1 |

## Sprint 2 — luồng đặt hàng và bàn giao

| ID | Hạng mục | Truy vết | Trạng thái / phụ thuộc |
|---|---|---|---|
| A2-5.1a | Chi tiết UI, size/topping, giỏ hàng | FR-03–07 | Chưa làm; dùng API chi tiết Sprint 1 |
| A2-5.1b | Đăng ký/đăng nhập, JWT/guard, demo users | FR-08–10, NFR-04/05/16 | Chưa làm; cần hợp đồng Task 2–3 |
| A2-5.1c | Tạo đơn, validate, trừ/hoàn tồn kho | FR-11–13/25, NFR-06/13 | Chưa làm; cần auth và mô hình Order/OrderItem |
| A2-5.1d | Thanh toán mô phỏng, idempotency, retry | FR-14–16 | Chưa làm; cần tạo đơn |
| A2-5.1e | Xác nhận, lịch sử, trạng thái, API Barista | FR-20–24 | Chưa làm; cần đơn/thanh toán |
| A2-5.2 | Unit/integration/E2E, Docker Compose, health | Task 5.2, NFR-14–16 | Chưa làm; cần luồng đặt hàng |
| A2-5.3 | CD, image, production, smoke, rollback | Task 5.3, NFR-08/18 | Chưa làm; cần quality gate và nền tảng đã chốt |
| A2-5.4 | URL HTTPS, release/demo, tài liệu bàn giao, review/retro | Task 5.4, NFR-19 | Chưa làm; cần production chạy thật |

FR-17/18/19/26/27 và FR-28–32 ngoài phạm vi minimum theo SRS; không đưa tính năng mở rộng vào Sprint 2 khi chưa được nhóm chốt lại. Mỗi PR cập nhật item liên quan, lý do thay đổi, ma trận và bằng chứng kiểm.

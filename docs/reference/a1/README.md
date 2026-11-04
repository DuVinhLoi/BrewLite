# Tài liệu tham khảo từ Assignment 1

Hai file trong thư mục này mô tả **code Assignment 1 (A1)** nằm ở nhánh `develop`, gồm `backend/` (NestJS) và `frontend/` (Next.js). Nhánh `develop-Assignment2` đã xóa phần code đó (lịch sử git vẫn giữ, xem `git show develop:backend/...`).

| File | Nội dung | Dùng làm đầu vào cho |
|---|---|---|
| `use-case-specifications.md` | Actor, sơ đồ use-case Bản 1 (toàn hệ thống) và Bản 2 (phân hệ Khách hàng), bảng UC01–UC16 | Task 1: `docs/requirements/use-case-overview`, `docs/requirements/uc-checkout.md` |
| `user-sequence-specifications.md` | Sequence PlantUML UC01–UC16, đặc biệt §2.4 (tạo đơn, thanh toán, mã giảm giá) và §2.5 (hủy đơn, sơ đồ trạng thái đơn) | Task 2: `docs/diagrams/sequence-checkout`, `activity-checkout`, `state-order` |

## Quy tắc dùng

- Đây là **đầu vào tham khảo**, không phải tạo phẩm nộp bài của A2. Đề A2 §3–§5 yêu cầu nhóm tự phân tích, tự vẽ, tự giải thích được.
- Không chép nguyên sơ đồ. A2 có thiết kế riêng (7 lớp domain gồm `Promotion` và `LoyaltyTransaction`, lifeline theo đề A2 §4.2, kiến trúc `apps/web` + `apps/api`). Xem bảng khác biệt A1 và A2 trong `docs/planning/2026-10-15-assignment2-plan.md`, mục D.
- Hai file được giữ nguyên nội dung gốc. Các đường dẫn như `backend/src/...`, `frontend/src/...`, `docs/use-case-specifications.md` trong đó là đường dẫn **trên nhánh `develop`**, không tồn tại ở nhánh này.
- Phần Barista/Admin (UC08–UC14) là mở rộng của A1, nằm ngoài scope A2 theo plan. Chỉ đọc để hiểu State Machine đơn hàng.

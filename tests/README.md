# tests — Integration và End-to-End

Thư mục này **chưa có test**. Nhóm tự viết ở Task 5.2 (đề A2 §7.2). Unit test nằm cạnh code trong `apps/web` và `apps/api`; thư mục này chứa test xuyên nhiều thành phần.

## Nhóm phải nộp ở đây

| Loại | Phạm vi | Ghi chú |
|---|---|---|
| Integration | API tạo đơn (`POST /orders`) và thanh toán (`POST /payments`) | Chạy với PostgreSQL thật (service container trong CI, hoặc `docker-compose.yml` local) |
| End-to-End | Ít nhất một luồng từ menu đến xác nhận đơn | Gợi ý Playwright |

Mã test (ví dụ `API-T01`, `INT-T03`, `E2E-T01`) phải khớp cột Test trong `docs/traceability-matrix.md` (đề A2 §8.1).

Cách chạy test phải có trong `README.md` gốc (đề A2 §7.4).

Hướng dẫn từng bước: `docs/planning/2026-10-15-assignment2-plan.md`, Task 5.2.

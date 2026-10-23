# ADR-001: Một repo duy nhất cho web và API

- Trạng thái: Accepted (2026-10-21)
- Liên quan: A2 §5.1, NFR-17, NFR-18

## Bối cảnh

BrewLite là một hệ thống nhỏ, có phạm vi thực thi rõ ràng: giao diện người dùng, API, dữ liệu và deployment. Nhóm cần làm việc đồng bộ nhưng vẫn giữ sự rõ ràng về trách nhiệm và dễ truy vết khi đánh giá.

## Quyết định

Duy trì một repository duy nhất, chia theo phần `apps/web`, `apps/api`, `docs/`, `tests/` và cấu hình chung như `docker-compose.yml`, `.env.example`, `.github/workflows/`.

## Hệ quả

### Ưu điểm
- Dễ chia tay công việc giữa frontend/backend trong cùng một repo.
- Chia module rõ ràng, không cần multi-repo management.
- Dễ gắn liên kết docs ↔ code ↔ deployment trong traceability matrix.

### Hạn chế
- Repo lớn hơn và cần có quy tắc rõ ràng về không gian làm việc.
- Team cần thận trọng với việc mix code và document trong cùng nhánh.

## Phương án đã loại

- Tạo repo riêng cho frontend và backend: tăng độ phức tạp trong review và quản lý CI/CD.
- Sử dụng monorepo không có cấu trúc rõ ràng: khó duy trì và khó traceability.

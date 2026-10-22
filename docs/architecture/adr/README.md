# ADR index

Thư mục này chứa các Architecture Decision Records (ADR) của Task 3, được đồng bộ với lịch sử chung của nhánh `develop-Assignment2` và đã được cập nhật ngày `2026-10-21`.

## Danh sách ADR

| File | Nội dung | Trạng thái |
|---|---|---|
| `001-monorepo.md` | Một repo duy nhất cho web và API | Accepted |
| `002-layered-nestjs.md` | NestJS chia theo module và lớp service/repository | Accepted |
| `003-containerization.md` | Container hóa với PostgreSQL và môi trường dev/test | Accepted |
| `004-vercel-render.md` | Triển khai production trên Vercel và Render | Accepted |
| `005-idempotency-and-optimistic-lock.md` | Idempotency-Key và chống bán vượt tồn kho | Accepted |

## Nguyên tắc

- Mỗi ADR phải ghi rõ: bối cảnh, quyết định, hệ quả, phương án đã loại bỏ.
- Không xóa ADR cũ nếu có quyết định mới thay thế; thêm ADR mới và ghi rõ trạng thái.
- Chỉ các thay đổi liên quan đến kiến trúc mới được phép nằm trong thư mục này.

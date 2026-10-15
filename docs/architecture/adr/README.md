# docs/architecture/adr — Architecture Decision Records

Thư mục này **chưa có ADR**. Đề A2 §5.1: mỗi quyết định kiến trúc quan trọng ghi thành một ADR ngắn.

## Đặt tên và mẫu

- Tên file: `NNN-ten-quyet-dinh.md`, đánh số tăng dần (ví dụ `001-monorepo.md`).
- Mỗi ADR gồm: Trạng thái (Proposed / Accepted / Superseded), Bối cảnh, Quyết định, Các phương án đã cân nhắc, Hệ quả (ưu điểm, hạn chế, trade-off).
- Đổi quyết định thì thêm ADR mới và đánh dấu ADR cũ là Superseded, không xóa.
- Mọi thay đổi ADR đi qua pull request, nêu lý do trong mô tả PR (đề A2 §6.2).

## ADR đề xuất (nhóm tự viết và tự chốt)

| File | Quyết định |
|---|---|
| `001-monorepo.md` | Một repo, `apps/web` + `apps/api` |
| `002-layered-nestjs.md` | NestJS chia module theo domain, phân lớp controller / service / repository |
| `003-prisma-migrations.md` | ORM và cách quản lý migration, seed |
| `004-hosting-vercel-render.md` | Nền tảng production, rủi ro đã biết |
| `005-idempotency-and-optimistic-lock.md` | Idempotency-Key cho thanh toán, khóa lạc quan cho tồn kho |

Nội dung gợi ý cho từng ADR: `docs/planning/2026-10-15-assignment2-plan.md`, Task 3.

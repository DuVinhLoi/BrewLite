# ADR index

ADR của Task 3 (đề A2 §5.1), đồng bộ với SRS sau PR #11 và handoff D2/D3.

## Danh sách ADR

| File | Quyết định | Trạng thái |
|---|---|---|
| [001-monorepo.md](001-monorepo.md) | Một repo cho web, API và docs | Accepted (2026-10-21) |
| [002-layered-nestjs.md](002-layered-nestjs.md) | NestJS chia domain, controller/service và truy cập dữ liệu | Accepted (2026-10-21) |
| [003-containerization.md](003-containerization.md) | Compose/Postgres, Prisma migration lúc khởi động, seed tái tạo được | Accepted (2026-10-21) |
| [004-vercel-render.md](004-vercel-render.md) | Vercel + Render + GHCR, internal DB, health, smoke ≤10 phút và rollback image/web trước | Accepted (2026-10-21) |
| [005-idempotency-and-optimistic-lock.md](005-idempotency-and-optimistic-lock.md) | API replay theo BR-05/D2/D3; simulator không lưu trạng thái; transaction giữ kho | Accepted (2026-10-21) |

| [006-ingredient-inventory-snapshots.md](006-ingredient-inventory-snapshots.md) | Số dư nguyên liệu, snapshot bất biến, marker legacy và cutover additive; thay phần kho mới của ADR-005 §C | Accepted (2026-10-29) |

Giữ tên file 003/004 hiện có trên nhánh để liên kết không đổi. Mỗi ADR gồm bối cảnh, quyết định, hệ quả và phương án đã loại. Khi quyết định thay đổi, ghi lý do và ngày thay đổi qua PR.

D3 được chốt 2026-10-22; ADR-005 ghi bổ sung ngày này ở dòng Liên quan. Các thay đổi tại đây là thiết kế cho Task 4/5, không thay thế minh chứng kiểm thử runtime.

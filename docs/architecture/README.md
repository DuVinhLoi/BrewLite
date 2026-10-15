# docs/architecture — Task 3: Thiết kế kiến trúc

Thư mục này **chưa có nội dung**. Nhóm tự viết (đề A2 §5).

## Nhóm phải nộp ở đây

| File | Nội dung | Đề A2 |
|---|---|---|
| `architecture.md` | Kiến trúc theo C4 (mức 1-2) hoặc phân lớp: frontend Next.js/PWA, backend NestJS theo module/domain, PostgreSQL và migration, thanh toán mô phỏng, logging, health check, cấu hình; lý do chọn, ưu điểm, hạn chế, trade-off | §5.1 |
| `adr/` | Mỗi quyết định quan trọng một ADR ngắn, ví dụ `001-monorepo.md` (xem `adr/README.md`) | §5.1 |
| `deployment.puml` và `.svg` | UML deployment diagram cho production | §5.2 |

Deployment diagram tối thiểu thể hiện: thiết bị người dùng (trình duyệt/PWA), dịch vụ/CDN phục vụ Next.js, container/dịch vụ chạy NestJS API, PostgreSQL có persistent storage, container registry và nền tảng triển khai, HTTPS và kết nối nội bộ và cổng, secret/biến môi trường, health check và log, ranh giới local / CI / production.

`docs/deployment.md` (hướng dẫn triển khai và rollback, đề A2 §9) nằm ở `docs/`, không nằm trong thư mục này.

## Tiêu chí nghiệm thu (đề A2 §5.2)

Mỗi container/dịch vụ trong deployment diagram truy vết được tới một thành phần trong `architecture.md` và tới mã nguồn (`apps/web`, `apps/api`, `docker-compose.yml`, `.github/workflows`). Sơ đồ phải phản ánh đúng nền tảng thực tế nhóm dùng, không phải sơ đồ lý thuyết.

Hướng dẫn từng bước: `docs/planning/2026-10-15-assignment2-plan.md`, Task 3.

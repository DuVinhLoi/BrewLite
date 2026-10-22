# docs/architecture — Task 3: Thiết kế kiến trúc

> Đã đối chiếu SRS sau PR #11 (2026-10-21).

Thư mục này chứa kiến trúc tổng thể cho BrewLite Assignment 2, bao gồm:

- `architecture.md`: tổng quan kiến trúc hệ thống theo phân lớp và deployment view
- `adr/`: các quyết định kiến trúc quan trọng dưới dạng ADR
- `deployment.puml`: sơ đồ triển khai production-style

## Cấu trúc

| File | Nội dung |
|---|---|
| `architecture.md` | Kiến trúc hệ thống, module, luồng dữ liệu, chất lượng dịch vụ |
| `adr/001-monorepo.md` | Một repo duy nhất cho web + api |
| `adr/002-layered-nestjs.md` | Kiến trúc NestJS theo lớp domain |
| `adr/003-containerization.md` | Docker, PostgreSQL, môi trường phát triển và triển khai |
| `adr/004-vercel-render.md` | Nền tảng production: Vercel + Render |
| `adr/005-idempotency-and-optimistic-lock.md` | Idempotency và chống bán vượt tồn kho |
| `deployment.puml` | Sơ đồ triển khai container / service |

## Mục tiêu

- Giữ ngành nghiệp vụ BrewLite rõ ràng: menu → giỏ hàng → đặt đơn → thanh toán → xác nhận đơn → lịch sử đơn.
- Tách biệt rõ frontend, backend, dữ liệu, CI/CD.
- Duy trì tính hợp nhất giữa kiến trúc, ADR và ma trận truy vết trong `docs/traceability-matrix.md`.
- Tránh rủi ro API dừng giữa bước 13–14 của UC-04 (đặt hàng và thanh toán): replay theo idempotency-key, không lưu trạng thái phi pháp ở simulator.

## Tiêu chí duy trì

- Mỗi container hoặc service trong deployment diagram phải truy vết tới một thành phần trong `architecture.md` và tới mã nguồn tương ứng.
- Mỗi ADR phải có trạng thái rõ ràng, bối cảnh, quyết định, hệ quả.
- `GET /health` kiểm tra kết nối DB và trả `200`/`503` khi hệ thống đủ khả năng phục vụ.
- Không phát sinh biến môi trường mang tính ẩn hoặc không rõ truy vết như `APP_VERSION` trong repo.

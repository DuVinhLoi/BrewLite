# docs/architecture — Task 3: Thiết kế kiến trúc

> Đã đối chiếu SRS sau PR #11 (2026-10-21), D2/D3; cập nhật 2026-10-22.

Task 3 gồm `architecture.md`, `adr/` và `deployment.puml`/`.svg`, đáp ứng đề A2 §5.1–5.2.

| File | Nội dung |
|---|---|
| [architecture.md](architecture.md) | Kiến trúc phân lớp, container/module, NFR, cấu hình, trade-off và ánh xạ 19 NFR cho B10 |
| [adr/001-monorepo.md](adr/001-monorepo.md) | Monorepo web/API/docs |
| [adr/002-layered-nestjs.md](adr/002-layered-nestjs.md) | NestJS theo domain và lớp |
| [adr/003-containerization.md](adr/003-containerization.md) | Compose/Postgres, Prisma migration khi startup, seed |
| [adr/004-vercel-render.md](adr/004-vercel-render.md) | Vercel + Render + GHCR, secret, health, smoke và rollback |
| [adr/005-idempotency-and-optimistic-lock.md](adr/005-idempotency-and-optimistic-lock.md) | Replay tại API theo BR-05/D2/D3, transaction và giữ tồn kho |
| [deployment.puml](deployment.puml) | Deployment-01: nguồn UML với local, CI, production |
| [deployment.svg](deployment.svg) | Deployment-01: SVG do PlantUML 1.2026.8 render |

## Quy ước duy trì

- [SRS](../requirements/srs.md) và [handoff](../planning/handoff/2026-10-21-req-sync/README.md) là nguồn contract. Các quyết định có trạng thái Accepted (2026-10-21).
- Health trả `{status, database}`; CD smoke `/health`, `/products` và web, mỗi bước retry tối đa 10 phút.
- API dừng giữa bước 13 và 14 của UC-04 là rủi ro chấp nhận vì thanh toán chỉ mô phỏng; không cam kết xử lý khoảng dừng này.
- Task 4/5 hiện thực code và minh chứng vận hành. §3 của architecture.md ánh xạ từng thành phần với vị trí mã nguồn dự kiến.
- Ma trận nằm ngoài PR này. B10 dùng bảng §8 của architecture.md trong PR riêng sau T2-M.
- Kết quả kiểm Task 3 nằm trong [report](../planning/handoff/2026-10-21-req-sync/report-task3.md).

## Render Deployment-01

Dùng JAR từ [release PlantUML 1.2026.8](https://github.com/plantuml/plantuml/releases/tag/v1.2026.8), đặt ngoài repository. Từ repo root, thay hai đường dẫn tạm bằng đường dẫn tuyệt đối:

```text
java -jar <temp>/plantuml-1.2026.8.jar -charset UTF-8 -checkonly docs/architecture/deployment.puml
java -jar <temp>/plantuml-1.2026.8.jar -charset UTF-8 -tsvg -o <temp>/rendered docs/architecture/deployment.puml
```

Kiểm SVG là XML hợp lệ, có `data-diagram-type=` hoặc metadata PlantUML, không có `Syntax Error`; mở ảnh kiểm các node, nhãn và mũi tên trước khi chép vào `docs/architecture/deployment.svg`.

SVG lưu trong repo được xuống dòng giữa các XML tag (không đổi thuộc tính/hình học). Cách này giúp review diff và tránh cổng B8 khớp nhầm thuộc tính phiên bản XML với nhãn image trên cùng một dòng SVG.

Một dấu thập phân trong tọa độ dùng XML character reference để tránh trùng mẫu mã AC cũ. Kiểm tra XML xác nhận mọi thuộc tính, chữ và hình học sau parse giống hệt đầu ra PlantUML gốc.

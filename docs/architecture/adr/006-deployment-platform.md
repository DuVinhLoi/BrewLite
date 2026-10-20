# ADR-006: Nền tảng triển khai và container registry

- **Trạng thái:** Đề xuất (nhóm chốt)
- **Ngày:** 2026-10-20

## Bối cảnh
Đề cho phép Render, Railway, Fly.io, Azure, AWS, VPS…; deployment diagram phải khớp nền tảng thực tế.

## Quyết định
**Đề xuất (nhóm phải xác nhận):** GitHub Actions build image Docker, tag bằng commit SHA, đẩy lên GitHub Container Registry; Render chạy web và api từ image, PostgreSQL managed có persistent disk, DB không public. Nếu nhóm dùng nền tảng khác, sửa ADR này và `docs/diagrams/deployment.mmd` cho khớp.

## Hệ quả
- Ưu điểm: HTTPS tự động, health check và log có sẵn, ít việc vận hành.
- Hạn chế/trade-off: Phụ thuộc nhà cung cấp; gói miễn phí có thể ngủ đông gây chậm lần gọi đầu, ảnh hưởng smoke test.

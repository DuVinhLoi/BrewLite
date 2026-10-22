# ADR-003: Container hóa với PostgreSQL và môi trường phát triển

- Trạng thái: Accepted (2026-10-21)
- Liên quan: A2 §5.2, NFR-15, NFR-16, NFR-17

## Bối cảnh

Hệ thống cần chạy trên môi trường đồng nhất giữa máy cá nhân, CI/CD và production, đồng thời hỗ trợ PostgreSQL thực tế thay vì mock DB để test integration.

## Quyết định

Dùng Docker Compose để chạy đồng thời:

- `frontend`: Next.js/PWA
- `backend`: NestJS API
- `db`: PostgreSQL
- cấu hình nút `health` kiểm tra DB và service status

Migration chạy trong bước khởi động service container, ví dụ:

```bash
npx prisma migrate deploy && node dist/main.js
```

## Hệ quả

### Ưu điểm
- Môi trường ổn định giữa local và CI.
- Dễ chạy smoke test trên `GET /health`.
- Chạy integration test với PostgreSQL thật hơn là fake DB.

### Hạn chế
- Tăng độ phức tạp khởi động local.
- Cần kiểm tra rõ timing của migration và startup service.

## Phương án đã loại

- Chạy backend local trên SQLite/hệ thống cục bộ: không phản ánh môi trường production.
- Chạy PostgreSQL ngoài Docker: khó đồng bộ trong CI và cả nhóm.

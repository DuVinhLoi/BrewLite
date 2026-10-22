# ADR-003: Container hóa với PostgreSQL và môi trường phát triển

- Trạng thái: Accepted (2026-10-21)
- Liên quan: A2 §5.1–5.2, NFR-14, NFR-15, NFR-16, NFR-17

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

Prisma migration có phiên bản trong repo; khi phát hành chỉ thêm bảng/cột, không xóa hoặc đổi tên cột để image trước vẫn tương thích khi rollback. Migration lỗi thì container không chạy API. CI kiểm migration trên Postgres tạm, không truy cập DB production.

Seed chạy có chủ đích khi khởi tạo DB, tái tạo đúng SRS §3.3 (8 sản phẩm, size/topping, 2 tài khoản demo; không seed khuyến mãi). Chạy lần hai không thêm bản ghi trùng. Không seed lại mỗi lần production restart. DB local dùng named volume để dữ liệu còn sau `docker compose down` rồi `up` (không dùng `-v`); production dùng persistent storage của Render Postgres (ADR-004).

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

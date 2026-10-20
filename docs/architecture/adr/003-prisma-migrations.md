# ADR-003: Prisma cho ORM, migration cộng thêm và seed tái tạo được

- **Trạng thái:** Đề xuất (nhóm chốt qua PR)
- **Ngày:** 2026-10-20
- **Liên quan:** đề A2 §7.2, §7.3 (yêu cầu 5)

## Bối cảnh
Đề yêu cầu "migration/seed có thể tái tạo database" (§7.2) và "chạy migration theo cách an toàn" khi deploy (§7.3).

## Quyết định
- ORM và migration: **Prisma** (`prisma migrate`). Nhóm có thể thay bằng TypeORM nhưng phải sửa ADR này.
- Seed dữ liệu mẫu là script riêng, chạy được trên DB trống và cho cùng một kết quả.
- Khi deploy: chạy `prisma migrate deploy` trong lệnh khởi động container.
- **Chỉ dùng migration cộng thêm** (thêm bảng, thêm cột nullable); không xóa hoặc đổi tên cột trong cùng lần phát hành, để rollback về image cũ vẫn chạy được với schema mới.
- Thay đổi phá hủy được tách làm hai lần phát hành và thử trên bản sao DB trước.

## Hệ quả
- Ưu điểm: DB dựng lại từ đầu bằng `migrate` + seed; rollback image không cần đổi DB.
- Hạn chế: sửa schema phải chia nhỏ; migration lỗi có thể chặn deploy (khi đó cần khôi phục từ backup, nêu giới hạn của gói free trong `docs/deployment.md`).
- Phương án đã loại: `prisma db push` ở production (không có lịch sử).

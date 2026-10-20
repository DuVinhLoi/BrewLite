# ADR-003: PostgreSQL và migration có kiểm soát phiên bản

- **Trạng thái:** Đề xuất (nhóm chốt)
- **Ngày:** 2026-10-20

## Bối cảnh
Đơn hàng, thanh toán, tồn kho cần tính nhất quán; đề bắt buộc PostgreSQL và yêu cầu migration/seed tái tạo được (Task 5.2).

## Quyết định
PostgreSQL; mọi thay đổi schema bằng file migration trong repo (ORM *(đề xuất)*: TypeORM hoặc Prisma — nhóm chọn một); seed dữ liệu mẫu riêng; CD chạy migration trước khi chuyển traffic.

## Hệ quả
- Ưu điểm: Có transaction, ràng buộc toàn vẹn; database dựng lại được từ đầu.
- Hạn chế/trade-off: Migration lỗi có thể chặn deploy; cần kế hoạch rollback (migration down hoặc backup).

# ADR-002: Backend NestJS phân lớp, chia module theo domain

- **Trạng thái:** Đề xuất (nhóm chốt qua PR)
- **Ngày:** 2026-10-20
- **Liên quan:** đề A2 §5.1

## Bối cảnh
MVP nhỏ, nhóm ít người, hai Sprint. Luồng đặt đơn cần transaction (tạo đơn + trừ tồn kho) và sơ đồ sequence có lifeline NestJS API và Payment Service.

## Quyết định
- Một ứng dụng NestJS (modular monolith), không tách microservice.
- Module theo domain: `auth`, `catalog`, `orders`, `payments`, `health` (nhóm chốt danh sách cuối).
- Phân lớp trong mỗi module: controller → service → truy cập dữ liệu (Prisma). Controller không gọi DB trực tiếp; DTO được validate ở biên.
- **Payment mô phỏng là module `payments` trong API**, đặt sau một interface để sau này thay bằng cổng thật. Trên sơ đồ sequence vẫn vẽ là lifeline Payment Service riêng.

## Hệ quả
- Ưu điểm: triển khai và debug đơn giản; transaction đơn/tồn kho nằm trong một tiến trình; ít hạ tầng cho free tier.
- Hạn chế: không scale riêng từng module; phải giữ ranh giới module bằng kỷ luật code review.
- Phương án đã loại: microservice (quá nặng cho MVP); Payment mô phỏng là dịch vụ riêng (thêm một deploy, không đem lại giá trị cho đề).

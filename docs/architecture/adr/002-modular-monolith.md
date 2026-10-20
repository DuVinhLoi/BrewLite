# ADR-002: Backend NestJS dạng modular monolith

- **Trạng thái:** Đề xuất (nhóm chốt)
- **Ngày:** 2026-10-20

## Bối cảnh
MVP nhỏ, nhóm ít người, thời gian hai Sprint.

## Quyết định
Một ứng dụng NestJS chia module theo domain (auth, products, orders, payments, promotions, loyalty). Không tách microservice.

## Hệ quả
- Ưu điểm: Triển khai và debug đơn giản; transaction đơn hàng và tồn kho nằm trong một tiến trình.
- Hạn chế/trade-off: Khó scale riêng từng module; phải giữ ranh giới module để sau này có thể tách.

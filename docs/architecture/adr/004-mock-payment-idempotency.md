# ADR-004: Thanh toán mô phỏng là module nội bộ có idempotency

- **Trạng thái:** Đề xuất (nhóm chốt)
- **Ngày:** 2026-10-20

## Bối cảnh
Đề yêu cầu thanh toán Ví/Thẻ mô phỏng, xử lý thất bại và gửi lại yêu cầu (sequence diagram Task 2.2).

## Quyết định
Module `payments` đặt sau một interface `PaymentGateway`; client gửi `Idempotency-Key`, API lưu khóa cùng kết quả và trả lại kết quả cũ nếu gửi lại.

## Hệ quả
- Ưu điểm: Test được cả nhánh thành công và thất bại; thay bằng cổng thật sau này chỉ đổi implementation.
- Hạn chế/trade-off: Không phản ánh độ trễ/lỗi mạng thật; cần bảng hoặc cột lưu idempotency key.

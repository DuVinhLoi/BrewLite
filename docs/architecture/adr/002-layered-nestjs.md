# ADR-002: Kiến trúc NestJS theo lớp domain

- Trạng thái: Accepted (2026-10-21)
- Liên quan: A2 §5.1, FR-11–16, NFR-01, NFR-03, NFR-04, NFR-05, NFR-06, NFR-13

## Bối cảnh

API của BrewLite cần quản lý sản phẩm, đơn hàng, thanh toán và xác thực người dùng. Nhiệm vụ này yêu cầu module rõ, dễ test và dễ mở rộng khi thêm nghiệp vụ mới.

## Quyết định

Dùng NestJS theo phân lớp chuẩn:

- `controllers/`: nhận HTTP request
- `services/`: business logic và orchestration
- `repositories/` hoặc interface contract: truy cập dữ liệu
- `dto/`: request/response validation
- `modules/`: gom nhóm theo domain

## Hệ quả

### Ưu điểm
- Dễ đọc, dễ test, dễ thay đổi logic mà không lẫn giữa các domain.
- Có thể giữ seam để test thay thế repository bằng stub/Mock dễ dàng.
- Chuẩn hóa validation và transaction.

### Hạn chế
- Một số nghiệp vụ có thể cần nhiều tầng dữ liệu hơn mức tối thiểu.
- Đòi hỏi định nghĩa interface rõ ràng để tránh phụ thuộc ở layer sai.

## Phương án đã loại

- Kiến trúc MVC thuần túy không đủ cho nghiệp vụ thanh toán và idempotency.
- Đặt toàn bộ logic trong controller: bất lợi cho test và kiểm soát transaction.

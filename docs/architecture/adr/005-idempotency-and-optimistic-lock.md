# ADR-005: Idempotency thanh toán, lưu bền vững kết quả simulator và chống bán vượt tồn kho

- **Trạng thái:** Đề xuất (nhóm chốt qua PR)
- **Ngày:** 2026-10-20
- **Liên quan:** SRS 3.4 (đòi ADR này chốt nơi lưu và cách phục hồi), BR-03, BR-05, FR-11, FR-13 (AC-F13.3), FR-14..16 (AC-F16.1, 16.4, 16.5, 16.7), NFR-13; `sequence-checkout.puml` (T1, T2, E4a, E8b); `class-domain.puml`

## Bối cảnh
Client có thể gửi lại thanh toán; API có thể chết giữa lúc simulator đã thu tiền và lúc API commit `Payment`/`Order` (E8b). Đồng thời 10 yêu cầu đặt cùng món tồn 5 phải cho đúng 5 thành công, `stock` không âm (AC-F13.3).

## Quyết định
**A. Cache idempotency ở API (E4a, AC-F16.1).** Sau khi kiểm JWT, DTO và quyền sở hữu, API tìm `Payment` có `status = SUCCESS` của đúng người dùng/đơn/`idempotencyKey`/body; nếu có thì trả 200 kết quả gốc, không gọi simulator. Chỉ kết quả **thành công** được giữ; `FAILED` không khóa key (BR-05, AC-F16.5). Đơn đã `PAID` mà key mới thì 409 `ORDER_NOT_PAYABLE` (AC-F16.4). Dùng cột `Payment.idempotencyKey` sẵn có trong class diagram; thêm ràng buộc duy nhất để mỗi đơn chỉ có **một** `Payment SUCCESS` (ví dụ unique index một phần trên `orderId` khi `status = SUCCESS`).

**B. Simulator chống thu trùng theo `orderId`, lưu bền vững (SRS 3.4).** Kết quả thu thành công của simulator được ghi vào **một bảng trong PostgreSQL** riêng của simulator, khóa duy nhất theo `orderId` (lưu mã giao dịch mô phỏng, số tiền, phương thức). Gọi lại cùng `orderId` sau thành công trả kết quả gốc, không thu thêm, kể cả khi đổi phương thức; kết quả từ chối không được ghi nên không khóa `orderId`. Bảng này thuộc hạ tầng của Payment mô phỏng, **không** thuộc 7 lớp domain, và không dùng RAM nên sống qua restart.

**C. Phục hồi E8b (AC-F16.7).** Nếu API chết sau khi simulator thành công và trước commit T2: UI giữ cùng `orderId` và key, retry. API không thấy cache (đơn vẫn `PENDING`), gọi simulator với cùng `orderId`, nhận lại **kết quả thành công gốc**, rồi chạy T2 (chèn đúng một `Payment SUCCESS` và `Order PENDING → PAID` trong một transaction). Tổng số lần thu của `orderId` vẫn là 1.

**D. Tồn kho (BR-03, NFR-13).** Tạo `Order`, `OrderItem` và trừ tồn kho trong **một transaction** (T1). Mỗi dòng trừ bằng câu lệnh có điều kiện nguyên tử, dạng `UPDATE Product SET stock = stock - :n WHERE id = :id AND stock >= :n`; không đủ (0 dòng bị ảnh hưởng) thì rollback toàn bộ và trả 409 `OUT_OF_STOCK`. Xử lý các dòng theo thứ tự `productId` để tránh deadlock. Không thêm cột `version` vì class diagram không có.

## Hệ quả
- Ưu điểm: không thu hai lần; phục hồi được sau crash; không bán vượt tồn; test được (integration test dừng API ở khoảng giữa bước 13–14 của UC-04, rồi retry; test 10 yêu cầu đồng thời).
- Hạn chế: thêm bảng của simulator và một ràng buộc duy nhất; logic phục hồi phức tạp hơn.
- **Câu hỏi cho nhóm:** "cùng body" ở cache nghĩa là gì khi `cardNumber` không được lưu (SRS 3.4)? Đề xuất: so `orderId` + `paymentMethod`, vì `amount` luôn bằng `Order.total`; ghi vào SRS FR-16 nếu chốt.
- Phương án đã loại: chỉ chặn nút ở frontend (không đủ khi retry mạng); lưu kết quả simulator trong RAM (mất khi restart, vi phạm SRS 3.4); khóa lạc quan bằng cột `version` (lệch class diagram); khóa cả bảng tồn kho (chậm).

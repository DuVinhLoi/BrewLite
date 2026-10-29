# ADR-005: Idempotency thanh toán và chống bán vượt tồn kho

- Trạng thái: Accepted (2026-10-21)
- Liên quan: BR-03, BR-05, FR-13, FR-14–16, NFR-13; AC-F16.1, AC-F16.4, AC-F16.5; handoff D2/D3 (D3 chốt 2026-10-22)

## Bối cảnh

API cần xử lý retry thanh toán và nhiều yêu cầu đặt đơn đồng thời. API dừng giữa bước 13 và 14 của UC-04 là rủi ro chấp nhận vì Payment Service là mô phỏng, không thu tiền thật (SRS §3.4); đơn vẫn `PENDING` và khách có thể thanh toán lại.

## Quyết định

### A. Replay kết quả thành công tại API

- Kiểm JWT, vai trò Customer và chủ đơn trước khi tìm kết quả đã xử lý. Hai yêu cầu giống nhau khi cùng chủ đơn, `orderId`, `Idempotency-Key` và `paymentMethod` (BR-05, D2). `cardNumber` không lưu, không log và không dùng để so.
- Nếu đã có kết quả `SUCCESS` của cùng yêu cầu, trả 200 với `paymentId` và nội dung lần thành công trước, không gọi Payment Service, kể cả khi trạng thái đơn đã tiến tiếp. Kiểm replay trước khi xét đơn còn thanh toán được hay không (AC-F14.3).
- Cùng key nhưng khác `paymentMethod` sau khi đơn đã `PAID` là yêu cầu mới: trả 409 `ORDER_NOT_PAYABLE`, không gọi Payment Service (AC-F16.1). Key mới trên đơn đã trả cũng nhận lỗi này (AC-F16.4).
- Cùng key dùng cho đơn khác là yêu cầu mới (D3): đơn `PENDING`/`PAYMENT_FAILED` được thanh toán bình thường; không ràng buộc key duy nhất trên toàn bộ các đơn của người dùng.
- Chỉ kết quả thành công được giữ để replay. Lần thanh toán thất bại không khóa key; gửi lại cùng key là lần thử mới, có thể đổi thẻ/phương thức (AC-F16.5).
- Đồng bộ xử lý theo đơn trong transaction để các yêu cầu đồng thời không cùng gọi simulator; giữ ràng buộc tối đa một `Payment SUCCESS` cho mỗi đơn. Thành công: lưu `Payment` và đổi `Order` sang `PAID` cùng transaction. Từ chối: lưu `FAILED`, đơn sang `PAYMENT_FAILED`; lần thử sau dùng lại đơn cũ và tồn kho đã giữ.

### B. Simulator không lưu trạng thái

Payment Service là thành phần logic chạy trong tiến trình API, mô phỏng `WALLET`/`CARD` theo SRS §3.4. Chống thu trùng do API bảo đảm theo mục A và trạng thái đơn. Không có cơ chế bù trừ (compensate); chấp nhận khoảng dừng giữa bước 13 và 14 như bối cảnh trên.

### C. Cập nhật tồn kho an toàn

**BREW-INVENTORY-01 (2026-10-29): phần này được thay bởi [ADR-006](006-ingredient-inventory-snapshots.md) cho đơn mới `inventoryTracked=true`.** Đơn mới dùng Ingredient.onHand/reserved và snapshot, không UPDATE Product.stock. Đơn cũ marker false giữ hành vi dưới đây để không mất lịch sử hoặc suy diễn công thức:

- Legacy giữ chỗ bằng giảm Product.stock trong transaction tạo đơn; thiếu món rollback toàn bộ.
- Legacy thanh toán không giảm Product.stock lần nữa; thất bại giữ chỗ; chủ đơn hủy chưa trả hoàn Product.stock một lần.
- Cả hai đường dùng cùng quy tắc replay thành công ở §A; không hủy đơn đã PAID.

## Hệ quả

### Ưu điểm

- Retry thành công trả lại cùng kết quả, không gọi simulator lần nữa; ràng buộc một lần thành công cho mỗi đơn.
- Transaction bảo vệ tồn kho khi đặt đồng thời. Với đơn mới, khóa nguyên liệu và snapshot theo ADR-006; available cuối bằng 0 khi giữ hết lượng, onHand chưa giảm trước thanh toán (AC-F13.3).
- Kiểm thử replay cùng key, khác phương thức sau `PAID`, cùng key trên đơn khác và retry sau thất bại bám sát D2/D3.

### Hạn chế

- Cần kiểm soát đồng thời theo đơn và transaction ngắn; tránh giữ khóa lâu vì simulator (tối đa 500 ms).
- API dừng giữa bước 13 và 14 để lại đơn `PENDING` (rủi ro chấp nhận). Đơn bỏ dở có thể giữ tồn kho vô thời hạn trong bản minimum.

## Phương án đã loại

- Key duy nhất theo người dùng trên mọi đơn: chặn thanh toán hợp lệ cho đơn khác, trái D3.
- Chỉ vô hiệu hóa nút ở giao diện: không bảo vệ retry mạng hoặc nhiều request đồng thời.
- Đọc tồn rồi ghi ngoài transaction: có thể bán vượt kho khi nhiều yêu cầu cùng đọc một giá trị.

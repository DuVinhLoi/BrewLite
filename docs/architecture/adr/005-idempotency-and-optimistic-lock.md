# ADR-005: Idempotency thanh toán và chống bán vượt tồn kho

- Trạng thái: Accepted (2026-10-21)
- Liên quan: BR-05, FR-04, FR-05, NFR-12, NFR-13

## Bối cảnh

API đặt hàng và thanh toán có rủi ro lớn nếu bị dừng giữa các bước. Trong các tình huống như API ngừng giữa bước 13 và 14 của UC-04, hệ thống có thể thu trùng hoặc tạo sai số tồn kho nếu không có cơ chế bảo vệ.

## Quyết định

API thanh toán phải được bảo vệ bằng:

- `orderId` cố định cho một đơn hàng
- `Idempotency-Key` cho mỗi lần giao dịch
- cùng chốt `orderId`, `Idempotency-Key`, và `paymentMethod` để xác định giao dịch đã được xử lý hay chưa
- logic “charge-first rồi compensating update” theo đúng sequence nghiệp vụ đã thống nhất

Đối với tồn kho, hệ thống dùng transaction kiểm tra và cập nhật với điều kiện ràng buộc `stock >= n` để đảm bảo không có trường hợp bán vượt tồn kho trong môi trường concurrent.

## B. Simulator không lưu trạng thái

Simulator thanh toán không lưu trạng thái vào RAM bền vững; nó chỉ thực hiện các tác vụ giả lập theo yêu cầu và không tạo khả năng phục hồi thiếu kiểm soát sau restart. Điều này phù hợp với yêu cầu về tính minh bạch và không lưu dữ liệu nhạy cảm như cardNumber.

## C. Cập nhật tồn kho an toàn

- Trong transaction, hệ thống kiểm tra stock trước khi giảm.
- Nếu không đủ stock, trả `409 Conflict` hoặc giao dịch thất bại theo flow đã định.
- Chỉ cập nhật khi điều kiện thỏa mãn, không dùng cách cộng/trừ không kiểm soát.

## Hệ quả

### Ưu điểm
- Không có trường hợp trừ tiền hai lần do retry.
- Không có trường hợp bán vượt tồn kho khi nhiều client cùng đặt đơn.
- Dễ debug vì mỗi giao dịch rõ `orderId` + `Idempotency-Key`.

### Hạn chế
- Cần mở rộng validation trên API và secure logging.
- Người dùng cần retry đúng flow khi API gặp lỗi transient.

## Phương án đã loại

- Lưu trạng thái giao dịch trong RAM: không bền vững khi restart, không phù hợp yêu cầu hệ thống production.
- Dùng logic giảm tồn kho trước khi thanh toán: dễ dẫn đến lệch trạng thái khi payment thất bại.

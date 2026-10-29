# ADR-005: Idempotency thanh toán và chống bán vượt tồn kho

- Trạng thái: Accepted (2026-10-21); §A, §B và Hệ quả sửa 2026-10-29 theo [ADR-007](007-vnpay-sandbox.md)
- Liên quan: BR-03, BR-05, BR-10, BR-11, FR-13, FR-14–16, NFR-13; AC-F14.3, AC-F16.1, AC-F16.4, AC-F16.5; handoff D2/D3 (D3 chốt 2026-10-22)

## Bối cảnh

API cần xử lý retry thanh toán và nhiều yêu cầu đặt đơn đồng thời. Từ 2026-10-29 thanh toán đi qua VNPay sandbox (ADR-007), kết quả về bất đồng bộ qua IPN hoặc QueryDR: `POST /payments` không còn trả thành công hay thất bại ngay, nên một đơn có thể đang chờ kết quả khi khách bấm thanh toán lần nữa. Idempotency phải phủ cả trường hợp đó, và thu trùng được chặn bằng trạng thái `Payment` chứ không chỉ bằng kết quả đã thành công.

## Quyết định

### A. Replay và chống thu trùng tại API

- Kiểm JWT, vai trò Customer và chủ đơn trước khi tìm kết quả đã xử lý. Hai yêu cầu giống nhau khi cùng chủ đơn, `orderId`, `Idempotency-Key` và `paymentMethod` (BR-05, D2). Request không còn `cardNumber`: thẻ chỉ nhập trên trang VNPay, API không nhận, không lưu, không log.
- Thứ tự xét một yêu cầu thanh toán (BR-05):
  1. Đã có `Payment SUCCESS` của cùng yêu cầu: trả 200 với `paymentId` và nội dung lần thành công trước, không gọi VNPay, không cần cấu hình ký, kể cả khi trạng thái đơn đã tiến tiếp. Kiểm replay trước khi xét đơn còn thanh toán được hay không (AC-F14.3).
  2. Đơn không ở `PENDING`/`PAYMENT_FAILED`: trả 409 `ORDER_NOT_PAYABLE`. Cùng key nhưng khác `paymentMethod` sau khi đơn đã `PAID` là yêu cầu mới (AC-F16.1); key mới trên đơn đã trả cũng nhận lỗi này (AC-F16.4).
  3. Có `Payment PENDING` đã quá hạn: đối soát bằng QueryDR bên ngoài transaction, rồi khóa đơn, đọc lại và **xét replay `SUCCESS` lần nữa** trước khi trả 409 hoặc tạo giao dịch mới. Chưa kết luận được thì giữ `PENDING`, trả 409 `PAYMENT_IN_PROGRESS`.
  4. Có `Payment PENDING` còn hạn, cùng `paymentMethod`: trả 200 với URL và thời hạn cũ dù key mới (replay `PENDING`). Khác `paymentMethod`: 409 `PAYMENT_IN_PROGRESS`.
  5. Cần URL mới: lúc này mới kiểm cấu hình ký. Thiếu cấu hình hoặc lỗi ký thì 502 `PAYMENT_PROVIDER_ERROR`, không tạo `Payment`, không đổi trạng thái đơn. Ngược lại, trong cùng transaction giữ khóa đơn, tạo `Payment PENDING` và đưa đơn `PAYMENT_FAILED` về `PENDING` nếu đang thử lại; trả 201. Không giữ thêm nguyên liệu.
- Cùng key dùng cho đơn khác là yêu cầu mới (D3): đơn `PENDING`/`PAYMENT_FAILED` được thanh toán bình thường; không ràng buộc key duy nhất trên toàn bộ các đơn của người dùng.
- Kết quả được giữ để replay là `SUCCESS` (trả lại kết quả) và `PENDING` còn hạn (trả lại URL). Lần thanh toán `FAILED` không khóa key; gửi lại cùng key là lần thử mới, có thể đổi phương thức (AC-F16.5).
- Tối đa một `Payment PENDING` mỗi đơn (BR-10), bảo đảm bằng partial unique index `payments_one_pending_per_order` (`"orderId"` khi `"status" = 'PENDING'`) cùng khóa đơn và đối soát trước khi thử lại. Index không chặn được tiền về sau khi payment đã đóng; ca đó cảnh báo đối soát tay (ADR-007 §B).
- Mọi nhánh tạo, replay, hủy và áp kết quả đọc lại `Payment` dưới khóa đơn trong transaction; không gọi HTTP ra VNPay trong lúc giữ khóa. Chỉ IPN hoặc QueryDR đã xác thực quyết định kết quả cuối (BR-11); cả hai gọi chung `applyGatewayResult`, nên IPN lặp hay IPN chồng `sync` chỉ cho một `Payment SUCCESS` và trừ kho một lần. Thành công: `Payment` sang `SUCCESS` và `Order` sang `PAID` cùng transaction. Thất bại: `Payment` sang `FAILED`, đơn sang `PAYMENT_FAILED`; lần thử sau dùng lại đơn cũ và tồn kho đã giữ.

### B. Cổng thanh toán (đã được ADR-007 thay)

**2026-10-29: phần này được thay bởi [ADR-007](007-vnpay-sandbox.md).** Payment Service mô phỏng (`simulatePayment()`) bị bỏ. VNPay sandbox là hệ thống ngoài, giao kết quả qua IPN hoặc QueryDR thay vì trả ngay trong request. Chống thu trùng vẫn do API bảo đảm theo mục A, partial unique index và trạng thái đơn. Không có cơ chế bù trừ (compensate) tự động: tiền về sau khi payment đã `FAILED`/hết hạn hoặc đơn đã hủy thì ghi warning `PAYMENT_RECONCILIATION_REQUIRED` để nhân viên đối soát tay (ADR-007).

### C. Cập nhật tồn kho an toàn

**BREW-INVENTORY-01 (2026-10-29): phần này được thay bởi [ADR-006](006-ingredient-inventory-snapshots.md) cho đơn mới `inventoryTracked=true`.** Đơn mới dùng Ingredient.onHand/reserved và snapshot, không UPDATE Product.stock. Đơn cũ marker false giữ hành vi dưới đây để không mất lịch sử hoặc suy diễn công thức:

- Legacy giữ chỗ bằng giảm Product.stock trong transaction tạo đơn; thiếu món rollback toàn bộ.
- Legacy thanh toán không giảm Product.stock lần nữa; thất bại giữ chỗ; chủ đơn hủy chưa trả hoàn Product.stock một lần.
- Cả hai đường dùng cùng quy tắc replay ở §A; không hủy đơn đã PAID. Từ 2026-10-29, trừ kho khi trả thành công (đơn mới) xảy ra ở bước áp kết quả IPN/QueryDR, không còn trong request `POST /payments`.

## Hệ quả

### Ưu điểm

- Retry thành công trả lại cùng kết quả mà không gọi VNPay lần nữa; retry lúc đang chờ trả lại URL cũ, không mở giao dịch thứ hai; ràng buộc một lần thành công cho mỗi đơn.
- Transaction bảo vệ tồn kho khi đặt đồng thời. Với đơn mới, khóa nguyên liệu và snapshot theo ADR-006; available cuối bằng 0 khi giữ hết lượng, onHand chưa giảm trước thanh toán (AC-F13.3).
- Kiểm thử replay `SUCCESS` và `PENDING`, cùng key khác phương thức sau `PAID`, cùng key trên đơn khác và retry sau thất bại bám sát D2/D3 và BR-05/BR-10.

### Hạn chế

- Cần kiểm soát đồng thời theo đơn và transaction ngắn. HTTP ra VNPay (QueryDR, timeout 10 giây) luôn nằm ngoài transaction giữ khóa, nên mọi nhánh phải đọc lại payment dưới khóa trước khi ghi.
- Kết quả đến bất đồng bộ: đơn `PENDING` chờ IPN/QueryDR. Tiền về sau khi payment đã đóng không được tự xử lý mà cần đối soát tay (ADR-007). Partial unique index chỉ chặn hai `Payment PENDING`, không loại trừ mọi tình huống thu trùng.
- Đơn bỏ dở có thể giữ tồn kho vô thời hạn trong bản minimum: chưa có job tự hủy đơn hay nhả kho, hết hạn thanh toán chỉ làm payment cần đối soát.

## Phương án đã loại

- Key duy nhất theo người dùng trên mọi đơn: chặn thanh toán hợp lệ cho đơn khác, trái D3.
- Chỉ vô hiệu hóa nút ở giao diện: không bảo vệ retry mạng hoặc nhiều request đồng thời.
- Đọc tồn rồi ghi ngoài transaction: có thể bán vượt kho khi nhiều yêu cầu cùng đọc một giá trị.
- Không replay `PENDING`, mỗi key mới tạo URL mới: một đơn có hai giao dịch VNPay song song, có thể thu trùng.

## Lịch sử thay đổi

- 2026-10-29 (ADR-007): thanh toán chuyển từ Payment Service mô phỏng sang VNPay sandbox. §A thêm replay `PENDING`, BR-10 và partial unique index; §B được ADR-007 thay. Bản 2026-10-21 coi API dừng giữa bước 13 và 14 của UC-04 là rủi ro chấp nhận vì simulator không thu tiền thật, và giữ khóa đơn trong lúc gọi simulator (tối đa 500 ms). Cả hai không còn là hành vi hiện tại: payment `PENDING` được lưu trước khi khách rời BrewLite, kết quả nhận qua IPN/QueryDR, và HTTP ra VNPay nằm ngoài transaction.

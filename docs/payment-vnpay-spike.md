# Spike VNPay sandbox (bước 1 của plan)

Ngày chạy: 2026-10-30, 07:31–07:48 (GMT+7). Plan: [2026-10-29-vnpay-payment-plan.md](planning/2026-10-29-vnpay-payment-plan.md), bước 1.1–1.5.

Script spike nằm ngoài repo. Script không tự ký mà gọi đúng các hàm trong `apps/api/src/payment/vnpay.ts` (`buildPaymentUrl`, `verifyReturn`, `buildQueryDr`, `verifyQueryDrResponse`, `queryDrAction`, `ipnAction`), nên kết quả kiểm luôn code của repo. `vnp_TxnRef` và mã đơn có dạng cuid như `Payment.id`/`Order.id`; số tiền 10.000 VND; trả bằng thẻ test NCB lấy trong email sandbox. Tài liệu này không ghi secret, mã merchant (`<TmnCode>`), chữ ký hay thông tin thẻ.

## 1. Kết quả theo bước

| Bước | Kết quả | Kết luận |
|---|---|---|
| 1.1 Ký URL, mở trình duyệt, trả bằng thẻ NCB | VNPay nhận URL, chuyển sang trang chọn phương thức (có `vnp_BankCode=VNBANK` thì vào thẳng danh sách ngân hàng). Trả thẻ NCB + OTP thành công. | Đạt |
| 1.2 Kiểm chữ ký return, `vnp_OrderInfo` có khoảng trắng | `verifyReturn` của repo trả `true` cho cả 6 lần return: 3 lần từ script (thành công, hủy, hết hạn ở bước OTP) và 3 lần từ app thật (thành công, hủy, thử lại thành công; kiểm qua `GET /payments/vnpay/return` và IPN). Chuỗi ký mã hóa khoảng trắng thành `+` (kiểu `URLSearchParams`) mới khớp; mã hóa `%20` không khớp. Các lần return không có tham số `vnp_*` rỗng. | Đạt |
| 1.3 QueryDR | Sandbox trả `{"vnp_ResponseCode":"99","vnp_Message":"Unexpected error"}`, không có chữ ký, cho **mọi** request đủ tham số: giao dịch chưa mở, đã mở, đã trả thành công, đã hủy, trước và sau hạn. Kể cả merchant giả `ZZZZZZZZ` hoặc chữ ký sai cũng nhận `99` (tài liệu VNPay ghi phải là `02`/`97`). Body thiếu tham số thì nhận `99` kèm "Parameter required" hoặc "Command not support". Thử lại lúc 07:31, 07:33, 07:36, 07:44, 07:48: không đổi. | **Chưa đạt, lỗi phía sandbox.** Chưa kiểm được chữ ký phản hồi QueryDR, mã `91` và các cặp `00/01`, `00/02`. |
| 1.4 Khách bấm "Hủy" trên VNPay | Return có `vnp_ResponseCode=24`, `vnp_TransactionStatus=02`, `vnp_TransactionNo=0`, `vnp_BankCode=VNPAY`, `vnp_CardType=QRCODE` (dù đã chọn NCB), có `vnp_PayDate`. | Đạt: `ipnAction` cho `FAILED` |

Request QueryDR đã đối chiếu với tài liệu chính thức (`sandbox.vnpayment.vn/apis/docs/truy-van-hoan-tien/querydr&refund.html`): đúng URL, method, 11 tham số, thứ tự 9 trường của chuỗi ký. Đổi từng yếu tố một (RequestId dạng số, `vnp_IpAddr` khác, `vnp_OrderInfo` khác, hash chữ hoa, header `charset=utf-8`, `vnp_Version=2.0.0`, thêm `vnp_SecureHashType`) đều vẫn nhận `99`.

## 2. Hết hạn thanh toán (`vnp_ExpireDate`)

Đặt hạn 3–5 phút để quan sát nhanh:

| Tình huống | Hành vi của VNPay |
|---|---|
| URL đã mở, đang ở trang chọn phương thức khi tới hạn | Trang tự chuyển sang `Payment/Error.html?code=15` "Giao dịch đã quá thời gian chờ thanh toán", đúng một giây sau `vnp_ExpireDate`. **Không** quay về returnUrl. |
| Mở lại URL đã hết hạn (cả URL chưa từng mở lẫn URL đã mở) | Trang lỗi `code=15` như trên, không cho trả. |
| Đã nhập thẻ, đang ở bước OTP khi tới hạn | Tự quay về returnUrl với `vnp_ResponseCode=15`, `vnp_TransactionStatus=02`, có `vnp_TransactionNo`, chữ ký hợp lệ. `ipnAction` cho `FAILED`. |
| Trang thanh toán | Có đồng hồ "Giao dịch hết hạn sau mm:ss" tính theo `vnp_ExpireDate` đã ký. |

Kết luận: VNPay từ chối thanh toán sau `vnp_ExpireDate` ở cả hai đường (mở URL mới, trả tiếp trên trang đã mở). Đây là điều kiện plan đặt ra cho cách "`01` sau `expiresAt` cộng khoảng chờ → `FAILED EXPIRED`". Chưa biết QueryDR trả `91` hay `00/01` cho giao dịch hết hạn, vì QueryDR đang lỗi.

## 3. Mã đã thấy

| Nguồn | `vnp_ResponseCode` / `vnp_TransactionStatus` | Ghi chú |
|---|---|---|
| Return, trả thành công | `00` / `00` | Có `vnp_BankTranNo`, `vnp_CardType=ATM`, `vnp_BankCode=NCB` |
| Return, khách hủy | `24` / `02` | `vnp_TransactionNo=0` |
| Return, hết hạn ở bước OTP | `15` / `02` | Có `vnp_TransactionNo` |
| Trang lỗi, hết hạn trước khi chọn ngân hàng | `code=15` trên URL trang lỗi | Không có return/IPN quan sát được |
| QueryDR | `99` không chữ ký | Mọi trường hợp |

## 4. Ảnh hưởng tới code

- **Luật thất bại của IPN** (`ipnAction`, "pending spike"): khớp dữ liệu thật (`24/02` và `15/02` đều thành `FAILED`). Có thể gỡ nhãn chờ spike.
- **`91` sau hạn → `EXPIRED`** (`queryDrAction`): chưa kiểm được, giữ nhãn chờ.
- **`00/01` sau hạn → `IN_PROGRESS`**: chưa kiểm được. Bằng chứng ở mục 2 cho thấy VNPay không cho trả sau hạn.
- **Hành vi hiện tại khi QueryDR lỗi:** code đóng an toàn (fail closed). Phản hồi `99` không chữ ký bị xếp `BAD_SIGNATURE`, `sync` trả 502, DB không đổi. Hệ quả: payment `PENDING` quá hạn mà không có IPN (khách mở URL rồi bỏ, hoặc không mở) làm đơn kẹt. `sync`, hủy đơn và tạo thanh toán mới đều trả 502 cho tới khi QueryDR chạy lại. Ở local (không có IPN) app cũng không tự xác nhận được giao dịch đã trả.

## 5. Còn phải làm

- Thử lại QueryDR khi sandbox hồi phục; nếu vẫn `99`, hỏi hỗ trợ VNPay (`hotrovnpay@vnpay.vn`) kèm `vnp_TxnRef` và thời điểm.
- Nhóm chốt lối thoát cho payment quá hạn khi QueryDR không kết luận được (plan bước 1, "Không để đơn vừa không trả tiếp được vừa không hủy được").
- IPN thật chỉ quan sát được trên Render (bước 7.5, 7.6).

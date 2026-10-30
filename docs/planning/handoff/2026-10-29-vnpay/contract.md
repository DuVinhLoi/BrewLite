# Hợp đồng chung Wave 1: tài liệu VNPay

Nguồn nội dung là [plan VNPay](../../2026-10-29-vnpay-payment-plan.md). File này chỉ **chốt tên và mã** để ba worker Wave 1 soạn song song mà không lệch nhau. Integrator soạn ngày 2026-10-29; worker không sửa file này. Cần mã ngoài danh sách thì ghi vào report, không tự đặt. Sau Wave 1 (2026-10-29), người dùng chốt bốn điểm; Integrator sửa mục 1, 3, 4 theo đó (xem [ledger](ledger.md)).

## 1. Mã yêu cầu trong SRS

- **BR-10:** tối đa một `Payment PENDING` cho mỗi đơn; chưa xác định kết quả thì không mở lần thử mới.
- **BR-11:** chỉ IPN hoặc QueryDR đã xác thực được quyết định kết quả cuối; return URL chỉ hiển thị.
- **BR-05:** giữ mã, viết lại theo thứ tự replay `SUCCESS`/`PENDING` ở plan mục 1.5.
- **AC mới:** chỉ SRS đặt. Giữ mã AC cũ khi viết lại nội dung. AC mới đánh tiếp từ `AC-F14.7`, `AC-F15.6`, `AC-F16.8`. Không dùng lại các mã đã bỏ: `AC-F15.2`, `AC-F16.2`, `AC-F16.3`, `AC-F16.7`, `AC-F16.13`.
- **AC-F25.4** (sau Wave 1): chặn hủy khi đơn còn `Payment PENDING` chưa kết luận. Dời từ `AC-F16.13` vì đây là quy tắc hủy đơn của FR-25, không phải idempotency của FR-16.
- **AC-N12.1** (sau Wave 1): giữ Must. E2E đóng vai VNPay: chặn redirect, ký IPN bằng secret giả của môi trường test, không trả tiền trên sandbox.
- **FR-31:** giữ Won't, nghĩa mới là "cổng production thật".
- **NFR-03 / AC-N03.1:** `POST /payments` chỉ tạo `Payment PENDING` và ký URL, không chờ VNPay; bỏ câu "simulator ≤500 ms". Giữ mã.

## 2. Luồng của UC-04 trong `uc-checkout.md`

Giữ mã cũ: A1–A5, E1–E8, E1a/E1b, E4a–E4e, E8a. Các luồng **mới** dùng đúng mã sau; SRS và sơ đồ dẫn chiếu theo mã này.

- **E3** (viết lại): thanh toán thất bại do IPN/QueryDR xác nhận, gồm khách bấm Hủy trên VNPay (`24`). Đơn → `PAYMENT_FAILED`, giữ nguyên liệu.
- **E4** (viết lại): replay `SUCCESS` cùng key/phương thức → 200; `Payment PENDING` còn hạn cùng phương thức → 200 trả URL cũ; khác phương thức → 409 `PAYMENT_IN_PROGRESS`.
- **E8b:** giữ mã, đánh dấu "Đã bỏ" giống E4b/E4c, vì IPN/QueryDR thay rủi ro chấp nhận cũ.
- **A5** (bổ sung): hủy bị chặn 409 `PAYMENT_IN_PROGRESS` khi có `Payment PENDING` còn hạn; quá hạn thì đối soát trước (E11).
- **A6** (mới): khách quay lại checkout khi đã có `Payment PENDING` còn hạn → "Tiếp tục thanh toán" bằng URL cũ.
- **E9** (mới): IPN hoặc return sai chữ ký, sai merchant hoặc sai số tiền → IPN `97`/`04`, return `valid: false`; không đổi DB.
- **E10** (mới): mất IPN hoặc IPN đến muộn (Render ngủ, chạy local) → trang return gọi `POST /payments/:id/sync` (QueryDR).
- **E11** (mới): `Payment PENDING` quá hạn → đối soát QueryDR trước khi tạo giao dịch mới hoặc hủy; chưa kết luận thì giữ `PENDING`, 409 `PAYMENT_IN_PROGRESS`.
- **E12** (mới): tiền về sau trạng thái cuối (payment `FAILED`/`EXPIRED`, đơn đã hủy hoặc đã trả bằng payment khác) → IPN trả `02`, ghi warning `PAYMENT_RECONCILIATION_REQUIRED`, không đổi đơn/kho.
- **E13** (mới): thiếu cấu hình VNPay hoặc lỗi provider → 502 `PAYMENT_PROVIDER_ERROR`; IPN thiếu secret trả `99`.

## 3. Mã lỗi, cảnh báo, trạng thái

- HTTP: 409 `PAYMENT_IN_PROGRESS`, 502 `PAYMENT_PROVIDER_ERROR`, 404 `PAYMENT_NOT_FOUND`, 409 `ORDER_NOT_PAYABLE` (đã có). Bỏ 402 `PAYMENT_DECLINED` khỏi `POST /payments`.
- IPN `RspCode`: `00`, `01`, `02`, `04`, `97`, `99` theo plan mục 1.3.
- Warning log: `PAYMENT_RECONCILIATION_REQUIRED`.
- `PaymentStatus`: `SUCCESS`, `FAILED`, `PENDING`. `EXPIRED` chỉ là giá trị nội bộ của `gatewayResponseCode`, **không** phải trạng thái enum. Không có `REFUNDED` (FR-26 Won't; enum Prisma hiện chỉ có `SUCCESS`, `FAILED`).
- `Payment` thêm: `provider`, `paymentUrl`, `expiresAt`, `gatewayCreateDate`, `gatewayTxnNo`, `gatewayResponseCode`, `gatewayTransactionStatus`, `bankCode`, `paidAt` (plan mục 1.4). Hàng cũ có `provider = "SIMULATOR"`.

## 4. Tên dùng trong sơ đồ

- Actor/participant ngoài: **"VNPay sandbox"** (hệ thống ngoài), giống `use-case-overview.puml` đã merge. Riêng `sequence-checkout.puml` hiển thị `VNPay sandbox\n(Payment Service)` (alias `Pay`) để bám lifeline tối thiểu của đề A2 §4.2.
- Participant trong hệ thống: giữ tên đang dùng trong từng file `.puml`; thêm "Browser" nếu file chưa có.
- Endpoint: `POST /payments`, `GET /payments/vnpay/ipn`, `GET /payments/vnpay/return`, `POST /payments/:id/sync`, `PATCH /orders/:id`, `GET /orders/:id`.

## 5. ADR

- **ADR-007:** file `docs/architecture/adr/007-vnpay-sandbox.md`, tiêu đề `# ADR-007: Tích hợp VNPay sandbox`, trạng thái `Proposed 2026-10-29` cho tới khi nhóm duyệt.

## 6. Nội dung chờ spike

Gắn nhãn hiển thị **"(chờ spike)"** ngay sau câu hoặc AC phụ thuộc hành vi sandbox chưa đo. Integrator gỡ nhãn hoặc sửa nội dung sau spike bước 1.3–1.4. Chỉ ba điểm sau:

1. QueryDR `00/01` sau hạn, và lối thoát cho ca bỏ dở (plan, điều kiện qua của bước 1).
2. QueryDR `91` sau hạn → `FAILED`, `gatewayResponseCode = "EXPIRED"`.
3. IPN coi là thất bại khi `vnp_TransactionStatus = 02`, kể cả khách hủy (`24`).

Sau spike ngày 2026-10-30 ([kết quả](../../../payment-vnpay-spike.md)), gỡ cả ba nhãn:

- Điểm 1 thay bằng D6 (mục 8).
- Điểm 2 giữ nguyên hành vi. Spike chưa quan sát được mã `91` vì QueryDR sandbox lỗi, nhưng D6 vẫn bảo đảm lối ra dù `91` không bao giờ xuất hiện.
- Điểm 3 đã được xác nhận: hủy trả `24/02`, hết hạn ở bước OTP trả `15/02`.

## 7. Rủi ro

R-13, R-14, R-15 đã có trong `context-and-scope.md` (W0). Không đánh thêm mã `R-` ở Wave 1.

## 8. D6: đóng payment quá hạn sau khoảng chờ (người dùng chốt 2026-10-30, phương án A)

**Lý do.**
- QueryDR sandbox trả `99` không có chữ ký cho mọi request.
- Payment `PENDING` quá hạn mà không có IPN làm đơn kẹt: `sync`, hủy đơn và thanh toán lại đều trả 502.
- Spike chứng minh VNPay từ chối thanh toán sau `vnp_ExpireDate`, đúng điều kiện plan đặt cho cách "đóng sau khoảng chờ".

**Khoảng chờ.**
- Dài 15 phút sau `expiresAt`. "Hết khoảng chờ" nghĩa là `now >= expiresAt + 15 phút`, với `now` là lúc gửi QueryDR.
- Payment có `expiresAt = null` không bao giờ hết khoảng chờ.
- Việc đóng diễn ra khi có lời gọi: `POST /payments`, hủy đơn hoặc `sync`. Không có job chạy nền (D5 giữ nguyên).

**Bảng quyết định.** Áp khi đối soát một `Payment PENDING`, sau khi đọc lại payment dưới khóa đơn:

| Kết quả QueryDR | Chưa hết khoảng chờ | Hết khoảng chờ |
| --- | --- | --- |
| Đã xác thực `00/00` | `SUCCESS` (như cũ) | như cũ |
| Đã xác thực `00/02` | `FAILED` (như cũ) | như cũ |
| Đã xác thực `91` | quá hạn thì `FAILED` `EXPIRED`, còn hạn thì 409 (như cũ) | như cũ |
| Đã xác thực `00` kèm status nghi ngờ `04/05/06/07/09` | giữ `PENDING`, 502, warning đối soát | **như cũ, không bao giờ tự đóng** |
| Phản hồi `00` có chữ ký hợp lệ nhưng sai merchant, TxnRef, số tiền hoặc type (`MISMATCH`) | giữ `PENDING`, 502, warning đối soát | **như cũ, không bao giờ tự đóng** |
| Phản hồi mã khác `00` có chữ ký hợp lệ nhưng sai hoặc thiếu merchant, TxnRef (`BAD_RESPONSE`, sửa sau review) | 502 | đóng |
| Đã xác thực `00/01` | 409 `PAYMENT_IN_PROGRESS` | đóng |
| Đã xác thực `00` kèm status thiếu hoặc chưa hỗ trợ | 502 | đóng |
| Đã xác thực mã truy vấn khác (`02`, `03`, `94`, `97`, `99`...) | 502 | đóng |
| Không chữ ký, sai chữ ký, timeout, lỗi mạng, không đọc được phản hồi, thiếu cấu hình truy vấn, thiếu `gatewayCreateDate` | 502 | đóng |

**"Đóng" làm gì.**
- `Payment` chuyển `FAILED`, `gatewayResponseCode = "EXPIRED"`, `gatewayTransactionStatus = null`.
- Đơn chuyển `PAYMENT_FAILED`, kho không đổi (AC-F15.3).
- Ghi warning `PAYMENT_EXPIRED_UNCONFIRMED vnp_TxnRef=<id>`, kèm `reason=<QueryFailureReason>` (gồm `QueryDrFailure` và `NOT_CONFIGURED`, `MISSING_CREATE_DATE`, `TIMEOUT`, `NETWORK`) hoặc `vnp_ResponseCode=<..> vnp_TransactionStatus=<..>` đã xác thực.
- Sau đó khách thanh toán lại (tạo payment mới) hoặc hủy đơn (nhả nguyên liệu).
- IPN thành công tới sau khi đã đóng thì đi theo AC-F15.7: trả `02`, ghi warning `PAYMENT_RECONCILIATION_REQUIRED`, nhân viên hoàn tiền tay.

**Log QueryDR lỗi.**
- Dạng chung: `VNPAY_QUERYDR_FAILED vnp_TxnRef=<id> reason=<reason>`.
- Phản hồi không có `vnp_SecureHash` dùng `reason=UNSIGNED`. Nếu `vnp_ResponseCode` gồm đúng 2 chữ số thì thêm `vnp_ResponseCode=<mã>`, chỉ để vận hành, không dùng để quyết định.

**Tên trong code** (tài liệu và code dùng chung):
- `vnpay.ts`: hằng `EXPIRY_GRACE_MS = 15 * 60 * 1000` và hàm thuần `isPastGrace(expiresAt, now)`.
- `queryDrAction(responseCode, transactionStatus, expired, pastGrace)` cho phản hồi đã xác thực.
- `unansweredQueryAction(reason, pastGrace)` cho phản hồi không xác thực được.
- `QueryDrFailure` thêm `'UNSIGNED'`.

**Mã AC.** Không thêm mã mới:
- viết lại `AC-F16.10` (lối thoát);
- `AC-F16.11` thêm ngoại lệ sau khoảng chờ;
- gỡ "(chờ spike)" ở `AC-F15.8` và `AC-F16.10`;
- `BR-10` và đoạn "Hạn thanh toán 15 phút" thêm vế đóng sau khoảng chờ.

**Web.** Mã `15` (quan sát được ở spike) và `EXPIRED` dùng thông báo "Đã hết thời gian thanh toán", giống mã `11`. Plan mục 1.7 thêm hai mã này.

**Sửa sau review (2026-10-30).**
- `MISMATCH` chỉ áp cho phản hồi `00`, vì chỉ `00` mới dẫn tới `SUCCESS` theo status.
- Phản hồi mang mã khác (kể cả `91`) mà sai hoặc thiếu `vnp_TmnCode`/`vnp_TxnRef` xếp `BAD_RESPONSE`. Trước khoảng chờ trả 502, hết khoảng chờ thì đóng.
- Lý do: VNPay có thể trả phản hồi lỗi đã ký với các trường rỗng. Nếu xếp `MISMATCH`, đơn sẽ kẹt mãi, đúng lỗi mà D6 sinh ra để sửa.
- Màn chi tiết đơn hiện `vnpayMessage(gatewayResponseCode)` trên dòng của payment `FAILED` có mã. Nhờ vậy khách thấy "Đã hết thời gian thanh toán" sau khi payment bị đóng; trước đây chỉ màn return gọi `vnpayMessage`.

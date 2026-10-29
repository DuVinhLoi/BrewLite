# Hợp đồng chung Wave 1: tài liệu VNPay

Nguồn nội dung là [plan VNPay](../../2026-10-29-vnpay-payment-plan.md). File này chỉ **chốt tên và mã** để ba worker Wave 1 soạn song song mà không lệch nhau. Integrator soạn ngày 2026-10-29; worker không sửa file này. Cần mã ngoài danh sách thì ghi vào report, không tự đặt.

## 1. Mã yêu cầu trong SRS

- **BR-10:** tối đa một `Payment PENDING` cho mỗi đơn; chưa xác định kết quả thì không mở lần thử mới.
- **BR-11:** chỉ IPN hoặc QueryDR đã xác thực được quyết định kết quả cuối; return URL chỉ hiển thị.
- **BR-05:** giữ mã, viết lại theo thứ tự replay `SUCCESS`/`PENDING` ở plan mục 1.5.
- **AC mới:** chỉ SRS đặt. Giữ mã AC cũ khi viết lại nội dung. AC mới đánh tiếp từ `AC-F14.7`, `AC-F15.6`, `AC-F16.8`. Không dùng lại các mã đã bỏ: `AC-F15.2`, `AC-F16.2`, `AC-F16.3`, `AC-F16.7`.
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
- `PaymentStatus`: `SUCCESS`, `FAILED`, `PENDING`. `EXPIRED` chỉ là giá trị nội bộ của `gatewayResponseCode`, **không** phải trạng thái enum.
- `Payment` thêm: `provider`, `paymentUrl`, `expiresAt`, `gatewayCreateDate`, `gatewayTxnNo`, `gatewayResponseCode`, `gatewayTransactionStatus`, `bankCode`, `paidAt` (plan mục 1.4). Hàng cũ có `provider = "SIMULATOR"`.

## 4. Tên dùng trong sơ đồ

- Actor/participant ngoài: **"VNPay sandbox"** (hệ thống ngoài), giống `use-case-overview.puml` đã merge.
- Participant trong hệ thống: giữ tên đang dùng trong từng file `.puml`; thêm "Browser" nếu file chưa có.
- Endpoint: `POST /payments`, `GET /payments/vnpay/ipn`, `GET /payments/vnpay/return`, `POST /payments/:id/sync`, `PATCH /orders/:id`, `GET /orders/:id`.

## 5. ADR

- **ADR-007:** file `docs/architecture/adr/007-vnpay-sandbox.md`, tiêu đề `# ADR-007: Tích hợp VNPay sandbox`, trạng thái `Proposed 2026-10-29` cho tới khi nhóm duyệt.

## 6. Nội dung chờ spike

Gắn nhãn hiển thị **"(chờ spike)"** ngay sau câu hoặc AC phụ thuộc hành vi sandbox chưa đo. Integrator gỡ nhãn hoặc sửa nội dung sau spike bước 1.3–1.4. Chỉ ba điểm sau:

1. QueryDR `00/01` sau hạn, và lối thoát cho ca bỏ dở (plan, điều kiện qua của bước 1).
2. QueryDR `91` sau hạn → `FAILED`, `gatewayResponseCode = "EXPIRED"`.
3. IPN coi là thất bại khi `vnp_TransactionStatus = 02`, kể cả khách hủy (`24`).

## 7. Rủi ro

R-13, R-14, R-15 đã có trong `context-and-scope.md` (W0). Không đánh thêm mã `R-` ở Wave 1.

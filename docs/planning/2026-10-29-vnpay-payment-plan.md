# Kế hoạch: thanh toán qua VNPay sandbox

**Ngày:** 2026-10-29 · **Nhánh:** `a2/payment-vnpay` · **Worktree:** `.worktrees/payment-vnpay`

**Task:** `PAYMENT-VNPAY-PLAN` · **Trạng thái:** bản final của kế hoạch; chưa triển khai. Lần rà này chỉ sửa file kế hoạch. Khi thực hiện, phải qua các điều kiện ở bước 0–1; quyền sửa code, thay nền nhánh, push và merge vẫn theo yêu cầu rõ của người dùng.

**Yêu cầu:** giảng viên đòi thanh toán qua sandbox của bên thứ 3 thay cho simulator `simulatePayment()`. Nhóm đã đăng ký VNPay sandbox.

**Nền:** code trên nhánh `jumbo` (`51f5330`, tồn kho theo nguyên liệu). Tạo đơn giữ nguyên liệu (`reserve`), trả thành công thì trừ kho (`settle(consume=true)`), hủy đơn thì nhả (`settle(false)`). Kế hoạch này giữ nguyên các quy tắc đó và chỉ thay cách lấy kết quả thanh toán.

**Ràng buộc:**

- Giảng viên cấm vibecoding: agent soạn tài liệu (bước 2–4); code ở `apps/`, `tests/`, `.github/workflows/` chỉ viết khi người dùng yêu cầu rõ.
- Thứ tự sửa: SRS → sơ đồ → ADR → ma trận truy vết → code.
- **Không ghi `vnp_HashSecret` vào bất kỳ file nào trong repo, log hay mô tả PR.** Secret chỉ nằm trong `apps/api/.env` (đã bị `.gitignore` chặn) và biến môi trường Render.
- Không thêm trailer `Co-Authored-By`.

Nguồn đã đối chiếu ngày 2026-10-29: [VNPay Pay](https://sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.html), [QueryDR và Refund](https://sandbox.vnpayment.vn/apis/docs/truy-van-hoan-tien/querydr%26refund.html), [bảng mã VNPay](https://sandbox.vnpayment.vn/apis/docs/bang-ma-loi/). Các trang VNPay được đối chiếu qua bản nội dung do công cụ tìm kiếm trả về vì mở trực tiếp bị timeout. Quy tắc dưới đây là đặc tả đích; kết quả thực tế của sandbox phải được ghi riêng ở bước 1, không coi là đã chạy spike.

---

## 1. Kiến trúc đích

Luồng cũ chạy đồng bộ: `POST /payments` gọi simulator rồi trả ngay 201 hoặc 402. VNPay chạy bất đồng bộ, nên luồng tách thành 3 phần.

1. **Tạo giao dịch.** `POST /payments` tạo `Payment` ở trạng thái `PENDING`, ký URL bằng HMAC-SHA512 và trả `paymentUrl`. Đơn vẫn `PENDING`.
2. **Khách trả tiền trên trang VNPay.** Trong sandbox dùng thẻ NCB test.
3. **Nhận kết quả.**
   - **IPN** (Instant Payment Notification: VNPay gọi thẳng server-to-server vào `GET /payments/vnpay/ipn`) là nguồn thông báo kết quả chính.
   - **Return URL:** VNPay chuyển trình duyệt về `/payment/vnpay-return` trên web. Trang này chỉ kiểm chữ ký và hiển thị, rồi poll `GET /orders/:id`.
   - **QueryDR** (API tra cứu giao dịch của VNPay): dùng khi IPN không tới, ví dụ chạy local (VNPay không gọi được localhost) hoặc Render đang ngủ. API tự hỏi VNPay rồi áp kết quả qua cùng một hàm với IPN.

Chỉ kết quả IPN hoặc QueryDR đã xác thực mới được quyết định thanh toán thành công/thất bại; return URL không quyết định trạng thái. Việc tạo `Payment PENDING` và chuyển đơn về `PENDING` khi thử lại vẫn thuộc `POST /payments`.

```
Web ──POST /payments──▶ API ──(paymentUrl)──▶ Web ──redirect──▶ VNPay sandbox
                        ▲                                         │
                        └──── GET /payments/vnpay/ipn ◀───────────┤ (server-to-server)
Web ◀──── redirect vnp_ReturnUrl (chỉ hiển thị) ◀─────────────────┘
Web ──POST /payments/:id/sync (khi còn PENDING)──▶ API ──querydr──▶ VNPay
```

### 1.1 Ánh xạ tham số (VNPay 2.1.0)

- `vnp_Version=2.1.0`, `vnp_Command=pay`, `vnp_CurrCode=VND`, `vnp_Locale=vn`, `vnp_OrderType=other`.
- `vnp_TxnRef = Payment.id` (cuid, 25 ký tự chữ và số). Mỗi lần thử một mã mới, nên không trùng trong ngày.
- `vnp_Amount = Order.total * 100` (VND nhân 100, không dấu phân cách).
- `vnp_CreateDate` và `vnp_ExpireDate` dạng `yyyyMMddHHmmss` theo **GMT+7**. Không dùng giờ máy, vì Render chạy UTC. Hạn thanh toán là 15 phút (quyết định D5).
- **Lưu nguyên chuỗi `vnp_CreateDate` đã ký** vào `Payment.gatewayCreateDate`. QueryDR bắt buộc gửi `vnp_TransactionDate` bằng đúng giá trị này. Không tính lại từ `Payment.createdAt`: hai mốc thời gian lệch nhau qua ranh giới giây là VNPay báo không tìm thấy giao dịch (`91`).
- `vnp_OrderInfo = "Thanh toan don <orderId>"`: không dấu, không ký tự đặc biệt.
- `vnp_IpAddr`: IP khách, lấy phần tử đầu của `x-forwarded-for` (Render đứng sau proxy). Không có thì dùng `127.0.0.1`.
- `vnp_ReturnUrl = <WEB_URL>/payment/vnpay-return`.
- `vnp_BankCode`: theo quyết định D2.

### 1.2 Ký và kiểm chữ ký

- Với URL thanh toán, IPN và return: sắp xếp tham số `vnp_*` theo tên tăng dần, bỏ `vnp_SecureHash` và `vnp_SecureHashType`. Nối thành `key=value&...` với key và value đã URL-encode, rồi ký HMAC-SHA512; dùng nguyên chuỗi `VNP_HASH_SECRET` làm khóa UTF-8, xuất chữ ký hex. Không giải mã secret thành byte hex.
- **Bẫy encode:** sample PHP/Java của VNPay mã hóa khoảng trắng thành `+`, còn `encodeURIComponent` trong Node cho ra `%20` và làm sai chữ ký. Dùng `new URLSearchParams(sorted).toString()`, vì cách này encode giống sample. Spike ở bước 1 phải xác nhận điểm này.
- Chữ ký nhận về phải là chuỗi hex đủ 128 ký tự (`/^[0-9a-fA-F]{128}$/`). Đổi hai chữ ký thành `Buffer` hex, so độ dài trước rồi mới gọi `crypto.timingSafeEqual`; sai định dạng hoặc độ dài thì coi là sai chữ ký, không để hàm ném lỗi. [Node.js](https://nodejs.org/api/crypto.html#cryptotimingsafeequala-b)
- Chữ ký QueryDR dùng giá trị thô, không URL-encode, nối bằng `|` theo thứ tự:
  - request: `vnp_RequestId|vnp_Version|vnp_Command|vnp_TmnCode|vnp_TxnRef|vnp_TransactionDate|vnp_CreateDate|vnp_IpAddr|vnp_OrderInfo`;
  - response: `vnp_ResponseId|vnp_Command|vnp_ResponseCode|vnp_Message|vnp_TmnCode|vnp_TxnRef|vnp_Amount|vnp_BankCode|vnp_PayDate|vnp_TransactionNo|vnp_TransactionType|vnp_TransactionStatus|vnp_OrderInfo|vnp_PromotionCode|vnp_PromotionAmount`.
  - Trường tùy chọn vắng mặt là chuỗi rỗng, vẫn giữ dấu `|`. Không dùng công thức request để kiểm response.
- QueryDR gửi JSON bằng `POST`; `vnp_RequestId` mới cho mỗi lần hỏi, tối đa 32 ký tự (UUID bỏ dấu `-`); `vnp_TransactionDate` lấy từ `gatewayCreateDate`, còn `vnp_CreateDate` là giờ GMT+7 của lần hỏi. Đặt timeout HTTP 10 giây; không tự gọi lại liên tục khi nhận `94`.
- `vnp_IpAddr` của QueryDR là IP máy chủ gọi API theo đặc tả VNPay, tách khỏi IP khách dùng khi tạo URL; ghi giá trị đã thử trong spike. Các trường ngày VNPay nhận về phải được đọc theo GMT+7 trước khi lưu `paidAt` dạng `DateTime`, không parse theo múi giờ máy.

### 1.3 Xử lý IPN (thứ tự theo tài liệu VNPay)

Endpoint công khai, không đi qua `AuthGuard`. Nó phải nằm ở controller riêng, vì `CheckoutController` gắn guard ở mức class.

0. Chưa cấu hình `VNP_HASH_SECRET` hoặc `VNP_TMN_CODE` (mục 1.8) → `99`, không đọc hay ghi DB. **Không trả `97`:** chữ ký chưa kiểm được chứ không phải sai. Mã `99` khiến VNPay gọi lại, nên khi biến môi trường được thêm thì lần gọi sau vẫn xử lý được.
1. Chữ ký sai, hoặc `vnp_TmnCode` khác cấu hình → `{"RspCode":"97","Message":"Invalid signature"}`.
2. Không tìm thấy `Payment` theo `vnp_TxnRef` → `01`.
3. `vnp_Amount` khác `Payment.amount * 100` → `04`.
4. Mở transaction, khóa `orders ... FOR UPDATE` rồi đọc lại đúng `Payment` và `Order`:
   - `Payment.status` khác `PENDING`, hoặc đơn không còn `PENDING` → `02 Order already confirmed`, không đổi đơn hay kho.
   - Nếu IPN báo thành công (`vnp_ResponseCode=00` và `vnp_TransactionStatus=00`) nhưng `Payment` đã `FAILED` (kể cả `EXPIRED`), đơn đã `CANCELLED`, hoặc đơn đã trả bằng payment khác: ghi **warning** `PAYMENT_RECONCILIATION_REQUIRED` kèm `vnp_TxnRef` để nhân viên đối soát/hoàn tiền tay. IPN lặp của chính `Payment SUCCESS` trên đơn `PAID`/đang pha/đã hoàn tất chỉ trả `02`, không cảnh báo nhầm.
   - `expiresAt` đã qua nhưng `Payment` và đơn vẫn `PENDING` thì vẫn nhận thành công; không tự loại IPN chỉ vì đồng hồ đã quá hạn.
5. `vnp_ResponseCode = 00` **và** `vnp_TransactionStatus = 00`:
   - `Payment` → `SUCCESS`, lưu hai mã response/status, `vnp_TransactionNo`, `vnp_BankCode`, `vnp_PayDate`;
   - chỉ khi `order.inventoryTracked` thì gọi `inventory.settle(tx, orderId, true)`, giống code hiện tại. Đơn cũ (`inventoryTracked = false`) không có snapshot nguyên liệu; gọi `settle` sẽ ném `INVENTORY_SNAPSHOT_MISSING`;
   - `Order` → `PAID`.
6. IPN xác nhận thất bại cuối cùng (`vnp_TransactionStatus=02`, `vnp_ResponseCode` khác `00`/`07`):
   - `Payment` → `FAILED`, lưu riêng `vnp_ResponseCode` và `vnp_TransactionStatus`;
   - `Order` → `PAYMENT_FAILED`. Nguyên liệu vẫn giữ, khớp FR-15 hiện tại: khách thử lại hoặc hủy để nhả.
7. Sau khi commit bước 5 hoặc 6, trả `00 Confirm Success`. Nếu trạng thái còn `01`, thuộc nhóm đảo/hoàn tiền/nghi ngờ (`04`/`05`/`06`/`07`/`09`), mã chưa hỗ trợ hoặc hai mã mâu thuẫn: không đổi DB, trả `99`; ghi warning khi có dấu hiệu đã trừ tiền. Lỗi bất ngờ cũng trả `99`. VNPay quy định tối đa 10 lần gọi IPN, cách 5 phút.

Bước 4–6 nằm trong một hàm `applyGatewayResult(tx, paymentId, result)`. Caller mở transaction và giữ khóa đơn; hàm đọc lại payment, bảo vệ trạng thái cuối và cập nhật payment/đơn/kho cùng transaction. IPN và QueryDR chuẩn hóa mã theo từng giao thức trước khi gọi hàm; không chuyển một lỗi QueryDR thành kết quả thanh toán thất bại. Cảnh báo tiền đến sau trạng thái cuối cũng áp dụng nếu phát hiện qua QueryDR.

### 1.4 Thay đổi mô hình dữ liệu

- `PaymentStatus`: thêm `PENDING`.
- `Payment` thêm các cột:
  - `provider String @default("VNPAY")`;
  - `paymentUrl String?`, `expiresAt DateTime?`;
  - `gatewayCreateDate String?` (đúng chuỗi `vnp_CreateDate` đã ký, mục 1.1);
  - `gatewayTxnNo String?`, `gatewayResponseCode String?`, `gatewayTransactionStatus String?`, `bankCode String?`, `paidAt DateTime?`.
  - Lưu riêng hai mã gateway: QueryDR có thể trả `gatewayResponseCode="00"` nhưng `gatewayTransactionStatus="02"` và `Payment.status=FAILED`. UI lấy trạng thái DB làm chuẩn; không hiển thị thành công chỉ dựa vào response code. `EXPIRED` là mã nội bộ chỉ dùng cho nhánh `91` sau hạn ở mục 1.6.
- Partial unique index bằng SQL thô: `CREATE UNIQUE INDEX "payments_one_pending_per_order" ON "payments" ("orderId") WHERE "status" = 'PENDING'`. Index chặn hai bản ghi `Payment PENDING` cho một đơn; kết hợp khóa đơn và đối soát trước retry để hạn chế thu trùng. Trường hợp tiền đến sau khi đóng payment vẫn phải xử lý cảnh báo như mục 1.3. Cột tên là `"orderId"`: model `Payment` không dùng `@map` cho field, đã kiểm trong `20261021000000_sprint2/migration.sql`.
- **Tách hai migration:**
   1. `apps/api/prisma/migrations/20261029100000_vnpay_payment_enum/migration.sql`: `ALTER TYPE "PaymentStatus" ADD VALUE 'PENDING'`, thêm các cột mới và gán provider cho hàng cũ.
   2. `apps/api/prisma/migrations/20261029100001_vnpay_pending_index/migration.sql`: tạo partial index.

  Lý do tách: PostgreSQL không cho dùng giá trị enum vừa thêm trước khi transaction thêm enum commit (lỗi `unsafe use of new value`). Khi script nhiều lệnh được gửi trong một Simple Query, cả file chạy như một transaction ngầm; không dựa vào giả định Prisma luôn tự bọc migration. File enum phải hoàn tất trước file dùng enum trong index. [Quy tắc enum](https://www.postgresql.org/docs/16/sql-altertype.html#SQL-ALTERTYPE-NOTES), [transaction của script](https://www.postgresql.org/docs/16/protocol-flow.html#PROTOCOL-FLOW-MULTI-STATEMENT)
- Expand-only: không bỏ cột nào. Giữ trạng thái các `Payment` cũ (`SUCCESS`/`FAILED`); migration gán `provider="SIMULATOR"` cho các hàng cũ, mặc định `VNPAY` chỉ áp dụng cho giao dịch tạo mới. Không QueryDR các payment cũ.

### 1.5 Hợp đồng API mới

- **`POST /payments`** (Customer, bắt buộc `Idempotency-Key`), body `{ orderId, paymentMethod }`. **Bỏ `cardNumber`**: thẻ chỉ nhập trên trang VNPay. Thứ tự bắt buộc:
  1. Kiểm input, xác thực và quyền sở hữu **trước** mọi QueryDR hoặc cập nhật DB. Giữ lỗi 400/401/403/404 hiện có.
  2. Có `SUCCESS` cùng chủ đơn/`orderId`/key/`paymentMethod` (BR-05) → 200 replay như cũ: `{ paymentId, orderId, orderStatus: "PAID", amount, status: "SUCCESS" }`, trước khi xét trạng thái đơn.
  3. Đơn không ở `PENDING`/`PAYMENT_FAILED` → 409 `ORDER_NOT_PAYABLE`.
  4. Có `Payment PENDING` quá hạn → đối soát theo mục 1.6 bên ngoài transaction chính. Sau đó khóa đơn, đọc lại và **xét replay SUCCESS trước lần nữa**. Cùng key và phương thức vừa được xác nhận thành công vẫn trả 200; yêu cầu khác mới trả 409 `ORDER_NOT_PAYABLE`.
  5. Đã có `Payment PENDING` còn hạn, cùng `paymentMethod` → 200, trả nguyên URL/thời hạn cũ dù key mới. Khác phương thức → 409 `PAYMENT_IN_PROGRESS`. Payment quá hạn chưa kết luận được thì giữ `PENDING`, không trả URL hết hạn và không tạo URL mới (mục 1.6).
  6. Chỉ khi cần tạo URL mới mới kiểm cấu hình tạo URL theo mục 1.8 và ký; thiếu cấu hình hoặc lỗi ký → 502 `PAYMENT_PROVIDER_ERROR`, không tạo `Payment`, không đổi trạng thái đơn. **Hai nhánh replay không cần ký lại hay kiểm cấu hình gateway.**
  7. Trong cùng transaction giữ khóa đơn, tạo `Payment PENDING` và chuyển `Order PAYMENT_FAILED` → `PENDING` nếu đang thử lại. Không `reserve` lại. Trả 201 `{ paymentId, orderId, orderStatus: "PENDING", amount, status: "PENDING", paymentUrl, expiresAt }`; replay PENDING trả cùng hình dạng bằng HTTP 200. `expiresAt` là chuỗi ISO 8601.
  - Mọi nhánh tạo/replay phải đọc lại dưới khóa đơn, giữ cơ chế serialize hiện có. Nếu có payment khác xuất hiện trong khoảng giữa đối soát và transaction chính, xét lại payment hiện tại; không gọi HTTP trong lúc giữ khóa, không ghi đè trạng thái cuối.
  - **Không còn 402 từ endpoint này.** Thất bại đến qua IPN hoặc QueryDR (đơn chuyển `PAYMENT_FAILED`).
- **`GET /payments/vnpay/ipn`** (công khai, chỉ VNPay gọi): trả JSON `RspCode` theo mục 1.3, luôn HTTP 200.
- **`GET /payments/vnpay/return?<vnp_*>`** (công khai, không ghi DB): kiểm chữ ký và `vnp_TmnCode`, rồi đọc payment để trả `{ valid: true, paymentId, orderId, responseCode }`. Sai chữ ký, sai merchant, không tìm thấy payment hoặc thiếu cấu hình xác minh → `{ valid: false }`, không trả ID lấy từ query chưa xác thực. Web chỉ được dùng đơn lưu trong phiên của chính khách để phục hồi khi `valid: false`.
- **`POST /payments/:id/sync`** (Customer chủ đơn): kiểm quyền với payment và đơn trước; không có payment → 404 `PAYMENT_NOT_FOUND`, sai chủ/role → 403, chưa đăng nhập → 401. Payment đã `SUCCESS`/`FAILED` → 200 `{ paymentId, orderId, orderStatus, status }` từ DB, không QueryDR, không đòi cấu hình gateway. Còn `PENDING` thì QueryDR và áp bảng mục 1.6, kể cả chưa hết hạn. Thành công/thất bại đã xác định → 200 cùng hình dạng; đang xử lý → 409 `PAYMENT_IN_PROGRESS`; lỗi provider → 502 `PAYMENT_PROVIDER_ERROR`.
- **`PATCH /orders/:id` hủy đơn:** có `Payment` `PENDING` còn hạn → 409 `PAYMENT_IN_PROGRESS`, tránh trường hợp khách vừa trả tiền vừa hủy. `PENDING` đã quá hạn → xử lý theo mục 1.6 trước, rồi mới xét hủy.
- **`GET /orders/:id`** (giữ guard và quyền hiện có): mỗi phần tử `payments` thêm `paymentUrl`, `expiresAt`, `gatewayResponseCode`, `gatewayTransactionStatus` (nullable) để tiếp tục thanh toán và hiển thị kết quả. Danh sách `GET /orders/me` giữ nguyên; kiểm tra payment ở trang chi tiết. Không trả secret, chữ ký, fingerprint hay idempotency key.

### 1.6 Đối soát QueryDR và `Payment PENDING` quá hạn

Áp dụng ở ba chỗ: `POST /payments`, hủy đơn và `sync`. Quá hạn nghĩa là `now >= expiresAt`; `expiresAt` phải cùng thời điểm với `vnp_ExpireDate` đã ký. Hết hạn không có nghĩa là không thu tiền, vì khách có thể trả sát giờ mà IPN tới muộn, nên phải hỏi VNPay trước khi kết luận. `resolveExpired(orderId)` chỉ đối soát payment quá hạn; `sync` dùng cùng cách đọc QueryDR cho payment còn hạn.

1. Sau kiểm quyền, lấy đúng `paymentId`, `gatewayCreateDate`, amount và thời hạn. Gọi QueryDR **bên ngoài** DB transaction; thiếu `gatewayCreateDate` hoặc cấu hình truy vấn thì coi là lỗi provider, không đoán ngày từ `createdAt`.
2. Kiểm chữ ký phản hồi, merchant và mã tham chiếu khớp request. Với response `00`, kiểm thêm số tiền bằng `Payment.amount * 100` và `vnp_TransactionType=01`. Phản hồi thiếu/sai dữ liệu xác thực không được dùng để đóng payment, kể cả có mã `91`.
3. Dù nhận kết quả hay lỗi, mở transaction, khóa đơn, đọc lại **đúng payment đã hỏi**. Nếu IPN đã xử lý trong lúc chờ, không ghi đè bằng kết quả cũ hay trả lỗi cũ thay cho trạng thái DB; xét cảnh báo tiền đến muộn theo mục 1.3. Không áp kết quả payment cũ lên một lần thử mới.
4. Nếu payment vẫn `PENDING`, phân biệt **response code của truy vấn** và **transaction status của thanh toán**:

   | `vnp_ResponseCode` | `vnp_TransactionStatus` | Xử lý |
   | --- | --- | --- |
   | `00` | `00` | Áp `SUCCESS`, đơn → `PAID`, trừ kho đúng một lần nếu `inventoryTracked`. |
   | `00` | `01` | Chưa hoàn tất: giữ `PENDING`, trả 409 `PAYMENT_IN_PROGRESS`, kể cả đã quá hạn, trong giới hạn điều kiện kết thúc chốt ở bước 1; đơn không được kẹt vĩnh viễn. |
   | `00` | `02` | Thất bại cuối cùng: áp `FAILED`, đơn → `PAYMENT_FAILED`; lưu riêng response `00` và status `02`, không gắn nhãn `EXPIRED`. |
   | `91` | Không dùng | Chỉ khi đã quá hạn và phản hồi đã xác thực: áp `FAILED`, `gatewayResponseCode="EXPIRED"`, đơn → `PAYMENT_FAILED`. Nếu còn hạn thì giữ `PENDING`, trả 409 `PAYMENT_IN_PROGRESS`. |
   | `00` | `04`/`05`/`06`/`07`/`09`, thiếu hoặc mã chưa hỗ trợ | Giữ `PENDING`, trả 502 `PAYMENT_PROVIDER_ERROR`, ghi warning để đối soát nếu có dấu hiệu trừ/hoàn tiền. |
   | Mọi mã khác (`02`/`03`/`94`/`97`/`99`...) | Không dùng | Lỗi truy vấn: trả 502 `PAYMENT_PROVIDER_ERROR`, không đổi DB. |

   Lỗi mạng, timeout, chữ ký sai hoặc thiếu cấu hình cũng trả 502, không đổi DB. Quyết định giữ `PENDING` với nhóm mã đặc biệt là chính sách an toàn của ứng dụng: bảng VNPay có cả giao dịch đảo/đang hoàn tiền/nghi ngờ, nên không gom mọi status khác `00` thành thất bại cho phép thu lại. [Quy tắc và mã QueryDR](https://sandbox.vnpayment.vn/apis/docs/truy-van-hoan-tien/querydr%26refund.html)

5. Sau đối soát: `POST /payments` **xét replay BR-05 trước** rồi mới xét tạo giao dịch mới; hủy đơn chỉ tiếp tục nếu đơn còn hủy được và không còn payment chưa kết luận. Hủy nhả nguyên liệu nếu `inventoryTracked`, còn đơn cũ giữ nhánh trả `Product.stock` hiện có. `sync` trả trạng thái hiện tại. Không nhả nguyên liệu chỉ vì payment `FAILED`/`EXPIRED`.

### 1.7 Ánh xạ mã lỗi VNPay ra thông báo cho khách

- `24`: khách hủy giao dịch.
- `11`: hết thời gian thanh toán.
- `51`: tài khoản không đủ số dư.
- `13`: sai OTP.
- `09`, `10`, `12`, `79`: lỗi thẻ hoặc tài khoản.
- Mã còn lại: "Thanh toán không thành công".

Chỉ hiển thị thất bại và cho thử lại/hủy sau khi trạng thái DB đã xác nhận `PAYMENT_FAILED`. Với `PENDING`/lỗi đối soát, hiển thị "Đang xác minh thanh toán, vui lòng kiểm tra lại"; không khuyên trả lần hai. Mã trên return chỉ là thông báo tham khảo, không được lấn át trạng thái DB. QueryDR không cung cấp lại mã từ chối gốc như IPN thì dùng thông báo thất bại chung.

### 1.8 Cấu hình và trạng thái thiếu cấu hình

- **Biến bắt buộc để đủ chức năng:** `VNP_TMN_CODE`, `VNP_HASH_SECRET`, `WEB_URL`. Kiểm theo thao tác, không gom thành một cờ tắt toàn bộ:
  - tạo URL mới: cần cả ba biến;
  - IPN, kiểm return và QueryDR: chỉ cần `VNP_TMN_CODE`, `VNP_HASH_SECRET`; không cần `WEB_URL`;
  - replay, đọc trạng thái DB và `/health`: không cần biến VNPay.
- **Biến có mặc định:** URL sandbox công khai, không phải secret.
  - `VNP_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html`;
  - `VNP_API_URL=https://sandbox.vnpayment.vn/merchant_webapi/api/transaction`.
- **`PAYMENT_PROVIDER`:** mặc định `vnpay`. `fake` là phần Could hoãn theo D4; chỉ hỗ trợ nếu được yêu cầu triển khai riêng, không đăng ký endpoint fake khi chạy `vnpay`. Cố bật `fake` khi chưa triển khai, giá trị không hỗ trợ, hoặc `fake` với `NODE_ENV=production` → dừng khởi động. **Không tự chuyển sang `fake`** khi thiếu biến VNPay.
- **Thiếu biến cho thao tác:** API vẫn khởi động để Docker/local chạy các chức năng không cần cổng thanh toán mà không phải phát secret cho mọi thành viên. Endpoint cần biến nào mới kiểm biến đó: tạo URL mới/QueryDR thiếu biến → 502; IPN thiếu biến → `99`, không đọc/ghi DB; return thiếu biến → `valid: false`. Các nhánh replay và đọc trạng thái vẫn hoạt động.
- **Cảnh báo lúc khởi động:** một dòng, **chỉ ghi tên biến thiếu**, ví dụ `VNPay configuration incomplete: missing VNP_HASH_SECRET, WEB_URL`. Không in giá trị của bất kỳ biến nào.
- **`/health` giữ nguyên** `{ status, database }` theo SRS §1.4 thay đổi (7), không thêm trường trạng thái cổng thanh toán.
- **Điều kiện phát hành:** biến trên Render phải được lưu **trước lần deploy đầu tiên chứa code thay simulator bằng VNPay** (bước 0.4); API vẫn khởi động khi thiếu biến không thay thế điều kiện này. `cd.yml` hiện có push ở nhánh delivery, tag `a2-v*` và chạy tay; không suy luận push nhánh payment sẽ tự deploy.

---

## 2. Quyết định của bản final

- **D1 – Nền nhánh và đích PR.** Dùng code `jumbo` (`51f5330`) làm nền vì payment cần `inventory.settle`. Tại lần rà này, `a2/payment-vnpay` ở `73a6ccb`, không có commit riêng và fast-forward được; file kế hoạch chưa được Git theo dõi phải được giữ lại. Khi được yêu cầu triển khai, kiểm lại trạng thái trước khi fast-forward. **PR nhắm `jumbo`**; nếu `jumbo` đã được tích hợp thì xác nhận đích với orchestrator trước khi đổi. Không tự merge vào `develop-Assignment2`.
- **D2 – Ánh xạ phương thức.** `CARD` → `vnp_BankCode=VNBANK`; `WALLET` → bỏ `vnp_BankCode`, cho khách chọn trên VNPay. Đây là lựa chọn hiển thị trang gateway, không bảo đảm khách chọn đúng một loại thẻ/ví ở gateway; `Payment.method` giữ lựa chọn trên BrewLite để replay. Luồng nghiệm thu dùng thẻ NCB test; khả năng chọn NCB ở cả hai nhánh phải được spike xác nhận, không phụ thuộc QR/app test.
- **D3 – Unit test tối thiểu (người dùng chốt ngày 2026-10-29).** Thêm lại **một** file `apps/api/test/vnpay.test.ts`. Quyết định này đảo một phần việc xóa toàn bộ test trên `jumbo` (`.github/workflows/README.md`), không khôi phục suite cũ. Các ca khác ở bước 7 vẫn **bắt buộc chạy và lưu bằng chứng** bằng thao tác sandbox/local.
  - Phạm vi: hàm thuần của `vnpay.ts` (ký URL, kiểm chữ ký return/IPN, chuỗi ký QueryDR request/response, đọc/ghi ngày GMT+7) và hàm thuần ánh xạ bảng mục 1.6. Không DB, không mạng, không secret thật; race IPN/`sync`, partial index và bất biến kho vẫn kiểm ở bước 7.7.
  - Chữ ký mong đợi tính **độc lập** bằng `openssl dgst -sha512 -hmac` với secret giả, ghi lệnh tính trong comment của test; không lấy kết quả từ chính code đang test.
  - Chạy `node --import tsx --test test/vnpay.test.ts` từ `apps/api`: `node:test` có sẵn trong Node 22, `tsx` đã có. Không thêm dependency, không thêm script vào `package.json`, không sửa CI hay `tsconfig*` ở bản này.
  - Đặt ngoài `src/` vì `tsconfig.build.json` biên dịch mọi `src/**/*.ts` vào `dist/` và image. Đổi lại, lint và typecheck không phủ file test (`tsx` không kiểm kiểu); chấp nhận ở mức tối thiểu.
  - Không lấp NFR-12/NFR-17 (E2E tự động, CI) ở bản này; ghi rõ khoảng trống đó trong bàn giao. Cách E2E đạt `AC-N12.1` đã chốt ngày 2026-10-29: test đóng vai VNPay (chặn redirect, ký IPN bằng secret giả của môi trường test), không trả tiền trên sandbox. Test E2E và CI chỉ viết khi được giao riêng.
- **D4 – Cổng giả.** Hoãn khỏi bản triển khai này (Could). Docker vẫn khởi động được khi thiếu secret, nhưng thao tác thanh toán cần VNPay theo mục 1.8; demo mất mạng dùng video đã quay. Nếu sau này được yêu cầu làm fake, chỉ bật rõ trong local không phải production và kiểm riêng handler fake; không tự đưa endpoint hoàn tất thanh toán vào bản này. Image Docker hiện đặt `NODE_ENV=production`, nên không coi fake là phương án mặc định của image đó.
- **D5 – Hạn thanh toán.** 15 phút cho `vnp_ExpireDate` và `expiresAt`, cùng một mốc thời gian. Chưa có job tự hết hạn đơn: nguyên liệu vẫn giữ tới khi thanh toán thành công hoặc khách hủy hợp lệ; không hứa tự nhả kho sau 15 phút.

---

## 3. Lộ trình

### Bước 0 – Chuẩn bị (người dùng hoặc người phụ trách thực hiện)

- [ ] 0.1 Ghi nhận D1–D5; trước mỗi pha xác nhận task owner và allowed paths. Chỉ sửa code khi người dùng giao rõ; bước chốt kế hoạch này không cấp quyền triển khai.
- [ ] 0.2 Khi được giao triển khai, kiểm root/branch/status/dependency, rồi fast-forward bằng `git merge --ff-only jumbo` **từ worktree payment-vnpay** theo D1. Giữ nguyên file chưa commit; nếu không còn fast-forward được thì báo orchestrator, không reset hay tự lấy file từ worktree khác.
- [ ] 0.3 Ghi secret vào `apps/api/.env` (local, không commit):
  - bắt buộc: `VNP_TMN_CODE`, `VNP_HASH_SECRET`, `WEB_URL=http://localhost:3000`;
  - không bắt buộc (đã có mặc định, mục 1.8): `VNP_URL`, `VNP_API_URL`, `PAYMENT_PROVIDER`.

  Kiểm bằng `git check-ignore -v apps/api/.env`.
- [ ] 0.4 Thành viên giữ tài khoản Render thêm cùng các biến vào service `brewlite-a2-api`, với `WEB_URL=https://brewlite-a2-web.vercel.app`. Gửi secret cho người đó qua kênh riêng, không qua nhóm chat chung, issue hay PR. **Phải lưu biến trước lần deploy đầu tiên chứa code VNPay thay simulator**, không đợi tới bước 7.5. Người phụ trách deploy xác nhận điều kiện này trước khi phát hành.
- [ ] 0.5 Gửi VNPay IPN URL: `https://brewlite-a2-api.onrender.com/payments/vnpay/ipn` (vào Merchant Admin, hoặc trả lời email kết nối).

### Bước 1 – Spike (script ngoài repo, trong scratchpad)

- [ ] 1.1 Script Node một file: ký URL cho 10.000 VND, mở trình duyệt, trả bằng thẻ NCB test. Thông tin thẻ là dữ liệu công khai trong email sandbox, không đưa vào repo.
- [ ] 1.2 Kiểm chữ ký của tham số trả về trên returnUrl. Thử cả `vnp_OrderInfo` có khoảng trắng để chốt bẫy encode ở mục 1.2.
- [ ] 1.3 Gọi QueryDR, kiểm chữ ký phản hồi và ghi riêng **cả** `vnp_ResponseCode` lẫn `vnp_TransactionStatus` cho các trường hợp:
  - vừa trả thành công;
  - URL đã tạo nhưng **chưa từng mở**, trước và sau thời hạn thật đã ký;
  - URL đã mở nhưng chưa nhập thẻ/OTP, trước và sau thời hạn thật đã ký. Nếu sau hạn vẫn `01`, hỏi lại sau hạn thêm khoảng 15 và 60 phút, và thử trả tiếp trên trang đã mở để biết VNPay có từ chối sau `vnp_ExpireDate` không;
  - khách đã hủy trên VNPay.

  Ghi tuple merchant/TxnRef/`gatewayCreateDate` đã dùng, trường nào vắng mặt ở response lỗi, và khả năng xác thực response `91`; không suy đoán URL đã mở nhưng chưa trả sẽ nhận `01` hay `91`. Thử lại có kiểm soát để biết giới hạn `94`, không gọi dồn trong vòng lặp.
- [ ] 1.4 Thử một giao dịch bấm "Hủy" để thấy `vnp_ResponseCode=24`. Ghi cả `vnp_TransactionStatus` trên return (cùng bộ tham số `vnp_*` với IPN) để chốt điều kiện thất bại ở bước 6 mục 1.3, vì IPN không quan sát được ở local.
- [ ] 1.5 Ghi kết quả (không có secret) vào `docs/payment-vnpay-spike.md`: tham số mẫu đã che chữ ký, các mã đã thấy, chỗ lệch so với tài liệu.

**Điều kiện qua:** chữ ký URL được VNPay chấp nhận, chữ ký return và QueryDR kiểm đúng; có bằng chứng các ca QueryDR ở 1.3. Nếu sandbox khác bảng xử lý mục 1.6 hoặc `91` không xác thực được, dừng pha code liên quan để sửa hợp đồng, không bỏ kiểm chữ ký hay tự cho retry. Không cần chờ tài khoản Render để chạy spike local.

Mọi ca bỏ dở phải kết thúc trong thời gian hữu hạn. Nếu `00/01` kéo dài sau hạn, chốt một trong hai cách trước pha code và sửa mục 1.6:

- `01` sau `expiresAt` cộng khoảng chờ đã đo → `FAILED EXPIRED`, chỉ khi spike chứng minh VNPay từ chối trả sau `vnp_ExpireDate`;
- thao tác nhân viên đóng payment sau khi tra Merchant Admin.

Không để đơn vừa không trả tiếp được vừa không hủy được.

### Bước 2 – Tài liệu Task 1 (agent soạn nháp)

- [ ] 2.1 `docs/requirements/srs.md`:
  - **§1.4:** thêm ghi chú "VNPay sandbox (2026-10-29)" ghi lý do (yêu cầu giảng viên); thay rủi ro mất kết quả simulator bằng cơ chế IPN/QueryDR và các rủi ro còn lại ở mục 4. Giữ số các thay đổi cũ; không tái dùng mã AC-F16.7/E8b đã bỏ.
  - **§2.1/§2.3:** đổi "Payment Service" thành "VNPay sandbox", kiểu actor hệ thống ngoài.
  - **§3.1, §3.2:** thêm 3 endpoint mới và trường mới của chi tiết đơn theo mục 1.5; thêm `PAYMENT_IN_PROGRESS`, `PAYMENT_PROVIDER_ERROR`, `PAYMENT_NOT_FOUND`; bỏ 402 khỏi `POST /payments`.
  - **§3.4:** viết lại thành "Quy ước VNPay sandbox": thẻ NCB test, mã `24`/`51`, hạn 15 phút, không lưu số thẻ.
  - **BR-05:** viết lại theo thứ tự replay `SUCCESS`/`PENDING` ở mục 1.5; replay không cần cấu hình ký URL mới, `FAILED` không khóa key.
  - **BR-10:** tối đa một `Payment PENDING` cho mỗi đơn, chưa xác định kết quả thì không mở lần thử mới.
  - **BR-11:** chỉ IPN/QueryDR đã xác thực được quyết định kết quả cuối; return chỉ hiển thị. Tạo `PENDING` và thử lại vẫn theo BR-05/mục 1.5. BR-10/BR-11 chưa được dùng trong SRS của nền `jumbo` ở lần rà này.
  - **FR-14/15/16:** viết lại AC:
    - tạo URL;
    - thiếu biến cho thao tác tạo URL/QueryDR → 502 `PAYMENT_PROVIDER_ERROR`; replay vẫn 200; IPN thiếu secret/merchant trả `99`, không đọc/ghi DB; thiếu riêng `WEB_URL` không chặn IPN/QueryDR/return; `/health` vẫn theo trạng thái DB;
    - thử lại từ `PAYMENT_FAILED` → đơn về `PENDING`, không giữ thêm nguyên liệu;
    - `PENDING` quá hạn khi tạo thanh toán mới hoặc hủy đơn (mục 1.6);
    - IPN thành công và thất bại; IPN thành công tới sau `FAILED EXPIRED`/hủy đơn → `02` và warning đối soát;
    - chữ ký sai (97), sai số tiền (04), IPN lặp (02);
    - QueryDR khi thiếu IPN; tách response code/status theo bảng mục 1.6, gồm `00/01`, `91`, `94`/`99` và nhóm trạng thái đặc biệt;
    - hủy khi đang `PENDING`.
  - **FR-31:** giữ Won't nhưng đổi nghĩa thành "cổng production thật" (sandbox không thu tiền thật).
  - **NFR bảo mật:** thêm `VNP_HASH_SECRET` vào danh sách secret; IPN bắt buộc HTTPS.
  - **S6 stakeholder:** VNPay.
- [ ] 2.2 `docs/requirements/context-and-scope.md`: hệ thống ngoài VNPay; viết lại A-01; thêm rủi ro: Render ngủ làm IPN timeout (đã có QueryDR và VNPay gọi lại), sandbox VNPay bảo trì, hết hạn đơn.
- [ ] 2.3 `docs/requirements/uc-checkout.md` và `.puml`: viết lại các bước thanh toán (redirect → trả trên VNPay → IPN → return); thêm luồng E cho hủy trên VNPay, sai chữ ký, mất IPN.
- [ ] 2.4 `docs/requirements/use-case-overview.puml`: đổi tên actor. Nhóm cập nhật `.svg` bằng draw.io.

### Bước 3 – Sơ đồ Task 2 (agent soạn nháp)

- [ ] 3.1 `docs/diagrams/sequence-checkout.puml`: thêm participant Browser, VNPay; ba đoạn: tạo URL, IPN, return/poll; `alt` cho thành công / thất bại / chữ ký sai; `opt` QueryDR.
- [ ] 3.2 `docs/diagrams/activity-checkout.puml`: thêm swimlane VNPay, nhánh hủy hoặc hết hạn.
- [ ] 3.3 `docs/diagrams/state-order.puml`: đơn vẫn `PENDING` trong lúc chờ VNPay; thử lại `PAYMENT_FAILED` → `PENDING`; ghi chú hủy bị chặn khi có payment còn hạn hoặc quá hạn nhưng chưa đối soát xong. Ghi vòng đời `Payment PENDING` → `SUCCESS`/`FAILED` trong cùng tài liệu, không thêm trạng thái `EXPIRED` vào enum.
- [ ] 3.4 `docs/diagrams/class-domain.puml`: thêm cột mới của `Payment` và `PaymentStatus.PENDING`.
- [ ] 3.5 Render PlantUML ra thư mục tạm, 0 lỗi "Syntax Error". Ảnh `.svg` trong repo do nhóm xuất.

### Bước 4 – Kiến trúc Task 3 (agent soạn nháp)

- [ ] 4.1 ADR-007 "Tích hợp VNPay sandbox", gồm:
  - bối cảnh;
  - phương án: giữ simulator / VNPay redirect + IPN / Stripe test;
  - quyết định: redirect + IPN + QueryDR;
  - hệ quả: bất đồng bộ, secret, Render ngủ; API khởi động được khi thiếu cấu hình để chạy Docker/chức năng khác; cấu hình kiểm theo thao tác ở mục 1.8, không tự chuyển sang cổng giả; quyết định đối soát và warning tiền tới muộn.
- [ ] 4.2 ADR-005: sửa phần idempotency theo BR-05 mới và partial unique index.
- [ ] 4.3 `docs/architecture/architecture.md` và `deployment.puml`: thêm VNPay là hệ thống ngoài, luồng HTTPS ra/vào, biến môi trường.
- [ ] 4.4 `docs/deployment.md`: bảng biến môi trường Render, không ghi giá trị credential; đánh dấu biến bắt buộc theo thao tác và biến có mặc định (mục 1.8). Thêm điều kiện lưu biến Render trước deploy VNPay, đăng ký IPN URL và hướng dẫn đối soát/hoàn tiền tay theo `vnp_TxnRef`. Ghi rõ Docker không có secret vẫn chạy chức năng khác nhưng không demo trả tiền offline.
- [ ] 4.5 `docs/traceability-matrix.md`: thêm FR/BR mới → sơ đồ → ADR-007 → file code.

### Bước 5 – Code API (chỉ khi người dùng yêu cầu)

- [ ] 5.1 `apps/api/prisma/schema.prisma` và **hai** migration theo mục 1.4: enum và cột trước, partial index sau. Chạy `prisma migrate dev` trên DB local, `prisma validate`. Kiểm index bằng `\d payments` trong `psql`.
- [ ] 5.2 `apps/api/src/payment/vnpay.ts`: chỉ chứa hàm thuần, không phụ thuộc Nest:
  - `buildPaymentUrl`, `verifyReturn`;
  - `buildQueryDr`, `verifyQueryDrResponse`;
  - `formatVnDate` và `parseVnDate` (GMT+7);
  - hàm ánh xạ `(vnp_ResponseCode, vnp_TransactionStatus, đã quá hạn)` ra hành động theo bảng mục 1.6;
  - test `apps/api/test/vnpay.test.ts` theo D3, viết và chạy đỏ trước khi viết hàm.
- [ ] 5.3 `apps/api/src/payment/payment-gateway.ts`: triển khai `VnpayGateway` với `createUrl` và `query`, tách HTTP/cấu hình khỏi hàm ký thuần. `query` trả riêng response code, transaction status và metadata đã xác thực, không gộp thành boolean thành công/thất bại. Không làm `FakeGateway`/endpoint fake ở bản này (D4).
- [ ] 5.4 `apps/api/src/checkout/checkout.service.ts`:
  - `pay()` bỏ `simulatePayment` và việc trừ kho đồng bộ; đi đúng thứ tự mục 1.5. Tạo `Payment PENDING` lưu `gatewayCreateDate`, `expiresAt`, `paymentUrl` cùng transaction đổi đơn `PAYMENT_FAILED` → `PENDING`; chỉ kiểm cấu hình ký khi tạo URL mới;
  - thêm `applyGatewayResult(tx, paymentId, result)` theo mục 1.3, chỉ `settle` khi `order.inventoryTracked`, ghi warning khi tiền tới sau trạng thái cuối. `pay()` có thể gián tiếp trừ kho nếu đối soát phát hiện payment cũ đã thành công;
  - thêm `resolveExpired(orderId)` theo mục 1.6. Sau kiểm quyền, `pay()`, nhánh **hủy** của `transition()` và `sync` dùng đối soát khi cần; HTTP luôn ngoài transaction giữ khóa. `sync` còn xử lý payment chưa hết hạn theo cùng bảng; không QueryDR trong các chuyển pha chế;
  - `transition()` khóa đơn và kiểm lại payment sau đối soát trước khi hủy/nhả kho; giữ nhánh đơn cũ `inventoryTracked=false`;
  - `detail()` trả thêm trường payment đã đặc tả ở mục 1.5; không sửa contract danh sách đơn.
- [ ] 5.5 Tạo `apps/api/src/payment/vnpay.controller.ts` (không có guard) cho `ipn`, `return`; thêm `sync` vào `apps/api/src/checkout/checkout.controller.ts` có guard. Đăng ký controller mới và provider `VnpayGateway` trong `apps/api/src/checkout/checkout.module.ts`; giữ guard chỉ trên controller cần đăng nhập, không tạo thêm module riêng.
- [ ] 5.6 Đọc cấu hình theo mục 1.8: thiếu biến thì API **vẫn khởi động** để Docker/local chạy chức năng khác mà không cần secret, ghi một dòng cảnh báo chỉ gồm tên biến thiếu. Kiểm cấu hình theo từng thao tác; không dùng `WEB_URL` để chặn IPN/QueryDR/return. Giá trị provider không hỗ trợ hoặc fake trong production thì dừng khởi động. Không sửa kiểm `JWT_SECRET` hoặc `HealthController`.
- [ ] 5.7 Xóa `apps/api/src/checkout/payment.ts`. Cập nhật `.env.example` (Compose) và `apps/api/.env.example` (API local), credential để rỗng; cập nhật `docker-compose.yml`, `compose.demo.yml` để truyền biến VNPay tùy chọn vào runtime. Không bake secret vào image/build args và không bắt Compose có secret mới khởi động được. Sửa câu "bộ test đã xóa" ở `.github/workflows/README.md` và `docs/inventory-verification.md` thành: chỉ còn unit test VNPay tối thiểu theo D3.
- [ ] 5.8 Không log toàn bộ query IPN, payment URL hoặc payload QueryDR. Log vận hành chỉ gồm mã sự kiện, `vnp_TxnRef`, `vnp_ResponseCode`, `vnp_TransactionStatus`, `RspCode` nếu có; warning đối soát phải giữ `vnp_TxnRef` để nhân viên tra Merchant Admin. Không log secret/chữ ký/số thẻ.

### Bước 6 – Code web (chỉ khi người dùng yêu cầu)

- [ ] 6.1 `apps/web/src/components/shop/CheckoutScreen.tsx`:
  - bỏ ô số thẻ;
  - nút "Thanh toán qua VNPay";
  - nhận `paymentUrl`, lưu `{ orderId, key, paymentId, paymentMethod }` trong `sessionStorage` của phiên checkout rồi `window.location.assign(paymentUrl)`;
  - giữ `Idempotency-Key` khi retry; không xóa giỏ hay phiên checkout ngay khi tạo/replay URL;
  - xử lý replay `SUCCESS` mà không redirect URL; chỉ khi DB xác nhận đơn đã trả (`PAID`/`PREPARING`/`READY`/`COMPLETED`) mới xóa checkout của đúng đơn và giỏ liên quan;
  - thay nhánh 402: gặp 409 thì đọc lại chi tiết đơn. Có payment `PENDING` còn hạn thì hiện "Tiếp tục thanh toán" bằng URL cũ; đã quá hạn/chưa kết luận thì hiện "Kiểm tra trạng thái", gọi `sync` khi khách yêu cầu, không redirect URL hết hạn. Đơn đã trả/hủy xử lý theo trạng thái DB, không coi mọi 409 đều là đang thanh toán.
- [ ] 6.2 Trang mới `apps/web/src/app/payment/vnpay-return/page.tsx`:
  - Client Component dùng `useSearchParams` phải nằm **bên trong `<Suspense>`**, đặt hook trong component con rồi bọc ở page; kiểm bằng production build Next 16. [Next.js](https://nextjs.org/docs/app/api-reference/functions/use-search-params#static-rendering)
  - gọi `GET /payments/vnpay/return`, hiển thị theo mục 1.7 và lấy trạng thái DB làm chuẩn; `valid: false` chỉ phục hồi từ `orderId`/`paymentId` lưu trong phiên, không tin ID từ query chưa kiểm. Chưa đăng nhập thì yêu cầu đăng nhập và giữ URL quay lại;
  - poll `GET /orders/:id` mỗi 2 giây, tối đa 30 giây;
  - vẫn có payment `PENDING` thì gọi `POST /payments/:id/sync` một lần; 409/502 hiện đang xác minh cùng nút kiểm tra lại, không tạo vòng lặp QueryDR. Dừng timer khi rời trang hoặc có trạng thái cuối;
  - đơn đã trả (`PAID`/`PREPARING`/`READY`/`COMPLETED`) thì dọn phiên đúng đơn như 6.1 và chuyển `/orders/:id`; `PAYMENT_FAILED` giữ giỏ để thử lại/hủy.
- [ ] 6.3 `OrdersScreen.tsx`: nhãn "Đang chờ VNPay" cho `Payment PENDING`; chặn hủy khi payment còn hạn, cho nút đối soát khi quá hạn, chỉ cho hủy sau khi DB xác nhận không còn payment chưa kết luận. Cập nhật kiểu `Order.payments` và kiểu response thanh toán/sync trong `apps/web/src/lib/shop.ts` theo mục 1.5; không cần sửa `ShopProvider` hay `ApiError` dùng chung.
- [ ] 6.4 Đổi tiêu đề "Thanh toán mô phỏng" thành "Thanh toán qua VNPay (sandbox)".

### Bước 7 – Kiểm chứng

- [ ] 7.1 `npm --prefix apps/api run lint && npm --prefix apps/api run build`; `npm --prefix apps/web run lint && npm --prefix apps/web run typecheck && npm --prefix apps/web run build`.
- [ ] 7.2 `node --import tsx --test test/vnpay.test.ts` từ `apps/api` (D3) đạt các ca: URL có khoảng trắng, signature thiếu/sai độ dài/không phải hex, chữ ký QueryDR có trường tùy chọn rỗng, định dạng/đọc ngày GMT+7 lúc 23:30 UTC, các dòng bảng mục 1.6. Không dùng secret thật trong fixture hay log. Chạy lại mỗi khi `vnpay.ts` đổi, kể cả sau review.
- [ ] 7.3 Local, không có IPN:
  - đặt 2 Cappuccino, trả bằng thẻ NCB;
  - trang return gọi `sync`, đơn thành `PAID`;
  - `onHand` espresso/sữa tươi giảm đúng, `reserved` về 0.
- [ ] 7.4 Local: bấm Hủy trên VNPay → `PAYMENT_FAILED`, `reserved` vẫn giữ → thử lại thành công.
- [ ] 7.5 Production (Render + Vercel): một giao dịch thành công qua IPN thật. Xem log Render có `RspCode=00`; Merchant Admin có giao dịch. Sau mỗi lần deploy, tạo một URL thanh toán và mở thử: trang VNPay phải hiện form nhập thẻ, không báo sai chữ ký. Smoke của CD chỉ gọi `/health`, không bắt được lỗi ký.
- [ ] 7.6 Chạy kịch bản SIT trên cổng `vnpaygw-sit-testing` của VNPay: thành công, sai chữ ký (97), không có đơn (01), sai tiền (04), đã xác nhận (02). Chụp kết quả cho báo cáo.
- [ ] 7.7 Gọi lại IPN với cùng tham số → `02`, không trừ kho lần hai. Cho IPN và `sync` cùng xác nhận một payment → một `SUCCESS`, trừ kho một lần; hai yêu cầu tạo thanh toán đồng thời → tối đa một `PENDING`, cùng phương thức dùng chung URL.
- [ ] 7.7a Chạy API local không có `VNP_HASH_SECRET`:
  - `/health` trả đúng `{ status, database }`;
  - tạo URL mới và QueryDR trả 502; replay `PENDING` còn hạn/`SUCCESS` đã có vẫn 200; `sync` payment đã có trạng thái cuối vẫn 200;
  - IPN trả `99`, bảng `payments` không đổi;
  - log khởi động chỉ có tên biến thiếu.
  - thiếu **riêng** `WEB_URL`: tạo URL mới trả 502, nhưng IPN/return/QueryDR có đủ merchant+secret vẫn xử lý được.
- [ ] 7.7b Chỉ dùng DB local, payment có URL **chưa từng mở**, và không mở URL cũ trong suốt phép thử. Có thể sửa `expiresAt` về quá khứ để kích hoạt nhánh, nhưng chỉ kỳ vọng `FAILED EXPIRED` nếu QueryDR trả `91` đã xác thực như spike 1.3. Dùng hai đơn riêng: một đơn thử tạo URL mới, một đơn thử hủy sau đối soát để kiểm nhả nguyên liệu. Không thử hủy ngay sau khi đã tạo payment mới còn hạn. Ca URL **đã mở nhưng chưa trả** phải theo mã thực tế đã ghi ở spike, không mặc định là `91`.
- [ ] 7.7c Thử lại từ `PAYMENT_FAILED`: đơn về `PENDING`, `reserved` không tăng.
- [ ] 7.7d Dùng response QueryDR kiểm soát được trong scratchpad/local: `00/00` → `SUCCESS`; `00/01` → 409, giữ `PENDING`; `00/02` → `FAILED` nhưng không phải `EXPIRED`; `91` trước/sau hạn → 409/`FAILED EXPIRED`; `94`/`99`, chữ ký sai, sai merchant/TxnRef/số tiền, timeout → 502, không đổi DB/kho. Nhóm status `04`/`05`/`06`/`07`/`09` không mở lần thu mới.
- [ ] 7.7e Payment quá hạn được QueryDR xác nhận thành công: gọi lại cùng chủ đơn/key/phương thức → 200 replay `SUCCESS`; key hoặc phương thức khác → 409 `ORDER_NOT_PAYABLE`. Kiểm một IPN cập nhật trong lúc đang chờ QueryDR: kết quả cũ không ghi đè DB.
- [ ] 7.7f Trong local, IPN thành công có chữ ký hợp lệ tới sau `FAILED EXPIRED`, sau hủy đơn hoặc sau khi payment khác đã trả → `02`, có warning `PAYMENT_RECONCILIATION_REQUIRED` và `vnp_TxnRef`, đơn/kho không đổi. IPN thành công chỉ qua giờ hết hạn nhưng DB vẫn `PENDING` → nhận bình thường. IPN lặp đúng payment đã thành công không tạo warning đối soát. Lặp lại ca trả thành công/hủy trên đơn cũ `inventoryTracked=false`: không gọi settle snapshot thiếu và giữ nhánh hoàn `Product.stock` khi hủy.
- [ ] 7.7g Chạy Docker không có biến VNPay: API khởi động, `/health` giữ đúng contract, chức năng không thanh toán dùng được; tạo URL mới trả 502. Có đủ biến: chạy lại luồng trả tiền local. Không bật fake trong image `NODE_ENV=production`.
- [ ] 7.8 Quét nội dung các file mới và phần thêm của diff để tìm credential bị gán giá trị, private key và URL chứa chữ ký; tên biến như `VNP_HASH_SECRET` được phép có. Không đưa secret hay tiền tố secret vào câu lệnh, vì lịch sử terminal/tool cũng bị lộ. Kiểm `.env` vẫn bị ignore, ảnh/log bàn giao đã che dữ liệu ký và không stage `.env`.

### Bước 8 – Bàn giao

- [ ] 8.1 Commit theo từng bước (tài liệu → sơ đồ → ADR → code API → code web), message tiếng Anh, ví dụ `feat(payment): create VNPay sandbox payment URL and IPN handler`.
- [ ] 8.2 PR nhắm **`jumbo`** theo D1; mô tả PR không chứa secret. Nếu nền đã được tích hợp, thống nhất đích với orchestrator. Workflow CI hiện lọc PR vào `develop-Assignment2`, nên PR vào `jumbo` phải đính kèm kết quả chạy local ở bước 7.1 và 7.2; không tự nới workflow chỉ để có dấu xanh. Push và merge chỉ khi người dùng đồng ý.
- [ ] 8.3 Chạy `git diff --check`, xem `git diff --name-status` và danh sách file chưa theo dõi; đối chiếu allowed paths. Bàn giao task ID, branch/worktree, file đổi, lệnh và kết quả thật, commit SHA nếu có; kèm bằng chứng spike/SIT và giới hạn chưa đạt. Không đánh dấu bước kiểm sandbox/production đã xong chỉ vì lint/build qua.

---

## 4. Rủi ro

- **Render free tier ngủ:** IPN đầu tiên có thể timeout. VNPay quy định tối đa 10 lần gọi cách 5 phút; return có `sync` để phục hồi khi API và VNPay truy cập được. Nếu API còn ngủ hoặc QueryDR lỗi/chưa hoàn tất, khách vẫn phải chờ và payment giữ `PENDING`.
- **IPN báo thành công nhưng `settle` báo `INVENTORY_INCONSISTENT`:** tiền đã thu. Trả `99` để VNPay gọi lại và ghi log để nhân viên xử lý; hoàn tiền (refund API) nằm ngoài phạm vi. Xác suất thấp vì nguyên liệu đã giữ từ lúc tạo đơn.
- **IPN/QueryDR báo đã trả sau khi payment đã `FAILED EXPIRED`, đơn đã hủy hoặc đã trả bằng lần thử khác:** không tự mở lại đơn/trừ kho. IPN trả `02`, ghi warning theo `vnp_TxnRef`; nhân viên tra Merchant Admin và hoàn tiền tay nếu cần. Partial unique index chỉ chặn hai payment `PENDING`, không loại trừ hoàn toàn tình huống kết quả tới muộn.
- **QueryDR không kết luận được hoặc có trạng thái đảo/hoàn tiền/nghi ngờ:** giữ `PENDING`, khóa lần thử mới/hủy và báo đang xác minh; có thể phải đối soát tay. Không dùng `94`/`99` làm bằng chứng thất bại. Nhánh `91` sau hạn chỉ được bật khi spike chứng minh tra cứu đúng tuple và kiểm được phản hồi.
- **Đơn bỏ dở giữ nguyên liệu:** chưa có job tự hủy/nhả kho; hết 15 phút chỉ làm payment cần đối soát, không tự hủy đơn. Đây là giới hạn giữ nguyên của phạm vi hiện tại.
- **Chỉ có unit test VNPay tối thiểu, chạy tay, không có trong CI** (D3): test không chứng minh VNPay chấp nhận chữ ký và không phủ DB/race; quên chạy thì lỗi ký chỉ lộ khi khách thanh toán. Bù bằng spike, smoke mở URL sau deploy (7.5) và output test đính kèm PR (8.2).
- **Sandbox VNPay bảo trì hoặc chậm** đúng lúc demo: chuẩn bị video quay trước. Cổng giả hoãn theo D4, không phải điều kiện để nghiệm thu bản này.
- **Secret đã nằm trong email và lịch sử chat:** chỉ là sandbox nên không thu tiền thật. Dù vậy, không đưa vào repo, ảnh chụp báo cáo hay log.

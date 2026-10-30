# ADR-007: Tích hợp VNPay sandbox

- Trạng thái: Proposed 2026-10-29 (chờ nhóm duyệt)
- Liên quan: BR-05, BR-10, BR-11, FR-14–16, FR-31, NFR-03, NFR-07, NFR-08; UC-04 (A5, A6, E3, E4, E8b, E9–E13); R-13, R-14, R-15; thay ADR-005 §B, sửa ADR-005 §A; giữ quy tắc kho của [ADR-006](006-ingredient-inventory-snapshots.md)
- Nguồn: [kế hoạch VNPay](../../planning/2026-10-29-vnpay-payment-plan.md) mục 1–2, [SRS](../../requirements/srs.md)

## Bối cảnh

Giảng viên đòi thanh toán qua cổng của bên thứ ba thay cho `simulatePayment()`. Nhóm đã đăng ký VNPay sandbox; sandbox không thu tiền thật, còn cổng production thật vẫn ngoài phạm vi (FR-31, Won't).

Simulator chạy đồng bộ trong tiến trình API: `POST /payments` nhận số thẻ rồi trả ngay 201 hoặc 402 (ADR-005 §B). VNPay thì bất đồng bộ: khách rời BrewLite sang trang VNPay để nhập thẻ, còn kết quả về qua kênh khác, có thể chậm hoặc không tới. Vì vậy phải quyết định ai được phép kết luận "đã trả", xử lý ra sao khi kết quả không tới, và giữ idempotency của ADR-005 thế nào khi một đơn có thể đang chờ.

Các ràng buộc cố định:

- Quy tắc kho của ADR-006 không đổi: tạo đơn giữ nguyên liệu, trả thành công thì trừ kho, hủy thì nhả.
- Render free tier có thể đang ngủ khi VNPay gọi lại; VNPay không gọi được `localhost` nên local không nhận được IPN.
- Hệ thống không nhận, không lưu số thẻ; secret không vào repo, log hay mô tả PR (NFR-07). IPN vào API và QueryDR ra VNPay đều đi qua HTTPS (NFR-08).

## Quyết định

### A. Luồng redirect + IPN + QueryDR

- `POST /payments` chỉ tạo `Payment PENDING`, ký URL bằng HMAC-SHA512 và trả `paymentUrl` cùng `expiresAt` (hạn 15 phút, cùng mốc với `vnp_ExpireDate`). Không chờ VNPay, nên thời gian khách trả trên trang VNPay không tính vào mục tiêu NFR-03. Đơn vẫn `PENDING`, nguyên liệu vẫn giữ. Request bỏ `cardNumber`.
- Kết quả đến theo hai đường: **IPN** (VNPay gọi `GET /payments/vnpay/ipn`, nguồn chính) và **QueryDR** (API hỏi VNPay qua `POST /payments/:id/sync` hoặc khi đối soát payment quá hạn) khi IPN không tới (E10).
- Chỉ IPN hoặc QueryDR đã xác thực mới quyết định kết quả cuối (BR-11). Return URL chỉ kiểm chữ ký và hiển thị, không ghi DB; web lấy trạng thái đơn từ DB.
- Xác thực gồm chữ ký, `vnp_TmnCode`, mã tham chiếu và số tiền. Sai thì không đổi DB: IPN trả `97` hoặc `04`, return trả `valid: false` (E9).

### B. Một hàm `applyGatewayResult` cho IPN và QueryDR

- `applyGatewayResult(tx, paymentId, result)` do caller gọi trong transaction đã giữ khóa đơn. Hàm đọc lại đúng `Payment` và `Order`, bảo vệ trạng thái cuối, rồi cập nhật payment, đơn và kho cùng transaction.
- Thành công: `Payment SUCCESS`, đơn `PAID`, gọi `settle(consume=true)` đúng một lần và chỉ khi `inventoryTracked`. Thất bại: `Payment FAILED`, đơn `PAYMENT_FAILED`, nguyên liệu vẫn giữ để khách thử lại hoặc hủy (E3). Với IPN, thất bại chỉ được áp khi `vnp_TransactionStatus = 02`, kể cả khi khách hủy trên VNPay (mã `24`). Spike 2026-10-30 ([kết quả](../../payment-vnpay-spike.md)) xác nhận hủy trả `24`/`02` và hết hạn ở bước OTP trả `15`/`02`, cùng được áp là thất bại.
- IPN và QueryDR chuẩn hóa mã theo từng giao thức trước khi gọi hàm. Lỗi QueryDR (mạng, timeout, chữ ký, cấu hình) không bao giờ thành "thanh toán thất bại": trả 502 `PAYMENT_PROVIDER_ERROR`, không đổi DB trong khoảng chờ; hết khoảng chờ thì payment bị đóng theo AC-F16.10 (mục E, D6), là chính sách hết hạn chứ không phải kết luận giao dịch thất bại.
- Payment hoặc đơn không còn `PENDING` thì IPN trả `02`. Nếu VNPay báo đã thu tiền nhưng payment đã `FAILED`/hết hạn, đơn đã hủy hoặc đã trả bằng payment khác, hệ thống không mở lại đơn, không đổi kho; IPN trả `02` và ghi warning `PAYMENT_RECONCILIATION_REQUIRED` kèm `vnp_TxnRef` (E12).
- Lý do gom một hàm: IPN và `sync` có thể cùng xác nhận một payment. Bất biến "một `SUCCESS`, trừ kho một lần" chỉ cần giữ ở một chỗ.

### C. HTTP ra VNPay nằm ngoài transaction giữ khóa đơn

- QueryDR (timeout 10 giây) chạy trước, ngoài DB transaction. Sau đó mới mở transaction, khóa đơn và đọc lại đúng payment đã hỏi. Nếu IPN đã xử lý trong lúc chờ thì kết quả QueryDR cũ không ghi đè DB.
- Lý do: ADR-005 chấp nhận giữ khóa vì simulator trả trong tối đa 500 ms. Thời gian trả lời của VNPay không kiểm soát được, và khóa đơn kéo theo khóa nguyên liệu (ADR-006).

### D. Tối đa một `Payment PENDING` mỗi đơn

- Partial unique index `payments_one_pending_per_order` trên `payments ("orderId") WHERE "status" = 'PENDING'` (BR-10). Cùng với khóa đơn và việc đối soát trước khi thử lại, index chặn hai giao dịch chờ song song cho một đơn.
- `PaymentStatus` thêm `PENDING`. `EXPIRED` chỉ là giá trị nội bộ của `gatewayResponseCode`, không phải trạng thái enum. Payment lưu riêng `gatewayResponseCode` và `gatewayTransactionStatus`.
- Hai migration tách nhau: enum và cột trước, index sau, vì PostgreSQL không cho dùng giá trị enum vừa thêm trong cùng transaction. Thay đổi chỉ thêm (expand-only); hàng cũ mang `provider = "SIMULATOR"` và không bị QueryDR.
- Index chỉ chặn hai `PENDING`. Nó không loại trừ ca tiền về sau khi payment đã đóng; ca đó do mục B và F xử lý.

### E. Payment `PENDING` quá hạn và hủy đơn

- Quá hạn không có nghĩa là chưa thu tiền: khách có thể trả sát giờ mà IPN tới muộn. Trước khi tạo giao dịch mới hoặc hủy đơn, API hỏi QueryDR (E11). Chưa kết luận được thì giữ `PENDING` và trả 409 `PAYMENT_IN_PROGRESS` (hoặc 502 nếu QueryDR lỗi), nhưng chỉ trong khoảng chờ của D6 dưới đây.
- Cách xử lý theo cặp mã của QueryDR:
  - `vnp_ResponseCode`/`vnp_TransactionStatus` `00/00`: áp `SUCCESS`; `00/02`: áp `FAILED`;
  - `91` đã xác thực: sau hạn thì `FAILED` với `gatewayResponseCode = "EXPIRED"`; còn hạn thì giữ `PENDING`, 409. Spike chưa quan sát được `91` (QueryDR sandbox lỗi), nên D6 không dựa vào nó;
  - `00/01` đã xác thực: trong khoảng chờ giữ `PENDING`, 409; hết khoảng chờ thì đóng theo D6;
  - nhóm trạng thái đảo/hoàn tiền/nghi ngờ (`04`/`05`/`06`/`07`/`09`) và `MISMATCH` (phản hồi `00` có chữ ký hợp lệ nhưng sai merchant, mã tham chiếu, số tiền hoặc loại giao dịch; chỉ áp cho phản hồi `00`): giữ `PENDING`, 502, ghi warning; không bao giờ tự đóng;
  - status `00` thiếu hoặc chưa hỗ trợ, mã truy vấn khác (`02`/`03`/`94`/`97`/`99`...), phản hồi mang mã khác `00` (kể cả `91`) có chữ ký hợp lệ nhưng sai hoặc thiếu merchant, mã tham chiếu (`BAD_RESPONSE`), hoặc phản hồi không xác thực được: trong khoảng chờ thì 502, không đổi DB; hết khoảng chờ thì đóng theo D6. `BAD_RESPONSE` tách khỏi `MISMATCH` vì VNPay có thể trả phản hồi lỗi đã ký với các trường rỗng; xếp `MISMATCH` thì đơn kẹt mãi, đúng lỗi D6 sinh ra để sửa.
- **D6: đóng payment quá hạn sau khoảng chờ 15 phút (người dùng chốt 2026-10-30, phương án A).** Chi tiết và bảng quyết định ở [kế hoạch VNPay](../../planning/2026-10-29-vnpay-payment-plan.md) mục 1.6 và 2.
  - **Khoảng chờ.** "Hết khoảng chờ" nghĩa là `now >= expiresAt + 15 phút` (`EXPIRY_GRACE_MS`, hàm thuần `isPastGrace(expiresAt, now)`), với `now` là lúc gửi QueryDR; `Payment` có `expiresAt = null` không bao giờ hết khoảng chờ. `queryDrAction` quyết định cho phản hồi đã xác thực, `unansweredQueryAction` cho phản hồi không xác thực được.
  - **Đóng** là: `Payment` sang `FAILED`, `gatewayResponseCode = "EXPIRED"`, `gatewayTransactionStatus = null`; đơn sang `PAYMENT_FAILED`; kho không đổi; ghi warning `PAYMENT_EXPIRED_UNCONFIRMED vnp_TxnRef=<id>` kèm lý do hoặc mã đã xác thực. Khách thanh toán lại hoặc hủy đơn. Việc đóng chỉ diễn ra khi có lời gọi (`POST /payments`, hủy đơn, `sync`); không có job nền (D5 giữ nguyên).
  - **Log QueryDR lỗi:** `VNPAY_QUERYDR_FAILED vnp_TxnRef=<id> reason=<reason>`. Phản hồi không có `vnp_SecureHash` dùng `reason=UNSIGNED` (kiểu `QueryDrFailure` thêm giá trị này); nếu `vnp_ResponseCode` gồm đúng 2 chữ số thì ghi thêm, chỉ để vận hành, không dùng để quyết định.
  - **Lý do.** QueryDR sandbox trả `99` không chữ ký cho mọi request (spike), nên payment bỏ dở quá hạn khiến `sync`, hủy đơn và thanh toán lại đều trả 502 và đơn kẹt. Spike cũng chứng minh VNPay từ chối thanh toán sau `vnp_ExpireDate` (mở URL hết hạn ra trang lỗi `code=15`; đang ở bước OTP thì return `15`/`02`), đúng điều kiện kế hoạch đặt ra cho cách "đóng sau khoảng chờ". Đóng là chính sách hết hạn của ứng dụng, không coi `94`/`99` hay lỗi truy vấn là bằng chứng giao dịch thất bại.
  - **Đánh đổi.** Ca biên: khách trả sát giờ, rồi IPN mất hơn 15 phút (và QueryDR không trả lời được) thì đơn bị đóng `PAYMENT_FAILED` trong khi tiền đã trừ. IPN thành công tới sau đi theo mục B: trả `02`, warning `PAYMENT_RECONCILIATION_REQUIRED`, nhân viên hoàn tiền tay. Warning `PAYMENT_EXPIRED_UNCONFIRMED` giúp nhân viên tra Merchant Admin sớm.
  - **Phương án đã cân nhắc.** (1) Nhân viên đóng tay sau khi tra Merchant Admin: cần endpoint, giao diện và vai trò riêng, và không tự kết thúc nếu không có ai bấm, nên đơn vẫn có thể kẹt. (2) Giữ nguyên, chỉ chờ QueryDR: khi QueryDR không kết luận được, đơn kẹt `PENDING` và nguyên liệu bị giữ vô thời hạn, vì `sync`, hủy và thanh toán lại đều bị chặn.
- Hủy đơn bị chặn bằng 409 `PAYMENT_IN_PROGRESS` khi có `Payment PENDING` còn hạn, để khách không vừa trả vừa hủy (A5). Khách quay lại checkout thì tiếp tục thanh toán bằng URL cũ (A6).

### F. Idempotency khi đơn đang chờ

Chi tiết ở [ADR-005 §A](005-idempotency-and-optimistic-lock.md). Tóm tắt (BR-05): replay `SUCCESS` xét trước tiên; `PENDING` còn hạn cùng phương thức trả lại URL cũ dù key mới (200), khác phương thức thì 409 `PAYMENT_IN_PROGRESS` (E4). Hai nhánh replay không cần ký lại hay kiểm cấu hình gateway. E8b (rủi ro chấp nhận khoảng dừng bước 13–14) đã bỏ vì IPN/QueryDR thay thế.

### G. Cấu hình kiểm theo thao tác

- Tạo URL mới cần `VNP_TMN_CODE`, `VNP_HASH_SECRET`, `WEB_URL`. IPN, kiểm return và QueryDR chỉ cần hai biến đầu. Replay, đọc trạng thái từ DB và `/health` không cần biến VNPay.
- Thiếu biến thì API vẫn khởi động, ghi một dòng cảnh báo chỉ liệt kê **tên** biến thiếu. Thao tác cần biến đó mới lỗi: tạo URL/QueryDR trả 502 `PAYMENT_PROVIDER_ERROR`, IPN trả `99` mà không đọc/ghi DB, return trả `valid: false` (E13).
- `PAYMENT_PROVIDER` mặc định `vnpay`; giá trị không hỗ trợ thì dừng khởi động. **Không tự chuyển sang cổng giả** khi thiếu biến.
- `VNP_HASH_SECRET` chỉ nằm trong `apps/api/.env` (bị `.gitignore` chặn) và biến môi trường Render. Log vận hành không ghi secret, chữ ký, payment URL hay toàn bộ query IPN.

## Hệ quả

### Ưu điểm

- Đáp ứng yêu cầu giảng viên: cổng bên thứ ba thật, kết quả có chữ ký HMAC-SHA512 và kiểm chứng được. Hệ thống không nhận, không lưu số thẻ.
- Hai đường nhận kết quả đi qua cùng một hàm, nên IPN lặp hay IPN chồng `sync` vẫn chỉ cho một `SUCCESS` và trừ kho một lần.
- `POST /payments` ngắn (không chờ VNPay); không giữ khóa đơn trong lúc chờ mạng.
- API khởi động được khi thiếu cấu hình, nên Docker/local chạy các chức năng khác mà không cần phát secret cho mọi thành viên.

### Hạn chế

- **Bất đồng bộ:** đơn `PENDING` chờ kết quả. Web phải poll `GET /orders/:id`, gọi `sync` khi còn `PENDING`, hiển thị "đang xác minh" và không khuyên khách trả lần hai khi chưa có kết luận.
- **Secret và vận hành:** thêm `VNP_TMN_CODE`, `VNP_HASH_SECRET`, `WEB_URL`. Phải lưu chúng trên Render **trước** lần deploy đầu tiên chứa code VNPay và đăng ký IPN URL ([deployment.md](../../deployment.md)). Việc API vẫn khởi động khi thiếu biến không thay thế điều kiện này.
- **Render ngủ (R-13):** IPN đầu có thể timeout. VNPay gọi lại tối đa 10 lần, cách 5 phút, và QueryDR qua trang return bù lại. Local không nhận IPN nên dựa vào QueryDR. Nếu API còn ngủ hoặc QueryDR lỗi, khách phải chờ và payment giữ `PENDING`.
- **Không có cổng giả:** thiếu cấu hình hoặc sandbox bảo trì (R-14) thì không thanh toán được đơn mới; demo cần video quay trước. Cổng giả hoãn theo quyết định D4 của kế hoạch VNPay, không phải điều kiện nghiệm thu.
- **Tiền về muộn cần đối soát tay:** không tự mở lại đơn, không tự hoàn tiền; ứng dụng không có API hoàn tiền. Nhân viên tra `vnp_TxnRef` từ warning `PAYMENT_RECONCILIATION_REQUIRED` trong Merchant Admin (xem [deployment.md](../../deployment.md)). Nếu `settle` báo `INVENTORY_INCONSISTENT` sau khi tiền đã thu thì IPN trả `99` để VNPay gọi lại và cần nhân viên xử lý; xác suất thấp vì nguyên liệu đã giữ từ lúc tạo đơn.
- **Đơn bỏ dở vẫn giữ nguyên liệu (R-15):** chưa có job tự hủy đơn hay nhả kho. Hết 15 phút chỉ làm payment cần đối soát; qua thêm 15 phút khoảng chờ, payment bị đóng `FAILED` khi có lời gọi (D6, mục E) nhưng đơn vẫn giữ nguyên liệu cho tới khi khách hủy.
- **Đóng payment quá hạn có ca biên (D6):** khách trả sát giờ mà IPN mất hơn 15 phút sau `expiresAt` thì đơn đã bị đóng khi tiền đã trừ. Có warning `PAYMENT_EXPIRED_UNCONFIRMED` và `PAYMENT_RECONCILIATION_REQUIRED`; nhân viên hoàn tiền tay, ứng dụng không tự mở lại đơn. Nhóm trạng thái nghi ngờ và `MISMATCH` không bao giờ tự đóng nên vẫn cần đối soát tay.
- **Chỉ có unit test tối thiểu:** một file test cho hàm thuần của `vnpay.ts` (quyết định D3 của kế hoạch VNPay), chạy tay, ngoài CI. Nó không chứng minh VNPay chấp nhận chữ ký, không phủ DB hay race, và không thay E2E hay lấp NFR-12/NFR-17. Bù bằng spike, thao tác sandbox/local có lưu bằng chứng, smoke mở URL thanh toán sau mỗi lần deploy và kịch bản SIT của VNPay.
- **Kết quả spike (2026-10-30, [chi tiết](../../payment-vnpay-spike.md)):** IPN coi là thất bại khi `vnp_TransactionStatus = 02` đã được xác nhận (hủy `24`/`02`, hết hạn ở bước OTP `15`/`02`). QueryDR sandbox trả `99` không chữ ký cho mọi request nên chưa quan sát được `91` và `00/01`; D6 (mục E) bảo đảm payment quá hạn vẫn có lối ra dù QueryDR không bao giờ trả `91`. ADR này giữ `Proposed` cho tới khi nhóm duyệt; các ca QueryDR vẫn phải kiểm khi sandbox hồi phục.

## Phương án đã loại

- **Giữ simulator:** không đáp ứng yêu cầu của giảng viên về cổng bên thứ ba, và không kiểm chứng được những điều khó nhất của thanh toán thật (chữ ký, kết quả đến bất đồng bộ, đến muộn hoặc không đến).
- **Stripe test mode:** cũng là cổng bên thứ ba, nhưng nhóm đã đăng ký VNPay sandbox, còn Stripe cần tài khoản và SDK mới. Stripe cũng trả kết quả bất đồng bộ qua webhook, nên không bớt được độ phức tạp của ADR này; chỉ đổi nhà cung cấp. Thanh toán nội địa bằng VND phù hợp bối cảnh BrewLite hơn.
- **Chỉ IPN, không QueryDR:** Render ngủ và local không nhận IPN thì đơn kẹt `PENDING` mà không có đường phục hồi.
- **Cho return URL quyết định kết quả:** URL do trình duyệt mang về, khách bỏ qua hoặc giả được; trái BR-11.
- **Gọi QueryDR bên trong transaction giữ khóa đơn:** khóa bị giữ theo thời gian mạng của VNPay (mục C).
- **Một cờ tắt toàn bộ khi thiếu cấu hình, hoặc dừng khởi động:** thành viên không có secret không chạy được các chức năng không liên quan thanh toán (mục G).
- **Tự chuyển sang cổng giả khi thiếu cấu hình:** che lỗi cấu hình và có thể "thu tiền" giả ở production.
- **Chỉ dựa vào khóa đơn, không có partial unique index:** bất biến BR-10 phụ thuộc hoàn toàn vào mọi nhánh code; index là lớp chặn độc lập ở DB.
- **Không replay `PENDING`, mỗi key mới tạo URL mới:** một đơn có hai giao dịch VNPay song song, có thể bị thu trùng.

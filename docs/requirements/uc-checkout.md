# Đặc tả use-case trọng tâm: UC-04 Đặt và thanh toán đơn hàng (Task 1.3)

> **BREW-INVENTORY-01:** đơn mới lưu bản chụp nguyên liệu (snapshot) lúc đặt; hủy đơn (cancellation) là Must. Bộ test tự động đã được gỡ sau khi kiểm chứng, theo yêu cầu bàn giao; các mã test và gợi ý kiểm dưới đây giữ lại để truy vết lịch sử, kết quả thực tế nằm ở [inventory-verification.md](../inventory-verification.md).
>
> **Bản chốt Task 1**, theo phạm vi tối thiểu đã thống nhất ở PR #5 và đã rút gọn thêm (SRS mục 1.4).
>
> Tài liệu này trả lời đề A2 §3.3. Yêu cầu: [`srs.md`](srs.md) (mã `FR-xx`, `NFR-xx`, quy tắc `BR-xx`, mã lỗi ở mục 3). Phạm vi: [`context-and-scope.md`](context-and-scope.md). Use-case tổng quát: [`use-case-overview.svg`](use-case-overview.svg). Truy vết: [`../traceability-matrix.md`](../traceability-matrix.md).
>
> **VNPay sandbox (2026-10-29):** bên nghiệm thu yêu cầu thanh toán qua sandbox của một bên thứ ba thay cho bộ giả lập (simulator). Vì vậy thanh toán chạy bất đồng bộ: API tạo `Payment PENDING` và một URL đã ký sẵn, khách trả trên trang VNPay, kết quả gửi về qua IPN (hoặc QueryDR khi IPN không tới), còn trang return chỉ để hiển thị. Kế hoạch: [`../planning/2026-10-29-vnpay-payment-plan.md`](../planning/2026-10-29-vnpay-payment-plan.md). Lần thử nghiệm (spike) ngày 2026-10-30 ([kết quả](../payment-vnpay-spike.md)) đã xác nhận cách VNPay xử lý khi khách hủy và khi hết hạn. QueryDR của sandbox đang lỗi, nên payment quá hạn mà chưa có kết luận sẽ được đóng sau khoảng chờ 15 phút (D6, E11).
>
> Use-case này là đầu vào cho Task 2. Activity diagram (ba nhánh hết hàng, chưa đăng nhập, thanh toán thất bại; thêm các nhánh khách hủy trên VNPay, hết hạn và chưa có kết luận) và sequence diagram (Customer, Browser, Next.js UI, NestJS API, Database, VNPay sandbox) phải khớp với các luồng dưới đây.

## Mục lục

1. Tóm tắt use-case
2. Use-case diagram
3. Actor
4. Trigger, tiền điều kiện, hậu điều kiện
5. Luồng chính
6. Luồng thay thế
7. Luồng ngoại lệ
8. Quy tắc nghiệp vụ áp dụng
9. Liên kết bước và luồng với yêu cầu
10. Gợi ý test từ đặc tả

---

## 1. Tóm tắt use-case

| Mục | Nội dung |
|---|---|
| Mã và tên | **UC-04 Đặt và thanh toán đơn hàng** |
| Mục tiêu | Customer biến giỏ hàng thành một đơn đã trả tiền không dùng tiền mặt qua VNPay sandbox, và nhận mã đơn để xác nhận |
| Giá trị nghiệp vụ | Đây là bước mang lại doanh thu cho BrewLite: khách trả tiền xong thì đơn mới được chuyển sang pha chế |
| Ưu tiên | Must |
| Use-case con | UC-04.1 Tạo đơn hàng (include), UC-04.2 Thanh toán đơn hàng (include), UC-04.5 Thử lại thanh toán (extend UC-04.2); UC-03 Đăng nhập extend UC-04 khi chưa đăng nhập (UC-04.3, UC-04.4 ngoài bản nộp, không vẽ; xem `srs.md` §5.9) |
| Lý do chọn | Use-case này đi qua đủ các thành phần (UI, API, DB, VNPay sandbox) và có đủ ba nhánh lỗi bắt buộc của đề A2 §4.1 (hết hàng, chưa đăng nhập, thanh toán thất bại); đây cũng là use-case mà sequence diagram ở Task 2.2 phải vẽ |

## 2. Use-case diagram

![Use-case UC-04](uc-checkout.svg)

Nguồn: [`uc-checkout.puml`](uc-checkout.puml). Các quan hệ:

- UC-04 `<<include>>` UC-04.1 và UC-04.2: khi đặt đơn mới, hệ thống chạy cả hai (tạo đơn rồi thanh toán). Khi khách quay lại trả tiếp một đơn đã có (E1b/A3/A6) thì chỉ chạy lại UC-04.2, không tạo đơn lần nữa. VNPay sandbox là actor phụ của UC-04.2.
- UC-04.5 `<<extend>>` UC-04.2: chỉ chạy khi đơn đang `PAYMENT_FAILED`. Áp mã giảm giá và ghi điểm (FR-17/18) nằm ngoài bản nộp nên không vẽ.
- UC-03 Đăng nhập `<<extend>>` UC-04: chỉ chạy khi khách chưa đăng nhập; đây là cách vẽ ngoại lệ "chưa đăng nhập" trên sơ đồ. Tiền điều kiện của use-case vẫn là đã đăng nhập (mục 4).

## 3. Actor

| Actor | Loại | Vai trò trong use-case |
|---|---|---|
| **Customer** (khách hàng đã đăng nhập) | Chính | Bắt đầu use-case, chọn phương thức, bấm "Thanh toán qua VNPay", trả tiền trên trang VNPay và nhận kết quả |
| **Guest** (khách vãng lai) | Chính (kế thừa) | Chỉ xuất hiện ở ngoại lệ E1: chưa đăng nhập thì chưa bắt đầu được, phải qua UC-03 trước. `Customer` kế thừa `Guest` |
| **VNPay sandbox** (cổng thanh toán bên thứ ba, hệ thống ngoài) | Phụ | Hiện trang thanh toán để khách nhập thẻ test; gọi IPN về API khi có kết quả; chuyển trình duyệt về trang return; trả lời API khi API hỏi bằng QueryDR (quy ước sandbox: `srs.md` mục 3.4) |

Barista không tham gia use-case này (xem UC-07 ở `srs.md` mục 2.3). Các thành phần kỹ thuật xuất hiện trong luồng: Browser (trình duyệt của khách, nơi chạy Next.js UI), Next.js UI, NestJS API, Database. Đây cũng là các lifeline của sequence diagram (đề A2 §4.2).

## 4. Trigger, tiền điều kiện, hậu điều kiện

**Trigger (điều kiện kích hoạt):** Customer bấm nút "Thanh toán" trên màn Giỏ hàng.

**Tiền điều kiện:**

1. Customer đã đăng nhập: có JWT hợp lệ, chưa hết hạn, `role = CUSTOMER` (FR-09, FR-10).
2. Giỏ hàng có ít nhất 1 dòng và mọi dòng đều hợp lệ: số lượng từ 1 đến 99, tối đa 20 dòng (FR-05, FR-06, BR-02).
3. API và database đang hoạt động.

(Nếu tiền điều kiện 1 không đúng thì chạy ngoại lệ E1; đây không phải lỗi hệ thống. Để tạo URL thanh toán mới, API còn cần cấu hình VNPay; thiếu cấu hình thì chạy E13.)

**Hậu điều kiện khi thành công (đơn đã `PAID`):**

- Có đúng 1 `Order` của Customer ở trạng thái `PAID`, kèm các `OrderItem` khớp với giỏ; `Order.total` do máy chủ tính (BR-01).
- Có đúng 1 `Payment` `SUCCESS` cho đơn, do IPN hoặc QueryDR đã xác thực quyết định (BR-11). Payment này lưu `Idempotency-Key`, mã giao dịch VNPay (`gatewayTxnNo`), `bankCode` và `paidAt`. Các `Payment` trước đó của đơn (nếu có) đều `FAILED`; một đơn không bao giờ có hai `Payment PENDING` (BR-10).
- Đơn mới có bản chụp nguyên liệu OrderIngredient không đổi về sau. Khi trả thành công, onHand và reserved giảm đúng theo bản chụp, đúng một lần; menu tính lại số ly từ available. Đơn cũ (legacy, marker false) vẫn theo vòng đời Product.stock như trước.
- Giỏ hàng trên trình duyệt được xóa khi DB đã xác nhận đơn đã trả; Customer thấy màn xác nhận có mã đơn.

**Hậu điều kiện khi thất bại** (chi tiết từng nhánh ở mục 7; bảng dưới chỉ tổng hợp):

| Tình huống | `Order` | `Payment` | Tồn kho | Giỏ hàng |
|---|---|---|---|---|
| E1a Chưa tạo đơn | không tạo | không | không đổi | giữ |
| E1b Đã tạo đơn, JWT hết hạn | giữ đơn cũ và orderId | không thêm do 401 | vẫn giữ chỗ, không trừ thêm | giữ |
| E2 Hết hàng | không tạo | không | không đổi | giữ (khách chỉnh) |
| E3 Thanh toán thất bại (IPN/QueryDR xác nhận, kể cả khách hủy trên VNPay) | `PAYMENT_FAILED` | `PENDING` → 1 bản ghi `FAILED` | vẫn giữ chỗ | giữ |
| E4 Gửi lại cùng key (đã thành công) | giữ `PAID` | không thêm | không đổi thêm | đã xóa từ lần đầu |
| E4 Gửi lại khi `Payment PENDING` còn hạn, cùng phương thức | giữ `PENDING` | không thêm; trả lại URL cũ | vẫn giữ chỗ | giữ |
| E4 Gửi lại khi `Payment PENDING` còn hạn, khác phương thức (409 `PAYMENT_IN_PROGRESS`) | giữ `PENDING` | không thêm | vẫn giữ chỗ | giữ |
| E5 Ngoài bản nộp (FR-17 Won’t) | — | — | — | — |
| E6 Dữ liệu không hợp lệ | không tạo (hoặc giữ nguyên) | không | không đổi | giữ |
| E7 Đơn không thanh toán được | không đổi | không | không đổi | giữ |
| A5 Hủy bị chặn (409 `PAYMENT_IN_PROGRESS`) | giữ `PENDING` | giữ `PENDING` | vẫn giữ chỗ | giữ |
| A6 Quay lại khi `Payment PENDING` còn hạn | giữ `PENDING` | không thêm; dùng lại URL cũ | vẫn giữ chỗ | giữ |
| E9 Chữ ký, merchant hoặc số tiền sai | không đổi | không đổi | không đổi | giữ |
| E10 Mất hoặc muộn IPN | `PENDING` cho tới khi QueryDR/IPN xác nhận, rồi `PAID` hoặc `PAYMENT_FAILED` | `PENDING` → `SUCCESS` hoặc `FAILED` | trừ một lần khi `SUCCESS`; giữ chỗ khi `FAILED` | giữ tới khi DB xác nhận đã trả |
| E11 `Payment PENDING` quá hạn, chưa kết luận, còn trong khoảng chờ 15 phút | giữ `PENDING` | giữ `PENDING`; không tạo thêm | vẫn giữ chỗ | giữ |
| E11 Hết khoảng chờ (`expiresAt + 15 phút`) mà chưa kết luận | `PAYMENT_FAILED` | `PENDING` → `FAILED` (`gatewayResponseCode = "EXPIRED"`); warning `PAYMENT_EXPIRED_UNCONFIRMED` | vẫn giữ chỗ | giữ |
| E12 Tiền về sau trạng thái cuối | không đổi | không đổi; ghi warning đối soát | không đổi | không đổi |
| E13 Thiếu cấu hình hoặc lỗi provider | không đổi | không tạo (hoặc không đổi) | không đổi | giữ |

## 5. Luồng chính

Đây là luồng suôn sẻ nhất: Customer đã đăng nhập, trả bằng Ví qua VNPay sandbox với thẻ test, còn đủ hàng và IPN tới kịp.

| Bước | Tác nhân | Hành động |
|---|---|---|
| 1 | Customer | Mở màn Giỏ hàng và bấm "Thanh toán" |
| 2 | Next.js UI | Kiểm giỏ không rỗng và JWT còn hợp lệ; hiện màn Thanh toán với tóm tắt các dòng, tổng tiền và lựa chọn Ví/Thẻ |
| 3 | Customer | Chọn phương thức (`WALLET` hoặc `CARD`). Số thẻ chỉ nhập trên trang VNPay; BrewLite không có ô nhập số thẻ |
| 4 | Customer | Bấm "Thanh toán qua VNPay" |
| 5 | Next.js UI | Khóa nút để tránh bấm hai lần, tạo `Idempotency-Key` cho phiên thanh toán; gửi `POST /orders` kèm JWT và danh sách dòng (không gửi giá) |
| 6 | NestJS API | Xác thực JWT và vai trò `CUSTOMER`; kiểm dữ liệu theo DTO (số lượng, size, topping, số dòng) |
| 7 | NestJS API | Tính giá từng dòng và `total` theo giá lưu trong Database (BR-01) |
| 8 | NestJS API, Database | Trong một transaction: khóa công thức theo ID; cộng nhu cầu base + size + topping của cả giỏ; khóa nguyên liệu theo ID; kiểm available; tăng reserved; tạo Order PENDING (marker true), OrderItems và bản chụp OrderIngredient; commit. Thiếu công thức hoặc thiếu nguyên liệu thì hoàn tác (rollback) toàn bộ |
| 9 | Next.js UI | Gửi `POST /payments` với `orderId`, `paymentMethod`, kèm header `Idempotency-Key` |
| 10 | NestJS API | Xác thực JWT; kiểm dữ liệu và quyền sở hữu đơn trước mọi việc khác. Sau đó tra `Idempotency-Key`: nếu cùng chủ đơn/`orderId`/key/`paymentMethod` (BR-05) đã thành công thì trả lại kết quả cũ theo E4a, trước cả bước kiểm trạng thái. Với yêu cầu mới, đơn phải ở `PENDING` hoặc `PAYMENT_FAILED`. Nếu đơn đã có `Payment PENDING` thì theo E4, quá hạn thì theo E11 (ở luồng chính chưa có payment nào đang chờ) |
| 11 | NestJS API | Số tiền cần thu `amount = total` (bản nộp không áp khuyến mãi) |
| 12 | NestJS API | Kiểm cấu hình tạo URL (thiếu thì sang E13); ký URL thanh toán bằng HMAC-SHA512 (tính ngay trên máy chủ, không gọi mạng) với mã tham chiếu là `Payment.id` (`vnp_TxnRef`), số tiền `amount × 100` và hạn 15 phút |
| 13 | NestJS API, Database | Trong một transaction giữ khóa đơn: tạo `Payment PENDING`, lưu `paymentUrl`, `expiresAt`, `gatewayCreateDate`; commit. Đơn vẫn `PENDING` và không giữ chỗ nguyên liệu thêm lần nữa (BR-10: mỗi đơn tối đa một `Payment PENDING`) |
| 14 | NestJS API | Trả 201 kèm `paymentId`, `orderId`, `orderStatus = PENDING`, `status = PENDING`, `amount`, `paymentUrl`, `expiresAt` |
| 15 | Next.js UI, Browser | Lưu `orderId`, `Idempotency-Key`, `paymentId`, `paymentMethod` vào `sessionStorage` của phiên checkout; chuyển trình duyệt tới `paymentUrl`. Giỏ hàng chưa bị xóa |
| 16 | Customer, VNPay sandbox | Khách nhập thẻ test (NCB) và xác nhận trên trang VNPay. BrewLite không nhận, không lưu và không ghi log số thẻ |
| 17 | VNPay sandbox, NestJS API | VNPay gọi IPN `GET /payments/vnpay/ipn` (máy chủ gọi thẳng máy chủ, công khai, không cần JWT). API kiểm chữ ký, merchant (mã cửa hàng), `Payment` có tồn tại không và số tiền; sai thì chạy E9 |
| 18 | NestJS API, Database | Trong một transaction giữ khóa đơn: đọc lại `Payment` và `Order`; nếu `vnp_ResponseCode = 00` và `vnp_TransactionStatus = 00` thì `Payment` → `SUCCESS` (lưu mã giao dịch, `bankCode`, `paidAt`), giảm onHand và reserved theo bản chụp, `Order` → `PAID`; commit; trả VNPay `RspCode = 00`. Nếu VNPay gửi lại IPN thì chỉ nhận `02`, kho không bị trừ lần hai |
| 19 | VNPay sandbox, Browser | VNPay chuyển trình duyệt về trang `/payment/vnpay-return` của web. Trang này chỉ hiển thị, không quyết định kết quả (BR-11) |
| 20 | Next.js UI, NestJS API | Gọi `GET /payments/vnpay/return` để kiểm chữ ký, rồi hỏi lại (poll) `GET /orders/:id` mỗi 2 giây, tối đa 30 giây. Nếu `Payment` vẫn `PENDING` (IPN chưa tới) thì gọi `POST /payments/:id/sync` một lần theo E10 |
| 21 | Next.js UI | Khi DB xác nhận đơn `PAID`: hiện màn xác nhận (mã đơn, trạng thái "Đã thanh toán", món, tiền); xóa giỏ hàng; có nút "Theo dõi đơn". Use-case kết thúc thành công |

## 6. Luồng thay thế

Luồng thay thế vẫn kết thúc tốt đẹp hoặc dừng lại có kiểm soát; đây không phải lỗi.

### A1 — Áp mã giảm giá hợp lệ (ngoài bản nộp)

Ngoài bản nộp (FR-17 Won’t). Giữ mã để số hiệu các luồng khác không bị xáo trộn.

### A2 — Đổi phương thức trước khi xác nhận (tại bước 3)

Customer đổi qua lại giữa Ví và Thẻ bao nhiêu lần cũng được trước khi bấm "Thanh toán qua VNPay". Lúc này chưa có `Order` nào nên không ảnh hưởng gì. Quay lại bước 4.

### A3 — Thử lại thanh toán sau khi thất bại (UC-04.5; sau E3)

1. Đơn đang `PAYMENT_FAILED`; giỏ hàng và `orderId` vẫn được giữ (FR-15). Customer đổi phương thức hoặc giữ nguyên, rồi bấm "Thử lại".
2. UI **không** gọi `POST /orders` lần nữa mà gửi `POST /payments` cho chính `orderId` đó.
3. Ở bước 10, API chấp nhận đơn `PAYMENT_FAILED`. Ở bước 13, trong cùng transaction tạo `Payment PENDING` mới, API chuyển đơn về lại `PENDING`; không giữ chỗ nguyên liệu thêm.
4. Tiếp tục từ bước 14. Kết quả: không sinh đơn mới (AC-F15.5).

### A4 — Customer rời màn Thanh toán trước khi xác nhận (tại bước 2 đến 4)

Customer bấm quay lại hoặc đóng trang trước bước 4. Chưa có `Order`, giỏ hàng còn nguyên, tồn kho không đổi. Use-case kết thúc mà không để lại tác dụng phụ.

### A5 — Chủ đơn hủy đơn chưa trả (PENDING hoặc PAYMENT_FAILED; FR-25 Must)

Customer xác nhận hủy, UI gọi PATCH /orders/:id với status=CANCELLED. Dưới khóa đơn, API kiểm đúng chủ đơn và trạng thái, rồi chỉ giảm reserved theo bản chụp trong cùng transaction; onHand không đổi. Hủy lần nữa trả 409 và không nhả thêm. Đơn legacy marker false chỉ hoàn lại Product.stock như cũ. Đơn không tự hủy theo thời gian.

Hủy bị chặn khi còn payment chưa có kết luận, để tránh trường hợp khách vừa trả tiền vừa hủy:

- Có `Payment PENDING` còn hạn: API trả 409 `PAYMENT_IN_PROGRESS`, không hủy; đơn và nguyên liệu giữ nguyên.
- `Payment PENDING` đã quá hạn: API đối soát bằng QueryDR trước (E11) rồi mới xét hủy. Chỉ hủy tiếp khi đơn vẫn hủy được và không còn payment nào chưa kết luận; nếu hóa ra khách đã trả thì đơn thành `PAID` và không hủy được nữa. Quá `expiresAt + 15 phút` mà vẫn chưa có kết luận thì payment bị đóng `FAILED` (E11), lúc đó không còn payment chưa kết luận.
- Payment đã `FAILED` (kể cả do hết hạn): hủy bình thường. Nguyên liệu chỉ được nhả khi đơn bị hủy, không nhả chỉ vì payment `FAILED`.

### A6 — Quay lại checkout khi đã có Payment PENDING còn hạn

1. Customer đã được chuyển sang trang VNPay (bước 15) nhưng quay về BrewLite khi chưa trả xong: đóng tab, bấm Back, hoặc mở lại từ lịch sử đơn. Đơn vẫn `PENDING` với một `Payment PENDING` chưa quá hạn (BR-10).
2. UI đọc `GET /orders/:id`, thấy `paymentUrl` và `expiresAt` của payment còn hạn, nên hiện nút "Tiếp tục thanh toán" thay vì tạo URL mới.
3. Customer bấm "Tiếp tục thanh toán": trình duyệt mở lại **URL cũ** (quay về bước 15). Nếu UI vẫn gửi `POST /payments` cùng phương thức thì API trả 200 với `paymentUrl` và `expiresAt` cũ (E4), không tạo `Payment` mới.
4. Kết quả: không thêm `Payment`, đơn và tồn kho không đổi. Hết hạn mà chưa có kết quả thì chạy E11 thay vì dùng URL cũ.

## 7. Luồng ngoại lệ

Ba nhánh lỗi bắt buộc theo đề A2 §4.1 là **E1, E2, E3**; E4 là yêu cầu chống xử lý lặp (idempotency) của đề A2 §4.2. E9 đến E13 là các nhánh riêng của thanh toán bất đồng bộ qua VNPay sandbox.

### E1 — Chưa đăng nhập hoặc JWT hết hạn (UC-03 extend UC-04)

**E1a — Chưa tạo đơn:** ở bước 1/2 không có JWT hợp lệ, hoặc bước 6 trả 401.

1. Nếu UI biết khách chưa đăng nhập thì không gọi `POST /orders`; nếu token sai hoặc hết hạn, API trả 401 trước khi tạo đơn.
2. Giữ giỏ; chuyển tới `/login?next=/checkout`. Nếu token hết hạn thì báo "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại".
3. Đăng nhập xong thì quay lại bước 2 và tạo đơn theo luồng chính.
4. Kết quả trước khi đăng nhập lại: chưa tạo `Order`/`Payment`, tồn kho không đổi. Nếu khách không đăng nhập thì use-case dừng, không để lại tác dụng phụ.

**E1b — Đã tạo đơn:** bước 8 đã trả về `orderId`, nhưng bước 10 (`POST /payments`) bị 401.

1. Khi chuyển sang đăng nhập, giữ lại `orderId`, tài khoản chủ đơn, giỏ và `Idempotency-Key`. Lỗi 401 không tạo thêm `Payment` và không đổi đơn hay phần kho đã giữ.
2. Sau khi đăng nhập lại **đúng tài khoản**, UI đọc `GET /orders/:id` để xác nhận trạng thái và quyền sở hữu.
3. Đơn `PENDING`: tiếp tục bước 9 trên **đơn cũ** (nếu đã có `Payment PENDING` còn hạn thì theo A6). Đơn `PAYMENT_FAILED`: tiếp tục A3. Không quay lại bước 5, không gọi lại `POST /orders`, không trừ kho thêm.
4. Đơn đã `PAID`/`PREPARING`/`READY`/`COMPLETED`: hiện chi tiết và kết quả đã có. Đơn `CANCELLED`: dừng thanh toán và báo đơn đã hủy. Không gửi thanh toán mới.
5. Nếu đăng nhập bằng tài khoản khác thì không tự tiếp tục đơn cũ; API trả 403 khi đọc hoặc trả tiền đơn của người khác. UI yêu cầu đăng nhập đúng tài khoản hoặc về lịch sử của tài khoản mới, không tự tạo đơn thay thế.
6. Nếu khách không đăng nhập lại, đơn cũ và phần kho giữ chỗ vẫn còn; khách có thể quay lại lịch sử bằng tài khoản chủ đơn để trả tiếp (hoặc hủy theo FR-25).

**Yêu cầu:** FR-10 (AC-F10.3–4), FR-14/16, FR-21/22, NFR-05. Nếu mất phản hồi của `POST /orders` và chưa biết `orderId` thì không xem là E1a: không tự gửi lại, mà kiểm tra lịch sử theo SRS mục 8.6.

### E2 — Hết hàng (tại bước 8)

- **Kích hoạt:** tổng nhu cầu của cùng một nguyên liệu trên mọi dòng vượt quá available (onHand-reserved), kể cả khi từng dòng riêng lẻ vẫn đủ; hoặc công thức bị thiếu, không hợp lệ. Ví dụ: đặt 7 ly Matcha S cần 21g matcha trong khi chỉ còn 20g.
- **Phản ứng:**
  1. API hoàn tác (rollback): không có Order/OrderItem/OrderIngredient mới và không đổi bất kỳ onHand/reserved nào.
  2. API trả 409 OUT_OF_STOCK kèm details từng nguyên liệu `{ingredientId,name,unit,requested,available}` (lượng ở dạng string), hoặc RECIPE_UNAVAILABLE nếu thiếu công thức.
  3. UI báo "{Tên món} chỉ còn N ly" hoặc "{Tên món} đã hết hàng", đưa khách về giỏ và đánh dấu dòng liên quan (AC-F13.4).
  4. Customer sửa số lượng hoặc xóa món rồi bắt đầu lại từ bước 1.
- **Kết quả:** không có đơn mới trong lịch sử (AC-F13.5); không bao giờ bán quá tồn kho, kể cả khi nhiều người đặt cùng lúc (AC-F13.3).
- **Yêu cầu:** FR-13, NFR-13.

### E3 — Thanh toán thất bại do IPN hoặc QueryDR xác nhận (tại bước 16 đến 18)

- **Kích hoạt:** IPN (hoặc QueryDR ở E10/E11) xác nhận giao dịch đã thất bại hẳn. IPN được xem là thất bại khi `vnp_TransactionStatus = 02`, kể cả khi khách bấm "Hủy" trên trang VNPay (`vnp_ResponseCode = 24`). Spike 2026-10-30 xác nhận: hủy trả `24`/`02`, hết hạn ở bước OTP trả `15`/`02`. QueryDR trả `vnp_ResponseCode = 00` kèm `vnp_TransactionStatus = 02` cũng là thất bại hẳn.
- **Phản ứng:**
  1. Trong một transaction giữ khóa đơn, API đổi `Payment` từ `PENDING` sang `FAILED`, lưu riêng `gatewayResponseCode` và `gatewayTransactionStatus`, và đổi `Order` từ `PENDING` sang `PAYMENT_FAILED`. Nguyên liệu vẫn được giữ. IPN trả VNPay `RspCode = 00`.
  2. `POST /payments` không còn trả 402: thất bại luôn đến qua IPN hoặc QueryDR, không phải do API tự gọi cổng thanh toán.
  3. Trang return chỉ báo thất bại và cho thử lại/hủy **sau khi DB đã xác nhận** `PAYMENT_FAILED`. Thông báo theo mã VNPay chỉ để khách dễ hiểu: `24` khách hủy giao dịch; `11`, `15` và `EXPIRED` (payment bị đóng do quá hạn, E11) là hết thời gian thanh toán ("Đã hết thời gian thanh toán"); `51` không đủ số dư; `13` sai OTP; `09`/`10`/`12`/`79` lỗi thẻ hoặc tài khoản; mã còn lại hiện "Thanh toán không thành công". Khi payment còn `PENDING` thì hiện "Đang xác minh thanh toán, vui lòng kiểm tra lại", không khuyên khách trả lần hai.
  4. UI giữ giỏ và `orderId`, hiện nút "Thử lại" (và "Hủy đơn" theo FR-25).
  5. Customer chọn A3 (thử lại) hoặc A5 (hủy đơn, theo FR-25).
- **Kết quả:** giỏ hàng và đơn vẫn còn; tồn kho vẫn giữ chỗ; khách không bị trừ tiền (giao dịch thất bại hoặc bị hủy trên VNPay không ghi nhận khoản thu).
- **Yêu cầu:** FR-15 (AC-F15.1), FR-16, NFR-03.

### E4 — Gửi lại yêu cầu thanh toán với cùng Idempotency-Key (tại bước 9 và 10)

Xảy ra khi khách bấm hai lần, mất phản hồi rồi bấm lại, hoặc mạng tự gửi lại. Sau khi xác thực và kiểm quyền sở hữu, API xét theo thứ tự (BR-05, BR-10):

1. Đã có `Payment` `SUCCESS` cùng chủ đơn/`orderId`/key/`paymentMethod` → 200, trả kết quả cũ (E4a); bước này xét **trước** trạng thái đơn.
2. Đơn không còn thanh toán được → 409 `ORDER_NOT_PAYABLE` (E4d).
3. Đã có `Payment PENDING` còn hạn: cùng `paymentMethod` → 200, trả nguyên `paymentUrl` và `expiresAt` cũ dù key mới (khách dùng tiếp URL cũ, xem A6); khác `paymentMethod` → 409 `PAYMENT_IN_PROGRESS`. Cả hai trường hợp đều không tạo `Payment` mới và không ký lại URL.
4. `Payment PENDING` đã quá hạn → đối soát bằng QueryDR trước (E11), rồi xét lại từ mục 1.

Các nhánh con:

- **E4a — lần đầu đã thành công:** API thấy `Idempotency-Key` đã gắn với một `Payment` `SUCCESS` của đúng chủ đơn/`orderId`/`paymentMethod` này (BR-05; xét trước trạng thái đơn), nên **không** tạo `Payment`, không ký URL, mà trả 200 `{ paymentId, orderId, orderStatus: "PAID", amount, status: "SUCCESS" }` với cùng `paymentId` (AC-F16.1). UI hiện màn xác nhận như bước 21. Cùng key nhưng khác `paymentMethod` thì không tính là gửi lại: xử lý như yêu cầu mới, và vì đơn đã `PAID` nên theo E4d.
- **E4b:** Đã bỏ khỏi bản nộp (rút gọn, SRS mục 1.4). Giữ mã để số hiệu các luồng khác không bị xáo trộn.
- **E4c:** Đã bỏ khỏi bản nộp (rút gọn, SRS mục 1.4). Giữ mã để số hiệu các luồng khác không bị xáo trộn.
- **E4d — đơn đã `PAID`, key mới:** API trả 409 `ORDER_NOT_PAYABLE`, không tạo `Payment`, không ký URL, nên không thu tiền lần hai (AC-F16.4).
- **E4e — lần đầu đã thất bại (E3):** gửi lại được tính là lần thử mới (BR-05, `FAILED` không khóa key), xem A3.
- **Yêu cầu:** FR-16, NFR-13.

### E5 — Mã giảm giá không hợp lệ (ngoài bản nộp)

Ngoài bản nộp (FR-17 Won’t). Giữ mã để số hiệu các luồng khác không bị xáo trộn.

### E6 — Dữ liệu không hợp lệ (tại bước 5, 6 hoặc 10)

- **Kích hoạt:** giỏ rỗng, số lượng ngoài khoảng 1 đến 99, quá 20 dòng, size hoặc topping không có thật, thiếu `paymentMethod`, thiếu `Idempotency-Key`.
- **Phản ứng:** lỗi định dạng thì UI chặn ngay trước khi gửi (AC-N06.3). Nếu vẫn tới API: 400 `VALIDATION_ERROR` hoặc `IDEMPOTENCY_KEY_REQUIRED` (AC-F12.1, AC-F14.2); sản phẩm không tồn tại: 404 `PRODUCT_NOT_FOUND` (AC-F12.2). Không tạo `Order` mới, không tạo `Payment`, không ký URL; UI báo lỗi ngay dưới từng ô.
- **Yêu cầu:** FR-12, FR-14, NFR-06.

### E7 — Đơn không thể thanh toán (tại bước 10)

- **Kích hoạt:** `orderId` không tồn tại (404 `ORDER_NOT_FOUND`), thuộc người khác (403 `FORBIDDEN`), hoặc là yêu cầu mới cho đơn đã `PAID`/`PREPARING`/`READY`/`COMPLETED`/`CANCELLED` (409 `ORDER_NOT_PAYABLE`). Trường hợp gửi lại một lần trả đã thành công, đúng chủ đơn/`orderId`/key/`paymentMethod`, được xử lý trước theo E4a (AC-F14.3).
- **Phản ứng:** không tạo `Payment`, không ký URL; UI báo lỗi tương ứng và dẫn khách về lịch sử đơn.
- **Yêu cầu:** FR-14, NFR-05.

### E8 — Lỗi hệ thống (tại bước 10 đến 14)

- **E8a — máy chủ đã lưu xong nhưng client mất phản hồi:** UI báo "Có lỗi xảy ra, vui lòng thử lại". Thử lại cùng `orderId`/key sẽ nhận kết quả đã lưu: `Payment` `SUCCESS` theo E4a, hoặc `Payment PENDING` còn hạn theo E4 (URL cũ). Không tạo thêm `Payment`, không ký lại URL.
- **E8b:** Đã bỏ khỏi bản nộp (rút gọn, SRS mục 1.4). Rủi ro từng chấp nhận trước đây không còn, vì IPN và QueryDR (E10, E11) xác định kết quả thay cho simulator. Giữ mã để số hiệu các luồng khác không bị xáo trộn.
- E8a chỉ áp dụng khi đã biết `orderId`; không gọi lại `POST /orders`. Nếu mất phản hồi tạo đơn mà chưa biết mã đơn thì làm theo SRS mục 8.6.
- **Yêu cầu:** NFR-13, FR-16.

### E9 — Chữ ký, merchant hoặc số tiền không hợp lệ (tại bước 17 và 20)

- **Kích hoạt:** IPN hoặc return có `vnp_SecureHash` sai, thiếu hoặc sai định dạng; `vnp_TmnCode` khác cấu hình; hoặc `vnp_Amount` khác `Payment.amount × 100`. Riêng IPN còn có thể mang `vnp_TxnRef` không khớp `Payment` nào.
- **Phản ứng:**
  1. IPN sai chữ ký hoặc sai merchant → `{"RspCode":"97","Message":"Invalid signature"}`; không tìm thấy `Payment` → `01`; sai số tiền → `04`. Luôn trả HTTP 200.
  2. `GET /payments/vnpay/return` sai chữ ký, sai merchant hoặc không tìm thấy payment → `{ valid: false }`; API không trả về ID lấy từ query chưa xác thực. Trang return chỉ khôi phục từ `orderId`/`paymentId` lưu trong `sessionStorage` của chính khách.
  3. Không đổi `Payment`, `Order` hay tồn kho; không ghi chữ ký hoặc toàn bộ query vào log.
- **Kết quả:** `Payment` vẫn `PENDING` cho tới khi có IPN hợp lệ (VNPay gọi lại) hoặc QueryDR đã xác thực (E10).
- **Yêu cầu:** FR-14, FR-16, BR-11, NFR-07, NFR-08.

### E10 — Mất IPN hoặc IPN đến muộn (tại bước 20)

- **Kích hoạt:** khách đã trả xong nhưng IPN chưa tới trong lúc trang return đang hỏi lại: Render miễn phí đang ngủ, API chạy local (VNPay không gọi được `localhost`), hoặc IPN tới sau 30 giây.
- **Phản ứng:**
  1. Trang return hỏi lại `GET /orders/:id`; nếu `Payment` vẫn `PENDING` thì gọi `POST /payments/:id/sync` một lần.
  2. API kiểm quyền trước: chưa đăng nhập 401, sai chủ đơn hoặc sai vai trò 403, không có payment 404 `PAYMENT_NOT_FOUND`. `Payment` đã `SUCCESS`/`FAILED` thì trả 200 theo DB, không gọi QueryDR.
  3. Payment còn `PENDING` (kể cả chưa hết hạn): API gọi QueryDR **bên ngoài** mọi transaction đang giữ khóa đơn, kiểm chữ ký phản hồi, merchant, mã tham chiếu và số tiền. Sau đó mở transaction, khóa đơn, đọc lại đúng payment vừa hỏi rồi ghi kết quả qua cùng hàm với IPN: `00/00` → `SUCCESS`, đơn `PAID`, trừ kho đúng một lần (như bước 18); `00/02` → `FAILED`, đơn `PAYMENT_FAILED` (E3); `00/01` hoặc `91` khi còn hạn → giữ `PENDING`, 409 `PAYMENT_IN_PROGRESS`.
  4. Lỗi mạng, hết thời gian chờ (timeout), chữ ký sai, thiếu cấu hình hoặc mã truy vấn khác → 502 `PAYMENT_PROVIDER_ERROR`, không đổi DB (E13); payment đã quá `expiresAt + 15 phút` thì đóng theo E11. Khi nhận 409 hoặc 502, UI hiện "Đang xác minh thanh toán, vui lòng kiểm tra lại" kèm nút kiểm tra lại; không tự gọi QueryDR lặp đi lặp lại.
- **Kết quả:** trạng thái cuối do DB quyết định. Nếu IPN thật tới trong lúc API đang chờ QueryDR thì kết quả đọc lại dưới khóa không bị kết quả cũ ghi đè, và kho chỉ bị trừ một lần.
- **Yêu cầu:** FR-14, FR-16, BR-11, NFR-13.

### E11 — Payment PENDING quá hạn (tại bước 10, khi hủy đơn ở A5 hoặc khi `sync`)

- **Kích hoạt:** `now >= expiresAt` (hạn 15 phút, trùng mốc với `vnp_ExpireDate` đã ký) mà `Payment` vẫn `PENDING`, và khách tạo thanh toán lại, hủy đơn hoặc kiểm tra trạng thái. Hết hạn chưa chắc là chưa thu tiền: khách có thể trả sát giờ mà IPN tới muộn, nên API phải hỏi VNPay trước khi kết luận. Spike 2026-10-30 cho thấy VNPay từ chối thanh toán sau `vnp_ExpireDate`, nhưng QueryDR sandbox trả `99` không chữ ký cho mọi yêu cầu, nên không thể chỉ chờ QueryDR để kết thúc một payment bỏ dở.
- **Khoảng chờ (D6):** 15 phút sau `expiresAt` (`EXPIRY_GRACE_MS`). Hết khoảng chờ nghĩa là `now >= expiresAt + 15 phút` (`isPastGrace`), với `now` là lúc gửi QueryDR; `Payment` không có `expiresAt` thì không bao giờ hết khoảng chờ. Việc đóng chỉ xảy ra khi có lời gọi (tạo thanh toán lại, hủy đơn hoặc `sync`), không có job chạy nền.
- **Phản ứng:** sau khi kiểm quyền, API gọi QueryDR ngoài transaction, kiểm phản hồi như E10, rồi mở transaction, khóa đơn, đọc lại đúng payment vừa hỏi. Tùy kết quả:
  - `00/00` → `SUCCESS`, đơn `PAID`. Với `POST /payments`, API xét gửi lại theo BR-05 **trước**: cùng chủ đơn/key/`paymentMethod` → 200 `SUCCESS` (E4a); khác key hoặc khác phương thức → 409 `ORDER_NOT_PAYABLE`. Nếu đang hủy đơn thì đơn đã `PAID` nên không hủy được.
  - `00/02` → `FAILED`, đơn `PAYMENT_FAILED`; khách thử lại (A3) hoặc hủy (A5).
  - `91` sau hạn và phản hồi đã xác thực → `FAILED` với `gatewayResponseCode = "EXPIRED"`, đơn `PAYMENT_FAILED`. `EXPIRED` chỉ là giá trị nội bộ của `gatewayResponseCode`, không phải một trạng thái của `PaymentStatus`. Nếu còn hạn thì giữ `PENDING`, 409 `PAYMENT_IN_PROGRESS`. Spike chưa gặp mã `91` (QueryDR sandbox lỗi); nhánh đóng sau khoảng chờ bên dưới vẫn áp dụng dù `91` không bao giờ xuất hiện.
  - `00/01` đã xác thực: còn trong khoảng chờ → giữ `PENDING`, 409 `PAYMENT_IN_PROGRESS`, không tạo giao dịch mới và không hủy; hết khoảng chờ → đóng payment (xem "Đóng payment" bên dưới). Nhờ vậy ca bỏ dở (đã mở URL nhưng chưa trả, hoặc khách bỏ đi) không bị kẹt mãi.
  - Nhóm trạng thái đảo giao dịch, hoàn tiền hoặc đáng ngờ (`04`/`05`/`06`/`07`/`09`), và phản hồi `00` có chữ ký hợp lệ nhưng sai merchant, mã tham chiếu, số tiền hay loại giao dịch (`MISMATCH`, chỉ áp cho phản hồi `00`) → giữ `PENDING`, 502 `PAYMENT_PROVIDER_ERROR`, không đổi DB, ghi warning để đối soát. Các trường hợp này **không bao giờ tự đóng**, kể cả sau khoảng chờ.
  - Các trường hợp còn lại: còn trong khoảng chờ → giữ `PENDING`, 502, không đổi DB (E13); hết khoảng chờ → đóng payment. Gồm: response `00` kèm status thiếu hoặc chưa hỗ trợ; mã truy vấn khác (`02`/`03`/`94`/`97`/`99`...); phản hồi mang mã khác `00` (kể cả `91`) có chữ ký hợp lệ nhưng sai hoặc thiếu merchant, mã tham chiếu (`BAD_RESPONSE`; VNPay có thể trả phản hồi lỗi đã ký với các trường rỗng, nên không xếp vào `MISMATCH` để đơn không kẹt mãi); hoặc phản hồi không xác thực được (không chữ ký, sai chữ ký, timeout, lỗi mạng, không đọc được, thiếu cấu hình truy vấn, thiếu `gatewayCreateDate`). Việc đóng là chính sách hết hạn của ứng dụng; `94`/`99` hay lỗi truy vấn không được coi là bằng chứng giao dịch thất bại.
- **Đóng payment (hết khoảng chờ):**
  1. Trong transaction giữ khóa đơn, API đổi `Payment` từ `PENDING` sang `FAILED` với `gatewayResponseCode = "EXPIRED"` và `gatewayTransactionStatus = null`, đổi `Order` sang `PAYMENT_FAILED`; nguyên liệu và kho không đổi (AC-F15.3).
  2. API ghi warning `PAYMENT_EXPIRED_UNCONFIRMED vnp_TxnRef=<id>` kèm lý do truy vấn lỗi, hoặc `vnp_ResponseCode`/`vnp_TransactionStatus` đã xác thực.
  3. Khách thấy đơn `PAYMENT_FAILED` và dòng "Đã hết thời gian thanh toán" ở payment trên trang chi tiết đơn (màn này chọn thông báo theo `gatewayResponseCode` của payment `FAILED`, ở đây là `EXPIRED`), rồi chọn thử lại (A3, tạo payment mới) hoặc hủy (A5, nhả nguyên liệu). Lời gọi vừa đóng payment tiếp tục như với một payment `FAILED`: `POST /payments` chạy lại các bước E4 từ mục 1 ngay trong lời gọi đó nên tạo luôn lần thử mới (201); hủy đơn xét tiếp theo A5; `sync` trả trạng thái mới.
  4. IPN thành công tới sau khi đã đóng thì đi theo E12: `RspCode 02`, warning `PAYMENT_RECONCILIATION_REQUIRED`, nhân viên hoàn tiền tay.
- **Kết quả:** còn trong khoảng chờ mà chưa kết luận thì `Payment` giữ `PENDING`, khách chưa tạo được giao dịch mới và chưa hủy được (BR-10). Hết khoảng chờ thì payment đóng `FAILED`, khách thử lại hoặc hủy được; riêng nhóm trạng thái đáng ngờ và `MISMATCH` (phản hồi `00`) vẫn giữ `PENDING` chờ đối soát tay. Không nhả nguyên liệu chỉ vì payment `FAILED`/`EXPIRED`; chưa có job tự hủy đơn.
- **Yêu cầu:** FR-14, FR-15, FR-16, FR-25, BR-10, NFR-13.

### E12 — Tiền về sau trạng thái cuối (tại bước 17)

- **Kích hoạt:** IPN (hoặc QueryDR) báo thành công (`vnp_ResponseCode = 00` và `vnp_TransactionStatus = 00`) trong khi `Payment` đã `FAILED` (kể cả `EXPIRED`), đơn đã `CANCELLED`, hoặc đơn đã được trả bằng payment khác.
- **Phản ứng:** IPN trả `RspCode = 02`; API ghi warning `PAYMENT_RECONCILIATION_REQUIRED` kèm `vnp_TxnRef` và **không** đổi đơn, payment hay kho. Nhân viên tra Merchant Admin theo `vnp_TxnRef` và hoàn tiền tay nếu cần (xem [`../deployment.md`](../deployment.md)).
- **Không phải E12:** IPN gửi lại của chính `Payment SUCCESS` trên đơn `PAID` (hoặc đã vào pha chế, đã hoàn tất) chỉ nhận `02`, không cảnh báo. IPN thành công tới sau `expiresAt` nhưng `Payment` và đơn vẫn `PENDING` thì nhận bình thường như bước 18.
- **Kết quả:** trạng thái cuối trong DB không bị mở lại; khoản tiền thu thừa được xử lý bên ngoài hệ thống.
- **Yêu cầu:** FR-14, FR-15 (AC-F15.7), BR-11, NFR-20.

### E13 — Thiếu cấu hình VNPay hoặc lỗi provider (tại bước 12, 17 và 20)

- **Kích hoạt:** thiếu `VNP_TMN_CODE`, `VNP_HASH_SECRET` hoặc `WEB_URL` cho thao tác đang chạy (tạo URL mới cần cả ba; IPN, kiểm return và QueryDR chỉ cần hai biến đầu), hoặc QueryDR gặp lỗi mạng, hết thời gian chờ, chữ ký sai, mã truy vấn lạ.
- **Phản ứng:**
  1. Tạo URL mới hoặc `sync` → 502 `PAYMENT_PROVIDER_ERROR`; không tạo `Payment`, không đổi trạng thái đơn hay kho (với lỗi QueryDR thì DB không đổi trong khoảng chờ; hết khoảng chờ thì đóng theo AC-F16.10, xem E11). UI báo "Có lỗi xảy ra, vui lòng thử lại"; giỏ và đơn vẫn còn.
  2. IPN thiếu secret hoặc merchant → `RspCode = 99`, không đọc hay ghi DB, để VNPay gọi lại sau khi bổ sung biến (không trả `97`, vì chữ ký chưa kiểm được chứ không phải sai).
  3. Return thiếu cấu hình để xác minh → `{ valid: false }`.
  4. Gửi lại (`SUCCESS`, `PENDING` còn hạn) và đọc trạng thái từ DB vẫn chạy, không cần biến VNPay. API vẫn khởi động khi thiếu biến; log khởi động chỉ ghi tên biến bị thiếu.
- **Kết quả:** đơn, payment và kho không bị ảnh hưởng (trong khoảng chờ; hết khoảng chờ thì đóng theo AC-F16.10); khách thử lại sau khi cấu hình đủ.
- **Yêu cầu:** FR-14, NFR-07, NFR-15.

## 8. Quy tắc nghiệp vụ áp dụng

Định nghĩa đầy đủ ở [`srs.md`](srs.md) mục 3.5.

| Mã | Quy tắc | Dùng ở |
|---|---|---|
| BR-01 | Giá do máy chủ tính từ catalog; trường giá/tổng tiền do client gửi bị từ chối (AC-F12.3) | bước 7; E6 |
| BR-02 | Số lượng 1 đến 99; tối đa 20 dòng | điều kiện đầu; bước 6; E6 |
| BR-03 | Giữ chỗ tồn kho khi tạo đơn, trả lại khi đơn `CANCELLED` (A5) | bước 8; E2; A5 |
| BR-04 | Chỉ chủ đơn được thanh toán; chỉ đơn `PENDING` hoặc `PAYMENT_FAILED` mới thanh toán được | bước 10; E7 |
| BR-05 | `Idempotency-Key` bắt buộc; xét gửi lại theo thứ tự `SUCCESS` rồi `Payment PENDING` còn hạn; `FAILED` không khóa key | bước 10; E4; E11; A3; A6 |
| BR-08 | Máy trạng thái đơn (`PENDING → PAID`, `PENDING → PAYMENT_FAILED`, `PAYMENT_FAILED → PENDING`, `PENDING`/`PAYMENT_FAILED → CANCELLED`); đơn vẫn `PENDING` trong lúc chờ VNPay | bước 8, 13, 18; E3; E10; A3; A5 |
| BR-09 | Thanh toán thất bại không xóa giỏ, không hủy đơn | E3 |
| BR-10 | Mỗi đơn tối đa một `Payment PENDING`; chưa rõ kết quả thì không mở lần thử mới, trừ khi payment đã hết khoảng chờ 15 phút sau `expiresAt` và bị đóng `FAILED` (E11) | bước 13; E4; E11; A5; A6 |
| BR-11 | Chỉ IPN hoặc QueryDR đã xác thực mới được quyết định kết quả cuối; return URL chỉ hiển thị | bước 17 đến 20; E9; E10; E12 |

## 9. Liên kết bước và luồng với yêu cầu

| Bước / luồng | Mô tả ngắn | Yêu cầu chức năng | Yêu cầu phi chức năng |
|---|---|---|---|
| Tiền điều kiện 1 | Đã đăng nhập, JWT hợp lệ | FR-09, FR-10 | NFR-05 |
| Tiền điều kiện 2 | Giỏ hợp lệ | FR-05, FR-06, FR-07 | — |
| 1 | Bấm "Thanh toán" ở giỏ | FR-07, FR-10 | NFR-09 |
| 2 | Màn Thanh toán | FR-07, FR-12 (AC-F12.4) | NFR-09, NFR-11 |
| 3 | Chọn phương thức (không nhập thẻ ở BrewLite) | FR-14 | NFR-09 |
| 4, 5 | Bấm "Thanh toán qua VNPay", khóa nút, tạo `Idempotency-Key`, gọi `POST /orders` | FR-11, FR-16 (AC-F16.6) | NFR-06 |
| 6 | Xác thực JWT, kiểm dữ liệu | FR-10, FR-12 | NFR-05, NFR-06 |
| 7 | Tính giá phía máy chủ | FR-12 | NFR-06 |
| 8 | Transaction tạo đơn, giữ chỗ tồn kho | FR-11, FR-13 | NFR-03, NFR-13 |
| 9, 10 | `POST /payments`, kiểm đơn, key và gửi lại | FR-14, FR-16 | NFR-05, NFR-06 |
| 11 | Số tiền cần thu bằng `total` | FR-14 | — |
| 12, 13 | Ký URL, transaction tạo `Payment PENDING` | FR-14 | NFR-03, NFR-07, NFR-13 |
| 14, 15 | Trả `paymentUrl`, lưu phiên và chuyển sang VNPay | FR-14 | NFR-03 |
| 16 | Khách trả trên trang VNPay | FR-14 | NFR-08 |
| 17, 18 | IPN, transaction: `Payment SUCCESS`, trừ kho, `PAID` | FR-14, FR-16 | NFR-08, NFR-13 |
| 19, 20 | Return, hỏi lại chi tiết đơn, `sync` khi còn `PENDING` | FR-14, FR-22 | NFR-11 |
| 21 | Màn xác nhận, xóa giỏ | FR-20, FR-22 | NFR-11 |
| A1 | Ngoài bản nộp (FR-17 Won’t) | — | — |
| A2 | Đổi phương thức | FR-14 | — |
| A3 | Thử lại thanh toán | FR-15, FR-16 | — |
| A4 | Rời màn thanh toán | FR-07 | — |
| A5 | Hủy đơn chưa trả (FR-25 Must); bị chặn khi còn payment chưa kết luận | FR-25 | — |
| A6 | Quay lại checkout, "Tiếp tục thanh toán" bằng URL cũ | FR-14, FR-16 | — |
| E1a/E1b | Chưa tạo đơn / tiếp tục đơn cũ sau khi đăng nhập lại đúng tài khoản | FR-10 | NFR-05 |
| E2 | Hết hàng | FR-13 | NFR-13 |
| E3 | Thanh toán thất bại do IPN/QueryDR xác nhận (kể cả khách hủy trên VNPay) | FR-15 | NFR-03 |
| E4 | Gửi lại cùng Idempotency-Key; `Payment PENDING` còn hạn | FR-16 | NFR-13 |
| E5 | Ngoài bản nộp (FR-17 Won’t) | — | — |
| E6 | Dữ liệu không hợp lệ | FR-12, FR-14 | NFR-06 |
| E7 | Đơn không thể thanh toán | FR-14 | NFR-05 |
| E8 | Mất phản hồi sau khi đã lưu (E8a); E8b đã bỏ | FR-16 (AC-F16.1) | NFR-13 |
| E9 | Chữ ký, merchant hoặc số tiền sai | FR-14, FR-16 | NFR-07, NFR-08 |
| E10 | Mất hoặc muộn IPN, `sync` bằng QueryDR | FR-14, FR-16 | NFR-13 |
| E11 | `Payment PENDING` quá hạn, đối soát QueryDR; hết khoảng chờ 15 phút thì đóng `FAILED` (`EXPIRED`) | FR-14, FR-15, FR-16, FR-25 | NFR-13 |
| E12 | Tiền về sau trạng thái cuối, warning đối soát | FR-14, FR-15 | NFR-20 |
| E13 | Thiếu cấu hình VNPay hoặc lỗi provider | FR-14 | NFR-07, NFR-15 |
| Trạng thái đơn | Các lần chuyển trạng thái trong use-case | FR-23 | — |

## 10. Gợi ý test từ đặc tả

A1 và E5 ngoài bản nộp nên không có test; A5 bắt buộc kiểm chứng trong BREW-INVENTORY-01 (FR-25 Must).

Mỗi luồng được chuyển thành test dựa trên chính tiêu chí chấp nhận trong `srs.md` (mã test cụ thể ghi ở ma trận truy vết khi Task 4–5 viết):

- **Luồng chính:** một test E2E menu → giỏ → đăng nhập → thanh toán Ví → màn xác nhận (FR-14, FR-20); và một kiểm chứng integration chạy trước khi gỡ bộ test khỏi bản phân phối (kết quả ở inventory-verification.md): `POST /orders` rồi `POST /payments`, kiểm `PAID`, snapshot, onHand/reserved, `Payment`.
- **E1a:** Guest bấm "Thanh toán" được chuyển tới trang đăng nhập, quay lại vẫn còn giỏ; 401 ở bước tạo đơn không tạo Order (AC-F10.1).
- **E1b:** tạo đơn thành công rồi làm token hết hạn trước khi thanh toán; đăng nhập lại đúng tài khoản, thanh toán đúng orderId cũ, số Order và tồn kho không đổi thêm. Kiểm cả đơn đã trả, đã hủy và trường hợp đăng nhập nhầm tài khoản (AC-F10.4).
- **E2:** integration test đặt quá tồn (AC-F13.1) và đặt đồng thời (AC-F13.3).
- **E3 và A3:** thao tác trên sandbox: bấm "Hủy" trên trang VNPay (đơn thành `PAYMENT_FAILED`, `reserved` vẫn giữ), rồi thử lại thành công cùng `orderId` (AC-F15.1, AC-F15.5).
- **E4 và A6:** gửi hai lần cùng key rồi đếm số `Payment`: sau `SUCCESS` còn đúng 1 bản ghi (AC-F16.1); khi còn `Payment PENDING` thì cùng phương thức nhận lại URL cũ, khác phương thức nhận 409 `PAYMENT_IN_PROGRESS`.
- **E9, E12 và hàm thuần:** unit test tối thiểu cho chữ ký URL/return/IPN/QueryDR và bảng ánh xạ mã QueryDR; gọi lại IPN cùng tham số phải nhận `02`, không trừ kho lần hai.
- **E10, E11, E13:** chạy local không có IPN, trang return gọi `sync` và đơn thành `PAID`; QueryDR do kịch bản kiểm soát trả `00/01`, `00/02`, `91`, `94`; chạy API không có `VNP_HASH_SECRET`. Ca "đã mở URL nhưng chưa trả" kiểm theo mã thực tế ghi ở spike, không mặc định là `91`.
- **A5 (FR-25 Must):** API test hủy đơn `PENDING`/`PAYMENT_FAILED` và kiểm `reserved` được giải phóng, `onHand` không đổi (AC-F25.1).
- **Máy trạng thái:** unit test 49 cặp: 8 hợp lệ, 41 bị từ chối, trong đó có từ chối PAID → CANCELLED (AC-F23.1).

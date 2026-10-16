# Đặc tả use-case trọng tâm: UC-04 Đặt và thanh toán đơn hàng (Task 1.3)

> **Baseline Task 1 theo phạm vi minimum đã chốt trong PR #5, đã rút gọn thêm (SRS mục 1.4).** Thành viên phụ trách phải tự giải thích được từng luồng khi vấn đáp.
>
> Đáp ứng đề A2 §3.3. Yêu cầu: [`srs.md`](srs.md) (mã `FR-xx`, `NFR-xx`, quy tắc `BR-xx`, mã lỗi ở mục 3). Phạm vi: [`context-and-scope.md`](context-and-scope.md). Use-case tổng quát: [`use-case-overview.svg`](use-case-overview.svg). Truy vết: [`../traceability-matrix.md`](../traceability-matrix.md).
>
> Use-case này là đầu vào cho Task 2: activity diagram (ba nhánh hết hàng, chưa đăng nhập, thanh toán thất bại) và sequence diagram (Customer, Next.js UI, NestJS API, Database, Payment Service) phải khớp các luồng dưới đây.

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
| Mục tiêu | Customer biến giỏ hàng thành một đơn hàng đã thanh toán không dùng tiền mặt, nhận mã đơn xác nhận |
| Giá trị nghiệp vụ | Là bước tạo doanh thu của BrewLite: khách trả tiền xong thì đơn mới vào quy trình pha chế |
| Ưu tiên | Must (lõi); Áp mã giảm giá và Ghi nhận điểm thưởng ngoài bản nộp (FR-17/18) |
| Use-case con | UC-04.1 Tạo đơn hàng (include), UC-04.2 Thanh toán đơn hàng (include), UC-04.3 Áp mã giảm giá (extend UC-04.2, ngoài bản nộp), UC-04.4 Ghi nhận điểm thưởng (extend UC-04.2, ngoài bản nộp), UC-04.5 Thử lại thanh toán (extend UC-04.2); UC-03 Đăng nhập extend UC-04 khi chưa đăng nhập |
| Lý do chọn | Đi qua đủ các thành phần (UI, API, DB, Payment Service) và đủ ba nhánh lỗi bắt buộc của đề A2 §4.1 (hết hàng, chưa đăng nhập, thanh toán thất bại); là use-case mà sequence diagram Task 2.2 phải vẽ |

## 2. Use-case diagram

![Use-case UC-04](uc-checkout.svg)

Nguồn: [`uc-checkout.puml`](uc-checkout.puml). Quan hệ:

- UC-04 `<<include>>` UC-04.1 và UC-04.2: chạy khi đặt đơn mới (tạo đơn rồi thanh toán). Khi tiếp tục đơn đã tạo qua E1b/A3, chỉ chạy lại UC-04.2; không tạo đơn lần nữa.
- UC-04.3, UC-04.4, UC-04.5 `<<extend>>` UC-04.2: chỉ chạy khi có điều kiện (UC-04.3 và UC-04.4 ngoài bản nộp, chỉ khi triển khai FR-17/FR-18; UC-04.5 khi đơn đang `PAYMENT_FAILED`).
- UC-03 Đăng nhập `<<extend>>` UC-04: chỉ chạy khi chưa có phiên đăng nhập; đây là cách vẽ của ngoại lệ "chưa đăng nhập". Tiền điều kiện của use-case vẫn là đã đăng nhập (mục 4).

## 3. Actor

| Actor | Loại | Vai trò trong use-case |
|---|---|---|
| **Customer** (khách hàng đã đăng nhập) | Chính | Bắt đầu use-case, chọn phương thức, bấm xác nhận trả, nhận kết quả |
| **Guest** (khách vãng lai) | Chính (kế thừa) | Chỉ xuất hiện ở ngoại lệ E1: chưa đăng nhập thì không bắt đầu được, phải qua UC-03. `Customer` kế thừa `Guest` |
| **Payment Service** (dịch vụ thanh toán mô phỏng) | Phụ | Nhận yêu cầu trừ tiền, trả `SUCCESS` hoặc từ chối (quy ước mô phỏng: `srs.md` mục 3.4) |

Barista không tham gia use-case này (xem UC-07 trong `srs.md` mục 2.3). Các thành phần kỹ thuật dùng trong luồng: Next.js UI, NestJS API, Database (đúng bộ lifeline của sequence diagram, đề A2 §4.2).

## 4. Trigger, tiền điều kiện, hậu điều kiện

**Trigger:** Customer bấm nút "Thanh toán" trên màn Giỏ hàng.

**Tiền điều kiện:**

1. Customer đã đăng nhập: có JWT hợp lệ, chưa hết hạn, `role = CUSTOMER` (FR-09, FR-10).
2. Giỏ hàng có ít nhất 1 dòng và mọi dòng hợp lệ: số lượng 1 đến 99, tối đa 20 dòng (FR-05, FR-06, BR-02).
3. API và database hoạt động.

(Nếu tiền điều kiện 1 không đúng thì chạy ngoại lệ E1, không tính là lỗi hệ thống.)

**Hậu điều kiện khi thành công (đơn đã `PAID`):**

- Đúng 1 `Order` của Customer ở trạng thái `PAID`, kèm các `OrderItem` khớp giỏ; `Order.total` do server tính (BR-01).
- Đúng 1 `Payment` `SUCCESS` cho đơn, lưu `Idempotency-Key`.
- `stock` mỗi sản phẩm đã giảm đúng số lượng đặt (đã giữ chỗ ở bước 8).
- Giỏ hàng trên trình duyệt đã bị xóa; Customer thấy màn xác nhận có mã đơn.

**Hậu điều kiện khi thất bại** (mỗi nhánh chi tiết ở mục 7; đây là bảng tổng hợp):

| Tình huống | `Order` | `Payment` | Tồn kho | Giỏ hàng |
|---|---|---|---|---|
| E1a Chưa tạo đơn | không tạo | không | không đổi | giữ |
| E1b Đã tạo đơn, JWT hết hạn | giữ đơn cũ và orderId | không thêm do 401 | vẫn giữ chỗ, không trừ thêm | giữ |
| E2 Hết hàng | không tạo | không | không đổi | giữ (khách chỉnh) |
| E3 Thanh toán thất bại | `PAYMENT_FAILED` | 1 bản ghi `FAILED` | vẫn giữ chỗ | giữ |
| E4 Gửi lại cùng key (đã thành công) | giữ `PAID` | không thêm | không đổi thêm | đã xóa từ lần đầu |
| E5 Ngoài bản nộp (FR-17 Won’t) | — | — | — | — |
| E6 Dữ liệu không hợp lệ | không tạo (hoặc giữ nguyên) | không | không đổi | giữ |
| E7 Đơn không thanh toán được | không đổi | không | không đổi | giữ |

## 5. Luồng chính

Luồng thành công nhất: Customer đã đăng nhập, thanh toán Ví, còn đủ hàng.

| Bước | Tác nhân | Hành động |
|---|---|---|
| 1 | Customer | Mở màn Giỏ hàng và bấm "Thanh toán" |
| 2 | Next.js UI | Kiểm giỏ không rỗng và có JWT hợp lệ; hiển thị màn Thanh toán gồm tóm tắt các dòng, tổng tiền, lựa chọn phương thức Ví/Thẻ |
| 3 | Customer | Chọn phương thức (`WALLET` hoặc `CARD`; với `CARD` nhập số thẻ demo) |
| 4 | Customer | Bấm "Xác nhận trả" |
| 5 | Next.js UI | Kiểm dữ liệu nhập (định dạng thẻ), vô hiệu nút "Xác nhận trả", tạo `Idempotency-Key` cho phiên thanh toán; gửi `POST /orders` kèm JWT và danh sách dòng (không gửi giá) |
| 6 | NestJS API | Xác thực JWT và vai trò `CUSTOMER`; kiểm dữ liệu theo DTO (số lượng, size, topping, số dòng) |
| 7 | NestJS API | Tính giá từng dòng và `total` từ giá trong Database (BR-01) |
| 8 | NestJS API, Database | Trong **một transaction**: kiểm tồn kho từng sản phẩm; giữ chỗ (trừ `stock`); tạo `Order` ở `PENDING` và các `OrderItem`; commit. Trả 201 với `id`, `status = PENDING`, `total` |
| 9 | Next.js UI | Gửi `POST /payments` với `orderId`, `paymentMethod` (và `cardNumber` nếu là Thẻ); header `Idempotency-Key` |
| 10 | NestJS API | Xác thực JWT; kiểm dữ liệu và quyền sở hữu đơn; tra `Idempotency-Key`: nếu cùng người dùng/đơn/key/body đã thành công thì trả lại kết quả theo E4a trước khi kiểm trạng thái. Chỉ yêu cầu mới kiểm đơn ở `PENDING` hoặc `PAYMENT_FAILED` (luồng chính chưa có kết quả thành công) |
| 11 | NestJS API | Số tiền cần thu `amount = total` (bản nộp không áp khuyến mãi) |
| 12 | NestJS API → Payment Service | Gọi trừ tiền `amount` theo phương thức, kèm mã tham chiếu là `orderId` |
| 13 | Payment Service | Trả `SUCCESS` |
| 14 | NestJS API, Database | Trong **một transaction**: lưu `Payment` `SUCCESS` cùng `Idempotency-Key`; đổi `Order` từ `PENDING` sang `PAID`; commit |
| 15 | NestJS API | Trả 201 với `orderId`, `paymentId`, `status = SUCCESS`, `orderStatus = PAID`, `amount` |
| 16 | Next.js UI | Hiển thị màn xác nhận (mã đơn, trạng thái "Đã thanh toán", món, tiền); xóa giỏ hàng; cung cấp nút "Theo dõi đơn". Use-case kết thúc thành công |

## 6. Luồng thay thế

Luồng thay thế vẫn dẫn tới kết quả thành công hoặc một kết thúc có kiểm soát, không phải lỗi.

### A1 — Áp mã giảm giá hợp lệ (ngoài bản nộp)

Ngoài bản nộp (FR-17 Won’t). Giữ mã để không đổi số hiệu các luồng khác.

### A2 — Đổi phương thức trước khi xác nhận (tại bước 3)

Customer đổi giữa Ví và Thẻ, sửa số thẻ bao nhiêu lần tùy ý trước khi bấm "Xác nhận trả". Chưa có `Order` nào được tạo nên không có tác dụng phụ. Quay lại bước 4.

### A3 — Thử lại thanh toán sau khi thất bại (UC-04.5; sau E3)

1. Đơn đang `PAYMENT_FAILED`, giỏ hàng và `orderId` được giữ (FR-15). Customer chọn phương thức khác hoặc nhập lại thẻ rồi bấm "Thử lại".
2. UI **không** gọi `POST /orders` lần nữa; gửi `POST /payments` cho cùng `orderId`.
3. Ở bước 10, API chấp nhận đơn `PAYMENT_FAILED`, chuyển về `PENDING` trước khi gọi Payment Service.
4. Tiếp tục từ bước 12. Kết quả: không sinh đơn mới (AC-F15.5).

### A4 — Customer rời màn Thanh toán trước khi xác nhận (tại bước 2 đến 4)

Customer bấm quay lại hoặc đóng trang trước bước 4. Chưa có `Order`, giỏ hàng giữ nguyên, tồn kho không đổi. Use-case kết thúc không có tác dụng phụ.

### A5 — Customer hủy đơn sau khi thanh toán thất bại (sau E3; chỉ khi làm FR-25, Could)

Nếu không làm FR-25, khách không hủy được qua giao diện/API: đơn `PAYMENT_FAILED` còn nguyên và giữ chỗ tồn kho (chấp nhận ở SRS mục 8). Nếu làm: từ màn lỗi (hoặc lịch sử đơn), Customer bấm "Hủy đơn" và xác nhận. UI gọi `PATCH /orders/:id` với `{ "status": "CANCELLED" }`; API chuyển `PAYMENT_FAILED` sang `CANCELLED` và hoàn lại tồn kho giữ chỗ (FR-25). Use-case kết thúc: đơn `CANCELLED`, giỏ hàng vẫn còn để khách đặt lại nếu muốn.

## 7. Luồng ngoại lệ

Ba nhánh bắt buộc của đề A2 §4.1 là **E1, E2, E3**; E4 là điều kiện idempotency của đề A2 §4.2.

### E1 — Chưa đăng nhập hoặc JWT hết hạn (UC-03 extend UC-04)

**E1a — Chưa tạo đơn:** ở bước 1/2 không có JWT hợp lệ, hoặc bước 6 trả 401.

1. Nếu UI biết chưa đăng nhập thì không gọi `POST /orders`; API trả 401 trước khi tạo đơn nếu token sai/hết hạn.
2. Giữ giỏ; chuyển tới `/login?next=/checkout`. Khi token hết hạn, hiển thị "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại".
3. Sau đăng nhập, quay lại bước 2 rồi tạo đơn theo luồng chính.
4. Kết quả trước khi đăng nhập lại: không tạo `Order`/`Payment`, tồn kho không đổi. Không đăng nhập thì kết thúc không có tác dụng phụ.

**E1b — Đã tạo đơn:** bước 8 đã trả `orderId`, nhưng bước 10 (`POST /payments`) trả 401.

1. Giữ `orderId`, tài khoản chủ đơn, giỏ và `Idempotency-Key` khi chuyển tới đăng nhập. 401 không tạo thêm `Payment` và không đổi đơn/tồn kho đã giữ.
2. Sau đăng nhập lại **cùng tài khoản**, UI đọc `GET /orders/:id` để xác nhận trạng thái và quyền sở hữu.
3. Với `PENDING`, tiếp tục bước 9 trên **đơn cũ**; với `PAYMENT_FAILED`, tiếp tục A3. Không quay lại bước 5, không gọi lại `POST /orders` và không trừ kho thêm.
4. Nếu đơn đã `PAID`/`PREPARING`/`READY`/`COMPLETED`, hiển thị chi tiết/kết quả đã có; nếu `CANCELLED`, dừng thanh toán và hiển thị đơn đã hủy. Không gửi thanh toán mới.
5. Nếu đăng nhập tài khoản khác, không tự tiếp tục đơn cũ; API đọc/trả tiền đơn của người khác trả 403. UI yêu cầu đăng nhập đúng tài khoản hoặc về lịch sử của tài khoản mới, không tự tạo đơn thay thế.
6. Không đăng nhập lại thì đơn cũ và tồn kho giữ chỗ vẫn còn; khách có thể trở lại lịch sử bằng tài khoản chủ đơn để tiếp tục (hoặc hủy, nếu làm FR-25).

**Yêu cầu:** FR-10 (AC-F10.3–4), FR-14/16, FR-21/22, NFR-05. Nếu mất phản hồi `POST /orders` và chưa biết `orderId`, không coi là E1a: không tự gửi lại; kiểm tra lịch sử theo SRS mục 8.6.

### E2 — Hết hàng (tại bước 8)

- **Kích hoạt:** số lượng đặt của một sản phẩm lớn hơn `stock` hiện tại (kể cả `stock = 0`), ví dụ đặt 5 Bạc xỉu khi tồn 3, hoặc người khác vừa mua hết trong lúc khách đang trả.
- **Phản ứng:**
  1. API hoàn tác transaction: không tạo `Order`, không đổi `stock` của bất kỳ sản phẩm nào (kể cả dòng hợp lệ).
  2. API trả 409 `OUT_OF_STOCK` với `details = [{ productId, requested, available }]` (AC-F13.1, AC-F13.2).
  3. UI hiển thị "{Tên món} chỉ còn N ly" hoặc "{Tên món} đã hết hàng", đưa khách về giỏ, đánh dấu dòng liên quan (AC-F13.4).
  4. Customer sửa số lượng hoặc xóa món rồi quay lại bước 1.
- **Kết quả:** không có đơn mới trong lịch sử (AC-F13.5); không bao giờ bán vượt tồn kho kể cả khi đặt đồng thời (AC-F13.3).
- **Yêu cầu:** FR-13, NFR-13.

### E3 — Thanh toán thất bại (tại bước 12 và 13)

- **Kích hoạt:** Payment Service từ chối (ví dụ thẻ demo `...0002`).
- **Phản ứng:**
  1. API lưu 1 `Payment` `FAILED`, đổi `Order` từ `PENDING` sang `PAYMENT_FAILED`.
  2. API trả 402 `PAYMENT_DECLINED` (AC-F15.1).
  3. UI hiển thị "Thanh toán không thành công. Đơn của bạn vẫn được giữ, bạn có thể thử lại hoặc chọn phương thức khác." kèm nút "Thử lại" (và "Hủy đơn" nếu làm FR-25); nút "Xác nhận trả" được bật lại.
  4. Customer chọn A3 (thử lại) hoặc, nếu có FR-25, A5 (hủy đơn).
- **Kết quả:** giỏ hàng và đơn được giữ; tồn kho vẫn giữ chỗ; khách không bị tính tiền (Payment Service không ghi nhận khoản thu).
- **Yêu cầu:** FR-15, FR-16, NFR-03.

### E4 — Gửi lại yêu cầu thanh toán với cùng Idempotency-Key (tại bước 9 và 10)

Xảy ra khi khách bấm đúp, mất phản hồi rồi bấm lại, hoặc mạng tự gửi lại.

- **E4a — lần đầu đã thành công:** Sau xác thực và kiểm quyền sở hữu, API thấy `Idempotency-Key` đã gắn với một `Payment` `SUCCESS` của đúng người dùng/đơn/body này (ưu tiên trước kiểm trạng thái đơn), **không** gọi Payment Service, trả 200 với nội dung kết quả cũ (cùng `paymentId`) (AC-F16.1). UI hiển thị màn xác nhận như bước 16.
- **E4b:** Đã bỏ khỏi bản nộp (rút gọn, SRS mục 1.4). Giữ mã để không đổi số hiệu các luồng khác.
- **E4c:** Đã bỏ khỏi bản nộp (rút gọn, SRS mục 1.4). Giữ mã để không đổi số hiệu các luồng khác.
- **E4d — đơn đã `PAID`, key mới:** API trả 409 `ORDER_NOT_PAYABLE`, không gọi Payment Service, nên không trừ tiền lần hai (AC-F16.4).
- **E4e — lần đầu đã thất bại (E3):** gửi lại là lần thử mới (BR-05), xem A3.
- **Yêu cầu:** FR-16, NFR-13.

### E5 — Mã giảm giá không hợp lệ (ngoài bản nộp)

Ngoài bản nộp (FR-17 Won’t). Giữ mã để không đổi số hiệu các luồng khác.

### E6 — Dữ liệu không hợp lệ (tại bước 5, 6 hoặc 10)

- **Kích hoạt:** giỏ rỗng, số lượng ngoài 1 đến 99, quá 20 dòng, size hoặc topping lạ, thiếu `paymentMethod`, thiếu `Idempotency-Key`, số thẻ sai định dạng.
- **Phản ứng:** UI chặn trước khi gửi nếu lỗi định dạng (AC-N06.3). Nếu vẫn tới API: 400 `VALIDATION_ERROR` hoặc `IDEMPOTENCY_KEY_REQUIRED` (AC-F12.1, AC-F14.2); sản phẩm không tồn tại: 404 `PRODUCT_NOT_FOUND` (AC-F12.2). Không tạo `Order` mới, không gọi Payment Service; UI hiển thị lỗi dưới từng ô.
- **Yêu cầu:** FR-12, FR-14, NFR-06.

### E7 — Đơn không thể thanh toán (tại bước 10)

- **Kích hoạt:** `orderId` không tồn tại (404 `ORDER_NOT_FOUND`), thuộc người khác (403 `FORBIDDEN`), hoặc yêu cầu mới cho đơn đã `PAID`/`PREPARING`/`READY`/`COMPLETED`/`CANCELLED` (409 `ORDER_NOT_PAYABLE`; replay thành công đúng người dùng/đơn/key/body được xử lý trước theo E4a) (AC-F14.3).
- **Phản ứng:** không gọi Payment Service; UI hiển thị thông báo tương ứng và dẫn khách về lịch sử đơn.
- **Yêu cầu:** FR-14, NFR-05.

### E8 — Lỗi hệ thống (tại bước 10 đến 15)

- **E8a — lỗi 5xx hoặc mất kết nối trước khi có phản hồi:** UI hiển thị "Có lỗi xảy ra, vui lòng thử lại"; vì thanh toán idempotent nên bấm lại an toàn (E4a, A3). Chỉ áp dụng khi đã biết `orderId`; không gọi lại `POST /orders`.
- **Yêu cầu:** NFR-13, FR-16.

## 8. Quy tắc nghiệp vụ áp dụng

Định nghĩa đầy đủ ở [`srs.md`](srs.md) mục 3.5.

| Mã | Quy tắc | Dùng ở |
|---|---|---|
| BR-01 | Giá do server tính từ catalog; bỏ qua giá client | bước 7; E6 |
| BR-02 | Số lượng 1 đến 99; tối đa 20 dòng | điều kiện đầu; bước 6; E6 |
| BR-03 | Giữ chỗ tồn kho khi tạo đơn, hoàn khi đơn `CANCELLED` (A5 chỉ khi làm FR-25) | bước 8; E2; A5 |
| BR-04 | Chỉ chủ đơn thanh toán; chỉ `PENDING` hoặc `PAYMENT_FAILED` thanh toán được | bước 10; E7 |
| BR-05 | `Idempotency-Key` bắt buộc; chỉ kết quả thành công được giữ | bước 10; E4; A3 |
| BR-08 | Máy trạng thái đơn (`PENDING → PAID`, `PENDING → PAYMENT_FAILED`, `PAYMENT_FAILED → PENDING`, `PENDING`/`PAYMENT_FAILED → CANCELLED`) | bước 8, 14; E3; A3; A5 |
| BR-09 | Thanh toán thất bại không xóa giỏ, không hủy đơn | E3 |

## 9. Liên kết bước và luồng với yêu cầu

| Bước / luồng | Mô tả ngắn | Yêu cầu chức năng | Yêu cầu phi chức năng |
|---|---|---|---|
| Tiền điều kiện 1 | Đã đăng nhập, JWT hợp lệ | FR-09, FR-10 | NFR-05 |
| Tiền điều kiện 2 | Giỏ hợp lệ | FR-05, FR-06, FR-07 | — |
| 1 | Bấm "Thanh toán" tại giỏ | FR-07, FR-10 | NFR-09 |
| 2 | Màn Thanh toán | FR-07, FR-12 (AC-F12.4) | NFR-09, NFR-11 |
| 3 | Chọn phương thức | FR-14 | NFR-09 |
| 4, 5 | Xác nhận, khóa nút, tạo `Idempotency-Key`, gọi `POST /orders` | FR-11, FR-16 (AC-F16.6) | NFR-06 |
| 6 | Xác thực JWT, validate | FR-10, FR-12 | NFR-05, NFR-06 |
| 7 | Tính giá phía server | FR-12 | NFR-06 |
| 8 | Transaction tạo đơn, giữ chỗ tồn kho | FR-11, FR-13 | NFR-03, NFR-13 |
| 9, 10 | `POST /payments`, kiểm đơn và key | FR-14, FR-16 | NFR-05, NFR-06 |
| 11 | Số tiền cần thu bằng `total` | FR-14 | — |
| 12, 13 | Gọi Payment Service | FR-14 | NFR-03 |
| 14 | Transaction: Payment, `PAID` | FR-14 | NFR-13 |
| 15, 16 | Trả kết quả, màn xác nhận, xóa giỏ | FR-20, FR-22 | NFR-11 |
| A1 | Ngoài bản nộp (FR-17 Won’t) | — | — |
| A2 | Đổi phương thức | FR-14 | — |
| A3 | Thử lại thanh toán | FR-15, FR-16 | — |
| A4 | Rời màn thanh toán | FR-07 | — |
| A5 | Hủy đơn sau thất bại (chỉ khi làm FR-25, Could) | FR-25 | — |
| E1a/E1b | Chưa tạo đơn / tiếp tục đơn cũ sau đăng nhập lại cùng tài khoản | FR-10 | NFR-05 |
| E2 | Hết hàng | FR-13 | NFR-13 |
| E3 | Thanh toán thất bại | FR-15 | NFR-03 |
| E4 | Gửi lại cùng Idempotency-Key | FR-16 | NFR-13 |
| E5 | Ngoài bản nộp (FR-17 Won’t) | — | — |
| E6 | Dữ liệu không hợp lệ | FR-12, FR-14 | NFR-06 |
| E7 | Đơn không thể thanh toán | FR-14 | NFR-05 |
| E8 | Lỗi hệ thống | FR-16 | NFR-13 |
| Trạng thái đơn | Chuyển trạng thái trong use-case | FR-23 | — |

## 10. Gợi ý test từ đặc tả

A1 và E5 ngoài bản nộp nên không có test; A5 chỉ có test khi làm FR-25 (Could).

Mỗi luồng chuyển thành test bằng chính tiêu chí chấp nhận trong `srs.md` (mã test cụ thể ghi ở ma trận truy vết khi Task 4–5 viết):

- **Luồng chính:** một test E2E menu → giỏ → đăng nhập → thanh toán Ví → màn xác nhận (FR-14, FR-20); một integration test `POST /orders` rồi `POST /payments` kiểm `PAID`, `stock`, `Payment`.
- **E1a:** Guest bấm "Thanh toán" được chuyển tới đăng nhập, quay lại còn giỏ; 401 ở tạo đơn không tạo Order (AC-F10.1).
- **E1b:** tạo đơn thành công rồi làm token hết hạn trước thanh toán; đăng nhập lại cùng tài khoản, thanh toán đúng orderId cũ, số Order và tồn kho không đổi thêm. Kiểm cả đơn đã trả/đã hủy và đăng nhập nhầm tài khoản (AC-F10.4).
- **E2:** integration test đặt quá tồn (AC-F13.1) và đặt đồng thời (AC-F13.3).
- **E3 và A3:** integration test thẻ `4000000000000002` rồi thẻ `4242424242424242` cùng `orderId` (AC-F15.1, AC-F15.5).
- **E4:** integration test gửi hai lần cùng key, đếm số lần gọi Payment Service và số `Payment` (AC-F16.1).
- **A5 (chỉ khi làm FR-25):** API test hủy đơn `PENDING`/`PAYMENT_FAILED` và kiểm `stock` được hoàn lại (AC-F25.1).
- **Máy trạng thái:** unit test 49 cặp: 8 hợp lệ, 41 bị từ chối, bao gồm từ chối PAID → CANCELLED (AC-F23.1).

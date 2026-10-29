# Đặc tả yêu cầu phần mềm rút gọn (SRS) — BrewLite Assignment 2

> Theo yêu cầu bàn giao cuối, bộ test dự án được loại sau kiểm chứng. Tiêu chí test tự động dưới đây mô tả cách kiểm tại revision trước cleanup và bằng chứng lịch sử; không cam kết suite còn được giao. Kết quả/lệnh thực chạy tại [inventory-verification.md](../inventory-verification.md).
>
> **BREW-INVENTORY-01 (2026-10-29):** mở rộng baseline Assignment 2 với kho nguyên liệu, công thức và hủy đơn chưa trả. FR-25 và FR-29 là Must của increment này; các quyết định minimum cũ được ghi lại như lịch sử.
>
> Đáp ứng đề A2 §3.2. Đề A2: [`../Assignment2-BrewLite.md`](../Assignment2-BrewLite.md). Bối cảnh, stakeholder, phạm vi: [`context-and-scope.md`](context-and-scope.md). Đặc tả use-case trọng tâm: [`uc-checkout.md`](uc-checkout.md). Truy vết: [`../traceability-matrix.md`](../traceability-matrix.md).
>
> Chỗ ghi **(dự kiến)** là tên endpoint, mã lỗi hoặc giá trị mà Task 2–5 có thể tinh chỉnh; nếu đổi thì sửa SRS, sơ đồ và ma trận truy vết trong cùng PR (xem `.claude/rules/doc-code-sync.md`).

## Mục lục

1. Giới thiệu
2. Tổng quan hệ thống: actor, use-case tổng quát, danh mục use-case
3. Quy ước dùng trong tiêu chí chấp nhận (API, mã lỗi, dữ liệu mẫu, quy tắc nghiệp vụ, từ điển miền dữ liệu)
4. Bảng tóm tắt yêu cầu theo nhóm
5. Yêu cầu chức năng (FR)
6. Yêu cầu phi chức năng (NFR)
7. Ánh xạ yêu cầu → stakeholder
8. Quyết định phạm vi và đầu vào cho task sau
9. Thuật ngữ

---

## 1. Giới thiệu

### 1.1 Mục đích

Tài liệu mô tả **hệ thống BrewLite làm gì và không làm gì** trong Assignment 2, dưới dạng yêu cầu có mã định danh (`FR-xx`, `NFR-xx`), mức ưu tiên MoSCoW và **tiêu chí chấp nhận có thể kiểm chứng** (mã HTTP, trạng thái, thông báo giao diện, thời gian). Mục tiêu: người đọc ngoài nhóm viết được test từ tiêu chí chấp nhận (đề A2 §3.3).

### 1.2 Phạm vi

BrewLite là ứng dụng đặt đồ uống không dùng tiền mặt, mobile-first/PWA (Next.js), API NestJS, CSDL PostgreSQL. Luồng: **Xem menu → Chọn tùy chọn → Giỏ hàng → Đặt đơn → Thanh toán → Theo dõi đơn** (đề A2 §1.1). Phạm vi chi tiết, phần mở rộng, phần không làm: [`context-and-scope.md`](context-and-scope.md) mục 3.

### 1.3 Mức ưu tiên MoSCoW

| Mức | Ý nghĩa trong dự án này |
|---|---|
| **Must** | Bắt buộc có trong MVP; thiếu thì luồng end-to-end không đạt. Mọi `FR-xx` Must phải có đủ 5 cột ở ma trận truy vết trước khi hết Task 5 |
| **Should** | Làm sau khi Must xong; thiếu thì MVP vẫn chạy nhưng yếu một phần nghiệp vụ |
| **Could** | Làm nếu còn thời gian; bị cắt đầu tiên khi trễ tiến độ |
| **Won't** | Không làm trong Assignment 2; ghi phạm vi/lý do ở mục 1.4 và 5.9 |

### 1.4 Baseline bản nộp và phụ thuộc

- Bản hiện tại gồm FR-01–FR-16, FR-20–FR-25 và FR-29 (23 Must). FR-25 là bắt buộc để chủ đơn giải phóng nguyên liệu đã giữ; FR-29 bao gồm quản trị kho và công thức. Các ghi chú rút gọn của baseline cũ không loại hai yêu cầu này khỏi BREW-INVENTORY-01.
- FR-17, FR-18, FR-19, FR-26, FR-27 là **Won’t trong bản nộp** và đã gộp vào bảng ở mục 5.9 (giữ nguyên mã, không đánh lại số). Không yêu cầu UI, endpoint, seed khuyến mãi hay giao dịch điểm; nếu một PR sau phê duyệt đưa lại vào phạm vi thì viết lại tiêu chí chấp nhận trong PR đó.
- NFR Must chỉ áp dụng cho endpoint và luồng thuộc baseline. NFR Should và Could không là điều kiện nghiệm thu minimum.
- Task 2 vẫn phải mô hình hóa hai lớp domain bắt buộc `Promotion` và `LoyaltyTransaction` với thuộc tính, quan hệ, multiplicity (đề A2 §4.3); không đồng nghĩa phải hiện thực tính năng.
- **Ghi chú rút gọn (đề A2 §6.2).** Baseline PR #5 đặc tả nhiều hơn đề đòi, nên bản này giữ đúng mức tối thiểu để nhóm làm được và giải thích được khi vấn đáp. Đề A2 §3–§7 không đòi hủy đơn, không đặt ngưỡng hiệu năng bằng số (production free tier còn "ngủ"), không đòi kiểm thử tay đa trình duyệt hay quét secret trong lịch sử git. Thay đổi: (1) FR-25 từng từ Must thành Could trong baseline cũ; BREW-INVENTORY-01 đưa lại thành Must; (2) NFR-01 giữ Must nhưng chỉ đo trên docker-compose local (nhóm chọn; đề A2 §3.2 chỉ đòi có nhóm hiệu năng, không đặt ngưỡng hay mức ưu tiên, ngưỡng 500 ms theo đề A1 §4.2); NFR-12 giữ Must cho E2E tự động tối thiểu theo đề A2 §7.2, bỏ kiểm thử tay đa trình duyệt; NFR-02 và NFR-03 Should thành Could; (3) NFR-10 PWA Should thành Must nhưng chỉ cần web app manifest, vì đề nhắc PWA ở §1.1, §5.1, §5.2, §9; (4) FR-17, FR-18, FR-19, FR-26, FR-27 gộp vào bảng Won’t; (5) bỏ các tiêu chí thừa: thanh toán song song cùng key, tái dùng key cho đơn khác, timeout Payment Service, ngưỡng thời gian giao diện, bảng ánh xạ mã lỗi, quét secret lịch sử, kiểm đồng thời trùng lặp; (6) bỏ AC-F16.7 và luồng phục hồi E8b: ở bản dùng simulator, API dừng giữa bước 13 và 14 của UC-04 là rủi ro chấp nhận; từ 2026-10-29 rủi ro này được thay bằng IPN/QueryDR (ghi chú VNPay sandbox bên dưới); (7) bỏ AC-N15.3 và điều kiện so SHA ở AC-N18.2–3: `/health` chỉ trả `status` và `database` (đề A2 §7.3 chỉ đòi health check/smoke test; image vẫn gắn tag commit SHA). Mã tiêu chí, quy tắc, luồng đã bỏ không dùng lại; các mã còn lại giữ nguyên số hiệu.
- **VNPay sandbox (2026-10-29).** Giảng viên yêu cầu thanh toán qua sandbox của bên thứ ba thay cho simulator, nên nhóm tích hợp VNPay sandbox (ADR-007). Thay đổi: (1) `POST /payments` chỉ tạo `Payment PENDING` và URL thanh toán đã ký; khách trả trên trang VNPay, kết quả về qua IPN hoặc QueryDR, return URL chỉ hiển thị (BR-10, BR-11); (2) rủi ro mất kết quả của simulator (mục (6) ở trên) được thay bằng cơ chế IPN/QueryDR: kết quả nằm ở VNPay và lấy lại được, nên không cần cơ chế phục hồi riêng; AC-F16.7 và E8b vẫn không dùng lại; (3) bỏ 402 `PAYMENT_DECLINED` và `cardNumber` khỏi `POST /payments`; thêm `GET /payments/vnpay/ipn`, `GET /payments/vnpay/return`, `POST /payments/:id/sync` và ba mã lỗi mới ở mục 3.2; (4) rủi ro còn lại: IPN timeout khi Render ngủ (R-13), sandbox bảo trì (R-14), payment hết hạn hoặc tiền về muộn khi chưa có job hủy đơn (R-15), xử lý ở FR-14 đến FR-16; (5) FR-31 vẫn Won’t, nghĩa là cổng production thật; (6) hành vi sandbox chưa đo mang nhãn chờ spike và được gỡ hoặc sửa sau spike (bước 1 của [kế hoạch VNPay](../planning/2026-10-29-vnpay-payment-plan.md)).

### 1.5 Cách đọc một yêu cầu

Mỗi yêu cầu có: **mô tả**, dòng **Ưu tiên / Use-case / Stakeholder**, và danh sách **tiêu chí chấp nhận** đánh mã `AC-Fxx.n` (cho `FR-xx`) hoặc `AC-Nxx.n` (cho `NFR-xx`). Mỗi tiêu chí viết dạng *khi/thì* để chuyển thẳng thành một test (mã test `UNIT-Txx`, `API-Txx`, `INT-Txx`, `E2E-Txx` ghi trong ma trận truy vết).

---

## 2. Tổng quan hệ thống

### 2.1 Actor

| Actor | Loại | Mô tả |
|---|---|---|
| Khách vãng lai (**Guest**) | Chính | Chưa đăng nhập: xem menu, chi tiết món, quản lý giỏ hàng, đăng ký, đăng nhập |
| Khách hàng (**Customer**) | Chính | Đã đăng nhập (JWT hợp lệ, `role = CUSTOMER`); kế thừa mọi việc của Guest (`Customer --\|> Guest`), thêm: đặt đơn, thanh toán, lịch sử và theo dõi đơn; hủy đơn chưa trả (FR-25, Must) |
| Nhân viên quầy (**Barista**) | Chính (minimum) | Đã đăng nhập, `role = BARISTA`; đổi trạng thái đơn đã thanh toán qua API (Postman); không đặt đơn, không thanh toán |
| Cổng thanh toán (**VNPay sandbox**) | Phụ (hệ thống ngoài) | Cổng thanh toán bên thứ ba ở môi trường thử nghiệm, không thu tiền thật: khách trả trên trang VNPay; VNPay báo kết quả cho API qua IPN và trả lời truy vấn QueryDR |

### 2.2 Use-case diagram tổng quát

![Use-case tổng quát](use-case-overview.svg)

Nguồn: [`use-case-overview.puml`](use-case-overview.puml). Use-case trọng tâm UC-04 được đặc tả ở [`uc-checkout.md`](uc-checkout.md).

### 2.3 Danh mục use-case

| Mã | Tên use-case | Actor | Yêu cầu liên quan |
|---|---|---|---|
| UC-01 | Xem menu và chi tiết món (size, topping) | Guest, Customer | FR-01 đến FR-04 |
| UC-02 | Quản lý giỏ hàng | Guest, Customer | FR-05 đến FR-07 |
| UC-03 | Đăng nhập (JWT) | Guest, Barista | FR-09, FR-10 |
| UC-04 | **Đặt và thanh toán đơn hàng** (trọng tâm) | Customer; VNPay sandbox | FR-10 đến FR-16; FR-17/18 ngoài bản nộp |
| UC-04.1 | Tạo đơn hàng (include của UC-04) | Customer | FR-11, FR-12, FR-13 |
| UC-04.2 | Thanh toán đơn hàng (include của UC-04) | Customer; VNPay sandbox | FR-14, FR-15, FR-16 |
| UC-04.3 | Áp mã giảm giá (extend UC-04.2) — ngoài bản nộp, không vẽ trong sơ đồ | Customer | FR-17 (Won’t) |
| UC-04.4 | Ghi nhận điểm thưởng (extend UC-04.2) — ngoài bản nộp, không vẽ trong sơ đồ | hệ thống | FR-18 (Won’t) |
| UC-04.5 | Thử lại thanh toán (extend UC-04.2, khi đơn `PAYMENT_FAILED`) | Customer; VNPay sandbox | FR-15, FR-16 |
| UC-05 | Xem lịch sử và theo dõi đơn | Customer | FR-20, FR-21, FR-22 |
| UC-06 | Hủy đơn chưa trả; hủy đơn đã trả/hoàn tiền vẫn ngoài phạm vi | Customer; Barista chỉ ở phần FR-26 ngoài phạm vi | FR-25 (Must); FR-26 (Won’t) |
| UC-07 | Cập nhật trạng thái đơn (hàng đợi Barista FR-27 không vẽ trong sơ đồ) | Barista | FR-23, FR-24; FR-27 (Won’t) |
| UC-08 | Xem điểm thưởng — ngoài bản nộp, không vẽ trong sơ đồ | Customer | FR-19 (Won’t) |
| UC-10 | Quản lý nguyên liệu và công thức | Barista | FR-29 |
| UC-09 | Đăng ký tài khoản (Barista không đăng ký, tài khoản do seed tạo: giả định A-04) | Guest | FR-08 |

Sơ đồ chỉ vẽ use-case thuộc bản nộp (Must, Could). Các dòng Won’t giữ lại ở bảng này để truy vết (xem mục 5.9).

---

## 3. Quy ước dùng trong tiêu chí chấp nhận

Mục này cố định tên và giá trị để các tiêu chí kiểm chứng được và để Task 2 (sơ đồ), Task 4–5 (code, test) dùng cùng một bộ từ ngữ.

### 3.1 Endpoint (dự kiến)

| Endpoint | Ai gọi | Mục đích |
|---|---|---|
| `GET /products`, `GET /products/:id` | công khai | Menu, chi tiết món |
| `POST /auth/register`, `POST /auth/login` | công khai | Đăng ký, đăng nhập |
| `POST /orders` | Customer | Tạo đơn `PENDING` |
| `POST /payments` | Customer | Tạo giao dịch VNPay (header `Idempotency-Key`; body `{ orderId, paymentMethod }`, không có `cardNumber`): lưu `Payment PENDING` và trả `paymentUrl` đã ký, không chờ VNPay. Trả 201 khi tạo mới, 200 khi replay |
| `GET /payments/vnpay/ipn` | VNPay sandbox (công khai, không JWT) | IPN: VNPay báo kết quả server-to-server; luôn HTTP 200 với JSON `RspCode` (mục 3.4) |
| `GET /payments/vnpay/return` | Trình duyệt khách quay về từ VNPay (công khai, không ghi DB) | Kiểm chữ ký và merchant, trả `{ valid, paymentId, orderId, responseCode }` để hiển thị |
| `POST /payments/:id/sync` | Customer (chủ đơn) | Hỏi VNPay bằng QueryDR khi thiếu IPN; áp kết quả như IPN |
| `GET /orders/me`, `GET /orders/:id` | Customer (`:id` còn cho Barista) | Lịch sử, chi tiết đơn |
| `PATCH /orders/:id` | Barista (đổi trạng thái); Customer (hủy theo FR-25 Must) | Body `{ "status": "<TRẠNG_THÁI_ĐÍCH>" }`; hủy bị chặn 409 `PAYMENT_IN_PROGRESS` khi đơn còn `Payment PENDING` chưa kết luận (AC-F16.13) |
| `POST /inventory/availability` | công khai | Tính khả năng đáp ứng theo size/topping và tổng giỏ, không giữ kho |
| `GET /inventory/ingredients`, `GET /inventory/movements`, `GET /inventory/recipes` | Barista | Xem số dư, lịch sử và công thức |
| `POST /inventory/ingredients/:id/movements`, `PUT /inventory/recipes` | Barista | Nhập/kiểm kê có lý do; thay công thức nguyên tử |
| `GET /health` | công khai | Kiểm kết nối DB (NFR-15) |

Cổng chạy local (dự kiến): web 3000, API 4000, PostgreSQL 5432.

**Trường thanh toán trong `GET /orders/:id`.** Mỗi phần tử `payments` thêm `paymentUrl`, `expiresAt`, `gatewayResponseCode`, `gatewayTransactionStatus` (đều có thể `null`) để khách tiếp tục thanh toán và giao diện hiển thị kết quả. Không trả secret, chữ ký, fingerprint hay `Idempotency-Key`. Danh sách `GET /orders/me` giữ nguyên; khách kiểm tra payment ở trang chi tiết đơn.

### 3.2 Định dạng lỗi và mã HTTP

Mọi lỗi API trả JSON: `{ "statusCode": <số>, "error": "<MÃ_LỖI>", "message": "<thông điệp>", "details": [ ... ] }` (`details` có hoặc không tùy lỗi).

| HTTP | `error` (dự kiến) | Khi nào |
|---|---|---|
| 400 | `VALIDATION_ERROR`, `IDEMPOTENCY_KEY_REQUIRED` | Dữ liệu sai định dạng/thiếu; thiếu hoặc quá dài header `Idempotency-Key` |
| 401 | `UNAUTHORIZED` | Thiếu, sai hoặc hết hạn JWT; sai email/mật khẩu |
| 403 | `FORBIDDEN` | Đúng đăng nhập nhưng sai vai trò, hoặc không phải chủ đơn |
| 404 | `PRODUCT_NOT_FOUND`, `ORDER_NOT_FOUND`, `INGREDIENT_NOT_FOUND`, `PAYMENT_NOT_FOUND` | Không tồn tại |
| 409 | `EMAIL_ALREADY_EXISTS`, `OUT_OF_STOCK`, `RECIPE_UNAVAILABLE`, `BELOW_RESERVED`, `ORDER_NOT_PAYABLE`, `INVALID_ORDER_TRANSITION`, `PAYMENT_IN_PROGRESS` | Xung đột trạng thái hoặc dữ liệu. `PAYMENT_IN_PROGRESS`: đơn có `Payment PENDING` chưa kết luận (khác phương thức, hủy đơn, hoặc `sync`/QueryDR chưa có kết quả cuối) |
| 502 | `PAYMENT_PROVIDER_ERROR` | Thiếu cấu hình VNPay cho thao tác, lỗi ký, hoặc QueryDR lỗi mạng, hết thời gian chờ, sai chữ ký, báo mã lỗi hay không kết luận được |
| 503 | — | `GET /health` khi database không kết nối được |

Riêng `GET /payments/vnpay/ipn` không dùng định dạng lỗi trên: endpoint luôn trả HTTP 200 với JSON `{ "RspCode": "<mã>", "Message": "<thông điệp>" }` theo quy ước của VNPay (mục 3.4). Kết quả thanh toán thất bại không còn là phản hồi của `POST /payments`: nó đến qua IPN hoặc QueryDR và đưa đơn sang `PAYMENT_FAILED`.

Giao diện hiển thị số tiền dạng `124.000đ` (dấu chấm ngăn nghìn, hậu tố "đ"); thông báo cho người dùng bằng tiếng Việt.

### 3.3 Dữ liệu mẫu tham chiếu (seed, dự kiến)

Các tiêu chí dùng chung bộ dữ liệu này (NFR-16 yêu cầu seed tái tạo được):

- **Sản phẩm** (giá size S, đồng): Cà phê sữa 35.000, Americano 40.000, Cappuccino 45.000, Trà đào 39.000, Trà sữa trân châu 42.000, Matcha latte 48.000, Bạc xỉu 38.000, Cold brew 45.000. Seed tạo nguyên liệu thiếu với số dư 0; số ly không được suy ra từ cột `Product.stock` cũ. Dữ liệu demo được nhập bằng API có xác thực theo [runbook](../inventory-runbook.md).
- **Size:** S phụ thu 0đ, M +5.000đ, L +10.000đ.
- **Topping:** Trân châu +7.000đ, Kem phô mai +10.000đ, Thạch dừa +5.000đ.
- **Tài khoản demo** (chỉ để test, mật khẩu chỉ dùng cho tài khoản **demo**): Customer `customer.demo@brewlite.local` mật khẩu demo `Demo@12345`; Barista `barista.demo@brewlite.local` mật khẩu demo `Demo@12345`.

**Ví dụ tính tiền dùng trong các tiêu chí:** 2 ly Cappuccino size L kèm topping Trân châu: đơn giá `45.000 + 10.000 + 7.000 = 62.000`; tổng `124.000`; số tiền phải trả đúng `124.000`. Khi tạo URL VNPay, số tiền gửi là `Order.total × 100` (VND nhân 100, không dấu phân cách), tức `12400000` cho ví dụ này.

### 3.4 Quy ước VNPay sandbox (dự kiến)

Thanh toán đi qua **VNPay sandbox**: hệ thống ngoài, môi trường thử nghiệm, không thu tiền thật (ADR-007). Để test thanh toán lặp lại được:

- **Thẻ test.** Khách nhập thẻ **chỉ trên trang VNPay**, dùng thẻ NCB test do VNPay cấp cho sandbox. Số thẻ và OTP không ghi vào tài liệu, repo, ảnh chụp hay log. Hệ thống không nhận, không lưu và không ghi log số thẻ, nên body `POST /payments` không có `cardNumber`.
- **Phương thức.** `paymentMethod` (`WALLET`/`CARD`) vẫn bắt buộc và lưu ở `Payment.method` để so replay (BR-05). Nó chỉ gợi ý trang VNPay hiển thị phương thức nào, không bảo đảm khách trả đúng loại đã chọn.
- **Cấu hình.** `VNP_TMN_CODE`, `VNP_HASH_SECRET`, `WEB_URL` nằm trong `apps/api/.env` (bị `.gitignore` chặn) và biến môi trường Render; không ghi giá trị vào repo, log, ảnh chụp hay mô tả PR. `VNP_URL` và `VNP_API_URL` có mặc định là URL sandbox công khai. Biến được kiểm theo từng thao tác: tạo URL mới cần cả ba biến; IPN, kiểm return và QueryDR chỉ cần `VNP_TMN_CODE` và `VNP_HASH_SECRET`; replay, đọc trạng thái trong DB và `/health` không cần biến VNPay. Thiếu biến thì API vẫn khởi động và chỉ ghi tên biến thiếu vào một dòng cảnh báo (AC-F14.7, AC-F14.8).
- **Giao dịch.** Mỗi lần thử có mã tham chiếu `vnp_TxnRef` mới, bằng `Payment.id`. URL thanh toán, IPN và return được ký và kiểm bằng HMAC-SHA512 với `VNP_HASH_SECRET`; chữ ký, merchant hoặc số tiền không khớp thì không được dùng để đổi trạng thái.
- **Hạn thanh toán 15 phút.** `vnp_ExpireDate` và `Payment.expiresAt` là cùng một mốc, tính theo GMT+7. Hết hạn chỉ làm payment cần đối soát bằng QueryDR; chưa có job tự hết hạn nên đơn không tự hủy và nguyên liệu không tự nhả. Kho chỉ đổi khi thanh toán thành công hoặc khi chủ đơn hủy hợp lệ.
- **Nguồn kết quả.** **IPN** (VNPay gọi server-to-server vào `GET /payments/vnpay/ipn`, bắt buộc HTTPS công khai) là nguồn chính. **Return URL** (`<WEB_URL>/payment/vnpay-return`) chỉ hiển thị và poll trạng thái trong DB. **QueryDR** (API tra cứu giao dịch của VNPay, gọi qua `POST /payments/:id/sync`) dùng khi thiếu IPN: chạy local (VNPay không gọi được localhost), Render đang ngủ hoặc IPN đến muộn. IPN và QueryDR áp kết quả qua cùng một hàm (BR-11).
- **Mã `RspCode` của IPN:** `00` đã ghi nhận; `01` không có `Payment` ứng với `vnp_TxnRef`; `02` `Payment` hoặc đơn không còn `PENDING`; `04` sai số tiền; `97` sai chữ ký hoặc sai merchant; `99` thiếu cấu hình, lỗi bất ngờ hoặc trạng thái chưa kết luận (VNPay gọi lại tối đa 10 lần, cách nhau 5 phút).
- **Mã kết quả của VNPay để hiển thị.** `24` khách hủy giao dịch trên trang VNPay; `51` tài khoản không đủ số dư; `11` hết thời gian thanh toán; `13` sai OTP; `09`, `10`, `12`, `79` lỗi thẻ hoặc tài khoản; mã còn lại hiển thị "Thanh toán không thành công". Mã trên return hoặc IPN chỉ chọn thông báo, không quyết định trạng thái (BR-11); khi QueryDR không cung cấp lại mã từ chối gốc như IPN thì dùng thông báo thất bại chung.
- **QueryDR tách hai mã.** `vnp_ResponseCode` là kết quả của lần truy vấn, `vnp_TransactionStatus` là trạng thái của giao dịch; xử lý theo AC-F14.12, AC-F15.6, AC-F15.8, AC-F16.10, AC-F16.11. Giao diện lấy trạng thái trong DB làm chuẩn, không hiển thị thành công chỉ dựa vào response code.
- **Tiền về sau trạng thái cuối.** Khi IPN hoặc QueryDR báo đã thu tiền mà `Payment` đã `FAILED`, đơn đã `CANCELLED` hoặc đã trả bằng payment khác, hệ thống không mở lại đơn hay đổi kho; API ghi warning `PAYMENT_RECONCILIATION_REQUIRED` kèm `vnp_TxnRef` để nhân viên đối soát và hoàn tiền tay theo [deployment.md](../deployment.md). Hoàn tiền tự động (refund API) ngoài phạm vi.
- **Chống thu trùng** do API bảo đảm bằng `Idempotency-Key`, trạng thái đơn và tối đa một `Payment PENDING` mỗi đơn (BR-05, BR-10, FR-16). Thanh toán thất bại không khóa đơn, nên khách thử lại hoặc hủy được.

### 3.5 Quy tắc nghiệp vụ (BR)

| Mã | Quy tắc |
|---|---|
| BR-01 | Giá do **server** tính: `unitPrice = product.price + phụ thu size + Σ phụ thu topping`; `lineTotal = unitPrice × quantity`; `total = Σ lineTotal`. Trường giá hoặc tổng tiền do client gửi bị từ chối theo AC-F12.3 |
| BR-02 | Số lượng mỗi dòng từ 1 đến 99; mỗi đơn tối đa 20 dòng; giá là số nguyên VND |
| BR-03 | Đơn mới `inventoryTracked=true`: tổng hợp nhu cầu nguyên liệu của toàn giỏ từ công thức server; tăng `reserved`, tạo `Order`, `OrderItem`, `OrderIngredient` bất biến trong cùng transaction. Thành công thanh toán giảm cả `onHand` và `reserved` theo snapshot; thất bại giữ nguyên; chủ đơn hủy chưa trả chỉ giảm `reserved`, đúng một lần. Luôn `0 <= reserved <= onHand`. Đơn cũ marker false tiếp tục vòng đời `Product.stock` cũ, không suy diễn snapshot |
| BR-04 | Chỉ chủ đơn mới thanh toán/hủy đơn của mình; đơn chỉ thanh toán được khi ở `PENDING` hoặc `PAYMENT_FAILED` |
| BR-05 | `Idempotency-Key` bắt buộc cho `POST /payments`, gắn với người dùng; thanh toán thất bại (`Payment FAILED`) không khóa key. Hai yêu cầu là **cùng một yêu cầu** khi cùng chủ đơn, `orderId`, `Idempotency-Key` và `paymentMethod`. Sau khi kiểm đầu vào, xác thực và quyền sở hữu, API xét theo thứ tự: (1) có `Payment SUCCESS` của cùng yêu cầu thì trả lại kết quả đó (200), trước khi xét trạng thái đơn; (2) đơn không ở `PENDING`/`PAYMENT_FAILED` thì 409 `ORDER_NOT_PAYABLE`; (3) `Payment PENDING` quá hạn thì đối soát QueryDR rồi xét lại từ (1); (4) có `Payment PENDING` còn hạn thì cùng `paymentMethod` trả lại URL và thời hạn cũ (200, kể cả khi key mới), khác `paymentMethod` thì 409 `PAYMENT_IN_PROGRESS`; (5) chỉ khi phải tạo URL mới mới kiểm cấu hình ký. Hai nhánh replay (1) và (4) không cần ký lại hay cấu hình VNPay |
| BR-08 | Vòng đời đơn theo mục 3.6; mọi chuyển trạng thái ngoài bảng đều bị từ chối |
| BR-09 | Thanh toán thất bại không xóa giỏ hàng và không hủy đơn; tồn kho vẫn giữ cho tới khi đơn `CANCELLED` |
| BR-10 | Mỗi đơn có tối đa một `Payment PENDING`. Chưa xác định được kết quả của payment đó (còn hạn, hoặc quá hạn mà QueryDR chưa kết luận) thì không mở lần thử mới và không cho hủy đơn: trả 409 `PAYMENT_IN_PROGRESS` |
| BR-11 | Chỉ IPN hoặc QueryDR đã xác thực (chữ ký, merchant, mã tham chiếu, số tiền khớp) mới được quyết định kết quả cuối của `Payment` và đơn. Return URL chỉ hiển thị, không đổi trạng thái; hai nguồn kết quả áp qua cùng một hàm và không ghi đè trạng thái cuối |

Mã BR giữ nguyên số hiệu; các mã bị bỏ (cùng FR-17/18 ngoài bản nộp) không dùng lại.

### 3.5a Kho nguyên liệu và thuật ngữ

- **On hand (`onHand`)** là lượng thực có; **reserved (`reserved`)** là phần đã giữ cho đơn chưa trả; **available** = `onHand - reserved`.
- Công thức gốc xác định sản phẩm + size S/M/L; công thức topping cộng thêm nguyên liệu (kể cả trân châu đã có trong món). Công thức trống/thiếu, hoặc công thức gốc không có nguyên liệu tracked, không bán được. Nước và đá không giới hạn, không làm mẫu số giới hạn.
- Số ly của một lựa chọn = `min(floor(available / requiredPerCup))` trên nguyên liệu tracked. Menu `stock` chỉ là ước tính size S không topping; không dùng làm trần cho size/topping khác. Các số ly menu dùng chung nguyên liệu, không thể cộng thành cam kết cho giỏ.
- Trước đặt đơn phải cộng nhu cầu cùng nguyên liệu trên mọi dòng/biến thể. Ví dụ mỗi lựa chọn riêng lẻ còn 6 ly không có nghĩa hai dòng cùng dùng matcha được mua 6 ly mỗi dòng.
- Đơn vị chuẩn `g`, `ml`, `piece`; lượng decimal string tối đa 3 chữ số thập phân, DB numeric(18,3). `kg` ×1000 thành `g`, `l` ×1000 thành `ml`; không đổi g sang ml. `piece` nguyên. Xem [HTTP/schema contract](../inventory-contract.md) cho trường và lỗi chính xác.

### 3.6 Từ điển miền dữ liệu (ràng buộc cho Task 2)

Class diagram dùng đúng tên lớp và giá trị dưới đây (đề A2 §4.3). Sequence/activity dùng cùng tên khi tham chiếu; không bắt buộc đưa luồng khuyến mãi/điểm thưởng ngoài bản nộp vào các sơ đồ luồng minimum.

- **Lớp domain (7):** `User`, `Product`, `Order`, `OrderItem`, `Payment`, `Promotion`, `LoyaltyTransaction`.
- **Quan hệ khái niệm:** `User` 1–n `Order`; `Order` 1–n `OrderItem`; `OrderItem` n–1 `Product`; `Order` 1–n `Payment` (nhiều lần thử, tối đa một `PENDING` tại một thời điểm, BR-10); `Order` n–0..1 `Promotion` (mã đã áp); `User` 1–n `LoyaltyTransaction`; `LoyaltyTransaction` n–0..1 `Order`. Topping và size mô hình hóa là thuộc tính hay lớp riêng do Task 2 quyết.
- **Trạng thái đơn** (`OrderStatus`): `PENDING`, `PAID`, `PAYMENT_FAILED`, `PREPARING`, `READY`, `COMPLETED`, `CANCELLED`.
- **Vai trò** (`Role`): `CUSTOMER`, `BARISTA`.
- **Phương thức thanh toán** (`PaymentMethod`): `WALLET`, `CARD`.
- **Trạng thái thanh toán** (`PaymentStatus`): `SUCCESS`, `FAILED`, `PENDING`, `REFUNDED`. `PENDING` là payment đã tạo URL, đang chờ VNPay. `EXPIRED` **không** phải trạng thái enum: chỉ là giá trị nội bộ của `gatewayResponseCode` khi payment quá hạn được đóng thành `FAILED` (AC-F15.8).
- **Loại giao dịch điểm** (`LoyaltyType`): `EARN`, `REVERSAL`.
- **Thuộc tính tối thiểu cần có để thỏa tiêu chí:** `Product(id, name, description, price, imageUrl, stock)`; `User(id, email, passwordHash, role)`; `Order(id, userId, status, total, discountAmount, promotionId?, inventoryTracked, createdAt)`; `OrderItem(id, orderId, productId, size, toppings, quantity, unitPrice, lineTotal)`; `Payment(id, orderId, method, status, amount, idempotencyKey, createdAt, provider, paymentUrl?, expiresAt?, gatewayCreateDate?, gatewayTxnNo?, gatewayResponseCode?, gatewayTransactionStatus?, bankCode?, paidAt?)` (`provider` mặc định `VNPAY`; các hàng tạo trước 2026-10-29 có `provider = "SIMULATOR"`; `gatewayResponseCode` và `gatewayTransactionStatus` lưu riêng hai mã của VNPay); `Promotion(id, code, discountPercent, validFrom, validTo, maxUses?, usedCount, active)`; `LoyaltyTransaction(id, userId, orderId?, type, points, createdAt)`.

**Mô hình kho của increment:** `Ingredient(id,name,unit,tracked,onHand,reserved)`, `Recipe(id,productId?,size?,topping?)`, `RecipeLine(recipeId,ingredientId,quantity)`, `StockMovement(id,ingredientId,actorId,kind,quantity,onHandAfter,reason,createdAt)`, `OrderIngredient(orderId,ingredientId,quantity)`. Xem [Class-01](../diagrams/class-domain.svg) và [contract](../inventory-contract.md); Product.stock là cột legacy, response stock là giá trị tính.

**Máy trạng thái đơn (BR-08).** Mô hình có 8 chuyển trạng thái hợp lệ; chuyển `PAID → CANCELLED` (FR-26) là Won’t nên bị từ chối. Hai chuyển `→ CANCELLED` của Customer vẫn nằm trong mô hình và API hủy FR-25 là Must của BREW-INVENTORY-01 (nguồn: đề A1 §9.1):

| Từ | Sang | Ai thực hiện |
|---|---|---|
| `PENDING` | `PAID` | hệ thống, khi IPN hoặc QueryDR đã xác thực báo thanh toán thành công (BR-11) |
| `PENDING` | `PAYMENT_FAILED` | hệ thống, khi IPN hoặc QueryDR đã xác thực báo thanh toán thất bại (BR-11) |
| `PENDING` | `CANCELLED` | Customer (chủ đơn), qua API hủy FR-25 (Must) |
| `PAYMENT_FAILED` | `PENDING` | hệ thống, khi khách thử thanh toán lại (tạo `Payment PENDING` mới, không giữ thêm nguyên liệu) |
| `PAYMENT_FAILED` | `CANCELLED` | Customer (chủ đơn), qua API hủy FR-25 (Must) |
| `PAID` | `PREPARING` | Barista |
| `PAID` | `CANCELLED` | không chuyển được (FR-26 Won’t): từ chối với 409 `INVALID_ORDER_TRANSITION` |
| `PREPARING` | `READY` | Barista |
| `READY` | `COMPLETED` | Barista |

`COMPLETED` và `CANCELLED` là trạng thái kết thúc.

**Vòng đời `Payment` (BR-10, BR-11).** Đơn vẫn `PENDING` trong lúc `Payment` chờ VNPay. `Payment` đi một chiều từ `PENDING` sang `SUCCESS` (kèm đơn `PAID`) hoặc `FAILED` (kèm đơn `PAYMENT_FAILED`) và không bao giờ mở lại; thử lại luôn tạo `Payment` mới. `Payment` `FAILED` (kể cả `gatewayResponseCode = "EXPIRED"`) không nhả nguyên liệu: chỉ chủ đơn hủy hợp lệ mới nhả (FR-25).

**Nhãn tiếng Việt trên giao diện:** `PENDING` "Chờ thanh toán"; `PAID` "Đã thanh toán"; `PAYMENT_FAILED` "Thanh toán thất bại"; `PREPARING` "Đang pha chế"; `READY` "Sẵn sàng nhận"; `COMPLETED` "Hoàn tất"; `CANCELLED` "Đã hủy".

---

## 4. Bảng tóm tắt yêu cầu theo nhóm

| # | Nhóm | Yêu cầu | MoSCoW |
|---|---|---|---|
| 1 | Menu | FR-01, FR-02 | Must |
| 2 | Chi tiết sản phẩm | FR-03, FR-04 | Must |
| 3 | Giỏ hàng | FR-05, FR-06, FR-07 | Must |
| 4 | Xác thực | FR-08, FR-09, FR-10 | Must |
| 5 | Đặt đơn | FR-11, FR-12, FR-13 | Must |
| 6 | Thanh toán | FR-14, FR-15, FR-16 (Must); FR-17, FR-18, FR-19 (Won’t bản nộp) | Must / Won’t |
| 7 | Lịch sử đơn | FR-20, FR-21, FR-22 | Must |
| 8 | Quản lý trạng thái đơn | FR-23, FR-24 (Must); FR-25 (Must); FR-26, FR-27 (Won’t bản nộp) | Must / Won’t |
| 13 | Quản lý nguyên liệu và công thức | FR-29 | Must |
| 9 | Hiệu năng | NFR-01 (Must); NFR-02, NFR-03 (Could) | Must / Could |
| 10 | Bảo mật | NFR-04 đến NFR-08, NFR-13 | Must |
| 11 | Tính khả dụng | NFR-09 đến NFR-12 | Must |
| 12 | Khả năng triển khai | NFR-14 đến NFR-19 (Must); NFR-20 (Should) | Must / Should |

Won’t bản nộp: FR-17, FR-18, FR-19, FR-26, FR-27 và FR-28, FR-30 đến FR-32. Tổng cộng: **32 FR** (23 Must, 0 Could, 9 Won’t) và **20 NFR** (17 Must, 1 Should, 2 Could).

Ba tình huống đề A2 §4.1 đòi có nhánh riêng đều có yêu cầu riêng: **chưa đăng nhập** → FR-10; **hết hàng** → FR-13; **thanh toán thất bại** → FR-15.

---

## 5. Yêu cầu chức năng (FR)

### 5.1 Menu

#### FR-01 — Xem danh sách menu
- **Mô tả:** Hệ thống hiển thị danh sách đồ uống gồm hình, tên, giá, tình trạng còn hàng; không cần đăng nhập.
- **Ưu tiên:** Must · **Use-case:** UC-01 · **Stakeholder:** S1, S3
- **Tiêu chí chấp nhận:**
  - AC-F01.1: Khi gọi `GET /products` với dữ liệu mẫu (mục 3.3) thì trả 200 và mảng đúng 8 sản phẩm, mỗi phần tử có `id`, `name`, `price` (số nguyên), `imageUrl`, `stock`; không cần token.
  - AC-F01.2: Khi mở trang menu thì lưới hiển thị đủ 8 thẻ, mỗi thẻ có hình, tên và giá dạng `45.000đ`.
  - AC-F01.3: Menu hiển thị `stock` tính từ nguyên liệu cho S không topping: 0 là "Hết hàng", 1–5 là "Sắp hết, còn N". Khi thiếu công thức thì bằng 0. Trang chi tiết kiểm lựa chọn thực tế bằng availability, không lấy số S làm trần cho M/L/topping.

#### FR-02 — Trạng thái tải menu (loading, empty, error)
- **Mô tả:** Trang menu xử lý ba trạng thái: đang tải, danh sách rỗng, lỗi tải.
- **Ưu tiên:** Must · **Use-case:** UC-01 · **Stakeholder:** S1, S4
- **Tiêu chí chấp nhận:**
  - AC-F02.1: Khi yêu cầu tải chưa xong thì trang hiển thị skeleton hoặc spinner, và biến mất khi có dữ liệu.
  - AC-F02.2: Khi `GET /products` trả mảng rỗng thì trang hiển thị "Hiện chưa có món nào" và không hiển thị lưới.
  - AC-F02.3: Khi `GET /products` trả 5xx hoặc mất mạng thì trang hiển thị "Không tải được thực đơn" cùng nút "Thử lại"; bấm "Thử lại" gửi lại yêu cầu và hiển thị menu nếu thành công.

### 5.2 Chi tiết sản phẩm

#### FR-03 — Xem chi tiết sản phẩm
- **Mô tả:** Hệ thống hiển thị chi tiết một sản phẩm (hình, tên, mô tả, giá nền, tùy chọn size và topping).
- **Ưu tiên:** Must · **Use-case:** UC-01 · **Stakeholder:** S1
- **Tiêu chí chấp nhận:**
  - AC-F03.1: Khi gọi `GET /products/:id` với `id` tồn tại thì trả 200 với `id`, `name`, `price`, `imageUrl`, `stock`, `description`.
  - AC-F03.2: Khi gọi `GET /products/:id` với `id` không tồn tại thì trả 404 `PRODUCT_NOT_FOUND`.
  - AC-F03.3: Khi mở trang chi tiết của `id` không tồn tại thì giao diện hiển thị "Không tìm thấy sản phẩm" và liên kết quay lại menu; trang có trạng thái loading và error như FR-02.

#### FR-04 — Chọn size và topping
- **Mô tả:** Khách chọn size (S/M/L) và nhiều topping; giá hiển thị cập nhật theo lựa chọn (BR-01).
- **Ưu tiên:** Must · **Use-case:** UC-01 · **Stakeholder:** S1
- **Tiêu chí chấp nhận:**
  - AC-F04.1: Khi mở trang chi tiết thì size mặc định được chọn là `M`; chỉ một size được chọn tại một thời điểm.
  - AC-F04.2: Khi chọn Cappuccino (45.000đ) size `L` thì giá hiển thị là `55.000đ`; thêm topping "Trân châu" thì giá hiển thị là `62.000đ`; bỏ topping thì về `55.000đ` ngay, không tải lại trang.
  - AC-F04.4: Khi đổi size/topping, giao diện gọi `POST /inventory/availability`, hiển thị số ly và nguyên liệu giới hạn của lựa chọn mới; phản hồi cũ không ghi đè lựa chọn mới. Thiếu công thức thì chặn thêm và báo không khả dụng.
  - AC-F04.3: Khi chọn đồng thời "Trân châu" và "Kem phô mai" thì phụ thu cộng dồn (`+17.000đ`).

### 5.3 Giỏ hàng

#### FR-05 — Thêm món vào giỏ
- **Mô tả:** Khách (Guest hoặc Customer) thêm món kèm size, topping, số lượng vào giỏ hàng lưu ở trình duyệt.
- **Ưu tiên:** Must · **Use-case:** UC-02 · **Stakeholder:** S1
- **Tiêu chí chấp nhận:**
  - AC-F05.1: Khi bấm "Thêm vào giỏ" ở chi tiết Cappuccino L + Trân châu số lượng 2 thì giỏ có một dòng đúng các giá trị đó và biểu tượng giỏ hiển thị số lượng tổng là 2.
  - AC-F05.2: Khi thêm hai lần cùng món, cùng size, cùng topping thì giỏ gộp thành một dòng cộng dồn số lượng; khác size hoặc khác topping thì tạo dòng riêng.
  - AC-F05.3: Khi tải lại trang hoặc đăng nhập xong thì giỏ vẫn còn nguyên các dòng (lưu `localStorage`).
  - AC-F05.4: Trước thêm món và ở giỏ, kiểm availability cho toàn bộ giỏ dự kiến; hai dòng dùng chung nguyên liệu phải cộng nhu cầu. Không cho tiếp tục checkout nếu thiếu hoặc công thức không khả dụng; giữ giỏ để sửa, không dùng `Product.stock` menu làm giới hạn chung cho biến thể.
  - AC-F05.5: Khi giỏ đã có 20 dòng thì thêm dòng thứ 21 bị từ chối với thông báo "Giỏ hàng tối đa 20 món" (BR-02).

#### FR-06 — Sửa số lượng và xóa dòng
- **Mô tả:** Khách tăng, giảm số lượng và xóa dòng trong giỏ.
- **Ưu tiên:** Must · **Use-case:** UC-02 · **Stakeholder:** S1
- **Tiêu chí chấp nhận:**
  - AC-F06.1: Khi bấm "+" thì số lượng tăng 1, tối đa 99; ở 99 nút "+" bị vô hiệu.
  - AC-F06.2: Khi bấm "−" ở số lượng 1 thì dòng bị xóa sau khi khách xác nhận, hoặc có nút "Hoàn tác"; ở số lượng lớn hơn 1 thì giảm 1.
  - AC-F06.3: Khi bấm "Xóa" ở một dòng thì chỉ dòng đó bị xóa; khi giỏ rỗng thì hiển thị "Giỏ hàng trống" cùng nút quay lại menu và nút "Thanh toán" bị vô hiệu.

#### FR-07 — Tính tổng tiền giỏ
- **Mô tả:** Giỏ tự tính thành tiền từng dòng và tổng tiền theo BR-01, cập nhật ngay khi giỏ đổi.
- **Ưu tiên:** Must · **Use-case:** UC-02 · **Stakeholder:** S1, S3
- **Tiêu chí chấp nhận:**
  - AC-F07.1: Khi giỏ có 2 × Cappuccino L + Trân châu thì dòng hiển thị đơn giá `62.000đ`, thành tiền `124.000đ`; tổng giỏ là `124.000đ`.
  - AC-F07.2: Khi giỏ có thêm 1 × Americano M (`45.000đ`) thì tổng giỏ là `169.000đ`; đổi số lượng hoặc xóa dòng thì tổng cập nhật ngay mà không tải lại trang.
  - AC-F07.3: Tổng hiển thị ở giỏ bằng `Order.total` do server tính ở FR-11 cho cùng nội dung giỏ (kiểm bằng một test so sánh).

### 5.4 Xác thực

#### FR-08 — Đăng ký tài khoản
- **Mô tả:** Guest đăng ký bằng email và mật khẩu; tài khoản mới có vai trò `CUSTOMER`.
- **Ưu tiên:** Must · **Use-case:** UC-09 · **Stakeholder:** S1
- **Tiêu chí chấp nhận:**
  - AC-F08.1: Khi `POST /auth/register` với `{ email, password }` hợp lệ (email đúng định dạng, mật khẩu ít nhất 8 ký tự gồm chữ và số) thì trả 201 với `id`, `email`, `role = "CUSTOMER"`; phản hồi không chứa `password` hay `passwordHash`.
  - AC-F08.2: Khi email đã tồn tại (không phân biệt hoa/thường) thì trả 409 `EMAIL_ALREADY_EXISTS`.
  - AC-F08.3: Khi email sai định dạng, mật khẩu ngắn hơn 8 ký tự, hoặc body có trường lạ như `role` thì trả 400 `VALIDATION_ERROR` kèm `details` chỉ rõ trường lỗi.
  - AC-F08.4: Khi gửi form đăng ký với dữ liệu sai thì giao diện hiển thị thông báo lỗi dưới từng ô, không gọi API nếu lỗi do định dạng.

#### FR-09 — Đăng nhập và cấp JWT
- **Mô tả:** Người dùng đăng nhập bằng email và mật khẩu, nhận JWT dùng cho các chức năng cần xác thực.
- **Ưu tiên:** Must · **Use-case:** UC-03 · **Stakeholder:** S1, S2
- **Tiêu chí chấp nhận:**
  - AC-F09.1: Khi `POST /auth/login` với thông tin đúng thì trả 200 với `accessToken` là JWT có `sub` (id người dùng), `role` và `exp`.
  - AC-F09.2: Khi sai mật khẩu hoặc email không tồn tại thì trả 401 `UNAUTHORIZED` với cùng một thông điệp "Email hoặc mật khẩu không đúng" (không tiết lộ email nào tồn tại).
  - AC-F09.3: Khi đăng nhập thành công trên giao diện thì chuyển về trang trước đó (tham số `next`) hoặc trang menu, và header hiển thị trạng thái đã đăng nhập kèm nút "Đăng xuất"; đăng xuất xóa token và giữ nguyên giỏ hàng.
  - AC-F09.4: Barista dùng cùng form và endpoint đăng nhập; token có `role = "BARISTA"`.

#### FR-10 — Chặn khi chưa đăng nhập
- **Mô tả:** Chức năng cần xác thực (đặt đơn, thanh toán, lịch sử, theo dõi đơn, đổi trạng thái) chỉ dùng được khi có JWT hợp lệ; Guest được dẫn tới đăng nhập rồi quay lại và không mất giỏ hàng.
- **Ưu tiên:** Must · **Use-case:** UC-03, UC-04 · **Stakeholder:** S1, S4
- **Tiêu chí chấp nhận:**
  - AC-F10.1: Khi gọi `POST /orders`, `POST /payments`, `POST /payments/:id/sync`, `GET /orders/me`, `GET /orders/:id`, `PATCH /orders/:id` mà không có header `Authorization` thì trả 401 `UNAUTHORIZED`. Hai endpoint `GET /payments/vnpay/ipn` và `GET /payments/vnpay/return` là công khai theo thiết kế (được bảo vệ bằng chữ ký VNPay, không bằng JWT).
  - AC-F10.2: Khi token sai chữ ký hoặc đã hết hạn thì cùng các endpoint trên trả 401 `UNAUTHORIZED`.
  - AC-F10.3: Khi Guest có giỏ hàng bấm "Thanh toán" thì giao diện chuyển tới `/login?next=/checkout` trong vòng 1 giây, không gọi `POST /orders`; sau đăng nhập thành công quay về `/checkout` và giỏ còn nguyên các dòng.
  - AC-F10.4: Khi token hết hạn giữa lúc thanh toán và API trả 401 thì giao diện hiển thị "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại", chuyển tới đăng nhập, giữ nguyên giỏ. Nếu chưa tạo đơn (401 ở `POST /orders`) thì sau đăng nhập tiếp tục bước tạo đơn. Nếu đã có `orderId` (401 ở `POST /payments`) thì giữ `orderId`, chủ đơn và `Idempotency-Key`; đăng nhập lại **cùng tài khoản**, đọc lại `GET /orders/:id` và tiếp tục thanh toán đơn cũ nếu `PENDING`/`PAYMENT_FAILED`, không gọi lại `POST /orders`, không giữ kho thêm lần nữa. Nếu đơn đã trả thì hiển thị chi tiết/kết quả; nếu `CANCELLED` thì dừng thanh toán. Đăng nhập tài khoản khác không tự thanh toán đơn cũ; API từ chối truy cập với 403, UI yêu cầu dùng đúng tài khoản hoặc về lịch sử của tài khoản mới.
  - AC-F10.5: Guest vẫn xem menu, chi tiết món và thêm vào giỏ bình thường (không bị chặn bởi đăng nhập).

### 5.5 Đặt đơn

#### FR-11 — Tạo đơn hàng
- **Mô tả:** Customer tạo đơn từ giỏ; đơn ở trạng thái `PENDING`. Tạo `Order`, các `OrderItem`, snapshot `OrderIngredient` và giữ chỗ nguyên liệu nằm trong một transaction (BR-03).
- **Ưu tiên:** Must · **Use-case:** UC-04.1 · **Stakeholder:** S1, S3, S5
- **Tiêu chí chấp nhận:**
  - AC-F11.1: Khi `POST /orders` kèm token Customer và `items = [{ productId: <Cappuccino>, quantity: 2, size: "L", toppings: ["Trân châu"] }]` thì trả 201 với `id`, `status = "PENDING"`, `total = 124000`, một `OrderItem` với `unitPrice = 62000`, `lineTotal = 124000`; `userId` của đơn là người trong token.
  - AC-F11.2: Đơn mới có `inventoryTracked=true` và snapshot `OrderIngredient` tổng hợp. Đặt 2 Matcha S với công thức 3g/150ml/20ml tăng reserved đúng 6g matcha, 300ml sữa không đường, 40ml syrup; onHand chưa đổi. Sửa công thức sau đó không đổi snapshot này.
  - AC-F11.3: Gây lỗi sau giữ kho hoặc khi tạo OrderItem thì rollback toàn bộ: không có đơn/snapshot mới, mọi onHand/reserved không đổi.
  - AC-F11.4: Khi gọi bằng token Barista thì trả 403 `FORBIDDEN`.

#### FR-12 — Kiểm dữ liệu và tính giá phía server
- **Mô tả:** Server kiểm mọi dữ liệu đơn và tự tính giá; không tin giá hay tổng từ client (BR-01, BR-02).
- **Ưu tiên:** Must · **Use-case:** UC-04.1 · **Stakeholder:** S1, S3, S5
- **Tiêu chí chấp nhận:**
  - AC-F12.1: Khi `items` rỗng, hoặc có hơn 20 dòng, `quantity` < 1, `quantity` > 99, `quantity` không phải số nguyên, `size` ngoài `S`/`M`/`L`, hoặc topping không có trong danh sách thì trả 400 `VALIDATION_ERROR` và không tạo `Order`.
  - AC-F12.2: Khi `productId` không tồn tại thì trả 404 `PRODUCT_NOT_FOUND` và không tạo `Order`.
  - AC-F12.3: Khi body có thêm trường `total: 1` hoặc `unitPrice: 1` thì trả 400 (trường lạ); `Order.total` không bao giờ lấy từ client.
  - AC-F12.4: Khi giỏ trên giao diện rỗng thì nút "Thanh toán" bị vô hiệu và không gọi API.

#### FR-13 — Xử lý hết hàng khi đặt đơn
- **Mô tả:** Khi số lượng đặt vượt tồn kho, hệ thống từ chối tạo đơn, không bán quá số lượng còn, và báo rõ món nào thiếu.
- **Ưu tiên:** Must · **Use-case:** UC-04.1 · **Stakeholder:** S1, S3
- **Tiêu chí chấp nhận:**
  - AC-F13.1: Với 20g matcha, 2000ml sữa không đường, 200ml syrup và không có reserved, Matcha S (3g/150ml/20ml) được 6 ly, matcha giới hạn. Đặt 7 ly trả 409 `OUT_OF_STOCK`, details chứa ingredientId/name/unit và requested/available dạng chuỗi (matcha 21/20); không có đơn mới và mọi số dư không đổi.
  - AC-F13.2: Nguyên liệu tracked available=0 làm số ly bằng 0. Thiếu/trống công thức hoặc công thức gốc không có nguyên liệu tracked: availability trả sellable=false/cups=0; tạo đơn trả 409 `RECIPE_UNAVAILABLE`.
  - AC-F13.3: Có đúng 150ml espresso, Americano S cần 30ml; 10 yêu cầu đồng thời mỗi yêu cầu 1 ly phải chỉ có 5 đơn thành công, 5 lỗi 409, onHand=150ml/reserved=150ml/available=0, không âm. Toàn giỏ cộng nhu cầu trước kiểm, gồm nhiều size và topping dùng chung nguyên liệu.
  - AC-F13.4: Khi availability báo shortage hoặc đặt đơn trả 409, giao diện hiển thị nguyên liệu thiếu và lượng cần/còn, liên kết về giỏ và giữ nguyên giỏ; sửa giỏ rồi kiểm lại được. Không tạo đơn từ số ly ước tính đã cũ.
  - AC-F13.5: Đơn bị từ chối vì hết hàng không xuất hiện trong lịch sử đơn của khách.

### 5.6 Thanh toán

#### FR-14 — Thanh toán Ví/Thẻ qua VNPay sandbox
- **Mô tả:** Customer thanh toán đơn `PENDING` bằng Ví hoặc Thẻ. API tạo `Payment PENDING` và URL thanh toán đã ký; khách trả trên trang VNPay sandbox. Khi IPN (hoặc QueryDR, khi thiếu IPN) đã xác thực báo thành công thì `Payment` sang `SUCCESS` và đơn sang `PAID` trong một transaction (BR-11). Luồng UC-04 liên quan: luồng chính, E9, E10, E13 ([`uc-checkout.md`](uc-checkout.md)).
- **Ưu tiên:** Must · **Use-case:** UC-04.2 · **Stakeholder:** S1, S3, S6
- **Tiêu chí chấp nhận:**
  - AC-F14.1: Khi `POST /payments` với `{ orderId, paymentMethod: "WALLET" }`, header `Idempotency-Key` hợp lệ, đơn `PENDING` của chính người gọi và đủ cấu hình tạo URL (mục 3.4) thì trả 201 với `orderStatus = "PENDING"`, `status = "PENDING"`, `amount` bằng `Order.total`, `paymentUrl` (URL thanh toán VNPay đã ký) và `expiresAt` (chuỗi ISO 8601, sau lúc tạo 15 phút); DB có đúng 1 `Payment` `PENDING` cho đơn, `Order.status` vẫn là `PENDING`; API không chờ VNPay.
  - AC-F14.6: Lần thành công đầu tiên của đơn marker true (do IPN hoặc QueryDR xác nhận) giảm onHand và reserved đúng snapshot trong cùng transaction với Payment SUCCESS và Order PAID. Replay thành công trả 200 và không thay số dư/snapshot; không dùng công thức hiện tại để tính lại. Đơn cũ marker false chuyển `PAID` mà không gọi settle snapshot.
  - AC-F14.2: Khi `paymentMethod` ngoài `WALLET`/`CARD` hoặc thiếu `orderId` thì trả 400 `VALIDATION_ERROR`; thiếu hoặc rỗng header `Idempotency-Key`, hoặc dài hơn 255 ký tự, thì trả 400 `IDEMPOTENCY_KEY_REQUIRED`. Body không còn `cardNumber`: trường lạ bị từ chối theo AC-N06.1. Các trường hợp này không tạo `Payment` và không đổi đơn.
  - AC-F14.3: Khi `orderId` không tồn tại thì trả 404 `ORDER_NOT_FOUND`; khi đơn thuộc người khác thì trả 403 `FORBIDDEN`; sau khi kiểm xác thực và quyền sở hữu, nếu có kết quả thành công của cùng chủ đơn/`orderId`/key/`paymentMethod` (BR-05) thì trả lại 200 theo FR-16 trước khi xét trạng thái. Chỉ với yêu cầu mới, khi đơn đang ở `PAID`, `PREPARING`, `READY`, `COMPLETED` hoặc `CANCELLED` thì trả 409 `ORDER_NOT_PAYABLE`; các nhánh trên đều không tạo `Payment` mới.
  - AC-F14.4: Khi gọi bằng token Barista thì trả 403 `FORBIDDEN`.
  - AC-F14.5: Khi khách bấm "Thanh toán qua VNPay" ở màn thanh toán thì giao diện không có ô nhập số thẻ, gửi `POST /payments` không kèm `cardNumber`, lưu `orderId`, `Idempotency-Key`, `paymentId` và `paymentMethod` của phiên checkout rồi chuyển trình duyệt tới `paymentUrl`; giỏ hàng chỉ bị xóa khi DB xác nhận đơn đã trả (AC-F20.1).
  - AC-F14.7: Khi `POST /payments` phải tạo URL mới nhưng thiếu `VNP_TMN_CODE`, `VNP_HASH_SECRET` hoặc `WEB_URL`, hoặc ký lỗi, thì trả 502 `PAYMENT_PROVIDER_ERROR`; không tạo `Payment` và không đổi trạng thái đơn. Replay `SUCCESS` và replay `PENDING` còn hạn vẫn trả 200 mà không cần cấu hình VNPay (UC-04 E13).
  - AC-F14.8: Khi thiếu `VNP_TMN_CODE` hoặc `VNP_HASH_SECRET` thì `GET /payments/vnpay/ipn` trả `RspCode 99` và không đọc, không ghi DB (không trả `97`, vì chữ ký chưa kiểm được); lỗi bất ngờ khi xử lý IPN cũng trả `99` để VNPay gọi lại. Thiếu riêng `WEB_URL` không chặn IPN, QueryDR và return. API vẫn khởi động khi thiếu biến, dòng cảnh báo lúc khởi động chỉ ghi tên biến thiếu, và `GET /health` vẫn trả theo trạng thái DB (AC-N15.1, AC-N15.2) (UC-04 E13).
  - AC-F14.9: Khi `GET /payments/vnpay/ipn` có chữ ký hợp lệ, `vnp_TmnCode` đúng cấu hình, `vnp_TxnRef` khớp một `Payment PENDING` của đơn `PENDING`, `vnp_Amount` bằng `Payment.amount × 100`, `vnp_ResponseCode = 00` và `vnp_TransactionStatus = 00` thì trả HTTP 200 `RspCode 00`; `Payment` sang `SUCCESS` (lưu hai mã gateway, `gatewayTxnNo`, `bankCode`, `paidAt` đọc theo GMT+7), đơn sang `PAID`, kho theo AC-F14.6. IPN tới sau `expiresAt` nhưng `Payment` và đơn vẫn `PENDING` vẫn được nhận bình thường.
  - AC-F14.10: Khi IPN có chữ ký sai hoặc `vnp_TmnCode` khác cấu hình thì trả `RspCode 97`; không có `Payment` ứng với `vnp_TxnRef` thì trả `01`; `vnp_Amount` khác `Payment.amount × 100` thì trả `04`. Cả ba trường hợp không đổi DB và kho (UC-04 E9).
  - AC-F14.11: Khi `GET /payments/vnpay/return` có chữ ký và merchant hợp lệ và tìm thấy `Payment` thì trả `{ valid: true, paymentId, orderId, responseCode }`; sai chữ ký, sai merchant, không thấy `Payment` hoặc thiếu cấu hình xác minh thì trả `{ valid: false }` và không trả ID lấy từ query chưa xác thực. Endpoint không ghi DB. Trang `/payment/vnpay-return` lấy trạng thái từ `GET /orders/:id` (tự làm mới mỗi 2 giây, tối đa 30 giây), không dựa vào `responseCode` để kết luận (BR-11) (UC-04 E9).
  - AC-F14.12: Khi chưa có IPN (chạy local, Render ngủ) và `Payment` còn `PENDING` thì `POST /payments/:id/sync` hỏi VNPay bằng QueryDR; nếu phản hồi đã xác thực (chữ ký, merchant, mã tham chiếu, và với response `00` còn số tiền cùng `vnp_TransactionType = 01`) có `vnp_ResponseCode = 00` và `vnp_TransactionStatus = 00` thì áp như IPN thành công (AC-F14.9, AC-F14.6) và trả 200 `{ paymentId, orderId, orderStatus, status }`. Kho chỉ trừ một lần dù IPN tới sau (UC-04 E10).
  - AC-F14.13: `POST /payments/:id/sync` kiểm quyền trước khi gọi VNPay: chưa đăng nhập trả 401 `UNAUTHORIZED`; không phải chủ đơn hoặc token Barista trả 403 `FORBIDDEN`; không có payment trả 404 `PAYMENT_NOT_FOUND`. `Payment` đã `SUCCESS` hoặc `FAILED` thì trả 200 `{ paymentId, orderId, orderStatus, status }` từ DB, không gọi QueryDR và không đòi cấu hình VNPay.

#### FR-15 — Xử lý thanh toán thất bại
- **Mô tả:** Khi VNPay xác nhận thanh toán thất bại (IPN hoặc QueryDR đã xác thực, gồm cả khách bấm Hủy trên trang VNPay), `Payment` sang `FAILED` và đơn sang `PAYMENT_FAILED`; giỏ hàng và đơn được giữ để khách thử lại (hoặc hủy theo FR-25) (BR-09). Luồng UC-04 liên quan: E3, A3, E12.
- **Ưu tiên:** Must · **Use-case:** UC-04.2 · **Stakeholder:** S1, S6
- **Tiêu chí chấp nhận:**
  - AC-F15.1: Khi IPN hợp lệ (chữ ký, merchant, số tiền khớp) của `Payment PENDING` báo thất bại cuối cùng, tức `vnp_TransactionStatus = 02` và `vnp_ResponseCode` khác `00`/`07`, kể cả khi khách bấm Hủy trên trang VNPay (`24`), thì trả `RspCode 00`; `Payment` sang `FAILED` (lưu riêng `vnp_ResponseCode` và `vnp_TransactionStatus`), `Order.status = "PAYMENT_FAILED"`. `POST /payments` không còn trả 402 (UC-04 E3). (chờ spike)
  - AC-F15.3: Thanh toán thất bại giữ nguyên onHand, reserved và snapshot; đơn giữ OrderItem và xuất hiện trong lịch sử ở PAYMENT_FAILED. `Payment FAILED` (kể cả `EXPIRED`) không nhả nguyên liệu. Retry cùng orderId không giữ thêm nguyên liệu.
  - AC-F15.4: Khi trạng thái đơn trong DB đã là `PAYMENT_FAILED` (trang `/payment/vnpay-return` đọc `GET /orders/:id`) thì giao diện hiển thị "Thanh toán không thành công. Đơn của bạn vẫn được giữ, bạn có thể thử lại hoặc chọn phương thức khác." (hoặc thông báo theo mã VNPay ở mục 3.4), giỏ hàng còn đủ các dòng, có nút "Thử lại" (có nút "Hủy đơn" theo FR-25). Khi `Payment` còn `PENDING` hoặc chưa đối soát xong thì giao diện chỉ hiển thị "Đang xác minh thanh toán, vui lòng kiểm tra lại", không báo thất bại và không khuyên trả lần hai; mã trên return không lấn át trạng thái DB.
  - AC-F15.5: Khi khách thử lại sau `PAYMENT_FAILED` cho cùng `orderId` (key mới, cùng hoặc khác `paymentMethod`) thì `POST /payments` trả 201 với `Payment PENDING` mới và URL mới; `Order` đi `PAYMENT_FAILED → PENDING` ngay khi tạo, **không** tạo `Order` mới (số đơn của khách không đổi) và `reserved` không tăng. Khi IPN hoặc QueryDR xác nhận thành công lần thử mới thì `Order` sang `PAID`, đơn có thêm đúng 1 `Payment` `SUCCESS` (UC-04 A3).
  - AC-F15.6: Khi QueryDR đã xác thực trả `vnp_ResponseCode = 00` với `vnp_TransactionStatus = 02` cho `Payment` còn `PENDING` thì `Payment` sang `FAILED` và đơn sang `PAYMENT_FAILED`; lưu riêng response `00` và status `02`, không gắn nhãn `EXPIRED`.
  - AC-F15.7: Khi IPN thành công hợp lệ (`00`/`00`) tới sau trạng thái cuối, tức `Payment` đã `FAILED` (kể cả `EXPIRED`), đơn đã `CANCELLED` hoặc đơn đã trả bằng payment khác, thì trả `RspCode 02` và ghi warning `PAYMENT_RECONCILIATION_REQUIRED` kèm `vnp_TxnRef`; đơn và kho không đổi. QueryDR phát hiện tiền về muộn cũng ghi warning như vậy. IPN lặp của chính `Payment SUCCESS` chỉ trả `02`, không ghi warning (UC-04 E12).
  - AC-F15.8: Khi QueryDR đã xác thực trả `vnp_ResponseCode = 91`: nếu `Payment` còn hạn thì giữ `PENDING` và trả 409 `PAYMENT_IN_PROGRESS`; nếu đã quá hạn thì `Payment` sang `FAILED` với `gatewayResponseCode = "EXPIRED"` và đơn sang `PAYMENT_FAILED`, không đổi kho (UC-04 E11). (chờ spike)

#### FR-16 — Thanh toán idempotent
- **Mô tả:** Gửi lại cùng yêu cầu thanh toán (mất phản hồi, bấm đúp, retry mạng) hoặc IPN lặp không thu tiền hai lần và không tạo trùng bản ghi; khi chưa xác định kết quả thì không mở lần thử mới (BR-05, BR-10, BR-11). Luồng UC-04 liên quan: E4, A6, A5, E11.
- **Ưu tiên:** Must · **Use-case:** UC-04.2 · **Stakeholder:** S1, S3, S6
- **Tiêu chí chấp nhận:**
  - AC-F16.1: Khi gửi hai lần `POST /payments` giống hệt nhau (cùng chủ đơn, `orderId`, `Idempotency-Key` và `paymentMethod`, theo BR-05) và lần đầu đã được xác nhận thành công (`Payment SUCCESS`) thì lần hai trả 200 `{ paymentId, orderId, orderStatus: "PAID", amount, status: "SUCCESS" }` với `paymentId` giống lần đầu; không tạo URL mới, không gọi VNPay, không cần cấu hình VNPay; DB có đúng 1 `Payment` `SUCCESS` cho đơn. Cùng key nhưng khác `paymentMethod` sau khi đã thành công không phải replay: xử lý như yêu cầu mới, đơn đã `PAID` nên trả 409 `ORDER_NOT_PAYABLE` (UC-04 E4).
  - AC-F16.4: Khi đơn đã `PAID` mà khách gửi `Idempotency-Key` **mới** thì trả 409 `ORDER_NOT_PAYABLE`, không tạo `Payment` hay URL mới (không thu tiền lần hai).
  - AC-F16.5: Khi lần trước thất bại (`Payment FAILED`, FR-15) thì gửi lại cùng key được xử lý như lần thử mới (BR-05), không trả lại kết quả thất bại cũ.
  - AC-F16.6: Khi bấm "Thanh toán qua VNPay" thì nút bị vô hiệu cho tới khi có phản hồi (chống bấm đúp); giao diện dùng cùng một `Idempotency-Key` cho cả phiên màn thanh toán, sinh key mới khi bắt đầu phiên thanh toán khác; chuyển sang đăng nhập theo E1 phải giữ key cùng `orderId` để tiếp tục phiên cũ.
  - AC-F16.8: Khi đơn đã có `Payment PENDING` còn hạn thì `POST /payments` cùng `paymentMethod` (kể cả `Idempotency-Key` mới) trả 200 với `paymentId`, `paymentUrl`, `expiresAt` cũ và không tạo `Payment` thứ hai; khác `paymentMethod` trả 409 `PAYMENT_IN_PROGRESS`. Hai yêu cầu tạo thanh toán đồng thời cho một đơn chỉ tạo tối đa một `Payment PENDING` (BR-10). Khi khách quay lại màn thanh toán của đơn đó, giao diện hiển thị "Tiếp tục thanh toán" dùng URL cũ (UC-04 E4, A6).
  - AC-F16.9: Khi `POST /payments` mới gặp `Payment PENDING` đã quá hạn (`now ≥ expiresAt`) thì API hỏi QueryDR bên ngoài transaction chính trước, rồi xét replay `SUCCESS` (BR-05) trước khi xét tạo giao dịch mới: payment được xác nhận thành công thì cùng chủ đơn/key/`paymentMethod` trả 200 replay, key hoặc phương thức khác trả 409 `ORDER_NOT_PAYABLE`; xác nhận thất bại thì được tạo lần thử mới; chưa kết luận thì giữ `PENDING`, trả 409 `PAYMENT_IN_PROGRESS` và không tạo URL mới (UC-04 E11).
  - AC-F16.10: Khi QueryDR đã xác thực trả `vnp_ResponseCode = 00` với `vnp_TransactionStatus = 01` (chưa hoàn tất) thì giữ `Payment PENDING` và trả 409 `PAYMENT_IN_PROGRESS`, kể cả khi đã quá hạn; không mở lần thử mới. Ca bỏ dở phải kết thúc trong thời gian hữu hạn, không để đơn vừa không trả tiếp được vừa không hủy được: cách kết thúc (đóng sau khoảng chờ đã đo, hoặc nhân viên đóng sau khi tra Merchant Admin) do spike chốt (UC-04 E11). (chờ spike)
  - AC-F16.11: Khi QueryDR lỗi mạng, hết thời gian chờ (10 giây), sai chữ ký, sai merchant, mã tham chiếu hay số tiền, thiếu cấu hình truy vấn, hoặc trả `vnp_ResponseCode` khác `00`/`91` (như `94`, `99`, `97`, `02`, `03`) thì trả 502 `PAYMENT_PROVIDER_ERROR`, không đổi DB và kho; không dùng `94` hay `99` làm bằng chứng thất bại, không gọi lại liên tục, và phản hồi thiếu dữ liệu xác thực không được dùng để đóng payment kể cả khi mang mã `91`. Response `00` kèm `vnp_TransactionStatus` thuộc nhóm đảo/hoàn tiền/nghi ngờ (`04`, `05`, `06`, `07`, `09`), thiếu hoặc mã chưa hỗ trợ thì giữ `PENDING`, trả 502, ghi warning đối soát khi có dấu hiệu đã trừ hoặc hoàn tiền, và không mở lần thu mới (UC-04 E13).
  - AC-F16.12: Khi IPN thành công đã xử lý được gọi lại với cùng tham số (VNPay gọi lại tối đa 10 lần, cách nhau 5 phút) thì trả `RspCode 02`, không trừ kho lần hai và không ghi warning đối soát. Khi IPN và `sync` cùng xác nhận một payment thì chỉ có một `Payment SUCCESS` và kho chỉ trừ một lần; kết quả QueryDR cũ không ghi đè trạng thái do IPN vừa áp (BR-11).
  - AC-F16.13: Khi chủ đơn gửi `PATCH /orders/:id` với `{ "status": "CANCELLED" }` mà đơn có `Payment PENDING` còn hạn thì trả 409 `PAYMENT_IN_PROGRESS`, đơn và kho không đổi. Nếu `Payment PENDING` đã quá hạn thì đối soát QueryDR trước (AC-F16.9); chỉ khi không còn payment chưa kết luận mới xét hủy theo FR-25 (UC-04 A5, E11).

### 5.7 Lịch sử đơn

#### FR-20 — Xác nhận đơn (biên lai)
- **Mô tả:** Sau thanh toán thành công, khách thấy màn xác nhận đơn.
- **Ưu tiên:** Must · **Use-case:** UC-04, UC-05 · **Stakeholder:** S1, S4
- **Tiêu chí chấp nhận:**
  - AC-F20.1: Khi DB xác nhận đơn đã `PAID` (trang `/payment/vnpay-return` đọc `GET /orders/:id` thấy đã trả, hoặc `POST /payments` replay `SUCCESS` trả 200) thì giao diện chuyển tới màn xác nhận hiển thị: mã đơn, trạng thái "Đã thanh toán", danh sách món (tên, size, topping, số lượng), số tiền đã trả, phương thức, thời gian.
  - AC-F20.2: Khi hiển thị màn xác nhận thì giỏ hàng đã được xóa (số lượng trên biểu tượng giỏ là 0); khi thanh toán thất bại hoặc `Payment` còn `PENDING` thì giỏ **không** bị xóa.
  - AC-F20.3: Khi tải lại trang xác nhận thì nội dung vẫn đúng (dữ liệu lấy từ `GET /orders/:id`, không phụ thuộc state tạm); có nút "Theo dõi đơn" dẫn tới trang chi tiết đơn.

#### FR-21 — Lịch sử đơn của tôi
- **Mô tả:** Customer xem danh sách đơn của chính mình, mới nhất trước.
- **Ưu tiên:** Must · **Use-case:** UC-05 · **Stakeholder:** S1
- **Tiêu chí chấp nhận:**
  - AC-F21.1: Khi `GET /orders/me` với token Customer thì trả 200 với mảng các đơn của **chính người đó**, sắp theo `createdAt` giảm dần, mỗi phần tử có `id`, `status`, `total`, `createdAt`; tối đa 50 đơn mới nhất.
  - AC-F21.2: Khi có hai khách A và B, mỗi người đặt một đơn thì `GET /orders/me` của A không chứa đơn của B.
  - AC-F21.3: Khi chưa có đơn thì trả 200 `[]` và giao diện hiển thị "Bạn chưa có đơn nào" cùng liên kết tới menu; có loading và error như FR-02.
  - AC-F21.4: Khi gọi không token thì 401; token Barista thì 403.
  - AC-F21.5: Giao diện mỗi dòng hiển thị mã đơn, ngày giờ, tổng tiền và nhãn trạng thái tiếng Việt (mục 3.6).

#### FR-22 — Xem chi tiết và theo dõi trạng thái đơn
- **Mô tả:** Customer xem chi tiết một đơn của mình và thấy trạng thái cập nhật tự động (bước "Theo dõi đơn" của luồng).
- **Ưu tiên:** Must · **Use-case:** UC-05 · **Stakeholder:** S1, S2
- **Tiêu chí chấp nhận:**
  - AC-F22.1: Khi `GET /orders/:id` của chủ đơn thì trả 200 với `status`, `total`, `discountAmount` (luôn 0 trong bản nộp), `items`, `payments` (nếu có, gồm các trường ở mục 3.1); đơn không tồn tại trả 404 `ORDER_NOT_FOUND`; đơn của người khác trả 403 `FORBIDDEN`; token Barista xem được mọi đơn (200).
  - AC-F22.2: Khi trang theo dõi đơn đang mở và Barista đổi trạng thái (FR-24) thì nhãn trên trang cập nhật trong vòng 6 giây mà không cần tải lại (tự làm mới mỗi 5 giây).
  - AC-F22.3: Khi đơn đã ở `COMPLETED` hoặc `CANCELLED` thì trang ngừng tự làm mới (không còn yêu cầu định kỳ).
  - AC-F22.4: Trang hiển thị tiến trình `PAID → PREPARING → READY → COMPLETED` với bước hiện tại được đánh dấu; trạng thái `CANCELLED` và `PAYMENT_FAILED` hiển thị nhãn riêng.

### 5.8 Quản lý trạng thái đơn

> **BREW-INVENTORY-01:** FR-23, FR-24, FR-25 là Must. Barista đổi tiến độ đơn đã trả; chủ đơn hủy đơn chưa trả và giải phóng snapshot. Hoàn tiền đơn đã trả và hàng đợi vẫn ngoài phạm vi.

#### FR-23 — Vòng đời và chặn chuyển trạng thái sai
- **Mô tả:** Mọi thay đổi trạng thái đơn tuân theo bảng chuyển hợp lệ theo phạm vi ở mục 3.6; chuyển ngoài bảng bị từ chối.
- **Ưu tiên:** Must · **Use-case:** UC-07 · **Stakeholder:** S2, S3, S5
- **Tiêu chí chấp nhận:**
  - AC-F23.1: Unit test duyệt toàn bộ 49 cặp (trạng thái hiện tại, trạng thái đích) trên 7 trạng thái: chấp nhận đúng 8 cặp ở mục 3.6 và từ chối 41 cặp còn lại (kể cả cặp trùng trạng thái và `PAID → CANCELLED`, FR-26 Won’t); quyền của từng actor kiểm riêng theo FR-24 (và FR-25).
  - AC-F23.2: Khi gọi `PATCH /orders/:id` với chuyển không hợp lệ (ví dụ `PAID → READY`, `PREPARING → CANCELLED`, `COMPLETED → PREPARING`) thì trả 409 `INVALID_ORDER_TRANSITION` và trạng thái đơn trong DB không đổi. Các trường hợp bị từ chối do phân quyền theo FR-24 và FR-25 trả 403 theo tiêu chí tương ứng; quy định 409 ở đây áp dụng khi không thuộc các trường hợp đó.
  - AC-F23.3: Khi `status` đích trong body là `PENDING`, `PAID` hoặc `PAYMENT_FAILED` thì trả 400 `VALIDATION_ERROR` (các chuyển này chỉ do luồng thanh toán thực hiện).
  - AC-F23.4: `COMPLETED` và `CANCELLED` không có chuyển nào đi ra.

#### FR-24 — Barista đổi trạng thái đơn qua API
- **Mô tả:** Barista chuyển đơn đã thanh toán qua `PREPARING`, `READY`, `COMPLETED`.
- **Ưu tiên:** Must · **Use-case:** UC-07 · **Stakeholder:** S2, S1
- **Tiêu chí chấp nhận:**
  - AC-F24.1: Khi token Barista gọi `PATCH /orders/:id` với `{ "status": "PREPARING" }` trên đơn `PAID` thì trả 200 với `status = "PREPARING"`; tiếp tục `READY` rồi `COMPLETED` đều trả 200.
  - AC-F24.2: Customer gọi PREPARING/READY/COMPLETED trả 403 FORBIDDEN; không token trả 401. Customer chỉ hủy đơn của chính mình theo AC-F25.1–2; thao tác từ chối không đổi số dư hoặc trạng thái.
  - AC-F24.3: Khi Barista chuyển đơn `PENDING` hoặc `PAYMENT_FAILED` sang `PREPARING` thì trả 409 `INVALID_ORDER_TRANSITION`; `id` không tồn tại trả 404 `ORDER_NOT_FOUND`. Khi Barista gửi `{ "status": "CANCELLED" }` trên đơn `PENDING` hoặc `PAYMENT_FAILED` thì trả 403 `FORBIDDEN` (hai chuyển này chỉ dành cho chủ đơn, mục 3.6); trên đơn `PAID`, `PREPARING`, `READY`, `COMPLETED` hoặc `CANCELLED` thì trả 409 `INVALID_ORDER_TRANSITION` (chuyển không có trong bảng, `PAID → CANCELLED` là FR-26 Won’t). Mọi trường hợp bị từ chối đều không đổi trạng thái đơn, snapshot và số dư nguyên liệu/legacy stock.
  - AC-F24.4: Có hướng dẫn API thủ công: Barista đăng nhập lấy Bearer token, GET /orders/:id theo mã đơn, PATCH lần lượt PREPARING/READY/COMPLETED trên đơn đã PAID; nhận 200 và các lỗi theo AC-F24.1–3. Không giao Postman collection hoặc bộ test trong bản cuối.

#### FR-25 — Khách hủy đơn chưa thanh toán
- **Mô tả:** Customer hủy đơn của mình ở PENDING/PAYMENT_FAILED và giải phóng nguyên liệu đã giữ đúng một lần; không thay onHand, không tự hủy theo thời gian. Đơn còn `Payment PENDING` chưa kết luận thì chưa hủy được (409 `PAYMENT_IN_PROGRESS`, AC-F16.13).
- **Ưu tiên:** Must · **Use-case:** UC-06 · **Stakeholder:** S1, S3
- **Tiêu chí chấp nhận:**
  - AC-F25.1: Chủ đơn PATCH CANCELLED ở PENDING/PAYMENT_FAILED trả 200. Đơn marker true giảm reserved theo snapshot, onHand không đổi; gọi lại trả 409 và không giải phóng lần hai. Với đơn legacy marker false chỉ hoàn Product.stock theo vòng đời cũ, không đổi nguyên liệu.
  - AC-F25.2: Khi Customer hủy đơn của người khác thì trả 403 `FORBIDDEN`; hủy đơn `PAID` bằng token Customer thì trả 403 `FORBIDDEN` (Barista hủy `PAID`: FR-26 Won’t, trả 409 `INVALID_ORDER_TRANSITION`); hủy đơn `PREPARING`, `READY`, `COMPLETED` hoặc `CANCELLED` thì trả 409 `INVALID_ORDER_TRANSITION`.
  - AC-F25.3: Giao diện hiển thị nút "Hủy đơn" cho đơn `PENDING` và `PAYMENT_FAILED`, hỏi xác nhận "Bạn chắc chắn muốn hủy đơn?"; sau khi hủy nhãn đơn là "Đã hủy" và nút biến mất. Khi còn `Payment PENDING` chưa kết luận thì chưa cho hủy (AC-F16.13).

### 5.9 Yêu cầu không thực hiện (Won't)

FR-17, FR-18, FR-19, FR-26, FR-27 từng có đặc tả mở rộng trong baseline PR #5; nay gộp vào bảng này (xem mục 1.4), giữ nguyên mã. Nếu một PR sau phê duyệt đưa lại vào phạm vi thì viết lại tiêu chí chấp nhận trong PR đó.

| Mã | Yêu cầu | Lý do không làm | Kiểm chứng "không làm" |
|---|---|---|---|
| FR-17 | Xác thực và áp mã giảm giá khi thanh toán | Ngoài bản nộp | Không có endpoint/UI nhập mã giảm giá; body `POST /payments` không có `promotionCode` |
| FR-18 | Ghi nhận điểm thưởng khi đơn `PAID` | Ngoài bản nộp | Không có endpoint/UI ghi điểm; luồng thanh toán không tạo `LoyaltyTransaction` |
| FR-19 | Hiển thị điểm thưởng của khách | Ngoài bản nộp; phụ thuộc FR-18 | Không có endpoint/UI hồ sơ hoặc điểm thưởng |
| FR-26 | Hủy đơn đã thanh toán và hoàn tiền | Ngoài bản nộp; refund API của VNPay cũng ngoài phạm vi (tiền về muộn xử lý tay, mục 3.4) | Không có endpoint/UI hoàn tiền; Barista đổi đơn `PAID` sang `CANCELLED` nhận 409 `INVALID_ORDER_TRANSITION` |
| FR-27 | Barista xem hàng đợi đơn (API danh sách và màn hình) | Ngoài bản nộp; Barista dùng `GET /orders/:id` theo mã đơn | Không có endpoint/UI danh sách đơn cho Barista |
| FR-28 | Quản trị menu (thêm, sửa, xóa món, giá, size, topping) | Ngoài luồng đề A2 §1.1, §7.1; menu nạp bằng seed | Không có route quản trị trong web; `POST /products` trả 404 hoặc 405 |
| FR-30 | Quản trị voucher/khuyến mãi bằng màn hình | Không seed khuyến mãi; `Promotion` vẫn có trong mô hình (đề A2 §4.3) | Không có endpoint tạo/sửa `Promotion` |
| FR-31 | Thanh toán qua cổng production thật (Momo, VNPay production, Stripe...) | Chỉ dùng VNPay sandbox, không thu tiền thật (A-01) | Cấu hình chỉ có thông tin VNPay sandbox; không có khóa hoặc URL của cổng production |
| FR-32 | Đổi hoặc trừ điểm thưởng khi thanh toán | Ghi nhận/hiển thị điểm cũng ngoài bản nộp | Không có trường dùng điểm trong body `POST /payments` |

---

### 5.10 FR-29 — Quản lý nguyên liệu, công thức và khả năng bán

- **Ưu tiên:** Must · **Use-case:** UC-10, UC-01, UC-02, UC-04 · **Stakeholder:** S1, S2, S3
- AC-F29.1: Barista xem onHand/reserved/available, đơn vị và tracked tại `/inventory`; Guest nhận 401, Customer nhận 403 với endpoint quản trị.
- AC-F29.2: RECEIVE lượng dương và ADJUST số kiểm kê cuối cùng không âm bắt buộc lý do 1–500 ký tự; ghi StockMovement cùng transaction với số dư, gồm actor, delta có dấu, số dư sau và thời điểm. ADJUST dưới reserved trả 409 BELOW_RESERVED, không đổi DB. Hiển thị 100 movement mới nhất.
- AC-F29.3: Nhận 0.020kg matcha thành 20g, 2l sữa thành 2000ml; số âm/sai đơn vị/quá 3 chữ số thập phân/piece lẻ bị 400. Không cho đổi khối lượng sang thể tích.
- AC-F29.4: Barista thay trọn công thức theo product+size hoặc topping, 1–50 nguyên liệu duy nhất, lượng dương hợp đơn vị; chọn cả hai/không chọn selector bị 400. Sửa công thức nguyên tử và không sửa snapshot đơn đã giữ.
- AC-F29.5: Seed tạo thiếu nguyên liệu ở 0 và công thức demo, update rỗng bảo toàn số dư/công thức đã sửa. Chạy lại không tạo trùng; dữ liệu demo phải nhận qua API có lý do. Migration additive đánh dấu đơn cũ false, mọi đơn mới true; không chuyển số ly cũ thành nguyên liệu.
- AC-F29.6: Kiểm nghiệm thu thủ công theo [UC-10](uc-inventory.md) và [runbook](../inventory-runbook.md), gồm ví dụ Matcha 6 ly, giỏ dùng chung nguyên liệu, thanh toán thất bại/thử lại/replay, hủy lặp và sửa công thức sau đặt đơn. Kết quả thực tế được ghi riêng ở [verification](../inventory-verification.md), không suy từ đặc tả.

## 6. Yêu cầu phi chức năng (NFR)

### 6.1 Hiệu năng

#### NFR-01 — Thời gian phản hồi API đọc
- **Mô tả:** Các API đọc menu phản hồi nhanh với dữ liệu mẫu trên môi trường local. Đề A2 không đặt ngưỡng số; production free tier có thể "ngủ" nên không đo ở production. Nhóm chọn mức Must để nhóm hiệu năng có một cam kết kiểm chứng được; ngưỡng p95 ≤ 500 ms lấy theo đề A1 §4.2.
- **Ưu tiên:** Must · **Stakeholder:** S1, S4
- **Tiêu chí chấp nhận:**
  - AC-N01.1: Với dữ liệu mẫu (không quá 50 sản phẩm) trên môi trường `docker-compose` local, 100 yêu cầu tuần tự `GET /products` và 100 yêu cầu `GET /products/:id` đều có phân vị 95 (p95) không quá 500 ms.

#### NFR-02 — Tốc độ tải trang menu trên di động
- **Ưu tiên:** Could · **Stakeholder:** S1
- **Tiêu chí chấp nhận:**
  - AC-N02.1: Lighthouse (hồ sơ di động, mạng "Slow 4G") trên bản build production local của trang menu cho Largest Contentful Paint không quá 2,5 giây và điểm Performance từ 80 trở lên.
  - AC-N02.2: Khi API chưa phản hồi (dịch vụ free đang ngủ) thì giao diện hiển thị trạng thái loading (AC-F02.1), không để trang trắng.

#### NFR-03 — Thời gian phản hồi đặt đơn và thanh toán
- **Ưu tiên:** Could · **Stakeholder:** S1, S6
- **Tiêu chí chấp nhận:**
  - AC-N03.1: Với dữ liệu mẫu, p95 của `POST /orders` qua 50 yêu cầu không quá 1 giây; p95 của `POST /payments` qua 50 yêu cầu không quá 2 giây. Endpoint này chỉ tạo `Payment PENDING` và ký URL, không chờ VNPay, nên thời gian khách trả trên trang VNPay không tính vào chỉ số.

### 6.2 Bảo mật

#### NFR-04 — Băm mật khẩu
- **Ưu tiên:** Must · **Stakeholder:** S1, S3, S4
- **Tiêu chí chấp nhận:**
  - AC-N04.1: Sau khi đăng ký, giá trị cột mật khẩu trong DB khác mật khẩu gốc và khớp mẫu băm bcrypt với cost ít nhất 10 (bắt đầu bằng `$2a$10$`, `$2b$10$` hoặc cost lớn hơn) hoặc argon2.
  - AC-N04.2: Không có phản hồi API và không có dòng log nào chứa mật khẩu gốc hoặc giá trị băm (kiểm bằng test gọi các endpoint và quét log).

#### NFR-05 — JWT và phân quyền
- **Ưu tiên:** Must · **Stakeholder:** S1, S2, S3, S4
- **Tiêu chí chấp nhận:**
  - AC-N05.1: JWT được ký bằng khóa đọc từ biến môi trường (ít nhất 32 ký tự), có `exp` không quá 3600 giây kể từ lúc cấp; token đổi một ký tự bị từ chối với 401.
  - AC-N05.2: Ma trận quyền sau được test từng ô: không token → 401 cho mọi endpoint ở FR-10; `POST /orders`, `POST /payments`, `POST /payments/:id/sync`, `GET /orders/me` chỉ `CUSTOMER` (Barista nhận 403); `GET /payments/vnpay/ipn` và `GET /payments/vnpay/return` công khai, bảo vệ bằng chữ ký VNPay; `GET /orders/:id` cho chủ đơn hoặc Barista; `PATCH /orders/:id` theo quy tắc FR-24 (và FR-25).
  - AC-N05.3: Customer không đọc, thanh toán hoặc hủy được đơn của người khác (403 `FORBIDDEN`).

#### NFR-06 — Kiểm dữ liệu đầu vào hai phía và chống tiêm lệnh
- **Ưu tiên:** Must · **Stakeholder:** S1, S4, S5
- **Tiêu chí chấp nhận:**
  - AC-N06.1: Mọi body/tham số được kiểm bằng DTO với danh sách trường cho phép (trường lạ bị từ chối); kiểm sai trả 400 `VALIDATION_ERROR` với `details` theo từng trường.
  - AC-N06.2: Khi gửi `email = "' OR 1=1 --"` tới `POST /auth/login` thì trả 400 hoặc 401, không bao giờ 500 và không đăng nhập được (truy vấn tham số hóa qua ORM).
  - AC-N06.3: Giao diện kiểm trước khi gửi: đăng ký/đăng nhập (email, mật khẩu), số lượng 1 đến 99; lỗi hiển thị dưới ô tương ứng.
  - AC-N06.4: Giá hoặc tổng gửi từ client không ảnh hưởng `Order.total` (xem AC-F12.3).

#### NFR-07 — Quản lý secret, cấu hình và CORS
- **Ưu tiên:** Must · **Stakeholder:** S3, S4, S5
- **Tiêu chí chấp nhận:**
  - AC-N07.1: Kiểm tra các file được Git theo dõi không chứa secret thật, gồm khóa JWT, mật khẩu DB và `VNP_HASH_SECRET` (đề A2 §7.4); `.env` có trong `.gitignore`; `.env.example` chỉ có giá trị mẫu, `VNP_TMN_CODE` và `VNP_HASH_SECRET` để trống. `VNP_HASH_SECRET` chỉ nằm trong `apps/api/.env` và biến môi trường Render, không có trong log, ảnh chụp hay mô tả PR.
  - AC-N07.2: Log của các lần chạy CI/CD không in giá trị secret (rà log trước khi nộp); mật khẩu xuất hiện trong tài liệu chỉ thuộc tài khoản demo và kèm chữ "demo" (đề A2 §7.4).
  - AC-N07.3: API chỉ chấp nhận origin trong biến `CORS_ORIGINS`; yêu cầu từ origin khác không nhận header `Access-Control-Allow-Origin`.
  - AC-N07.4: Token, mật khẩu, `VNP_HASH_SECRET`, payment URL, chữ ký (`vnp_SecureHash`) và payload IPN/QueryDR không được ghi vào log. Hệ thống không nhận số thẻ (khách nhập thẻ trên trang VNPay). Log vận hành về thanh toán chỉ gồm mã sự kiện, `vnp_TxnRef`, `vnp_ResponseCode`, `vnp_TransactionStatus` và `RspCode`.

#### NFR-08 — HTTPS và database không public
- **Ưu tiên:** Must · **Stakeholder:** S3, S4
- **Tiêu chí chấp nhận:**
  - AC-N08.1: URL web và URL API production đều dùng `https://`; yêu cầu `http://` bị chuyển hướng sang HTTPS hoặc bị từ chối. IPN bắt buộc HTTPS: URL IPN đăng ký với VNPay (`/payments/vnpay/ipn` trên API production) dùng `https://` và truy cập được công khai.
  - AC-N08.2: Từ máy bên ngoài, kết nối trực tiếp tới host và cổng 5432 của PostgreSQL production thất bại (từ chối hoặc hết thời gian chờ); API chỉ nối DB qua địa chỉ nội bộ (đề A2 §7.4).

### 6.3 Tính khả dụng

#### NFR-09 — Mobile-first
- **Ưu tiên:** Must · **Stakeholder:** S1, S4
- **Tiêu chí chấp nhận:**
  - AC-N09.1: Ở khung nhìn 360×640 và 390×844, các màn menu, chi tiết, giỏ hàng, thanh toán, đăng nhập/đăng ký, xác nhận, lịch sử, theo dõi đơn không có cuộn ngang (`scrollWidth` không lớn hơn `innerWidth`).
  - AC-N09.2: Nút hành động chính ("Thêm vào giỏ", "Thanh toán", "Thanh toán qua VNPay") có vùng chạm ít nhất 44×44 px; chữ nội dung ít nhất 16 px.
  - AC-N09.3: Ở khung nhìn 1280×800 các màn trên vẫn dùng được, không vỡ bố cục.

#### NFR-10 — Web app manifest (PWA)
- **Mô tả:** Đề A2 nhắc Next.js theo hướng mobile-first/PWA (§1.1, §5.1, §5.2, §9). Bản nộp chỉ yêu cầu web app manifest; không yêu cầu service worker hay chạy offline (A-09).
- **Ưu tiên:** Must · **Stakeholder:** S1, S4
- **Tiêu chí chấp nhận:**
  - AC-N10.1: Có web app manifest với `name`, `short_name`, `start_url`, `display = standalone`, `theme_color` và biểu tượng 192 px, 512 px; manifest được liên kết từ các trang (thẻ `<link rel="manifest">`).

#### NFR-11 — Ba trạng thái giao diện và thông báo lỗi dễ hiểu
- **Ưu tiên:** Must · **Stakeholder:** S1, S4
- **Tiêu chí chấp nhận:**
  - AC-N11.1: Mỗi màn tải dữ liệu từ API (menu, chi tiết món, lịch sử đơn, chi tiết đơn) có đủ trạng thái loading, empty (nếu áp dụng) và error theo FR-02.
  - AC-N11.2: Khi API giả lập trả 500 thì màn hiển thị thông báo tiếng Việt như "Không thể tải dữ liệu, vui lòng thử lại" kèm nút "Thử lại"; không hiển thị stack trace, JSON thô hay chỉ mã HTTP.

#### NFR-12 — Trình duyệt hỗ trợ
- **Ưu tiên:** Must · **Stakeholder:** S1, S4
- **Tiêu chí chấp nhận:**
  - AC-N12.1: Luồng end-to-end (menu → giỏ → đăng nhập → thanh toán → xác nhận đơn) chạy đạt trên Chromium bằng test E2E tự động.

### 6.4 Độ tin cậy dữ liệu

#### NFR-13 — Transaction và chống bán vượt tồn kho
- **Mô tả:** Các thao tác nhiều bước phải toàn vẹn: hoặc xong cả, hoặc không đổi gì.
- **Ưu tiên:** Must · **Stakeholder:** S3, S5
- **Tiêu chí chấp nhận:**
  - AC-N13.1: Tạo Order/OrderItem/OrderIngredient và tăng reserved là một transaction; thanh toán thành công/tiêu thụ snapshot và hủy/giải phóng snapshot đều nguyên tử. Lỗi giữa chừng không đổi DB; cạnh tranh không vi phạm 0 <= reserved <= onHand. Kiểm riêng đường legacy marker false.

### 6.5 Khả năng triển khai

#### NFR-14 — Chạy local bằng docker-compose
- **Ưu tiên:** Must · **Stakeholder:** S4, S5
- **Tiêu chí chấp nhận:**
  - AC-N14.1: Trên máy sạch chỉ có Docker và bản clone repository, lệnh `docker compose up --build` đưa web (cổng 3000), API (cổng 4000) và PostgreSQL (cổng 5432) vào trạng thái chạy trong vòng 5 phút; `GET /health` trả 200 và trang menu mở được.
  - AC-N14.2: Sau `docker compose down` (không dùng `-v`) rồi `up` lại thì dữ liệu đơn và tài khoản vẫn còn (volume lưu trữ bền vững).

#### NFR-15 — Health check
- **Ưu tiên:** Must · **Stakeholder:** S4, S5
- **Tiêu chí chấp nhận:**
  - AC-N15.1: `GET /health` không cần token, trả 200 `{ "status": "ok", "database": "up" }` trong vòng 1 giây khi DB hoạt động.
  - AC-N15.2: Khi DB không kết nối được thì `GET /health` trả 503 `{ "status": "error", "database": "down" }`.

#### NFR-16 — Migration và seed tái tạo được
- **Ưu tiên:** Must · **Stakeholder:** S4, S5
- **Tiêu chí chấp nhận:**
  - AC-N16.1: DB trống sau migration/seed có 8 sản phẩm, size/topping, nguyên liệu ở 0 và công thức demo. Hai tài khoản demo chỉ tạo khi SEED_DEMO_USERS=true; không seed khuyến mãi.
  - AC-N16.2: Seed lần hai không trùng bản ghi và bảo toàn số dư nguyên liệu/công thức đã sửa (update rỗng).
  - AC-N16.3: Migration nằm trong repository, có phiên bản, chạy được bằng một lệnh; migration phát hành chỉ thêm bảng hoặc cột (không xóa, không đổi tên cột) để bảo toàn dữ liệu. Bản rollback kho nguyên liệu phải hiểu marker/snapshot; không dùng image chỉ biết Product.stock sau khi có đơn marker true (ADR-006).

#### NFR-17 — Continuous Integration
- **Ưu tiên:** Must · **Stakeholder:** S4, S5
- **Tiêu chí chấp nhận:**
  - AC-N17.1: Bản cuối khi mở PR chạy Install, Lint, Build cho API/web; unit/integration/E2E suite bị loại theo yêu cầu sau kiểm chứng. Kết quả suite trước cleanup được ghi tại inventory-verification.md.
  - AC-N17.2: Pull request có lỗi lint hoặc build lỗi không merge được (branch protection yêu cầu check `ci` xanh); có minh chứng một lần chạy xanh và một lần chạy phát hiện lỗi (đề A2 §6.4).

#### NFR-18 — Continuous Delivery/Deployment và rollback
- **Ưu tiên:** Must · **Stakeholder:** S3, S4, S5
- **Tiêu chí chấp nhận:**
  - AC-N18.1: Khi đẩy tag `a2-v*` thì pipeline bản cuối chạy Lint/Build (suite đã loại sau kiểm chứng), Build Docker Image (gắn tag commit SHA hoặc semantic version), Push Registry, Deploy bằng secret của CI, chạy migration, Smoke Test.
  - AC-N18.2: Sau deploy API và web, Smoke Test gọi `GET /health` (trả 200, `database = "up"`), `GET /products` và trang web; mỗi bước thử lại tới khi nhận 200, tối đa 10 phút để chống ngủ đông/lỗi tạm thời; quá hạn thì pipeline báo đỏ và dừng.
  - AC-N18.3: Có quy trình rollback ghi trong `docs/deployment.md` và README, đã thử một lần: deploy lại image có tag commit SHA của bản trước và deployment web trước, rồi chạy lại smoke test theo AC-N18.2.

#### NFR-19 — Production truy cập được và bàn giao
- **Ưu tiên:** Must · **Stakeholder:** S3, S4
- **Tiêu chí chấp nhận:**
  - AC-N19.1: Vào ngày chấm, URL web production mở được qua HTTPS và hiển thị menu; URL API `GET /health` trả 200; cả hai URL ghi trong README.
  - AC-N19.2: Một người ngoài nhóm clone repository, làm theo README thì chạy được hệ thống local và truy cập được URL production (đề A2 §7.4); lỗi họ gặp được sửa vào README.

#### NFR-20 — Logging có cấu trúc
- **Ưu tiên:** Should · **Stakeholder:** S5, S4
- **Tiêu chí chấp nhận:**
  - AC-N20.1: Mỗi yêu cầu HTTP ghi một dòng log JSON có `timestamp`, `method`, `path`, `status`, `durationMs`, `requestId`.
  - AC-N20.2: Mức log chọn bằng biến `LOG_LEVEL`; log lỗi có stack nhưng không chứa secret, mật khẩu, token, payment URL hay chữ ký VNPay (xem NFR-07).

---

## 7. Ánh xạ yêu cầu → stakeholder

Stakeholder gọi theo mã trong [`context-and-scope.md`](context-and-scope.md) mục 2: **S1** khách hàng, **S2** nhân viên quầy, **S3** quản lý cửa hàng, **S4** giảng viên/khách hàng nghiệm thu, **S5** nhóm phát triển, **S6** đơn vị thanh toán (VNPay sandbox).

- **S1 Khách hàng:** FR-01 đến FR-16, FR-20 đến FR-22, FR-25 (Must); NFR-01, NFR-02, NFR-03, NFR-04, NFR-05, NFR-06, NFR-09, NFR-10, NFR-11, NFR-12.
- **S2 Nhân viên quầy:** FR-09 (đăng nhập), FR-22 (xem đơn), FR-23, FR-24, FR-29; NFR-05.
- **S3 Quản lý cửa hàng:** FR-01, FR-07, FR-11 đến FR-14, FR-16, FR-23, FR-25, FR-29 (Must); NFR-04, NFR-05, NFR-07, NFR-08, NFR-13, NFR-18, NFR-19.
- **S4 Giảng viên nghiệm thu:** FR-02, FR-10, FR-20; toàn bộ NFR bảo mật, khả dụng, triển khai (NFR-04 đến NFR-12, NFR-14 đến NFR-20) vì liên quan trực tiếp tới đề A2 §6, §7, §8.
- **S5 Nhóm phát triển:** FR-11, FR-12, FR-23; NFR-06, NFR-07, NFR-13 đến NFR-18, NFR-20.
- **S6 Đơn vị thanh toán (VNPay sandbox):** FR-14, FR-15, FR-16; NFR-03 (Could).

---

## 8. Quyết định phạm vi và đầu vào cho task sau

Baseline này chốt Task 1 trước Task 2 theo đề A2 §1. Không đợi code hoặc sơ đồ Task 2 để merge Task 1; các ô truy vết của Task 2–5 được ghi là chờ đúng task.

1. **Tồn kho:** đơn mới giữ nguyên liệu khi tạo đơn, tiêu thụ snapshot khi thanh toán thành công, giải phóng khi chủ đơn hủy chưa trả. FR-25 và FR-29 là Must của BREW-INVENTORY-01. Đơn bỏ dở giữ reserved vô thời hạn; không tự hủy/expiry. Đơn cũ marker false giữ vòng đời Product.stock cũ; xem ADR-006 và runbook cutover.
2. **Phạm vi:** FR-23/24 Must, FR-25/29 Must; FR-17/18/19/26/27 ngoài bản nộp. Giữ `Promotion`/`LoyaltyTransaction` trong mô hình domain Task 2, không yêu cầu seed hoặc luồng runtime tương ứng.
3. **Dữ liệu và giới hạn:** dùng bộ giá size/topping, giới hạn 20 dòng/99 ly, JWT 1 giờ ở mục 3 làm baseline kiểm thử.
4. **Thanh toán:** theo quy ước VNPay sandbox mục 3.4 (ADR-007): `POST /payments` chỉ tạo `Payment PENDING` và URL; chỉ IPN hoặc QueryDR đã xác thực quyết định kết quả (BR-11); chống thu trùng bằng `Idempotency-Key`, trạng thái đơn và tối đa một `Payment PENDING` mỗi đơn (BR-05, BR-10, FR-16). VNPay sandbox là hệ thống ngoài, vẽ là participant "VNPay sandbox" trong sequence.
5. **API và lỗi:** dùng tên endpoint, schema lỗi và mã HTTP mục 3.1–3.2 làm baseline; thay đổi sau này phải đồng bộ tài liệu và test trong cùng PR.
6. **Tạo đơn:** không thêm idempotency cho `POST /orders` trong minimum. UI khóa nút khi đang gửi; nếu mất phản hồi tạo đơn thì không tự gửi lại, yêu cầu kiểm tra lịch sử trước khi quyết định tạo đơn mới. Khi đã biết `orderId`, E1/A3/E4 phải tiếp tục đơn cũ. Rủi ro bấm đúp từ nhiều tab còn được chấp nhận.
7. **Nhân viên:** dùng Postman với `GET /orders/:id`, `PATCH /orders/:id`; mã đơn lấy từ biên lai demo. Không cam kết Swagger UI hoặc màn hàng đợi.
8. **Task 2:** dùng baseline này để vẽ activity, sequence, class; phải thể hiện hai nhánh E1 trước/sau tạo đơn, 8 chuyển trạng thái hợp lệ (gồm hai chuyển `→ CANCELLED` dù API hủy FR-25 là Must); không cần mô tả FR-26.
9. **Rút gọn bản nộp:** lý do và danh sách thay đổi ở mục 1.4 (ghi chú rút gọn). Mọi mục bắt buộc của đề A2 §3–§7 vẫn có ít nhất một yêu cầu Must phủ: hiệu năng API đọc đo ở local (NFR-01), menu, chi tiết và size/topping, giỏ hàng và tổng tiền, đăng ký/đăng nhập/JWT, tạo đơn, thanh toán Ví/Thẻ, ba nhánh lỗi, idempotency, transaction đơn và tồn kho, xác nhận/lịch sử/trạng thái đơn, validate hai phía, loading/empty/error, mobile-first/PWA, docker-compose, health, migration/seed, CI, CD và rollback, HTTPS và DB không public, secret.

---

## 9. Thuật ngữ

| Thuật ngữ | Nghĩa trong tài liệu này |
|---|---|
| MVP | Phiên bản nhỏ nhất chạy được với tính năng cốt lõi (đề A2 §6.3) |
| MoSCoW | Must / Should / Could / Won't: thang ưu tiên yêu cầu |
| FR / NFR | Functional / Non-functional Requirement: yêu cầu chức năng / phi chức năng |
| Tiêu chí chấp nhận (AC) | Điều kiện đo được để kết luận yêu cầu đã đạt |
| JWT | JSON Web Token: chuỗi ký số chứng minh người dùng đã đăng nhập |
| Idempotency-Key | Mã do client gửi kèm yêu cầu thanh toán để server nhận ra yêu cầu lặp và không xử lý lần hai |
| Idempotent | Gửi nhiều lần cho cùng kết quả như gửi một lần |
| Transaction | Nhóm thao tác CSDL hoặc xong cả, hoặc hoàn tác cả |
| Giữ chỗ tồn kho | Trừ số lượng tồn ngay khi tạo đơn để không bán cho người khác |
| VNPay sandbox | Cổng thanh toán bên thứ ba ở môi trường thử nghiệm của VNPay; hệ thống ngoài, không thu tiền thật |
| IPN | Instant Payment Notification: VNPay gọi thẳng server-to-server vào `GET /payments/vnpay/ipn` để báo kết quả; nguồn kết quả chính |
| QueryDR | API tra cứu giao dịch của VNPay; API BrewLite tự hỏi (`POST /payments/:id/sync`) khi thiếu IPN |
| Return URL | Địa chỉ web mà VNPay chuyển trình duyệt khách về sau khi trả; chỉ hiển thị, không quyết định kết quả |
| `vnp_TxnRef` | Mã tham chiếu giao dịch gửi cho VNPay, bằng `Payment.id`; mỗi lần thử một mã mới |
| PWA | Progressive Web App: web cài được như ứng dụng |
| Seed | Dữ liệu mẫu nạp vào CSDL bằng script |
| Smoke test | Kiểm tra nhanh sau triển khai rằng các điểm chính còn sống |
| p95 | Phân vị 95: 95% yêu cầu nhanh hơn hoặc bằng giá trị này |
| Guest / Customer / Barista | Khách chưa đăng nhập / khách đã đăng nhập / nhân viên quầy |

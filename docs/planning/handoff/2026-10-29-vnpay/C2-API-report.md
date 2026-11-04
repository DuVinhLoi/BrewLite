# Report C2-API — VNPAY-C2-API

**Task card:** `VNPAY-C2-API` (task `task_bc17353223f8`, dispatch `ctx_9664527b2aed`) · **Kế hoạch:** [vnpay-payment-plan](../../2026-10-29-vnpay-payment-plan.md), bước 5.4, 5.5, phần nối khởi động của 5.6, 5.7 và 5.8 · **Hợp đồng:** [contract.md](contract.md) · **Trạng thái:** `DONE_WITH_CONCERNS` (concern: mục 6 và 7, không chặn merge)

## 1. Commit và file

- Branch của worktree: `ThuanTran260/chore-multi-agent-workflow-2`. Nền: `a1116d4` (= `a2/payment-vnpay`).
- Commit code: `832ed98e7dad3a7b5401f0afa0d6207a9c150888` — `feat(payment): settle VNPay results through IPN and QueryDR`.
- Commit report: file này, message `docs(payment): add VNPay C2-API worker report` (report không tự chứa hash của chính nó; lấy bằng `git log -1`).
- Commit code được amend một lần trước khi báo xong: lệnh `git add` đầu tiên dừng giữa chừng (pathspec của file đã xóa), nên commit đầu chỉ có phần xóa `payment.ts`; file còn lại được thêm vào chính commit đó. Chưa push.

| File | Nội dung chính |
|---|---|
| `apps/api/src/checkout/checkout.service.ts` | Viết lại `pay()`, thêm `tryPay`, `sync`, `resolveExpired`, `settleByQuery`, `applyGatewayResult`, `ipn`, `checkReturn`; sửa nhánh hủy của `transition()`; `detail()` trả thêm 4 trường payment |
| `apps/api/src/checkout/checkout.controller.ts` | `POST /payments/:id/sync` (`@HttpCode(200)`, có guard); lấy IP khách từ `x-forwarded-for`; bỏ `cardNumber` (nằm ở service) |
| `apps/api/src/checkout/checkout.module.ts` | Đăng ký `VnpayController` và provider `VnpayGateway`; constructor kiểm provider và in cảnh báo thiếu biến |
| `apps/api/src/payment/vnpay.controller.ts` (mới, 12 dòng) | `GET /payments/vnpay/ipn` và `GET /payments/vnpay/return`, không guard, chỉ gọi service |
| `apps/api/src/checkout/payment.ts` | Xóa (simulator) |
| `.env.example`, `apps/api/.env.example` | Thêm `VNP_TMN_CODE=`, `VNP_HASH_SECRET=` (rỗng), `WEB_URL=http://localhost:3000`; `VNP_URL`, `VNP_API_URL` là dòng comment ghi "Optional" |
| `docker-compose.yml`, `compose.demo.yml` | Truyền 5 biến VNPay vào `environment` runtime với mặc định rỗng; không `build.args`, không `:?` bắt buộc |
| `README.md`, `apps/api/README.md`, `docs/inventory-runbook.md`, `.github/workflows/README.md`, `docs/inventory-verification.md` | Chỉ các câu plan 5.7 liệt kê (mục 5) |
| `docs/planning/handoff/2026-10-29-vnpay/C2-API-report.md` (mới) | File này |

Không sửa: `vnpay.ts`, `payment-gateway.ts`, `vnpay-config.ts`, `test/vnpay.test.ts`, schema, migration, `main.ts`, `apps/web/`, `package*.json`, `.github/workflows/*.yml`. Không tạo `apps/api/.env`. Không chạy docker, dev server, `prisma migrate` hay lệnh cần Postgres.

## 2. Lệnh acceptance và kết quả thật

Chạy trong `apps/api` trên commit code `832ed98`. `prisma generate` dùng `DATABASE_URL` giả chỉ cho lệnh đó (không có `.env`, lệnh không kết nối DB).

| Lệnh | Kết quả |
|---|---|
| `npx prisma generate` | `Generated Prisma Client (v6.19.3)`, exit 0 |
| `npm run lint` | exit 0, 0 lỗi, không cảnh báo |
| `npm run build` | exit 0 (`nest build`) |
| `node --import tsx --test test/vnpay.test.ts` | `tests 69, suites 11, pass 69, fail 0, cancelled 0, skipped 0` |
| `grep -rn "simulatePayment\|PAYMENT_DECLINED\|cardNumber" src` | rỗng (exit 1) |
| `grep -rn "console.log\|SecureHash" src/checkout src/payment` | Không có `console.log`; không có dòng nào ở `src/checkout`. 5 dòng còn lại đều ở `src/payment/vnpay.ts` (file của C1, giải thích ở dưới) |
| `git diff --check a2/payment-vnpay...HEAD` | exit 0 (chỉ cảnh báo `LF will be replaced by CRLF` của `autocrlf` trên Windows) |
| `git diff --name-only a2/payment-vnpay...HEAD` (sau commit code) | 14 file: 13 file ở bảng mục 1 (trừ report) + `payment.ts` bị xóa; tất cả nằm trong allowed paths |
| Quét dòng thêm (257 dòng) tìm private key, `VNP_*=` có giá trị, chuỗi 16 chữ số, `vnp_SecureHash=` + hex, chuỗi hex ≥64 ký tự, token | không khớp. Biến VNPay trong `.env.example` để trống |
| `git status --porcelain` sau commit code | sạch |

**Năm dòng `SecureHash` ở `vnpay.ts`** (không phải log, không đổi trong card này):

- `vnpay.ts:39`: lọc `vnp_SecureHash`, `vnp_SecureHashType` khỏi chuỗi cần ký.
- `vnpay.ts:59`: nối `vnp_SecureHash` vào cuối URL thanh toán trả về (không log).
- `vnpay.ts:64`, `vnpay.ts:98`: đọc chữ ký VNPay gửi tới để so sánh.
- `vnpay.ts:85`: đặt chữ ký vào body QueryDR gửi đi.

**Mọi dòng log của code mới** (`grep -n "logger\.\|new Logger"`), đều chỉ có mã sự kiện và các trường được phép của plan 5.8:

- `checkout.module.ts:17`: một dòng `VNPay configuration incomplete: missing <tên biến>`.
- `checkout.service.ts:171`: `VNPAY_QUERYDR_FAILED vnp_TxnRef reason` (`reason` là mã lỗi nội bộ như `TIMEOUT`, không phải payload).
- `checkout.service.ts:244`: `VNPAY_IPN_UNEXPECTED_ERROR` kèm `vnp_TxnRef`, `vnp_ResponseCode`, `vnp_TransactionStatus`.
- `checkout.service.ts:258`: `VNPAY_IPN RspCode=…` (kèm ba trường trên khi chữ ký đã đúng).
- `checkout.service.ts:263`: `PAYMENT_RECONCILIATION_REQUIRED vnp_TxnRef vnp_ResponseCode vnp_TransactionStatus`.

IPN sai chữ ký (`97`) và thiếu cấu hình (`99`) không log `vnp_TxnRef` hay bất cứ giá trị nào từ query, vì chưa xác thực (tránh giả mạo dòng log). Không có dòng nào log query IPN, payment URL, payload QueryDR, secret hay chữ ký.

## 3. Kiểm chứng thêm bằng harness giả lập (ngoài repo)

Card không yêu cầu TDD và cấm chạy Postgres, nên service không có test tự động. Để không nộp code chưa chạy lần nào, tôi viết một harness trong scratchpad của worker (**không commit**): nó dựng `CheckoutService` với Prisma giả lưu trong bộ nhớ, `VnpayGateway` thật cho `createUrl`, `query` giả theo kịch bản, và chữ ký IPN tính lại độc lập bằng `crypto` với secret giả. Kết quả chạy trên commit `832ed98`: **14 kịch bản đạt, 0 lỗi**.

Phủ: tạo `PENDING` và replay, kiểm đầu vào/quyền trước mọi thao tác, thiếu cấu hình (502, không tạo `Payment`, đơn giữ `PAYMENT_FAILED`, replay vẫn 200), IPN `97/99/01/04/00/02`, IPN thất bại `24/02` rồi thử lại, IPN thành công tới sau `FAILED` (warning), nhóm `99` cho mã chưa kết luận, bảng QueryDR (`00/00`, `00/01`, `00/02`, `91` trước/sau hạn, `94`, `99`, chữ ký sai, timeout, `00/05`), hủy đơn có/không `PENDING`, `sync` (quyền, đã có trạng thái cuối, `PENDING`), hai chiều race IPN với `sync`, endpoint return, và khởi động.

Khởi động còn được chạy thật bằng `NestFactory.create(AppModule)` (không `listen`, không `init` nên không chạm DB), 4 trường hợp:

- Không có biến VNPay: đúng **một** dòng `WARN [VnpayConfig] VNPay configuration incomplete: missing VNP_TMN_CODE, VNP_HASH_SECRET, WEB_URL`, app tạo xong.
- `PAYMENT_PROVIDER=fake`: dừng với `Error: PAYMENT_PROVIDER=fake is not supported…`, exit 1.
- `PAYMENT_PROVIDER=stripe`: dừng với `Error: PAYMENT_PROVIDER is not supported (use vnpay)`, exit 1.
- Đủ ba biến: không có dòng cảnh báo.

**Giới hạn:** harness không chứng minh câu lệnh Prisma chạy đúng trên PostgreSQL (`include`/`select`, `FOR UPDATE`, partial index, race thật giữa hai kết nối). `tsc` chỉ kiểm kiểu. Các ca đó vẫn thuộc bước 7.7*.

## 4. Chỗ làm theo "(chờ spike)"

Cả ba điểm vẫn nằm ở **một file**, `vnpay.ts` của C1 (`grep -n "pending spike" apps/api/src/payment/vnpay.ts`: dòng 123, 128, 140). Service chỉ gọi hai hàm ánh xạ, không nhân bản bảng 1.6:

- QueryDR (`00/01` sau hạn, `91` sau hạn): `checkout.service.ts:177`, `queryDrAction(answer.responseCode, answer.transactionStatus, isExpired(payment, queriedAt))`.
- IPN (thất bại khi `vnp_TransactionStatus = 02`): `checkout.service.ts:229`, `ipnAction(responseCode, transactionStatus)`.

Hệ quả cho Integrator: sau spike chỉ sửa `vnpay.ts` (và test của nó). Nếu spike chốt "`01` sau hạn cộng khoảng chờ → `FAILED EXPIRED`", `queryDrAction` đã nhận tham số `expired`; cần thêm khoảng chờ vào chữ ký hàm, và `settleByQuery` truyền thêm thời điểm (hiện truyền `isExpired(payment, queriedAt)`).

`expired` của QueryDR được tính theo thời điểm **trước khi gọi VNPay** (`queriedAt`), không phải lúc ghi DB: nghiêng về phía an toàn cho `91`.

## 5. Bảng đối chiếu để kiểm tay ở bước 7

Số dòng theo `checkout.service.ts` ở commit `832ed98`. "Harness" là kịch bản trong mục 3.

### 5.1 `POST /payments` (plan 1.5, bước 1–7)

| Bước | Hàm / dòng | Hành vi | Kiểm tay |
|---|---|---|---|
| 1. Input, xác thực, quyền, trước mọi QueryDR/ghi | `pay` :96–106 (`customer`, key, `record(['orderId','paymentMethod'])`, `owned(this.prisma…)`) | 400/401/403/404 như cũ; `cardNumber` bị `record` từ chối 400 `VALIDATION_ERROR` | 7.1; thử body có `cardNumber` |
| 2. Replay `SUCCESS` (BR-05) | `tryPay` :124–127 | 200 `{ paymentId, orderId, orderStatus:'PAID', amount, status:'SUCCESS' }`, đặt **trước** kiểm trạng thái đơn | 7.7e; gửi lại cùng key sau khi `PAID` |
| 3. Đơn không `PENDING`/`PAYMENT_FAILED` | `tryPay` :129–130 | 409 `ORDER_NOT_PAYABLE` | key mới sau khi `PAID` |
| 4. `PENDING` quá hạn → QueryDR ngoài transaction, rồi xét lại từ replay | `tryPay` :133–134 trả `null` → `pay` :107–112 gọi `resolveExpired` rồi `tryPay` lần hai; vẫn `null` → `pay` :113 trả 409 `PAYMENT_IN_PROGRESS` | HTTP không nằm trong transaction giữ khóa | 7.7b, 7.7d, 7.7e |
| 5. `PENDING` còn hạn | `tryPay` :132–137 | cùng phương thức → 200 trả nguyên `paymentUrl`/`expiresAt` (kể cả key mới); khác phương thức → 409 `PAYMENT_IN_PROGRESS` | 7.7 (hai yêu cầu đồng thời) |
| 6. Chỉ tạo URL mới mới kiểm cấu hình | `tryPay` :141–142 (`gateway.createUrl`, `!url.ok` → `providerError()`) | 502 `PAYMENT_PROVIDER_ERROR`; ném lỗi trong transaction nên hàng `Payment` vừa tạo bị rollback, đơn không đổi. Hai nhánh replay ở bước 2 và 5 nằm trước dòng này nên không đòi cấu hình | 7.7a, 7.7g |
| 7. Tạo `Payment PENDING`, `PAYMENT_FAILED → PENDING`, không `reserve` lại | `tryPay` :140–145 | 201 `{ paymentId, orderId, orderStatus:'PENDING', amount, status:'PENDING', paymentUrl, expiresAt }` (ISO 8601); `pay` không gọi `settle` | 7.7c |
| Không còn 402; IP khách | `checkout.controller.ts:9–12, 22` | `x-forwarded-for` phần tử đầu, không có thì `127.0.0.1` | — |

### 5.2 IPN (plan 1.3)

| Bước | Hàm / dòng | Mã trả về |
|---|---|---|
| 0. Thiếu `VNP_TMN_CODE`/`VNP_HASH_SECRET` | `ipn` :213–214 | `99`, không đọc/ghi DB (harness xác nhận 0 lần đọc) |
| 1. Chữ ký sai hoặc `vnp_TmnCode` khác | `ipn` :215–216 (`verifyReturn` của C1) | `97`, không đọc DB |
| 2. Không có `Payment` theo `vnp_TxnRef` | `ipn` :222–224 | `01` |
| 3. `vnp_Amount` khác `amount × 100` | `ipn` :225 | `04` |
| 4. Khóa đơn, đọc lại; payment/đơn không còn `PENDING` → `02` | `ipn` :226–228 (khóa) + `applyGatewayResult` :195–200 (trả `false`) hoặc nhánh `UNRESOLVED` :230–234 | `02`, không đổi đơn/kho |
| 4. Tiền tới sau trạng thái cuối → warning | `applyGatewayResult` :197–198 (`SUCCESS` mà `payment.status !== 'SUCCESS'`) | `02` + `PAYMENT_RECONCILIATION_REQUIRED vnp_TxnRef=…`. Lặp của chính `SUCCESS` không warning |
| 4. IPN tới sau `expiresAt` nhưng còn `PENDING` | `applyGatewayResult` không kiểm `expiresAt` | vẫn nhận (`00`) |
| 5. `00` và `00` → `SUCCESS`, `PAID`, `settle` nếu `inventoryTracked` | `ipnAction` (C1) → `applyGatewayResult` :201–206 | `00`; lưu hai mã, `vnp_TransactionNo`, `vnp_BankCode`, `vnp_PayDate` (GMT+7) |
| 6. `02` và response khác `00`/`07` → `FAILED`, `PAYMENT_FAILED`, giữ kho | `ipnAction` (C1) → `applyGatewayResult` :201–206 | `00` |
| 7. Mã chưa kết luận → không đổi DB | `ipn` :230–234 | `99` (nếu còn mở) hoặc `02` (nếu đã chốt); warning khi `reconcile` |
| 7. Lỗi bất ngờ | `ipn` :243–246 | `99` + dòng `VNPAY_IPN_UNEXPECTED_ERROR` |
| Return (không ghi DB) | `checkReturn` :249–255 | `{ valid:true, paymentId, orderId, responseCode }` hoặc `{ valid:false }` |

### 5.3 QueryDR (plan 1.6) — dùng chung cho `pay`, hủy đơn và `sync`

| Bước | Hàm / dòng | Hành vi |
|---|---|---|
| 1. Sau kiểm quyền, lấy `paymentId`, `gatewayCreateDate`, amount; gọi ngoài transaction | `settleByQuery` :166–170 → `gateway.query` (C1) | Thiếu `gatewayCreateDate` hoặc cấu hình → `{ ok:false }` → 502 |
| 2. Chữ ký, merchant, TxnRef, số tiền/`vnp_TransactionType` của `00` | `verifyQueryDrResponse` (C1), gọi trong `gateway.query` | Sai → `{ ok:false }` → 502 |
| 3. Mở transaction, khóa đơn, đọc lại **đúng payment đã hỏi** | `settleByQuery` :172–175 | Nếu IPN đã chốt trong lúc chờ: không ghi đè, không trả lỗi cũ (`verdict = 'DONE'`) |
| 4. Bảng 1.6 | `queryDrAction` (C1) gọi ở :177 | `SUCCESS`/`FAILED`/`EXPIRED` → `applyGatewayResult` :183–187; `IN_PROGRESS` → 409 :189; `PROVIDER_ERROR` → 502 :190 (+ warning khi `reconcile`, :179) |
| 4. `00/02` lưu `00`/`02`, không `EXPIRED`; `91` sau hạn lưu `gatewayResponseCode='EXPIRED'` | :183–184 | Dòng `EXPIRED` ghi `transactionStatus = null` |
| 5. `pay`: xét replay trước | `pay` :107–112 | Xem bảng 5.1 bước 4 |
| 5. Hủy: chỉ tiếp tục khi không còn payment chưa kết luận | `transition` :71–75 (ownership + `resolveExpired`) và :84 (`count PENDING` → 409) | Không nhả kho nếu còn `PENDING`; đơn cũ `inventoryTracked=false` giữ nhánh `Product.stock` :85–90 |
| 5. `sync` | `sync` :149–157 | 404 `PAYMENT_NOT_FOUND`, 403 sai chủ/role; đã `SUCCESS`/`FAILED` → 200 từ DB, không QueryDR, không đòi cấu hình; `PENDING` → `settleByQuery` |
| `detail()` | :62–66 | Thêm `paymentUrl`, `expiresAt`, `gatewayResponseCode`, `gatewayTransactionStatus` |

## 6. Change request

Không có CR chặn việc. Ba CR nhỏ về tài liệu (nằm ở file thuộc allowed paths nhưng **ngoài các câu plan 5.7 liệt kê**, nên tôi không tự sửa):

- **CR-1: `README.md:117`.** Cũ: "Theo yêu cầu chủ dự án, toàn bộ test tự động, cấu hình, script và dependency phục vụ test đã được xóa sau khi chạy kiểm chứng." Mới: thêm "Chỉ còn unit test VNPay tối thiểu `apps/api/test/vnpay.test.ts` (D3)." Lý do: câu này đã sai từ khi C1 thêm test.
- **CR-2: `apps/api/README.md:39`.** Cũ: "Theo yêu cầu chủ dự án, toàn bộ test đã được xóa sau khi chạy kiểm chứng". Mới: thêm "; chỉ còn unit test VNPay tối thiểu `test/vnpay.test.ts`, chạy bằng `node --import tsx --test test/vnpay.test.ts`".
- **CR-3: danh sách endpoint.** `README.md` (bảng API) và `apps/api/README.md` (mục "API hiện có") chưa liệt kê `GET /payments/vnpay/ipn`, `GET /payments/vnpay/return`, `POST /payments/:id/sync`. Tôi chỉ nhắc `sync` và IPN trong ô của `POST /payments`. Đề xuất thêm ba dòng theo SRS §3.1 nếu Integrator đồng ý.

Đã đọc và **giữ nguyên** vì vẫn đúng nghĩa đen: `docs/inventory-verification.md:92, 111, 112` ("bộ test đã xóa", "loại bước test đã xóa") là kết quả lịch sử của đợt cleanup, bộ test cũ vẫn đã xóa. Tôi chỉ thêm một câu vào đoạn "Xóa test theo yêu cầu chủ dự án" (dòng 78).

## 7. Rủi ro và giả định cần nhóm/Integrator xác nhận

- **Chưa chạy trên PostgreSQL thật** (card cấm). Cần bước 7.7*: partial index `payments_one_pending_per_order`, khóa `FOR UPDATE`, hai yêu cầu `POST /payments` đồng thời, IPN + `sync` đồng thời. Hai migration của C1 cũng chưa áp lên DB.
- **Ca `00/01` sau hạn chưa có lối thoát** (đúng bảng 1.6 hiện tại, "chờ spike"). Payment mà khách mở trang VNPay rồi bỏ dở có thể ở `PENDING` mãi: `POST /payments` và hủy đơn đều trả 409 `PAYMENT_IN_PROGRESS`; đơn vừa không trả tiếp được vừa không hủy được cho tới khi spike chốt lối thoát (plan 1.6, bước 1).
- **Tạo `Payment` trước khi ký URL:** `vnp_TxnRef = Payment.id` (cuid do Prisma sinh) nên hàng được `create` rồi mới `createUrl`; thiếu cấu hình thì ném lỗi và transaction rollback. Kết quả đúng (không còn `Payment`), nhưng có một lần ghi bị hủy. Cách thay là sinh id ở tầng ứng dụng, tôi không chọn vì plan ghi id là cuid.
- **`settle` thất bại khi IPN thành công** (`INVENTORY_INCONSISTENT`/`INVENTORY_SNAPSHOT_MISSING`): transaction rollback, IPN trả `99`, có dòng `VNPAY_IPN_UNEXPECTED_ERROR` kèm `vnp_TxnRef`, đúng "Rủi ro" thứ hai trong plan. Không thêm warning `PAYMENT_RECONCILIATION_REQUIRED` riêng cho ca này.
- **`GET /orders/:id` trả `paymentUrl`** (URL đã ký) cho cả chủ đơn lẫn Barista, vì `owned()` cho phép Barista và plan 1.5 giữ nguyên quyền hiện có. URL chỉ dẫn tới thanh toán đúng đơn đó, nhưng nhóm nên biết Barista nhìn thấy nó.
- **`GET /payments/vnpay/return`** chỉ trả `{ valid:false }` cho chữ ký/merchant/payment sai hoặc thiếu cấu hình; lỗi DB bất ngờ vẫn ra 500 qua `ApiExceptionFilter` (plan không quy định).
- **IPN `UNRESOLVED` trên payment đã chốt** trả `02` (theo thứ tự bước 4 trước bước 7 của plan); trên payment còn mở trả `99`.
- **Compose:** `WEB_URL` mặc định `http://localhost:3000`, không theo `WEB_PORT`/`DEMO_PORT`; ai đổi cổng web phải đặt `WEB_URL` (đã ghi trong `.env.example`). Chưa chạy `docker compose config` vì card cấm docker.
- **`x-forwarded-for`** được tin nguyên văn như plan 1.1; client có thể giả, nhưng giá trị chỉ vào `vnp_IpAddr` của URL thanh toán.
- **Cảnh báo khởi động** in từ constructor của `CheckoutModule`, trước dòng "started" của Nest và mỗi lần khởi động đúng một dòng; `main.ts` không đổi (ngoài allowed paths).

## 8. Giải thích cho nhóm

Đọc theo thứ tự này (các file của C1 ở `src/payment/` đã có hướng dẫn trong [C1-API-report](C1-API-report.md)):

1. **`checkout.service.ts`, `applyGatewayResult` (dòng 194):** đây là chỗ duy nhất đổi trạng thái thanh toán. IPN và QueryDR đều chuẩn hóa kết quả thành `GatewayResult` (`SUCCESS` hoặc `FAILED`) rồi gọi hàm này trong transaction đã khóa đơn. Hàm đọc lại payment: nếu đã `SUCCESS`/`FAILED` hoặc đơn không còn `PENDING` thì không ghi đè (trả `false`), và nếu đó là tiền về muộn thì ghi warning. Nếu không, nó cập nhật payment, trừ kho (chỉ khi `inventoryTracked`) và đổi đơn.
2. **`pay()` + `tryPay()` (dòng 96 và 117):** `pay` kiểm đầu vào và quyền sở hữu rồi gọi `tryPay` (một lượt bước 2–7 dưới khóa đơn). `tryPay` trả `null` khi gặp payment quá hạn; khi đó `pay` hỏi VNPay ngoài transaction (`resolveExpired`) rồi chạy `tryPay` lần hai. Đây là cách giữ quy tắc "HTTP ra VNPay không nằm trong transaction giữ khóa".
3. **`settleByQuery` (dòng 166) và `sync`/`resolveExpired`:** gọi VNPay trước, rồi mới mở transaction, khóa đơn, đọc lại payment và áp kết quả. Đọc lại là để một IPN đến trong lúc chờ không bị kết quả QueryDR cũ ghi đè. Ba nơi dùng chung hàm này: `pay`, hủy đơn trong `transition`, và `sync`.
4. **`ipn()` (dòng 209):** theo đúng các bước 0–7 của mục 1.3, có chú thích số bước ngay trong code. Mọi lỗi bất ngờ rơi vào `catch` và trả `99` để VNPay gọi lại.
5. **`vnpay.controller.ts`:** chỉ định tuyến và không có `AuthGuard`, vì VNPay gọi IPN trực tiếp; bảo vệ bằng chữ ký chứ không bằng JWT. `POST /payments/:id/sync` nằm ở `CheckoutController` (có guard).
6. **`checkout.module.ts`:** constructor là chỗ kiểm provider và in một dòng tên biến thiếu lúc khởi động.

Câu hỏi dễ gặp khi vấn đáp: vì sao IPN thiếu secret trả `99` chứ không phải `97` (chữ ký chưa kiểm được, `99` để VNPay gọi lại); vì sao phải đọc lại payment sau khi gọi QueryDR (chống ghi đè trạng thái cuối); vì sao `Payment` được tạo trước khi ký URL (id chính là `vnp_TxnRef`) mà vẫn không để lại hàng thừa khi lỗi (transaction rollback); vì sao hủy đơn cũng phải đối soát payment quá hạn (khách có thể đã trả sát giờ).

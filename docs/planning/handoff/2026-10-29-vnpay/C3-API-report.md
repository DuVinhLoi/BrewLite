# Report C3-API — VNPAY-C3-API

**Task card:** `VNPAY-C3-API` (task `task_4f5458241f57`, dispatch `ctx_f7216149d557`) · **Quyết định:** D6, người dùng chốt và yêu cầu làm code ngày 2026-10-30 · **Hợp đồng:** [contract.md](contract.md) mục 6 và 8 · **Spike:** [payment-vnpay-spike.md](../../../payment-vnpay-spike.md) mục 3–4 · **Plan:** [vnpay-payment-plan](../../2026-10-29-vnpay-payment-plan.md) mục 1.6, 1.7 · **Trạng thái:** `DONE_WITH_CONCERNS` (concern: mục 6, không chặn merge)

## 1. Commit và file

- Branch của worktree: `ThuanTran260/task-vnpay-c3-api`. Branch này do Orca đổi tên từ `ThuanTran260/tripodfish` trong lúc làm việc (reflog: `Branch: renamed ... to ...`), không phải thao tác của worker; commit nằm trên branch mới. Nền: `a5164b3` (= đầu `a2/payment-vnpay`).
- Commit code: `b1c46aef225f6f0c2affe4c9f3ed906790ac6b40` — `feat(payment): close expired VNPay payments after a 15-minute grace`.
- Commit report: file này, message `docs(payment): add VNPay C3-API worker report` (report không tự chứa hash của chính nó; lấy bằng `git log -1`). Chưa push.

| File | Nội dung chính |
|---|---|
| `apps/api/src/payment/vnpay.ts` | Thêm `EXPIRY_GRACE_MS`, `isPastGrace`, `unansweredQueryAction`, kiểu `QueryFailureReason`; `queryDrAction` nhận thêm `pastGrace`; `QueryDrFailure` thêm `'UNSIGNED'`; `verifyQueryDrResponse` trả `UNSIGNED` kèm `responseCode`; gỡ 3 comment "pending spike" |
| `apps/api/src/payment/payment-gateway.ts` | `QueryResult` nhánh lỗi dùng `QueryFailureReason` và có `responseCode?` tùy chọn; `query()` trả thẳng kết quả lỗi của `verifyQueryDrResponse` |
| `apps/api/src/checkout/checkout.service.ts` | Chỉ `settleByQuery`, hằng `EXPIRED_RESULT`, hàm phụ `expiredUnconfirmed`, dòng import |
| `apps/api/test/vnpay.test.ts` | 15 test mới (69 → 84), sửa test `queryDrAction` cũ cho chữ ký 4 tham số |
| `apps/web/src/lib/shop.ts` | `vnpayMessage`: `15` và `EXPIRED` cùng thông báo với `11` |
| `docs/planning/handoff/2026-10-29-vnpay/C3-API-report.md` (mới) | File này |

Không sửa: `resolveExpired`, `pay`, `tryPay`, `transition`, `sync`, `applyGatewayResult`, `ipn`, `reconciliationRequired`, schema, migration, `package*.json`, tài liệu. Không tạo `apps/api/.env`. Không chạy docker, dev server, `prisma migrate` hay lệnh cần Postgres.

## 2. Lệnh acceptance và kết quả thật

Chạy trên commit code `b1c46ae`. `node_modules` là junction do Integrator nối (đã xin qua `ask`), không chạy `npm install`.

| Lệnh | Kết quả |
|---|---|
| `apps/api`: `npx prisma generate` | chạy xong, exit 0 |
| `apps/api`: `npm run lint` | exit 0, 0 lỗi, không cảnh báo |
| `apps/api`: `npm run build` | exit 0 (`nest build`) |
| `apps/api`: `node --import tsx --test test/vnpay.test.ts` | `tests 84, suites 13, pass 84, fail 0` |
| `apps/web`: `npm run lint` | exit 0, 0 lỗi |
| `apps/web`: `npm run typecheck` | exit 0 (`tsc --noEmit`) |
| `grep -rn "pending spike\|chờ spike" apps/api/src apps/web/src` | rỗng (exit 1) |
| `grep -n "logger\.\(log\|warn\|error\)" apps/api/src/checkout/checkout.service.ts` | 6 dòng (178, 188, 260, 274, 279, 284). Mỗi dòng chỉ có mã sự kiện, `vnp_TxnRef`, `vnp_ResponseCode`, `vnp_TransactionStatus`, `RspCode`, `reason`. Dòng 260, 274 dùng `details` dựng từ ba trường `vnp_*` đã xác thực; dòng 284 dùng `detail` của `expiredUnconfirmed`. Không URL, không payload, không chữ ký |
| `git diff --check a2/payment-vnpay...HEAD` | exit 0 |
| `git diff --name-only a2/payment-vnpay...HEAD` (sau commit code) | 5 file, đều trong allowed paths: `checkout.service.ts`, `payment-gateway.ts`, `vnpay.ts`, `vnpay.test.ts`, `shop.ts` |
| Quét dòng thêm tìm `secret`, `SecureHash=`, `http(s)://`, `tmncode=`, `password`, chuỗi hex ≥64 ký tự | không khớp |

`apps/api/test/` chỉ có `vnpay.test.ts`, và `apps/api/package.json` không có script `test`, nên không còn suite nào khác để chạy. `settleByQuery` cần Postgres (khóa đơn, transaction) nên **không có test tự động**; phần logic quyết định đã tách ra hàm thuần có test (mục 5).

## 3. Test đỏ trước khi xanh (TDD, D3)

Viết test trước, chạy khi `vnpay.ts` chưa có code mới. Lệnh: `node --import tsx --test test/vnpay.test.ts` (exit 1):

```
ℹ tests 84
ℹ suites 13
ℹ pass 69
ℹ fail 15
```

15 test đỏ, đúng ca mới (69 test còn lại là ca cũ vẫn đạt vì tham số thứ 4 bị bỏ qua):

```
▶ verifyQueryDrResponse
  ✖ reports UNSIGNED, with the 2-digit response code, for an object without vnp_SecureHash
  ✖ never trusts an unsigned response, even one that claims 00/00
  ✖ gives responseCode null for UNSIGNED when vnp_ResponseCode is not exactly 2 digits
▶ queryDrAction (plan 1.6 table, D6 grace)
  ✖ 00/01 -> EXPIRED once the grace has ended (D6)
  ✖ 00 with a missing or unsupported status -> EXPIRED once the grace has ended
  ✖ a verified 99 -> EXPIRED once the grace has ended
▶ unansweredQueryAction (D6)
  ✖ MISMATCH is a provider error with reconciliation, before and after the grace
  ✖ any other reason is a provider error without reconciliation before the grace ends
  ✖ any other reason -> EXPIRED once the grace has ended
▶ isPastGrace (D6)
  ✖ has a grace of 15 minutes
  ✖ is true exactly at expiresAt + 15 minutes
  ✖ is false 1 ms before expiresAt + 15 minutes
  ✖ is false at expiresAt itself and true long after the grace
  ✖ is false when expiresAt is null, however late it is
▶ VnpayGateway > query
  ✖ reports UNSIGNED with the response code when the sandbox answers 99 without a signature
```

Lý do đỏ đúng: `TypeError: (0 , import_vnpay.isPastGrace) is not a function` (và `unansweredQueryAction`), `actual: undefined, expected: 900000` cho `EXPIRY_GRACE_MS`, và `actual: { ok: false, reason: 'BAD_SIGNATURE' }` so với `expected: { ok: false, reason: 'UNSIGNED', responseCode: '99' }`. Sau khi viết code tối thiểu: `tests 84, pass 84, fail 0`.

## 4. Bảng D6 → code và test

Số dòng theo commit `b1c46ae`. `vnpay.ts` = `apps/api/src/payment/vnpay.ts`, `service` = `apps/api/src/checkout/checkout.service.ts`, `test` = `apps/api/test/vnpay.test.ts`.

| Hàng D6 (contract mục 8) | Hàm và dòng xử lý | Test |
|---|---|---|
| `00/00` → `SUCCESS` | `vnpay.ts:140`; áp ở `service:200` | `test:273` |
| `00/02` → `FAILED` | `vnpay.ts:141`; áp ở `service:200` | `test:284` |
| `91` đã xác thực: quá hạn → `EXPIRED`, còn hạn → 409 | `vnpay.ts:135-137`; đóng ở `service:194-195`; **không** warning ở `service:197` (`responseCode === '91'`) | `test:288` |
| `00` + status `04/05/06/07/09`: giữ `PENDING`, 502, warning đối soát, không bao giờ đóng | `vnpay.ts:143`; `service:185-190` (warning `service:187`) | `test:293` |
| `MISMATCH`: giữ `PENDING`, 502, warning đối soát, không bao giờ đóng | `unansweredQueryAction` `vnpay.ts:154`; `service:180`, `185-190` (warning `service:188`) | `test:323`; gateway `test:541` |
| `00/01`: chưa hết khoảng chờ → 409, hết → đóng | `vnpay.ts:145`; 409 ở `service:192`; đóng ở `service:194-198` | `test:277`, `test:281` |
| `00` + status thiếu hoặc lạ: chưa → 502, hết → đóng | `vnpay.ts:147-148` | `test:300`, `test:305` |
| Mã truy vấn khác (`02`, `03`, `94`, `97`, `99`...): chưa → 502, hết → đóng | `vnpay.ts:147-148` | `test:308`, `test:314` |
| Không chữ ký, sai chữ ký, timeout, lỗi mạng, không đọc được, thiếu cấu hình, thiếu `gatewayCreateDate`: chưa → 502, hết → đóng | `unansweredQueryAction` `vnpay.ts:155`; `UNSIGNED` ở `vnpay.ts:103`; `service:175-180`, `194-198` | `test:327`, `test:330`; `UNSIGNED`: `test:239`, `243`, `248`, gateway `test:536`; các lý do còn lại: gateway `test:514-531` (đã có) |
| Khoảng chờ: `now >= expiresAt + 15 phút`, `expiresAt = null` không bao giờ hết | `EXPIRY_GRACE_MS` `vnpay.ts:125`; `isPastGrace` `vnpay.ts:128-130`; dùng ở `service:173` | `test:337`, `340`, `343`, `346`, `350` |
| "Đóng": `FAILED`, `EXPIRED`, `gatewayTransactionStatus = null`; không ghi đè payment đã chốt | `EXPIRED_RESULT` `service:32`; `applyGatewayResult` (không sửa) trả `false` khi payment không còn `PENDING`; `stillPending` đọc lại ở `service:184` | không có (cần Postgres) |
| Warning `PAYMENT_EXPIRED_UNCONFIRMED vnp_TxnRef=<id>` + `reason=` hoặc `vnp_ResponseCode= vnp_TransactionStatus=` | `expiredUnconfirmed` `service:282-285`; chỉ ghi khi `closed` (`service:195-197`) | không có (cần Postgres) |
| Log `VNPAY_QUERYDR_FAILED ... vnp_ResponseCode=<mã>` khi `UNSIGNED` có mã | `service:175-179` | `UNSIGNED` mang mã: `test:239`, `test:536` |
| Web: mã `15` và `EXPIRED` → "Đã hết thời gian thanh toán" | `apps/web/src/lib/shop.ts:27` | không có (chỉ lint + typecheck) |

## 5. Quyết định thiết kế (để giải thích khi vấn đáp)

- **`UNSIGNED` là "thiếu hẳn `vnp_SecureHash`"** (`raw.vnp_SecureHash === undefined`). Chuỗi rỗng, số hay hash ngắn/sai hex vẫn là `BAD_SIGNATURE`. Test cũ `rejects a missing, short or non-hex signature` có dòng `vnp_SecureHash: undefined` kỳ vọng `BAD_SIGNATURE`; theo card, ca này nay là `UNSIGNED`, nên tôi tách dòng đó sang test mới và đổi tên test cũ thành `rejects a short, non-hex or non-string signature` (thêm ca hash là số 123). Ý nghĩa "bị từ chối, không ném lỗi" được giữ.
- **`responseCode` của `UNSIGNED` chỉ để ghi log.** Body không chữ ký không đáng tin, nên chỉ giữ mã khi đúng 2 chữ số (regex `^\d{2}$`, chặn việc nhét xuống dòng giả vào log). `PAYMENT_EXPIRED_UNCONFIRMED` cũng chỉ ghi `reason=` cho ca không xác thực, không ghi mã này.
- **Kiểu dùng chung:** trước đây `QueryResult` tự liệt kê union lý do. Tôi đặt `QueryFailureReason` trong `vnpay.ts` (nơi đã có `QueryDrFailure`) và cho `payment-gateway.ts` dùng lại, thay vì import ngược từ gateway vào `vnpay.ts` (file đó giữ tính thuần: không Nest, không DB, không mạng).
- **`query()` trong gateway trả thẳng `verified`** khi lỗi. Các lý do khác không có khóa `responseCode`, nên các test `deepEqual { ok: false, reason: 'BAD_SIGNATURE' }` cũ vẫn đúng nguyên văn.
- **`settleByQuery` tính `action` một lần, ngoài transaction**, từ `queryDrAction` hoặc `unansweredQueryAction`, rồi một nhánh chung xử lý. Điều kiện `action.kind === 'EXPIRED' || !answer.ok` có `!answer.ok` chỉ để TypeScript hiểu nhánh sau là câu trả lời đã xác thực; nhánh `!answer.ok` không đến được với `SUCCESS`/`FAILED`.

## 6. Change request, concern và rủi ro

**Change request ngoài allowed paths:** không có. Không sửa `resolveExpired`, `pay`, `transition`.

**Concern 1 (cần Integrator xác nhận): warning cho `MISMATCH`.** Contract mục 8 ghi hàng `MISMATCH` là "giữ `PENDING`, 502, warning đối soát" và card yêu cầu `reconcile: true`. Code cũ chỉ ghi `VNPAY_QUERYDR_FAILED reason=MISMATCH`, không có `PAYMENT_RECONCILIATION_REQUIRED`. Tôi thêm ở `service:188`: `PAYMENT_RECONCILIATION_REQUIRED vnp_TxnRef=<id> reason=MISMATCH`, vì không có mã đã xác thực để ghi như dạng cũ. Dạng này chưa có trong SRS/contract. Nếu nhóm chỉ muốn giữ dòng `VNPAY_QUERYDR_FAILED`, xóa nhánh `else` ở `service:188` và `reconcile: true` thành không dùng. W3-DOCS cần ghi dạng log này nếu giữ.

**Concern 2: không có test tự động cho `settleByQuery`** (cần Postgres, card cấm). Các điểm chỉ kiểm bằng đọc code: đóng `EXPIRED` đúng một lần, không ghi đè payment đã chốt bởi IPN, warning `PAYMENT_EXPIRED_UNCONFIRMED` chỉ ghi khi thật sự đóng. Cần chạy tay trên môi trường có Postgres, ví dụ: tạo payment, đặt `expiresAt` lùi hơn 15 phút, để QueryDR sandbox trả `99` không chữ ký, gọi `POST /payments/:id/sync` → kỳ vọng payment `FAILED`/`EXPIRED`, đơn `PAYMENT_FAILED`.

**Rủi ro khác:**
- Warning `PAYMENT_EXPIRED_UNCONFIRMED` và `PAYMENT_RECONCILIATION_REQUIRED` được ghi bên trong transaction (giống chỗ ghi warning có sẵn); nếu commit lỗi sau đó thì log đã ghi nhưng DB không đổi. Lỗi commit làm request trả 500 nên hiếm.
- Khoảng chờ tính từ `queriedAt` (lúc gửi QueryDR) đúng contract; đồng hồ máy chủ lệch với `expiresAt` chỉ làm lệch mốc đóng vài giây.
- Một khách đã trả tiền nhưng IPN và QueryDR đều không tới trong 15 phút sau hạn sẽ bị đóng `EXPIRED`; IPN thành công tới sau đó đi theo AC-F15.7 (trả `02`, warning `PAYMENT_RECONCILIATION_REQUIRED`, hoàn tiền tay). Đây là hệ quả đã chấp nhận ở D6.
- `docs/payment-vnpay-spike.md` mục 4 vẫn ghi "giữ nhãn chờ" cho `91` và `00/01`; việc cập nhật thuộc card W3-DOCS.

## 7. Giải thích cho nhóm

Không có file code mới; có ba hàm thuần mới trong `vnpay.ts`. Đọc theo thứ tự:

1. `vnpay.ts:124-130`: `EXPIRY_GRACE_MS` và `isPastGrace(expiresAt, now)` trả lời "đã quá 15 phút sau hạn chưa". `expiresAt` null thì không bao giờ quá.
2. `vnpay.ts:132-149`: `queryDrAction` nhận thêm `pastGrace`. Đọc từ trên xuống như bảng D6: `91`, rồi `00` với `00`/`02`/status nghi ngờ/`01`, phần còn lại (status lạ, mã khác) rơi xuống dòng cuối: hết khoảng chờ thì `EXPIRED`, chưa thì lỗi provider (502).
3. `vnpay.ts:151-156`: `unansweredQueryAction` cho lúc VNPay không trả lời xác thực được. `MISMATCH` không bao giờ đóng (có thể tiền đã đi), mọi lý do khác đóng khi hết khoảng chờ.
4. `vnpay.ts:93-104`: `verifyQueryDrResponse` thêm lý do `UNSIGNED` cho phản hồi thiếu `vnp_SecureHash` (sandbox đang trả `99` không chữ ký).
5. `checkout.service.ts:169-205`: `settleByQuery` hỏi VNPay, tính `action` bằng hai hàm trên, rồi dưới khóa đơn: đọc lại payment, nhánh lỗi/đang chờ giữ `PENDING`, nhánh `EXPIRED` ghi `FAILED`/`EXPIRED` qua `applyGatewayResult`, nhánh còn lại áp kết quả thật.
6. `vnpay.test.ts:272-352`: test của `queryDrAction`, `unansweredQueryAction`, `isPastGrace`; đọc tên test để thấy bảng D6.

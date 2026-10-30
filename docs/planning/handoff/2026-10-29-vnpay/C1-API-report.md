# Report C1-API — VNPAY-C1-API

**Task card:** `VNPAY-C1-API` (task `task_507920d6c1d3`, dispatch `ctx_607a33cad782`, **retry** của `ctx_5fd012103197`) · **Kế hoạch:** [vnpay-payment-plan](../../2026-10-29-vnpay-payment-plan.md), bước 5.1, 5.2, 5.3 và phần đọc cấu hình của 5.6 · **Hợp đồng:** [contract.md](contract.md) · **Trạng thái:** `DONE_WITH_CONCERNS` (concern: mục 6 và 7, không chặn merge)

## 1. Commit và file

- Branch của worktree: `ThuanTran260/chore-multi-agent-workflow`. Nền: `86acc56` (= `a2/payment-vnpay`).
- Commit code: `698f008a0c221eb45f6ad3bef0addcb9e409e590` — `feat(payment): add VNPay schema, signing helpers, gateway and config`.
- Commit report: file này, message `docs(payment): add VNPay C1-API worker report` (report không tự chứa hash của chính nó; lấy bằng `git log -1`).
- Lần trước (dispatch `ctx_5fd012103197`) dừng vì hết usage, chưa commit. Lần này đã rà lại các file còn dở, không viết lại từ đầu (mục 5).

| File | Nội dung chính |
|---|---|
| `apps/api/prisma/schema.prisma` | +10 dòng: `PaymentStatus.PENDING` và 9 cột mới của `Payment` (mục 1.4). Không đụng vùng khác |
| `apps/api/prisma/migrations/20261029100000_vnpay_payment_enum/migration.sql` (mới) | Thêm enum `PENDING`, 9 cột, rồi `UPDATE "payments" SET "provider" = 'SIMULATOR'` cho hàng cũ |
| `apps/api/prisma/migrations/20261029100001_vnpay_pending_index/migration.sql` (mới) | Partial unique index `payments_one_pending_per_order` |
| `apps/api/src/payment/vnpay.ts` (mới, 144 dòng) | Hàm thuần: ký/kiểm chữ ký, QueryDR, đổi ngày GMT+7, hai hàm ánh xạ mã → hành động |
| `apps/api/src/payment/vnpay-config.ts` (mới, 49 dòng) | Đọc biến môi trường, hỏi thao tác nào dùng được, liệt kê tên biến thiếu, kiểm `PAYMENT_PROVIDER` |
| `apps/api/src/payment/payment-gateway.ts` (mới, 73 dòng) | `VnpayGateway.createUrl` và `query` (HTTP, timeout 10 giây) |
| `apps/api/test/vnpay.test.ts` (mới, 492 dòng, 69 ca) | Test D3 viết trước, chạy đỏ rồi mới viết hàm |
| `docs/planning/handoff/2026-10-29-vnpay/C1-API-report.md` (mới) | File này |

Không sửa `checkout.service.ts`, `checkout.controller.ts`, `checkout.module.ts`, `payment.ts`, `main.ts`, `apps/web/`, `package*.json`, `.env.example`, compose, tài liệu khác. Không tạo `apps/api/.env`.

## 2. Lệnh acceptance và kết quả thật

Chạy trong `apps/api`, sau commit code. Với `prisma`, đặt `DATABASE_URL` giả (`postgresql://fake:fake@localhost:5432/fake`) chỉ cho lệnh đó, vì không có `.env`; `validate`/`generate`/`migrate diff` không kết nối DB.

| Lệnh | Kết quả |
|---|---|
| `npx prisma validate` | `The schema at prisma\schema.prisma is valid` |
| `npx prisma generate` | đạt (exit 0) |
| `npx prisma migrate diff --from-schema-datamodel <schema ở HEAD> --to-schema-datamodel prisma/schema.prisma --script` | Ra đúng `ALTER TYPE … ADD VALUE 'PENDING'` và 9 cột `ADD COLUMN` đã có trong migration 1; migration 1 chỉ thêm `UPDATE` và comment |
| `npx prisma format --check` | **Không đạt, nhưng đã đỏ sẵn ở HEAD:** chạy cùng lệnh trên bản `schema.prisma` lấy từ `git show HEAD:` cũng báo `There are unformatted files`. Không chạy `prisma format` để khỏi sửa ngoài vùng `PaymentStatus`/`Payment` |
| `node --import tsx --test test/vnpay.test.ts` | **Xanh:** `tests 69, suites 11, pass 69, fail 0, cancelled 0, skipped 0` (output đầy đủ ở mục 3) |
| `npm run lint` | exit 0, không in lỗi hay cảnh báo nào |
| `npm run build` | exit 0 (`nest build`); `dist/` không hiện trong `git status` |
| `grep -rn "console.log\|SecureHash=" src/payment` | không có dòng nào (exit 1). Chạy thêm `grep -rnE "console\.\|Logger\|logger" src/payment`: cũng không có |
| `tsc --noEmit --ignoreConfig …` riêng cho `test/vnpay.test.ts` (tsconfig và lint không phủ `test/`) | exit 0, không lỗi kiểu |
| `git diff --check a2/payment-vnpay...HEAD` | exit 0 (chỉ có cảnh báo `LF will be replaced by CRLF` của `autocrlf` trên Windows) |
| `git diff --name-only a2/payment-vnpay...HEAD` (sau commit code) | đúng 7 file: schema, 2 migration, 3 file `src/payment/*.ts`, `test/vnpay.test.ts`. Sau commit report sẽ thêm file này |
| Quét dòng thêm tìm private key, `VNP_*=` gán giá trị, token, chuỗi 16 chữ số | không khớp. Giá trị duy nhất trông giống bí mật là hằng giả `FAKE_SECRET_FOR_UNIT_TESTS`, mã giả `FAKETMN1` và các chữ ký hex 128 ký tự tính từ secret giả đó trong test |

Chưa chạy, và card cấm: `prisma migrate dev/deploy`, mọi lệnh cần Postgres. Vì vậy **hai migration chưa được áp lên DB thật** và chưa xem `\d payments` (mục 7).

## 3. Output test: đỏ rồi xanh (TDD, D3)

**Đỏ lần đầu** — `src/payment/` chưa tồn tại (test đã chỉnh ở mục 5, chưa có hàm nào):

```
$ node --import tsx --test test/vnpay.test.ts
Error: Cannot find module '../src/payment/payment-gateway'
Require stack:
- apps\api\test\vnpay.test.ts
  code: 'MODULE_NOT_FOUND',
✖ test\vnpay.test.ts (868.2177ms)
ℹ tests 1
ℹ suites 0
ℹ pass 0
ℹ fail 1
```

**Xanh cuối** (sau khi viết `vnpay.ts`, `vnpay-config.ts`, `payment-gateway.ts`; lần chạy đầu sau khi viết hàm đã xanh nên không có vòng sửa hàm nào):

```
$ node --import tsx --test test/vnpay.test.ts
…
✔ VnpayGateway (28.1203ms)
ℹ tests 69
ℹ suites 11
ℹ pass 69
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

**Kiểm test không "xanh giả"** (đột biến tạm trên `vnpay.ts`, đã khôi phục, `diff` với bản backup là identical, chạy lại xanh 69/69):

- Encode khoảng trắng bằng `encodeURIComponent` (`%20`): 8 ca đỏ.
- Bỏ kiểm hex/độ dài chữ ký: 3 ca đỏ.
- Nhánh `91` luôn trả `EXPIRED` (bỏ điều kiện quá hạn): 1 ca đỏ.
- Đổi GMT+7 thành GMT+6: 6 ca đỏ.

**Chữ ký mong đợi tính độc lập:** mỗi chữ ký trong test được tính lại bằng `printf '%s' '<chuỗi>' | openssl dgst -sha512 -hmac 'FAKE_SECRET_FOR_UNIT_TESTS'`. Bảy chữ ký (URL, return `+`, return `%20`, QueryDR request, 3 response) khớp từng ký tự. Lệnh và chuỗi đưa vào `openssl` nằm trong comment của test.

## 4. Chỗ làm theo "(chờ spike)"

Ba điểm nằm cạnh nhau trong `vnpay.ts`, mỗi điểm có comment `// pending spike:`; tìm bằng `grep -n "pending spike" apps/api/src/payment/vnpay.ts`:

1. `vnpay.ts:128` — `queryDrAction`, QueryDR `00/01` sau hạn: giữ `IN_PROGRESS` (đúng bảng 1.6 hiện tại). Hàm đã nhận tham số `expired`, nên nếu spike chốt "sau hạn + khoảng chờ → FAILED EXPIRED" thì chỉ sửa một dòng này. Lối thoát cho ca bỏ dở **chưa có trong code** (C2/Integrator quyết sau spike).
2. `vnpay.ts:123` — `queryDrAction`, `91` sau hạn → `EXPIRED`, còn hạn → `IN_PROGRESS`.
3. `vnpay.ts:140` — `ipnAction`, điều kiện thất bại IPN: `vnp_TransactionStatus = 02` và `vnp_ResponseCode` khác `00`/`07` → `FAILED` (kể cả khách hủy `24`).

Mọi nhánh còn lại của hai hàm là bảng mục 1.6 và mục 1.3 bước 5–7, có test cho từng dòng.

## 5. Đã rà gì ở file còn dở của lần trước

- **`schema.prisma` và hai migration:** đúng mục 1.4, giữ nguyên. Chỉ kiểm lại bằng `migrate diff` (mục 2) và đọc SQL.
- **`test/vnpay.test.ts`:** giữ cấu trúc, ba sửa:
  1. `RESP_SUCCESS_WITH_REQUEST_FORMULA_HASH` không khớp bất kỳ chuỗi nào mà `openssl` tái tạo được và comment không ghi chuỗi gốc. Đã thay bằng chữ ký tính lại bằng `openssl` cho chuỗi ghi rõ trong comment (`||querydr|FAKETMN1|PAYMENT1||||Thanh toan don ORDER1`, tức công thức request áp lên dữ liệu response).
  2. Quy tắc `reconcile` của `ipnAction` đổi cho nhất quán: **ghi warning đối soát khi có dấu hiệu tiền đã đi** (response `00`/`07`, hoặc status `00`/`04`–`09`). Bản cũ của test không ghi warning cho cặp mâu thuẫn như `00/02`, `24/00`, `00/01`. Plan mục 1.3 bước 7 chỉ nói "ghi warning khi có dấu hiệu đã trừ tiền", nên chọn phía an toàn; cái giá là có thể dư một dòng warning, không bao giờ thiếu.
  3. Tách các ca `ipnAction` thành ca riêng theo từng loại cặp mã cho dễ đọc.
- **Chưa có `src/payment/*`:** viết mới ba file.

## 6. Change request

Không có. `npm run build` đạt với `checkout.service.ts` hiện tại, nên không cần sửa code cũ. Hai điểm C2 cần biết (không phải CR):

- `pay()` hiện tại tạo `Payment` mà không đặt `provider`, nên các hàng simulator tạo **sau** migration sẽ mang `provider = 'VNPAY'` (mặc định) cho tới khi C2 thay `pay()`. Chỉ lệch nhãn, không ảnh hưởng logic.
- `detail()` chưa select các cột mới của `Payment` (mục 1.5); đó là việc của 5.4 (C2).

## 7. Rủi ro và giả định cần nhóm/Integrator xác nhận

- **Migration chưa chạy trên Postgres:** chỉ kiểm bằng `migrate diff` và đọc SQL. Cần `migrate dev` + `\d payments` (bước 5.1/7.x) ở nơi có DB.
- **Giá trị rỗng trong chuỗi ký return/IPN:** `signedQuery` ký **mọi** tham số `vnp_*` kể cả giá trị rỗng, đúng chữ mục 1.2. Sample PHP làm vậy, sample Java bỏ giá trị rỗng. Spike (1.2) cần xác nhận khi VNPay trả tham số rỗng (ví dụ ca khách hủy `24`).
- **Response `91` có đủ `vnp_TmnCode` và `vnp_TxnRef`?** `verifyQueryDrResponse` đòi cả hai khớp request, kể cả khi `91`; nếu sandbox bỏ chúng ở response lỗi thì `91` sẽ ra `MISMATCH` (lỗi provider, an toàn nhưng không đóng được payment). Cùng điểm với chờ spike số 2.
- **`vnp_IpAddr` của QueryDR:** hằng `127.0.0.1` ở `payment-gateway.ts` (`QUERY_IP_ADDR`); plan 1.2 yêu cầu spike ghi giá trị VNPay chấp nhận.
- **`fake` bị từ chối ở mọi môi trường**, không chỉ production, vì cổng giả chưa làm (D4). `PAYMENT_PROVIDER` được `trim` và hạ chữ thường; thông báo lỗi không in giá trị cấu hình.
- **Cấu hình đọc từ `process.env` mỗi lần gọi** (không cache, không dùng `ConfigService`), nên đổi biến giữa các lần gọi có hiệu lực ngay và test không cần dựng module.
- **`VnpayGateway` có `@Injectable()`** và không phụ thuộc gì, nên C2 chỉ cần thêm vào `providers`. Chưa có chỗ nào đăng ký nó.
- **Test không nằm trong CI, không được lint/tsc phủ** (D3, đã chấp nhận); đã typecheck riêng một lần ở mục 2.
- **`npx prisma generate` ghi vào `node_modules` dùng chung** (junction tới worktree tích hợp), nên client sinh ra ở đó nay có `PENDING` và các cột mới. File này được `.gitignore` chặn; ảnh hưởng chỉ là các worktree khác thấy kiểu mới sớm hơn khi chưa merge.

## 8. Giải thích cho nhóm

Đọc theo thứ tự này:

1. **`vnpay-config.ts` (49 dòng):** đọc năm biến môi trường rồi trả một object. `canVerify` (chỉ cần `VNP_TMN_CODE`, `VNP_HASH_SECRET`) và `canCreateUrl` (cần thêm `WEB_URL`) là hai câu hỏi mà mục 1.8 đặt ra theo từng thao tác. `missingVnpayVars` chỉ trả **tên** biến thiếu để in một dòng cảnh báo. `assertPaymentProvider` ném lỗi để lúc khởi động dừng nếu provider không hỗ trợ.
2. **`vnpay.ts` (144 dòng):** không đụng Nest, DB hay mạng. Phần đầu là ngày GMT+7 (`formatVnDate`/`parseVnDate`). Tiếp theo là ký: `buildPaymentUrl` sắp tham số, encode bằng `URLSearchParams` (khoảng trắng thành `+`) rồi HMAC-SHA512; `verifyReturn` ký lại và so bằng `timingSafeEqual` sau khi kiểm chữ ký đủ 128 ký tự hex; `buildQueryDr`/`verifyQueryDrResponse` ký chuỗi giá trị thô nối `|`. Cuối file là hai hàm ánh xạ `queryDrAction` (bảng 1.6) và `ipnAction` (mục 1.3), cùng ba chỗ `pending spike`.
3. **`payment-gateway.ts` (73 dòng):** lớp mỏng quanh `vnpay.ts`. `createUrl` chọn `VNBANK` cho `CARD`, tính hạn 15 phút theo giây tròn để `expiresAt` trùng `vnp_ExpireDate` đã ký. `query` gọi `fetch` với timeout 10 giây rồi trả `{ ok: true, responseCode, transactionStatus, … }` hoặc `{ ok: false, reason }` với `reason` là một trong `NOT_CONFIGURED`, `MISSING_CREATE_DATE`, `TIMEOUT`, `NETWORK`, `BAD_RESPONSE`, `BAD_SIGNATURE`, `MISMATCH`.
4. **`test/vnpay.test.ts`:** đọc các hằng chữ ký ở đầu file cùng lệnh `openssl` trong comment, rồi từng `describe` theo đúng thứ tự các file trên.

Khi vấn đáp, câu hỏi dễ gặp: vì sao `%20` làm sai chữ ký (mục 1.2), vì sao `expiresAt` phải cùng thời điểm `vnp_ExpireDate`, và vì sao QueryDR trả `ok: false` thay vì "thất bại" (mục 1.6: lỗi truy vấn không được biến thành kết quả thanh toán thất bại).

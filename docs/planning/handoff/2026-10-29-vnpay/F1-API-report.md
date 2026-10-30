# Report F1-API — VNPAY-F1-API

**Task card:** `VNPAY-F1-API` (task `task_3a91c11b15f9`, dispatch `ctx_11b3ab077a24`) · **Nguồn:** review (Opus) của D6, đã ghi vào [contract.md](contract.md) mục 8, đoạn "Sửa sau review (2026-10-30)" · **Phạm vi:** finding 1, 5, 7, 9 · **Trạng thái:** `DONE_WITH_CONCERNS` (concern: `npx prisma generate` báo EPERM, mục 2; không chặn merge)

## 1. Commit và file

- Branch của worktree: `ThuanTran260/task-3a91c11b`. Lúc bắt đầu `git branch --show-current` trả `ThuanTran260/sweeper`; Orca đổi tên branch trong lúc worker làm việc, worker không chạy lệnh đổi tên. Commit nằm trên branch mới. Nền: `fc8d61c` (= đầu `a2/payment-vnpay`).
- Commit code: `77ab77f6b24f7c3d434290a55211cf7897270f73` — `fix(payment): keep VNPay error answers closable and show the expiry reason`.
- Commit report: file này, message `docs(payment): add VNPay F1-API worker report` (report không tự chứa hash của chính nó; lấy bằng `git log -1`). Chưa push.

| File | Nội dung chính |
|---|---|
| `apps/api/src/payment/vnpay.ts` | `verifyQueryDrResponse`: sai hoặc rỗng `vnp_TmnCode`/`vnp_TxnRef` chỉ là `MISMATCH` với mã `00`, mã khác trả `BAD_RESPONSE`; cập nhật comment. `unansweredQueryAction`: kiểu trả về thu hẹp thành `EXPIRED \| PROVIDER_ERROR` |
| `apps/api/src/checkout/checkout.service.ts` | Chỉ `settleByQuery`: rẽ nhánh `!answer.ok` / `answer.ok` rõ ràng, bỏ `\|\| !answer.ok` |
| `apps/api/test/vnpay.test.ts` | 5 test mới (84 → 89), 2 fixture đã ký bằng secret giả |
| `apps/web/src/components/shop/OrdersScreen.tsx` | Import `vnpayMessage`; dòng payment `FAILED` có mã thì thêm ` · <thông báo>` |
| `docs/planning/handoff/2026-10-29-vnpay/F1-API-report.md` (mới) | File này |

Không sửa: `queryDrAction` và chữ ký của nó (finding 2), vị trí ghi log trong transaction (finding 8), `payment-gateway.ts`, `applyGatewayResult`, `ipn`, `package*.json`, tài liệu. Không tạo `apps/api/.env`. Không chạy docker, dev server, `prisma migrate` hay lệnh cần Postgres.

## 2. Lệnh acceptance và kết quả thật

Chạy trên commit code `77ab77f`. `node_modules` là junction do Integrator nối (trỏ về worktree tích hợp), không chạy `npm install`.

| Lệnh | Kết quả |
|---|---|
| `apps/api`: `npx prisma generate` | **Báo lỗi** `EPERM: operation not permitted, rename '...\.prisma\client\query_engine-windows.dll.node.tmp<pid>' -> '...\query_engine-windows.dll.node'`. Chạy hai lần, cùng lỗi. Exit code không ghi lại (qua pipe `tail`), coi như chưa đạt. Xem giải thích bên dưới bảng |
| `apps/api`: `npm run lint` | exit 0, 0 lỗi |
| `apps/api`: `npm run build` | exit 0 (`nest build`) |
| `apps/api`: `npx tsc --noEmit -p tsconfig.json` (thêm) | exit 0 |
| `apps/api`: `node --import tsx --test test/vnpay.test.ts` | `tests 89, suites 13, pass 89, fail 0` |
| `apps/web`: `npm run lint` | exit 0, 0 lỗi |
| `apps/web`: `npm run typecheck` | exit 0 (`tsc --noEmit`) |
| `grep -n "\|\| !answer.ok" apps/api/src/checkout/checkout.service.ts` | không có kết quả (exit 1) |
| `git diff --check a2/payment-vnpay` (trước commit) | exit 0 |
| Quét dòng thêm tìm `secret`, `password`, `token`, `vnp_SecureHash=`, `tmncode=`, chuỗi 16 chữ số | không khớp. Hai chuỗi hex 128 ký tự mới trong test là chữ ký HMAC tính bằng secret giả `FAKE_SECRET_FOR_UNIT_TESTS` |

**Về `prisma generate`.** Lỗi nằm ở bước cuối: đổi tên file engine `query_engine-windows.dll.node`, file này đang bị tiến trình khác giữ vì `node_modules` là junction dùng chung với worktree tích hợp. Các file client (`index.js`, `index.d.ts`...) vẫn được sinh lại, nên `npm run build`, `tsc --noEmit` và test đều chạy được trên client hiện có. Hai file tạm `query_engine-windows.dll.node.tmp29640` và `.tmp14888` do hai lần chạy của worker để lại trong thư mục dùng chung; worker đã xóa đúng hai file đó. Diff này không đụng `prisma/schema.prisma`, nên client đã sinh không đổi về nội dung.

`apps/api/test/` chỉ có `vnpay.test.ts` và `apps/api/package.json` không có script `test`, nên không còn suite nào khác để chạy. `apps/web` không có script test. `settleByQuery` cần Postgres (khóa đơn, transaction), nên **không có test tự động**.

## 3. Test đỏ trước khi xanh (TDD)

Viết 5 test và 2 fixture trước, chạy trên code cũ (`node --import tsx --test test/vnpay.test.ts`):

```
ℹ tests 89
ℹ suites 13
ℹ pass 87
ℹ fail 2

✖ failing tests:
✖ reports BAD_RESPONSE for a signed error answer with an empty merchant and reference
  AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
  + actual - expected
    {
      ok: false,
  +   reason: 'MISMATCH'
  -   reason: 'BAD_RESPONSE'
    }
✖ reports BAD_RESPONSE for a signed 91 answer about another TxnRef or merchant
  (cùng sai lệch: actual 'MISMATCH', expected 'BAD_RESPONSE')
```

Hai test đỏ đúng lý do (code cũ xếp mọi phản hồi đã ký có merchant/TxnRef sai là `MISMATCH`). Sau khi sửa `vnpay.ts`: `tests 89, pass 89, fail 0`.

Ba test còn lại **xanh ngay từ đầu, không phải lỗi sót**: chúng khóa ranh giới hành vi hiện có (finding 9), code không cần đổi:
- `vnp_SecureHash: ''` và `null` → `BAD_SIGNATURE` (chỉ thiếu hẳn trường mới là `UNSIGNED`);
- `queryDrAction('99', '05', true, true)` → `EXPIRED`;
- phản hồi `00` có `vnp_TmnCode`/`vnp_TxnRef` rỗng → `MISMATCH` (giữ hành vi, thêm ca "rỗng" cho `00`).

Chưa làm mutation check cho ba test này (không đảo code để xem test đỏ).

## 4. Bảng finding → code và test

| Finding | Code | Test |
|---|---|---|
| 1. Phản hồi lỗi đã ký có trường rỗng bị xếp `MISMATCH`, đơn kẹt mãi | `vnpay.ts:109-115` (`isSuccessCode`, `MISMATCH` chỉ cho `00`, mã khác `BAD_RESPONSE`); comment `vnpay.ts:91-93` | `vnpay.test.ts:282` (97, rỗng → `BAD_RESPONSE`, **đỏ trước**), `:285` (91 khác TxnRef/TmnCode → `BAD_RESPONSE`, **đỏ trước**), `:278` (00 rỗng → `MISMATCH`), `:274` (test cũ: 00 sai TxnRef/TmnCode → `MISMATCH`), `:289`, `:292` (số tiền, type của 00 → `MISMATCH`, giữ nguyên). Fixture `:102-:109` |
| 5. Khách không thấy lý do sau khi payment bị đóng | `OrdersScreen.tsx:4` (import), `:54` (dòng payment: `payment.status === 'FAILED' && payment.gatewayResponseCode`) | Không có test tự động (web không có hạ tầng test). Kiểm bằng `npm run lint` và `npm run typecheck`. `vnpayMessage('EXPIRED')` đã có từ C3 |
| 7. Kiểu của `unansweredQueryAction` rộng hơn thực tế, buộc `\|\| !answer.ok` | `vnpay.ts:159` (`Extract<QueryDrAction, { kind: 'EXPIRED' \| 'PROVIDER_ERROR' }>`); `checkout.service.ts:184-194` (nhánh `!answer.ok`), `:195-210` (nhánh `answer.ok`) | Kiểu: `npm run build` và `tsc --noEmit` (nhánh `!answer.ok` không thể gặp `SUCCESS`/`FAILED`). Logic chọn hành động: `vnpay.test.ts:351-` (`unansweredQueryAction`, không đổi). Luồng `settleByQuery`: không có test tự động (cần Postgres); card nêu wiring đã được Integrator kiểm local 13/13 kịch bản trước sửa, **chưa chạy lại sau sửa này** |
| 9. Biên `UNSIGNED` / `BAD_SIGNATURE` và status nghi ngờ đi với mã khác `00` | Không đổi code (hành vi đã đúng) | `vnpay.test.ts:258` (`''` và `null` → `BAD_SIGNATURE`), `:345` (`99/05` → `EXPIRED` sau grace, `PROVIDER_ERROR` trước grace) |

## 5. Test cũ đã đổi kỳ vọng

Không có. Không test cũ nào bị sửa hay xóa; chỉ thêm. Các test cũ về `MISMATCH` của phản hồi `00` (`vnpay.test.ts:274`, `:289`, `:292`) vẫn xanh nguyên văn.

## 6. Hành vi `settleByQuery` trước và sau

Hành vi và log giữ nguyên, đã đối chiếu từng nhánh:
- `!answer.ok`, `PROVIDER_ERROR`: warning `PAYMENT_RECONCILIATION_REQUIRED ... reason=` khi `reconcile`, trả `PROVIDER_ERROR` nếu còn `PENDING`, ngược lại `DONE`.
- `!answer.ok`, `EXPIRED`: đóng bằng `EXPIRED_RESULT`; nếu thực sự đóng thì warning `PAYMENT_EXPIRED_UNCONFIRMED ... reason=`.
- `answer.ok`: `PROVIDER_ERROR`, `IN_PROGRESS`, `SUCCESS`/`FAILED` như cũ; `EXPIRED` đóng, warning `PAYMENT_EXPIRED_UNCONFIRMED` trừ khi mã đã xác thực là `91`.
- Khác biệt duy nhất: `const action` chuyển từ trước transaction vào trong transaction, vì mỗi nhánh gọi hàm riêng. Hai hàm là hàm thuần, không đọc DB, nên kết quả không đổi. Biến của nhánh `!answer.ok` đặt tên `unanswered` để không trùng `action`.

## 7. Change request

Không có CR trong allowed paths. Hai điểm cho Integrator/F1-DOCS cân nhắc (không phải CR của card này):
- Comment ở `vnpay.ts` (`unansweredQueryAction`) giờ viết "a signed 00 answer" cho `MISMATCH`. Tài liệu nào còn mô tả `MISMATCH` là "phản hồi đã ký sai merchant/TxnRef" cho mọi mã nên khớp với contract mục 8 (sửa sau review). Việc này thuộc card F1-DOCS.
- `settleByQuery` chưa được chạy lại end to end sau thay đổi cấu trúc nhánh. Nên chạy lại bộ kịch bản local 13 ca của Integrator trước khi merge.

## 8. Rủi ro

- `prisma generate` chưa đạt (EPERM, mục 2). Nếu Integrator cần xác nhận, chạy lại khi không có tiến trình nào giữ `query_engine-windows.dll.node`.
- `settleByQuery` chưa có test tự động; thay đổi là tái cấu trúc nhánh, đã đối chiếu thủ công (mục 6) và qua `tsc`, nhưng chưa chạy lại 13 kịch bản local.
- Ba test finding 9 xanh từ đầu, chưa có mutation check.
- `OrdersScreen.tsx` đổi một dòng JSX rất dài; thông báo hiện cho mọi payment `FAILED` có `gatewayResponseCode`, kể cả mã khác `EXPIRED` (đúng yêu cầu card, `vnpayMessage` trả "Thanh toán không thành công" cho mã lạ).

## 9. Giải thích cho nhóm

Không có file code mới; đọc theo thứ tự này:
1. `apps/api/src/payment/vnpay.ts` — `verifyQueryDrResponse`: chữ ký đúng rồi mới xét merchant và TxnRef. Chỉ phản hồi `00` mới dẫn tới "thanh toán thành công", nên chỉ `00` sai thông tin mới là `MISMATCH` (không bao giờ tự đóng, người phải xem). Phản hồi lỗi khác (`97`, `91`...) có thể mang trường rỗng nhưng đã ký hợp lệ; xếp `BAD_RESPONSE` để hết khoảng chờ 15 phút thì đơn vẫn đóng được, không kẹt mãi.
2. `unansweredQueryAction` (cùng file) — khi không có câu trả lời xác thực thì chỉ có hai kết cục: `EXPIRED` (đóng) hoặc `PROVIDER_ERROR` (giữ chờ). Kiểu trả về nói rõ điều đó.
3. `settleByQuery` trong `apps/api/src/checkout/checkout.service.ts` — nhánh `!answer.ok` (không có câu trả lời) chỉ đóng hoặc báo lỗi; nhánh `answer.ok` xét đủ `SUCCESS`/`FAILED`/`EXPIRED`. Nhờ kiểu hẹp, không cần cờ `|| !answer.ok` để "gom" nhánh nữa.
4. `apps/web/src/components/shop/OrdersScreen.tsx` — dòng payment `FAILED` có mã thì hiện thêm thông báo, ví dụ "Đã hết thời gian thanh toán" cho `EXPIRED`.
5. `apps/api/test/vnpay.test.ts` — đọc fixture `RESP_ERROR_EMPTY_IDS`, `RESP_SUCCESS_EMPTY_IDS` (đã ký bằng secret giả), rồi các test ở `:258`, `:278-:287`, `:345`.

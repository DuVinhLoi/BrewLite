# Kế hoạch: sửa 3 lỗi phát hiện khi code-review (thanh toán hoàn tiền, compose `.env`, thông báo lỗi thanh toán)

> **Ghi lại sau khi làm (2026-10-09).** Code đã merge `--no-ff` vào `develop` ở `0e8773b` (nhánh `fix/review-3-bugs`, chưa push). Plan này bổ sung để mọi việc buổi sáng 2026-10-09 đều có plan trong `docs/planning/` như các việc khác; ô `[x]` đối chiếu theo commit + test, không phải kế hoạch viết trước khi code.
>
> **Cho agent thực thi (nếu làm lại):** nhánh `fix/review-3-bugs` từ `develop`, mỗi lỗi 1 commit, có test chốt lỗi, KHÔNG push.

**Plan liên quan:** việc thứ hai của buổi sáng (Order State Machine trên giao diện) ở `2026-10-09-order-state-machine-visible-plan.md`, làm ngay sau plan này.

**Nguồn chuẩn:** đề gốc §9 (thanh toán lỗi không được trừ tiền 2 lần, thử lại phải an toàn), README mục chạy bằng compose (`cp .env.example .env` → `docker compose up --build`).

## 0. Ba lỗi (kết quả review 2026-10-08)

| # | Lỗi | Triệu chứng | Nguyên nhân |
|---|---|---|---|
| 1 | Thanh toán: lỗi sau khi đã trừ tiền | Lỗi khác kẹt kho (sản phẩm mất → 404, lỗi DB…) làm đơn kẹt `PENDING`, không có biên lai, **tiền đã trừ mà không hoàn**; thử lại bằng key mới trừ tiền lần 2 (trái đề §9) | `catch` quanh `runInTransaction` trong `payment.service.ts` chỉ xử lý `ConflictException` (409) |
| 2 | Compose đọc `DATABASE_URL` từ `.env` | Làm đúng README `cp .env.example .env` rồi `docker compose up` → backend chết với `P1001 Can't reach database server`, `GET /products` không trả lời | Compose thay `${DATABASE_URL:-…@db…}` bằng giá trị trong `.env`, mà `.env.example` để `@localhost` (dành cho chạy rời) |
| 3 | Thanh toán lỗi hiện JSON thô | Màn thanh toán in nguyên `{"statusCode":400,"message":"Payment failed",...}` | `ApiPaymentGateway` dùng `res.text()` rồi đẩy thẳng lên UI |

**Ràng buộc phạm vi:** không đổi API, không đổi bảng `ALLOWED` của state machine, không đổi DB/user/password của compose; lỗi 409 (kẹt kho) giữ nguyên hành vi.

---

## Task 1: Mọi lỗi sau charge đều hoàn tiền + `PAYMENT_FAILED`

**File:** `backend/src/payment/payment.service.ts`, `backend/test/order-payment.integration.spec.ts`, `docs/user-sequence-specifications.md` (§2.4 mục A và C) — commit `8425785`

- [x] `catch` quanh `runInTransaction` bắt **mọi** lỗi: hoàn đúng `finalAmount` (số thực thu sau voucher), `assertTransition(PENDING → PAYMENT_FAILED)`, ghi `PAYMENT_FAILED`, rồi ném lại **lỗi gốc** (409 kẹt kho vẫn là 409).
- [x] Lỗi của bước bù (refund / ghi `PAYMENT_FAILED`) bị bỏ qua để không che lỗi gốc; ghi chú `ponytail:` cần job đối soát nếu chạy thật.
- [x] Assert theo `PENDING` cố định, không đọc `order.status` cục bộ (repo in-memory trả cùng object, đã bị đổi sang `PAID` trong transaction).
- [x] Test `describe('lỗi sau charge thành công → hoàn tiền + PAYMENT_FAILED')`: sản phẩm mất giữa chừng (404) + thử lại key mới thanh toán được và không hoàn thêm; lỗi chung có voucher (hoàn 31500, không để lại gì); kẹt kho 409 giữ nguyên.
- [x] Docs §2.4 mục A và C mô tả nhánh "ghi DB lỗi sau khi trừ: đã hoàn tiền".

**Xong khi:** lỗi bất kỳ sau charge → khách được hoàn tiền, đơn `PAYMENT_FAILED`, thử lại không trừ tiền lần 2; test xanh.

## Task 2: Compose không đọc `DATABASE_URL` từ `.env`

**File:** `docker-compose.yml`, `.env.example`, `README.md`, `.gitignore`, mới `backend/test/compose-env.spec.ts` — commit `75e5e6f`

- [x] `docker-compose.yml`: `DATABASE_URL` của service `backend` cố định `postgresql://brewlite:brewlite@db:5432/brewlite` (không còn `${…}`), kèm comment lý do.
- [x] `.env.example`: comment giải thích 2 cách chạy; `DATABASE_URL` vẫn `localhost` cho chạy rời (`npm run start:dev`).
- [x] README: compose bỏ qua `DATABASE_URL` trong `.env`; chạy rời phải đặt biến trong shell (backend không tự đọc `.env`) + bước `prisma migrate deploy`.
- [x] `.gitignore` chặn `.env` (trước chỉ chặn `.env.local`).
- [x] Test `compose-env.spec.ts` chốt 3 điều trên (backend nối `db`, `.env.example` giữ localhost, `.gitignore` có `.env`); tự `describe.skip` khi không có file ở gốc repo (chạy trong image backend).

**Xong khi:** `cp .env.example .env && docker compose up -d --build` → container backend nhận `@db:5432`, `curl /products` trả 200.

## Task 3: Thanh toán lỗi hiện câu tiếng Việt

**File:** `frontend/src/lib/payment/api-gateway.ts`, `frontend/src/lib/payment/api-gateway.test.ts` — commit `03c8aa8`

- [x] Đọc body JSON và lấy `message` (mảng thì nối bằng `, `); body không phải JSON (proxy trả HTML) thì chỉ báo mã.
- [x] 400 → "Thanh toán thất bại… Bạn có thể thử lại."; 409 → "Món đã hết hàng, tiền đã được hoàn lại."; mã khác → kèm mã + thông điệp backend. Mọi câu đều có "Giỏ hàng được giữ nguyên."
- [x] Vẫn ném `PaymentError` mang `orderId` (thử lại dùng lại đơn cũ), xử lý 401/403 giữ nguyên.
- [x] 5 test vitest: 400, 409, 400 validate dạng mảng, 404/500, body HTML — không lộ JSON thô / HTML, giữ `orderId`.

**Xong khi:** thanh toán lỗi trên trình duyệt chỉ thấy câu tiếng Việt; test vitest xanh.

## Task 4: Docs đồng bộ

**File:** `docs/user-sequence-specifications.md`, `README.md`, `docs/develop-status-report.md` — đi kèm các commit trên

- [x] `user-sequence-specifications.md` §2.4 mục A và C khớp Task 1 và Task 3.
- [x] README + `develop-status-report.md` cập nhật số test lúc đó: backend 68 pass / 1 skip, frontend 51 pass.

## Kiểm chứng cuối

- [x] Merge `--no-ff` `fix/review-3-bugs` → `develop` (`0e8773b`), không push.
- [x] Backend `npx jest` 68 pass / 1 skip, frontend `npx vitest run` 51 pass (số ghi trong commit `03c8aa8`; sau plan State Machine frontend lên 71).
- [x] Chạy lại trên `develop` HEAD `259f9ff` (2026-10-09, sau `npm ci` + `npx prisma generate`): backend `npx jest` 68 pass / 1 skip (gồm `compose-env.spec.ts` và `order-payment.integration.spec.ts`), frontend `npx vitest run` 71 pass (`api-gateway.test.ts` 11 test), `npx tsc --noEmit` sạch.
- [x] Stack thật (ghi trong commit `75e5e6f`): compose cũ + `.env` → `P1001`, `/products` không trả lời; compose mới + `.env` → `/products` 200, container nhận `postgresql://brewlite:brewlite@db:5432/brewlite`.

## Ngoài phạm vi (không làm)

- Sổ đối soát / job đối soát khi bước bù (refund, ghi `PAYMENT_FAILED`) lỗi — chỉ để ghi chú `ponytail:` trong `payment.service.ts`.
- Refund khi hủy đơn `PAID` vẫn nằm ngoài transaction (đã ghi ở `develop-status-report.md` mục 2, ý 4).

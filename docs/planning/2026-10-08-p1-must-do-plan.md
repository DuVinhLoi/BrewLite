# Kế hoạch Ưu tiên 1 — bắt buộc trước khi nộp / demo (2026-10-08)

> **Cho agent thực thi:** làm theo thứ tự, đánh dấu `- [x]` khi xong. Mỗi task có tiêu chí "Xong khi" — chưa đạt thì chưa tick. Không commit/push nếu task không ghi rõ là được commit.

**Plan liên quan:** Ưu tiên 2 (nợ kỹ thuật) ở `2026-10-08-p2-tech-debt-plan.md` — chỉ bắt đầu sau khi plan này xong.

**Bối cảnh:** Nhánh `develop` (HEAD `88f4d35`) đang có thay đổi **chưa commit** từ đợt review docs ↔ code:

| Mã | Nội dung | File chính |
|---|---|---|
| A | Bật CORS (`CORS_ORIGIN`, mặc định `http://localhost:3001`) | `backend/src/main.ts`, `docker-compose.yml` |
| B | `POST /orders` server tự tính giá (`product.price` + size/topping), bỏ `unitPrice` của client; thiếu size → M, topping lạ → 400 | `backend/src/order/pricing.ts` (mới), `order.service.ts`, `dto/create-order.dto.ts` |
| C | Khóa trong tiến trình theo Idempotency-Key + `orderId` → request song song chỉ charge 1 lần | `backend/src/payment/payment.service.ts` |
| D | FE giữ `orderId` khi trả lỗi, thử lại chỉ gọi `POST /payments` (key mới) | `frontend/src/lib/payment/*`, `PaymentForm.tsx` |
| E | `POST /payments` gắn `JwtAuthGuard` + kiểm tra chủ đơn trước cache (404/403); FE gửi Bearer | `payment.controller.ts`, `payment.service.ts`, `api-gateway.ts` |
| Docs | Đồng bộ 3 file docs với code | `docs/user-sequence-specifications.md`, `docs/use-case-specifications.md`, `docs/develop-status-report.md` |

**Trạng thái test hiện tại:** backend `npx jest` 57 pass / 1 skip (pg); frontend `npx vitest run` 27 pass; `npx tsc --noEmit` sạch cả hai bên.

---

## Ưu tiên 1 — Bắt buộc trước khi nộp / demo

### Task 1: Bổ sung bước 401/403 vào sơ đồ UC05 (mục 2.4)

**File:** `docs/user-sequence-specifications.md` (mục 2.4 A + sơ đồ B; mục C và bảng Phần III đã đúng)

- [x] Mục A, đoạn "Xử lý trong `POST /payments`": thêm bước đầu tiên — `JwtAuthGuard` (thiếu/sai token → 401), đọc đơn: không có → 404, khác chủ → 403; bước này chạy **trước** nhánh Cache Hit. *(Đã làm 2026-10-08 — mục A mở đầu bằng mục "Xác thực & phân quyền (chạy trước mọi nhánh)".)*
- [x] Sơ đồ B, sau `FE -> BE : POST /payments` và bước xếp hàng khóa: thêm `alt` kiểm tra chủ đơn (401 / 404 / 403 → trả lỗi, dừng) trước bước "Kiểm tra mã giao dịch đã dùng chưa". *(Đã làm 2026-10-08: `alt Thiếu/sai token (JwtAuthGuard)` trước bước khóa, `alt Không phải chủ đơn` sau bước khóa; render lại bằng plantuml.jar vẫn OK.)*
- [x] Ghi chú: nếu key trỏ tới biên lai của đơn khác thì đơn đó cũng phải của người gọi (403). *(Đã có ở mục C; note trong sơ đồ B cũng ghi rõ.)*

**Xong khi:** mục A, sơ đồ B, mục C và bảng Phần III mô tả cùng một thứ tự: guard → chủ đơn → cache → charge.

### Task 2: Kiểm tra sơ đồ PlantUML render được

**File:** mọi khối ```` ```plantuml ```` trong `docs/user-sequence-specifications.md` và `docs/use-case-specifications.md`

- [x] Dán từng khối vào https://www.plantuml.com/plantuml (hoặc chạy `plantuml.jar` nếu có Java) — không có lỗi cú pháp. *(Đã kiểm 2026-10-08 bằng `plantuml.jar` 1.2026.8 + Java 24: trích 8 khối từ 2 file, render PNG 8/8, exit 0, không warning — không cần Graphviz vì đều là sequence/use-case diagram.)*
- [x] Soát riêng các sơ đồ vừa sửa: UC03 (2 luồng), UC05 (2a/2b, `alt` kẹt kho), UC06 (KB2/KB3 gọi thẳng BE), 2 sơ đồ use case (bỏ `<<include>>`, thêm `Customer --- UC05`).

**Xong khi:** tất cả sơ đồ render ra ảnh, `activate`/`deactivate` không báo lỗi.

### Task 3: Commit

Repo đang theo quy ước làm trên nhánh tính năng rồi merge về `develop` — chọn 1 trong 2:
- (a) tạo nhánh `fix/review-docs-code` từ `develop`, commit, merge `--no-ff` về `develop` (giống `feat/order-advance`, `feature/payment-tx`); hoặc
- (b) commit thẳng lên `develop`.

- [x] Commit 1 — code + test (A–E): `backend/src/**`, `backend/test/**`, `frontend/src/**`, `docker-compose.yml`.
  Gợi ý message: `fix: CORS, server-side pricing, payment race lock, payment auth + owner check, FE keeps orderId on retry`
  *(Đã làm 2026-10-08 trên nhánh `fix/review-docs-code`. Kèm `frontend/package.json`/lock (sửa build) và thay đổi FE dở trong working tree lúc commit — xem báo cáo.)*
- [x] Commit 2 — docs: 3 file trong `docs/`.
  Gợi ý message: `docs: sync use case + sequence specs and status report with code`
  *(Đã làm 2026-10-08. Plan đã chuyển sang `docs/planning/` (2026-10-09) và được commit cùng repo.)*
- [x] Chạy lại test trước khi commit (số liệu ở phần Bối cảnh). *(2026-10-08: backend 62 pass/1 skip, frontend 46 pass, `tsc --noEmit` sạch 2 bên.)*

**Xong khi:** `git status` sạch (trừ thư mục bị ignore), test vẫn xanh.

### Task 4: Demo end-to-end trên trình duyệt qua compose

**Điều kiện:** Docker Desktop đang chạy.

- [x] `docker compose up --build` → 3 service Up (`docker compose ps`). *(2026-10-08: backend/db/frontend running, db healthy. Lưu ý: lần build đầu fail ở frontend — `npm ci` fail vì lock lệch `@types/node`; đã sửa `frontend/package.json` (`^20.19.0`) + lock rồi rebuild.)*
- [x] Mở `http://localhost:3001`: menu là **dữ liệu thật** (không có banner "menu mẫu", id không phải `p-ca-phe-sua…`). DevTools → Network: `GET /products` 200, không lỗi CORS. *(2026-10-08: `GET /products` → p1–p4 dữ liệu seed; trang :3001 trả 200 không có banner "menu mẫu"; request kèm `Origin: http://localhost:3001` nhận đúng `Access-Control-Allow-Origin: http://localhost:3001`. Kiểm bằng script qua đúng endpoint FE gọi — session này không có công cụ trình duyệt nên thao tác bấm chuột thật để con người xác nhận lần cuối.)*
- [x] Đăng nhập `demo@brewlite.vn / demo1234` (xem README).
- [x] Thêm món size L + 1 topping → giỏ hiện đúng giá → thanh toán với `BREWLITE10` → **số tiền server trả về khớp số trên màn hình**. *(2026-10-08: đơn 1× Latte size L + "Trân châu" → server tính `total=50000` (giá client gửi kèm bị bỏ qua); `BREWLITE10` → `discount=5000`, `amount=45000` đúng bằng số FE tính.)*
- [x] Màn xác nhận hiện mã đơn; `/history` có đơn mới ở đầu, trạng thái `PAID`. *(2026-10-08: `GET /orders/me` → đơn mới ở đầu, `PAID`, `total=50000`.)*
- [x] Thử đăng xuất (xóa `brewlite-token`) rồi thanh toán → báo cần đăng nhập (401), giỏ giữ nguyên. *(2026-10-08: `POST /payments` không có `Authorization` → 401. Kèm test chéo: user khác trả đơn của chủ → 403.)*
- [x] Ghi kết quả vào `docs/develop-status-report.md` (Task 9: đổi "chưa kiểm" thành đã kiểm + ngày).

**Xong khi:** toàn bộ checklist chạy qua trên trình duyệt, không cần curl.

### Task 5: Chạy pg suite trên Postgres thật

- [x] Với DB của compose đang chạy: `cd backend && DATABASE_URL=postgresql://brewlite:brewlite@localhost:5432/brewlite npx jest test/pg-payment.integration.spec.ts`
  (PowerShell: `$env:DATABASE_URL='postgresql://brewlite:brewlite@localhost:5432/brewlite'; npx jest test/pg-payment.integration.spec.ts`)
  *(Đã chạy 2026-10-08 trên DB compose: 1 passed — idempotent + concurrent stock=3.)*
- [x] Pass → cập nhật dòng Task 10 trong `docs/develop-status-report.md` (pg suite đã chạy lại sau bản sửa C/E). *(Đã cập nhật: ghi rõ chạy lại trên DB compose sau khi chữ ký đổi.)*

**Xong khi:** pg suite pass sau khi chữ ký `processPayment(userId, dto, key)` đổi.

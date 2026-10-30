# Report F1-DOCS — VNPAY-F1-DOCS

**Task card:** `VNPAY-F1-DOCS` (task `task_da7af175436e`) · **Hợp đồng:** [contract.md](contract.md) mục 8 (gồm đoạn "Sửa sau review (2026-10-30)") · **Nguồn change request:** [W3-DOCS-report.md](W3-DOCS-report.md) CR-1..CR-3 · **Trạng thái:** `DONE_WITH_CONCERNS` (concern: mục 4 và 5, không chặn merge)

## 1. Commit và file

- Branch của worktree: `ThuanTran260/task-da7af175-vnpay-f1`. Nền: `fc8d61c` (= `a2/payment-vnpay`). Worker không chạy lệnh đổi branch nào.
- Commit nội dung: `9ad57add10e08f60dd30361df6fa761bc6ac7ccb` — `docs(payment): align D6 docs with the review fixes`.
- Commit report: ghi file này, message `docs(payment): add VNPay F1-DOCS worker report` (report không tự chứa hash của chính nó; lấy bằng `git log -1`).

| File | Dòng đã sửa (sau commit) |
|---|---|
| `docs/requirements/srs.md` | 166 (mục 3.4), 424 (`AC-F16.9`), 425 (`AC-F16.10`), 426 (`AC-F16.11`) |
| `docs/requirements/uc-checkout.md` | 210 (E3 bước 3), 287–288 (E11 `MISMATCH`, `BAD_RESPONSE`), 292 (E11 "Đóng payment" bước 3), 294 (E11 "Kết quả"), 309 (E13 bước 1), 313 (E13 "Kết quả") |
| `docs/diagrams/sequence-checkout.puml` | 146 (ghi chú D6), 152 (ghi chú mới về `MISMATCH`/`BAD_RESPONSE`), 275–281 (đoạn `sync`), 291 (nhãn nhánh chưa kết luận), 303 (danh sách mã) |
| `docs/diagrams/activity-checkout.puml` | 133–135 (ghi chú `MISMATCH`), 145–146 (ghi chú nhánh đóng), 250 (danh sách mã) |
| `docs/diagrams/state-order.puml` | 94–95 (ghi chú `PAY_PENDING`) |
| `docs/architecture/adr/007-vnpay-sandbox.md` | 32 (mục B), 55–56 (mục E) |
| `docs/planning/2026-10-29-vnpay-payment-plan.md` | 130 (1.6 bước 2), 143–144 (1.6 bảng), 151 (1.6 câu "Đóng" và `reason`), 207 (bước 0.1), 349 (7.7d) |
| `docs/traceability-matrix.md` | 40 (FR-15), 41 (FR-16), 50 (FR-25), chỉ ô Code/API |
| `docs/planning/handoff/2026-10-29-vnpay/F1-DOCS-report.md` (mới) | File này |

Không sửa `apps/`, `tests/`, `.github/`, `package*.json`, `.svg`, `contract.md`, `ledger.md`, `docs/payment-vnpay-spike.md`, `docs/diagrams/README.md`.

## 2. Change 1–9 → file và dòng

| # | Change | File:dòng đã sửa |
|---|---|---|
| 1 | Đoạn `sync`: 502 chỉ "trong khoảng chờ"; thêm nhánh hết khoảng chờ → `FAILED` `EXPIRED`, đơn `PAYMENT_FAILED`, 200, warning `PAYMENT_EXPIRED_UNCONFIRMED`; status nghi ngờ và `MISMATCH` vẫn 502 | `sequence-checkout.puml:275-281` (nhánh 1 "Inside the grace…" → 502; nhánh 2 `MISMATCH`/`04…09` → 502; nhánh 3 "Grace elapsed…" → đóng, 200, warning), `:291` (409 chỉ "inside the grace"). Chỉ sửa nhánh có sẵn và thêm một nhánh, không vẽ lại |
| 2 | Câu "DB không đổi" thêm ngoại lệ D6 | `007-vnpay-sandbox.md:32`; `uc-checkout.md:309` (E13 bước 1), `:313` (E13 "Kết quả") |
| 3 | `MISMATCH` chỉ áp cho phản hồi `00`; mã khác (kể cả `91`) sai/thiếu merchant, TxnRef là `BAD_RESPONSE` | `srs.md:425` (`AC-F16.10`), `:426` (`AC-F16.11`); `uc-checkout.md:287-288` (E11); `007-vnpay-sandbox.md:55-56` (mục E); plan `:130` (1.6 bước 2), `:143-144` (1.6 bảng: sửa hàng `MISMATCH`, thêm hàng `BAD_RESPONSE`), `:349` (7.7d thêm ca phản hồi lỗi đã ký với `vnp_TxnRef` rỗng); `sequence-checkout.puml:146,152,275-279`; `activity-checkout.puml:133-135,145-146`; `state-order.puml:94-95`; `uc-checkout.md:294` (E11 "Kết quả") |
| 4 | `reason=<QueryDrFailure>` → `reason=<QueryFailureReason>` (gồm `QueryDrFailure` và `NOT_CONFIGURED`, `MISSING_CREATE_DATE`, `TIMEOUT`, `NETWORK`) | plan `:151`. Đã `grep -rn "reason=<" docs` (trừ `handoff/`): chỉ plan 1.6 có `reason=<QueryDrFailure>`; hai dòng `VNPAY_QUERYDR_FAILED … reason=<reason>` (plan `:153`, ADR `:60`) khớp contract mục 8 nên giữ nguyên |
| 5 | CR-1: `11`, `15` và `EXPIRED` → "Đã hết thời gian thanh toán" | `srs.md:166` (mục 3.4); `uc-checkout.md:210` (E3 bước 3); `activity-checkout.puml:250`; `sequence-checkout.puml:303` |
| 6 | E11 "Đóng payment" bước 3: khách thấy thông báo trên dòng payment ở trang chi tiết đơn | `uc-checkout.md:292` |
| 7 | CR-2: viết lại `AC-F16.9` | `srs.md:424`. `uc-checkout.md:292` ghi thêm `POST /payments` chạy lại các bước E4 từ mục 1 ngay trong lời gọi đó (201), khớp `pay` → `resolveExpired` → `tryPay` (`checkout.service.ts:109-114`) |
| 8 | CR-3: bước 0.1 "D1–D5" → "D1–D6", không đổi checkbox | plan `:207` (vẫn `- [ ]`) |
| 9 | Ma trận: ghi tên hàm thật đã merge | `traceability-matrix.md:40` (FR-15), `:41` (FR-16), `:50` (FR-25): `vnpay.ts` (`EXPIRY_GRACE_MS`, `isPastGrace`, `queryDrAction`, `unansweredQueryAction`, `verifyQueryDrResponse`), `checkout.service.ts` (`settleByQuery`), `apps/api/test/vnpay.test.ts` (chỉ phủ hàm thuần; `settleByQuery` cần Postgres nên chưa có test tự động, theo [C3-API-report](C3-API-report.md) mục 2) |

Đối chiếu code (chỉ đọc) trước khi viết:
- `vnpay.ts:125-156`: `EXPIRY_GRACE_MS`, `isPastGrace`, `queryDrAction`, `unansweredQueryAction` đúng chữ ký ở contract.
- `checkout.service.ts:169-207` (`settleByQuery`), `:98-117` (`pay`), `:69-77` (`transition`), `:151-160` (`sync`): hành vi đóng, thứ tự `resolveExpired` → `tryPay` và 409/502 khớp mô tả.
- **Code đã merge chưa theo đoạn "Sửa sau review":** `vnpay.ts:107` vẫn trả `MISMATCH` cho mọi mã khi sai merchant/TxnRef. Tài liệu viết theo contract; card F1-API chạy song song sẽ đổi code.

## 3. Lệnh acceptance và kết quả thật

Chạy từ gốc worktree, sau commit nội dung `9ad57ad`.

| Lệnh / kiểm | Kết quả |
|---|---|
| Render: `java -DPLANTUML_LIMIT_SIZE=20000 -jar <plantuml.jar> -charset UTF-8 -tsvg -o <scratchpad>/render docs/diagrams/state-order.puml docs/diagrams/activity-checkout.puml docs/diagrams/sequence-checkout.puml` (`<plantuml.jar>` là đường dẫn trong card; `<scratchpad>` là thư mục scratchpad của session) | exit 0; 3 `.svg` ở scratchpad (30 KB, 111 KB, 167 KB). `grep -c "Syntax Error"` = `0` cả 3. `grep -c BAD_RESPONSE` = 1 ở mỗi `.svg` (nhãn mới có trong ảnh). `git status` không có ảnh trong repo |
| `grep -rn "chờ spike" docs --include=*.md --include=*.puml \| grep -v "docs/planning/handoff/"` | **1 dòng**: `docs/payment-vnpay-spike.md:43` ("…Đã gỡ nhãn chờ spike."). Không phải nhãn; là câu nói đã gỡ nhãn, ở file ngoài allowed paths. Chưa đạt "không còn kết quả": xem CR-F1-1. Trong allowed paths: 0 dòng |
| `grep -n "chưa có code" docs/traceability-matrix.md` | 2 dòng: `:5` (ghi chú đầu file) và `:39` (FR-14). Cả hai không chứa "D6" (`grep -c D6` = 0); dòng FR-15, FR-16, FR-25 (`:40`, `:41`, `:50`) không còn |
| AC trong dòng thêm (`git diff -U0 a2/payment-vnpay \| grep '^+'`, lấy `AC-[FN]\d+\.\d+`, đối chiếu `^  - AC-…:` trong `srs.md`) | 19 mã khác nhau; 18 có định nghĩa. Mã không có: `AC-F16.13`, nằm trong phần **không đổi** của dòng ma trận FR-25 (`:50`, "dời từ `AC-F16.13`"), là câu nhắc mã đã bỏ, có sẵn từ trước. Không thêm mã AC mới |
| Mã FR/BR/UC/E/A/ADR trong dòng thêm | Không mã mới. Toàn bộ có sẵn trước đó và có trong contract: `D6`, `E11`, `E13`, `E4`, `E3`, `E10`, `E9`, `E12`, `A3`, `A5`, `A6`, `BR-05`, `BR-10`, `BR-11`, `FR-15/16/25`, `UC-04`, `ADR-007` (khi được dẫn). `BAD_RESPONSE` là giá trị `QueryDrFailure` trong code và contract mục 8, không phải mã đánh số của tài liệu |
| `git diff --check a2/payment-vnpay...HEAD` | sạch (exit 0) |
| `git diff --name-only a2/payment-vnpay...HEAD` (sau commit nội dung) | 8 file, đều trong allowed paths: ADR-007, ba `.puml`, plan, `srs.md`, `uc-checkout.md`, ma trận. Sau commit report thêm file này |
| Link tương đối trong dòng thêm | Không thêm link nào (`grep -oE '\]\([^)]+\)'` trên dòng thêm: rỗng) |
| Quét dòng thêm tìm `secret =`, `SecureHash=<hex>`, `TmnCode=`, `password`, chuỗi hex ≥ 64 ký tự, URL kèm `vnp_` | không khớp |
| `git log -3 --format=%B \| grep -ci co-authored-by` | 0 |
| `git status --porcelain` (trước khi viết report) | sạch |

## 4. Chỗ đã gỡ "(chờ spike)"

Card này không gỡ thêm: W3-DOCS đã gỡ hết ([W3-DOCS-report](W3-DOCS-report.md) mục 4), và F1-DOCS không gắn lại nhãn nào. Còn lại đúng một chuỗi "chờ spike" ngoài `handoff/`, mô tả việc đã gỡ nhãn, ở `docs/payment-vnpay-spike.md:43` (CR-F1-1).

## 5. Change request (ngoài vùng đã khai, chưa sửa)

- **CR-F1-1: `docs/payment-vnpay-spike.md:43`** (file của Integrator). Cũ: `` …đều thành `FAILED`). Đã gỡ nhãn chờ spike. `` Mới: `` …đều thành `FAILED`). Nhãn tạm cho điểm này đã được gỡ. `` Lý do: acceptance riêng của card yêu cầu `grep "chờ spike"` không còn kết quả; câu hiện tại làm grep còn đúng một dòng dù không còn nhãn.
- **CR-F1-2: `docs/diagrams/sequence-checkout.puml:167-168`** (khối E11 của `POST /payments`, ngoài đoạn `sync` và ghi chú `MISMATCH` đã khai). Cũ: `else QueryDR failed: network, signature or configuration (E13)` / `API --> UI : 502 PAYMENT_PROVIDER_ERROR; DB and Order unchanged`. Mới: `else QueryDR failed inside the grace: network, signature or configuration (E13)` / `API --> UI : 502 PAYMENT_PROVIDER_ERROR; DB and Order unchanged (past the grace the Payment is closed, D6)`. Lý do: cùng lỗi "DB không đổi" chưa có ngoại lệ D6 như finding 4; hết khoảng chờ thì lỗi QueryDR đóng payment chứ không còn 502. Nhánh "No open Payment: create a new attempt" (`:177`) đã bao phần tạo lần thử mới sau khi đóng.
- **CR-F1-3: `docs/traceability-matrix.md:5`, `:39`** (ngoài ba ô đã khai).
  - `:5` ghi "Code hiện hành vẫn là simulator cũ (`apps/api/src/checkout/payment.ts`, xóa ở bước 5.7)" và "chưa có code hay kết quả thật". Hiện code VNPay đã merge và `payment.ts` không còn trong `apps/api/src/checkout/`.
  - `:39` (FR-14) còn "Dự kiến, bước 5–6 (chưa có code)" cho `POST /payments`, IPN, return.
  - Cột kiểm chứng của FR-15, FR-16, FR-25 còn "Dự kiến, chưa chạy" dù [C3-API-report](C3-API-report.md) mục 2 ghi `node --import tsx --test test/vnpay.test.ts` → `tests 84, pass 84, fail 0`.
  - Đề xuất: Integrator rà lại các ô này khi chốt Wave 3.
- **Ghi nhận, không sửa (vẫn đúng):**
  - `srs.md:182` (`BR-10`), plan `:199` (D6), `:368` (rủi ro), ADR `:94` (ca biên) và `state-order.puml:56` nhắc `MISMATCH` mà không kèm "chỉ áp cho `00`". Chúng không mâu thuẫn với định nghĩa đã giới hạn ở `AC-F16.10/11`, UC E11, ADR mục E và plan 1.6, nhưng nằm ngoài vùng đã khai.
  - Dạng log `PAYMENT_RECONCILIATION_REQUIRED vnp_TxnRef=<id> reason=MISMATCH` mà C3-API thêm ([C3-API-report](C3-API-report.md) mục 6, concern 1) chưa có trong SRS/contract. Sơ đồ `sync` mới ghi chung "reconciliation warning".

## 6. Chỗ cần nhóm quyết định và rủi ro

- **Quyết định:**
  - Áp CR-F1-1..3 hay không (CR-F1-1 là điều kiện để acceptance `grep "chờ spike"` đạt đúng chữ).
  - Có ghi dạng log warning của `MISMATCH` vào SRS/contract không (xem "Ghi nhận" ở mục 5).
- **Rủi ro 1:** tài liệu đã theo "Sửa sau review" (`BAD_RESPONSE`), code ở `a2/payment-vnpay` chưa (`vnpay.ts:107`). Tới khi card F1-API merge, tài liệu và code lệch nhau ở đúng điểm này. Khi F1-API xong cần đối chiếu tên `BAD_RESPONSE` và thứ tự kiểm trong `verifyQueryDrResponse`.
- **Rủi ro 2:** thông báo "Đã hết thời gian thanh toán" trên dòng payment ở trang chi tiết đơn (E11 "Đóng payment" bước 3) mô tả điều F1-API sẽ cài, theo contract. Tôi chưa kiểm tra web (card cấm sửa `apps/`, và chỉ đọc `vnpay.ts`, `checkout.service.ts`); `apps/web/src/lib/shop.ts:27` đã ánh xạ `11`/`15`/`EXPIRED` sang "Đã hết thời gian thanh toán" (đã đọc), nhưng việc gọi `vnpayMessage` ở màn chi tiết đơn là phần của F1-API và chưa có ở nền này.
- **Rủi ro 3:** các `.svg` của sơ đồ vẫn chưa xuất lại, nên ảnh trong repo chưa phản ánh D6 và đoạn sửa này. Render chỉ xác minh cú pháp, không chứng minh hành vi.
- **Rủi ro 4:** các nhánh `alt` mới ở `sequence-checkout.puml` `sync` (dòng 275–281) liệt kê điều kiện dài trong nhãn `alt`; render được nhưng nhãn rộng. Nếu nhóm muốn gọn hơn thì tách điều kiện sang `note`.
- **Chưa làm:** không chạy npm, docker, dev server, graphify; không kiểm hành vi runtime (card chỉ tài liệu); plan 1.3 vẫn chưa tick vì QueryDR sandbox chưa hồi phục.

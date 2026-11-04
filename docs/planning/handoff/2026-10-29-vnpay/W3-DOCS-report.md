# Report W3-DOCS — VNPAY-W3-DOCS

**Task card:** `VNPAY-W3-DOCS` (task `task_f0cf1e5d38b6`) · **Kế hoạch:** [vnpay-payment-plan](../../2026-10-29-vnpay-payment-plan.md), mục 1.6, 1.7, 2 (D6), bước 1, 7.7b, 7.7d, mục 4 · **Hợp đồng:** [contract.md](contract.md) mục 6 và 8 · **Trạng thái:** `DONE_WITH_CONCERNS` (concern: mục 5 và 6, không chặn merge)

## 1. Commit và file

- Branch của worktree: `ThuanTran260/docs-vnpay-w3`. Lúc bắt đầu `git branch --show-current` trả `ThuanTran260/langostino`, sau đó Orca đổi tên (cùng HEAD `a5164b3`); worker không chạy lệnh đổi branch nào.
- Nền: `a5164b3` (= `a2/payment-vnpay`).
- Commit nội dung: `78273aecb63ca886b8fabdc2f882f89f5934b8d1` — `docs(payment): close expired VNPay payments after a 15-minute grace (D6)`.
- Commit report: ghi file này, message `docs(payment): add VNPay W3-DOCS worker report` (report không tự chứa hash của chính nó; lấy bằng `git log -1`).

| File | Nội dung chính |
|---|---|
| `docs/requirements/srs.md` | Ghi chú mục 1.4 (VNPay sandbox, ý D6, gỡ nhãn); đoạn "Hạn thanh toán 15 phút" (mục 3.4); `BR-10`; mô tả `EXPIRED` ở mục trạng thái thanh toán; vòng đời `Payment`; `AC-F15.1`, `AC-F15.8`, `AC-F16.10` (viết lại), `AC-F16.11` (thêm ngoại lệ) |
| `docs/requirements/uc-checkout.md` | Chú giải đầu file; bảng hậu điều kiện thất bại (thêm hàng E11 hết khoảng chờ); A5; E3 (gỡ nhãn); E10 mục 4; E11 (viết lại); bảng BR mục 8 (`BR-10`); bảng mục 9 (hàng E11) |
| `docs/diagrams/state-order.puml` | Ghi chú `PAY_PENDING`, `PAY_FAILED` và hai ghi chú của đơn `PENDING` |
| `docs/diagrams/activity-checkout.puml` | Nhánh E11 có sẵn (nhãn, ghi chú), nhánh IPN `02`, dòng `sync` |
| `docs/diagrams/sequence-checkout.puml` | Ba nhánh `alt` QueryDR có sẵn trong giao dịch T3 của E11; ghi chú IPN `02` |
| `docs/diagrams/README.md` | Câu về nhãn chờ spike |
| `docs/architecture/adr/007-vnpay-sandbox.md` | Mục B (gỡ nhãn); mục E (viết lại danh sách mã, thêm D6, đánh đổi, phương án đã cân nhắc); hệ quả: R-15, ca biên D6, bullet kết quả spike thay "Còn ba điểm chờ spike" |
| `docs/planning/2026-10-29-vnpay-payment-plan.md` | Mục 2 (D6); mục 1.6 (bảng thêm cột "Hết khoảng chờ (D6)", ba đoạn khoảng chờ / đóng / log); mục 1.7 (`15`, `EXPIRED`); "Điều kiện qua" bước 1; 7.7b, 7.7d; hai gạch mục 4. Không đổi checkbox |
| `docs/traceability-matrix.md` | Dòng FR-15, FR-16, FR-25 (3 dòng bảng đổi, +3/−3; cột thiết kế, Code/API và kiểm chứng) |
| `docs/planning/handoff/2026-10-29-vnpay/W3-DOCS-report.md` (mới) | File này |

Không sửa `apps/`, `tests/`, `.github/`, `package*.json`, `.svg`, `contract.md`, `ledger.md`, `docs/payment-vnpay-spike.md`, `context-and-scope.md`.

## 2. Đã đổi gì (theo card)

- **AC-F16.10** viết lại theo bảng D6: chưa kết luận (`00/01`, `00` kèm status thiếu/chưa hỗ trợ, mã truy vấn khác, phản hồi không xác thực được); chưa hết khoảng chờ thì giữ `PENDING` (409 cho `00/01`, 502 cho phần còn lại); hết khoảng chờ (`now >= expiresAt + 15 phút`, `now` là lúc gửi QueryDR) thì `FAILED`, `gatewayResponseCode = "EXPIRED"`, `gatewayTransactionStatus = null`, đơn `PAYMENT_FAILED`, kho không đổi, warning `PAYMENT_EXPIRED_UNCONFIRMED`. Chỉ đóng khi có lời gọi (`POST /payments`, hủy đơn, `sync`), không có job nền. IPN tới sau theo `AC-F15.7`. Không còn nhãn.
- **AC-F16.11:** giữ 502 trong khoảng chờ; thêm ngoại lệ "hết khoảng chờ thì đóng theo AC-F16.10", trừ `04/05/06/07/09` và `MISMATCH` (không bao giờ tự đóng). Ghi rõ việc đóng là chính sách hết hạn của ứng dụng, `94`/`99` không phải bằng chứng thất bại. Phản hồi không chữ ký ghi `reason=UNSIGNED`.
- **AC-F15.8:** gỡ nhãn, ghi "spike chưa quan sát được `91`; lối ra theo AC-F16.10". **AC-F15.1:** gỡ nhãn, ghi spike xác nhận `24/02` và `15/02`.
- **BR-10**, đoạn "Hạn thanh toán 15 phút", ghi chú mục 1.4: thêm vế đóng sau khoảng chờ (ghi chú mục 1.4 chỉ thêm một ý ngắn về D6).
- **UC-04 E11:** thêm mục "Khoảng chờ (D6)", tách các nhánh theo bảng D6, mục "Đóng payment (hết khoảng chờ)": khách thấy đơn `PAYMENT_FAILED` với "Đã hết thời gian thanh toán", chọn thử lại (A3) hoặc hủy (A5).
- **Sơ đồ:** chỉ sửa nhãn nhánh và ghi chú có sẵn, không thêm/bớt bước vẽ. Mọi "(chờ spike)" đã gỡ.
- **ADR-007 §E:** thêm quyết định D6 (khoảng chờ, định nghĩa "đóng", log `VNPAY_QUERYDR_FAILED` / `UNSIGNED`, lý do, đánh đổi, hai phương án đã cân nhắc). Bullet "Còn ba điểm chờ spike" thay bằng "Kết quả spike (2026-10-30)".
- **Plan:** các điểm ở allowed paths đã làm. 7.7b, 7.7d: kỳ vọng mới (trong khoảng chờ 409/502; quá `expiresAt + 15 phút` thì `FAILED EXPIRED`; sandbox trả `99` đủ để kiểm 7.7b).
- **Ma trận:** cột Code ghi `apps/api/src/payment/vnpay.ts` (`EXPIRY_GRACE_MS`, `isPastGrace`, `queryDrAction`, `unansweredQueryAction`) và `apps/api/src/checkout/checkout.service.ts` (`settleByQuery`), gắn "card C3-API, chưa có code" vì các tên D6 chưa có trong `apps/api/src` (đã grep).

## 3. Lệnh acceptance và kết quả thật

Chạy từ gốc worktree sau commit nội dung.

| Lệnh / kiểm | Kết quả |
|---|---|
| `grep -rn "chờ spike" docs --include=*.md --include=*.puml \| grep -v "docs/planning/handoff/" \| grep -v "docs/payment-vnpay-spike.md"` | 0 dòng (`\| wc -l` → `0`). Cũng không file `.svg` nào trong `docs` chứa "chờ spike" |
| Render `.puml` đã sửa (3 file: `state-order`, `activity-checkout`, `sequence-checkout`; card nói 4 file, nhưng `README.md` không phải `.puml`) | Lệnh: `java -DPLANTUML_LIMIT_SIZE=20000 -jar <plantuml.jar> -charset UTF-8 -tsvg -o <scratchpad>/render docs/diagrams/state-order.puml docs/diagrams/activity-checkout.puml docs/diagrams/sequence-checkout.puml`. Sinh 3 `.svg` ở scratchpad (110 KB, 164 KB, 30 KB); `grep -c "Syntax Error"` = 0 cả 3; `git status` không có ảnh trong repo. PlantUML 1.2026.8, Java 24.0.2 |
| Mã AC được dẫn chiếu trong các dòng thêm (`grep -oE 'AC-[FN][0-9]+\.[0-9]+'`, đối chiếu `^  - <mã>:` trong `srs.md`) | 20 mã khác nhau; 18 có định nghĩa. Hai mã không có là `AC-F16.7` và `AC-F16.13`: cả hai chỉ là câu nhắc có sẵn từ trước về mã đã bỏ/dời (SRS mục 1.4 dòng VNPay; ma trận FR-25), không phải tham chiếu mới |
| Tên trong contract mục 8 | Có trong các dòng thêm: `EXPIRY_GRACE_MS` (5 file), `isPastGrace` (6 file), `queryDrAction` (3 file), `unansweredQueryAction` (3 file), `PAYMENT_EXPIRED_UNCONFIRMED` (8 file), `UNSIGNED` (4 file), `QueryDrFailure`, `VNPAY_QUERYDR_FAILED` |
| `git diff --check a2/payment-vnpay...HEAD` | sạch (exit 0) |
| `git diff --name-only a2/payment-vnpay...HEAD` (sau commit nội dung) | 9 file: ADR-007, `diagrams/README.md`, ba `.puml`, plan, `srs.md`, `uc-checkout.md`, ma trận. Sau commit report thêm file này |
| Link tương đối trong dòng thêm (vòng lặp `[ -e ]` theo thư mục của từng file) | 9 link, đều tồn tại (`../payment-vnpay-spike.md`, `../../payment-vnpay-spike.md`, `../planning/...plan.md`, `../../planning/...plan.md`, `handoff/2026-10-29-vnpay/contract.md`) |
| Quét dòng thêm tìm credential gán giá trị, `vnp_SecureHash=<hex>`, `TmnCode=`, private key | không có. Khớp duy nhất là regex chuỗi số dài vào tên migration cũ `20261029100001_vnpay_pending_index` trong dòng FR-16 của ma trận (không phải credential, có sẵn từ trước) |
| `git log -5 --format=%B \| grep -ci co-authored-by` | 0 |
| `git status --porcelain` trước khi viết report | sạch |

## 4. Chỗ đã gỡ "(chờ spike)"

- `docs/requirements/srs.md`: mục 1.4 dòng VNPay (cụm "mang nhãn chờ spike", viết lại), `AC-F15.1`, `AC-F15.8`, `AC-F16.10`.
- `docs/requirements/uc-checkout.md`: chú giải đầu file, E3 (kích hoạt), E11 hai gạch.
- `docs/diagrams/state-order.puml`: hai ghi chú. `activity-checkout.puml`: ba chỗ. `sequence-checkout.puml`: ba chỗ. `README.md`: một câu.
- `docs/architecture/adr/007-vnpay-sandbox.md`: mục B, mục E (hai gạch), bullet "Còn ba điểm chờ spike".
- Không đụng `docs/payment-vnpay-spike.md` (Integrator sửa) và `docs/planning/handoff/*`.

## 5. Change request (ngoài vùng đã khai, chưa sửa)

- **CR-1: `docs/requirements/srs.md` mục 3.4, bullet "Mã kết quả của VNPay để hiển thị"** (và `docs/requirements/uc-checkout.md` E3, bước 3). Cũ: `` `11` hết thời gian thanh toán; `` (E3: `` `11` hết thời gian thanh toán, ``). Mới: `` `11`, `15` và `EXPIRED` (payment bị đóng quá hạn) hết thời gian thanh toán ("Đã hết thời gian thanh toán"); ``. Lý do: contract mục 8 (Web) cho `15` và `EXPIRED` dùng thông báo như `11`; plan 1.7 đã thêm hai mã, SRS 3.4 và E3 vẫn chỉ nêu `11`. Card chỉ cho sửa plan 1.7. `AC-F15.4` dẫn "theo mã VNPay ở mục 3.4" nên tự khớp sau khi sửa.
- **CR-2: `docs/requirements/srs.md`, `AC-F16.9`.** Cũ: "...chưa kết luận thì giữ `PENDING`, trả 409 `PAYMENT_IN_PROGRESS` và không tạo URL mới (UC-04 E11)." Mới: "...chưa kết luận mà còn trong khoảng chờ 15 phút thì giữ `PENDING`, trả 409 `PAYMENT_IN_PROGRESS` (hoặc 502 theo AC-F16.11) và không tạo URL mới; hết khoảng chờ thì đóng theo AC-F16.10 rồi xét như đã thất bại (UC-04 E11)." Lý do: câu cũ không nêu giới hạn khoảng chờ, dễ đọc thành "giữ mãi". Không mâu thuẫn trực tiếp vì `AC-F16.10` đã nói rõ.
- **CR-3: `docs/planning/2026-10-29-vnpay-payment-plan.md`, bước 0.1.** Cũ: "Ghi nhận D1–D5". Mới: "Ghi nhận D1–D6". Lý do: mục 2 nay có D6. Card cấm đổi checkbox nên không sửa dòng này.
- **Ghi nhận, không sửa (vẫn đúng):** `uc-checkout.md` mục 10 (gợi ý test E10/E11/E13) và plan bước 5.2/5.4 chưa nêu khoảng chờ; chúng không mâu thuẫn D6. C3-API nên đọc contract mục 8 và plan 1.6 khi viết `test/vnpay.test.ts`.

## 6. Chỗ cần nhóm quyết định và rủi ro

- **Quyết định:**
  - Áp CR-1 đến CR-3 hay không (CR-1 làm web, SRS và UC đồng nhất thông báo).
  - Khi `POST /payments` gặp payment bị đóng bởi chính lời gọi đó: tài liệu viết "xét lại từ E4 mục 1" (có thể tạo lần thử mới ngay trong lời gọi, theo BR-05 bước 3). Contract không nói rõ lời gọi đó trả gì. Nếu C3-API làm khác (ví dụ trả 409 một lần), cần sửa UC E11 mục "Đóng payment", bước 3.
- **Rủi ro 1:** tên D6 trong tài liệu (`EXPIRY_GRACE_MS`, `isPastGrace`, `queryDrAction(..., pastGrace)`, `unansweredQueryAction`) khớp contract nhưng code chưa có; ma trận gắn "card C3-API, chưa có code". Khi C3-API xong, cần rà lại chữ ký hàm.
- **Rủi ro 2:** `settleByQuery` có trong code (`checkout.service.ts:166`) nhưng contract mục 8 không liệt kê tên này; card yêu cầu ghi nó ở cột Code của ma trận nên đã ghi. Nếu C3-API đổi tên, sửa ma trận.
- **Rủi ro 3:** các `.svg` của sơ đồ vẫn chưa xuất lại, nên ảnh trong repo chưa phản ánh D6 (README sơ đồ đã nói rõ). Render chỉ xác minh cú pháp, không chứng minh hành vi.
- **Rủi ro 4:** D6 mới đóng được ca QueryDR lỗi; ca biên (khách trả sát giờ, IPN mất hơn 15 phút) đóng đơn khi tiền đã trừ, đã ghi ở ADR-007 và plan mục 4: dựa vào hai warning và hoàn tiền tay.
- **Chưa làm:** không chạy npm, docker, dev server, graphify; không kiểm hành vi runtime (card chỉ tài liệu); plan 1.3 vẫn chưa tick vì QueryDR sandbox chưa hồi phục.

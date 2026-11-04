# Report W1-ADR — VNPAY-W1-ADR

**Task card:** `VNPAY-W1-ADR` (task `task_374187cfaba1`) · **Kế hoạch:** [vnpay-payment-plan](../../2026-10-29-vnpay-payment-plan.md), bước 4.1–4.2 · **Hợp đồng:** [contract.md](contract.md) · **Trạng thái:** `DONE_WITH_CONCERNS` (chỉ tài liệu; các điểm cần nhóm quyết định ở mục 4)

## 1. Commit và file

- Branch của worktree: `ThuanTran260/vnpay-w1-adr`. Lúc bắt đầu `git branch --show-current` trả `ThuanTran260/corbina`, sau đó Orca đổi tên (cùng HEAD `3b62845`); worker không chạy checkout hay đổi tên branch.
- Nền: `3b62845` (= `a2/payment-vnpay`).
- Commit nội dung: `d9a0b20339579c7fef2598e322b410478690858a` — `docs(payment): record VNPay sandbox decision in ADR-007 and ADR-005`.
- Commit report: ghi file này, message `docs(payment): add VNPay W1-ADR worker report` (report không tự chứa hash của chính nó; lấy bằng `git log -1`).

| File | Bước | Nội dung chính |
|---|---|---|
| `docs/architecture/adr/007-vnpay-sandbox.md` (mới) | 4.1 | `# ADR-007: Tích hợp VNPay sandbox`, `Proposed 2026-10-29`. Bối cảnh; quyết định A–G (redirect + IPN + QueryDR, một hàm `applyGatewayResult`, HTTP ra VNPay ngoài transaction, partial unique index, `PENDING` quá hạn và hủy đơn, idempotency khi đang chờ, cấu hình kiểm theo thao tác); hệ quả; phương án đã loại (giữ simulator, Stripe test, và 7 phương án con) |
| `docs/architecture/adr/005-idempotency-and-optimistic-lock.md` | 4.2 | Bối cảnh; §A viết lại theo BR-05 (thứ tự 5 bước, replay `SUCCESS`/`PENDING`), BR-10 và index `payments_one_pending_per_order`; §B ghi đã được ADR-007 thay; §C chỉ thêm một câu (trừ kho nay ở bước áp kết quả IPN/QueryDR); Hệ quả và Phương án đã loại sửa theo; thêm mục "Lịch sử thay đổi" 2026-10-29 |
| `docs/architecture/adr/README.md` | 4.2 | Hàng ADR-005 sửa mô tả và trạng thái; thêm hàng ADR-007 |
| `docs/architecture/README.md` | 4.2 | Hàng ADR-005 sửa mô tả; thêm hàng ADR-007; sửa một bullet ở "Quy ước duy trì" (xem mục 3) |
| `docs/architecture/architecture.md` | 4.2 | Chỉ ghi chú đầu file (dòng 5) và hai hàng ADR-005, ADR-007 ở bảng mục 6 (dòng 166–167) |

Không sửa `srs.md`, `uc-checkout.*`, `docs/diagrams/*`, `deployment.*`, `context-and-scope.md`, `traceability-matrix.md`, ADR-001..004, 006, `.svg`, `apps/`, `tests/`, `.github/`, `package*.json`.

## 2. Kết quả các lệnh acceptance (đo trên commit `d9a0b20`)

1. **`git diff --check a2/payment-vnpay...HEAD`** → không có output, `exit=0`. (Git chỉ in cảnh báo `LF will be replaced by CRLF` do `core.autocrlf` của máy Windows; không phải lỗi whitespace.)
2. **`git diff --name-only a2/payment-vnpay...HEAD`** → đúng 5 file, đều trong allowed paths:
   `docs/architecture/README.md`, `docs/architecture/adr/005-idempotency-and-optimistic-lock.md`, `docs/architecture/adr/007-vnpay-sandbox.md`, `docs/architecture/adr/README.md`, `docs/architecture/architecture.md`. Sau commit report chỉ thêm `W1-ADR-report.md`.
3. **Acceptance riêng — `architecture.md`:** `git diff a2/payment-vnpay...HEAD --stat -- docs/architecture/architecture.md` → `1 file changed, 3 insertions(+), 3 deletions(-)`. Xem hunk bằng `git diff -U0`: đúng hai vùng.
   - `@@ -5 +5 @@` — ghi chú đầu file: "ADR-007 (chưa soạn)" → link `[ADR-007](adr/007-vnpay-sandbox.md) (Proposed, chờ nhóm duyệt)`; câu "ADR-005 ... cập nhật ở bước sau" → "ADR-005 đã sửa theo ADR-007, phần SRS và truy vết cập nhật ở bước sau".
   - `@@ -166,2 +166,2 @@` — bảng mục 6: hàng ADR-005 viết lại (bỏ "gọi simulator", bỏ "API dừng giữa bước 13 và 14 là rủi ro chấp nhận"), hàng ADR-007 đổi "(chưa soạn)" thành link.
   - Không có hunk nào khác.
4. **Acceptance riêng — `grep -rn "ADR-007" docs/architecture`:** 5 file có nhắc (`005-…md`, `007-vnpay-sandbox.md`, `adr/README.md`, `architecture.md`, `README.md`). Mọi link trỏ `007-vnpay-sandbox.md` / `adr/007-vnpay-sandbox.md` đều tới file tồn tại. `grep -rn "chưa soạn" docs/architecture` → rỗng (`exit=1`).
5. **Link tương đối mới.** Quét các dòng thêm của diff, kiểm `[ -f ]` theo thư mục của file chứa link: 14/14 `OK`, 0 `MISS`. Gồm `../../deployment.md`, `../../planning/2026-10-29-vnpay-payment-plan.md`, `../../requirements/srs.md`, `005-…md`, `006-…md`, `007-vnpay-sandbox.md`, `adr/007-vnpay-sandbox.md`, `adr/005-…md`, `../planning/2026-10-29-vnpay-payment-plan.md`.
6. **Quét credential** trên các dòng thêm (regex: `secure_?hash`, `vnp_TmnCode=`, tên `VNP_*`/`SECRET`/`PASSWORD`/`TOKEN` gán giá trị, chuỗi hex ≥64, chuỗi số 13–19 chữ số, private key, URL chứa `vnp_`/`SecureHash`) → chỉ khớp `vnp_TransactionStatus = 02` (2 lần), là mã trạng thái chứ không phải credential. Tên `VNP_TMN_CODE`, `VNP_HASH_SECRET` xuất hiện chỉ dạng tên. Không có giá trị secret, TmnCode, số thẻ hay URL có chữ ký.
7. **Mã mới trong dòng thêm.** Liệt kê bằng `grep -oE`. Toàn bộ nằm trong contract hoặc đã có sẵn trong repo; **không có mã mới**:
   - theo contract: `BR-10`, `BR-11`, `BR-05`, `FR-31`, `NFR-03`, `ADR-007`, luồng `A5`, `A6`, `E3`, `E4`, `E8b`, `E9`, `E10`, `E11`, `E12`, `E13`, `R-13`, `R-14`, `R-15` (đã có ở W0);
   - đã có trước: `BR-03`, `FR-13`, `FR-14`, `NFR-07`, `NFR-08`, `NFR-12`, `NFR-13`, `NFR-17`, `UC-04`, `AC-F14.3`, `AC-F16.1`, `AC-F16.4`, `AC-F16.5`, `ADR-005`, `ADR-006`.
   - Không đặt AC mới (việc của SRS).
8. **`git status --porcelain`** sau commit nội dung → rỗng.

Chưa chạy (ngoài phạm vi card): PlantUML (không đụng `.puml`), build/lint/test, `npm`, `docker`, `graphify`.

## 3. Việc đã làm ngoài các dòng card nêu tên

- `docs/architecture/adr/README.md`: bỏ dòng trống nằm giữa hàng 005 và 006. Dòng trống đó làm bảng bị tách, nên hàng 006 và hàng 007 mới thêm sẽ hiển thị như chữ thường thay vì hàng bảng. Dễ hoàn tác nếu Integrator muốn giữ nguyên.
- `docs/architecture/README.md`, "Quy ước duy trì": bullet "API dừng giữa bước 13 và 14 của UC-04 là rủi ro chấp nhận vì thanh toán chỉ mô phỏng" viết lại thành mô tả VNPay/ADR-007. Card chỉ nêu "thêm dòng ADR-007, sửa mô tả ADR-005", nhưng bullet này là bản sao đúng nội dung ADR-005 đã bị bỏ; để nguyên thì vi phạm ràng buộc "không còn câu mô tả simulator như hành vi hiện tại".
- ADR-005 thêm mục "Lịch sử thay đổi" và một câu ở §C; card cho phép ghi lịch sử, câu ở §C chỉ phản ánh việc trừ kho đã chuyển sang bước áp kết quả IPN/QueryDR.

## 4. Gắn "(chờ spike)" (contract mục 6)

Tất cả trong `docs/architecture/adr/007-vnpay-sandbox.md`, đúng ba điểm:

1. QueryDR `00/01` sau hạn và lối thoát cho ca bỏ dở — §E (dòng 53).
2. QueryDR `91` sau hạn → `FAILED`, `gatewayResponseCode = "EXPIRED"` — §E (dòng 54).
3. IPN coi là thất bại khi `vnp_TransactionStatus = 02`, kể cả khách hủy (`24`) — §B (dòng 31).

Mục "Hạn chế" (dòng 87) nhắc lại ba điểm này trong một bullet tổng hợp, không thêm điểm thứ tư. ADR-005 không nhắc các điểm này nên không gắn nhãn.

## 5. Change request

Không có. Mọi sửa đổi nằm trong allowed paths.

## 6. Chỗ cần nhóm quyết định

1. **Lý do loại Stripe test** (ADR-007, "Phương án đã loại") do worker lập luận: nhóm đã đăng ký VNPay sandbox, Stripe cần tài khoản/SDK mới, cũng bất đồng bộ qua webhook, VND nội địa phù hợp hơn. Plan chỉ yêu cầu "nêu lý do loại" chứ không cho sẵn lý do; nhóm xác nhận hoặc thay bằng lý do thật của nhóm.
2. **Trạng thái ADR-007** giữ `Proposed 2026-10-29`. Khi nhóm duyệt và spike xong (bước 1.3–1.4), Integrator đổi sang `Accepted`, gỡ nhãn "(chờ spike)" hoặc sửa mục E, và rà lại bullet "Còn ba điểm chờ spike".
3. **Lập luận "tránh giữ khóa vì thời gian VNPay không kiểm soát được"** (ADR-007 §C) nối với con số "simulator tối đa 500 ms" của ADR-005 cũ. Con số 500 ms vẫn còn trong SRS (AC-N03.1) cho tới khi worker SRS sửa; ADR-007 không phụ thuộc vào con số đó.
4. **Tham chiếu "quyết định D3, D4 của kế hoạch VNPay"** trong ADR-007 là mã trong plan, không phải mã yêu cầu. Chúng khác "handoff D2/D3" của ADR-005. Nếu nhóm thấy dễ nhầm, đổi sang mô tả bằng chữ.
5. **Trích dẫn mã luồng UC-04** (`A5`, `A6`, `E3`, `E4`, `E8b`, `E9`–`E13`) theo contract. Chúng chỉ thực sự tồn tại trong `uc-checkout.md` sau khi worker use-case xong; nếu worker đó đổi mã thì ADR-007 và ADR-005 phải đổi theo.

## 7. Rủi ro và việc còn lại

- **Chưa đồng bộ với tài liệu khác** cho tới khi các worker song song và Integrator hoàn tất: `srs.md` (BR-05 mới, BR-10/BR-11, AC, §3.4 vẫn mô tả simulator), `uc-checkout.*`, `docs/diagrams/*`, `docs/traceability-matrix.md` (chưa có hàng ADR-007). ADR-005 và ADR-007 hiện đi trước SRS.
- **`architecture.md` còn một câu ngoài vùng được sửa** nhắc "AC-N03.1 và câu 'simulator trả trong 500 ms' trong SRS cần nhóm cập nhật" (mục NFR-03, dòng 94). Câu này đúng cho tới khi SRS sửa; không đụng theo allowed paths.
- **Chưa có bằng chứng sandbox:** mọi hành vi VNPay trong ADR-007 lấy từ plan (đặc tả đích), chưa đo. Ba điểm chờ spike là phần dễ đổi nhất.
- **Ảnh `.svg`** của các sơ đồ liên quan chưa được xuất lại; task này không đụng sơ đồ.

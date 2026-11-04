# Report W0 — VNPAY-W0-DOCS

**Task card:** `VNPAY-W0-DOCS` (task `task_60d9caec0472`) · **Kế hoạch:** [vnpay-payment-plan](../../2026-10-29-vnpay-payment-plan.md), bước 2.2, 2.4, 4.3, 4.4 · **Trạng thái:** `DONE_WITH_CONCERNS` (chỉ tài liệu; các điểm cần nhóm quyết định ở mục 4)

## 1. Commit và file

- Branch của worktree: `ThuanTran260/task-vnpay-w0-docs`. Branch này đã được đổi tên từ `ThuanTran260/gurnard` giữa chừng (reflog: `Branch: renamed refs/heads/ThuanTran260/gurnard to refs/heads/ThuanTran260/task-vnpay-w0-docs`, HEAD không đổi `c6d3403`); worker không chạy checkout hay đổi tên branch.
- Commit nội dung: `6ed5d8f12c23644e508b15c277ceda19d15b9ef8` — `docs(payment): describe VNPay context, architecture and deployment`.
- Commit report: ghi file này, message `docs(payment): add VNPay W0 worker report` (hash lấy bằng `git log -1`; report không tự chứa hash của chính nó).
- Nền: `c6d3403` (= `a2/payment-vnpay`).

| File | Bước | Nội dung chính |
|---|---|---|
| `docs/requirements/context-and-scope.md` | 2.2 | S6 đổi thành VNPay sandbox (hệ thống ngoài); viết lại A-01; thêm R-13, R-14, R-15; sửa các dòng mâu thuẫn trong cùng file (mục 1, bảng 3.1, đoạn tóm tắt 3.1, dòng FR-31 ở 3.3) |
| `docs/requirements/use-case-overview.puml` | 2.4 | Actor `Pay`: `"VNPay sandbox\n(hệ thống ngoài)"`, stereotype `<<External>>`; use case khác giữ nguyên |
| `docs/architecture/architecture.md` | 4.3 | Ghi chú đầu file; mục 1–2; bảng container; mục con "Tích hợp VNPay sandbox" (đường 10–13); module `payments`; luồng đặt đơn bước 4–7; NFR-03/04/08/15; bảng cấu hình thêm biến mục 1.8; hàng ADR-007 (chỉ nhắc tên) |
| `docs/architecture/deployment.puml` | 4.3 | Bỏ `SIM`; thêm node "VNPay sandbox – hệ thống ngoài"; bốn đường HTTPS (10)–(13); tên biến môi trường trong artifact API; ghi chú Docker không có `VNP_*` |
| `docs/deployment.md` | 4.4 | Mục mới "Thanh toán VNPay sandbox": bảng biến chỉ ghi tên, điều kiện lưu biến Render trước deploy đầu tiên, đăng ký IPN URL, đối soát/hoàn tiền tay; đoạn Docker trong "Local Docker" |
| `docs/planning/handoff/2026-10-29-vnpay/W0-report.md` | — | File này (tạo mới) |

Không sửa `.svg`, `apps/`, `tests/`, `.github/`, `package*.json`, `srs.md`, `uc-checkout.*`, `docs/diagrams/*`, ADR.

## 2. Kết quả các lệnh acceptance (đo trên commit `6ed5d8f`)

1. **Render PlantUML.** `java -jar <plantuml.jar> -tsvg -o <thư mục tạm trong scratchpad> docs/requirements/use-case-overview.puml` và `.../docs/architecture/deployment.puml`: cả hai exit 0, tạo `use-case-overview.svg` (18982 byte) và `deployment.svg` (41111 byte) ngoài repo. `grep -l "Syntax Error" *.svg` → rỗng (exit 1). Đọc lại SVG tạm: có chữ "VNPay sandbox", các nhãn (10)–(13), không còn "Payment simulator" hay "Payment Service".
2. **Diff.**
   - `git diff --check a2/payment-vnpay...HEAD` → exit 0, không có output.
   - `git diff --name-only a2/payment-vnpay...HEAD` → đúng 5 file: `docs/architecture/architecture.md`, `docs/architecture/deployment.puml`, `docs/deployment.md`, `docs/requirements/context-and-scope.md`, `docs/requirements/use-case-overview.puml`. Sau commit report chỉ thêm `W0-report.md` (đã kiểm lại, xem báo cáo cuối của worker).
3. **Link tương đối mới.** Đã kiểm tồn tại bằng `[ -f ]`: `docs/deployment.md`, `docs/planning/2026-10-29-vnpay-payment-plan.md`, `docs/architecture/architecture.md`, `docs/architecture/deployment.puml`, `docs/architecture/deployment.svg`, `docs/docker-demo.md` → 6/6 `OK`. ADR-007 chỉ nhắc bằng chữ, không có link.
4. **Quét credential** trên các dòng thêm của `git diff` (regex: `secure_hash`, `vnp_TmnCode=`, `VNP_*/SECRET/PASSWORD/TOKEN` gán giá trị, chuỗi hex ≥64, chuỗi số 13–19 chữ số, khối private key) → `no matches`. Biến `VNP_*` xuất hiện chỉ ở dạng tên. Hai giá trị mặc định ghi trong `docs/deployment.md` là URL sandbox công khai không chữ ký (`VNP_URL`, `VNP_API_URL`), đúng plan mục 1.8.
5. **Mã mới.** Quét các mã `FR/BR/AC/UC/NFR/ADR` trong dòng thêm: chỉ dùng `BR-10`, `BR-11`, `FR-14/15/16`, `FR-31`, `BR-05`, `AC-N03.1` (đã có), `ADR-007` (chỉ tên). Mã mới duy nhất là `R-13`, `R-14`, `R-15` (mã rủi ro, xem mục 4).
6. **`git status --porcelain`** sau commit nội dung → rỗng.

Chưa chạy (ngoài phạm vi card): build/lint/test code, `npm`, `docker`, `graphify`.

## 3. Việc đã làm ngoài các dòng card nêu tên

Để file không tự mâu thuẫn, `context-and-scope.md` còn sửa: định nghĩa "Trả tiền không tiền mặt an toàn" ở mục 1, hàng "Thanh toán" và đoạn "Hệ thống làm được" ở 3.1, hàng FR-31 ở 3.3 (đổi sang "cổng production thật", FR-31 vẫn Won't theo plan 2.1). `architecture.md` còn sửa NFR-03, NFR-04/07, NFR-08, NFR-15 và ghi chú giải thích ở đầu file. Các dòng còn nhắc simulator mà worker chủ ý không sửa vì phụ thuộc bước khác:

- `architecture.md` hàng ADR-005 ở bảng quyết định (mục 6): chờ bước 4.2 (sửa ADR-005).
- `docs/deployment.md` dùng chữ "thay simulator bằng VNPay" để mô tả điều kiện deploy; đây là cách nói về thay đổi code, không phải mô tả hệ thống.

## 4. Chỗ cần nhóm quyết định

1. **Mã rủi ro R-13, R-14, R-15** do worker tự đánh số tiếp bảng rủi ro của `context-and-scope.md` (card cấm tự đặt mã FR/BR/AC/UC, không nói về mã `R-`). Nhóm xác nhận hoặc đổi số.
2. **NFR-03.** `architecture.md` mục NFR-03 ghi: `POST /payments` chỉ tạo `Payment PENDING` và ký URL, không chờ VNPay, nên thời gian trả trên trang VNPay không tính vào p95 ≤2 giây. SRS (AC-N03.1, câu "simulator trả trong 500 ms") chưa đổi; nhóm chốt mục tiêu đo mới hoặc bỏ ở bước SRS.
3. **Quy trình đối soát/hoàn tiền tay** (`docs/deployment.md`): plan chỉ nói "tra Merchant Admin và hoàn tiền tay nếu cần". Worker thêm các chi tiết cần nhóm xác nhận: đối chiếu `Payment.id = vnp_TxnRef` bằng quyền Render của người phụ trách (không mở external access DB), "nhóm hoặc quản lý quyết định hoàn tiền", "không sửa DB để mở lại đơn", ghi lại `vnp_TxnRef` vào ghi chú vận hành. Chưa có bằng chứng quy trình này đã diễn tập.
4. **Đăng ký IPN URL.** Worker ghi "chỉ đăng ký cho production" vì local không nhận được IPN (suy ra từ plan mục 1 và 4). Plan không nói thời điểm đăng ký so với lần deploy đầu có code VNPay; deployment.md chưa quy định thứ tự này. Nhóm chốt.
5. **Đoạn Docker.** `deployment.md` nói muốn thử trả tiền trong Docker thì cần "bản Compose đã truyền biến này vào runtime"; hiện `docker-compose.yml`/`compose.demo.yml` chưa truyền `VNP_*` (việc của bước 5.7, wave code). Câu này chỉ đúng sau wave đó.
6. **Ký hiệu actor.** `use-case-overview.puml` dùng stereotype `<<External>>` và nhãn "VNPay sandbox\n(hệ thống ngoài)". Đổi nếu nhóm muốn stereotype/nhãn khác.

## 5. Rủi ro và việc còn lại

- **Ảnh `.svg` đã cũ.** `docs/architecture/deployment.svg` và `docs/requirements/use-case-overview.svg` không được sửa (card cấm); repo vẫn hiển thị Payment simulator/Payment Service cho tới khi nhóm xuất lại từ `.puml`. Nhãn (10)–(13) trong `architecture.md` khớp `.puml`, chưa khớp `.svg` hiện có.
- **Tài liệu chưa đồng bộ vì thuộc wave sau:** `srs.md` (A-01 trong FR-31, §3.4, §2.1/2.3, các AC thanh toán), `uc-checkout.md/.puml` (vẫn ghi Payment Service), `docs/diagrams/*`, ADR-005, `docs/architecture/adr/README.md`, ADR-007 chưa tồn tại, `docs/traceability-matrix.md`. Cho tới khi các bước 2.1, 2.3, 3.x, 4.1, 4.2, 4.5 xong, tài liệu A2 lệch nhau theo quy tắc doc-code-sync.
- **Tham chiếu tới nội dung chưa viết:** `context-and-scope.md` (A-01) trỏ "SRS mục 3.4" sẽ được viết lại thành "Quy ước VNPay sandbox"; `architecture.md` trỏ ADR-007 chưa soạn.
- **Không chép bảng mã QueryDR mục 1.6.** Các file chỉ nói "đối soát qua QueryDR theo SRS"; bảng chờ spike (bước 1) nên chưa có chỗ nào khẳng định hành vi thực của sandbox.
- Nội dung là bản nháp theo plan, chưa có spike hay SIT nào chạy; các câu về hành vi VNPay (IPN gọi lại 10 lần cách 5 phút, `vnp_ReturnUrl`...) lấy từ plan, chưa được đo trên sandbox.

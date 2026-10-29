# Report W1-UCDIAG — VNPAY-W1-UCDIAG

**Task card:** `VNPAY-W1-UCDIAG` (task `task_238673b09059`) · **Kế hoạch:** [vnpay-payment-plan](../../2026-10-29-vnpay-payment-plan.md), bước 2.3 và 3.1–3.5 · **Hợp đồng mã:** [contract.md](contract.md) · **Trạng thái:** `DONE_WITH_CONCERNS` (chỉ tài liệu; các điểm cần nhóm quyết định ở mục 5)

## 1. Commit và file

- Branch của worktree: `ThuanTran260/task-vnpay-w1-ucdiag`. Branch được Orca đổi tên từ `ThuanTran260/cory` giữa chừng (reflog: `Branch: renamed refs/heads/ThuanTran260/cory to refs/heads/ThuanTran260/task-vnpay-w1-ucdiag`); worker không chạy checkout, switch hay đổi tên branch.
- Nền: `3b62845` (= `a2/payment-vnpay`, kiểm bằng `git rev-parse` trước khi sửa).
- Commit nội dung: `6f3cc9f43b165269791faac423ba5c8cc4382b66` — `docs(payment): model VNPay checkout in use case and diagrams`.
- Commit report: ghi file này, message `docs(payment): add VNPay W1-UCDIAG worker report` (hash lấy bằng `git log -1`; report không tự chứa hash của chính nó).

| File | Bước | Nội dung chính |
|---|---|---|
| `docs/requirements/uc-checkout.md` | 2.3 | Actor "VNPay sandbox"; luồng chính viết lại thành 21 bước (tạo `Payment PENDING` và URL → redirect → trả trên VNPay → IPN → return/poll → hiển thị theo DB); A3, A5 bổ sung, A6 mới; E3, E4 viết lại, E8a sửa, E8b "Đã bỏ", E9–E13 mới; bảng hậu điều kiện, bảng BR, bảng liên kết bước–yêu cầu, gợi ý test cập nhật |
| `docs/requirements/uc-checkout.puml` | 2.3 | Actor `Pay` đổi thành `"VNPay sandbox\n(hệ thống ngoài)"` `<<External>>`; sửa note UC-04.5; thêm note cho UC-04.2 và UC-06 |
| `docs/diagrams/sequence-checkout.puml` | 3.1 | Participant `Browser` và `VNPay sandbox`; ba đoạn UC-04.2 (1/3 tạo URL, 2/3 trả trên VNPay + IPN, 3/3 return/poll); `alt` thành công / thất bại / chữ ký sai; `opt` QueryDR `POST /payments/:id/sync`; nhánh hủy UC-06 bị chặn |
| `docs/diagrams/activity-checkout.puml` | 3.2 | Swimlane `VNPay sandbox` thay `Payment Service`; nhánh khách hủy (`24`), bỏ dở, hết hạn đối soát QueryDR (E11), chưa kết luận, mất IPN (E10), hủy bị chặn (A5) |
| `docs/diagrams/state-order.puml` | 3.3 | Đơn vẫn `PENDING` khi chờ VNPay; `PAYMENT_FAILED → PENDING` khi thử lại; note hủy bị chặn; thêm vòng đời `Payment` (`PENDING` → `SUCCESS`/`FAILED`) trong cùng file, không có trạng thái `EXPIRED` |
| `docs/diagrams/class-domain.puml` | 3.4 | `PaymentStatus.PENDING`; chín cột `Payment` mới theo contract mục 3; giữ đủ 7 lớp domain đề A2 §4.3 |
| `docs/diagrams/README.md` | — | Cập nhật mô tả bốn sơ đồ; ghi chú `.svg` chưa xuất lại |
| `docs/planning/handoff/2026-10-29-vnpay/W1-UCDIAG-report.md` | — | File này (tạo mới) |

Không sửa `.svg`, `apps/`, `tests/`, `.github/`, `package*.json`, `srs.md`, ADR, `architecture.md`, `deployment.*`, `use-case-overview.*`, `traceability-matrix.md`.

## 2. Kết quả các lệnh acceptance (đo trên commit `6f3cc9f`)

1. **Render PlantUML (5 file).** Với mỗi file trong `docs/requirements/uc-checkout.puml`, `docs/diagrams/{sequence-checkout,activity-checkout,state-order,class-domain}.puml`:
   `java -jar <plantuml.jar> -tsvg -o <thư mục tạm trong scratchpad> <file.puml>` → 5/5 `exit=0`, tạo 5 svg ngoài repo (activity 108938 B, class 71153 B, sequence 163213 B, state 28687 B, uc-checkout 16229 B). `grep -l "Syntax Error" <thư mục tạm>/*.svg` → rỗng (`exit=1`).
   Chạy thêm với `-DPLANTUML_LIMIT_SIZE=20000 -charset UTF-8` (như `docs/diagrams/README.md`): cùng kích thước từng file, cũng 0 "Syntax Error". Đã xuất PNG tạm của state và activity, xem bằng mắt: không lỗi bố cục nặng, composite state `Payment lifecycle` hiển thị đúng. Sequence render thành công nhưng chưa xem hình.
2. **`grep -n -i "Payment Service\|simulator\|mô phỏng" docs/requirements/uc-checkout.md docs/diagrams/*.puml`** → 3 dòng, đều là ghi chú lịch sử hoặc giá trị dữ liệu, không mô tả hành vi hiện tại:
   - `uc-checkout.md:9`: câu nêu lý do đổi ("thay cho simulator").
   - `uc-checkout.md:252`: E8b "Đã bỏ", nêu rủi ro cũ của simulator không còn.
   - `class-domain.puml:158`: `rows created before VNPay keep "SIMULATOR"`, đúng contract mục 3 (hàng cũ có `provider = "SIMULATOR"`).
   Không còn "Payment Service" nào trong các file này; không còn `402`, `PAYMENT_DECLINED` hay `cardNumber` ngoài câu `uc-checkout.md:208` ("Không có phản hồi 402 từ `POST /payments`").
3. **Tên khớp contract mục 3.** `Payment` có đủ `provider`, `paymentUrl`, `expiresAt`, `gatewayCreateDate`, `gatewayTxnNo`, `gatewayResponseCode`, `gatewayTransactionStatus`, `bankCode`, `paidAt`; `PaymentStatus` có `SUCCESS`, `FAILED`, `PENDING` (và `REFUNDED` cũ, xem mục 5). `EXPIRED` chỉ xuất hiện như giá trị của `gatewayResponseCode`, không có trạng thái `EXPIRED` ở `state-order.puml` hay enum. Endpoint dùng đúng danh sách contract mục 4. Giữ đủ 7 lớp `User`, `Product`, `Order`, `OrderItem`, `Payment`, `Promotion`, `LoyaltyTransaction`.
4. **Diff.**
   - `git diff --check a2/payment-vnpay...HEAD` → `exit=0`, không output.
   - `git diff --name-only a2/payment-vnpay...HEAD` (sau commit nội dung) → đúng 7 file: `docs/diagrams/{README.md,activity-checkout.puml,class-domain.puml,sequence-checkout.puml,state-order.puml}`, `docs/requirements/{uc-checkout.md,uc-checkout.puml}`. Sau commit report chỉ thêm file report này.
   - Thống kê: 7 file, 593 dòng thêm, 140 dòng xóa (trước khi thêm report).
5. **Link tương đối mới** (kiểm bằng `[ -f ]`): `docs/planning/2026-10-29-vnpay-payment-plan.md` (từ `uc-checkout.md` và `diagrams/README.md`), `docs/deployment.md` (từ `uc-checkout.md`, mục E12) → đều `OK`. Report này trỏ `../../2026-10-29-vnpay-payment-plan.md` và `contract.md`, cũng tồn tại.
6. **Quét credential** trên các dòng thêm của `git diff` (regex: `secure_hash`, `vnp_TmnCode=`, `VNP_*`/`SECRET`/`PASSWORD`/`TOKEN` gán giá trị, chuỗi hex ≥64, chuỗi số 13–19 chữ số, khối private key, URL kèm `vnp_SecureHash`) → 4 dòng khớp, cả 4 là **dương tính giả** do regex: hai dòng sequence/activity ghi `vnp_TxnRef = Payment.id` (quy tắc ánh xạ, không phải giá trị), một dòng ghi `vnp_TransactionStatus = 02`, một dòng ghi tên trường `vnp_SecureHash` trong mô tả E9. Không có TmnCode, secret, số thẻ hay URL có chữ ký.
7. **Mã trên các dòng thêm.** Mã mới theo contract và đã dùng: `BR-10`, `BR-11`, `E9`–`E13`, `A6` (và E3/E4/A5/E8b theo contract mục 2). Mã đã có trong SRS: `FR-10/11/14/15/16/20/22/25`, `BR-05`, `BR-08`, `NFR-03/05/06/07/08/09/11/13/15/20`, `UC-04`, `UC-04.1`, `UC-04.2`, `UC-07`, `AC-F12.1`, `AC-F12.2`, `AC-F14.2`, `AC-F15.1`, `AC-F15.5`, `AC-F16.1`, `AC-F16.4`, `AC-F16.6`, `AC-N06.3` (chỉ dẫn chiếu mã cũ, không đặt mã AC mới). Không có mã `R-` hay `ADR` mới; `ADR` không được nhắc.
8. **`git status --porcelain`** sau commit nội dung → rỗng.

Chưa chạy (ngoài phạm vi card): build/lint/test code, `npm`, `docker`, `graphify`.

## 3. Chỗ đã gắn "(chờ spike)"

Đúng ba điểm contract mục 6; mỗi điểm ghi ở nơi mô tả hành vi, `.md` bằng chữ, `.puml` bằng `note`.

| Điểm | `uc-checkout.md` | `sequence-checkout.puml` | `activity-checkout.puml` | `state-order.puml` |
|---|---|---|---|---|
| 1. QueryDR `00/01` sau hạn và lối thoát ca bỏ dở | E11, gạch đầu dòng `00/01` (dòng 283) | note sau nhánh `00/01 after expiry` (dòng 149) | note ở nhánh "stays PENDING" (dòng 122) | note của `PAY_PENDING` (dòng 88) |
| 2. QueryDR `91` sau hạn → `FAILED`, `gatewayResponseCode = "EXPIRED"` | E11, gạch đầu dòng `91` (dòng 284) | note sau nhánh `91 after expiry` (dòng 146) | note ở nhánh FAILED + EXPIRED (dòng 135) | note của `PAY_FAILED` (dòng 94) |
| 3. IPN thất bại khi `vnp_TransactionStatus = 02`, kể cả khách hủy (`24`) | E3, mục "Kích hoạt" (dòng 205) | note ở nhánh `vnp_TransactionStatus=02` của IPN (dòng 233) | note ở nhánh E3 của IPN (dòng 208) | note của `PAY_FAILED` (dòng 92) |

Ngoài ra `uc-checkout.md:9` và `diagrams/README.md:14` nhắc nhãn như chú giải ("Nhãn (chờ spike) đánh dấu…"), không phải điểm thứ tư. `uc-checkout.puml` và `class-domain.puml` không gắn nhãn vì không vẽ ba hành vi này.

## 4. Change request

Không có đoạn nào ngoài allowed paths cần sửa để hoàn thành card. Các chỗ lệch tạm thời giữa file của card và file của worker khác (không tự sửa):

- **CR-1 (`srs.md`, wave SRS).** `uc-checkout.md` trỏ "SRS mục 3.4" cho quy ước sandbox và "SRS mục 1.4" cho E4b/E4c/E8b. Hiện `srs.md:154` vẫn mô tả simulator; mục 3.4 phải được viết lại thành "Quy ước VNPay sandbox" (plan 2.1) thì dẫn chiếu mới đúng.
- **CR-2 (`srs.md`).** Các AC mà `uc-checkout.md` dẫn chiếu bằng mã phải giữ mã khi viết lại nội dung: `AC-F15.1` (hiện "402 `PAYMENT_DECLINED`") và `AC-F15.5` (hiện thẻ `4242…`), `AC-F16.1` ("Payment Service được gọi đúng 1 lần"), `AC-F16.4`, `AC-F16.6`, `AC-F12.1/2`, `AC-F14.2`, `AC-N06.3`. Nếu SRS đổi nội dung nhưng bỏ mã, các dẫn chiếu này sẽ treo.
- **CR-3 (`docs/Assignment2-BrewLite.md` §4.2, chỉ đọc).** Đề liệt kê "lifeline tối thiểu" là Customer → Next.js UI → NestJS API → Database → Payment Service (dòng 159–166). Sequence mới dùng `VNPay sandbox` ở vị trí `Payment Service` và thêm `Browser` (theo contract mục 4), nên vẫn đủ năm lifeline tối thiểu nếu coi VNPay sandbox là bên thanh toán. Không sửa đề; nhóm cần giải thích được điều này khi vấn đáp, hoặc đổi nhãn thành "VNPay sandbox (Payment Service)" nếu muốn bám sát tên trong đề.

## 5. Chỗ cần nhóm quyết định

1. **`PaymentStatus.REFUNDED`.** Contract mục 3 liệt kê `SUCCESS`, `FAILED`, `PENDING`; plan 1.4 chỉ "thêm `PENDING`". Worker **giữ** `REFUNDED` có sẵn trong `class-domain.puml` (và note cũ "không phải luồng FR-26"). Nhóm xác nhận giữ hay bỏ.
2. **Ánh xạ NFR trong `uc-checkout.md`.** Contract không chỉ định NFR cho luồng mới. Worker chọn: E9 → NFR-07, NFR-08; E10, E11 → NFR-13; E12 → NFR-20; E13 → NFR-07, NFR-15; bước 12–13 thêm NFR-07, NFR-13; bước 16–18 thêm NFR-08. Nhóm đối chiếu với SRS khi viết xong.
3. **Thông báo UI.** Các chuỗi lấy từ plan 1.7, 6.1, 6.2: "Đang xác minh thanh toán, vui lòng kiểm tra lại", "Tiếp tục thanh toán", "Thanh toán qua VNPay", nút "Kiểm tra lại". Riêng E13 (lỗi cấu hình/provider) plan không nêu chuỗi: worker dùng lại "Có lỗi xảy ra, vui lòng thử lại" của E8a. Sequence/activity viết bằng tiếng Anh như cũ nên dùng cụm "Checking payment".
4. **Nhánh hủy khi payment đã `FAILED`.** A5 ghi "hủy như thường, không nhả nguyên liệu chỉ vì payment `FAILED`" theo plan 1.6 bước 5; đây là diễn giải của worker, chưa có trong contract.
5. **Hai bổ sung ngoài danh sách card.** (a) `uc-checkout.puml` thêm note cho UC-04.2 và UC-06 (card chỉ yêu cầu actor); (b) `uc-checkout.md` mục 10 viết lại các gợi ý test E3/A3/E4 vì thẻ giả `4000…0002`, `4242…` và "đếm lần gọi Payment Service" không còn đúng. Thêm gợi ý test cho E9–E13 mô tả cách kiểm theo plan bước 7, không đặt mã test mới.
6. **Vị trí participant `Browser`.** Đặt ngay sau `Customer`, trước `Next.js UI`. Các mũi tên `Customer → Next.js UI` vì vậy đi ngang lifeline `Browser`. Đổi vị trí nếu nhóm thấy rối khi xuất `.svg`.

## 6. Rủi ro và việc còn lại

- **Ảnh `.svg` đã cũ.** `docs/requirements/uc-checkout.svg` và bốn `.svg` trong `docs/diagrams/` vẫn vẽ simulator/Payment Service cho tới khi nhóm xuất lại từ `.puml` (card cấm sửa `.svg`). `diagrams/README.md` đã ghi chú điều này. Lệnh xuất ở README dùng `-DPLANTUML_LIMIT_SIZE=20000 -charset UTF-8`; sequence và activity mới dài hơn nhiều (svg 163 KB và 109 KB).
- **Sơ đồ dài.** `sequence-checkout.puml` 334 dòng, `activity-checkout.puml` 270 dòng. Activity hiện bốn nhánh hết hạn/chưa kết luận/lỗi/FAILED trong cùng một cụm `if`; bố cục PNG tạm chấp nhận được nhưng khó đọc trên một trang. Nhóm có thể tách phần sau IPN thành sơ đồ phụ nếu cần.
- **Tài liệu chưa đồng bộ vì thuộc worker khác:** `srs.md` (còn simulator/Payment Service, A-01 và các AC), ADR-005 và ADR-007, `docs/traceability-matrix.md`, `docs/architecture/adr/README.md`. `docs/Assignment2-BrewLite.md` §4.2 chỉ để tham chiếu.
- **Nội dung chưa kiểm chứng trên sandbox.** Toàn bộ bảng QueryDR, hành vi IPN `24`/`02`, `91` sau hạn là đặc tả đích theo plan, chưa có spike hay SIT. Ba điểm "(chờ spike)" phải được gỡ hoặc sửa sau bước 1.3–1.4.
- **Chưa xem hình sequence.** Render thành công, 0 "Syntax Error"; chưa mở ảnh để kiểm bố cục (chỉ đọc state và activity).

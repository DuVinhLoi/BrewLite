# Report W1-SRS — VNPAY-W1-SRS

**Task card:** `VNPAY-W1-SRS` (task `task_b726109ba426`) · **Kế hoạch:** [vnpay-payment-plan](../../2026-10-29-vnpay-payment-plan.md), bước 2.1 · **Hợp đồng mã:** [contract.md](contract.md) · **Trạng thái:** `DONE_WITH_CONCERNS` (chỉ tài liệu; các điểm cần nhóm quyết định ở mục 6)

## 1. Commit và file

- Branch của worktree: `ThuanTran260/docs-vnpay-w1-srs`. Branch này được đổi tên từ `ThuanTran260/knifefish` giữa chừng, không do worker: lúc bắt đầu `git branch --show-current` trả `ThuanTran260/knifefish`, lúc commit trả tên mới; reflog: `Branch: renamed refs/heads/ThuanTran260/knifefish to refs/heads/ThuanTran260/docs-vnpay-w1-srs`, HEAD không đổi `3b62845` (= `a2/payment-vnpay`). Worker không chạy checkout hay đổi tên branch.
- Commit nội dung: `3e19d82e2df8c707345ff7f2cb6e2ca64b5fac53` — `docs(payment): specify VNPay sandbox payment in SRS`.
- Commit report: ghi file này, message `docs(payment): add VNPay W1-SRS worker report` (hash lấy bằng `git log -1`; report không tự chứa hash của chính nó).
- Nền: `3b62845` (= `a2/payment-vnpay`).

| File | Nội dung chính |
|---|---|
| `docs/requirements/srs.md` | Viết lại cho VNPay sandbox: §1.4, §2.1, §2.3, §3.1–§3.6, FR-14/15/16, FR-31, NFR-03/05/06/07/08/09/20, §7, §8.4, §9 (100 dòng thêm, 62 dòng bỏ; giữ CRLF của working tree) |
| `docs/planning/handoff/2026-10-29-vnpay/W1-SRS-report.md` | File này (tạo mới) |

Không sửa `uc-checkout.*`, `docs/diagrams/*`, ADR, `architecture.md`, `traceability-matrix.md`, `.svg`, `apps/`, `tests/`, `.github/`, `package*.json`.

## 2. Kết quả các lệnh acceptance (đo trên commit `3e19d82`)

1. **`git diff --check a2/payment-vnpay...HEAD`** → exit 0, không có output.
2. **`git diff --name-only a2/payment-vnpay...HEAD`** → đúng 1 file: `docs/requirements/srs.md`. Sau commit report chỉ thêm `W1-SRS-report.md`.
3. **`git status --porcelain`** sau commit nội dung → rỗng (0 dòng).
4. **Link tương đối mới** (kiểm bằng `[ -e ]` từ `docs/requirements/`): `../deployment.md`, `../planning/2026-10-29-vnpay-payment-plan.md`, `context-and-scope.md`, `uc-checkout.md` → 4/4 `OK`. ADR-007 chỉ nhắc bằng chữ, không có link vì file chưa tồn tại ở nền này.
5. **Quét credential** trên 100 dòng thêm (regex: `secure_hash`, `vnp_TmnCode=`, `VNP_*` gán giá trị, chuỗi hex ≥40, chuỗi số 13–19 chữ số, khối private key, `password :=`) → 6 dòng khớp, tất cả là so sánh mã phản hồi trong AC (`vnp_ResponseCode = 00`, `vnp_TransactionStatus = 02`...), không phải credential. Không có TmnCode, secret, số thẻ hay URL có chữ ký. `VNP_HASH_SECRET`, `VNP_TMN_CODE`, `WEB_URL`, `VNP_URL`, `VNP_API_URL` chỉ xuất hiện dạng tên.
6. **Mã mới** (quét dòng thêm, so với `HEAD:srs.md`): xem mục 4. Mọi mã nằm trong contract hoặc theo quy tắc đánh số AC ở contract mục 1; không dùng lại `AC-F15.2`, `AC-F16.2`, `AC-F16.3`, `AC-F16.7`, `E8b` (hai mã cuối chỉ nhắc ở §1.4 như lịch sử).
7. **Mã AC được dẫn chiếu đều có định nghĩa**, trừ `AC-F16.7` và `AC-N15.3` (cả hai chỉ nhắc ở §1.4 như mã đã bỏ).
8. **`grep -n -i "simulator\|mô phỏng\|Payment Service\|402\|PAYMENT_DECLINED\|4000000000000002" docs/requirements/srs.md`** → 4 dòng, giải thích ở mục 3.
9. **`grep -c "(chờ spike)" docs/requirements/srs.md`** → 3 (dòng 407, 413, 425).

Chưa chạy (ngoài phạm vi card): PlantUML (card không sửa `.puml`), build/lint/test, `npm`, `docker`, `graphify`.

## 3. Các dòng còn khớp lệnh `grep` (đều là ghi chú lịch sử hoặc dữ liệu)

- **`srs.md:50` — hai chỗ trong ghi chú rút gọn cũ (mục 1.4):** "timeout Payment Service" nằm trong danh sách tiêu chí đã bỏ (5); "ở bản dùng simulator, API dừng giữa bước 13 và 14 ... rủi ro chấp nhận" ở thay đổi (6). Giữ theo plan ("giữ số các thay đổi cũ"); chỉ thêm vế "từ 2026-10-29 rủi ro này được thay bằng IPN/QueryDR" vào (6).
- **`srs.md:51` — ghi chú mới "VNPay sandbox (2026-10-29)":** ba chỗ nhắc "simulator" và "402 `PAYMENT_DECLINED`" để giải thích lý do đổi (yêu cầu giảng viên), rủi ro cũ được thay bằng IPN/QueryDR, và việc bỏ 402/`cardNumber` khỏi `POST /payments`.
- **`srs.md:206` — thuộc tính `Payment` (§3.6):** `provider = "SIMULATOR"` là giá trị dữ liệu của hàng tạo trước 2026-10-29, theo contract mục 3.
- **`srs.md:407` — AC-F15.1:** "`POST /payments` không còn trả 402". AC phủ định để test chặn hồi quy; không mô tả hành vi hiện tại của simulator.

Không còn câu nào mô tả simulator, Payment Service, 402 hay số thẻ demo như hành vi hiện tại. Mục 3.3 của SRS cũ không chứa số thẻ demo (chúng nằm ở 3.4, đã bỏ); ở 3.3 chỉ thêm ví dụ số tiền VNPay (`Order.total × 100`, `12400000`).

## 4. Mã mới và bảng ánh xạ AC

**Mã mới trong SRS:**

- Quy tắc: `BR-10`, `BR-11` (contract mục 1). `BR-05` giữ mã, viết lại.
- AC mới (đánh tiếp theo contract mục 1): `AC-F14.7` đến `AC-F14.13`, `AC-F15.6` đến `AC-F15.8`, `AC-F16.8` đến `AC-F16.13`.
- Dẫn chiếu luồng UC-04 (contract mục 2): `E3`, `E4`, `A3`, `A5`, `A6`, `E9`, `E10`, `E11`, `E12`, `E13` (đang có `E1`, `E4`, `A3` từ trước).
- Khác: `ADR-007` (chỉ tên, contract mục 5); `R-13`, `R-14`, `R-15` (đã có trong `context-and-scope.md`, chỉ dẫn chiếu).
- Không đặt mã `FR`, `NFR`, `UC`, `S` mới. Không thêm AC mới cho NFR (chỉ sửa AC cũ).

**Ánh xạ AC cũ → AC mới (cùng mã = viết lại nội dung):**

| AC cũ | AC mới | Thay đổi |
|---|---|---|
| AC-F14.1 | AC-F14.1 | 201 `PAID` do simulator → 201 `PENDING` kèm `paymentUrl`, `expiresAt` |
| AC-F14.2 | AC-F14.2 | Bỏ "không gọi Payment Service"; `cardNumber` là trường lạ |
| AC-F14.3 | AC-F14.3 | "không gọi Payment Service" → "không tạo `Payment` mới" |
| AC-F14.4 | AC-F14.4 | Giữ nguyên |
| AC-F14.5 | AC-F14.5 | Kiểm số thẻ demo → không có ô thẻ, nút "Thanh toán qua VNPay", redirect `paymentUrl` |
| AC-F14.6 | AC-F14.6 | Trừ kho do IPN/QueryDR; đơn marker false không gọi settle |
| — | AC-F14.7 | Thiếu cấu hình tạo URL → 502; replay vẫn 200 (E13) |
| — | AC-F14.8 | IPN thiếu secret → `99`; thiếu riêng `WEB_URL`; khởi động; `/health` (E13) |
| — | AC-F14.9 | IPN thành công → `00`, `SUCCESS`, `PAID` |
| — | AC-F14.10 | IPN `97`/`01`/`04` (E9) |
| — | AC-F14.11 | `GET /payments/vnpay/return`, `valid: true/false`, poll DB (E9) |
| — | AC-F14.12 | `sync` + QueryDR `00/00` khi thiếu IPN (E10) |
| — | AC-F14.13 | `sync`: 401/403/404 `PAYMENT_NOT_FOUND`; trạng thái cuối → 200 từ DB |
| AC-F15.1 | AC-F15.1 | 402 `PAYMENT_DECLINED` (thẻ `...0002`) → IPN thất bại `FAILED` (E3) **(chờ spike)** |
| AC-F15.2 | — | Đã bỏ từ trước, không dùng lại |
| AC-F15.3 | AC-F15.3 | Giữ; thêm `FAILED`/`EXPIRED` không nhả nguyên liệu |
| AC-F15.4 | AC-F15.4 | "Nhận 402" → chỉ báo thất bại khi DB đã `PAYMENT_FAILED`; `PENDING` hiển thị "đang xác minh" (plan mục 1.7) |
| AC-F15.5 | AC-F15.5 | Thẻ `4242...` thử lại 201 `PAID` → thử lại tạo `Payment PENDING` mới, `PAYMENT_FAILED → PENDING`, `reserved` không tăng (A3) |
| — | AC-F15.6 | QueryDR `00/02` → `FAILED`, không phải `EXPIRED` |
| — | AC-F15.7 | IPN thành công tới muộn → `02` + warning `PAYMENT_RECONCILIATION_REQUIRED` (E12) |
| — | AC-F15.8 | QueryDR `91`: còn hạn giữ `PENDING`; quá hạn `FAILED` + `EXPIRED` (E11) **(chờ spike)** |
| AC-F16.1 | AC-F16.1 | Replay `SUCCESS`; bỏ "Payment Service gọi đúng 1 lần" → không tạo URL, không gọi VNPay, không cần cấu hình (E4) |
| AC-F16.2, F16.3, F16.7 | — | Đã bỏ từ trước, không dùng lại |
| AC-F16.4 | AC-F16.4 | Đơn `PAID` + key mới → 409; bỏ "Payment Service" |
| AC-F16.5 | AC-F16.5 | Giữ nội dung; "thất bại" = `Payment FAILED` |
| AC-F16.6 | AC-F16.6 | Nút "Xác nhận trả" → "Thanh toán qua VNPay" |
| — | AC-F16.8 | Replay `PENDING` còn hạn / khác phương thức → 409; tối đa một `PENDING` (BR-10; E4, A6) |
| — | AC-F16.9 | `PENDING` quá hạn khi tạo mới: QueryDR trước, replay `SUCCESS` trước (E11) |
| — | AC-F16.10 | QueryDR `00/01` giữ `PENDING`; lối thoát ca bỏ dở **(chờ spike)** |
| — | AC-F16.11 | `94`/`99`, lỗi mạng/ký, nhóm trạng thái đặc biệt → 502, không đổi DB (E13) |
| — | AC-F16.12 | IPN lặp → `02`, không trừ kho hai lần; IPN và `sync` cùng xác nhận |
| — | AC-F16.13 | Hủy khi có `Payment PENDING` → 409 `PAYMENT_IN_PROGRESS` (A5, E11) |

**AC khác có sửa (ngoài FR-14/15/16):** `AC-F10.1` (thêm `sync`, ghi IPN/return công khai), `AC-F20.1`/`AC-F20.2` (màn xác nhận theo DB `PAID`, giỏ giữ khi `PENDING`), `AC-F22.1` (trường `payments`), `AC-F25.3` và mô tả FR-25 (hủy bị chặn khi `PENDING`), `AC-N03.1`, `AC-N05.2`, `AC-N06.3`, `AC-N07.1`, `AC-N07.4`, `AC-N08.1`, `AC-N09.2`, `AC-N20.2`.

## 5. Chỗ đã gắn "(chờ spike)" (đúng ba điểm, contract mục 6)

1. `srs.md:425` — `AC-F16.10`: QueryDR `00/01` sau hạn và lối thoát cho ca bỏ dở.
2. `srs.md:413` — `AC-F15.8`: QueryDR `91` sau hạn → `FAILED`, `gatewayResponseCode = "EXPIRED"`.
3. `srs.md:407` — `AC-F15.1`: IPN coi là thất bại khi `vnp_TransactionStatus = 02`, kể cả khách hủy (`24`).

Ghi chú §1.4 (`srs.md:51`) nhắc quy ước này bằng chữ "chờ spike" không có ngoặc, để `grep -c "(chờ spike)"` cho đúng 3 khi Integrator gỡ nhãn. Mục 3.4 chỉ nêu ý nghĩa mã `24`, `51`... và không khẳng định kết quả sandbox ở các điểm trên.

## 6. Việc ngoài danh sách của card và chỗ cần nhóm quyết định

**Sửa thêm ngoài các dòng card nêu tên (đều trong `srs.md`, để không tự mâu thuẫn):** `AC-F10.1` và `AC-N05.2` thêm `POST /payments/:id/sync` và ghi IPN/return công khai; `AC-F20.1`/`AC-F20.2` (câu "thanh toán trả 2xx" mô tả luồng đồng bộ cũ); `AC-F22.1`; FR-25 mô tả và `AC-F25.3` (hủy bị chặn); `AC-N06.3` bỏ "số thẻ demo"; `AC-N09.2` và `AC-N20.2` đổi nhãn nút/danh sách log; hàng FR-26 ở §5.9 bỏ "mô phỏng"; vòng đời `Payment` thêm vào §3.6; thuật ngữ IPN, QueryDR, Return URL, `vnp_TxnRef` ở §9.

**Chỗ cần nhóm xác nhận hoặc quyết định:**

1. **Phân bổ AC mới giữa ba FR.** Contract chỉ cho đánh số tiếp theo `AC-F14.7`, `AC-F15.6`, `AC-F16.8`; worker chia: FR-14 là tạo URL, cấu hình, IPN thành công/không hợp lệ, return, `sync` thành công; FR-15 là thất bại, IPN muộn, `91`; FR-16 là replay, `PENDING`, quá hạn, `00/01`, lỗi QueryDR, IPN lặp, hủy. Có thể đổi nếu nhóm muốn chia khác (mã đổi theo thì phải đổi ở mọi tài liệu dẫn chiếu).
2. **Chi tiết lấy từ plan nhưng là mức giao diện/thiết kế**, đưa vào AC để kiểm được: poll `GET /orders/:id` mỗi 2 giây tối đa 30 giây (`AC-F14.11`), timeout QueryDR 10 giây (`AC-F16.11`), hạn 15 phút (`AC-F14.1`, §3.4). Nhóm bỏ nếu thấy SRS nên chỉ nêu yêu cầu.
3. **Định nghĩa `RspCode` ở §3.4** (`01` không có `Payment`, `02` không còn `PENDING`, `04` sai tiền, `97` sai chữ ký/merchant, `99` thiếu cấu hình/lỗi/chưa kết luận) viết theo plan mục 1.3; plan không liệt kê trọn lời giải thích từng mã.
4. **`AC-N12.1` (E2E tự động qua Chromium)** chưa sửa: luồng trả tiền chuyển sang trang VNPay nên E2E hiện tại không chạy xuyên qua cổng. Plan D3 ghi khoảng trống này; nhóm quyết định giữ, hạ mức hay đổi phạm vi E2E (dừng ở redirect).
5. **`PaymentStatus` vẫn có `REFUNDED`** (đã có từ trước, contract mục 3 liệt kê `SUCCESS`, `FAILED`, `PENDING`). Worker giữ `REFUNDED`, chỉ thêm `PENDING`; nhóm xác nhận có bỏ `REFUNDED` hay không (FR-26 vẫn Won't).
6. **Mã rủi ro:** SRS dẫn `R-13`, `R-14`, `R-15` do W0 đã đặt; nếu nhóm đổi số ở `context-and-scope.md` thì sửa lại dòng `srs.md:51`.

**Change request (đoạn ngoài allowed paths):** không có. Các việc cần wave khác xử lý (không phải CR vì chưa có đoạn cụ thể ngoài vùng):

- `uc-checkout.md` hiện chưa có `A6`, `E9`–`E13`, nên các dẫn chiếu luồng trong SRS chỉ đúng sau khi worker UC-04 merge.
- `docs/traceability-matrix.md` còn ghi `AC-F14.5`, `AC-F15.1`, `AC-F15.5` theo luồng simulator; cần cập nhật ở bước 4.5.

## 7. Rủi ro

- **Dẫn chiếu chéo chưa khớp trong lúc các worker Wave 1 chưa merge:** SRS dẫn luồng `A6`, `E9`–`E13` của `uc-checkout.md` và `ADR-007`; hai thứ này do worker khác tạo. Chưa có kiểm tra chéo giữa SRS và bản UC mới.
- **Nội dung là bản nháp theo plan, chưa có spike nào chạy:** ba điểm "(chờ spike)" và mọi hành vi VNPay khác (IPN gọi lại 10 lần cách 5 phút, `91`, `00/01`, `vnp_TransactionType = 01`) lấy từ plan, chưa đo trên sandbox.
- **`.svg` chưa đổi:** `use-case-overview.svg` còn hiển thị Payment simulator/Payment Service cho tới khi nhóm xuất lại (đã ghi ở W0); mục 2.2 của SRS dẫn tới ảnh này.
- **Line ending:** working tree dùng CRLF (`core.autocrlf=true`, index LF). Worker giữ CRLF nhất quán (708 CR / 708 LF); `git diff --check` sạch.

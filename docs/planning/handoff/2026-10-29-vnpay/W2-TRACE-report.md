# Report W2-TRACE — VNPAY-W2-TRACE

**Task card:** `VNPAY-W2-TRACE` (task `task_f6836f80c1ee`) · **Kế hoạch:** [vnpay-payment-plan](../../2026-10-29-vnpay-payment-plan.md), bước 4.5 · **Hợp đồng:** [contract.md](contract.md) · **Trạng thái:** `DONE_WITH_CONCERNS` (concern: mục 5 và 6, không chặn merge)

## 1. Commit và file

- Branch của worktree: `ThuanTran260/task-vnpay-w2-trace`. Lúc bắt đầu `git branch --show-current` trả `ThuanTran260/remora`, sau đó Orca đổi tên (cùng HEAD `61eb992`); worker không chạy lệnh đổi branch nào.
- Nền: `61eb992` (= `a2/payment-vnpay`).
- Commit nội dung: `6a7a9cfbb202792c6b47c7825a482e44e2271077` — `docs(payment): trace VNPay requirements in traceability matrix`.
- Commit report: ghi file này, message `docs(payment): add VNPay W2-TRACE worker report` (report không tự chứa hash của chính nó; lấy bằng `git log -1`).

| File | Nội dung chính |
|---|---|
| `docs/traceability-matrix.md` | +25/−22 dòng. Ghi chú đầu file; FR-14, FR-15, FR-16, FR-25, FR-31; FR-20, FR-26 (sửa nhỏ); NFR-03, 05, 06, 07, 08, 09, 11, 12, 13, 14, 15, 18, 19, 20; mục 3 |
| `docs/planning/handoff/2026-10-29-vnpay/W2-TRACE-report.md` (mới) | File này |

Không sửa `srs.md`, `uc-checkout.*`, `docs/diagrams/*`, ADR, `architecture.md`, `deployment.*`, plan, contract, ledger, `README.md`, `apps/`, `tests/`, `.github/`, `package*.json`, `.svg`.

## 2. Đã đổi gì trong ma trận

- **Ghi chú đầu file:** khối "VNPay sandbox (2026-10-29)" liệt kê dòng đã đổi, quy ước "dự kiến" cho cột Code/API và cột kiểm chứng, simulator hiện hành là bản cũ (xóa ở bước 5.7), `.svg` chưa xuất lại, `AC-F16.13` dời thành `AC-F25.4`.
- **FR-14/15/16:** use-case theo bảng mục 9 của `uc-checkout.md` (A2, A3, A5, A6; E3, E4a/E4d/E4e, E6–E13 đúng chỗ); thiết kế dẫn phần tử có thật trong bốn `.puml` (ba đoạn UC-04.2 và `opt` QueryDR của Sequence-01, swimlane VNPay của Activity-01, `PAYMENT_FAILED → PENDING` và vòng đời `Payment` của State-01, cột mới và `PaymentStatus.PENDING` của Class-01) cùng ADR-005 §A, ADR-007 §A–G, BR-05/09/10/11. Bốn endpoint và tên tệp theo plan bước 5–6 nằm ở FR-14, ghi "dự kiến". Kiểm chứng liệt kê mã AC còn hiệu lực của từng FR, `apps/api/test/vnpay.test.ts` (D3), các bước plan 7.x; ID test cũ giữ ở nhóm "Lịch sử simulator".
- **FR-25:** thêm `AC-F25.4`, UC-04 A5/E11, 409 `PAYMENT_IN_PROGRESS`, Activity-01 nhánh A5. **FR-31:** Won't = "cổng production thật".
- **FR-20, FR-26 (ngoài danh sách card, trong allowed paths):** FR-20 dẫn "bước 16" đã sai sau khi `uc-checkout.md` đánh lại số (màn xác nhận nay là bước 21, bảng mục 9); FR-26 ghi refund API VNPay ngoài phạm vi và `PaymentStatus` không có `REFUNDED` theo SRS mục 5.9.
- **NFR:** NFR-03/AC-N03.1, NFR-05/AC-N05.2 (ba endpoint mới), NFR-06/AC-N06.3 (bỏ `cardNumber`), NFR-07/AC-N07.1, AC-N07.4, NFR-08/AC-N08.1 (IPN HTTPS), NFR-09/AC-N09.2, NFR-11 (trang return), NFR-12/AC-N12.1 (E2E đóng vai VNPay, hiện chưa có test), NFR-13 (race IPN/`sync`, partial unique index), NFR-15 (`/health` khi thiếu biến), NFR-20 (warning đối soát). NFR-14, NFR-18, NFR-19 sửa vì `docs/deployment.md` (W0) đã đổi phần liên quan: mục "Local Docker", "Điều kiện trước lần deploy đầu tiên", smoke CD không bắt lỗi ký, README. Không sửa NFR-01, 02, 04, 10, 16, 17 (SRS và `deployment.md` không đổi phần liên quan).
- **Mục 3:** thêm bullet "Kiểm lại sau VNPay" (giữ 32 FR: 23 Must, 9 Won't; 20 NFR: 17 Must, 1 Should, 2 Could; `AC-F16.13` đã dời thành `AC-F25.4`, không dùng lại) và một câu phụ thuộc FR-14/15/16 → BR-10/BR-11, AC-F25.4 → AC-F16.9.

## 3. Lệnh acceptance và kết quả thật

Chạy từ gốc worktree sau commit nội dung.

| Lệnh / kiểm | Kết quả |
|---|---|
| Mỗi mã `AC-…` trong ma trận có dạng `<mã>:` trong `srs.md` (vòng lặp `grep -o "AC-[FN][0-9]\{2\}\.[0-9]\+" … \| sort -u` rồi `grep -q "<mã>:" docs/requirements/srs.md`) | 52 mã khác nhau, chỉ `AC-F16.13` không có. Đây là mã đã bỏ, được nhắc làm lịch sử ở ghi chú đầu file và mục 3 ("đã dời thành `AC-F25.4`") |
| Các khoảng AC (`AC-F14.1–AC-F14.13`, `AC-F16.9–F16.11`, `AC-F25.1–3`) | Mọi mã trong khoảng đều có `<mã>:` trong `srs.md` (`AC-F14.1` đến `AC-F14.13`, `AC-F16.9/10/11`, `AC-F25.1/2/3`) |
| Mỗi luồng `A…/E…` được dẫn có trong `uc-checkout.md` (`grep -o "\b[AE][0-9]\+[a-e]\?\b"`, đối chiếu tiêu đề `###` và gạch đầu dòng `- **E4a`) | Dẫn A1, A2, A3, A5, A6, E1a, E1b, E2, E3, E4, E4a, E4d, E4e, E5, E6, E7, E8a, E9, E10, E11, E12, E13; không có luồng nào thiếu. Số bước 3, 9–21 có trong luồng chính (bước lớn nhất 21) |
| Bốn endpoint (`grep -c -F`) | `POST /payments` 7 dòng; `GET /payments/vnpay/ipn` 5; `GET /payments/vnpay/return` 3; `POST /payments/:id/sync` 5 |
| `grep -c "chờ spike" docs/traceability-matrix.md` | 0 |
| Mỗi dòng FR/NFR có đủ 5 cột không rỗng (`awk -F'|'`) | 32 dòng FR và 20 dòng NFR, không dòng nào thiếu cột hay rỗng |
| `git diff --check a2/payment-vnpay...HEAD` | sạch (exit 0) |
| `git diff --name-only a2/payment-vnpay...HEAD` (sau commit nội dung) | `docs/traceability-matrix.md`. Sau commit report sẽ thêm file này |
| Link tương đối trong ma trận (vòng lặp `[ -e ]` từ `docs/`) | 11 link đều tồn tại, gồm `deployment.md`, `diagrams/README.md`, `architecture/adr/007-vnpay-sandbox.md`, `planning/2026-10-29-vnpay-payment-plan.md` |
| Quét dòng thêm tìm credential gán giá trị, URL chứa `vnp_SecureHash`, chuỗi hex/chữ số dài | không có. Chỉ có tên biến `VNP_TMN_CODE`, `VNP_HASH_SECRET`; URL IPN công khai `https://brewlite-a2-api.onrender.com/payments/vnpay/ipn` đã có trong `deployment.md` |
| `git status --porcelain` trước khi viết report | sạch |

### `grep -n -i "simulator\|mô phỏng\|Payment Service\|402\|PAYMENT_DECLINED\|4000000000000002\|4242\|REFUNDED"` — giải thích từng dòng

Không có kết quả cho `mô phỏng`, `Payment Service`, `4000000000000002`, `4242`. Mười dòng còn lại:

- **5** (ghi chú đầu file): nói simulator hiện hành là bản cũ và ID test là lịch sử.
- **39** (FR-14): "Bản cũ (simulator, xóa ở bước 5.7, không phải hành vi đích)" và nhóm "Lịch sử simulator" cho ID test.
- **40** (FR-15): "Bản cũ" nêu `payment.ts` và nhánh 402 `PAYMENT_DECLINED`; câu "`POST /payments` đích không còn trả 402" (đúng với AC-F15.1); nhóm "Lịch sử simulator (decline…)". Dòng này khớp `402`/`PAYMENT_DECLINED` ở cả hai chỗ.
- **41** (FR-16): nhóm "Lịch sử simulator", ghi thêm INT-S2-08 là ca thẻ trong body, không còn ở VNPay.
- **45** (FR-20): "(lịch sử simulator)" cho E2E-S2-01/02/04.
- **51** (FR-26): "`PaymentStatus` không có `REFUNDED`" là câu phủ định theo contract mục 3 và SRS mục 3.6, không mô tả hành vi.
- **67** (NFR-03): "không còn gọi `simulatePayment`" và "không dựa vào simulator" (bản cũ).
- **70** (NFR-06): "bản cũ còn kiểm `cardNumber` của simulator… bỏ ở bước 5.4".
- **75** (NFR-11): "(lịch sử simulator)" cho UNIT-P3-01/05.
- **76** (NFR-12): "bằng chứng lịch sử của simulator, không chứng minh AC-N12.1 mới".

## 4. Mã mới và nhãn chờ spike

- **Mã mới trong ma trận** (so với bản trước): BR-09, BR-10, BR-11; ADR-007; A6; E7, E4a, E4d, E4e, E8a, E9–E13 (E7, E4a/d/e, E8a, E9 đã có từ trước trong `uc-checkout.md`, chỉ mới được ma trận dẫn); `AC-F14.1/2/6/7/8/9/13`, `AC-F15.1/3/4/5/6/7/8`, `AC-F16.1/4/5/6/8/9/10/11/12`, `AC-F20.1`, `AC-F25.4`, `AC-N03.1`, `AC-N05.2`, `AC-N06.1`, `AC-N06.3`, `AC-N07.1`, `AC-N07.4`, `AC-N08.1`, `AC-N09.2`, `AC-N12.1`, `AC-N20.2` (đều có trong `srs.md`); `AC-F16.13` chỉ như mã đã bỏ.
- **Mã nằm ngoài contract:** không có. Không đặt mã FR/BR/AC/UC/E/A/R/NFR/ADR mới và không đặt ID test mới (chỉ dẫn `apps/api/test/vnpay.test.ts` và các bước plan 7.x).
- **Nhãn "(chờ spike)" trong ma trận:** không gắn (0 lần), theo card. Ba AC còn nhãn ở SRS là `AC-F15.1`, `AC-F15.8`, `AC-F16.10`; ma trận chỉ dẫn mã nên không cần sửa khi spike gỡ nhãn, trừ khi spike làm bỏ hoặc đổi mã AC (chạy lại vòng lặp ở mục 3).

## 5. Change request (ngoài allowed paths, chưa sửa)

- **CR-1: `README.md`** (NFR-19, AC-N19.2). Cũ: `grep -n -i "vnpay\|VNP_" README.md` không ra dòng nào, nên người ngoài nhóm không biết cần biến VNPay. Mới (sau khi bước 5.7 xong): thêm đoạn ngắn "Thanh toán dùng VNPay sandbox. Muốn trả tiền cần `VNP_TMN_CODE`, `VNP_HASH_SECRET`, `WEB_URL` trong `apps/api/.env` (không commit). Thiếu biến thì API vẫn chạy, chỉ tạo URL thanh toán mới trả 502; xem docs/deployment.md". Ma trận NFR-19 đã ghi "README chưa nêu biến VNPay".
- **CR-2: `docs/requirements/uc-checkout.md` mục 9, dòng E12.** Cũ: `| E12 | Tiền về sau trạng thái cuối, warning đối soát | FR-14 | NFR-20 |` (và "Yêu cầu: FR-14, BR-11, NFR-20" ở E12). Mới: cột FR thành `FR-14, FR-15`. Lý do: SRS FR-15 liệt kê E12 và `AC-F15.7` dẫn E12; ma trận đã đặt E12 ở cả FR-14 và FR-15.
- **CR-3: `docs/requirements/srs.md`, NFR-13.** `AC-N13.1` không nêu race IPN/`sync` và partial unique index, nên ma trận dẫn thêm `AC-F16.8`, `AC-F16.12`. Nếu nhóm muốn NFR-13 tự đứng: thêm `AC-N13.2` (mã tiếp theo của NFR-13): "Hai yêu cầu tạo thanh toán đồng thời cho một đơn chỉ để lại tối đa một `Payment PENDING` (partial unique index `payments_one_pending_per_order`); IPN và `sync` cùng xác nhận một payment chỉ tạo một `Payment SUCCESS` và kho chỉ trừ một lần." Nếu giữ nguyên, không cần sửa gì.
- **CR-4: `docs/architecture/architecture.md` dòng 28.** Cũ: "module `payments` trong `apps/api`". Mới: "các tệp trong `apps/api/src/payment/`, đăng ký ở `checkout.module.ts`". Lý do: plan bước 5.2–5.5 đặt tệp ở thư mục `payment` (số ít) và ghi "không tạo thêm module riêng"; ma trận theo plan nên hai nơi đang lệch tên.
- **Ghi nhận, không sửa:** SRS FR-14 ("Luồng UC-04 liên quan: luồng chính, E9, E10, E13") ngắn hơn bảng mục 9 của `uc-checkout.md` (thêm A2, A6, E6, E7, E11, E12). Ma trận theo bảng mục 9.

## 6. Chỗ cần nhóm quyết định và rủi ro

- **Quyết định:** CR-3 (thêm hay không `AC-N13.2`); đặt ID test cho `vnpay.test.ts` và các kiểm sandbox theo quy ước `UNIT-Txx`/`INT-Txx` khi bước 5–7 xong (worker không tự đặt). Ma trận hiện ghi theo số bước plan.
- **Rủi ro 1:** các ô "dự kiến" chưa có code hay kết quả thật. Khi code bước 5–6 xong phải thay bằng đường dẫn và kết quả thật; tên tệp theo plan có thể đổi (xem CR-4).
- **Rủi ro 2:** `.svg` của bốn sơ đồ chưa xuất lại, còn mô tả simulator (ghi ở `docs/diagrams/README.md`). Ma trận dẫn phần tử theo `.puml`; ai mở `.svg` sẽ thấy khác.
- **Rủi ro 3:** các ô FR-14/15/16 rất dài (cột Code/API và kiểm chứng). Giữ đủ 5 cột theo quy tắc đề A2 §8.1 nên không tách dòng; khó đọc trong terminal.
- **Rủi ro 4:** số bước plan 7.x (7.3, 7.7b…) được dẫn bằng số; nếu plan đánh lại số thì ma trận lệch.
- **Chưa làm:** không render PlantUML (card không sửa `.puml`); không chạy npm, docker, dev server hay graphify.

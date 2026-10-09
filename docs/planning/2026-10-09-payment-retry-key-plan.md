# Kế hoạch: giữ một key trả tiền cho mỗi màn Thanh toán (phương án A) và chốt chặn trước khi merge

> Dành cho agent thực hiện. Làm trên nhánh `fix/backend-hardening` (HEAD `abaae5b`), mỗi task 1 commit sau khi test xanh. Không merge, không push. Xong thì báo người dùng để Claude (session lập plan) review.

- **Lỗi cần sửa:** đã trả tiền nhưng giao diện mất phản hồi (rớt mạng, 5xx). Khách bấm lại "Xác nhận trả" thì `PaymentForm` sinh `Idempotency-Key` mới (`frontend/src/components/PaymentForm.tsx:46`), backend trả 400 `Invalid transition PAID -> PAID`. Không trừ tiền 2 lần, nhưng giao diện báo lỗi trong khi đơn đã trả.
- **Phương án A (người dùng chọn):** `PaymentForm` giữ một key trả tiền cho cả phiên màn Thanh toán, giống `orderKey` ở dòng 33. Component gắn với đúng một đơn (`orderId` cũng là state của nó). Không sửa backend.
- **Rule bắt buộc:** `.claude/rules/doc-code-sync.md`. Đổi hành vi thì sửa sơ đồ, mục C, Phần III và test trong cùng commit với code.

## Bằng chứng phương án A đúng (đã chạy 2026-10-09)

Chạy `PaymentService` với repo Prisma trên Postgres compose, code của nhánh `fix/backend-hardening`, dữ liệu tạm đã dọn:

| # | Kịch bản | Kết quả |
|---|---|---|
| S0 | Lỗi hiện tại: đã trả, bấm lại với key **mới** | 400 `Invalid transition PAID -> PAID`, đơn `PAID` |
| S1 | Đã trả, mất phản hồi, bấm lại **cùng key** | 200, cùng `paymentId`, trừ tiền 1 lần, 1 biên lai |
| S2 | Thẻ bị cổng từ chối (`MOCK_GATEWAY_DECLINE_METHOD=CARD`), đổi sang Ví, cùng key | 400 (`PAYMENT_FAILED`) → 201 `PAID`, 1 biên lai |
| S3 | Kẹt kho 409 (đã hoàn tiền), nhập thêm kho, thử lại cùng key | 409 → 201 `PAID`, 1 biên lai |
| S4 | Bấm lại khi request đầu còn chạy (song song, cùng key) | 201 + 200 cùng `paymentId`, trừ tiền 1 lần |
| S5 | Key của đơn A đem dùng cho đơn B | 422, đơn B vẫn `PENDING` |
| S6 | Đã trả, khách hủy ở tab khác, bấm lại cùng key ở màn cũ | 200 kèm biên lai cũ, đơn `CANCELLED` (xem "Không làm") |

Lý do S1–S4 đúng: backend chỉ lưu key khi trả **thành công** (biên lai ghi trong transaction). Lần lỗi (400 cổng từ chối, 409 / 404 / 500 sau khi trừ tiền đã hoàn) không lưu key, nên thử lại cùng key đi nhánh Cache Miss và trừ tiền lại. Lần đã thành công thì trúng cache. Trong một phiên màn Thanh toán, key luôn đi với cùng một đơn: `orderKey` cố định nên `POST /orders` thử lại vẫn trả cùng đơn. Vì vậy S5 không xảy ra từ giao diện.

## Task 0: Chuẩn bị

- [x] `git branch --show-current` là `fix/backend-hardening`; `git status --short` chỉ còn file plan này.
- [x] Chạy mốc test: backend `npx jest` 120 pass / 2 skip, `npx tsc --noEmit` sạch; frontend `npx vitest run` 93 pass, `npx tsc --noEmit` sạch; suite pg 2 pass. Lệch mốc thì dừng và báo người dùng.
- [x] Commit file plan: `docs: plan giu key tra tien (phuong an A)`.

## Task 1: Ghim hành vi backend mà phương án A dựa vào (chỉ thêm test)

S1 và S4 đã có test (`(b) same Idempotency-Key charges once`, `(b) concurrent same Idempotency-Key charges once` trong `backend/test/order-payment.integration.spec.ts`). Thêm 2 test cho "lỗi rồi thử lại cùng key". Đây là test ghim hành vi đã có, xanh ngay là đúng.

- [x] `backend/test/payment-failure.spec.ts`, trong `describe('MOCK_GATEWAY_DECLINE_METHOD')`: CARD bị từ chối → 400 + `PAYMENT_FAILED`; thử lại cùng đơn bằng WALLET với **cùng key** → `PAID`, đúng 1 biên lai theo key đó. Giữ test cũ dùng key mới (cả hai cách đều phải chạy được).
- [x] `backend/test/order-payment.integration.spec.ts`, trong `describe('lỗi sau charge thành công → hoàn tiền + PAYMENT_FAILED')`: kẹt kho (409, hoàn tiền, `PAYMENT_FAILED`) rồi nhập thêm kho, thử lại **cùng key** → `PAID`; gateway hoàn đúng 1 lần, có 1 biên lai.
- [x] Không sửa file nào trong `backend/src`.
- [x] Commit `test(backend): ghim thu lai cung Idempotency-Key sau loi cong / ket kho`.

## Task 2: Phương án A ở frontend, kèm tài liệu

- [ ] `frontend/src/components/PaymentForm.tsx`:
  - thêm `const [payKey] = useState(newIdempotencyKey);` cạnh `orderKey`;
  - dòng 46 dùng `idempotencyKey: payKey`;
  - sửa comment dòng 30 ("với key MỚI") và dòng 32 ("mỗi lần một key mới") cho đúng: cả hai key cố định trong một phiên màn Thanh toán, khác nhau giữa tạo đơn và trả tiền.
- [ ] `frontend/src/lib/payment/types.ts:52`: sửa doc comment của `newIdempotencyKey()` (hiện ghi "Mỗi lần 'Xác nhận trả' sinh 1 key").
- [ ] Test frontend: môi trường vitest là `node`, không có jsdom hay testing-library, nên **không thêm thư viện** để bấm nút trong component. Thêm 1 test ở `frontend/src/lib/payment/api-gateway.test.ts`:
  - lần 1 `POST /payments` rớt mạng (`fetch` reject) → `PaymentError` mang `orderId`;
  - lần 2 gọi `pay()` với **cùng** `idempotencyKey` và `orderId` đó, backend trả 200 `{ orderId, amount }` → kết quả `PAID`;
  - kiểm header `Idempotency-Key` của 2 lần `/payments` bằng nhau và chỉ có 1 lần `POST /orders`.
- [ ] Tài liệu `docs/user-sequence-specifications.md`:
  - §2.4 A.2: thay "Mỗi lần bấm sinh một Idempotency-Key mới" và "key mới" ở gạch "Thử lại sau khi lỗi" bằng: 1 key trả tiền cho mỗi phiên màn Thanh toán, dùng lại khi thử lại.
  - §2.4 sơ đồ: note "Gửi kèm Idempotency-Key MỚI cho mỗi lần bấm" và bước "Giữ orderId #1042 … (key mới)" đổi thành cùng key. Ở nhánh Cache Hit thêm note "bấm lại sau khi mất phản hồi (cùng key) cũng vào nhánh này, nhận lại biên lai 200". Giữ note "đơn đã PAID mà gửi key mới → 400" vì vẫn đúng với người gọi API tay.
  - §2.4 mục C: dòng "Thứ tự gọi ở Frontend" (bỏ "`newIdempotencyKey()` mỗi lần bấm") và cuối dòng "Chống trừ tiền trùng" (thay "FE luôn sinh key mới cho mỗi lần thử lại" bằng lý do dùng lại key: lần lỗi không lưu key nên trừ tiền lại được, lần đã trả thì trúng cache).
  - §2.5 KB1 sơ đồ: "Idempotency-Key MỚI" → "cùng Idempotency-Key (có thể đổi phương thức)"; note "(key mới nên đi nhánh Cache Miss)" → "(lần trước lỗi nên key chưa được lưu: đi nhánh Cache Miss)".
  - Phần III dòng UC05: thêm "FE dùng lại key khi thử lại".
- [ ] `docs/develop-status-report.md` mục 6: chuyển gạch "Mất phản hồi sau khi đã trả tiền" từ "Giới hạn còn lại" sang đã sửa, ghi commit.
- [ ] Render lại khối PlantUML §2.4 và §2.5 (PlantUML 1.2024.7 từ Maven Central, SHA-1 `cb57b315d96413d55622edaa8c4b234e2ebf4b1f`, tải vào thư mục tạm, không commit), mở PNG kiểm không có "Syntax Error".
- [ ] Commit `fix(frontend): giu mot key tra tien cho moi man Thanh toan (phuong an A)`.

## Task 3: Chốt chặn trước khi merge

- [ ] Backend `npx jest` + `npx tsc --noEmit`, suite pg, frontend `npx vitest run` + `npx tsc --noEmit`. Ghi số test mới.
- [ ] `docker compose up -d --build`, rồi smoke bằng curl với tài khoản demo:
  1. `POST /orders` (có key tạo đơn) → `POST /payments` key K → 201 → gửi lại đúng request với K → 200, cùng `paymentId`.
  2. Đặt `MOCK_GATEWAY_DECLINE_METHOD=CARD` trong `.env`, `docker compose up -d backend`. Đơn mới: trả `CARD` với K2 → 400; trả `WALLET` cùng K2 → 201.
  3. Xóa biến khỏi `.env`, `docker compose up -d backend`, kiểm Thẻ trả được.
- [ ] Chạy skill `code-review` cho cả nhánh (fixed point `develop`). Sửa finding (commit riêng nếu có).
- [ ] Cập nhật số test ở `docs/develop-status-report.md` và `docs/scrum-process.md`; tick plan này. Commit `docs: bao cao phuong an A va chot chan truoc merge`.
- [ ] Báo người dùng: danh sách commit mới, kết quả test và smoke, finding còn lại. Ghi rõ việc còn cần người làm: xem bằng mắt trên trình duyệt (ảnh món; Thẻ bị từ chối → đổi Ví → thành công trên giao diện).

## Không làm (có lý do)

- **S6, biên lai cũ khi đơn đã bị hủy ở nơi khác:** cache trả "kết quả cũ đã lưu" (đúng như §2.4 mô tả), biên lai là thật vì tiền đã trừ rồi được hoàn khi hủy. Chỉ gặp khi khách vừa mất phản hồi vừa hủy đơn ở tab khác rồi quay lại bấm. Muốn sửa phải đổi backend (trả trạng thái đơn hiện tại khi trúng cache) và giao diện (hiện trạng thái đó), ngoài phạm vi "không sửa backend" của phương án A. Ghi vào backlog nếu người dùng muốn.
- **Test bấm nút trong `PaymentForm`:** cần thêm jsdom và testing-library. Không thêm phụ thuộc cho một thay đổi một dòng; hành vi được ghim ở tầng gateway (Task 2) và backend (Task 1).
- **Giỏ hàng chặn 20 dòng:** để sang đợt cải thiện UI.

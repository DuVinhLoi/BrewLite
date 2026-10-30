# Report C1-WEB — VNPAY-C1-WEB

**Task card:** `VNPAY-C1-WEB` (task `task_97583c3328fa`, dispatch `ctx_f9b2e369c6b3`, retry ngày 2026-10-30 của dispatch `ctx_80f768582602`) · **Kế hoạch:** [vnpay-payment-plan](../../2026-10-29-vnpay-payment-plan.md), bước 6.1–6.4 · **Hợp đồng:** [contract.md](contract.md) · **Trạng thái:** `DONE_WITH_CONCERNS` (concern: mục 6, chưa chạy thử trên trình duyệt và chưa chạy `next build`)

## 1. Commit và file

- Branch của worktree: `ThuanTran260/task-47f146ac95df`, worktree `E:\orca\workspaces\BrewLite\vnpay-c1-web`.
- Nền: `86acc56` (= `a2/payment-vnpay`).
- Commit code: `fe6ebea0695e848014d98f43b059a40815d53721` — `feat(web): redirect checkout to VNPay and add payment return page`.
- Commit report: ghi file này, message `docs(payment): add VNPay C1-WEB worker report` (report không tự chứa hash của chính nó; lấy bằng `git log -1`).

| File | Bước | Nội dung chính |
|---|---|---|
| `apps/web/src/lib/shop.ts` | 6.3 | Kiểu `Payment`, `Order.payments`, `PaymentResult`, `PaymentSync`, `VnpayReturn`; `paymentLabels`, `paidStatuses`, `checkoutKey`, `pendingPayment`, `isExpired`, `vnpayMessage`, `verifyingText`, `paymentError` |
| `apps/web/src/components/shop/CheckoutScreen.tsx` | 6.1, 6.4 | Bỏ ô số thẻ; nút "Thanh toán qua VNPay"; redirect `paymentUrl`; "Tiếp tục thanh toán" / "Kiểm tra trạng thái"; xử lý 409/502 |
| `apps/web/src/components/shop/VnpayReturnScreen.tsx` (mới) | 6.2 | Client Component có `useSearchParams`: gọi `/payments/vnpay/return`, poll đơn, `sync` một lần |
| `apps/web/src/app/payment/vnpay-return/page.tsx` (mới) | 6.2 | Page bọc `<Suspense>` quanh `VnpayReturnScreen` |
| `apps/web/src/components/shop/OrdersScreen.tsx` | 6.3 | Nhãn "Đang chờ VNPay", chặn hủy khi còn payment chưa kết luận, nút đối soát khi quá hạn |
| `docs/planning/handoff/2026-10-29-vnpay/C1-WEB-report.md` (mới) | — | File này |

Không sửa `apps/api/`, `ShopProvider.tsx`, `ApiError` (`lib/api.ts`), `InventoryScreen.tsx`, `globals.css`, `package*.json`, `next.config.*`. Không cần class CSS mới: chỉ dùng `shop-page`, `shop-actions`, `shop-button` có sẵn.

## 2. Rà các file còn lại từ lần trước

Lần trước dừng khi chưa commit và chưa lint. Tôi đọc lại từng file theo card; kết quả:

- `shop.ts`: kiểu và hàm đúng với plan 1.5/1.7. Giữ nguyên, chỉ thêm `verifyingText` và `paymentError` để ba màn dùng chung một chỗ.
- `VnpayReturnScreen.tsx`: đúng các gạch đầu dòng của 6.2, giữ nguyên logic. Chỉ đổi hai chỗ nhỏ: dùng `verifyingText` thay chuỗi viết lặp, và gõ kiểu `shopApi<PaymentSync>` cho lệnh `sync`.
- `page.tsx`: đúng mẫu `app/checkout/page.tsx` cộng `<Suspense>`. Giữ nguyên.

## 3. Hành vi đã làm (theo card)

**6.1 `CheckoutScreen`**
- Không còn `card`, `cardError`, `cardNumber`. Body `POST /payments` chỉ có `{ orderId, paymentMethod }`.
- `201`/`200` trạng thái `PENDING` có `paymentUrl`: lưu `{ orderId, key, paymentId, paymentMethod }` vào `sessionStorage` (khóa `brewlite-checkout:<email>`) rồi `window.location.assign(paymentUrl)`. Giỏ và phiên **không** bị xóa lúc này.
- `Idempotency-Key`: giữ nguyên cơ chế cũ (cùng `orderId` thì dùng lại key đã lưu, kể cả khi quay lại từ trang đăng nhập hoặc trang VNPay).
- Replay `SUCCESS` (không có `paymentUrl`): không redirect, tải lại đơn từ DB; chỉ khi DB trả `PAID`/`PREPARING`/`READY`/`COMPLETED` thì xóa phiên đúng đơn, xóa giỏ, chuyển `/orders/:id` (nhánh có sẵn của effect tải đơn).
- Đơn có `Payment PENDING` (đọc từ `GET /orders/:id`): ẩn form, hiện "Tiếp tục thanh toán" (URL cũ) khi còn hạn; quá hạn hoặc thiếu `expiresAt` thì hiện `verifyingText` và nút "Kiểm tra trạng thái" (gọi `POST /payments/:id/sync`, rồi tải lại đơn). Hạn được kiểm lại lúc bấm nút, nên URL hết hạn không bị mở.
- 409 từ `POST /payments`: không coi là "đang thanh toán" ngay; đọc lại đơn và để trạng thái DB quyết định (đã trả thì rời trang, đã hủy thì nút "Bắt đầu đơn mới", còn pending thì hai nút trên).
- 502 hoặc mất phản hồi: "Có lỗi xảy ra, vui lòng thử lại". 402 không còn nhánh riêng.
- Tiêu đề thành "Thanh toán qua VNPay (sandbox)", bỏ câu "Chỉ dùng số thẻ demo" (6.4).

**6.2 trang `/payment/vnpay-return`**
- `useSearchParams` nằm trong `VnpayReturnScreen`; `page.tsx` bọc `<Suspense>`.
- Gọi `GET /payments/vnpay/return?<query>`. `valid: true` thì lấy `orderId` và `responseCode`; `valid: false` hoặc lỗi gọi thì chỉ lấy `orderId` trong `sessionStorage` của chính khách, không dùng ID trong query.
- Poll `GET /orders/:id` mỗi 2 giây, tối đa 30 giây. Hết 30 giây mà còn `PENDING` thì gọi `sync` **một lần**; 409/502 hiện `verifyingText` kèm nút "Kiểm tra lại" (nút này đọc đơn và `sync` một lần nữa, không lặp tự động). Timer dừng khi rời trang (`active = false` và `clearTimeout`).
- Đơn đã trả: dọn phiên và giỏ của đúng đơn, `router.replace('/orders/:id')`. `PAYMENT_FAILED`: giữ giỏ, hiện `vnpayMessage(code)` kèm "Đơn của bạn vẫn được giữ…", nút "Thử lại" và liên kết "Xem hoặc hủy đơn". `CANCELLED`, đơn không còn payment chờ, không xác định được đơn: mỗi trường hợp một thông báo riêng.
- Chưa đăng nhập: liên kết tới `/login?next=<đường dẫn return kèm query>`; 401 thì `logout` rồi chuyển tới đăng nhập với `expired=1`.

**6.3 `OrdersScreen`**
- Dòng payment dùng `paymentLabels`: `PENDING` là "Đang chờ VNPay".
- Đơn `PENDING`/`PAYMENT_FAILED` ở trang chi tiết: còn `Payment PENDING` thì không có nút "Hủy đơn". Còn hạn: câu "Đơn đang chờ thanh toán qua VNPay nên chưa thể hủy." và liên kết "Tiếp tục thanh toán" (qua `/checkout?order=<id>`). Quá hạn: `verifyingText` và nút "Kiểm tra trạng thái" (gọi `sync`, rồi tải lại đơn). Không còn payment chưa kết luận thì mới hiện "Thử thanh toán" và "Hủy đơn" như cũ.
- Trang chi tiết đã poll 5 giây sẵn, nên khi payment được đóng thì nút hủy xuất hiện sau tối đa 5 giây.

## 4. Lệnh acceptance và kết quả thật

Chạy từ `apps/web`, sau khi sửa xong và trước commit code.

| Lệnh / kiểm | Kết quả |
|---|---|
| `npm run lint` (`eslint .`) | đạt, exit 0, không có dòng lỗi hay cảnh báo (0 lỗi) |
| `npm run typecheck` (`tsc --noEmit`) | đạt, exit 0, không có dòng lỗi |
| `grep -rn -i "cardNumber\|số thẻ demo\|mô phỏng\|4242\|0002" src` | không có dòng nào (grep exit 1); không cần giải thích |
| `next build`, `next dev` | **không chạy**, theo card (Integrator chạy `next build` ở G6) |
| `git diff --check a2/payment-vnpay...HEAD` | sạch (exit 0). Git in cảnh báo "LF will be replaced by CRLF" cho các file web; đó là cảnh báo `autocrlf` của Windows, không phải lỗi khoảng trắng |
| `git diff --name-only a2/payment-vnpay...HEAD` (sau commit code) | đúng 5 file: `page.tsx`, `CheckoutScreen.tsx`, `OrdersScreen.tsx`, `VnpayReturnScreen.tsx`, `shop.ts`; đều trong allowed paths. Sau commit report sẽ thêm file này |
| Quét dòng thêm tìm `vnp_SecureHash`, `secret`, `tmncode`, `password`, `api key`, private key, URL sandbox | không có kết quả |
| `git log -1 --format=%B \| grep -ci "co-authored-by"` | 0 |
| `git status --porcelain` sau commit code | sạch |
| Test đỏ trước khi xanh | không áp dụng (card không yêu cầu TDD; `apps/web` không có test runner) |

Giới hạn của bằng chứng: chỉ có lint và typecheck. API chưa có nên chưa gọi thật, chưa mở trình duyệt, chưa chạy `next build` (nơi Next 16 kiểm `useSearchParams` ngoài `<Suspense>`).

## 5. Ba điểm "(chờ spike)" và change request

Phía web không có nhánh code gắn riêng với ba điểm này: web chỉ đọc trạng thái DB (`Order.status`, `Payment.status`) và mã HTTP 409/502 của API, còn bảng mục 1.6 và 1.3 nằm ở API. Phần web có thể phải đổi sau spike nằm gọn trong `apps/web/src/lib/shop.ts`:

- QueryDR `00`/`01` sau hạn (AC-F16.10): API giữ `PENDING` và trả 409. Web hiện `verifyingText` cùng nút "Kiểm tra trạng thái" hoặc "Kiểm tra lại". Nếu spike chốt cách đóng khác (nhân viên đóng tay) mà cần câu chữ riêng, sửa `verifyingText`.
- `91` sau hạn (AC-F15.8): API đóng `FAILED` với `gatewayResponseCode = "EXPIRED"`, đơn `PAYMENT_FAILED`. Web chỉ thấy `PAYMENT_FAILED` và cho thử lại hoặc hủy; không có mã VNPay gốc nên dùng câu mặc định của `vnpayMessage`.
- IPN thất bại khi `vnp_TransactionStatus = 02` (AC-F15.1): xử lý ở API. Web chỉ chọn câu chữ theo `responseCode` trên return qua `vnpayMessage`; trạng thái luôn lấy từ DB.

**Change request:** không có. Không cần sửa ngoài allowed paths.

## 6. Rủi ro và việc còn lại

- Chưa chạy trên trình duyệt với API thật. Cần Integrator hoặc người dùng chạy luồng ở bước 7.3–7.5 của plan để xác nhận redirect, return, poll và `sync`.
- `next build` chưa chạy (G6). Điểm cần xem là `/payment/vnpay-return` có prerender được nhờ `<Suspense>`.
- Hợp đồng API chưa có code: nếu API đặt tên trường khác mục 1.5 (`paymentUrl`, `expiresAt`, `gatewayResponseCode`, `gatewayTransactionStatus`, `{ valid, paymentId, orderId, responseCode }`) thì kiểu trong `shop.ts` phải đổi theo.
- Lệch nhỏ so với AC-F15.4: màn thất bại trên trang return có nút "Thử lại" và liên kết "Xem hoặc hủy đơn" (nút "Hủy đơn" nằm ở `OrdersScreen`), không có nút "Hủy đơn" ngay trên trang return. Cần nút riêng thì bổ sung ở card sau.
- Khi `POST /payments` trả 409 trên màn thanh toán, lỗi gốc của API không hiển thị; màn hiển thị theo trạng thái DB sau khi tải lại. Nếu DB không có payment chờ và đơn vẫn thanh toán được thì người dùng thấy form như cũ mà không có lời giải thích.
- `OrdersScreen` đánh giá "còn hạn / quá hạn" theo lần đọc đơn gần nhất (poll 5 giây), nên lệch tối đa vài giây so với `expiresAt`; API vẫn là bên chốt (409 hoặc đối soát).
- Nhóm chưa có test cho web (không có runner trong `apps/web`); điều này nằm ngoài card.

## 7. Giải thích cho nhóm

Đọc theo thứ tự này:

1. **`lib/shop.ts`** — kiểu dữ liệu và hàm nhỏ dùng chung. `Payment` là một lần thanh toán trong `GET /orders/:id`. `pendingPayment(order)` tìm payment đang chờ. `isExpired(payment, now)` so `expiresAt` với giờ hiện tại. `vnpayMessage(code)` đổi mã VNPay thành câu cho khách (chỉ chọn câu chữ, không quyết định kết quả). `checkoutKey(email)` là khóa `sessionStorage` chung của ba màn.
2. **`CheckoutScreen.tsx`** — màn thanh toán. Bấm nút thì gọi `POST /payments`, nhận `paymentUrl` rồi chuyển trình duyệt sang VNPay. Nếu đơn đã có giao dịch chờ thì màn hiển thị "Tiếp tục thanh toán" hoặc "Kiểm tra trạng thái" thay cho form. Quy tắc xuyên suốt: chỉ DB mới cho biết đơn đã trả, nên giỏ chỉ bị xóa khi đọc lại đơn thấy trạng thái đã trả.
3. **`app/payment/vnpay-return/page.tsx`** — vỏ mỏng bọc `<Suspense>`, vì `useSearchParams` cần nó khi build.
4. **`VnpayReturnScreen.tsx`** — nơi VNPay đưa khách về. Màn xác định đơn (qua `/payments/vnpay/return` hoặc `sessionStorage`), rồi hỏi `GET /orders/:id` mỗi 2 giây trong tối đa 30 giây chờ IPN. Hết giờ mà còn chờ thì gọi `sync` một lần để API hỏi VNPay. Kết quả hiển thị theo trạng thái đơn trong DB.
5. **`OrdersScreen.tsx`** — lịch sử và chi tiết đơn. Đơn còn giao dịch chờ thì không cho hủy; quá hạn thì có nút kiểm tra trạng thái để API đối soát với VNPay.

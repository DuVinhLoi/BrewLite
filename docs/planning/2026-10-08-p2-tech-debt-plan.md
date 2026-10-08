# Kế hoạch Ưu tiên 2 — nợ kỹ thuật (2026-10-08)

> **Cho agent thực thi:** làm theo thứ tự, đánh dấu `- [x]` khi xong. Mỗi task có tiêu chí "Xong khi" — chưa đạt thì chưa tick. Không commit/push nếu task không ghi rõ là được commit.

**Điều kiện bắt đầu:** đã xong `2026-10-08-p1-must-do-plan.md` (đặc biệt Task 3 commit) để thay đổi ở đây nằm trong commit riêng.

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

## Ưu tiên 2 — Nợ kỹ thuật (làm nếu còn thời gian)

> Mỗi task độc lập, làm theo thứ tự nào cũng được. Task có sửa code phải viết test trước (đỏ → xanh) và giữ toàn bộ test xanh.

### Task 1: Bọc hủy đơn `PAID` trong transaction

**File:** `backend/src/payment/payment.service.ts` (`cancel()`), `backend/test/order-payment.integration.spec.ts`

- [x] Test: giả lập `restoreStock` ném lỗi giữa chừng → kho và trạng thái đơn không bị đổi dở dang.
- [x] Bọc `restoreStock` (mọi món) + `updateStatus(CANCELLED)` trong `orders.runInTransaction(tx => …)`; refund gọi ngoài transaction (giống luồng thanh toán).
- [x] Sửa docs 2.5 mục C + `develop-status-report.md` mục 2.4 (bỏ câu "hủy PAID chưa bọc transaction").

**Xong khi:** test mới xanh, các test hủy đơn cũ vẫn xanh.

### Task 2: Nút "Hủy đơn" trên frontend (UC06 KB2/KB3)

**File:** `frontend/src/app/history/page.tsx`, có thể thêm helper trong `frontend/src/lib/api.ts`

- [x] Nút "Hủy đơn" cho đơn `PENDING` / `PAYMENT_FAILED` / `PAID`; gọi `PATCH /orders/:id { status: 'CANCELLED' }` kèm `Authorization: Bearer <brewlite-token>`; hỏi xác nhận trước khi hủy đơn `PAID` (có hoàn tiền).
- [x] Hiển thị lỗi 400/403 từ backend; thành công thì tải lại danh sách.
- [x] Test vitest cho helper gọi API (header, body, xử lý lỗi).
- [x] Bỏ ghi chú "FE chưa có nút Hủy" trong `docs/user-sequence-specifications.md` (2.5 + Phần III) và `docs/use-case-specifications.md` (bảng mục 4); vẽ lại KB2/KB3 có lifeline FE.

**Xong khi:** hủy được đơn trên trình duyệt, docs không còn nhắc "chỉ gọi bằng curl".

### Task 3: Xử lý code chết lỗi/rỗng ở UC01

**File:** `frontend/src/lib/api.ts`, `frontend/src/components/ProductGrid.tsx`

- [x] Chọn 1 hướng: (a) chỉ rơi về menu mẫu khi **không** cấu hình `NEXT_PUBLIC_API_URL`, còn lại trả lỗi/rỗng thật để `ProductGrid` hiện error + retry / empty; hoặc (b) giữ fallback, xóa nhánh error/empty không dùng.
- [x] Test vitest cho `getProducts()` theo hướng đã chọn.
- [x] Sửa docs UC01 (note sơ đồ 2.1 + mục C) và `develop-status-report.md` Task 3.

**Xong khi:** hành vi và docs khớp nhau, không còn nhánh code không bao giờ chạy.

### Task 4: Test chốt bảng giá phía backend

**File:** `backend/test/order-product.spec.ts` (hoặc file test mới)

- [x] Test pin `SIZE_UPCHARGE = { S: 0, M: 5000, L: 10000 }`, `TOPPING_PRICES = { 'Trân châu': 5000, 'Kem cheese': 8000, 'Thạch cà phê': 6000 }`, `DEFAULT_SIZE = 'M'` — cùng giá trị với `frontend/src/lib/pricing.test.ts`.

**Xong khi:** đổi giá ở 1 bên mà quên bên kia thì có test đỏ.

### Task 5: Bỏ `unitPrice` khỏi request tạo đơn của FE

**File:** `frontend/src/lib/payment/types.ts` (`CartLine`), `frontend/src/lib/payment/api-gateway.ts`, `PaymentForm.tsx`

- [x] Map giỏ sang `{ productId, quantity, size, toppings }` trước khi gửi `POST /orders` (hiện gửi nguyên `CartItem`, backend whitelist loại bỏ trường thừa).
- [x] Cập nhật `api-gateway.test.ts`: assert body `/orders` không có `unitPrice`, `name`, `key`, `lineTotal`.

**Xong khi:** body `POST /orders` chỉ chứa các trường DTO nhận.

### Task 6: Dọn đơn `PAYMENT_FAILED` bị bỏ lại (tùy chọn)

**Bối cảnh:** bấm "← Quay lại giỏ" làm mất `orderId` (cố ý, vì giỏ có thể đổi) → lần sau tạo đơn mới, đơn lỗi cũ nằm lại.

- [x] Quyết định có dọn không. Nếu có: giữ `orderId` cũ ở `cart/page.tsx`; khi tạo đơn mới thì hủy đơn cũ (`PATCH … CANCELLED`) — phụ thuộc Task 2 (helper hủy đơn). → **Đã quyết định: không dọn** (lý do ở `develop-status-report.md` mục 2.7).

**Xong khi:** đã quyết định và ghi lại trong `develop-status-report.md`; nếu làm thì có test.

### Task 7: Khóa thanh toán dùng được với nhiều instance (chỉ khi scale)

**File:** `backend/src/payment/payment.service.ts` (`withLock`)

- [ ] Chỉ làm nếu chạy > 1 backend. Thay khóa trong tiến trình bằng `pg_advisory_xact_lock(hashtext(orderId))` hoặc `SELECT … FOR UPDATE` trên `Order`, đặt quanh bước kiểm tra cache → charge. *(Không áp dụng: compose 1 backend — ghi ở `develop-status-report.md` mục 2.8.)*
- [ ] Test trên pg suite với nhiều request song song.

**Xong khi:** không áp dụng cho compose hiện tại (1 backend) — giữ nguyên ghi chú `ponytail:` trong code.

### Task 8: Sửa lỗi chính tả

- [x] `docs/develop-status-report.md` dòng Task 7: chữ "décret" lạc chỗ (nhiều khả năng là "đăng nhập").

**Xong khi:** đã sửa.

---

## Ngoài phạm vi (chỉ ghi nhận, không làm)

- UC08–UC15 (Barista/Admin): không có phân quyền vai trò, `GET /orders?status=PAID`, CRUD admin. Docs đã ghi "Ngoài phạm vi – chưa hiện thực".
- UC15 Quản lý voucher trái đề §9 (voucher validate nội bộ, không thêm bảng/endpoint).

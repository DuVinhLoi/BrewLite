# Kế hoạch: làm Order State Machine nhìn thấy được (PAID → PREPARING → READY → COMPLETED)

> **Cho agent thực thi:** làm theo thứ tự, đánh dấu `- [x]` khi xong. Mỗi task có "Xong khi". Task có sửa code: viết test trước (đỏ → xanh). Làm trên nhánh `feat/state-machine-visible` từ `develop`, mỗi task 1 commit, KHÔNG merge, KHÔNG push.

**Nguồn chuẩn:** đề gốc `BrewLite-CongNghePhanMem.pdf` §9 ý 1 + §9.1 (ảnh sơ đồ: `PENDING → PAID → PREPARING → READY → COMPLETED`; `PENDING ⇄ PAYMENT_FAILED`; `PENDING / PAID / PAYMENT_FAILED → CANCELLED`). Tiêu chí chấm (a): *"có unit/integration test chứng minh chặn được chuyển trạng thái sai"*.

## 0. Kết quả kiểm tra (2026-10-09)

| Lớp | Hiện trạng | Khớp sơ đồ? |
|---|---|---|
| Backend `order-state.machine.ts` (`ALLOWED`) | Đủ 9 chuyển tiếp, `COMPLETED`/`CANCELLED` là trạng thái cuối, sai thì `assertTransition` ném 400 | ✅ khớp 100% |
| Test | `order-state.machine.spec.ts` (`test.each` hợp lệ + không hợp lệ), `order-advance.spec.ts` 9 test (đi hết `PAID→PREPARING→READY→COMPLETED`, chặn nhảy cóc, chặn người lạ) | ✅ đạt tiêu chí (a) |
| API | `PATCH /orders/:id { status }` nhận `CANCELLED / PREPARING / READY / COMPLETED`, chỉ chủ đơn | ✅ nhưng chỉ gọi được bằng curl |
| **Giao diện** | `/history` chỉ in chữ trạng thái thô (`#id • PAID • tổng`); **không có nút nào** để `PAID → PREPARING → READY → COMPLETED`; màn biên lai chỉ in `PAID` | ❌ **đây là chỗ không thấy** |
| **Docs** | Sơ đồ trạng thái chỉ có trong `BrewLite-CongNghePhanMem-fixed.md` §9.1 (mermaid). `user-sequence-specifications.md` §2.5 chỉ vẽ hủy / thử lại, **không có luồng tiến đơn** và không có sơ đồ trạng thái | ❌ thiếu |

**Kết luận:** logic đúng và có test; cái thiếu là **trình diễn** (UI) và **tài liệu**. Khi demo trên trình duyệt (§11), giảng viên chỉ thấy `PENDING/PAID/PAYMENT_FAILED/CANCELLED`, không bao giờ thấy `PREPARING/READY/COMPLETED`.

**Ràng buộc phạm vi:** đề §3.2 ghi Barista "nằm ngoài phạm vi MVP" → KHÔNG thêm vai trò, KHÔNG thêm `GET /orders` (hàng đợi quầy), KHÔNG thêm bảng/endpoint. Chỉ dùng `PATCH /orders/:id` sẵn có.

---

## Task 1: Hiển thị trạng thái dạng "thanh tiến trình" giống sơ đồ

**File:** mới `frontend/src/components/OrderStatusTrack.tsx`, mới `frontend/src/lib/order-status.ts` (+ `order-status.test.ts`); sửa `frontend/src/app/history/page.tsx`, `frontend/src/components/PaymentSuccess.tsx`

- [x] `lib/order-status.ts`: kiểu `OrderStatus` (7 giá trị), nhãn tiếng Việt (Chờ thanh toán / Đã thanh toán / Đang pha / Sẵn sàng / Hoàn tất / Thanh toán lỗi / Đã hủy), `HAPPY_PATH = [PENDING, PAID, PREPARING, READY, COMPLETED]`, `nextStatus(s)` (PAID→PREPARING, PREPARING→READY, READY→COMPLETED, còn lại null), `canCancel(s)` (thay `CANCELLABLE_STATUSES` chuỗi trần trong `lib/api.ts`).
- [x] Test vitest **pin bảng chuyển tiếp FE = `ALLOWED` backend** (giống cách `pricing-table.spec.ts` pin bảng giá): mọi cặp FE cho phép phải hợp lệ theo sơ đồ §9.1.
- [x] `OrderStatusTrack`: 5 bước của luồng chính, bước hiện tại tô đậm, bước đã qua tô xanh; `PAYMENT_FAILED` (đỏ) và `CANCELLED` (xám) hiện nhãn riêng thay thanh tiến trình.
- [x] Dùng ở `/history` (mỗi đơn) và `PaymentSuccess` (đơn vừa trả: bước `PAID`).

**Xong khi:** `/history` và màn biên lai hiện thanh 5 bước như sơ đồ; test vitest xanh.

## Task 2: Nút "Quầy (demo)" để tiến đơn trên giao diện

**File:** `frontend/src/lib/api.ts` (thêm `advanceOrder(orderId, status, token)`), `frontend/src/app/history/page.tsx`, test `frontend/src/lib/api.test.ts`

- [x] Đơn có `nextStatus(s) !== null` hiện nút **"Quầy (demo): → <nhãn bước kế>"**, ghi rõ chữ *demo* và tooltip "Mô phỏng thao tác của Barista (ngoài MVP theo đề §3.2)". Gọi `PATCH /orders/:id { status: nextStatus }` + Bearer, thành công thì tải lại danh sách, lỗi 400/403/404 hiện dưới thẻ đơn (dùng chung cách hiện lỗi của nút Hủy).
- [x] Không hiện nút cho trạng thái cuối (`COMPLETED`, `CANCELLED`) và cho `PENDING`/`PAYMENT_FAILED` (bước kế là thanh toán, không phải quầy).
- [x] Test vitest cho `advanceOrder`: header Bearer, body `{status}`, 400 (nhảy cóc) → thông điệp tiếng Việt.
- [x] *(Tùy chọn)* biến `NEXT_PUBLIC_DEMO_COUNTER=true|false` để ẩn nút khi không demo; mặc định bật trong compose.

**Xong khi:** trên trình duyệt, đơn vừa trả bấm 3 lần đi `PAID → PREPARING → READY → COMPLETED`, thanh tiến trình đổi theo; bấm "Hủy" ở `PREPARING` không còn hiện (backend vẫn chặn 400 nếu gọi tay).

## Task 3: Kịch bản curl dự phòng cho buổi demo

**File:** mới `scripts/demo-state-machine.sh` (hoặc `.ps1`), mục mới trong `README.md` "Demo State Machine"

- [x] Script: đăng nhập tài khoản demo → tạo đơn → thanh toán → `PATCH` lần lượt `PREPARING`, `READY`, `COMPLETED` → in trạng thái sau mỗi bước → thử 1 chuyển sai (`COMPLETED → CANCELLED` hoặc `PAID → READY`) để thấy 400.
- [x] README chỉ lệnh chạy + lệnh chạy test (a): `cd backend && npx jest order-state order-advance`.

**Xong khi:** chạy script trên compose ra đúng chuỗi trạng thái và 1 lỗi 400 có chủ đích.

## Task 4: Docs đồng bộ (biểu đồ Use Case vẫn là gốc)

**File:** `docs/user-sequence-specifications.md`, `docs/use-case-specifications.md`, `docs/develop-status-report.md`

- [x] `user-sequence-specifications.md` §2.5: thêm **sơ đồ trạng thái PlantUML** (`@startuml … state …`) đúng 9 chuyển tiếp của ảnh §9.1, chú thích chuyển nào do ai kích hoạt (thanh toán OK/lỗi: `POST /payments`; hủy: nút Hủy; `PREPARING/READY/COMPLETED`: nút "Quầy (demo)").
- [x] §2.5 sơ đồ tuần tự: thêm `alt` **Kịch bản 4 (mở rộng, demo quầy)**: User bấm "Quầy (demo)" → `PATCH /orders/:id {PREPARING}` → kiểm tra chủ đơn → `assertTransition(PAID, PREPARING)` → 200; nhánh sai → 400.
- [x] `use-case-specifications.md`: dòng UC06 ghi thêm nút "Quầy (demo)" là mở rộng minh họa §9.1; **không** thêm UC mới / tác nhân Barista lên biểu đồ gốc (giữ đúng §3.2). Bảng đồng bộ UC ↔ sơ đồ vẫn khớp.
- [x] Render lại toàn bộ PlantUML (dùng `plantuml-1.2026.8.jar`, `PLANTUML_SECURITY_PROFILE=SANDBOX`, không gửi lên dịch vụ ngoài) — 0 lỗi.

**Xong khi:** docs mô tả đúng thứ trên màn hình; 8/8 sơ đồ (7 cũ + 1 sơ đồ trạng thái) render được.

## Kiểm chứng cuối

- [x] backend `npx jest` xanh (hiện 68 pass / 1 skip), frontend `npx vitest run` + `npx tsc --noEmit` xanh (hiện 51 pass).
- [ ] `docker compose up -d --build`, demo tay trên `:3001`: đặt món → trả → `/history` bấm "Quầy (demo)" 3 lần đến `COMPLETED`; chụp màn hình từng bước cho slide. *(Chưa tick: stack đã dựng lại và đi đủ chuỗi bằng API/script, nhưng môi trường làm việc không có trình duyệt nên chưa bấm nút và chụp màn hình bằng mắt, cần người làm nốt.)*

## Ngoài phạm vi (không làm)

- Vai trò Barista thật, trang hàng đợi quầy, `GET /orders?status=PAID` (đề §3.2 + §12.1 gốc không có).
- Tự động chuyển trạng thái theo thời gian (giả lập pha chế) — dễ làm demo khó kiểm soát.

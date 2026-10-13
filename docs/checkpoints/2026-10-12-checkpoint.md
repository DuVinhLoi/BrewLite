# Checkpoint — 2026-10-12: develop đã push, đồng bộ UC/sequence và giới hạn UI theo vai trò

## 1. Trạng thái

- `develop` = `origin/develop` tại `253bee1`.
- 4 commit đã gộp từ 21 commit. Bảng ánh xạ hash: nhánh local `backup/develop-before-squash` tại `6c33212`, không push.
- Nhánh local `backup/ui-plan-before-squash` còn giữ, không push.
- Backend `npx jest`: 152 pass, 3 skip.
- Frontend `npx vitest run`: 48 file, 836 test pass.
- `tsc --noEmit` sạch cả hai phần.
- `npm run lint` thoát 0, 0 lỗi, 47 cảnh báo `@next/next/no-img-element`.
- PlantUML: 12/12 khối render sạch.

## 2. Đợt đồng bộ Use Case ↔ Sequence (commit 4820138)

- Thêm UC16 "Xem hồ sơ & điểm tích lũy" và sequence §2.9. Tổng 17 UC, 15 đã hiện thực.
- `Admin --|> Barista`.
- Sequence §2.4: sửa thứ tự nhánh 422. §2.5: câu về khóa hủy đơn. Response §2.6 và §2.7 có `userId` và `idempotencyKey`.
- Backend: tên món lấy bằng 1 lần `findAll()`; danh sách rỗng thì không truy vấn.
- Frontend quầy hiện "Đang tải…". `getProfile`, `getMyOrders`, `getOrder` gửi `cache: 'no-store'`. Xóa `ui/Card` không dùng.
- Plan: `docs/planning/2026-10-11-uc-sequence-sync-plan.md`.

## 3. Đợt giới hạn UI Barista / Admin (commit 50e8f45)

- Bản 1 không có `Barista --|> Customer`, nên nhân viên không dùng UC của khách.
- Backend: `POST /orders`, `GET /orders/me`, `GET /orders/:id`, `POST /payments`, `GET /users/me` gắn `RolesGuard` + `@Roles(CUSTOMER)`. Token BARISTA/ADMIN nhận 403 `Insufficient role`. `PATCH /orders/:id` và `GET /orders` của quầy không đổi.
- Frontend: Barista chỉ thấy "Quầy", Admin thấy "Quầy" và "Kho". Không có giỏ hàng. Viên vai trò không bấm được. Logo về trang nhà.
- Nhân viên mở `/`, `/cart`, `/history`, `/profile` bị chuyển về `/barista` hoặc `/admin` (`staffRedirect` trong `frontend/src/lib/nav.ts`, gọi ở `Header.tsx`). Đăng nhập với `?next=` trỏ tới trang khách thì bỏ qua (`postLoginTarget`).
- Plan: `docs/planning/2026-10-12-role-scoped-ui-plan.md`.
- Kiểm thật 2026-10-12 trên stack docker: 22 lệnh gọi API theo vai trò và 27 kiểm tra trình duyệt (Playwright, Chromium) đều đạt.
- Giới hạn đã biết: chuyển hướng ở phía client nên trang khách có thể hiện thoáng qua (chưa đo). Backend vẫn chặn bằng 403.

## 4. Việc còn mở

Nguồn ghi dạng `<tên file>.md:dòng` mà không còn trong `docs/checkpoints/` là checkpoint cũ; xem bằng `git show 253bee1:docs/checkpoints/<tên file>`.

### Kiểm bằng mắt (trình duyệt)

- F4 thử tay và demo checklist: khách đặt và trả đơn; `/history` không còn nút "Quầy (demo)"; `/barista` tiến đơn; `/admin` +10 món rồi bớt lại. Plan F4 và checklist order state machine chưa tick (`docs/planning/2026-10-09-doc-code-sync-plan.md:76`; `docs/planning/2026-10-09-order-state-machine-visible-plan.md:7`; `2026-10-09-backend-checkpoint.md:65`; `2026-10-09-checkpoint.md:38-41`).
- Hai tab hai phiên: đổi trạng thái ở `/barista`, biên lai đổi trong 3 giây. Cơ chế có sẵn: `frontend/src/lib/use-order-poll.ts` (`2026-10-09-ui-checkpoint-3.md:39,53`; `2026-10-09-ui-checkpoint-5.md:24`).
- 401 thật ở màn Thanh toán, đăng nhập lại thì trả tiếp. Code có nhánh 401 (`frontend/src/components/PaymentForm.tsx`, `session.ts`; `2026-10-09-ui-checkpoint-2.md:40`; `2026-10-09-ui-checkpoint-3.md:53`).
- F5 giữa lúc trả (reload). Code: `frontend/src/lib/payment/checkout-session.ts` (`2026-10-09-ui-checkpoint-5.md:24`).
- Trần 99 ly và 20 dòng trên giao diện chưa kiểm. Logic có: `frontend/src/lib/cart-limits.ts:7,10` (`2026-10-09-ui-checkpoint-3.md:53`).
- Trạng thái tải, lỗi, rỗng: Skeleton, ErrorState, EmptyState, Menu khi backend tắt hoặc menu rỗng chưa nhìn bằng mắt, chưa kiểm đồng bộ loading/lỗi/rỗng giữa các trang. Skeleton thấp hơn thẻ thật, có giật khi tải xong, chưa đo (`2026-10-09-ui-checkpoint-2.md:39,41`; `2026-10-09-ui-checkpoint-1.md:39`; `2026-10-10-ui-checkpoint-3a.md:53`).
- Kiểm trình duyệt đa chiều rộng 1280, 1024, 760, 360px, chưa kiểm mục nào: (a) 11 màn; (b) header ADMIN ~1024px không vỡ thành hai dòng (đổi ở `50e8f45`); (c) hero Menu: cảnh moka ở 1280, 1081–1167px, 360px, tiêu đề xoay -4° (lệch đã biết: artboard 1152px so với vùng 1072px); (d) 5 màn đối chiếu wireframe đề §7 (`docs/checkpoints/2026-10-11-ui-wireframe-diff.md:6`: "Chưa xem trên trình duyệt"); thanh 5 bước ở 320–360px (`2026-10-11-ui-checkpoint-4.md:44,65`); hiển thị trên điện thoại (`2026-10-09-backend-checkpoint.md:81`); reduce motion bật/tắt, modal (Esc, Safari), trình đọc màn hình (`2026-10-11-ui-checkpoint-4.md:38-49`; `2026-10-10-ui-checkpoint-3a.md:30-34`; `2026-10-09-ui-checkpoint-5.md:24`; brief:17).
- Offset neo `#menu` cố định 88px và 196px (ruling R23), chưa xác minh bằng trình duyệt (`frontend/src/components/menu/MenuSection.module.css:8,64`; `2026-10-10-ui-checkpoint-3a.md:34`; `2026-10-11-ui-checkpoint-4.md:65`).
- Lưới Quầy ép 3 cột, chỉ có breakpoint `max-width: 760px`; hiển thị 761–850px chưa xem (`frontend/src/components/BaristaView.module.css:65,223`; `2026-10-11-ui-checkpoint-4.md:42,65`).
- Đã hủy hiển thị xám thay vì đỏ như canvas. Đã ghi là quyết định có chủ đích, nhưng lệch artboard, cần người duyệt (`2026-10-11-ui-checkpoint-4.md:55`).
- Chưa chụp ảnh baseline. Không có PNG baseline trong `docs/` và `frontend/` (`2026-10-09-ui-checkpoint-1.md:40`).

### Code

- Khóa chống thanh toán song song nằm trong tiến trình, chỉ đúng với 1 instance. Compose chỉ có 1 service backend, chưa cần cho demo. Checkbox P2 Task 7 còn mở (`backend/src/payment/payment.service.ts:26-27`; `docker-compose.yml:18`; `docs/planning/2026-10-08-p2-tech-debt-plan.md:9-10`; `2026-10-09-backend-checkpoint.md:45`; `2026-10-09-checkpoint.md:45`).
- Lỗi hoàn tiền hoặc ghi PAYMENT_FAILED sau charge bị bỏ qua, chưa có sổ đối soát (`backend/src/payment/payment.service.ts:133,136`; `2026-10-09-backend-checkpoint.md:46`).
- Hủy đơn ở tab khác rồi bấm lại cùng key: nhận biên lai cũ kèm đơn CANCELLED. Nhánh `hit` trả `status: PAID` mà không kiểm trạng thái đơn (`payment.service.ts:56-66`; `2026-10-09-backend-checkpoint.md:47`).
- Điểm thưởng không thu hồi khi hủy đơn (`payment.service.ts:146-164`; `backend/src/prisma/prisma-user.repo.ts:30`; `2026-10-09-backend-checkpoint.md:48`).
- Đơn PAYMENT_FAILED bị bỏ lại không tự dọn: không có cron hay `setInterval` trong `backend/src` (`2026-10-09-backend-checkpoint.md:48`).
- Logout chỉ xóa token phía trình duyệt, JWT không bị thu hồi phía server (`frontend/src/components/Header.tsx:29-30`; `2026-10-09-backend-checkpoint.md:49`).
- UC13 (quản lý món) và UC15 (voucher) là backlog (`backend/src/product/admin-product.controller.ts:16,21`; `docs/use-case-specifications.md:26`; `2026-10-09-backend-checkpoint.md:50`).
- Ảnh món vẫn là SVG tĩnh, chưa thay ảnh thật; lint báo 47 cảnh báo `no-img-element` (`backend/prisma/seed.ts:31`; `2026-10-09-ui-checkpoint-5.md:13`).
- Modal chi tiết món chưa có test; `ProductCard.test.ts` không tham chiếu `ProductDetailModal` (`2026-10-10-ui-checkpoint-3a.md:51`).
- Thông báo từ chối của `ProductCard` không tự mất. Không có timer cho notice (`frontend/src/components/ProductCard.tsx:44`; `:37`; `2026-10-09-ui-checkpoint-3.md:60`).
- `PaymentSuccess` bỏ lỗi của poll, không dùng `error` (`frontend/src/components/PaymentSuccess.tsx:25`; `2026-10-09-ui-handoff.md:53`).
- `usePolling` có hai effect (reset và start) (`frontend/src/lib/use-order-poll.ts:94,100`).
- Link "Tùy chọn size / topping" dùng `--accent-ink`, artboard dùng `--ink` (`frontend/src/components/ProductCard.module.css:51`; `2026-10-10-ui-checkpoint-3a.md:52`).
- Khoảng cách trong CSS Modules dùng px thay vì `--space-*`: 714 khai báo (`frontend/src/**/*.css`; `2026-10-10-ui-checkpoint-3a.md:54`).
- Nút −/+ giỏ 40px, dưới 44px (`frontend/src/components/QtyStepper.module.css:12-13`; `2026-10-11-ui-checkpoint-4.md:42,65`).
- Bốn wrapper `Page` gần giống nhau (refactor thuần): `BaristaView.tsx:28`, `HistoryView.tsx:33`, `InventoryView.tsx:28`, `ProfileView.tsx:19` (`2026-10-11-ui-checkpoint-4.md:64`).
- Catch cuối của `app/login/page.tsx` che lỗi hiếm, hiện "Lỗi không xác định" (`frontend/src/app/login/page.tsx:45-46`; `2026-10-11-ui-checkpoint-4.md:63`).
- Comment `frontend/src/lib/promo.ts:2` ghi "UC09" cho điểm thưởng; `payment.service.ts:166` ghi UC09–UC11 là tiến đơn quầy. Cần xác nhận mã UC đúng (`2026-10-09-ui-checkpoint-3.md:59`).

### Tài liệu

- Plan cũ còn ô chưa tick: `docs/planning/2026-10-04-task-8-10-payment-order-stub-plan.md:229,266,267,283,330`; `docs/planning/2026-10-07-task-3-5-8-10-integration-plan.md:65,323,523,560,565` (`2026-10-09-backend-checkpoint.md:66`).
- Plan doc-code-sync, mục F5, chưa tick: ghi chú đề §12.2 chưa liệt kê `Payment.createdAt` (code có, dùng để sắp biên lai) (`docs/planning/2026-10-09-doc-code-sync-plan.md:77`; `2026-10-09-backend-checkpoint.md:66`).
- `docs/scrum-process.md` còn 38 chỗ `[nhóm điền]` (Sprint Review, Retro, đề §11) (`2026-10-09-backend-checkpoint.md:67`).
- `docs/user-sequence-specifications.md:939-1010` (§2.8, Kho) chưa nhắc trạng thái "Đang tải…" và "Chưa có món nào." (`2026-10-11-ui-checkpoint-4.md:66`).
- `docs/user-sequence-specifications.md`: dòng "Test:" chưa liệt kê `stock.test.ts` (`2026-10-10-ui-checkpoint-3a.md:56`).
- `docs/user-sequence-specifications.md:355`: bullet "Thử lại sau khi lỗi" thụt 2 dấu cách, dòng 353–354 thụt 3 (`2026-10-09-ui-checkpoint-3.md:58`).
- `docs/planning/2026-10-09-ui-visual-plan.md:191` còn nhắc cách làm cũ "aria-live" (`2026-10-10-ui-checkpoint-3a.md:55`).
- `docs/user-sequence-specifications.md:358`: câu "đơn khác `dto.orderId`" (§2.4 mục A) và đoạn nói về 422 trong cùng mục có thể viết rõ hơn.
- `docs/user-sequence-specifications.md:881`: sơ đồ §2.7 chỉ ghi "(dưới khóa)" ở nhánh thành công.

### Hạ tầng demo

- Trạng thái Docker (snapshot tại 2026-10-12): container `brewlite-{frontend,backend,db}-1` của checkout chính đều `Exited` (backend `Exited (1)`). Còn volume `bl-uiplan_pgdata`, `brewlite-wt-order-advance_pgdata`, `brewlite_pgdata`. Dọn là tùy chọn, không chặn (`docker ps -a`; `docker volume ls`; `2026-10-09-checkpoint.md:30-34,41`).
- Demo end-to-end và slide: không có bằng chứng trong repo (`2026-10-09-backend-checkpoint.md:83`).
- Merge `develop` vào `main`: 151 commit, cần người dùng duyệt. Chưa làm (`git rev-list --count main..develop` = 151; `2026-10-09-backend-checkpoint.md:68`; `2026-10-09-ui-handoff.md:39`).
- Xóa nhánh local đã merge (tùy chọn): chưa kiểm nhánh nào đã merge (`git branch`; `2026-10-09-backend-checkpoint.md:69`).

### Chờ người dùng duyệt

- Email không hiện trong pill vai trò, chỉ ở `title`. Đúng đặc tả §6.1 (ruling R21), cảm ứng không có hover (`2026-10-10-ui-checkpoint-3a.md:43`; `2026-10-11-ui-checkpoint-4.md:53`).
- `alt` ảnh thẻ món bằng tên món, trình đọc màn hình đọc tên hai lần. Theo đặc tả §4 (ruling R22) (`2026-10-10-ui-checkpoint-3a.md:44`; `2026-10-11-ui-checkpoint-4.md:53`).

## 5. Quyết định đã chốt (vẫn hiệu lực)

Nguồn ghi dạng `<tên file>.md:dòng` mà không còn trong `docs/checkpoints/` là checkpoint cũ; xem bằng `git show 253bee1:docs/checkpoints/<tên file>`.

- Giữ tên món `Latte`, không đổi thành "Cà phê sữa". Quyết định người dùng 2026-10-11 (`backend/prisma/seed.ts:31`; `2026-10-09-ui-checkpoint-5.md:28`).
- Giữ ký hiệu tiền `đ` của `formatVND`, không đổi `₫` (`frontend/src/lib/pricing.ts:44`; `2026-10-09-ui-checkpoint-5.md:29`).
- Giữ hai devDependency eslint `8.57.1` và `14.2.35` (R37), cấu hình `next/core-web-vitals`. Gỡ sẽ làm hỏng `npm run lint` và `next build` (`frontend/package.json:26-27`; `frontend/.eslintrc.json`; `2026-10-09-ui-checkpoint-5.md:31`).
- Squash `733f315` vào `1f2ce02`, hash đổi, có bảng ánh xạ (`docs/checkpoints/2026-10-11-squash-hash-map.md`; `2026-10-09-ui-checkpoint-5.md:30`).
- D1: hủy đơn PAID hoàn tiền trước transaction, rủi ro chủ đích. Hệ quả còn đúng: hoàn tiền 2 lần nếu transaction hủy đơn lỗi sau khi đã hoàn (`payment.service.ts:155,157,158-161`; `2026-10-09-backend-checkpoint.md:34,44`).
- D2: backend bắt buộc Postgres khi chạy (`backend/src/main.ts:8-10`; `2026-10-09-backend-checkpoint.md:35`).
- Bỏ biến `PORT`, cổng cố định 3000. Modal là "màn hình chi tiết" (Q3/Q4/F2). Grep `PORT` trong `backend/src` rỗng (`backend/src/main.ts:15`; `ProductDetailModal.tsx`; `2026-10-09-backend-checkpoint.md:34,36`).
- Khóa JWT mặc định giữ cho demo công khai, chỉ cho demo cục bộ. Hai giá trị lệch nhau: `dev-secret` (compose, `docker-compose.yml:26`) và `brewlite-dev-secret` (mã, `backend/src/auth/auth.module.ts:19`). README ghi cả hai (`README.md:104-106`; `2026-10-09-backend-checkpoint.md:37,48-49`).
- Lỗi thanh toán demo bằng biến môi trường `MOCK_GATEWAY_DECLINE_METHOD` (`backend/src/payment/mock-payment-gateway.service.ts:21`).
- Ruling còn hiệu lực (kiểm mẫu): R3 (`frontend/src/lib/session.ts:36-41`), R9 (`frontend/src/lib/cart-limits.ts:10`), R14 (`frontend/src/app/history/page.tsx:23`), R24 (`ProductDetailModal.test.ts:41-45`), R41 (`docker-compose.yml:34-45`) (`2026-10-09-ui-checkpoint-5.md:42-79`).
- Giữ `.agents/skills/` (lựa chọn của người dùng, 64 mục) (`2026-10-09-checkpoint.md:11`).
- Cố ý để lại cho bản demo: Dockerfile một stage chạy root; không có `docker-compose.override.yml`; ép kiểu `as ComponentProps`. Chưa rõ người dùng có duyệt không (`2026-10-09-ui-checkpoint-5.md:36`).

## 6. Lịch sử

Các checkpoint của đợt backend và đợt UI đã xóa vì việc trong đó đã xong: `2026-10-09-backend-checkpoint.md`, `2026-10-09-checkpoint.md`, `2026-10-09-ui-checkpoint-0.md`, `2026-10-09-ui-checkpoint-1.md`, `2026-10-09-ui-checkpoint-2.md`, `2026-10-09-ui-checkpoint-3.md`, `2026-10-09-ui-checkpoint-5.md`, `2026-10-09-ui-handoff.md`, `2026-10-10-ui-checkpoint-3a.md`, `2026-10-11-ui-checkpoint-4.md`. Xem lại bằng `git show 253bee1:docs/checkpoints/<tên file>`. Giữ nguyên 4 file tham chiếu (không phải checkpoint): `2026-10-09-coauthor-hash-map.md`, `2026-10-11-squash-hash-map.md`, `2026-10-11-ui-wireframe-diff.md`, `2026-10-09-barista-admin-review-fixes.patch`.

## 7. Lệnh kiểm đầu phiên sau

```
git status -sb
cd backend && npx jest
cd frontend && npx vitest run && npx tsc --noEmit && npm run lint
```

# Checkpoint 2 (UI): nối dữ liệu đã có

Nhánh `worktree-ui-plan-checkpoint`. Gồm Task 2 và Task 3 của `docs/planning/2026-10-09-frontend-ui-plan.md`, làm theo quy trình subagent (mỗi task: implementer, rồi reviewer riêng; cả hai task được duyệt, không có lỗi Critical hay Important).

## Commit

| Hash | Nội dung |
|---|---|
| `d334a79` | Task 2: `ApiError`, `createAsyncRunner` + `useAsync`, `session.ts` (`handleUnauthorized`, `safeNext`), Menu có Skeleton / ErrorState / EmptyState, đăng nhập đọc `?next=`, sửa sơ đồ UC01/03/05/06/09/12 |
| `2fc3227` | Task 3: `GET /orders/me` trả `items[].productName`; `getMyOrders` + `useAsync` ở Lịch sử; sửa sơ đồ UC07 |

## Số liệu đo

| Lệnh | Kết quả |
|---|---|
| `cd backend && npx jest` | `Tests: 3 skipped, 129 passed, 132 total`; 13 suite pass, 2 suite skip |
| `cd backend && npx tsc --noEmit` | Sạch |
| `cd frontend && npx vitest run` | `Test Files 18 passed (18)`, `Tests 235 passed (235)` |
| `cd frontend && npx tsc --noEmit` | Sạch |
| `next build` | `Compiled successfully`, 8 route. Chạy trên **bản sao** của `frontend/` (xem ghi chú), không phải trên `frontend/.next` |

So với Checkpoint 1: backend 124 → 129 test, frontend 163 → 235 test (số đo ngay sau Task 3, trước `/code-review`; số cuối ở mục dưới).

Ghi chú về `next build`: một dev server `next dev` (PID 13636, cổng 3001) chạy từ chính worktree này và đang giữ `frontend/.next`. Tôi không tắt nó (không phải tiến trình của tôi) nên build ở một bản sao đặt trong `.superpowers/`, đã xóa sau khi build. Lần build trong Task 2 của implementer có chạy khi dev server đang chạy; **nên xóa `frontend/.next` rồi khởi động lại dev server** trước khi xem tay.

## Smoke trên compose (Postgres thật)

Dựng `db` và `backend` bằng project riêng `bl-uiplan` (volume `bl-uiplan_pgdata`, không đụng DB của checkout chính). Không dựng `frontend` trong compose vì cổng 3001 đang bị dev server giữ. Tài khoản `@smoke.test`:

1. Đăng ký (201), đăng nhập, đặt 1 đơn gồm 2 món (Latte x2 size M, Trà đào x1 size L): tổng 129.000 ₫.
2. `POST /payments` bằng ví: `PAID`, `loyaltyPointsEarned: 12`.
3. `GET /orders/me`: đơn `PAID` với tên món `['Latte', 'Trà đào']` (đã kiểm byte UTF-8).
4. `GET /orders/:id`: các món **không** có `productName` (đúng ruling R5, không đổi).
5. `GET /orders/me` không kèm token: 401.
6. Dọn: `smoke:clean` xóa 1 tài khoản `@smoke.test` và 1 đơn. Đã `docker compose -p bl-uiplan stop` (không `down -v`; volume còn lại).

## Chưa kiểm bằng mắt hay trình duyệt

- Menu khi backend tắt (ErrorState + "Thử lại") và khi menu rỗng: chỉ có test render HTML.
- 401 thật trên trình duyệt: `location.replace` mặc định, `/login?next=...`, nhánh 401 của `PaymentForm`, trang Lịch sử với tên món.
- Hình dáng Skeleton, ErrorState, EmptyState với font và token mới.

## Quyết định đã ghi (xem ledger)

- Lõi `createAsyncRunner` tách khỏi hook vì không có RTL/jsdom (hook chỉ bọc mỏng).
- `ApiError` giữ nguyên mọi câu thông báo cũ để test cũ xanh.
- `safeNext` chỉ nhận đường dẫn tương đối một dấu `/` (chặn open redirect).
- `productName` đặt trên từng item (giống `listQueue`), không ghép ở cấp đơn: Quyết định 3 của plan (ghép 60 ký tự) không còn áp dụng.
- Đăng nhập chỉ xóa phiên thanh toán khi đổi tài khoản (`clearCheckoutIfOtherUser`, `userId` lấy từ JWT `sub`); cùng tài khoản thì giữ đơn dở và 2 Idempotency-Key để trả tiếp. (Bản đầu của checkpoint này ghi ngược lại; đã sửa sau `/code-review`.)
- Lịch sử: đổi sentinel token từ `null` sang `undefined` (cùng lỗi trang trắng như `/profile`).

## Sau `/code-review` (range `5faeafd..9fac4dd`, mức high)

10 phát hiện. Sửa 8 mục trong một fix wave (`8bb5535`, `2835698`, `8605364`), re-review có phạm vi: cả 8 mục được xác nhận đã xử lý, không có lỗi Critical hay Important mới.

| Mục | Xử lý |
|---|---|
| Đăng nhập xóa phiên thanh toán dù đã hứa giữ | `CheckoutState` có `userId`; `login` gọi `clearCheckoutIfOtherUser`. Sửa luôn docs LUỒNG 2/4, §2.3 |
| 401 chỉ opt-in từng hàm | `fetchQueue` (quầy) và `lib/admin.ts` gọi `handleUnauthorized()` trước khi ném câu cũ |
| N+1 tuần tự trong `withProductNames` | `Promise.all` trên các `productId` phân biệt |
| `data.message` không null-safe | `errorDetail()` chỉ nhận chuỗi hoặc mảng chuỗi |
| `getProfile` 404 không xóa token | Gộp 401 hoặc 404 thành một nhánh gọi `handleUnauthorized()` |
| Chi tiết lỗi menu ngoài `role="alert"` | `ErrorState` có prop `detail` |
| `itemLine` in `undefined` | Dùng `productName` nếu là chuỗi không rỗng, ngược lại `productId.slice(0, 8)` |
| Hành vi mới chưa có test | Rút `isUnauthorizedPayment` và `postLoginTarget` thành hàm thuần, có test |

Hoãn có chủ đích: lịch sử giữ danh sách cũ bằng ref trong render và thiếu nút "Thử lại" (Task 4 viết lại polling của trang này); `HistoryOrder` trùng `QueueOrder` (Task 7); `safeNext` chặn `://` trong query (fail-safe).

Số liệu sau fix wave: `cd backend && npx jest` → `Tests: 3 skipped, 130 passed, 133 total`; `cd frontend && npx vitest run` → `Tests 291 passed (291)`, 18 file; `tsc --noEmit` sạch ở cả hai. `next build` chưa chạy lại sau fix wave (dev server :3001 vẫn giữ `.next`).

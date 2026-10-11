# Bàn giao phiên làm UI (2026-10-09)

Nhánh `worktree-ui-plan-checkpoint`, thư mục `E:\CNPM\BrewLite-ui-plan-checkpoint`. Chưa push, chưa merge. Mở lại phiên: chạy `claude --continue` trong thư mục này, hoặc dán: "Đọc `docs/checkpoints/2026-10-09-ui-handoff.md` và `.superpowers/sdd/2026-10-09-frontend-ui-plan/progress.md`, rồi làm tiếp."

Kế hoạch gốc (ngoài git): `E:/CNPM/BrewLite/docs/superpowers/requests/2026-10-09-ke-hoach-worktree-ui.md` (đã được sửa sau khi tôi đọc lần đầu: đọc lại trước Giai đoạn 3). Canvas: `E:/CNPM/BrewLite/docs/superpowers/canvas/README.md` (bảng artboard → màn, bảng `/_blob/<id>` → SVG) và `project/<Tên>Doodle.dc.html`.

## Đã xong

| Giai đoạn | Commit | Ghi chú |
|---|---|---|
| 0 | `f41c0a8`, `8713770`, `050f62b` | `/users/me`, `/profile`, sửa trang trắng, đồng bộ 3 plan |
| 1 | `c9abf1f`, `4a56873`, `16bb685`, `5faeafd` | Checkpoint 0, token + font + 6 component, bộ minh họa, Checkpoint 1 |
| 2, Task 2 | `d334a79` | `ApiError`, `createAsyncRunner`/`useAsync`, `session.ts` (401, `?next=`), trạng thái Menu |
| 2, Task 3 | `2fc3227` | `GET /orders/me` có `items[].productName`, `getMyOrders` |
| 2, Checkpoint 2 | `9fac4dd`, `8bb5535`, `2835698`, `8605364`, `f10366f` | smoke compose, `/code-review` (10 phát hiện), fix wave 8 mục, re-review sạch |
| 2, Task 4 | `54e36e9` | `startPolling`, `useOrderPoll`, biên lai và lịch sử tự cập nhật, `HistoryView.tsx` |

## Đã xong thêm (từ lần bàn giao đầu)

| Giai đoạn | Commit | Ghi chú |
|---|---|---|
| 2, Task 5 | `49b88c1` | `discount`, `loyaltyPointsEarned`, `lib/promo.ts`, "+N điểm" (làm lại sau khi bị dừng giữa chừng) |
| 2, Task 6 | `1ff396a` | giỏ chặn 20 dòng và 99 ly, `addItem` trả kết quả |
| 2, Checkpoint 3 | `940e41c`, `f5a4388`, `9ca71b4` | fix wave sau `/code-review` (8 mục), re-review sạch; tài liệu `2026-10-09-ui-checkpoint-3.md` |

## Đang dở / còn lại

- **DỪNG ở Checkpoint 3 là điểm kế tiếp của người dùng**: duyệt luồng khách (xem `ui-checkpoint-3.md`, mục "Chưa kiểm bằng mắt hay trình duyệt"). Tay: hai tab hai phiên cho biên lai tự cập nhật; 401 thật ở màn Thanh toán; trần 99 ly và 20 dòng.
- Giai đoạn 3 (Task 7, các màn theo `ui-visual-plan.md` §6, thứ tự Header, Menu, ... Kho; DỪNG 3a sau Header + Menu để người dùng duyệt hero). Trước đó đọc lại file kế hoạch worktree và `canvas/README.md`.
- Giai đoạn 4 (Task 9 đến 11; DỪNG ở Checkpoint 5). Task 10: kiểm `next/font/google` tải được trong Docker build.
- Nợ nhỏ: danh sách ở cuối `ui-checkpoint-3.md`.

## Số liệu mới nhất đo được

Mốc HEAD `9ca71b4`: backend `npx jest` 130 pass, 3 skip; frontend `npx vitest run` 385 pass (27 file); `tsc --noEmit` sạch cả hai; `next build` 8 route (chạy trên bản sao). `tsc --noEmit` sạch cả hai. `frontend/.next` đang bị một dev server `next dev` cổng 3001 giữ (không phải của phiên này), nên build chạy trên bản sao. Xóa `frontend/.next` và khởi động lại dev server trước khi build hay xem tay.

## Ruling đã chốt (đầy đủ trong ledger, tóm tắt ở đây)

- Test hook: tách lõi không phụ thuộc React (`createAsyncRunner`, `startPolling`) và test lõi; hook chỉ bọc mỏng (không có RTL/jsdom).
- `ApiError` giữ nguyên mọi câu thông báo cũ. 401 xử lý tập trung bằng `handleUnauthorized()`; `?next=` chỉ nhận đường dẫn tương đối một dấu `/`.
- `productName` ở từng item của `GET /orders/me`; `GET /orders/:id` không đổi.
- Đăng nhập chỉ xóa phiên thanh toán khi đổi tài khoản (`userId` từ JWT `sub`).
- Polling 3 giây, không chồng request; dừng khi 401/403/404; lỗi mạng và 5xx thì giữ dữ liệu cũ và tiếp tục.
- Polling lịch sử chỉ chạy khi còn đơn PAID/PREPARING/READY (R14). Gộp vào giỏ vượt 99 thì từ chối chứ không cắt (R9).
- Việc hoãn: `HistoryOrder` trùng `QueueOrder` (Task 7); `safeNext` chặn `://` trong query; `PaymentSuccess` chưa hiện lỗi poll.

## Môi trường

- Docker Desktop đã được phiên này khởi động lại (đang tắt lúc mở phiên). Docker project `bl-uiplan` (db + backend) đang dừng; volume `bl-uiplan_pgdata` còn. Smoke chỉ dùng `@smoke.test`, dọn bằng `docker compose -p bl-uiplan exec backend npm run smoke:clean`. Không `down -v`.
- PlantUML: `java -jar C:/Users/Admin/.claude/jobs/b4219f94/tmp/plantuml/plantuml.jar -tsvg -o <thư mục tạm> <file>` rồi tìm "Syntax Error" trong SVG (`-checkonly` không đáng tin).
- `.superpowers/` (ledger, báo cáo, diff review) không nằm trong git; mất nếu `git clean -fdx`.
- Chưa nhìn trình duyệt lần nào. Mọi thứ về hình ảnh chưa được xem bằng mắt.

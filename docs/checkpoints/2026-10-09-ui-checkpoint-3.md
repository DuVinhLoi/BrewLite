# Checkpoint 3 (UI): luồng khách hoàn chỉnh

Nhánh `worktree-ui-plan-checkpoint`. Gồm Task 4, 5, 6 của `docs/planning/2026-10-09-frontend-ui-plan.md` (Menu, Chi tiết, Giỏ, Thanh toán, Biên lai, Lịch sử về mặt chức năng; chưa đụng giao diện từng màn). Làm theo quy trình subagent: mỗi task có implementer và reviewer riêng, đều được duyệt không có lỗi Critical hay Important; sau đó `/code-review` toàn giai đoạn, fix wave 8 mục, re-review có phạm vi.

## Commit

| Hash | Nội dung |
|---|---|
| `54e36e9` | Task 4: `startPolling`, `useOrderPoll`, `getOrder`, `isTerminal`, `PaymentResult.orderId`, biên lai và lịch sử tự cập nhật, `HistoryView.tsx` |
| `49b88c1` | Task 5: `discount`, `loyaltyPointsEarned`, `lib/promo.ts` (test đọc file backend), "+N điểm" và "Đã giảm" ở biên lai |
| `1ff396a` | Task 6: `MAX_LINES = 20`, `MAX_QTY = 99`, `addItem` trả `{ ok } hoặc { ok: false, reason }`, thông báo ở thẻ món và modal |
| `940e41c` | Fix wave: `AT_STOCK_LIMIT`, trần nút + trong modal, hằng 20/99 một nguồn, timer ProductCard |
| `f5a4388` | Fix wave: lịch sử chỉ poll khi còn đơn PAID/PREPARING/READY, mọi nhánh HistoryView trong section có tiêu đề |
| `9ca71b4` | Fix wave: một vùng `aria-live` ở biên lai, bỏ khỏi `OrderStatusTrack` và `/history` |

## Số liệu đo (HEAD `9ca71b4`)

| Lệnh | Kết quả |
|---|---|
| `cd backend && npx jest` | `Tests: 3 skipped, 130 passed, 133 total`; 13 suite pass, 2 suite skip |
| `cd backend && npx tsc --noEmit` | Sạch |
| `cd frontend && npx vitest run` | `Test Files 27 passed (27)`, `Tests 385 passed (385)` |
| `cd frontend && npx tsc --noEmit` | Sạch |
| `next build` | `Compiled successfully`, 8 route. Chạy trên **bản sao** của `frontend/` vì dev server `next dev` (cổng 3001, không phải của phiên này) giữ `frontend/.next`. Bản sao đã xóa. |

So với Checkpoint 2: frontend 291 → 385 test; backend không đổi trong giai đoạn này (130).

## Smoke trên compose (Postgres thật), tài khoản `@smoke.test`

Chạy sau Task 6, trước fix wave (fix wave chỉ sửa frontend, backend không đổi). Dựng `db` và `backend` bằng project `bl-uiplan` (Docker Desktop đang tắt nên phiên đã khởi động lại nó):

- Đăng ký, `GET /users/me`: `CUSTOMER`, 0 điểm.
- Đơn Latte x2 + Americano x1: tổng 120.000 ₫. Trả ví kèm `BREWLITE10`: `PAID`, `amount: 108000`, `discount: 12000`, `loyaltyPointsEarned: 10`. `GET /users/me` sau đó: 10 điểm.
- `GET /orders/:id` (đích polling của biên lai): `PAID`. Hủy `PATCH` `CANCELLED` (200), `GET /orders/:id` đọc lại: `CANCELLED`.
- `GET /orders/me`: các món có tên (`Latte`, `Americano`).
- Giới hạn khớp phía UI: 21 dòng và quantity 100 bị backend từ chối (400); 20 dòng và quantity 99 được nhận (201).
- Dọn bằng `smoke:clean`: xóa 1 tài khoản `@smoke.test` và 3 đơn. Đã `docker compose -p bl-uiplan stop` (không `down -v`).

**Không kiểm được:** bước barista bấm đổi trạng thái để xem biên lai đổi theo trong 3 giây. Tài khoản barista duy nhất là tài khoản demo (`barista@brewlite.vn`), mà ràng buộc cấm dùng tài khoản demo để ghi dữ liệu thử. Thay vào đó đã kiểm đổi trạng thái bằng hủy đơn của khách (đường đọc `GET /orders/:id` giống nhau). Phần "hai tab, hai phiên" cần người duyệt làm tay.

## Quyết định mới trong giai đoạn này (đầy đủ trong ledger)

- Polling: không chồng request, dừng khi 401/403/404, lỗi mạng và 5xx giữ dữ liệu cũ và tiếp tục (R12).
- Lịch sử chỉ poll khi còn đơn mà quầy có thể đẩy (PAID, PREPARING, READY); đơn PENDING, PAYMENT_FAILED hay trạng thái lạ không giữ vòng poll sống (R14). Hệ quả đã ghi trong tài liệu: đơn PENDING thanh toán ở tab khác chỉ hiện sau khi tải lại `/history`.
- `addItem` từ chối thay vì cắt khi gộp vượt 99 (R9). Lý do mới `AT_STOCK_LIMIT` khi dòng đã giữ hết tồn kho.
- Test cũ "qty tối đa 99" được viết lại vì nó ghim hành vi cắt âm thầm mà R9 cấm.
- `HistoryView.tsx` thêm ngoài plan (như `ProfileView`) để test render được; Task 7 sẽ restyle file đó.
- Mock gateway luôn `discount: 0` (số tiền đã giảm sẵn khi tới tay nó); biên lai mock không hiện "Đã giảm".

## Chưa kiểm bằng mắt hay trình duyệt

- Mọi thứ về hình ảnh vẫn chưa được xem. Phiên này không có trình duyệt.
- Tay: hai tab hai phiên (đổi trạng thái ở `/barista`, biên lai đổi theo trong 3 giây); 401 thật ở màn Thanh toán rồi đăng nhập lại thì trả tiếp được; trần 99 và 20 dòng trên giao diện.
- `frontend/.next` đang bị dev server cũ giữ: xóa rồi khởi động lại trước khi xem.

## Việc nhỏ còn nợ (không chặn)

- `docs/user-sequence-specifications.md:332`: bullet "Thử lại sau khi lỗi" thụt 2 dấu cách thay vì 3.
- `lib/promo.ts:2`: comment ghi "UC09", đúng là UC05.
- `usePolling` có hai effect (reset + start); `PaymentSuccess` bỏ lỗi của poll; `ProductCard` thông báo từ chối không tự mất.
- `docs/develop-status-report.md` (~dòng 113) và `docs/checkpoints/2026-10-09-backend-checkpoint.md` (~dòng 79) còn nói giỏ không chặn 20 dòng (ảnh chụp cũ, ngoài phạm vi doc-code-sync).

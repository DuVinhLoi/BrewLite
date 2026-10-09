# Checkpoint — 2026-10-09 (tối): xong phần backend, trước đợt frontend

Điểm dừng sau khi hoàn thiện backend, để phiên sau bắt đầu cải thiện frontend, nối frontend với backend và hoàn chỉnh dự án mà không phải đọc lại lịch sử. Mọi số liệu dưới đây đã chạy lại ngày 2026-10-09 trên `develop` @ `bce799c`.

## 1. Trạng thái đã xác nhận

| Hạng mục | Trạng thái |
|---|---|
| Git | `develop` @ `bce799c`, working tree sạch. **Chưa push**: đi trước `origin/develop` 31 commit. Mọi nhánh local (`fix/backend-hardening`, `fix/review-*`, `feat/state-machine-visible`, `chore/pg-test-plantuml-scrum`, `docs/status-note-p1`, `feature/task-8-10-payment-order`) đã merge vào `develop`. `main` chưa nhận gì: `develop` hơn `main` 134 commit |
| Test backend | `cd backend && npx jest`: **122 pass / 3 skip** (3 test Postgres skip khi không có `DATABASE_URL`); có Postgres thì `npx jest pg-`: **3 pass**; `npx tsc --noEmit` sạch |
| Test frontend | `cd frontend && npx vitest run`: **117 pass**; `npx tsc --noEmit` sạch; `npx next build` thành công (7 route, đề §10 "không lỗi build") |
| Stack compose | Đang chạy. DB làm mới lúc 18:13 (`down -v`), 3 migration đã áp. DB có đúng 3 tài khoản demo, 0 đơn, kho 4 món đều 10 |
| Tài liệu | `docs/use-case-specifications.md` và `docs/user-sequence-specifications.md` khớp code (sơ đồ §2.1–§2.8, mục C, Phần III, Agent Rules). 11 khối PlantUML parse được |
| Rule | `.claude/rules/doc-code-sync.md` (tự nạp khi làm với `backend/src`, `backend/prisma`, `frontend/src` hoặc 3 file đề / UC / sequence) |
| Skill | Plugin **superpowers 6.4.2** bật ở phạm vi user. Commit `66e66fc` đã xóa 6 skill khỏi `.claude/skills` (`code-review`, `diagnosing-bugs`, `implement`, `implement-spec`, `tdd`, `writing-for-agents`); bản sao còn trong `.agents/skills`. Superpowers không thay hết được `code-review` (review tách 2 trục) và `writing-for-agents` |

## 2. Đã làm, theo thứ tự

| Đợt | Commit | Nội dung | Chi tiết |
|---|---|---|---|
| Đồng bộ đề → code → tài liệu | `db47dda` | Audit 2 file UC / sequence với code, thêm các nhánh alt và mã HTTP còn thiếu, sửa các câu "trong 1 transaction" sai, đổi tên UC08, đặt rule đồng bộ | `docs/planning/2026-10-09-doc-code-sync-plan.md` |
| Bắt buộc Postgres, bỏ `PORT` | `3949c1a`, `e039890` | Backend thiếu `DATABASE_URL` thì dừng ngay (kho in-memory chỉ cho jest); bỏ biến `PORT` không có tác dụng; chốt modal là "màn hình chi tiết" Task 4 | như trên |
| Hoàn thiện nghiệp vụ backend | merge `bce799c` (nhánh `fix/backend-hardening`) | Validate `POST /orders` (topping dạng khóa prototype, tối đa 99 ly / 20 dòng, tổng trong Int32); hủy đơn chỉ hoàn số thực thu; key đã dùng cho đơn khác → 422, key dài quá 255 → 400; `Idempotency-Key` cho `POST /orders` (đề §9 tiêu chí b, cột `Order.idempotencyKey`); ảnh món (SVG tạm); `MOCK_GATEWAY_DECLINE_METHOD` để demo thanh toán lỗi; dọn smell (1 `PrismaService`, repo in-memory trả bản sao, xóa mã chết) | `git show b2bb5f6:docs/planning/2026-10-09-backend-hardening-plan.md` |
| Phương án A | trong merge trên | Màn Thanh toán giữ 1 key trả tiền: mất phản hồi rồi bấm lại nhận biên lai cũ (200) thay vì 400 `PAID -> PAID` | `git show b2bb5f6:docs/planning/2026-10-09-payment-retry-key-plan.md` |
| Demo mượt | trong merge trên | Mỗi tab một phiên đăng nhập (`sessionStorage`); đơn đang trả dở giữ qua reload; header hiện tài khoản + Đăng xuất; seed chỉ tạo dữ liệu còn thiếu (giữ đơn và tồn kho qua các lần khởi động); `npm run smoke:clean` | `docs/planning/2026-10-09-demo-session-plan.md` (đã tick hết) |
| Dọn | `29abed8` | Xóa 2 plan đã xong; dọn dữ liệu smoke (3 tài khoản `@smoke.test`, 5 đơn) | `docs/develop-status-report.md` mục 6, 7 |

Bằng chứng chi tiết từng task (commit, số test, smoke trên compose, thời gian phản hồi API 5–16ms): `docs/develop-status-report.md` mục 6 và 7.

## 3. Quyết định đã chốt

| Mã | Quyết định |
|---|---|
| D1 | Hủy đơn `PAID` hoàn tiền trước transaction: ghi nhận rủi ro có chủ đích, không sửa code |
| D2 | Backend bắt buộc Postgres khi chạy |
| Q3 / Q4 / F2 | Giữ tên UC08 mới; modal là "màn hình chi tiết" Task 4; bỏ biến `PORT` |
| Backend | `Idempotency-Key` cho `POST /orders`; ảnh SVG tĩnh trong `frontend/public/images`; demo thanh toán lỗi bằng biến môi trường; khóa JWT mặc định giữ cho demo (có comment `ponytail:`) |
| Quy trình | Nhánh riêng, mỗi task 1 commit, không merge / push khi người dùng chưa duyệt |
| Phương án A | Một key trả tiền cho mỗi phiên màn Thanh toán, không sửa backend |
| Demo | Mỗi tab một phiên; dữ liệu demo giữ qua các lần bật container, không reset tự động; header có Đăng xuất; giữ đơn đang trả dở qua reload |

## 4. Giới hạn đã biết (có chủ đích hoặc backlog)

- Hoàn tiền 2 lần nếu transaction hủy đơn lỗi sau khi đã hoàn (D1).
- Khóa chống thanh toán song song nằm trong tiến trình: chỉ đúng với 1 instance backend.
- Hoàn tiền / ghi `PAYMENT_FAILED` lỗi sau charge thì bỏ qua (chưa có sổ đối soát).
- Hủy đơn ở tab khác rồi bấm lại cùng key ở màn thanh toán cũ: nhận biên lai cũ kèm đơn `CANCELLED` (backlog, cần đổi cả backend và giao diện).
- Điểm thưởng không bị thu hồi khi hủy đơn. Đơn `PAYMENT_FAILED` bị bỏ lại không tự dọn.
- Khóa JWT mặc định công khai (chỉ cho demo, xem README "Lưu ý bảo mật"); đăng xuất chỉ xóa token phía trình duyệt.
- UC13 (quản lý món), UC15 (quản lý voucher): backlog.

## 5. Quy ước làm việc

- Đổi hành vi thì sửa code, test, sơ đồ sequence, mục C, Phần III trong cùng commit (rule `doc-code-sync`).
- Smoke test trên stack compose chỉ dùng tài khoản `@smoke.test`; xong chạy `docker compose exec backend npm run smoke:clean`. Không dùng tài khoản demo.
- Làm lại DB từ đầu (`docker compose down -v`) xóa mọi lịch sử: chỉ làm khi người dùng xác nhận.
- Ghi chú môi trường (Windows, Git Bash):
  - schema Prisma đổi thì chạy `npx prisma generate` trong `backend/`;
  - suite Postgres cần `DATABASE_URL=postgresql://brewlite:brewlite@localhost:5432/brewlite`;
  - `docker exec … /app/…` trong Git Bash cần `MSYS_NO_PATHCONV=1`;
  - kiểm PlantUML bằng PlantUML 1.2024.7 từ Maven Central (SHA-1 `cb57b315d96413d55622edaa8c4b234e2ebf4b1f`), tải vào thư mục tạm, render PNG rồi mở xem.

## 6. Việc còn mở trước khi bàn giao

1. **Thử tay trên trình duyệt** (F4, cần người làm): checklist ở `docs/develop-status-report.md` mục 7 và `docs/planning/2026-10-09-order-state-machine-visible-plan.md` (chụp màn hình cho slide). Chưa kiểm trình duyệt khác và điện thoại.
2. **Plan cũ còn ô chưa tick**: `2026-10-04-task-8-10-payment-order-stub-plan.md` (5), `2026-10-07-task-3-5-8-10-integration-plan.md` (5), `2026-10-08-p2-tech-debt-plan.md` (2), `2026-10-09-doc-code-sync-plan.md` (2: F4, F5), `2026-10-09-order-state-machine-visible-plan.md` (1). Cần rà xem còn đúng không rồi đóng.
3. **`docs/scrum-process.md` còn 38 chỗ `[nhóm điền]`** (Sprint Review, Retrospective, đề §11).
4. **Push và bàn giao**: `git push origin develop`; khi bàn giao, merge `develop` vào `main`.
5. Xóa các nhánh local đã merge (tùy chọn).

## 7. Đợt tiếp theo: cải thiện frontend, nối frontend với backend, hoàn chỉnh dự án

Chưa chốt phạm vi. Bắt đầu bằng `brainstorming` (superpowers), rồi `writing-plans`, rồi `subagent-driven-development`. Cho phần giao diện có `design-taste-frontend`, `high-end-visual-design` trong `.claude/skills`.

**A. Chỗ backend đã có mà frontend chưa dùng (nối hai bên):**
- Lịch sử hiện 8 ký tự mã món thay vì tên món (`frontend/src/app/history/page.tsx:104`). `GET /orders/me` (`OrderService.listMine()`) chưa trả `productName`, trong khi hàng đợi quầy (`listQueue()`) đã trả.
- Biên lai và lịch sử không tự cập nhật trạng thái (`PAID` → `PREPARING` → `READY` → `COMPLETED`) khi barista bấm. `GET /orders/:id` có sẵn ở backend nhưng frontend chưa gọi.
- Điểm thưởng: `POST /payments` trả `discount`, `loyaltyPointsEarned` nhưng `PaymentResult` của frontend bỏ hai trường này. Chưa có endpoint nào cho khách đọc tổng điểm.
- Giỏ hàng chưa chặn 20 dòng (backend đã chặn).

**B. Giao diện:** đang dùng inline style; bám 5 màn wireframe đề §7; hiển thị tốt trên điện thoại; thay ảnh SVG tạm bằng ảnh thật; đồng bộ trạng thái loading / lỗi / rỗng giữa các trang.

**C. Hoàn chỉnh và bàn giao (đề §10–§11):** `frontend/Dockerfile` đang chạy `npm run dev` (build production đã chạy được, cân nhắc chuyển sang `next build` + `next start`); ESLint chưa cấu hình (`next lint` sẽ hỏi cấu hình); demo end-to-end và slide; điền Sprint Review / Retrospective; push, merge vào `main`.

## 8. Lệnh kiểm đầu phiên sau

```bash
git status --short && git log --oneline -3 develop && git rev-list --count origin/develop..develop
cd backend && npx jest && npx tsc --noEmit
cd ../frontend && npx vitest run && npx tsc --noEmit
docker ps --format "{{.Names}} {{.Status}}"
docker exec brewlite-db-1 psql -U brewlite -d brewlite -tAc "SELECT (SELECT count(*) FROM \"User\"), (SELECT count(*) FROM \"Order\")"
```

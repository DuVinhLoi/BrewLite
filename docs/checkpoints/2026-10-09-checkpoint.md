# Checkpoint — 2026-10-09

Điểm dừng để phiên sau bắt đầu tiếp mà không phải đọc lại lịch sử. Mọi số liệu dưới đây đã kiểm tra bằng git/docker ngày 2026-10-09.

## 1. Trạng thái đã xác nhận

- `develop` @ `e94648d`. Checkout chính `D:/CNPM/BrewLite`, không có thay đổi chưa commit nào ngoài 2 file `.dockerignore` (xem mục 4).
- Phần Barista + Admin đã merge vào `develop` qua `4974abd` (9 task, nhánh `feat/barista-admin`). Không còn commit nào của nhánh chưa merge.
- Commit `e94648d` đã xóa `docs/planning/2026-10-09-barista-admin-plan.md` khỏi `develop` vì plan đã xong. Bản đầy đủ lấy bằng `git show e94648d^:docs/planning/2026-10-09-barista-admin-plan.md`.
- Commit `cbfbdb8` đã xóa 15 thư mục skill superpowers trùng với plugin 6.4.1 khỏi `.claude/skills/`. Commit này vẫn nằm trên `develop`.
- `.agents/skills/` vẫn còn nguyên, gồm các bản superpowers trùng tên. Đây là lựa chọn của bạn (giữ nguyên).

## 2. Worktree đã dọn (2026-10-09)

- Đã dừng và xóa stack của worktree (`docker compose down`, không dùng `-v`). Volume `brewlite-wt-barista-admin_pgdata` vẫn còn; xóa bằng `docker volume rm brewlite-wt-barista-admin_pgdata` nếu không cần.
- Đã xóa thư mục `D:/CNPM/BrewLite-wt-barista-admin` và bỏ đăng ký worktree. Lần `git worktree remove --force` đầu báo `Permission denied`; sau đó thư mục đã rỗng nên xóa bằng `rmdir`.
- Đã xóa nhánh `feat/barista-admin` (trước là `129fcdf`, đã merge vào `develop`).
- Đã kiểm tra: `develop` local, `origin/develop` và remote đều ở `e94648d`, nên không có commit nào cần push.
- Sửa dở trong worktree (trước đây chỉ có ở worktree): đã lưu tại `docs/checkpoints/2026-10-09-barista-admin-review-fixes.patch`, không mất.
- Trước đây: nhánh `feat/barista-admin` @ `129fcdf`, có một thay đổi chưa commit: `docs/planning/2026-10-09-barista-admin-plan.md` (+78 / −12 dòng). Đã lưu thành patch tại `docs/checkpoints/2026-10-09-barista-admin-review-fixes.patch`. Đã kiểm tra: áp patch lên base `9455550` cho ra đúng file trong worktree.
- Nội dung sửa là các điểm sửa sau review plan (không phải code):
  1. Global Constraints: bỏ điều kiện chờ 2 file docs; thêm bước worktree và `npm ci` + `npx prisma generate`.
  2. Task 1: số test mới là 8 (không phải 7). Tổng dự kiến 76 pass / 1 skip.
  3. Task 3: quầy chỉ hủy được đơn `PAID`. Đơn `PENDING`/`PAYMENT_FAILED` → 403.
  4. Task 5: Header đọc lại role khi đổi trang (`usePathname`); dọn import trong `order-status.test.ts`.
  5. Task 7: `/admin` tải lại trước rồi mới hiện lỗi 409/400.
  6. Task 9: code cụ thể cho script 2 tài khoản; món hết hàng phải tự đặt về 0 trước khi demo.
- Chưa đối chiếu: các điểm sửa này đã được áp vào code `develop` chưa. Các commit `79ff5bb`, `1a91348` có thể liên quan; cần kiểm tra nếu muốn chắc chắn.

## 3. Stack: đang TẮT (không phải đang chạy)

- `localhost:3001` và `localhost:3000` không phản hồi.
- Ba container của worktree đều `Exited`: `brewlite-wt-barista-admin-backend-1` thoát với mã 1, frontend và db thoát với mã 0.
- Chưa đọc log để biết lý do backend thoát. Lệnh xem: `cd D:/CNPM/BrewLite-wt-barista-admin && docker compose logs backend`.

## 4. Việc còn lại (chờ người duyệt)

1. **Thử tay trên trình duyệt** (checklist plan Task 9 bước 5), sau khi stack chạy lại:
   - Khách đặt và trả 1 đơn; `/history` không còn nút "Quầy (demo)".
   - Đăng nhập `barista@brewlite.vn` → `/barista`; đơn ở cột "Chờ pha"; bấm Nhận pha → Pha xong → Đã giao.
   - Đăng nhập `admin@brewlite.vn` → `/admin`; +10 một món hết hàng; món hiện lại trong menu khách.
2. **Dọn dẹp:** đã xong (xem mục 2). Còn volume Docker `brewlite-wt-barista-admin_pgdata` nếu muốn xóa.
3. **Hai file `.dockerignore`** (`backend/`, `frontend/`) đã được commit theo yêu cầu của bạn, sau khi đã kiểm tra nội dung (loại trừ `node_modules`, `.env`, file build).
4. **Order State Machine**: còn 1 ô chưa tick (demo tay trên trình duyệt và chụp màn hình). Cần người làm.
5. **P2 Task 7** (khóa thanh toán nhiều instance): không áp dụng cho compose 1 backend. Có thể xóa khỏi plan nếu không định làm.

## 5. Ghi chú

- Plan barista-admin yêu cầu không merge, không push nếu chưa được duyệt, và không sửa checkout chính khi session khác đang làm việc ở đó.
- Các file `docs/checkpoints/*` là thay đổi mới, chưa commit.

## 6. Lệnh kiểm tra đầu phiên sau

```bash
git status --short
git log --oneline -5 develop
git worktree list
git branch --list "feat/*"
docker ps -a --format "{{.Names}} {{.Status}}"
```

# Checkpoint 0 (UI): xuất phát

Nhánh `worktree-ui-plan-checkpoint`, HEAD `050f62b`. Đo sau Giai đoạn 0 (commit `f41c0a8` `/users/me` và `/profile`, `8713770` sửa trang trắng, `050f62b` đồng bộ plan). Chưa đổi giao diện nào.

## Lệnh kiểm (theo `2026-10-09-backend-checkpoint.md` mục 8)

| Lệnh | Kết quả đo |
|---|---|
| `git status --short` | Sạch |
| `git rev-list --count a11cf0c..HEAD` | 3 commit trên `a11cf0c` |
| `cd backend && npx jest` | `Tests: 3 skipped, 124 passed, 127 total`; 13 suite pass, 2 suite skip |
| `cd backend && npx tsc --noEmit` | Sạch |
| `cd frontend && npx vitest run` | `Tests 123 passed (123)`; 12 file |
| `cd frontend && npx tsc --noEmit` | Sạch |
| `cd frontend && npx next build` | `Compiled successfully`; 8 route: `/`, `/_not-found`, `/admin`, `/barista`, `/cart`, `/history`, `/login`, `/profile` |
| `docker ps` | Không có container nào đang chạy |
| `docker exec brewlite-db-1 psql ...` | Không chạy được: `container ... is not running`. Chưa đếm `User` và `Order` |

Ghi chú môi trường:
- Worktree không có `node_modules`: đã `npm ci` ở `backend/` và `frontend/`. `npm ci` chặn script cài đặt nên phải chạy thêm `npx prisma generate` ở `backend/`, nếu không 2 suite jest fail ở bước biên dịch (TS2694, `OrderGetPayload`).
- So với mốc của checkpoint backend (117 test frontend, 7 route build): thêm `/users/me`, `/profile` và `ProfileView` nên lên 123 test và 8 route.

## Ảnh baseline

**Chưa chụp.** Môi trường phiên này không có trình duyệt và compose đang tắt. Thư mục `docs/checkpoints/ui-baseline/` chưa tồn tại. Việc này còn mở: người duyệt tự chụp 5 màn ở 360px và 1280px nếu cần so sánh trước/sau, hoặc đối chiếu bằng git (`a11cf0c`).

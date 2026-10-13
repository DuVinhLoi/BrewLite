# Bảng ánh xạ hash sau khi squash (2026-10-11)

Theo quyết định của người dùng, commit `733f315` (`fix(frontend): ui.test truyen children qua doi so createElement (react/no-children-prop)`) được **squash vào** commit `1f2ce02` (`build(frontend): Dockerfile production va ESLint`) để mỗi commit đều build được. Lịch sử chưa push nên được viết lại; mọi commit từ `1f2ce02` trở đi đổi hash. Nội dung cây (tree) **giống hệt**: `git diff backup/ui-plan-before-squash HEAD` rỗng. Nhánh sao lưu `backup/ui-plan-before-squash` giữ lịch sử cũ (xóa khi không cần).

Các tài liệu trong repo đã được cập nhật sang hash mới. Riêng `733f315` và `1f2ce02` cùng ánh xạ vào commit đã squash (cây giống nhau).

| Hash cũ | Hash mới | Chủ đề |
|---|---|---|
| `1f2ce02` | `e50f870` | build(frontend): Dockerfile production va ESLint (next/core-web-vitals) |
| `6d1f672` | `4520c1e` | docs: bao cao dot UI, README, ket qua smoke cuoi (Task 11) |
| `2d39fe9` | `1b20132` | build: bo environment chet cua frontend trong compose (NEXT_PUBLIC_* nhung luc build) |
| `543a8a5` | `e006556` | docs: sua nhan SHA, so commit, README va danh sach chua kiem |
| `9aa1d25` | `2d90d23` | docs: ghi build image tai 543a8a5 (build do tai 543a8a5) |
| `eed744f` | `e51651a` | docs: sua so endpoint mo rong, ghi chu UC07, UC14, key thanh toan, ten ham Esc |
| `79b06cb` | `6aa8b5e` | fix(frontend): vung live luon co mat cho thong bao tu choi gio hang |
| `a9dc9c8` | `5239872` | fix(frontend): GuestState dan ?next= de dang nhap xong quay lai |
| `9c7ad6b` | `a5dea31` | docs: checkpoint 5 UI (so lieu cuoi, chua kiem, cau hoi mo, toan bo ruling) + cap nhat ban giao |
| `733f315` | `e50f870` (gộp vào commit `1f2ce02` mới) | squash |

Các commit trước `1f2ce02` (từ `f41c0a8` đến `e4bdbaf`) không đổi hash.

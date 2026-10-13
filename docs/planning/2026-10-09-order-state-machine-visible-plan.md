# Kế hoạch: Order State Machine nhìn thấy được — phần còn lại

> Task 1–4 đã xong và đã bỏ khỏi file (xem lịch sử git). Chỉ giữ mục chưa tick.

## Kiểm chứng cuối

- [ ] `docker compose up -d --build`, demo tay trên `:3001` theo checklist ở `docs/checkpoints/2026-10-09-checkpoint.md` §4.1: khách đặt và trả 1 đơn (`/history` không còn nút "Quầy (demo)"); đăng nhập `barista@brewlite.vn` (tài khoản demo) → `/barista`, đơn ở cột "Chờ pha", bấm "Nhận pha" → "Pha xong" → "Đã giao" đến `COMPLETED`; chụp màn hình từng bước cho slide. *(Chưa tick: stack đã dựng lại và đi đủ chuỗi bằng API/script, nhưng môi trường làm việc không có trình duyệt nên chưa bấm nút và chụp màn hình bằng mắt, cần người làm nốt.)*

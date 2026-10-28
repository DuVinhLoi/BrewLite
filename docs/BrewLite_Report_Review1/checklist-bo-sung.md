# Checklist bổ sung báo cáo Review 1 (`main.tex`, nhánh `develop-agile`)

Cách dùng: mỗi người điền thẳng vào chỗ `____` của phần mình phụ trách, đánh `[x]` khi xong. Khi đủ, đưa lại file này để chép vào `main.tex` và biên dịch lại PDF.

Cập nhật 28/10/2026, sau khi đã bỏ dòng Product Owner / Scrum Master / lịch họp, bỏ cột Thời gian của bảng Sprint, và đổi bảng Definition of Done sang cột "File xác nhận". Đã viết xong Sprint Retrospective. Bài còn **1 ô đỏ `[Cần bổ sung: …]`** ở trang 4 của PDF (20 trang).

---

## A. Thông tin nhóm phải cung cấp (1 ô đỏ)

### A1. Trình duyệt đã thử — `main.tex:120`, trang 4 (mục 2.2, yêu cầu phi chức năng)
- [ ] Ghi trình duyệt, phiên bản và luồng đã thử. Xem phiên bản: Chrome `chrome://version`, Edge `edge://version`, Firefox `about:support`.

| Trình duyệt | Phiên bản | Hệ điều hành | Đã chạy hết luồng demo? | Người thử |
|---|---|---|---|---|
| Chrome | ____ | ____ | ____ | ____ |
| Edge | ____ | ____ | ____ | ____ |
| Firefox (nếu có) | ____ | ____ | ____ | ____ |

### A2. Sprint Retrospective — mục 6.4, trang 19
- [x] Đã viết 3 ý "Điều làm tốt" và 3 ý "Điều chưa làm tốt" theo nhóm chốt. Đã bỏ phần "Hành động cho Sprint sau" vì đề (mục 11.3) chỉ yêu cầu hai phần trên.

---

## B. Chỗ trong bài đã lỗi thời hoặc giám khảo dễ hỏi (không phải ô đỏ)

- [ ] **B1. `main.tex:208` còn câu hướng dẫn nội bộ** "Khung ghi Chưa có ảnh là ảnh nhóm chưa chụp". Thư mục `figures/` đã đủ 19/19 ảnh, PDF không còn khung nào, nên bỏ câu này.
- [ ] **B2. Thứ tự hoàn thành trái thứ tự Sprint.** Task 8, 10 (Sprint 3) có commit ngày 07/10, còn Task 1 "Khởi tạo dự án" (Sprint 1) đến 13/10 mới có commit. Burndown ở mục 3 cho thấy rõ điều này; Retrospective đã nhận điểm này, giám khảo có thể hỏi thêm lý do.
- [ ] **B3. Commit Task 1 và 6 ghi "Add files via upload"** (`44e3784`, tải file thẳng lên `main` qua web GitHub). Bảng Definition of Done dẫn `git-evidence.txt` cho điều kiện "commit rõ ràng, được review trong nhóm", nhưng commit này và các task không qua PR (Task 1, 2, 6, 9) là điểm yếu. PR #2 (Task 8, 10) và PR #4 (Task 4, 7) do chính người làm tự merge; chỉ PR #3 (Task 3, 5) có người khác merge.
- [ ] **B4. Test tồn kho đồng thời trên PostgreSQL thật chưa có bằng chứng chạy.** Kịch bản demo bước 7 (`main.tex:552`) hứa chạy test này, nhưng lần chạy 21/10 bỏ qua nó vì thiếu `DATABASE_URL`. Cần chạy với `DATABASE_URL` trỏ vào DB trong compose, lưu log, rồi cập nhật bài; nếu không chạy được thì bỏ bước 7.
- [ ] **B5. `main.tex`, `main.pdf` và file này chưa commit.** Sau khi điền xong thì biên dịch lại và commit cùng lúc.

---

## C. Đã kiểm, không thấy vấn đề

- Mọi đường dẫn file trong bài, kể cả các file mới đưa vào bảng Definition of Done, đều tồn tại trên nhánh `develop-agile`.
- Số liệu Postman (74 request, 137 assertion, 0 lỗi, trung bình 14 ms, lớn nhất 108 ms) khớp `docs/postman/results/2026-10-21-run.txt`.
- Ngày và tác giả của 11 commit trong bảng burndown và bảng phân công khớp `git log`; đường lý tưởng (7,0 / 4,3 / 0,9) tính đúng.
- `main.log` không có cảnh báo LaTeX.
- Chưa chạy lại: số test jest (170/3/173) và vitest (733 trong 46 file) chỉ đối chiếu với `docs/scrum-process.md`, không có log trong repo.

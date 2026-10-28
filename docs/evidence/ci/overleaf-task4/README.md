# Báo cáo Task 4 BrewLite trên Overleaf

Bản rút gọn từ báo cáo Task 4 ngày 23/10/2026, giữ sáu bảng và các số liệu quan trọng: 2 API, 8 sản phẩm mẫu, API 5/5 test, web 13/13 test, tổng 18/18 và minh chứng CI xanh/đỏ. Các điều kiện nghiệm thu chưa đạt vẫn được ghi rõ.

## Nhập vào Overleaf

1. Tạo dự án bằng **New Project → Upload Project** và chọn `BrewLite-Task4-Overleaf.zip`.
2. Mở **Settings → Compiler**, chọn **XeLaTeX**. Giữ TeX Live mới nhất khả dụng.
3. Chọn `main.tex` làm Main document nếu Overleaf chưa tự nhận diện, rồi bấm **Recompile**.

Tài liệu chính thức: [tải dự án ZIP lên Overleaf](https://docs.overleaf.com/managing-projects-and-files/uploading-a-project) và [chọn trình biên dịch](https://docs.overleaf.com/getting-started/recompiling-your-project/selecting-a-tex-live-version-and-latex-compiler).

## Tệp trong dự án

- `main.tex`: khổ A4, phông TeX Gyre Termes, tiếng Việt Unicode, đánh số mục và bảng 4.x.
- `task4.tex`: nội dung rút gọn, có thể chỉnh sửa độc lập.
- `README.md`: hướng dẫn sử dụng.

Để ghép với báo cáo nhóm, đưa `task4.tex` vào dự án hiện có và dùng `\input{task4}` tại vị trí Task 4. Đồng bộ các package và macro từ phần mở đầu `main.tex`; điều chỉnh cách đánh số mục nếu báo cáo nhóm đã có bộ đếm chương. Hai lệnh `\newpage` chia nội dung thành ba phần và có thể bỏ khi ghép.

## Nguồn và giới hạn

- Baseline: nhánh `a2/Task4`, commit `0030c2a672b883d00db931955e3672a7218106e6`.
- Kết quả local 18/18 được chạy ngày 23/10/2026; log/metadata GitHub xanh và đỏ thu ngày 21/10/2026.
- Link tài liệu/code trỏ tới commit cố định trong repository. Quyền xem phụ thuộc quyền truy cập repository của người đọc.
- Bản rút gọn lập ngày 24/10/2026; không khẳng định trạng thái GitHub trực tiếp ở ngày này.
- Task 3 và bằng chứng required check chặn merge chưa có trong baseline; không đánh dấu toàn bộ Task 4 đã nghiệm thu.

Gói được chuẩn bị để nhập vào Overleaf; chưa tạo dự án trong tài khoản Overleaf vì phiên làm việc không có trình duyệt kết nối.

## Kiểm tra bản rút gọn

Đã biên dịch bằng Tectonic 0.17.0 (engine XeTeX), exit 0; PDF có **3 trang, 6 bảng**. Đã xem ảnh kết xuất của cả ba trang; log không có lỗi tràn khung hoặc thiếu ký tự. Các số 18/18, 5/5, 13/13, hai run CI và mã 403 được kiểm tra lại trong nội dung PDF. Việc này kiểm tra bản báo cáo, không phải chạy lại bộ test ứng dụng.

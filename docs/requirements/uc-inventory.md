# UC-10 — Quản lý nguyên liệu và công thức

Thuộc đợt **BREW-INVENTORY-01**, yêu cầu FR-29 (Must), áp dụng cho Task 1–5 của Assignment 2. Người dùng chính là **Barista**; Customer và Guest chỉ xem được số ly còn bán. Hợp đồng API chi tiết: [inventory-contract.md](../inventory-contract.md). Hướng dẫn vận hành: [inventory-runbook.md](../inventory-runbook.md).

## Mục tiêu và điều kiện

Nhân viên ghi lại lượng nguyên liệu thực nhận hoặc số đếm khi kiểm kê, kèm lý do thay đổi, và giữ công thức luôn đúng. Nhờ đó khách thấy được mỗi món còn pha được bao nhiêu ly, theo từng lựa chọn và theo cả giỏ.

Điều kiện: API và cơ sở dữ liệu đang chạy; Barista đã đăng nhập (JWT hợp lệ); nguyên liệu và công thức ban đầu do seed tạo, số dư ban đầu bằng 0. Đơn vị chuẩn là g, ml và piece (cái).

## Luồng chính

1. Barista mở `/inventory`, xem từng nguyên liệu: tồn thực tế (onHand), phần đang giữ cho đơn (reserved), phần còn dùng được (available) và đơn vị.
2. Barista chọn RECEIVE (nhập kho), nhập lượng dương, đơn vị phù hợp và lý do. API tự đổi kg sang g, l sang ml, rồi ghi số dư mới và một dòng nhật ký kho (StockMovement) trong cùng một transaction.
3. Barista thấy số dư mới và nhật ký: ai thực hiện, nguyên liệu nào, thay đổi bao nhiêu (delta), onHand sau thay đổi, lý do và thời điểm.
4. Barista chọn một món kèm size, hoặc một topping, rồi thay cả công thức (1–50 nguyên liệu, không trùng nhau). API kiểm món/topping được chọn, lượng phải dương và đơn vị phải hợp lệ, rồi lưu trọn một lần (không lưu dở).
5. Guest hoặc Customer chọn size, topping. API tính số ly bằng giá trị nhỏ nhất của floor(available / định lượng) trên các nguyên liệu, và cho biết nguyên liệu nào đang giới hạn. Menu tính theo size S, không topping; giỏ hàng cộng nhu cầu của mọi dòng trước khi quyết định có đặt được không (canOrder).
6. Customer tạo đơn: UC-04 giữ chỗ nguyên liệu và lưu bản chụp (snapshot). Thanh toán thành công thì trừ theo snapshot; thất bại thì vẫn giữ chỗ; hủy khi chưa trả thì nhả đúng phần trong snapshot. Sửa công thức ở bước 4 không ảnh hưởng các đơn đã giữ chỗ.

## Thay thế và ngoại lệ

| Tình huống | Kết quả bắt buộc |
|---|---|
| ADJUST (kiểm kê) | Lượng nhập là **số đếm thực tế cuối cùng**, không phải phần chênh lệch; nhật ký ghi delta có dấu. Không được thấp hơn reserved |
| Thiếu JWT / sai vai trò | 401 / 403, không đổi dữ liệu |
| Thiếu lý do, lượng sai, piece có số lẻ, đổi g sang ml, chọn sai món/topping, nguyên liệu trùng | 400 VALIDATION_ERROR, không đổi dữ liệu |
| ID nguyên liệu hoặc sản phẩm không tồn tại | 404, không đổi dữ liệu |
| ADJUST thấp hơn reserved | 409 BELOW_RESERVED, giữ nguyên số dư và nhật ký |
| Thiếu hoặc trống công thức, hoặc phần base không có nguyên liệu được theo dõi (tracked) | cups=0, sellable=false; tạo đơn bị từ chối với RECIPE_UNAVAILABLE |
| Nhiều món trong giỏ dùng chung nguyên liệu | Thiếu hụt được cộng theo từng nguyên liệu; từng dòng đủ chưa chắc cả giỏ đủ |
| Nhập, kiểm kê, đặt đơn, thanh toán, hủy diễn ra cùng lúc | Khóa theo thứ tự cố định và transaction giữ 0≤reserved≤onHand; không có cập nhật dở dang |

## Kịch bản nghiệm thu

Trên cơ sở dữ liệu demo sạch, nhập 20g matcha, 2000ml sữa không đường và 200ml syrup. Matcha size S cần 3g/150ml/20ml nên `min(6,13,10)=6`: bán được 6 ly, giới hạn bởi matcha. Đặt 2 ly S thì giữ 6g/300ml/40ml; thanh toán thất bại không đổi số dư; hủy đơn nhả đúng các lượng đó và không đổi onHand. Tạo đơn khác và trả thành công thì giảm cả onHand lẫn reserved theo snapshot; gửi lại yêu cầu (replay) không trừ thêm. Nhập 0.020kg matcha phải bằng 20g; 2l sữa bằng 2000ml. Kết quả chạy thực tế ghi tại [verification](../inventory-verification.md).

# UC-10 — Quản lý nguyên liệu và công thức

Task **BREW-INVENTORY-01**, FR-29 Must, Assignment 2 Task 1–5. Actor chính: **Barista**; Customer/Guest chỉ đọc khả năng bán công khai. Hợp đồng chi tiết: [inventory-contract.md](../inventory-contract.md). Hướng dẫn vận hành: [inventory-runbook.md](../inventory-runbook.md).

## Mục tiêu và điều kiện

Nhân viên nhập lượng thực nhận hoặc số kiểm kê, giải thích thay đổi và duy trì công thức; khách nhìn thấy số ly pha được theo lựa chọn và toàn giỏ. API/DB hoạt động; Barista có JWT hợp lệ; nguyên liệu/công thức ban đầu do seed tạo, số dư ban đầu bằng 0. Đơn vị chuẩn là g/ml/piece.

## Luồng chính

1. Barista mở `/inventory`, đọc onHand, reserved, available và đơn vị từng nguyên liệu.
2. Chọn RECEIVE, nhập lượng dương, đơn vị phù hợp và lý do; API đổi kg→g hoặc l→ml rồi ghi số dư và StockMovement trong một transaction.
3. Barista thấy số dư mới và nhật ký gồm người thực hiện, nguyên liệu, delta, onHand sau thay đổi, lý do và thời điểm.
4. Barista chọn sản phẩm+size hoặc topping, thay toàn bộ công thức gồm 1–50 nguyên liệu duy nhất; API kiểm selector, lượng dương và đơn vị, lưu nguyên tử.
5. Guest/Customer chọn size/topping; API tính số ly bằng minimum của floor(available/định lượng), trả nguyên liệu giới hạn. Menu dùng S không topping; giỏ cộng nhu cầu trên tất cả dòng trước quyết định canOrder.
6. Customer tạo đơn: UC-04 giữ nguyên liệu và snapshot. Thanh toán thành công tiêu thụ snapshot; thất bại giữ chỗ; hủy chưa trả giải phóng đúng snapshot. Sửa công thức ở bước 4 không thay các đơn đã giữ.

## Thay thế và ngoại lệ

| Tình huống | Kết quả bắt buộc |
|---|---|
| ADJUST | Quantity là **số thực đếm cuối cùng**, không phải delta; ghi delta có dấu vào nhật ký. Không được thấp hơn reserved |
| Thiếu JWT / sai vai trò | 401 / 403, không thay DB |
| Thiếu lý do, lượng sai, piece lẻ, g→ml, selector sai, nguyên liệu trùng | 400 VALIDATION_ERROR, không thay DB |
| ID nguyên liệu/sản phẩm không tồn tại | 404, không thay DB |
| ADJUST dưới reserved | 409 BELOW_RESERVED, giữ số dư và nhật ký cũ |
| Thiếu/trống công thức hoặc base không có nguyên liệu tracked | cups=0, sellable=false; tạo đơn bị RECIPE_UNAVAILABLE |
| Giỏ chia sẻ nguyên liệu | Shortage tổng hợp theo nguyên liệu; từng dòng còn đủ chưa bảo đảm cả giỏ đủ |
| Tranh chấp nhập/kiểm kê/đặt/thanh toán/hủy | Khóa có thứ tự và transaction giữ 0≤reserved≤onHand; không cập nhật một phần |

## Kịch bản nghiệm thu

Nhận 20g matcha, 2000ml sữa không đường và 200ml syrup trên DB demo sạch. Matcha S cần 3g/150ml/20ml nên `min(6,13,10)=6`, giới hạn bởi matcha. Đặt 2 S giữ 6g/300ml/40ml; payment decline không đổi số dư; hủy giải phóng các lượng đó và không đổi onHand. Tạo đơn khác và trả thành công giảm cả onHand/reserved theo snapshot; replay không giảm thêm. Nhận 0.020kg matcha phải tương đương 20g; 2l sữa tương đương 2000ml. Ghi kết quả thực chạy tại [verification](../inventory-verification.md).

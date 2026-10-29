# ADR-006: Kho nguyên liệu, giữ chỗ và snapshot đơn hàng

Accepted 2026-10-29 — BREW-INVENTORY-01. Quyết định này thay phần tồn kho của ADR-005 §C cho **đơn mới**; replay thanh toán của ADR-005 §A/B vẫn áp dụng.

Một số ly trên Product không biểu diễn nguyên liệu dùng chung giữa các món, size và topping. Chọn bảng Ingredient/Recipe/RecipeLine và `available = onHand - reserved`: tổng hợp toàn giỏ trước giữ chỗ, rồi lưu OrderIngredient bất biến để thanh toán/hủy dùng đúng lượng đã đặt. Giữ chỗ không giảm onHand; thanh toán thành công giảm onHand và reserved cùng transaction với Payment/Order; thất bại giữ reserved; hủy chưa trả chỉ giảm reserved. Khóa đơn và trạng thái bảo đảm mỗi hành động chỉ tác động một lần; replay không chạm số dư.

Thay vì xóa cột cũ hoặc ước lượng gram từ số ly, migration **additive** giữ Product.stock và đặt `Order.inventoryTracked=false` cho đơn có trước. Mọi đơn mới đặt true, dùng nguyên liệu; đơn false dùng lifecycle Product.stock cũ và không tạo snapshot suy diễn. Catalog trả stock ước tính S không topping từ nguyên liệu. Phải đối soát đơn legacy chưa trả và kiểm kê vật lý trước cutover; không tự hủy hoặc tự giải phóng theo thời gian.

DB dùng numeric(18,3), quantity HTTP là chuỗi, ràng buộc 0≤reserved≤onHand. Transaction đọc công thức khóa recipe theo ID trước rồi khóa ingredient theo ID; sửa công thức dùng cùng khóa recipe, mọi ghi số dư dùng cùng thứ tự ingredient. Đọc availability trong repeatable-read để có snapshot nhất quán. Seed tạo bản ghi thiếu ở 0 và update rỗng; nhập tồn ban đầu qua API có StockMovement/actor/reason, không reset dữ liệu vận hành.

Hệ quả: giữ số dư vận hành và lịch sử cũ an toàn, nhưng đơn bỏ dở tiếp tục giữ nguyên liệu vô thời hạn; thay công thức không giải phóng/đổi snapshot đang tồn tại. Không thể rollback về image chưa hiểu marker true sau khi đã mở bán đơn nguyên liệu: image đó có thể hoàn sai Product.stock. Quy trình rollback/cutover trong [runbook](../../inventory-runbook.md).

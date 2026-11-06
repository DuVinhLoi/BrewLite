# Phân quyền hủy đơn chưa trả — 05/11/2026

Task: `a2/fix-barista-cancel-permission`, worktree `C:\BrewLite-a2-OrderPermission`, base `main` tại `5834af4`.

SRS AC-F24.3 đã quy định Barista hủy đơn `PENDING`/`PAYMENT_FAILED` trả 403 `FORBIDDEN`; các trạng thái còn lại vẫn trả 409 `INVALID_ORDER_TRANSITION`, mã đơn không tồn tại vẫn là 404. Không thay tiêu chí, bảng trạng thái, API/schema hoặc dependency.

Integration INT-T11b trên nhánh khôi phục test tái hiện API trả 409 thay vì 403. Unit test mới gọi service thật với ORM boundary thay thế, không DB/network: trước sửa **2 failed, 6 passed**. Hai trường hợp PENDING/PAYMENT_FAILED sai loại exception; năm trạng thái khác và mã đơn không tồn tại đã đúng. Các stub ghi đơn/settle kho đều fail nếu bị gọi để bảo vệ bất biến của thao tác từ chối.

Nguyên nhân: nhánh phân quyền chỉ chặn Customer đổi sang trạng thái pha chế; Barista hủy đơn chưa trả rơi xuống kiểm chuyển trạng thái chung. Sửa bằng guard quyền sau khi đã xác nhận đơn tồn tại trong transaction, trước cập nhật/settle, giữ nguyên hành vi các trạng thái khác. Sơ đồ/ADR hiện tại không đổi quan hệ, trạng thái hoặc quyết định kiến trúc; ma trận khôi phục đã gắn INT-T11 với AC-F24.3. Test và code app được giữ trong PR sửa riêng theo L2; chưa tự merge hoặc deploy.

Sau sửa: **97/97 unit test đạt** (8 hồi quy phân quyền và 89 VNPay), không skip; ESLint source/prisma/test hồi quy và build API đều exit 0. Đây chưa phải bằng chứng integration qua HTTP đã xanh; INT-T11b cần được bật lại và chạy trên bản sửa sau khi ghép dependency bộ test.

Bổ sung sau khi ghép các commit test đã xác định (`e05bdd3`, `7e4dd9b`, `01dbd5c`, `91773ca`): đã bật INT-T11b và kiểm trên API local bản sửa, DB riêng `brewlite_test_permission20261105`, cổng API 4106. **21/21 HTTP test đạt, không skip**, thời gian 33,60 giây. Bộ unit API đầy đủ **227/227 đạt**, lint đạt. Chưa merge/deploy; nhánh vẫn phụ thuộc PR khôi phục test để đưa pipeline đầy đủ vào CI. Các assertion UI cũ trong dependency chưa được tính là đã giải quyết bởi bản sửa API này.

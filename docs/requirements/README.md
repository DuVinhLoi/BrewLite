# docs/requirements — Task 1: Khai thác và đặc tả yêu cầu

Thư mục này là baseline **Task 1 đã chốt phạm vi minimum theo PR #5, rồi rút gọn thêm về mức tối thiểu của đề**. Quyết định, phụ thuộc và lý do rút gọn ghi ở [SRS mục 1.4 và 8](srs.md). Quản lý trạng thái qua API/Postman (FR-23, FR-24) là Must; khách hủy đơn chưa trả (FR-25) và quản lý nguyên liệu/công thức (FR-29) là Must của BREW-INVENTORY-01; khuyến mãi, điểm thưởng, hoàn tiền, hàng đợi (FR-17, FR-18, FR-19, FR-26, FR-27) là Won’t, gộp ở SRS mục 5.9. Task 2 vẫn phải giữ hai lớp domain Promotion và LoyaltyTransaction.

Nghiệm thu Task 1 dựa trên tài liệu yêu cầu, hai use-case diagram và truy vết hiện có; không chờ code hoặc sơ đồ Task 2. Task sau bổ sung các cột truy vết theo đúng thứ tự đề A2. Thành viên phụ trách cần tự giải thích được tài liệu khi vấn đáp.

## Nhóm phải nộp ở đây

| File | Nội dung | Đề A2 |
|---|---|---|
| `context-and-scope.md` | Vấn đề nghiệp vụ, bảng stakeholder (kỳ vọng từng bên), in-scope, out-of-scope, giả định, ràng buộc, rủi ro ban đầu | §3.1 (bắt buộc) |
| `srs.md` | SRS rút gọn: `FR-xx`, `NFR-xx`, MoSCoW, tiêu chí chấp nhận kiểm chứng được cho từng yêu cầu | §3.2 |
| `use-case-overview.puml` và `.svg` | Use-case diagram tổng quát toàn hệ thống (nằm trong SRS hoặc đứng riêng) | §3.2 mục 5 |
| `uc-checkout.md` | Đặc tả use-case trọng tâm "Đặt và thanh toán đơn hàng": actor, trigger, tiền/hậu điều kiện, luồng chính, thay thế, ngoại lệ, mã yêu cầu liên quan | §3.3 |
| `uc-inventory.md` | UC-10 quản lý số dư, movement, công thức và khả năng bán; FR-29 | BREW-INVENTORY-01 |
| `uc-checkout.puml` và `.svg` | Use-case diagram cho phạm vi use-case đã chọn | §3.3 |

Nhóm yêu cầu tối thiểu trong SRS: menu, chi tiết sản phẩm, giỏ hàng, xác thực, đặt đơn, thanh toán, lịch sử đơn, quản lý trạng thái đơn, hiệu năng, bảo mật, tính khả dụng, khả năng triển khai.

## Tiêu chí nghiệm thu (đề A2 §3.3)

Người đọc xác định rõ hệ thống làm gì, không làm gì, và dùng tiêu chí chấp nhận để viết test ở các task sau.

Hướng dẫn từng bước: `docs/planning/2026-10-15-assignment2-plan.md`, Task 1.

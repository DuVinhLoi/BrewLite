# docs/requirements — Task 1: Khai thác và đặc tả yêu cầu

Thư mục này chứa **bản chốt Task 1**: phạm vi tối thiểu đã thống nhất ở PR #5, sau đó rút gọn thêm về đúng mức tối thiểu của đề. Các quyết định, phần phụ thuộc và lý do rút gọn nằm ở [SRS mục 1.4 và 8](srs.md).

Tóm tắt phạm vi:

- **Bắt buộc (Must):** quản lý trạng thái đơn qua API/Postman (FR-23, FR-24); khách hủy đơn chưa trả (FR-25) và quản lý nguyên liệu, công thức (FR-29) thuộc đợt BREW-INVENTORY-01.
- **Không làm (Won’t):** khuyến mãi, điểm thưởng, hoàn tiền, hàng đợi Barista (FR-17, FR-18, FR-19, FR-26, FR-27), gom ở SRS mục 5.9.
- Sơ đồ lớp ở Task 2 vẫn phải có hai lớp `Promotion` và `LoyaltyTransaction`.

Task 1 được nghiệm thu dựa trên tài liệu yêu cầu, hai use-case diagram và phần truy vết hiện có, không cần chờ code hay sơ đồ Task 2. Các task sau lần lượt điền tiếp các cột truy vết theo đúng thứ tự của đề A2.

## Nhóm phải nộp ở đây

| File | Nội dung | Đề A2 |
|---|---|---|
| `context-and-scope.md` | Vấn đề nghiệp vụ, bảng stakeholder (kỳ vọng của từng bên), những gì làm và không làm, giả định, ràng buộc, rủi ro ban đầu | §3.1 (bắt buộc) |
| `srs.md` | SRS rút gọn: yêu cầu `FR-xx`, `NFR-xx`, mức ưu tiên MoSCoW, tiêu chí chấp nhận kiểm chứng được cho từng yêu cầu | §3.2 |
| `use-case-overview.puml` và `.svg` | Use-case diagram tổng quát của toàn hệ thống (nhúng trong SRS) | §3.2 mục 5 |
| `uc-checkout.md` | Đặc tả use-case trọng tâm "Đặt và thanh toán đơn hàng": actor, điều kiện kích hoạt, trước/sau, luồng chính, luồng thay thế, ngoại lệ, mã yêu cầu liên quan | §3.3 |
| `uc-inventory.md` | UC-10: quản lý số dư nguyên liệu, nhập/kiểm kê, công thức và số ly còn bán được; FR-29 | BREW-INVENTORY-01 |
| `uc-checkout.puml` và `.svg` | Use-case diagram cho phạm vi use-case đã chọn | §3.3 |

Các nhóm yêu cầu tối thiểu trong SRS: menu, chi tiết sản phẩm, giỏ hàng, xác thực, đặt đơn, thanh toán, lịch sử đơn, quản lý trạng thái đơn, hiệu năng, bảo mật, tính khả dụng, khả năng triển khai.

## Tiêu chí nghiệm thu (đề A2 §3.3)

Người đọc biết rõ hệ thống làm gì, không làm gì, và dùng được tiêu chí chấp nhận để viết test ở các task sau.

Hướng dẫn từng bước: `docs/planning/2026-10-15-assignment2-plan.md`, phần Task 1.

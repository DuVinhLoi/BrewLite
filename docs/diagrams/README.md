# docs/diagrams — Task 2: Mô hình hóa hệ thống

Thư mục này **chưa có sơ đồ**. Nhóm tự vẽ (đề A2 §4). Mỗi sơ đồ lưu **cả tệp nguồn và ảnh kết xuất** (đề A2 §4.2): `.puml` và `.svg`.

## Nhóm phải nộp ở đây

| Sơ đồ | File | Yêu cầu chính | Đề A2 |
|---|---|---|---|
| Activity | `activity-checkout.puml` / `.svg` | Điểm bắt đầu và kết thúc, hành động người dùng và hệ thống, decision/merge, swimlane, ba nhánh: hết hàng, chưa đăng nhập, thanh toán thất bại | §4.1 |
| Sequence | `sequence-checkout.puml` / `.svg` | Lifeline Customer, Next.js UI, NestJS API, Database, Payment Service; JWT và validate; transaction tạo đơn và trừ tồn kho; `alt` thanh toán thành công/thất bại; idempotency; thông báo kết quả | §4.2 (bắt buộc) |
| Class | `class-domain.puml` / `.svg` | Tối thiểu 7 lớp `User`, `Product`, `Order`, `OrderItem`, `Payment`, `Promotion`, `LoyaltyTransaction`; thuộc tính chính, quan hệ, multiplicity, enum trạng thái | §4.3 |
| State (nên có) | `state-order.puml` / `.svg` | Vòng đời đơn hàng, nhất quán với FR quản lý trạng thái đơn | gợi ý của plan |

## Tiêu chí nghiệm thu (đề A2 §4.3)

Ba loại sơ đồ không mâu thuẫn với SRS, use-case hoặc mô hình dữ liệu. Tên lớp, thuộc tính và trạng thái phải khớp `docs/requirements/srs.md`.

Không render ảnh bằng công cụ sinh sơ đồ rồi nộp mà không hiểu: nhóm phải giải thích được từng sơ đồ khi vấn đáp.

Hướng dẫn từng bước: `docs/planning/2026-10-15-assignment2-plan.md`, Task 2. Tham khảo (không chép): `docs/reference/a1/user-sequence-specifications.md` §2.4, §2.5.

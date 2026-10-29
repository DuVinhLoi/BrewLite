# docs/diagrams — Task 2: Mô hình hóa hệ thống

Thư mục chứa nguồn PlantUML và SVG xuất bằng PlantUML. BREW-INVENTORY-01 cập nhật class/activity/sequence/state theo ingredient balances và snapshot; UC-10 ở requirements/uc-inventory.md. Mỗi sơ đồ lưu **cả tệp nguồn và ảnh kết xuất** (đề A2 §4.2): `.puml` và `.svg`.

## Nhóm phải nộp ở đây

| Sơ đồ | File | Yêu cầu chính | Đề A2 |
|---|---|---|---|
| Activity | `activity-checkout.puml` / `.svg` | Điểm bắt đầu và kết thúc, hành động người dùng và hệ thống, decision/merge, swimlane (Customer, Next.js UI, NestJS API, VNPay sandbox), ba nhánh: hết hàng, chưa đăng nhập, thanh toán thất bại; thêm khách hủy trên VNPay, hết hạn (đối soát QueryDR), chưa kết luận | §4.1 |
| Sequence | `sequence-checkout.puml` / `.svg` | Lifeline Customer, Browser, Next.js UI, NestJS API, Database, VNPay sandbox; JWT và validate; transaction giữ nguyên liệu/snapshot, tiêu thụ khi trả, giải phóng khi hủy; ba đoạn thanh toán (tạo URL, IPN, return/poll); `alt` thành công/thất bại/chữ ký sai, `opt` QueryDR; idempotency; thông báo kết quả | §4.2 (bắt buộc) |
| Class | `class-domain.puml` / `.svg` | Ingredient, Recipe, RecipeLine, StockMovement, OrderIngredient và marker legacy; giữ tối thiểu 7 lớp `User`, `Product`, `Order`, `OrderItem`, `Payment`, `Promotion`, `LoyaltyTransaction`; thuộc tính chính (`Payment` có thêm cột cổng thanh toán), quan hệ, multiplicity, enum trạng thái (`PaymentStatus.PENDING`) | §4.3 |
| State (nên có) | `state-order.puml` / `.svg` | Vòng đời đơn hàng, nhất quán với FR quản lý trạng thái đơn; kèm vòng đời `Payment` (`PENDING` → `SUCCESS`/`FAILED`) | gợi ý của plan |

**VNPay sandbox (2026-10-29):** bốn file `.puml` trên và `docs/requirements/uc-checkout.puml` đã được viết lại cho thanh toán VNPay; các ảnh `.svg` tương ứng chưa xuất lại và còn mô tả simulator cho tới khi nhóm xuất từ `.puml`. Các điểm gắn "(chờ spike)" trong sơ đồ phụ thuộc hành vi sandbox chưa đo (xem [plan](../planning/2026-10-29-vnpay-payment-plan.md), bước 1).

## Tiêu chí nghiệm thu (đề A2 §4.3)

Ba loại sơ đồ không mâu thuẫn với SRS, use-case hoặc mô hình dữ liệu. Tên lớp, thuộc tính và trạng thái phải khớp `docs/requirements/srs.md`.

Không render ảnh bằng công cụ sinh sơ đồ rồi nộp mà không hiểu: nhóm phải giải thích được từng sơ đồ khi vấn đáp.

Hướng dẫn từng bước: `docs/planning/2026-10-15-assignment2-plan.md`, Task 2. Tham khảo (không chép): `docs/reference/a1/user-sequence-specifications.md` §2.4, §2.5.

## Render và kiểm tra BREW-INVENTORY-01

Nguồn `.puml` là canonical. Đã xuất cả bảy SVG (bốn diagram ở đây, hai use-case ở requirements và deployment ở architecture) bằng PlantUML **1.2025.10**, Java 25; không dùng `docs/render_svg.py` (custom preview). Lệnh tại repo root, thay đường dẫn JAR bằng vị trí local:

```powershell
java -DPLANTUML_LIMIT_SIZE=20000 -jar C:/path/to/plantuml.jar -charset UTF-8 -tsvg docs/diagrams/class-domain.puml docs/diagrams/activity-checkout.puml docs/diagrams/sequence-checkout.puml docs/diagrams/state-order.puml docs/requirements/use-case-overview.puml docs/requirements/uc-checkout.puml docs/architecture/deployment.puml
```

PNG để kiểm tra trực quan có thể xuất với `-tpng -o <thư-mục-Temp-tuyệt-đối>`; không đưa preview vào repo. SVG native có thể phóng to để đọc sequence/activity dài. Render thành công chỉ xác minh cú pháp/ảnh, không chứng minh hành vi runtime.

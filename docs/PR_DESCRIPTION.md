# PR: Task 2 — Mô hình hóa hệ thống BrewLite A2 (UC-04 Checkout)

**Nhánh đề nghị:** `a2/task-2-diagrams` → **nhánh đích:** `develop-Assignment2`.

## Phạm vi thay đổi

| Hạng mục | Nguồn PlantUML | SVG giao nộp | Truy vết |
|---|---|---|---|
| 2.1 Activity | `docs/diagrams/activity-checkout.puml` | `docs/diagrams/activity-checkout.svg` | UC-04 §5–7, FR-10, FR-11–16 |
| 2.2 Sequence | `docs/diagrams/sequence-checkout.puml` | `docs/diagrams/sequence-checkout.svg` | UC-04 §5, E1–E4/E6–E8; NFR-05/06/13 |
| 2.3 Class | `docs/diagrams/class-domain.puml` | `docs/diagrams/class-domain.svg` | SRS §3.6, BR-01–05/08/09 |
| Bổ sung: State machine | `docs/diagrams/state-order.puml` | `docs/diagrams/state-order.svg` | SRS §3.6; FR-23/24/25 |

**Tham chiếu chính:** `docs/requirements/srs.md` §3.4–3.6, `docs/requirements/uc-checkout.md` §4–9 và `docs/reference/a1/user-sequence-specifications.md` §2.4, §2.5. Chỉ SRS A2 và UC-04 A2 quyết định phạm vi/giá trị khi A1 có khác biệt.

## Bảng kiểm chéo bắt buộc (A2 §4.3)

| Kiểm | Kết quả | Bằng chứng / xử lý |
|---|---|---|
| Class, thuộc tính và enum trùng `srs.md`/`uc-checkout.md` | ✅ Đạt về nội dung | 7 lớp đúng tên `User`, `Product`, `Order`, `OrderItem`, `Payment`, `Promotion`, `LoyaltyTransaction`; đủ thuộc tính §3.6. Enum đúng `Role`, `OrderStatus`, `PaymentMethod`, `PaymentStatus`, `LoyaltyType`. |
| Multiplicity của các quan hệ | ✅ Đạt | `User 1 → Order 0..*`; `Order 1 → OrderItem 1..*`; `Product 1 ← OrderItem 0..*`; `Order 1 → Payment 0..*`; `Promotion 0..1 ← Order 0..*`; `User 1 → LoyaltyTransaction 0..*`; `Order 0..1 ← LoyaltyTransaction 0..*`. |
| Trạng thái activity/sequence là tập con `OrderStatus` | ✅ Đạt | Runtime chỉ dùng `PENDING`, `PAYMENT_FAILED`, `PAID`; E1b tham chiếu thêm `PREPARING`, `READY`, `COMPLETED`, `CANCELLED` khi đọc đơn. Toàn bộ đều thuộc `OrderStatus` §3.6. |
| E1a/E1b: chưa đăng nhập hoặc JWT hết hạn | ✅ Đạt | FR-10, AC-F10.3–4, UC-04 §7 E1a/E1b. Trước khi tạo đơn: login và giữ giỏ; sau tạo đơn: giữ nguyên `orderId`, key, chủ đơn, xác minh lại đơn, không POST `/orders` lần nữa. |
| E2: hết hàng | ✅ Đạt | FR-13, AC-F13.1–5, UC-04 §7 E2; 409 `OUT_OF_STOCK`, rollback toàn bộ, giữ giỏ, trở lại giỏ và kết thúc nhánh. |
| E3: thanh toán thất bại | ✅ Đạt | FR-15, AC-F15.1/3/4/5, UC-04 §7 E3; lưu `Payment.FAILED`, `Order.PAYMENT_FAILED`, giữ đơn/giỏ/tồn kho; retry A3 dùng cùng `orderId`. |
| Lifelines/actor | ✅ Đạt | `Customer`, `Next.js UI`, `NestJS API`, `Database`, `Payment Service` khớp UC-04 §3 và A2 §4.2. Không đưa Barista vào sequence checkout vì Barista là actor của UC-07, không phải UC-04. |
| API request/response, guard, DTO, transaction | ✅ Đạt | Sequence có `POST /auth/login`, `POST /orders`, `POST /payments`, `GET /orders/:id` cho E1b; JWT/role/owner/DTO, transaction **T1** tạo đơn & trừ kho, **T2** lưu Payment thành công & chuyển `PAID`. FR-11/12/14 và NFR-05/06/13. |
| Idempotency API **E4a** | ✅ Đạt | FR-16 AC-F16.1/4/5, UC-04 E4; sau xác thực và kiểm chủ đơn, tra SUCCESS theo user/order/key/body **trước** trạng thái; replay thành công trả 200 cùng `paymentId`, không gọi simulator. Key mới cho đơn `PAID` → 409. FAILED không cache. |
| Chống thu trùng/phục hồi simulator **E8b** | ✅ Đạt ở mô hình | FR-16 AC-F16.7, SRS §3.4, UC-04 §7 E8b; service dùng `orderId` làm tham chiếu lưu thành công bền vững. Nếu đã thu nhưng API chưa commit T2: retry key/order cũ, lấy kết quả gốc, transaction phục hồi một `Payment.SUCCESS`, không thu lại. ADR 005 ở Task 3 sẽ quyết định chi tiết cơ chế lưu bền. |
| Máy trạng thái và giới hạn phạm vi | ✅ Đạt | **8 chuyển trạng thái** hợp lệ trong `state-order.puml`. Hai chuyển `→ CANCELLED` của Customer thuộc FR-25 (Could) nhưng vẫn có trong mô hình. `PAID → CANCELLED` **cấm** (FR-26 Won’t); `REFUNDED` chỉ là enum. |
| Promotion/LoyaltyTransaction không tràn vào runtime | ✅ Đạt | Có lớp và quan hệ trong class diagram; không tạo endpoint, áp mã/ghi điểm trong activity/sequence (FR-17/18/19 Won’t). |
| SVG mở được | ✅ Đạt kiểm tra định dạng | Đủ 4 ảnh SVG; parser XML và rasterizer CairoSVG đọc thành công. **Chưa kiểm thử bằng PlantUML CLI bản chuẩn ở môi trường này** (không có executable/JAR). Khi checkout PR trong repo, nên chạy lệnh PlantUML dưới đây để có SVG native và kiểm cú pháp. |
| Branch + PR trên `develop-Assignment2` | ⏳ Chưa thực hiện | Môi trường này chỉ cung cấp bộ file, không có bản checkout/quyền push GitHub. Nhóm cần commit/push/merge PR vào nhánh đích. |

## Kiểm tra trước khi merge

- [x] Cả bốn cặp `.puml` và `.svg` có đủ.
- [x] Kiểm trạng thái enum + 8 chuyển hợp lệ (kiểm tra cấu trúc bằng `validate_task2.py`).
- [x] SVG hợp lệ theo XML parser và mở bằng trình kết xuất SVG.
- [x] So khớp nội dung nghiệp vụ SRS + UC-04; không đưa FR Won’t vào luồng checkout.
- [ ] **Cần chạy PlantUML CLI để xác thực cú pháp `.puml` và kết xuất lại SVG native trước merge.**
- [ ] Review và merge PR vào `develop-Assignment2` (chưa thể thực hiện từ bộ file offline).

### Lệnh kiểm nhanh (tại root repo)

```bash
# Có Java và plantuml.jar; ví dụ tải JAR từ nguồn chính thức ở máy của nhóm.
java -jar plantuml.jar -checkonly docs/diagrams/*.puml
java -jar plantuml.jar -tsvg docs/diagrams/*.puml
python validate_task2.py

git checkout develop-Assignment2
git pull
git checkout -b a2/task-2-diagrams
# copy docs/diagrams/{*.puml,*.svg} vào repo
git add docs/diagrams/
git commit -m "docs(a2): add aligned checkout activity sequence class state diagrams"
git push -u origin a2/task-2-diagrams
# Tạo PR với base develop-Assignment2; sau review mới merge.
```

**Ranh giới implementation:** Tài liệu mô hình hóa **không chứng minh** endpoint/ADR đã được triển khai; các kiểm chứng ở bảng này là kiểm chứng thiết kế và tệp sơ đồ.

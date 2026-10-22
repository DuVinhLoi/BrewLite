# Plan: thêm Activity Diagram và Class Diagram theo codebase hiện tại

## Context

`docs/` hiện chỉ có Use Case (2 khối PlantUML) và Sequence (10 khối, kể cả State Machine §2.5 B2). Chưa có:
- **Activity diagram**: `user-sequence-specifications.md:8` và `:1255` ghi "Activity luồng nghiệp vụ theo đề §5" là sơ đồ nộp chính *đang có*, nhưng thực tế chỉ có bản mermaid trong đề (`BrewLite-CongNghePhanMem-fixed.md` §5), không có bản vẽ khớp code.
- **Class diagram**: chưa có ở đâu.

Nguồn vẽ: đề §5, §9.1, §12.2; code `backend/prisma/schema.prisma`, `backend/src/contracts/*.ts`, `backend/src/{order,payment,product,auth,state-machine,prisma,stubs}`, `frontend/src/app/*`, `frontend/src/store/cart.ts`, `frontend/src/lib/session.ts`.

Luật repo: `.claude/rules/doc-code-sync.md` (tài liệu mô tả đúng code; PlantUML render sạch).

**Quyết định đã chốt (người dùng, 2026-10-14, qua grilling 2 vòng):**
1. Hai file riêng: `docs/activity-diagrams.md` (chỉ activity) và `docs/class-diagrams.md` (chỉ class). Mỗi sơ đồ một khối `@startuml` riêng.
2. Activity: 2 sơ đồ, (AD1) đặt món & thanh toán theo đề §5 và (AD2) Barista xử lý hàng đợi.
3. Làn activity mức nghiệp vụ: `Khách hàng | Hệ thống BrewLite | Cổng thanh toán (mock)` (AD2: `Barista / Admin | Hệ thống BrewLite | Cổng thanh toán (mock)`). Endpoint, mã HTTP chỉ ghi bằng `note` tại nút rẽ nhánh.
4. Class: (CD1) domain model + 3 design class diagram (CD2 Đơn & Thanh toán, CD3 Sản phẩm & Kho, CD4 Xác thực).
5. CD1: thuộc tính, quan hệ, bội số, ràng buộc `{unique}`, `{version}`; enum vẽ thành `<<enumeration>>` kèm note "cột DB kiểu String"; không vẽ phương thức.
6. CD2–CD4: chỉ phương thức public, chữ ký rút gọn; CD2 vẽ cả `PrismaXRepo` và `InMemoryXRepo <<test double>>` hiện thực cùng interface, CD3/CD4 ghi stub bằng `note`.
7. Mỗi sơ đồ có A (bối cảnh 2–3 câu), B (PlantUML), C (bảng đối chiếu sang `file:hàm` / endpoint / mã HTTP).
8. Cập nhật rule `doc-code-sync.md`, 2 dòng tham chiếu ở `user-sequence-specifications.md`, README nếu có chỗ liệt kê tài liệu.
9. Branch tích hợp `docs/activity-class-diagrams` từ `develop` (`ef1e923`); hỏi trước khi merge vào `develop`.
10. (Đổi sau grilling, người dùng 2026-10-14) Chạy nhiều sub-agent theo `.claude/rules/multi-agent-workflow.md`, chọn model theo độ khó: Sonnet 5.5 cho việc đọc hiểu luồng / kiến trúc, Haiku 5.5 cho việc sửa cơ học và kiểm đối chiếu. Thay cho quyết định "một người làm" ở Q5.

## Phạm vi

| Có làm | Không làm |
|---|---|
| 2 file tài liệu mới, 6 khối PlantUML | Không sửa code `backend/`, `frontend/` |
| Sửa rule `doc-code-sync.md` (paths + điều kiện cập nhật) | Không sửa đề `BrewLite-CongNghePhanMem-fixed.md` |
| Sửa 2 dòng tham chiếu trong `user-sequence-specifications.md`, README nếu có | Không vẽ activity cho UC14 (Admin tồn kho) hay từng UC |
| Render kiểm từng khối ra thư mục tạm | Không vẽ class diagram cho frontend; không ghi ảnh vào repo |

## Thiết kế

### `docs/activity-diagrams.md`

Đầu file: tiêu đề, phạm vi, quy ước đọc (start/stop, decision, fork, swimlane, note), liên kết tới `use-case-specifications.md` và `user-sequence-specifications.md`.

**AD1. Đặt món & thanh toán (đề §5, UC01–UC07, UC05a)**, làn `Khách hàng | Hệ thống BrewLite | Cổng thanh toán (mock)`:
- Xem menu (`GET /products`, chỉ món còn hàng) → chọn món, size, topping (`GET /products/:id`) → thêm vào giỏ (giỏ lưu phía client, giới hạn dòng / ly theo `store/cart.ts`) → vòng "mua thêm" quay lại menu.
- Xem giỏ & tổng tiền → chưa đăng nhập thì sang đăng nhập/đăng ký, quay lại bằng `?next=`.
- Tạo đơn `PENDING` (`POST /orders`, Idempotency-Key): nhánh hết hàng / lệch version → 409, quay lại giỏ.
- Chọn ví/thẻ, nhập mã giảm giá (UC05a) → `POST /payments`: hệ thống kiểm trạng thái → gọi cổng charge (ngoài transaction).
  - Lỗi → đơn `PAYMENT_FAILED` → khách thử lại (key mới) hoặc hủy (`PATCH /orders/:id` → `CANCELLED`, hoàn kho).
  - Thành công → đơn `PAID`, cộng điểm → biên lai (mã đơn, "+N điểm"), tự làm mới mỗi 3 giây → nhận đồ uống khi `COMPLETED`.
- Thứ tự và nhánh lấy theo code thực (`order.service.ts` `create`, `payment.service.ts` `processPayment`, các trang `cart`, `login`, `PaymentForm`, `PaymentSuccess`), đối chiếu sequence §2.1–§2.6.

**AD2. Barista xử lý hàng đợi (UC08–UC12)**, làn `Barista / Admin | Hệ thống BrewLite | Cổng thanh toán (mock)`:
- Đăng nhập → trang `/barista` → xem hàng đợi (`GET /orders?status=`, mặc định `PAID,PREPARING,READY`).
- Chọn đơn → rẽ theo trạng thái: `PAID → PREPARING → READY → COMPLETED` (`advanceOrder`), chuyển sai trạng thái → 409 theo `OrderStateMachine`.
- Hủy đơn `PAID` (`cancelOrderAs`) → cổng refund (ngoài transaction) → `CANCELLED`, hoàn kho.
- Note: Admin kế thừa Barista (UC Bản 1); khách không tiến đơn được (403).

### `docs/class-diagrams.md`

Đầu file: tiêu đề, phạm vi, quy ước ký hiệu (association, composition, realization `..|>`, dependency `..>`, bội số, stereotype).

**CD1. Domain model (đề §12.2)**: `User`, `Product`, `Order`, `OrderItem`, `Payment` theo `schema.prisma`; quan hệ `User 1 — 0..* Order`, `Order 1 *— 1..* OrderItem`, `OrderItem 0..* — 1 Product`, `Order 1 — 0..* Payment`. Enum `OrderStatus` (7), `Role` (3), `PaymentMethod` (`WALLET`, `CARD`), `PaymentStatus` (`SUCCESS`), `Size` (`S`, `M`, `L`). Note: cột lưu `String`, `toppings` lưu chuỗi JSON, `toRole` quy role lạ về `CUSTOMER`; `Product.version` cho optimistic lock (đề §9 ý 3).

**CD2. Đơn & Thanh toán**: `OrderController`, `PaymentController` (gồm `PATCH /orders/:id`), `OrderService`, `PaymentService`, `OrderStateMachine`, `MockPaymentGatewayService`; interface `IOrderRepository`, `IPaymentRepository`, `IProductRepository`, `IUserRepository`, transaction contract; hiện thực `PrismaOrderRepo`… và `InMemoryOrderRepo`… `<<test double>>`; DTO chính `OrderDto`, `PaymentDto`. Phụ thuộc đi theo constructor injection thực tế.

**CD3. Sản phẩm & Kho**: `ProductController`, `AdminProductController`, `ProductService`, `IProductRepository`, `PrismaProductRepo`, `AdjustStockDto`; note stub.

**CD4. Xác thực**: `AuthController`, `UserController`, `AuthService`, `JwtAuthGuard`, `RolesGuard`, decorator `Roles`, `RegisterDto`, `LoginDto`, `IUserRepository`, `PrismaUserRepo`, `Role`, `Actor`; note stub.

Tên lớp, phương thức, chữ ký lấy trực tiếp từ code; không tự đặt.

### Sửa file có sẵn

- `.claude/rules/doc-code-sync.md`: thêm `docs/activity-diagrams.md`, `docs/class-diagrams.md` vào `paths`; mục "Khi đổi hành vi" thêm: đổi luồng rẽ nhánh / endpoint trong luồng → sửa `activity-diagrams.md`; đổi `schema.prisma`, `contracts/*.ts` hoặc chữ ký public của controller/service/repo → sửa `class-diagrams.md`.
- `docs/user-sequence-specifications.md:8` và `:1255`: trỏ "Activity luồng nghiệp vụ theo đề §5" tới `docs/activity-diagrams.md`, thêm Class diagram `docs/class-diagrams.md` vào danh sách sơ đồ nộp chính.
- `README.md`: thêm 2 dòng nếu README có mục liệt kê tài liệu.

## Điều phối agent

Integrator: phiên chính (Opus 5.5). Handoff (bị ignore, không commit): `docs/superpowers/handoff/2026-10-14-activity-class/` trong từng worktree; ledger ở checkout chính cùng đường dẫn. Công cụ render dùng chung (ngoài repo): `<scratchpad>/puml/render-md.sh <file.md> <out_dir>`, dòng cuối `<n> khối, <e> lỗi`, thoát 1 khi có lỗi.

**Wave 0 (Integrator):** commit plan; tải `plantuml.jar`, viết `render-md.sh`; dựng 3 worktree từ branch tích hợp, chép `graphify-out/` vào từng worktree.

**Wave 1 (song song, mỗi file một chủ):**

| Card | Model | Branch | Worktree | Allowed paths | Commit message |
|---|---|---|---|---|---|
| A – Activity | Sonnet 5.5 | `docs/acd-a` | `../BrewLite-wt/acd-a` | `docs/activity-diagrams.md` (mới) | `docs: add activity diagrams for order-payment and barista flows` |
| C – Class | Sonnet 5.5 | `docs/acd-c` | `../BrewLite-wt/acd-c` | `docs/class-diagrams.md` (mới) | `docs: add domain and design class diagrams` |
| R – Tham chiếu | Haiku 5.5 | `docs/acd-r` | `../BrewLite-wt/acd-r` | `.claude/rules/doc-code-sync.md` (frontmatter `paths`, mục "Khi đổi hành vi"); `docs/user-sequence-specifications.md` (chỉ dòng 8 và dòng "Phạm vi nộp bài" ~1255); `README.md` (chỉ dòng 3) | `docs: reference activity and class diagram files` |

**Wave 2 (sau khi merge A, C, R):** 2 agent Haiku 5.5 kiểm đối chiếu, chỉ đọc, chạy song song trên checkout chính: V-A kiểm `activity-diagrams.md`, V-C kiểm `class-diagrams.md`; mỗi tên lớp / phương thức / endpoint / mã HTTP / trạng thái trên sơ đồ phải grep thấy trong `backend/src`, `frontend/src`, `backend/prisma`. Lỗi tìm được trả về worker gốc (SendMessage) sửa trên branch card, tối đa 3 vòng.

**Integrator:** cổng G1–G6 cho từng card, render cả 6 khối và tự xem ảnh, ghi ledger, hỏi người dùng trước khi merge vào `develop`, sau merge chạy `graphify update .`.

## Các bước

1. Wave 0 như trên.
2. Wave 1: gọi 3 agent trong một message.
3. Cổng G1–G5, merge `--no-ff` từng card vào `docs/activity-class-diagrams`; G6 render.
4. Wave 2: 2 verifier; sửa nếu có.
5. Báo người dùng, chờ đồng ý → merge `--no-ff` vào `develop` → `graphify update .` → dọn worktree.

## Kiểm

- Tải `plantuml.jar` vào scratchpad; tách 6 khối PlantUML của 2 file mới, render `java -jar plantuml.jar -charset UTF-8 -tpng -o <scratchpad>`: đủ 6 ảnh, không ảnh "Syntax Error"; mở xem từng ảnh để đọc được (chữ không chồng, làn đúng).
- Grep tên lớp / phương thức / endpoint trong 2 file mới đều tồn tại trong code (`grep -rn` trong `backend/src`, `frontend/src`).
- `git diff --name-only develop...HEAD` chỉ gồm: 2 file mới, plan này, `.claude/rules/doc-code-sync.md`, `docs/user-sequence-specifications.md`, (`README.md`).
- Không chạy jest/vitest vì không đổi code.

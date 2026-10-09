# HƯỚNG DẪN ĐỌC HIỂU & ĐẶC TẢ CHI TIẾT BIỂU ĐỒ TUẦN TỰ (SEQUENCE DIAGRAM)
## PHÂN HỆ KHÁCH HÀNG, PHA CHẾ & QUẢN TRỊ – DỰ ÁN BREWLITE

> **Dự án:** BrewLite – Ứng dụng đặt cà phê không tiền mặt  
> **Môn học:** Công nghệ Phần mềm (Bài tập lớn 10 Task Agile Scrum)  
> **Phạm vi & Định vị tài liệu:**  
> • **Tài liệu này là Phụ lục chi tiết (Architecture Appendix) cho Developers & AI Agents** dùng để hiểu sâu bối cảnh, đối chiếu mã nguồn và viết test case.  
> • **Bản nộp chính cho giảng viên** tập trung vào các biểu đồ cốt lõi tinh gọn (Use Case tổng quan 16 UC & phân hệ Khách hàng 8 UC: UC01–UC07 + UC05a; Activity luồng nghiệp vụ tổng, và Sequence thanh toán rút gọn).  
> **Đối tượng độc giả:**  
> 1. **Sinh viên & Giảng viên:** Tra cứu chi tiết từng bước, đối chiếu ma trận truy vết (Traceability) với 7 API endpoint tối thiểu (+5 mở rộng) và 10 Task Backlog.  
> 2. **AI Agents / Developers:** Đọc hiểu bối cảnh kiến trúc (Context Navigation), ánh xạ các bước của biểu đồ vào mã nguồn NestJS (Backend) và Next.js (Frontend) để lập trình và viết kiểm thử tự động.

---

# MỤC LỤC

1. [PHẦN I: CẨM NANG ĐỌC HIỂU BIỂU ĐỒ TUẦN TỰ (DÀNH CHO NGƯỜI DÙNG)](#phần-i-cẩm-nang-đọc-hiểu-biểu-đồ-tuần-tự)
   - 1.1 Khái niệm & Mục đích của Sequence Diagram
   - 1.2 Bốn thành phần cốt lõi
   - 1.3 Quy ước các loại đường nối & Mũi tên
   - 1.4 Giải mã các khối điều khiển đặc biệt (`alt`, `opt`, `group`)
2. [PHẦN II: ĐẶC TẢ CHI TIẾT 8 KỊCH BẢN TUẦN TỰ (PLANTUML TỰ NHIÊN)](#phần-ii-đặc-tả-chi-tiết-8-kịch-bản-tuần-tự)
   - 2.1 UC01: Xem menu & Tùy chọn món (Size, Topping)
   - 2.2 UC02: Quản lý giỏ hàng (Thêm/Sửa/Xóa)
   - 2.3 UC03: Đăng ký / Đăng nhập (JWT)
   - 2.4 UC04 + UC05 + UC05a: Tạo đơn hàng (PENDING), Thanh toán không tiền mặt (Ví / Thẻ) & Áp mã giảm giá (Trọng tâm MVP)
   - 2.5 UC06: Hủy đơn / Thử lại thanh toán (Order State Machine)
   - 2.6 UC07: Xem xác nhận & Lịch sử đơn
   - 2.7 UC08–UC12: Quầy pha chế (Barista)
   - 2.8 UC14: Kiểm & điều chỉnh tồn kho món (Admin)
3. [PHẦN III: MA TRẬN NGỮ CẢNH KỸ THUẬT DÀNH CHO AI AGENTS & DEVELOPERS](#phần-iii-ma-trận-ngữ-cảnh-kỹ-thuật)
   - 3.1 Bảng ánh xạ Use Case sang Mã nguồn & CSDL
   - 3.2 Quy tắc điều hướng cho AI Agent khi sinh mã / kiểm thử

---

# PHẦN I: CẨM NANG ĐỌC HIỂU BIỂU ĐỒ TUẦN TỰ

### 1.1 Khái niệm & Mục đích
Biểu đồ Tuần tự (**Sequence Diagram**) là biểu đồ thể hiện **sự tương tác qua lại giữa các đối tượng theo trục thời gian**. Nếu Use Case Diagram trả lời câu hỏi *"Ai làm chức năng gì?"*, thì Sequence Diagram trả lời câu hỏi: *"Để hoàn thành chức năng đó, các bộ phận trong hệ thống phải trao đổi thông điệp với nhau theo thứ tự nào?"*.

### 1.2 Bốn thành phần cốt lõi trên biểu đồ
1. **Tác nhân (Actor):** Con người tương tác trực tiếp với giao diện, **trùng với tác nhân trên biểu đồ Use Case gốc** (`docs/use-case-specifications.md` mục 2): `Khách vãng lai (Guest)` ở UC01–UC03, `Khách hàng thành viên (Customer)` ở UC04–UC07 (Customer kế thừa Guest nên cũng làm được UC01–UC03), `Nhân viên pha chế (Barista)` ở UC08–UC12, `Quản trị viên (Admin)` ở UC14. Cổng thanh toán là tác nhân dịch vụ `Mock Gateway` của UC05 (trừ tiền) và UC06, UC12 (hoàn tiền khi hủy đơn `PAID`).
2. **Đối tượng tham gia (Participants / Lifelines):** Đại diện cho các tầng kiến trúc của BrewLite:
   - `Giao diện Web (Frontend Next.js)`: Nơi người dùng bấm nút, xem dữ liệu.
   - `Máy chủ xử lý (Backend NestJS)`: Nơi tiếp nhận yêu cầu, kiểm tra nghiệp vụ và xử lý logic.
   - `Cơ sở dữ liệu (PostgreSQL qua Prisma)`: Nơi lưu trữ vĩnh viễn đơn hàng, sản phẩm, tài khoản (5 bảng mục 12.2). Task 8-10 cắm qua 4 adapter `PrismaOrder/Product/Payment/UserRepo`; khi chạy backend **bắt buộc có `DATABASE_URL`**: thiếu thì `main.ts` ném lỗi `DATABASE_URL is required` và backend không khởi động (Postgres chạy qua `docker compose up -d db`). Bản In-Memory trên RAM (`backend/src/stubs`) chỉ để jest chạy test độc lập khi không đặt biến này, không dùng để chạy ứng dụng.
   - `Cổng thanh toán (Mock Gateway)`: Đơn vị trung gian xử lý trừ tiền Ví/Thẻ.
3. **Đường gióng thời gian (Lifeline):** Đường thẳng đứng nét đứt chạy dọc từ trên xuống dưới, thể hiện sự tồn tại của đối tượng theo thời gian. **Càng ở phía dưới thì sự kiện diễn ra càng muộn**.
4. **Vạch kích hoạt (Activation Bar):** Hình chữ nhật mỏng nằm đè lên đường nét đứt, thể hiện khoảng thời gian mà đối tượng đó **đang tích cực xử lý công việc** (chưa xong).

### 1.3 Quy ước các loại đường nối & Mũi tên (Cực kỳ quan trọng)

| Loại thông điệp | Hình dáng trên biểu đồ | Cú pháp PlantUML | Ý nghĩa nghiệp vụ |
| :--- | :--- | :--- | :--- |
| **Thông điệp gửi đi (Request / Call)** | **Đường nét liền, mũi tên nhọn (`->`)** | `A -> B : Gửi yêu cầu` | Đối tượng A gửi một yêu cầu sang B và chờ B xử lý. |
| **Thông điệp phản hồi (Response / Return)** | **Đường nét đứt, mũi tên hở (`-->`)** | `B --> A : Trả kết quả` | Đối tượng B đã xử lý xong và gửi kết quả về cho A. |
| **Xử lý nội bộ (Self-Call)** | **Mũi tên uốn vòng lại chính nó** | `A -> A : Tự tính toán` | Đối tượng tự thực hiện một logic của chính mình (ví dụ: tự so sánh mật khẩu, tự cộng tiền). |

### 1.4 Giải mã các khối điều khiển đặc biệt (Combined Fragments)

* **Khối `alt` (Alternatives – Tương đương `IF - ELSE`):**
  - **Ý nghĩa:** Dùng khi gặp một ngã rẽ có **hai kịch bản loại trừ lẫn nhau (chỉ xảy ra 1 trong 2)**.
  - **Cách đọc:** Nửa trên là trường hợp xảy ra khi điều kiện đúng (ví dụ: Mật khẩu đúng), nửa dưới sau vạch chia `else` là trường hợp xảy ra khi điều kiện sai (ví dụ: Mật khẩu sai).
* **Khối `opt` (Option – Tương đương `IF` đơn lẻ, không có `ELSE`):**
  - **Ý nghĩa:** Dùng cho hành động **tùy chọn (làm cũng được, không làm cũng không sao)**.
  - **Cách đọc:** Nếu người dùng thỏa mãn điều kiện thì thực hiện các bước trong hộp `opt`, nếu không có thì hệ thống bỏ qua và chạy thẳng xuống dưới (ví dụ: Áp mã giảm giá).
* **Khối `group` (Giao dịch an toàn / Transaction):**
  - **Ý nghĩa:** Đánh dấu một chuỗi nhiều thao tác ghi vào CSDL bắt buộc phải **cùng thành công 100% hoặc cùng hủy bỏ (All or Nothing)** để tránh lỗi hệ thống (ví dụ: Đổi trạng thái đơn VÀ trừ kho VÀ cộng điểm).

---

# PHẦN II: ĐẶC TẢ CHI TIẾT 8 KỊCH BẢN TUẦN TỰ

**Đồng bộ với biểu đồ Use Case gốc** (`docs/use-case-specifications.md` mục 2, Bản 1): mỗi UC thuộc đúng một sơ đồ dưới đây, cùng mã, cùng tên, cùng tác nhân. UC04, UC05, UC05a chạy trong cùng một lần bấm "Xác nhận trả" nên chung sơ đồ §2.4; UC08–UC12 chung sơ đồ §2.7 (8 sơ đồ cho 14 UC đã hiện thực; UC13, UC15 chưa hiện thực nên chưa có sơ đồ).

| UC (biểu đồ gốc) | Tác nhân | Quan hệ trên biểu đồ gốc | Sơ đồ tuần tự |
| :--- | :--- | :--- | :--- |
| UC01: Xem menu & Tùy chọn món (Size, Topping) | Guest | `Guest --- UC01` | §2.1 |
| UC02: Quản lý giỏ hàng (Thêm/Sửa/Xóa) | Guest | `Guest --- UC02` | §2.2 |
| UC03: Đăng ký / Đăng nhập (JWT) | Guest | `Guest --- UC03` | §2.3 |
| UC04: Tạo đơn hàng (PENDING) | Customer | `Customer --- UC04` (độc lập, không `<<include>>`) | §2.4 bước 2a |
| UC05: Thanh toán không tiền mặt (Ví / Thẻ) | Customer, Mock Gateway | `Customer --- UC05`, `UC05 --- Gateway` | §2.4 bước 2b |
| UC05a: Áp mã giảm giá | Customer (qua UC05) | `UC05a ..> UC05 : <<extend>>` | §2.4 bước 1 (khối `opt`) |
| UC06: Hủy đơn / Thử lại thanh toán | Customer, Mock Gateway | `Customer --- UC06`, `UC06 --- Gateway` (hoàn tiền) | §2.5 |
| UC07: Xem xác nhận & Lịch sử đơn | Customer | `Customer --- UC07` | §2.6 |
| UC08: Xem hàng đợi đơn (PAID / PREPARING / READY) | Barista | `Barista --- UC08` | §2.7 |
| UC09: Tiếp nhận pha chế (PAID -> PREPARING) | Barista | `Barista --- UC09` | §2.7 |
| UC10: Báo xong pha chế (PREPARING -> READY) | Barista | `Barista --- UC10` | §2.7 |
| UC11: Xác nhận giao nước (READY -> COMPLETED) | Barista | `Barista --- UC11` | §2.7 |
| UC12: Hủy đơn do hết nguyên liệu (PAID -> CANCELLED) | Barista, Mock Gateway | `Barista --- UC12`, `UC12 --- Gateway` (hoàn tiền) | §2.7 |
| UC14: Kiểm & điều chỉnh tồn kho món | Admin | `Admin --- UC14` | §2.8 |

---

### 2.1 UC01: Xem menu & Tùy chọn món (Size, Topping)

#### A. Bối cảnh nghiệp vụ
Khách hàng truy cập trang chủ của ứng dụng BrewLite. Hệ thống cần lấy danh mục các món đồ uống đang có sẵn để hiển thị kèm giá và hình ảnh. Khi khách chọn một món, khách có thể chọn kích cỡ (S/M/L) hoặc Topping; giao diện sẽ tự động tính lại tổng tiền tạm tính mà không cần phải gọi lại máy chủ.

#### B. Sơ đồ tuần tự (PlantUML)
```plantuml
@startuml
skinparam DefaultFontColor #1f2937
skinparam ArrowColor #5b6b8c
skinparam SequenceParticipantBackgroundColor #eef2fb
skinparam SequenceParticipantBorderColor #5b6b8c
skinparam SequenceLifeLineBorderColor #5b6b8c

autonumber
actor "Khách vãng lai\n(Guest)" as User
participant "Giao diện Web\n(Frontend)" as FE
participant "Máy chủ xử lý\n(Backend)" as BE
database "Cơ sở dữ liệu" as DB

User -> FE : Mở trang Thực đơn (Menu)
activate FE

FE -> BE : Yêu cầu lấy danh sách đồ uống
activate BE

BE -> DB : Tra cứu các món đang còn bán trong kho
activate DB
DB --> BE : Trả về thông tin các món (Tên, giá, hình ảnh)
deactivate DB

BE --> FE : Gửi danh sách đồ uống về giao diện
note right of FE : Đang tải: skeleton loading.\nLỗi mạng / HTTP lỗi: hiện lỗi + nút "Thử lại";\ndanh sách rỗng: hiện "Chưa có món nào".\nChỉ khi chưa cấu hình NEXT_PUBLIC_API_URL\nmới dùng menu mẫu + banner
deactivate BE

FE --> User : Hiển thị danh sách đồ uống lên màn hình
User -> FE : Bấm chọn món (Cappuccino) và chọn Size L, thêm Trân châu
FE -> FE : Tự động tính toán lại số tiền tạm tính trên máy khách
FE --> User : Cập nhật giá mới tức thời (giá gốc 45.000đ + 10.000 Size L\n+ 5.000 Trân châu = 60.000đ; modal mở sẵn Size M = 50.000đ)
deactivate FE
@enduml
```

#### C. Bảng đối chiếu kỹ thuật cho AI Agent
* **Backend Endpoint:** `GET /products`. `GET /products/:id` có ở backend (404 khi không có) nhưng giao diện chưa gọi: modal chi tiết dùng dữ liệu món đã có trong danh sách. Đã chốt (2026-10-09): `ProductDetailModal` là "màn hình chi tiết" của Task 4; wireframe đề §7 chỉ để tham khảo nên không cần trang riêng.
* **Controller / Service:** `ProductController.list()` / `detail()` $\rightarrow$ `ProductService.listAvailable()` / `getById()`
* **Thực thể CSDL:** Bảng `Product` (lọc điều kiện `stock > 0`)
* **Xử lý Frontend:** Quản lý state hiển thị bằng React State (`useState` + `fetch`), không dùng React Query.
* **Lỗi / rỗng / menu mẫu:** `getProducts()` (`frontend/src/lib/api.ts`) đọc `NEXT_PUBLIC_API_URL` lúc gọi. **Chưa cấu hình** → trả `MOCK_PRODUCTS` kèm `fromMock: true` (không gọi mạng, `ProductGrid` hiện banner "menu mẫu"; dùng để demo UI không cần backend). **Đã cấu hình** (compose luôn set) → lỗi mạng / HTTP lỗi **ném `Error`** (`MenuPage` bắt, `ProductGrid` hiện thông báo lỗi + nút "Thử lại"), danh sách rỗng trả `[]` (hiện "Chưa có món nào"); không còn rơi về menu mẫu vì khách sẽ thêm được món có id không có trong DB. Test: `frontend/src/lib/api.test.ts`.
* **Size / Topping:** `ProductDto` (`id, name, price, imageUrl, stock, version`) **không** chứa size/topping. Bảng giá cố định nằm ở `frontend/src/lib/pricing.ts` (tính tạm trên máy khách) và bản sao `backend/src/order/pricing.ts` (server tính lại khi `POST /orders`): S +0, M +5.000 (mặc định), L +10.000; Trân châu 5.000, Kem cheese 8.000, Thạch cà phê 6.000. Sửa bảng giá phải sửa cả 2 file.

---

### 2.2 UC02: Quản lý giỏ hàng (Thêm/Sửa/Xóa)

#### A. Bối cảnh nghiệp vụ
Theo yêu cầu Task 5 trong tài liệu đồ án, giỏ hàng được quản lý hoàn toàn ở phía máy khách (Client-side State) để mang lại trải nghiệm mượt mà tức thì cho khách hàng. Các thao tác thêm món, tăng/giảm số lượng hoặc xóa món được tính toán tự động và lưu tạm vào bộ nhớ trình duyệt (LocalStorage).

#### B. Sơ đồ tuần tự (PlantUML)
```plantuml
@startuml
skinparam DefaultFontColor #1f2937
skinparam ArrowColor #5b6b8c
skinparam SequenceParticipantBackgroundColor #eef2fb
skinparam SequenceParticipantBorderColor #5b6b8c
skinparam SequenceLifeLineBorderColor #5b6b8c

autonumber
actor "Khách vãng lai\n(Guest)" as User
participant "Màn hình đặt món\n(Giao diện)" as UI
participant "Bộ nhớ giỏ hàng\n(Lưu tạm trên máy)" as Cart

== THÊM MÓN ==
User -> UI : Bấm "Thêm vào giỏ" (size M, không topping)\nhoặc chọn size/topping/số lượng trong modal rồi bấm "Thêm vào giỏ"
activate UI
UI -> Cart : Lưu món đã chọn (kèm size, topping, số lượng)
activate Cart

Cart -> Cart : Gộp dòng cùng khóa productId|size|topping,\nchặn số lượng vượt tồn kho, tính lại tổng tiền
Cart --> UI : Cập nhật số lượng trên biểu tượng Giỏ hàng
deactivate Cart

UI --> User : Nút đổi thành "Đã thêm ✓" trong 1,2 giây\n(thêm từ modal thì modal đóng lại)
deactivate UI

== SỬA SỐ LƯỢNG ==
User -> UI : Mở giỏ hàng và bấm tăng/giảm (+ / -) số lượng
activate UI
UI -> Cart : Cập nhật số lượng mới cho món đó (tối thiểu 1, nút - mờ khi còn 1)
activate Cart
Cart -> Cart : Tính lại tổng tiền giỏ hàng tức thời
Cart --> UI : Trả về tổng tiền mới
deactivate Cart
UI --> User : Cập nhật lại số tiền hiển thị trên màn hình
deactivate UI

== XÓA MÓN ==
User -> UI : Bấm "Xóa" ở một dòng (hoặc "Xóa hết")
activate UI
UI -> Cart : Bỏ dòng đó (hoặc làm rỗng giỏ)
activate Cart
Cart -> Cart : Tính lại tổng tiền và số ly
Cart --> UI : Trả về giỏ mới
deactivate Cart
UI --> User : Cập nhật danh sách; giỏ rỗng thì hiện "Giỏ hàng trống"
deactivate UI
@enduml
```

#### C. Bảng đối chiếu kỹ thuật cho AI Agent
* **Công nghệ Frontend:** Zustand store `useCart` (`frontend/src/store/cart.ts`), bảng giá ở `frontend/src/lib/pricing.ts`. Test: `frontend/src/store/cart.test.ts`.
* **Cơ chế lưu trữ:** middleware `persist` ghi vào `window.localStorage` key `brewlite-cart` để F5 không bị mất giỏ hàng.
* **Cấu trúc dữ liệu:** `CartItem { key, productId, name, imageUrl?, size, toppings: [], quantity, unitPrice, lineTotal }`, với `key = productId|size|topping (đã sắp xếp)`: cùng key thì gộp số lượng, khác size/topping thì tách dòng.
* **Tồn kho:** `addItem` chặn số lượng vượt `product.stock` và bỏ qua món hết hàng; tăng số lượng trong giỏ (`updateQty`) chỉ giữ tối thiểu 1, không chặn theo tồn kho, nên vượt kho thì đến lúc thanh toán backend trả 409 (§2.4).

---

### 2.3 UC03: Đăng ký / Đăng nhập (JWT)

#### A. Bối cảnh nghiệp vụ
UC03 gồm 2 luồng tách biệt trên cùng trang `/login` (nút chuyển chế độ Đăng nhập / Đăng ký):
1. **Luồng Đăng ký (tùy chọn, chạy trước Đăng nhập):** `POST /auth/register`. Máy chủ tra email; **trùng email → 409** "Email already registered". Chưa có thì băm mật khẩu bằng bcrypt, lưu tài khoản mới (`loyaltyPoints = 0`) và trả `{ id, email }` — **không** cấp token. Giao diện chuyển về form Đăng nhập để khách tự đăng nhập.
2. **Luồng Đăng nhập:** máy chủ tra cứu tài khoản trong cơ sở dữ liệu và kiểm tra mật khẩu đã được mã hóa an toàn (bằng bcrypt).
* **Khối `alt` của luồng Đăng nhập:**
  - **Nhánh 1 (Thất bại):** Nếu mật khẩu sai $\rightarrow$ Báo lỗi và dừng lại.
  - **Nhánh 2 (Thành công):** Nếu mật khẩu đúng $\rightarrow$ Máy chủ phát một mã khóa phiên làm việc dạng Token (JWT) để trình duyệt lưu lại. Khách hàng chính thức trở thành Thành viên. Giao diện đọc `role` trong token để điều hướng: khách về `/`, tài khoản quầy về `/barista`, quản trị về `/admin`.

#### B. Sơ đồ tuần tự (PlantUML)
```plantuml
@startuml
skinparam DefaultFontColor #1f2937
skinparam ArrowColor #5b6b8c
skinparam SequenceParticipantBackgroundColor #eef2fb
skinparam SequenceParticipantBorderColor #5b6b8c
skinparam SequenceLifeLineBorderColor #5b6b8c

autonumber
actor "Khách vãng lai\n(Guest)" as User
participant "Giao diện Web\n(Frontend)" as FE
participant "Máy chủ xử lý\n(Backend)" as BE
database "Cơ sở dữ liệu" as DB

== LUỒNG 1: ĐĂNG KÝ (TÙY CHỌN, TRƯỚC KHI ĐĂNG NHẬP) ==
opt Khách chưa có tài khoản
    User -> FE : Chọn "Đăng ký", nhập Email, Mật khẩu (>= 6 ký tự)
    activate FE
    FE -> BE : POST /auth/register { email, password }
    activate BE
    note right of BE : Email sai định dạng / mật khẩu < 6 ký tự\n-> 400 (ValidationPipe), dừng trước khi tra DB
    BE -> DB : Tìm tài khoản theo Email
    activate DB
    DB --> BE : Kết quả tra cứu
    deactivate DB
    alt Email đã tồn tại
        BE --> FE : 409 "Email already registered"
        FE --> User : Hiển thị lỗi email đã được đăng ký
    else Email chưa tồn tại
        BE -> BE : Băm mật khẩu (bcrypt)
        BE -> DB : Lưu tài khoản mới (loyaltyPoints = 0)
        BE --> FE : 201 { id, email } (không cấp token)
        FE --> User : Chuyển về form Đăng nhập
    end
    deactivate BE
    deactivate FE
end

== LUỒNG 2: ĐĂNG NHẬP ==
User -> FE : Nhập Email, Mật khẩu -> Bấm "Đăng nhập"
activate FE
FE -> BE : POST /auth/login { email, password }
activate BE
note right of BE : Email sai định dạng -> 400 (ValidationPipe)

BE -> DB : Tìm kiếm tài khoản theo Email
activate DB
DB --> BE : Trả về thông tin tài khoản và mật khẩu đã mã hóa (hoặc không có)
deactivate DB

BE -> BE : Kiểm tra đối chiếu mật khẩu người dùng nhập (bcrypt.compare)

alt Không có tài khoản, hoặc mật khẩu KHÔNG chính xác (Kịch bản thất bại)
    BE --> FE : Báo lỗi 401 "Invalid credentials" (giống nhau cho sai mật khẩu và sai email để chống đoán tài khoản)
    FE --> User : Hiển thị thông báo đăng nhập thất bại
else Mật khẩu chính xác (Kịch bản thành công)
    BE -> BE : Tạo mã phiên đăng nhập an toàn (Token JWT { sub, email, role }, hạn 7 ngày)
    BE --> FE : 200 { accessToken, user: { id, email, role } }
    FE -> FE : Lưu mã Token vào localStorage (key "brewlite-token")
    FE --> User : Điều hướng theo role trong JWT: CUSTOMER -> / (Thực đơn),\nBARISTA -> /barista, ADMIN -> /admin
end
deactivate BE
deactivate FE
@enduml
```

#### C. Bảng đối chiếu kỹ thuật cho AI Agent
* **Backend Endpoint:** `POST /auth/register` (luồng 1, trả 201 `{ id, email }`, trùng email 409) và `POST /auth/login` (luồng 2, trả 200 `{ accessToken, user }`)
* **Controller / Service:** `AuthController.register()` / `login()` $\rightarrow$ `AuthService.register()` / `login()`
* **Validate đầu vào:** `RegisterDto` (`@IsEmail`, mật khẩu `@MinLength(6)`), `LoginDto` (`@IsEmail`).
* **Bảo mật:** đăng ký `bcrypt.hash(password, 10)`; đăng nhập `bcrypt.compare(plainPassword, user.passwordHash)`
* **Mã phiên JWT:** Cấp chuỗi Bearer Token chứa `{ sub: user.id, email: user.email, role }` có thời hạn hết hạn (`expiresIn`); đăng nhập trả `{ accessToken, user: { id, email, role } }`.
* **Vai trò (`User.role`):** `CUSTOMER` (mặc định) / `BARISTA` / `ADMIN`. Đăng ký công khai luôn tạo `CUSTOMER`; tài khoản quầy và quản trị chỉ có từ seed (`barista@brewlite.vn`, `admin@brewlite.vn`). `JwtAuthGuard` đưa `role` vào `req.user` (token cũ thiếu `role` coi là `CUSTOMER`), `RolesGuard` + `@Roles(...)` chặn theo vai trò (403). Giao diện chỉ đọc `role` từ JWT để điều hướng (`/` khách, `/barista`, `/admin`), quyền thật do backend chặn.

---

### 2.4 UC04 + UC05 + UC05a: Tạo đơn hàng (PENDING), Thanh toán không tiền mặt (Ví / Thẻ) & Áp mã giảm giá

#### A. Bối cảnh nghiệp vụ
Đây là **trọng tâm nghiệp vụ lớn nhất của dự án BrewLite** (Bao gồm Task 6, 8 và 10):
1. **Bước 1 (UC05a - Khối `opt`):** Trên màn Thanh toán, khách có mã giảm giá (`BREWLITE10`) thì nhập mã để giao diện tính giảm trừ tạm (hành động tùy chọn). Mã này được gửi kèm yêu cầu thanh toán để máy chủ xác thực và tính lại nội bộ (không tạo thêm endpoint hay bảng ngoài đề bài).
2. **Bước 2 (UC04 + UC05 - bấm "Xác nhận trả"):** Một lần bấm chạy **liền 2 lời gọi**: `POST /orders` rồi ngay sau đó `POST /payments`. Nghĩa là đơn chỉ được tạo **sau** bước áp voucher, không có bước tạo đơn riêng trước màn thanh toán.
   - **`POST /orders` (UC04):** Gửi giỏ (`productId, quantity, size, toppings`) kèm token JWT; thiếu/sai token → 401. **Máy chủ tự tính giá**: `unitPrice = product.price + phụ thu size + tổng giá topping` theo `backend/src/order/pricing.ts`, giá client gửi lên bị bỏ qua. Thiếu size → mặc định `M`; topping lạ (kể cả tên trùng khóa prototype như `constructor`) → 400; sản phẩm lạ → 404. Giới hạn đầu vào: tối đa 20 dòng, mỗi dòng `quantity` từ 1 đến 99 (DTO, 400); tổng đơn vượt Int32 (2147483647, cột `total` là `Int`) → 400 `Order total too large`. Đơn lưu ở `PENDING`.
   - **`POST /payments` (UC05):** Khách chọn Ví/Thẻ. Mỗi lần bấm sinh một **Idempotency-Key** mới. Voucher và số tiền tính lại trên `order.total` của server.
   - **Thử lại sau khi lỗi:** giao diện đã giữ `orderId` của đơn vừa tạo nên lần bấm tiếp theo **chỉ gọi `POST /payments`** với `orderId` cũ và key mới (UC06 KB1), không tạo đơn mới.
3. **Xử lý trong `POST /payments`** (thứ tự cố định: **guard → validate → khóa → chủ đơn → cache → kiểm trạng thái → charge**):
   - **Validate (trước khóa):** body sai `CreatePaymentDto` (`orderId` phải là chuỗi, `paymentMethod` thuộc `WALLET` | `CARD`) → 400 (ValidationPipe); thiếu header `Idempotency-Key` → 400 `Missing Idempotency-Key`. Giao diện luôn gửi đủ nên hai lỗi này chỉ gặp khi gọi API tay.
   - **Xác thực & phân quyền (chạy trước mọi nhánh):** `JwtAuthGuard` — thiếu/sai token → 401, dừng ngay. Sau khi vào khóa, `processPayment()` **đọc đơn trước khi xét trùng lặp**: đơn không có → 404, `order.userId !== req.user.id` → 403. Bước này chạy **trước** nhánh Cache Hit nên người lạ không thanh toán hộ được và không đọc được biên lai của người khác bằng key; nếu key trỏ tới biên lai của đơn khác (`dto.orderId`) thì đơn đó cũng phải là của người gọi, nếu không → 403.
   - **Tuần tự hóa request song song:** request cùng Idempotency-Key, hoặc khác key nhưng cùng đơn, phải xếp hàng chờ nhau (khóa trong tiến trình theo key + `orderId`). Request đến sau đọc lại biên lai/trạng thái mới nên chỉ trừ tiền 1 lần.
   - **Nhánh Trùng lặp (Cache Hit):** Nếu khóa đã tồn tại trong CSDL $\rightarrow$ trả về kết quả cũ đã lưu (HTTP 200), **tuyệt đối không gọi lại Cổng thanh toán để tránh trừ tiền 2 lần**.
   - **Nhánh Mới (Cache Miss):** Tính voucher trên `order.total`. Kiểm trạng thái trước khi gọi cổng: đơn không ở `PENDING` / `PAYMENT_FAILED` (ví dụ đã `PAID` mà gửi key mới) → `assertTransition` ném 400, không trừ tiền; đơn `PAYMENT_FAILED` thì chuyển về `PENDING` trước (UC06 KB1). Rồi gọi Cổng thanh toán trừ tiền. Trừ tiền lỗi → đơn sang `PAYMENT_FAILED`, trả 400. Trừ tiền thành công → `assertTransition('PENDING' -> 'PAID')` rồi **mọi lệnh ghi sau charge nằm trong 1 `runInTransaction`**: trừ kho (Optimistic Locking, thử lại 3 lần mỗi món), đổi đơn sang `PAID`, cộng điểm tích lũy, lưu biên lai. **Mọi lỗi** trong transaction sau charge → rollback (phần kho đã trừ tự hủy) + hoàn đúng số đã thu + đơn sang `PAYMENT_FAILED` rồi ném lại lỗi gốc: kẹt kho trả 409, sản phẩm không còn trả 404, lỗi DB hoặc lỗi khác trả 500. Nhờ vậy thử lại bằng key mới không bị trừ tiền lần 2.

#### B. Sơ đồ tuần tự (PlantUML)
```plantuml
@startuml
skinparam DefaultFontColor #1f2937
skinparam ArrowColor #5b6b8c
skinparam SequenceParticipantBackgroundColor #eef2fb
skinparam SequenceParticipantBorderColor #5b6b8c
skinparam SequenceLifeLineBorderColor #5b6b8c
skinparam NoteBackgroundColor #fef3c7
skinparam NoteBorderColor #d97706
skinparam NoteFontColor #1f2937

autonumber
actor "Khách hàng thành viên\n(Customer)" as User
participant "Giao diện Web\n(Frontend)" as FE
participant "Máy chủ xử lý\n(Backend)" as BE
database "PostgreSQL\n(qua Prisma)" as DB
participant "Cổng thanh toán\n(Mock Gateway)" as Gateway

User -> FE : Tôi muốn thanh toán giỏ hàng này
activate FE
FE --> User : Mở màn Thanh toán (chưa tạo đơn)
deactivate FE

== BƯỚC 1: ÁP MÃ GIẢM GIÁ (UC05a - TÙY CHỌN EXTEND) ==
opt Khách hàng có mã khuyến mãi
    User -> FE : Tôi có mã "BREWLITE10", áp giúp tôi nhé
    activate FE
    FE -> FE : Tự kiểm tra mã và tính lại tiền còn phải trả (tạm tính)
    FE --> User : Trừ 10% rồi nhé, còn phải trả 110.700đ
    deactivate FE
end

== BƯỚC 2a: TẠO ĐƠN HÀNG (UC04) - CHẠY KHI BẤM "XÁC NHẬN TRẢ" ==
User -> FE : Tôi chọn trả bằng ví, bấm "Xác nhận trả"
activate FE
opt Chưa có đơn (lần bấm đầu; lần thử lại đã giữ orderId thì bỏ qua)
    FE -> BE : POST /orders (giỏ hàng: món, số lượng, size, topping)
    note right of FE #fef3c7 : Gửi kèm token đăng nhập.\nLỗi ở bước này (thiếu/sai token 401, 400, 404) thì dừng:\nkhông gọi POST /payments, lần bấm sau tạo đơn lại
    activate BE
    BE -> DB : Tra giá gốc từng món
    activate DB
    DB --> BE : Giá gốc các món
    deactivate DB
    BE -> BE : Tự tính giá: giá gốc + phụ thu size\n+ topping (bỏ qua giá client gửi)
    note right of BE #fef3c7 : Thiếu size -> M\nGiỏ rỗng hoặc > 20 dòng, quantity ngoài 1..99,\nsize ngoài S/M/L -> 400 (DTO)\nTopping lạ -> 400, món lạ -> 404\nTổng đơn > 2147483647 -> 400
    BE -> DB : Lưu đơn mới, đơn đang chờ thanh toán (PENDING)
    activate DB
    DB --> BE : Xong rồi, đơn số #1042 đây nhé
    deactivate DB
    BE --> FE : 201 Tạo đơn thành công, mã đơn là #1042
    deactivate BE
end

== BƯỚC 2b: THANH TOÁN KHÔNG TIỀN MẶT (UC05) - GỌI NGAY SAU 2a ==
FE -> BE : POST /payments: thanh toán đơn #1042 bằng ví
note right of FE #fef3c7 : Gửi kèm Idempotency-Key MỚI cho mỗi lần bấm\nvà mã giảm giá (nếu có)
activate BE

alt Thiếu/sai token (JwtAuthGuard)
    BE --> FE : 401 Chưa đăng nhập / token sai hoặc hết hạn
    note right of BE #fef3c7 : Trả lỗi và DỪNG tại đây,\ngiỏ hàng giữ nguyên
else Token hợp lệ
    note right of BE #fef3c7 : Body sai DTO / thiếu header Idempotency-Key\n-> 400, dừng trước khi vào khóa
    BE -> BE : Xếp hàng theo khóa trong tiến trình\n(theo Idempotency-Key, rồi theo orderId)
    note right of BE #fef3c7 : Request song song cùng key\nhoặc cùng đơn phải chờ nhau,\nrequest sau đọc lại kết quả mới

    alt Không phải chủ đơn (đọc đơn trước khi xét trùng lặp)
        BE --> FE : 404 Không có đơn / 403 Không phải đơn của bạn
        note right of BE #fef3c7 : Người lạ không thanh toán hộ, cũng không\nđọc được biên lai của người khác bằng key;\nnếu key trỏ biên lai của đơn khác thì\nđơn đó cũng phải của người gọi, nếu không -> 403
    else Đúng chủ đơn
        BE -> DB : Kiểm tra giúp xem mã giao dịch này đã dùng chưa
        note right of DB #fef3c7 : Tìm đúng 1 biên lai theo mã,\nkhóa này là duy nhất trong bảng
        activate DB
        DB --> BE : Đây là kết quả kiểm tra mã giao dịch
        deactivate DB

        alt Đơn này đã thu tiền rồi (Yêu cầu trùng lặp - Idempotent Cache Hit)
            BE --> FE : Đơn này trả rồi nhé, gửi lại kết quả cũ, không thu thêm
            note right of BE #fef3c7 : Trả HTTP 200, tuyệt đối\nkhông gọi lại cổng thanh toán
            FE --> User : Đơn của bạn đã thanh toán rồi, đây là biên lai nhé
        else Đây là lần thanh toán đầu tiên (Cache Miss)
            note over BE #fef3c7
                Tự kiểm tra mã "BREWLITE10" trong máy:
                đúng mã thì trừ floor(10% x tổng đơn server), sai thì thôi
            end note
            BE -> BE : Tự kiểm tra mã giảm giá và tính tiền còn lại
            BE -> BE : Kiểm trạng thái đơn: chỉ PENDING / PAYMENT_FAILED được trả
            note right of BE #fef3c7 : Đơn đã PAID / PREPARING / ... mà gửi key mới\n-> assertTransition ném 400, không gọi cổng thanh toán
            opt Đơn đang PAYMENT_FAILED (thử lại, UC06 KB1)
                BE -> DB : Đưa đơn về PENDING (assertTransition PAYMENT_FAILED -> PENDING)
            end

            BE -> Gateway : Nhờ trừ giúp tiền của khách qua ví nhé
            activate Gateway

            alt Trừ tiền thất bại
                Gateway --> BE : Trừ tiền thất bại rồi nhé
                BE -> BE : Tự chuyển đơn sang thanh toán lỗi
                BE -> DB : Lưu giúp đơn sang trạng thái thanh toán lỗi nhé
                BE --> FE : 400 Thanh toán lỗi rồi, giỏ hàng giữ nguyên nhé
                FE -> FE : Giữ orderId #1042 để lần thử lại\nchỉ gọi POST /payments (key mới)
                FE --> User : Thẻ/ví lỗi rồi, bạn thử lại nhé (giỏ vẫn còn)
            else Trừ tiền thành công
                Gateway --> BE : Trừ tiền thành công rồi nhé
                BE -> BE : Tự kiểm tra xem đơn có được chuyển\ntừ chờ thanh toán sang đã thanh toán không

                group 1 DB transaction (runInTransaction): thiếu một là rollback hết
                    BE -> DB : Trừ giúp tồn kho các món trong đơn nhé
                    note over BE, DB #fef3c7
                        Mỗi món trừ theo kiểu "đúng phiên bản mới trừ":
                        sai phiên bản hoặc hết hàng thì không trừ.
                        Kẹt thì thử lại 3 lần, vẫn kẹt thì ném 409
                        -> cả transaction rollback
                    end note
                    BE -> DB : Đổi giúp đơn #1042 sang đã thanh toán nhé
                    BE -> DB : Cộng giúp điểm tích lũy cho khách nhé
                    BE -> DB : Lưu giúp biên lai thanh toán kèm mã chống thu trùng nhé
                end

                alt Lỗi trong transaction, đã rollback (kẹt kho 409 / món mất 404 / lỗi DB 500)
                    BE -> Gateway : Hoàn lại đúng số vừa trừ (refund)
                    BE -> DB : Lưu đơn sang thanh toán lỗi (PAYMENT_FAILED)
                    BE --> FE : Ném lại lỗi gốc: 409 / 404 / 500
                    note right of BE #fef3c7 : Nếu chính bước hoàn tiền hoặc ghi PAYMENT_FAILED lỗi\nthì bỏ qua (chưa có sổ đối soát)
                    FE -> FE : Giữ orderId #1042 để thử lại
                    FE --> User : 409: "Món đã hết hàng, tiền đã được hoàn lại";\nmã khác: "Thanh toán thất bại (mã ...)" (giỏ vẫn còn)
                else Transaction thành công
                    BE --> FE : Thanh toán xong rồi nhé, đơn #1042 đã được trả tiền
                    note right of BE #fef3c7 : Trả HTTP 201 cho lần thanh toán đầu tiên
                    FE --> User : Xong rồi, mời bạn xem biên lai đơn #1042 nhé
                end
            end
            deactivate Gateway
        end
    end
end
deactivate BE
deactivate FE
@enduml
```

#### C. Bảng đối chiếu kỹ thuật cho AI Agent
* **Backend Endpoints:**
  - Tạo đơn: `POST /orders` (Body: `items[] { productId, quantity, size?, toppings? }`, Header: `Bearer JWT`)
  - Thanh toán: `POST /payments` (Body: `{ orderId, paymentMethod, voucherCode? }`, Header: `Idempotency-Key: <UUID>`, `Bearer JWT`)
* **Thứ tự gọi ở Frontend:** `PaymentForm` → `ApiPaymentGateway.pay()` gọi `POST /orders` rồi `POST /payments` trong cùng một lần bấm "Xác nhận trả". Lỗi sau khi đơn đã tạo ném `PaymentError` mang `orderId`; `PaymentForm` giữ `orderId` đó, lần thử lại chỉ gọi `POST /payments` với key mới (`newIdempotencyKey()` mỗi lần bấm).
* Tạo đơn yêu cầu Bearer JWT, thiếu token trả 401 (khớp Task 7). `POST /payments` cũng gắn `@UseGuards(JwtAuthGuard)` (thiếu/sai token → 401) và `PaymentController.pay()` truyền `req.user.id` vào `PaymentService.processPayment(userId, dto, key)`. FE (`ApiPaymentGateway`) gửi `Authorization: Bearer <brewlite-token>` cho cả `/orders` lẫn `/payments`; 401/403 ném `PaymentError` mang `orderId`. Lỗi khác cũng ném `PaymentError` mang `orderId` với câu tiếng Việt lấy từ `message` của body JSON (không hiện JSON thô): 400 "Thanh toán thất bại…" (message dạng mảng của validate thì nối lại), 409 "Món đã hết hàng, tiền đã được hoàn lại", mã khác kèm mã và thông điệp backend; body không phải JSON thì chỉ báo mã. Giỏ hàng luôn được giữ nguyên.
* **Chỉ chủ đơn mới thanh toán được:** trong khóa `order:<orderId>`, `processPayment()` đọc đơn trước: không có → 404, `order.userId !== userId` → 403 (`ForbiddenException`, giống `cancelOrderAs()` khi khách hủy đơn của người khác). Bước này chạy **trước** nhánh cache `Idempotency-Key` nên người lạ không đọc được biên lai của người khác bằng key; nếu key trỏ tới biên lai của đơn khác `dto.orderId` thì đơn đó cũng phải là của người gọi, nếu không trả 403.
* **Giá do server tính (`OrderService.create()`):** `unitPrice = product.price + SIZE_UPCHARGE[size] + Σ TOPPING_PRICES` (`backend/src/order/pricing.ts`), `total = Σ quantity × unitPrice`. DTO không có trường `unitPrice`; FE (`ApiPaymentGateway.createOrderId()`) chỉ gửi `{ productId, quantity, size, toppings }` cho mỗi dòng, không gửi `unitPrice` / `name` / `key` / `lineTotal` (có test); `ValidationPipe({ whitelist: true })` vẫn là lớp chặn thứ hai. Thiếu `size` → `M`; topping ngoài bảng → 400 (so bằng `hasOwnProperty`, nên tên trùng khóa prototype như `constructor` cũng bị chặn, không ra `unitPrice` NaN); `productId` lạ → 404. DTO giới hạn tối đa 20 dòng (`@ArrayMaxSize`) và `quantity` 1–99 (`@Max(99)`); tổng đơn vượt Int32 → 400 `Order total too large` (nếu không, Postgres ném 500).
* **Tuần tự hóa song song:** `PaymentService.processPayment()` bọc xử lý trong `withLock('key:<Idempotency-Key>')` rồi `withLock('order:<orderId>')`; `cancelOrder()` / `advanceOrder()` dùng chung khóa `order:<orderId>`. Đây là khóa trong tiến trình, chỉ đúng khi chạy 1 instance backend (như compose hiện tại).
* **Xác thực Voucher:** Validate nội bộ trong `PaymentService` theo cấu hình chiết khấu (Task 10), không tạo thêm endpoint riêng cho voucher.
* **Chống trừ tiền trùng (Idempotent Test Criteria b):** Tra đúng 1 biên lai theo mã (`Payment` tìm theo `idempotencyKey` duy nhất). Nhánh Hit trả 200 OK kết quả cũ (kèm đúng discount/points đã lưu), nhánh Miss mới gọi Gateway. Chỉ lần trả **thành công** mới lưu biên lai theo key; key của lần trả lỗi không được cache, vì vậy FE luôn sinh key mới cho mỗi lần thử lại.
* **Kiểm soát tồn kho đồng thời (Concurrency Test Criteria c):** Trừ kho nguyên tử bằng lệnh `updateMany` kèm điều kiện `version` khớp và `stock >= số lượng` (sai là không trừ), thử lại 3 lần rồi vẫn kẹt thì ném 409.
* **Transaction sau charge:** Trừ kho + `PAID` + cộng điểm + lưu biên lai chạy trong `orders.runInTransaction(tx => ...)` (Prisma: `$transaction`; In-Memory: snapshot/rollback tuần tự trong `in-memory-tx.ts`). Lỗi bất kỳ trong transaction (kẹt kho 409, `NotFoundException` khi sản phẩm mất, lỗi DB…) → rollback, rồi **ngoài transaction**: `gateway.refund(order.id, finalAmount)` + đơn sang `PAYMENT_FAILED` (`assertTransition(PENDING → PAYMENT_FAILED)`) + ném lại đúng lỗi gốc. Nếu chính bước bù lỗi (hoàn tiền hoặc ghi trạng thái) thì bỏ qua, chưa có sổ đối soát (ghi chú `ponytail:` trong `payment.service.ts`).
* **State Machine (Test Criteria a):** Thực thi `assertTransition('PENDING' -> 'PAID')` trước khi lưu vào CSDL.
* **Chọn kho dữ liệu:** Chạy thật bắt buộc có `DATABASE_URL` (thiếu thì `main.ts` ném lỗi, backend không khởi động) và cắm 4 adapter Prisma (Postgres thật). Bản In-Memory chỉ dành cho jest: không đặt `DATABASE_URL` thì các module chọn bản này. Logic `PaymentService` giữ nguyên.

---

### 2.5 UC06: Hủy đơn / Thử lại thanh toán

#### A. Bối cảnh nghiệp vụ
Phục vụ máy trạng thái **Order State Machine** tại Mục 9.1 tài liệu môn học (`BrewLite-CongNghePhanMem-fixed.md` §9.1).
* Khối `alt` mô tả 3 kịch bản của UC06 (`POST /payments` để thử lại, `PATCH /orders/:id` để hủy). Sơ đồ trạng thái B2 bên dưới vẽ đủ 9 chuyển tiếp của đề §9.1 và ghi từng chuyển do thao tác nào kích hoạt (khách hay Barista):
  - **Kịch bản 1 (Thử lại):** Khi cổng thanh toán báo trừ tiền lỗi, đơn hàng ở trạng thái `PAYMENT_FAILED`. Màn Thanh toán vẫn mở và giữ `orderId` của đơn lỗi; khách bấm lại "Xác nhận trả" (giao diện không có nút "Thử lại" riêng, trang `/history` cũng không thanh toán lại được), hệ thống chuyển đơn về `PENDING` (`PAYMENT_FAILED` $\rightarrow$ `PENDING`) rồi trừ tiền lại như lần đầu.
  - **Kịch bản 2 (Khách hủy đơn chưa trả):** Khi đơn hàng chưa thanh toán, khách có quyền hủy đơn (`PENDING` $\rightarrow$ `CANCELLED`; `PAYMENT_FAILED` $\rightarrow$ `CANCELLED` cũng hợp lệ).
  - **Kịch bản 3 (Hủy đơn đã thanh toán - Hoàn tiền):** Khi đơn đã trả tiền (`PAID`) và khách yêu cầu hủy kịp thời, hệ thống hủy đơn kèm hoàn tiền + hoàn kho (`PAID` $\rightarrow$ `CANCELLED`, mũi tên "hủy" từ `PAID` của đề §9.1).
* **Hiện trạng code cho KB2/KB3:**
  - **Frontend có nút "Hủy đơn" ở `/history`** cho đơn `PENDING` / `PAYMENT_FAILED` / `PAID` (helper `cancelOrder()` trong `frontend/src/lib/api.ts`): gọi `PATCH /orders/:id { status: 'CANCELLED' }` kèm Bearer JWT, đơn `PAID` hỏi xác nhận (có hoàn tiền) trước khi gọi, lỗi 400/403 hiện ngay dưới thẻ đơn, thành công thì tải lại danh sách. Màn biên lai không có nút này.
  - **Khách chỉ hủy được đơn CỦA MÌNH:** `PaymentService.cancelOrderAs(actor, id)` so `order.userId` với user trong token khi `actor.role = CUSTOMER`; khác chủ → 403, đơn không tồn tại → 404. Khách **không** tự tiến đơn: `PREPARING` / `READY` / `COMPLETED` chỉ BARISTA/ADMIN (khách 403, xem §2.7).
  - **Thanh tiến trình:** `/history` và màn biên lai hiện **thanh 5 bước** `Chờ thanh toán → Đã thanh toán → Đang pha → Sẵn sàng → Hoàn tất` (component `OrderStatusTrack`; `Thanh toán lỗi` đỏ, `Đã hủy` xám). Khách chỉ xem; các bước `Đang pha → Sẵn sàng → Hoàn tất` do Barista bấm ở `/barista` (UC09–UC11, §2.7).
  - Barista hủy đơn hết nguyên liệu: UC12, xem §2.7.

#### B. Sơ đồ tuần tự (PlantUML)
```plantuml
@startuml
skinparam DefaultFontColor #1f2937
skinparam ArrowColor #5b6b8c
skinparam SequenceParticipantBackgroundColor #eef2fb
skinparam SequenceParticipantBorderColor #5b6b8c
skinparam SequenceLifeLineBorderColor #5b6b8c

autonumber
actor "Khách hàng thành viên\n(Customer)" as User
participant "Giao diện Web\n(Frontend)" as FE
participant "Máy chủ xử lý\n(Backend)" as BE
database "Cơ sở dữ liệu" as DB
participant "Cổng thanh toán\n(Mock Gateway)" as Gateway

alt Kịch bản 1: Thử thanh toán lại (Khi bị lỗi trừ tiền, 1 bước duy nhất)
    User -> FE : Bấm lại "Xác nhận trả" ngay trên màn Thanh toán\n(form vẫn mở, đang giữ orderId của đơn lỗi)
    activate FE
    FE -> BE : POST /payments (orderId cũ đã giữ, Idempotency-Key MỚI, phương thức mới)
    note right of FE : Không gọi lại POST /orders
    activate BE
    note right of BE : Vẫn chạy guard -> khóa -> chủ đơn -> cache như §2.4\n(key mới nên đi nhánh Cache Miss)
    BE -> BE : assertTransition(from: PAYMENT_FAILED, to: PENDING)
    BE -> DB : Cập nhật trạng thái đơn về "Chờ thanh toán (PENDING)"
    BE -> Gateway : Trừ tiền lại từ đầu (đi tiếp như nhánh Cache Miss của UC05)
    BE -> DB : 1 transaction: trừ kho, đổi đơn sang PAID, cộng điểm, lưu biên lai mới
    BE --> FE : Thanh toán lại thành công (201 Created, biên lai mới)
    note right of BE : Trừ tiền lỗi lần nữa -> PAYMENT_FAILED + 400;\nlỗi trong transaction -> hoàn tiền + PAYMENT_FAILED (như §2.4)
    deactivate BE
    FE --> User : Hiển thị biên lai mới (giỏ được xóa sau khi trả thành công)
    deactivate FE

else Kịch bản 2: Chủ đơn hủy đơn chưa thanh toán (PENDING / PAYMENT_FAILED -> CANCELLED)
    User -> FE : Bấm nút "Hủy đơn" ở trang Lịch sử
    activate FE
    FE -> BE : PATCH /orders/1042 { status: 'CANCELLED' } + Bearer JWT
    activate BE
    BE -> BE : Kiểm tra chủ đơn (khác chủ -> 403, không có đơn -> 404)
    BE -> BE : assertTransition(from: PENDING | PAYMENT_FAILED, to: CANCELLED)
    BE -> DB : Cập nhật trạng thái đơn thành "CANCELLED" (chưa thu tiền nên không hoàn tiền, không đụng kho)
    BE --> FE : Xác nhận hủy đơn thành công (200 OK)
    deactivate BE
    FE --> User : Tải lại danh sách, đơn hiện trạng thái CANCELLED
    note right of FE : Lỗi 400/403 từ backend\nhiện ngay dưới thẻ đơn
    deactivate FE

else Kịch bản 3: Chủ đơn hủy đơn đã thanh toán (PAID -> CANCELLED / Hoàn tiền)
    User -> FE : Bấm nút "Hủy đơn" ở trang Lịch sử
    activate FE
    FE --> User : Hộp thoại xác nhận: hủy sẽ hoàn tiền + hoàn kho
    User -> FE : Đồng ý hủy
    FE -> BE : PATCH /orders/1042 { status: 'CANCELLED' } + Bearer JWT
    activate BE
    BE -> BE : Kiểm tra chủ đơn (khác chủ -> 403, không có đơn -> 404)
    BE -> BE : assertTransition(from: PAID, to: CANCELLED)
    BE -> DB : Đọc mọi biên lai SUCCESS của đơn (số tiền thực thu)
    BE -> Gateway : Hoàn đúng số thực thu (Refund), NGOÀI transaction
    activate Gateway
    Gateway --> BE : Phản hồi: Hoàn tiền THÀNH CÔNG
    deactivate Gateway
    group 1 DB transaction: lỗi giữa chừng thì rollback, đơn vẫn PAID
        BE -> DB : Hoàn lại tồn kho mọi món
        BE -> DB : Đổi trạng thái đơn thành "CANCELLED"
    end
    note right of BE : Giới hạn: transaction lỗi sau khi đã hoàn tiền thì đơn vẫn PAID,\nhủy lại sẽ hoàn tiền lần 2. Điểm thưởng đã cộng không bị thu hồi.
    BE --> FE : Xác nhận hủy và hoàn tiền thành công (200 OK)
    deactivate BE
    FE --> User : Tải lại danh sách, đơn hiện trạng thái CANCELLED
    deactivate FE
end
@enduml
```

#### B2. Sơ đồ trạng thái đơn hàng (PlantUML, đề §9.1)
Đúng **9 chuyển tiếp** của sơ đồ §9.1; `COMPLETED` và `CANCELLED` là trạng thái cuối. Mỗi mũi tên ghi chuyển trạng thái do thao tác nào kích hoạt. Bảng này khớp `ALLOWED` trong `backend/src/state-machine/order-state.machine.ts` và `TRANSITIONS` trong `frontend/src/lib/order-status.ts` (test `order-status.test.ts` đọc thẳng file backend để so).

```plantuml
@startuml
skinparam DefaultFontColor #1f2937
skinparam ArrowColor #5b6b8c
skinparam StateBackgroundColor #eef2fb
skinparam StateBorderColor #5b6b8c
skinparam NoteBackgroundColor #fef3c7
skinparam NoteBorderColor #d97706

title Order State Machine (đề §9.1): 9 chuyển tiếp

state PENDING
state PAID
state PREPARING
state READY
state COMPLETED #d8ebe0
state PAYMENT_FAILED #fbe4e4
state CANCELLED #e0e0e0

PENDING : Chờ thanh toán
PAID : Đã thanh toán
PREPARING : Đang pha
READY : Sẵn sàng
COMPLETED : Hoàn tất
PAYMENT_FAILED : Thanh toán lỗi
CANCELLED : Đã hủy

[*] --> PENDING : POST /orders
PENDING --> PAID : POST /payments thành công
PENDING --> PAYMENT_FAILED : POST /payments lỗi\n(trừ tiền lỗi, hoặc ghi DB lỗi\nsau khi trừ: đã hoàn tiền)
PAYMENT_FAILED --> PENDING : POST /payments thử lại\n(Idempotency-Key mới)
PENDING --> CANCELLED : nút "Hủy đơn"
PAYMENT_FAILED --> CANCELLED : nút "Hủy đơn"
PAID --> CANCELLED : khách hủy (UC06) / Barista hủy hết nguyên liệu (UC12)\n(hoàn tiền + hoàn kho)
PAID --> PREPARING : Barista: Nhận pha (UC09)
PREPARING --> READY : Barista: Pha xong (UC10)
READY --> COMPLETED : Barista: Đã giao (UC11)
COMPLETED --> [*]
CANCELLED --> [*]

note right of PREPARING
  Từ PREPARING trở đi không còn hủy được:
  assertTransition ném 400 (nút Hủy ẩn,
  backend vẫn chặn nếu gọi tay).
end note
@enduml
```

#### C. Bảng đối chiếu kỹ thuật cho AI Agent
* **Backend Endpoints:**
  - `POST /payments` (gửi lại yêu cầu thanh toán khi thử lại)
  - `PATCH /orders/:id` (Bearer JWT; khách chỉ gửi `{ status: 'CANCELLED' }` để hủy đơn của mình; `PREPARING` / `READY` / `COMPLETED` chỉ BARISTA/ADMIN, khách bị 403, xem §2.7; có thể gọi qua màn `/barista` hoặc `scripts/demo-state-machine.sh`)
* **Controller / Service:** `PaymentController.update()` (route `PATCH /orders/:id` đang nằm ở `PaymentController`) $\rightarrow$ `PaymentService.cancelOrderAs(actor, id)` khi `status = CANCELLED`, ngược lại `PaymentService.advanceOrder(actor, id, status)` (`actor = { id, role }` lấy từ JWT). `cancelOrderAs` kiểm tra chủ đơn với khách (403/404); `advanceOrder` từ chối khách (403, chỉ BARISTA/ADMIN, xem §2.7). Cả hai chạy dưới khóa `order:<orderId>`.
* **Frontend:** nút "Hủy đơn" ở `frontend/src/app/history/page.tsx` (hiện khi `canCancel(status)` trong `lib/order-status.ts`: `PENDING` / `PAYMENT_FAILED` / `PAID`) → `cancelOrder(orderId, token)` trong `frontend/src/lib/api.ts` (test `api.test.ts`). 401/403/404 ánh xạ thành thông báo tiếng Việt; 400 "Invalid transition A -> B" dịch thành câu tiếng Việt theo nhãn trạng thái, thông điệp 400 khác giữ nguyên. `advanceOrder(orderId, status, token)` (cùng `patchOrderStatus`, cùng `PATCH /orders/:id`) chỉ do màn `/barista` gọi (§2.7), `/history` không có nút tiến đơn. Bảng chuyển trạng thái FE (`TRANSITIONS`), nhãn, `nextStatus`, `statusTrack` nằm ở `frontend/src/lib/order-status.ts`; test `order-status.test.ts` ghim đúng 9 mũi tên §9.1 và đọc thẳng `ALLOWED` của backend để 2 bên không lệch.
* **Quy tắc State Machine (Task 10):**
  - `assertTransition('PAYMENT_FAILED' -> 'PENDING')`: Hợp lệ.
  - `assertTransition('PENDING' -> 'CANCELLED')`, `assertTransition('PAYMENT_FAILED' -> 'CANCELLED')`: Hợp lệ.
  - `assertTransition('PAID' -> 'CANCELLED')`: Hợp lệ cho khách chủ đơn (UC06 KB3) và cho BARISTA/ADMIN (UC12, §2.7) (kèm nghiệp vụ hoàn đúng số tiền thực thu — cộng mọi biên lai `SUCCESS` của đơn; không có biên lai thì chưa thu đồng nào nên **không gọi hoàn tiền**, không hoàn theo `order.total` — và hoàn lại tồn kho; refund gọi cổng ngoài trước, rồi hoàn kho mọi món + `CANCELLED` nằm trong 1 `runInTransaction` — lỗi giữa chừng thì rollback, đơn vẫn `PAID` và kho không bị hoàn dở. Giới hạn: refund nằm ngoài transaction nên nếu transaction lỗi sau refund thì tiền đã hoàn mà đơn vẫn `PAID`, hủy lại sẽ hoàn lần 2; điểm thưởng đã cộng lúc thanh toán không bị thu hồi).
  - `assertTransition('PAID' -> 'PREPARING')`, `assertTransition('PREPARING' -> 'READY')`, `assertTransition('READY' -> 'COMPLETED')`: Hợp lệ (UC09–UC11, `PaymentService.advanceOrder(actor, …)`, chỉ BARISTA/ADMIN, khách 403); nhảy cóc (`PAID -> READY`) hay đi lùi bị 400.
  - `assertTransition('PREPARING' -> 'CANCELLED')`: **Không hợp lệ** (Bị chặn ném lỗi 400 Bad Request vì barista đang pha chế, kể cả khi người gọi là BARISTA/ADMIN).
  - `COMPLETED` và `CANCELLED` là trạng thái cuối: mọi chuyển đi từ chúng đều bị 400 (tiêu chí (a) của đề: có test chứng minh chặn chuyển sai; `backend/src/state-machine/order-state.machine.spec.ts`, `backend/test/order-advance.spec.ts`).

---

### 2.6 UC07: Xem xác nhận & Lịch sử đơn

#### A. Bối cảnh nghiệp vụ
Tương ứng Task 9 trong đề tài:
1. **Phần 1 (Biên lai ngay sau khi đặt):** Được kích hoạt **ngay lập tức khi `POST /payments` ở UC05 trả về thành công (HTTP 201)**, không gọi thêm API. Giỏ hàng được xóa rỗng, màn `PaymentSuccess` hiện "Đặt hàng thành công", mã đơn (`#` + 8 ký tự đầu của mã đơn), thanh 5 bước đang ở "Đã thanh toán", số tiền đã trả + phương thức, lời nhắn "Mời tới quầy lấy nước" và nút "Về trang chủ" (khớp Wireframe 5).
2. **Phần 2 (Xem lại lịch sử):** Khi khách bấm "Lịch sử" trên thanh điều hướng, trang `/history` gọi `GET /orders/me` để hiển thị toàn bộ các đơn, ngày đặt, món và trạng thái hiện tại (đủ 7 trạng thái: thanh 5 bước cho `PENDING` → `COMPLETED`, nhãn đỏ `PAYMENT_FAILED`, nhãn xám `CANCELLED`) kèm nút "Hủy đơn" của UC06. Chưa đăng nhập thì trang chỉ báo "Bạn chưa đăng nhập", không gọi API.

#### B. Sơ đồ tuần tự (PlantUML)
```plantuml
@startuml
skinparam DefaultFontColor #1f2937
skinparam ArrowColor #5b6b8c
skinparam SequenceParticipantBackgroundColor #eef2fb
skinparam SequenceParticipantBorderColor #5b6b8c
skinparam SequenceLifeLineBorderColor #5b6b8c

autonumber
actor "Khách hàng thành viên\n(Customer)" as User
participant "Giao diện Web\n(Frontend)" as FE
participant "Máy chủ xử lý\n(Backend)" as BE
database "Cơ sở dữ liệu" as DB

== PHẦN 1: MÀN HÌNH XÁC NHẬN (LIÊN KẾT TRỰC TIẾP SAU KHI THANH TOÁN UC05) ==
BE --> FE : 201 thanh toán thành công (orderId, amount)
FE -> FE : Xóa rỗng giỏ hàng
FE --> User : Hiển thị màn hình biên lai xác nhận:\n- Mã đơn: #1042 (8 ký tự đầu của mã đơn)\n- Trạng thái: thanh 5 bước, đang ở "Đã thanh toán"\n- Đã trả: số tiền + phương thức\n- Lời nhắn: "Mời tới quầy lấy nước"

== PHẦN 2: XEM LỊCH SỬ CÁC ĐƠN HÀNG ĐÃ MUA ==
User -> FE : Bấm vào mục "Lịch sử"
activate FE
alt Chưa đăng nhập (không có token "brewlite-token")
    FE --> User : "Bạn chưa đăng nhập" + link Đăng nhập (không gọi API)
else Có token
    FE -> BE : GET /orders/me + Bearer JWT
    activate BE
    alt Token sai / hết hạn
        BE --> FE : 401 Unauthorized
        FE --> User : "Không tải được lịch sử: ..."
    else Token hợp lệ
        BE -> DB : Tra cứu toàn bộ các đơn của userId kèm món (mới nhất lên đầu)
        activate DB
        DB --> BE : Danh sách đơn ở mọi trạng thái
        deactivate DB
        BE --> FE : 200 danh sách lịch sử đơn
        FE --> User : Danh sách đơn + thanh tiến trình (rỗng thì "Chưa có đơn hàng nào")
    end
    deactivate BE
end
deactivate FE
@enduml
```

#### C. Bảng đối chiếu kỹ thuật cho AI Agent
* **Backend Endpoint:** `GET /orders/me` (Được bảo vệ bởi `@UseGuards(JwtAuthGuard)`)
* **Controller / Service:** `OrderController.mine()` $\rightarrow$ `OrderService.listMine()` $\rightarrow$ `findByUserId()` (mới-nhất-trước)
* **Truy vấn CSDL:** `SELECT * FROM "Order" WHERE "userId" = :userId ORDER BY "createdAt" DESC`, kèm `OrderItem` của từng đơn (Prisma `include: { items: true }`). Frontend sắp lại mới-nhất-trước một lần nữa.
* **Frontend:** biên lai `frontend/src/components/PaymentSuccess.tsx` (gọi từ `frontend/src/app/cart/page.tsx`), lịch sử `frontend/src/app/history/page.tsx`, thanh tiến trình `OrderStatusTrack` (test `OrderStatusTrack.test.ts`, `order-status.test.ts`). Test backend: `backend/test/order-product.spec.ts` (`listMine returns newest-first`).
* **Giao diện Wireframe:** Khớp với Wireframe (5) Xác nhận tại Mục 7 tài liệu môn học.

---

### 2.7 UC08–UC12: Quầy pha chế (Barista)

#### A. Bối cảnh nghiệp vụ
Phân hệ Pha chế là **mở rộng ngoài đề §3.2** nhưng **có trên biểu đồ Use Case gốc (Bản 1)**: Barista vận hành quầy theo Order State Machine §9.1 thay vì để khách tự bấm các bước. Đăng nhập tài khoản demo `barista@brewlite.vn` / `barista1234` thì giao diện tự điều hướng tới `/barista` (đọc `role` từ JWT). Đây là tài khoản demo do `backend/prisma/seed.ts` tạo; seed chạy lại mỗi lần container backend khởi động nên mật khẩu bị đặt lại về giá trị này (xem README, mục "Lưu ý bảo mật").
1. **UC08 (Xem hàng đợi đơn):** `GET /orders?status=PAID,PREPARING,READY` hiện 3 cột `Chờ pha` | `Đang pha` | `Sẵn sàng`, đơn cũ trước (FIFO), mỗi dòng món kèm tên món. Trang tự tải lại mỗi 5 giây (polling).
2. **UC09 / UC10 / UC11:** nút **Nhận pha** (`PAID -> PREPARING`), **Pha xong** (`PREPARING -> READY`), **Đã giao** (`READY -> COMPLETED`); mỗi lần bấm là một `PATCH /orders/:id`.
3. **UC12 (Hủy đơn do hết nguyên liệu):** nút **Hủy (hết nguyên liệu)** chỉ có ở cột `Chờ pha` (đơn `PAID`) và có hộp xác nhận. Backend hoàn đúng số tiền thực thu qua Mock Gateway trước (ngoài transaction), rồi hoàn kho các món và đặt `CANCELLED` trong 1 transaction. Quầy **không** hủy được đơn chưa trả (`PENDING` / `PAYMENT_FAILED` → 403 `Staff can only cancel paid orders`); từ `PREPARING` trở đi `assertTransition` chặn bằng 400.
4. **Phân quyền:** khách gọi các endpoint của quầy bị 403; khách cũng không tự tiến đơn qua `PATCH /orders/:id`.

#### B. Sơ đồ tuần tự (PlantUML)
```plantuml
@startuml
skinparam DefaultFontColor #1f2937
skinparam ArrowColor #5b6b8c
skinparam SequenceParticipantBackgroundColor #eef2fb
skinparam SequenceParticipantBorderColor #5b6b8c
skinparam SequenceLifeLineBorderColor #5b6b8c

autonumber
actor "Nhân viên pha chế\n(Barista)" as User
participant "Giao diện Web\n(Frontend /barista)" as FE
participant "Máy chủ xử lý\n(Backend)" as BE
database "Cơ sở dữ liệu" as DB
participant "Cổng thanh toán\n(Mock Gateway)" as Gateway

== UC08: Xem hàng đợi đơn (tự tải lại mỗi 5 giây) ==
User -> FE : Mở trang Quầy (đăng nhập barista@brewlite.vn)
activate FE
note right of FE : role trong JWT không phải BARISTA/ADMIN\n-> chỉ hiện "Trang này dành cho tài khoản quầy", không gọi API
loop Mỗi 5 giây (POLL_MS), dừng khi gặp 401/403
    FE -> BE : GET /orders?status=PAID,PREPARING,READY + Bearer JWT
    activate BE
    alt Thiếu/sai token (401) hoặc không phải BARISTA/ADMIN (403, RolesGuard)
        BE --> FE : 401 / 403
        FE --> User : Báo đăng nhập lại / cần tài khoản quầy, ngừng tự tải lại
    else BARISTA / ADMIN
        BE -> DB : Đơn PAID / PREPARING / READY, cũ trước + tên món
        activate DB
        DB --> BE : Danh sách đơn
        deactivate DB
        BE --> FE : 200 hàng đợi
        FE --> User : 3 cột: Chờ pha | Đang pha | Sẵn sàng
    end
    deactivate BE
end
deactivate FE

== UC09 / UC10 / UC11: Nhận pha -> Pha xong -> Đã giao ==
User -> FE : Bấm "Nhận pha" (rồi "Pha xong", "Đã giao")
activate FE
FE -> BE : PATCH /orders/:id { status: PREPARING | READY | COMPLETED }
activate BE
alt Không phải BARISTA/ADMIN
    BE --> FE : 403 Only staff can advance orders
else Không có đơn
    BE --> FE : 404 Order not found
else Sai thứ tự (assertTransition, ví dụ PAID -> READY)
    BE --> FE : 400 Invalid transition
else Hợp lệ (dưới khóa order:<id>)
    BE -> DB : Cập nhật trạng thái đơn
    BE --> FE : 200 đơn mới
    FE -> BE : GET /orders?status=PAID,PREPARING,READY (tải lại ngay)
    FE --> User : Đơn chuyển sang cột kế tiếp
end
note right of FE : Lỗi 403 / 404 / 400 hiện câu tiếng Việt ở đầu trang
deactivate BE
deactivate FE

== UC12: Hủy đơn do hết nguyên liệu (chỉ cột Chờ pha) ==
User -> FE : Bấm "Hủy (hết nguyên liệu)" và xác nhận
activate FE
FE -> BE : PATCH /orders/:id { status: CANCELLED }
activate BE
alt Không có đơn
    BE --> FE : 404 Order not found
else Đơn chưa trả (PENDING / PAYMENT_FAILED)
    BE --> FE : 403 Staff can only cancel paid orders
else Từ PREPARING trở đi, hoặc đơn đã kết thúc (assertTransition)
    BE --> FE : 400 Invalid transition
else Đơn PAID (dưới khóa order:<id>)
    BE -> DB : Đọc mọi biên lai SUCCESS của đơn (số tiền thực thu)
    BE -> Gateway : Hoàn đúng số tiền thực thu, NGOÀI transaction
    activate Gateway
    Gateway --> BE : Hoàn tiền thành công
    deactivate Gateway
    group 1 DB transaction: lỗi giữa chừng thì rollback, đơn vẫn PAID
        BE -> DB : Hoàn kho mọi món
        BE -> DB : Đổi đơn sang CANCELLED
    end
    BE --> FE : 200 đơn đã hủy
    FE -> BE : GET /orders?status=PAID,PREPARING,READY (tải lại ngay)
    FE --> User : Đơn rời hàng đợi
end
note right of BE : Giới hạn như UC06 KB3: transaction lỗi sau khi đã hoàn tiền\nthì đơn vẫn PAID (hủy lại sẽ hoàn lần 2); điểm thưởng không bị thu hồi
deactivate BE
deactivate FE
@enduml
```

#### C. Bảng đối chiếu kỹ thuật cho AI Agent
* **Backend Endpoints:**
  - UC08: `GET /orders?status=PAID,PREPARING,READY` (Bearer JWT, chỉ BARISTA/ADMIN; bỏ `status` thì mặc định cả ba trạng thái; trạng thái ngoài ba cột hoặc không có thật → 400).
  - UC09–UC12: `PATCH /orders/:id` với `{ status: 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED' }`.
* **Controller / Service:** `OrderController.queue()` $\rightarrow$ `OrderService.listQueue()` $\rightarrow$ `findByStatuses()` (cũ-nhất-trước, thêm `productName` cho từng dòng món). `PaymentController.update()` (route `PATCH /orders/:id`, truyền `actor = { id, role }`) $\rightarrow$ `PaymentService.advanceOrder(actor, id, status)` (UC09–UC11) hoặc `PaymentService.cancelOrderAs(actor, id)` (UC12).
* **Phân quyền:** `JwtAuthGuard` đưa `role` trong JWT vào `req.user`; `RolesGuard` + `@Roles(BARISTA, ADMIN)` chặn khách ở `GET /orders` (403 `Insufficient role`). `PATCH /orders/:id` kiểm vai trò trong service: `advanceOrder` ném 403 `Only staff can advance orders` cho khách; `cancelOrderAs` cho khách chỉ hủy đơn của mình, còn BARISTA/ADMIN chỉ hủy được đơn `PAID` (`PENDING` / `PAYMENT_FAILED` → 403 `Staff can only cancel paid orders`).
* **State Machine:** mọi lần đổi trạng thái đi qua `assertTransition()`: nhảy cóc, đi lùi hoặc hủy từ `PREPARING` trở đi đều 400. `advanceOrder` và `cancelOrder` chạy dưới khóa `order:<orderId>`.
* **Hủy hết nguyên liệu (UC12):** `cancelOrderAs()` $\rightarrow$ `cancelOrder()`: `gateway.refund` đúng số thực thu (cộng mọi biên lai `SUCCESS` của đơn; không có biên lai thì không gọi hoàn tiền), rồi 1 `runInTransaction` { hoàn kho mọi món + `CANCELLED` }. Giới hạn như UC06 KB3: refund nằm ngoài transaction.
* **Frontend:** `frontend/src/app/barista/page.tsx` (3 cột bằng `groupQueue()`, nhãn nút `ACTION_LABEL`, polling `POLL_MS = 5000`); `fetchQueue()` trong `frontend/src/lib/barista.ts`; `advanceOrder()` / `cancelOrder()` trong `frontend/src/lib/api.ts`. Sau đăng nhập, `roleFromToken()` / `homeFor()` (`frontend/src/lib/auth.ts`) điều hướng `CUSTOMER` → `/`, `BARISTA` → `/barista`, `ADMIN` → `/admin`; giao diện chỉ ẩn/hiện, quyền thật do backend chặn.
* **Test:** `backend/test/barista-queue.spec.ts`, `backend/test/roles.spec.ts`, `backend/test/order-advance.spec.ts`; `frontend/src/lib/barista.test.ts`, `frontend/src/lib/auth.test.ts`, `frontend/src/lib/api.test.ts` (`advanceOrder` / `cancelOrder`).

---

### 2.8 UC14: Kiểm & điều chỉnh tồn kho món (Admin)

#### A. Bối cảnh nghiệp vụ
UC14 là **mở rộng ngoài đề §3.2** nhưng **có trên biểu đồ Use Case gốc (Bản 1)**. Admin đăng nhập tài khoản demo `admin@brewlite.vn` / `admin1234` (seed tạo lại mỗi lần container backend khởi động, như §2.7), giao diện tự điều hướng tới `/admin`: bảng mọi món **kể cả món `stock = 0`**, kèm nhãn `Hết hàng` / `Sắp hết` (`stock` ≤ 3) / `Còn hàng`. Admin chỉnh `Product.stock` bằng nút `−1` / `+1` / `+10` (mode `delta`) hoặc nhập số rồi `Lưu` (mode `set`).
* **Chỉ chỉnh tồn kho món:** không có bảng nguyên liệu, không thêm/sửa/xóa món (UC13 là backlog) và không có voucher (UC15 là backlog).
* **Khóa lạc quan:** mỗi lần gửi kèm `version` đang thấy. Nếu trong lúc đó có đơn vừa trừ kho hoặc người khác vừa sửa thì backend trả 409, giao diện tải lại bảng và báo thử lại trên số mới. Kết quả âm hoặc vượt giới hạn `Int` 32-bit thì 400.
* **Seed đặt lại kho:** `seed.ts` đặt lại tồn kho 4 món về 10 (`version = 1`) mỗi lần container backend khởi động, nên số Admin đã chỉnh chỉ giữ tới lần khởi động lại.
* **Liên hệ UC01:** `GET /products` của khách vẫn lọc `stock > 0`, nên món Admin đặt về 0 biến mất khỏi menu và hiện lại khi Admin cộng kho.

#### B. Sơ đồ tuần tự (PlantUML)
```plantuml
@startuml
skinparam DefaultFontColor #1f2937
skinparam ArrowColor #5b6b8c
skinparam SequenceParticipantBackgroundColor #eef2fb
skinparam SequenceParticipantBorderColor #5b6b8c
skinparam SequenceLifeLineBorderColor #5b6b8c

autonumber
actor "Quản trị viên\n(Admin)" as User
participant "Giao diện Web\n(Frontend /admin)" as FE
participant "Máy chủ xử lý\n(Backend)" as BE
database "Cơ sở dữ liệu" as DB

User -> FE : Mở trang Kho (đăng nhập admin@brewlite.vn)
activate FE
note right of FE : role trong JWT không phải ADMIN\n-> chỉ hiện "Trang này dành cho quản trị", không gọi API
FE -> BE : GET /admin/products + Bearer JWT
activate BE
alt Thiếu/sai token (401) hoặc không phải ADMIN (403, RolesGuard)
  BE --> FE : 401 / 403
  FE --> User : Báo đăng nhập lại / cần tài khoản quản trị
else ADMIN
  BE -> DB : Mọi món, kể cả stock = 0, sắp theo tên
  DB --> BE : Danh sách món (stock, version)
  BE --> FE : 200
  FE --> User : Bảng tồn kho + nhãn Hết hàng / Sắp hết / Còn hàng
end
deactivate BE
deactivate FE

User -> FE : Bấm "+10" (hoặc nhập số rồi "Lưu")
activate FE
FE -> BE : PATCH /admin/products/:id/stock { mode, value, version }
activate BE
note right of BE : Body sai AdjustStockDto (mode lạ, value lẻ / ngoài Int32,\nversion < 1) -> 400 (ValidationPipe) trước mọi bước dưới
BE -> DB : Đọc món theo id
alt Món không tồn tại
  BE --> FE : 404 Product not found
else version gửi lên khác version hiện tại (vừa có đơn trừ kho / người khác sửa)
  BE --> FE : 409 Stock changed, reload
else version khớp nhưng kết quả âm, hoặc vượt Int32
  BE --> FE : 400 Stock cannot be negative / Stock too large
else hợp lệ
  BE -> DB : UPDATE stock, version + 1 WHERE id và version khớp
  alt Có người ghi chen vào giữa (0 dòng được cập nhật)
    BE --> FE : 409 Stock changed, reload
  else Cập nhật được
    BE -> DB : Đọc lại món
    BE --> FE : 200 món đã cập nhật
    FE --> User : Cập nhật dòng trong bảng
  end
end
opt Có lỗi (404 / 409 / 400 / lỗi khác)
  FE -> BE : GET /admin/products (tải lại bảng TRƯỚC)
  FE --> User : Rồi mới hiện lỗi: 409 "Tồn kho vừa thay đổi...",\n400 âm "Tồn kho không được âm", 400 khác "Giá trị tồn kho không hợp lệ"
end
deactivate BE
deactivate FE
@enduml
```

#### C. Bảng đối chiếu kỹ thuật cho AI Agent
* **Backend Endpoints:**
  - `GET /admin/products` (Bearer JWT, chỉ ADMIN): mọi món kể cả `stock = 0`, sắp theo tên.
  - `PATCH /admin/products/:id/stock` (Bearer JWT, chỉ ADMIN): body `{ mode: 'set' | 'delta', value, version }`.
* **Controller / Service:** `AdminProductController.list()` / `adjust()` (`@Controller('admin/products')`, `@UseGuards(JwtAuthGuard, RolesGuard)`, `@Roles(ADMIN)`; barista/khách → 403 `Insufficient role`, thiếu token → 401) $\rightarrow$ `ProductService.listAll()` / `adjustStock()`. Món lạ → 404.
* **Validate đầu vào:** `AdjustStockDto`: `mode` thuộc `set` | `delta` (`@IsIn`), `value` số nguyên (`@IsInt`, âm khi `delta` nghĩa là trừ), `version` số nguyên ≥ 1 (`@IsInt @Min(1)`).
* **Optimistic lock:** `ProductService.adjustStock()` so `dto.version` với `version` hiện tại (lệch → 409 `Stock changed, reload`), tính `next` (`set`: `value`; `delta`: `stock + value`), `next < 0` → 400 `Stock cannot be negative`, `next` vượt `2147483647` (cộng dồn `delta`) → 400 `Stock too large`, rồi gọi `setStockWithOptimisticLock(id, next, version)`: `updateMany` kèm điều kiện `version` khớp và `version + 1`; trả `false` (có người chen vào giữa chừng) → cũng 409. Dùng chung cơ chế `version` với trừ kho lúc thanh toán (§9 ý 3 của đề), nên một đơn vừa trả tiền cũng làm Admin nhận 409.
* **Frontend:** `frontend/src/app/admin/page.tsx` và `frontend/src/lib/admin.ts` (`fetchInventory()`, `adjustStock()`, `stockBadge()`, `LOW_STOCK = 3`). Khi gọi lỗi (409, 400 hoặc lỗi khác), trang tải lại bảng trước rồi mới hiện thông báo lỗi.
* **Không thêm bảng:** vẫn đúng 5 thực thể; `User.role` chỉ là một cột của `User`.
* **Test:** `backend/test/admin-inventory.spec.ts`, `frontend/src/lib/admin.test.ts`.

---

# PHẦN III: MA TRẬN NGỮ CẢNH KỸ THUẬT DÀNH CHO AI AGENTS & DEVELOPERS

Bảng ma trận dưới đây đảm bảo **Tính truy vết tuyệt đối 100% (Full Traceability)** với **7 API Endpoint tối thiểu** (Mục 12.1 đề gốc) + 5 endpoint mở rộng của nhóm (`PATCH /orders/:id`, `GET /orders/:id`, `GET /orders?status=`, `GET /admin/products`, `PATCH /admin/products/:id/stock`) và **5 Thực thể CSDL tối thiểu** (Mục 12.2; `User.role` chỉ là một cột) trong tài liệu gốc `BrewLite-CongNghePhanMem-fixed.md`:

| Mã UC | Tên Ca Sử Dụng | Endpoint REST Chuẩn | Controller / Service (NestJS) | Bảng CSDL (5 Thực thể tối thiểu) | Cơ Chế Bảo Vệ / Logic Cốt Lõi (Task 10) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **UC01** | Xem menu & Tùy chọn món (Size, Topping) | `GET /products`<br>`GET /products/:id` | `ProductController.list()` / `detail()`<br>`ProductService.listAvailable()` / `getById()` | `Product` | Lọc `stock > 0`; `ProductDto` (`id, name, price, imageUrl, stock, version`) **không** có size/topping — bảng giá size/topping nằm ở `frontend/src/lib/pricing.ts` + `backend/src/order/pricing.ts` |
| **UC02** | Quản lý giỏ hàng (Thêm/Sửa/Xóa) | *(Client-side)* | *(Không gọi API)* | *(LocalStorage)* | Zustand Store, tự tính toán `lineTotal` và `cartTotal` |
| **UC03** | Đăng ký / Đăng nhập (JWT) | `POST /auth/register`<br>`POST /auth/login` | `AuthController`<br>`AuthService.login()` / `register()` | `User` | `bcrypt.compare`, cấp JWT Access Token |
| **UC04** | Tạo đơn hàng (PENDING) | `POST /orders` | `OrderController`<br>`OrderService` | `Order`, `OrderItem` | Khởi tạo đơn `PENDING`, validate dữ liệu giỏ qua `class-validator`, Bearer JWT (401 nếu thiếu); **server tự tính giá** từ `product.price` + `order/pricing.ts` (bỏ qua giá client, thiếu size → M, topping lạ → 400; tối đa 20 dòng, `quantity` 1–99, tổng vượt Int32 → 400) |
| **UC05 / UC05a** | Thanh toán không tiền mặt (Ví / Thẻ) / Áp mã giảm giá | `POST /payments` | `PaymentController`<br>`PaymentService` (+ `PrismaPaymentRepo` / `PrismaProductRepo`; chạy thật bắt buộc có `DATABASE_URL`) | `Payment`, `Order`, `Product`, `User` | `@UseGuards(JwtAuthGuard)` (thiếu JWT → 401), kiểm tra chủ đơn trước cache (đơn không có → 404, khác chủ → 403, kể cả khi trúng cache Idempotency-Key), header `Idempotency-Key` (alt hit/miss), khóa trong tiến trình theo key + `orderId` (request song song chỉ charge 1 lần), validate voucher `BREWLITE10` nội bộ (Task 10), ghi sau charge trong 1 `runInTransaction` (trừ kho `updateMany` kèm `version` retry 3, `PAID`, điểm, biên lai); mọi lỗi trong transaction → rollback + hoàn tiền + `PAYMENT_FAILED` + ném lại lỗi gốc (kẹt kho 409, món mất 404, lỗi DB 500); thiếu `Idempotency-Key` hoặc đơn không ở `PENDING` / `PAYMENT_FAILED` → 400, không charge |
| **UC06** | Hủy đơn / Thử lại thanh toán | `PATCH /orders/:id`<br>*(hoặc `POST /payments`)* | `PaymentController.update()`<br>`PaymentService.cancelOrderAs()` (route `PATCH` hiện nằm ở PaymentController) | `Order`, `Payment` | Khách chỉ hủy đơn của mình (403/404) và không tự tiến đơn (`advanceOrder` → 403); hàm `assertTransition()` cưỡng chế State Machine: `PENDING->CANCELLED`, `PAYMENT_FAILED->PENDING`, `PAID->CANCELLED` (hoàn đúng số thực thu + hoàn kho, hoàn kho + `CANCELLED` trong 1 transaction); FE có nút Hủy ở `/history` (`cancelOrder()` trong `lib/api.ts`); thanh tiến trình 5 bước chỉ để xem (tiến đơn là việc của Barista, UC09–UC11) |
| **UC07** | Xem xác nhận & Lịch sử đơn | `GET /orders/me` | `OrderController.mine()`<br>`OrderService.listMine()` | `Order`, `OrderItem` | `JwtAuthGuard` trích xuất `userId` từ token, sắp xếp giảm dần theo ngày |
| **UC08** | Xem hàng đợi đơn (PAID / PREPARING / READY) | `GET /orders?status=PAID,PREPARING,READY` | `OrderController.queue()`<br>`OrderService.listQueue()` | `Order`, `OrderItem`, `Product` (lấy `productName`) | `JwtAuthGuard` + `RolesGuard` (`@Roles(BARISTA, ADMIN)`, khách 403); cũ trước (FIFO); `/barista` tự tải lại mỗi 5 giây |
| **UC09** | Tiếp nhận pha chế (PAID -> PREPARING) | `PATCH /orders/:id` `{ status: 'PREPARING' }` | `PaymentController.update()`<br>`PaymentService.advanceOrder(actor…)` | `Order` | Khách 403 (chỉ BARISTA/ADMIN); `assertTransition(PAID → PREPARING)`; khóa `order:<orderId>`; nút Nhận pha |
| **UC10** | Báo xong pha chế (PREPARING -> READY) | `PATCH /orders/:id` `{ status: 'READY' }` | `PaymentController.update()`<br>`PaymentService.advanceOrder(actor…)` | `Order` | Như UC09; `assertTransition(PREPARING → READY)`; nút Pha xong |
| **UC11** | Xác nhận giao nước (READY -> COMPLETED) | `PATCH /orders/:id` `{ status: 'COMPLETED' }` | `PaymentController.update()`<br>`PaymentService.advanceOrder(actor…)` | `Order` | Như UC09; `assertTransition(READY → COMPLETED)`; nút Đã giao |
| **UC12** | Hủy đơn do hết nguyên liệu (PAID -> CANCELLED) | `PATCH /orders/:id` `{ status: 'CANCELLED' }` | `PaymentController.update()`<br>`PaymentService.cancelOrderAs(actor…)` | `Order`, `Payment`, `Product` | BARISTA/ADMIN chỉ hủy đơn `PAID` (`PENDING` / `PAYMENT_FAILED` → 403, từ `PREPARING` `assertTransition` chặn 400); hoàn đúng số thực thu qua Gateway trước (ngoài transaction), rồi hoàn kho + `CANCELLED` trong 1 transaction (như UC06 KB3) |
| **UC14** | Kiểm & điều chỉnh tồn kho món | `GET /admin/products`<br>`PATCH /admin/products/:id/stock` | `AdminProductController.list()` / `adjust()`<br>`ProductService.listAll()` / `adjustStock()` | `Product` | `RolesGuard` `@Roles(ADMIN)` (barista/khách 403); `AdjustStockDto`; optimistic lock theo `version` qua `setStockWithOptimisticLock` (lệch → 409, kết quả âm hoặc vượt Int32 → 400, món lạ → 404) |

UC13, UC15: chưa hiện thực (backlog) nên chưa có sơ đồ tuần tự và chưa có dòng trong ma trận (xem `docs/use-case-specifications.md` mục 1).

### Hướng Dẫn Điều Hướng Cho AI Agent (Agent Rules):
1. **Tuyệt đối không tạo thêm bảng CSDL ngoài:** Hệ thống chỉ có 5 thực thể tối thiểu (`Product`, `User`, `Order`, `OrderItem`, `Payment`). Khuyến mãi và mã giảm giá `BREWLITE10` được cấu hình và validate nội bộ trong `PaymentService`.
2. **Tiêu chí chấm điểm Task 10:**
   - **(a) State Machine:** Mọi cập nhật trạng thái đơn phải đi qua `assertTransition()`.
   - **(b) Idempotency:** Gửi 2 lần cùng `Idempotency-Key` chỉ trừ tiền 1 lần (nhánh Cache Hit trả kết quả cũ đã lưu).
   - **(c) Concurrency:** Kho bị trừ lúc thanh toán (`POST /payments`), không phải lúc tạo đơn (`POST /orders` không kiểm tồn kho). Thanh toán đồng thời sử dụng Optimistic Locking (`version` trên bảng `Product` + điều kiện `stock >= số lượng` trong cùng 1 lệnh `updateMany` nguyên tử), retry 3 lần, chạy trong cùng 1 `runInTransaction` với các ghi sau charge; hết kho thì rollback transaction + hoàn tiền + `PAYMENT_FAILED` rồi trả lỗi xung đột 409.
3. **Phạm vi nộp bài:** Tài liệu này đóng vai trò **Phụ lục kiến trúc chuyên sâu (Appendix)** cho đội ngũ phát triển và AI Agent. Khi nộp bài chính, nhóm sử dụng bộ 3 biểu đồ tổng quan tinh gọn đã chốt.


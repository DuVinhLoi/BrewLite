# HƯỚNG DẪN ĐỌC HIỂU & ĐẶC TẢ CHI TIẾT BIỂU ĐỒ TUẦN TỰ (SEQUENCE DIAGRAM)
## PHÂN HỆ KHÁCH HÀNG – DỰ ÁN BREWLITE

> **Dự án:** BrewLite – Ứng dụng đặt cà phê không tiền mặt  
> **Môn học:** Công nghệ Phần mềm (Bài tập lớn 10 Task Agile Scrum)  
> **Phạm vi & Định vị tài liệu:**  
> • **Tài liệu này là Phụ lục chi tiết (Architecture Appendix) cho Developers & AI Agents** dùng để hiểu sâu bối cảnh, đối chiếu mã nguồn và viết test case.  
> • **Bản nộp chính cho giảng viên** tập trung vào 3 biểu đồ cốt lõi tinh gọn đã chốt (Use Case tổng 10 bubble, Activity luồng nghiệp vụ tổng, và Sequence thanh toán rút gọn).  
> **Đối tượng độc giả:**  
> 1. **Sinh viên & Giảng viên:** Tra cứu chi tiết từng bước, đối chiếu ma trận truy vết (Traceability) với 8 API endpoint và 10 Task Backlog.  
> 2. **AI Agents / Developers:** Đọc hiểu bối cảnh kiến trúc (Context Navigation), ánh xạ các bước của biểu đồ vào mã nguồn NestJS (Backend) và Next.js (Frontend) để lập trình và viết kiểm thử tự động.

---

# MỤC LỤC

1. [PHẦN I: CẨM NANG ĐỌC HIỂU BIỂU ĐỒ TUẦN TỰ (DÀNH CHO NGƯỜI DÙNG)](#phần-i-cẩm-nang-đọc-hiểu-biểu-đồ-tuần-tự)
   - 1.1 Khái niệm & Mục đích của Sequence Diagram
   - 1.2 Bốn thành phần cốt lõi
   - 1.3 Quy ước các loại đường nối & Mũi tên
   - 1.4 Giải mã các khối điều khiển đặc biệt (`alt`, `opt`, `group`)
2. [PHẦN II: ĐẶC TẢ CHI TIẾT 6 KỊCH BẢN TUẦN TỰ (PLANTUML TỰ NHIÊN)](#phần-ii-đặc-tả-chi-tiết-6-kịch-bản-tuần-tự)
   - 2.1 UC01: Xem menu & Tùy chọn món (Size, Topping)
   - 2.2 UC02: Quản lý giỏ hàng trên trình duyệt
   - 2.3 UC03: Đăng ký & Đăng nhập tài khoản (JWT)
   - 2.4 UC04 + UC05 + UC05a: Đặt hàng & Thanh toán không tiền mặt (Trọng tâm MVP)
   - 2.5 UC06: Hủy đơn / Thử lại thanh toán (Order State Machine)
   - 2.6 UC07: Xem xác nhận & Lịch sử đơn hàng
3. [PHẦN III: MA TRẬN NGỮ CẢNH KỸ THUẬT DÀNH CHO AI AGENTS & DEVELOPERS](#phần-iii-ma-trận-ngữ-cảnh-kỹ-thuật)
   - 3.1 Bảng ánh xạ Use Case sang Mã nguồn & CSDL
   - 3.2 Quy tắc điều hướng cho AI Agent khi sinh mã / kiểm thử

---

# PHẦN I: CẨM NANG ĐỌC HIỂU BIỂU ĐỒ TUẦN TỰ

### 1.1 Khái niệm & Mục đích
Biểu đồ Tuần tự (**Sequence Diagram**) là biểu đồ thể hiện **sự tương tác qua lại giữa các đối tượng theo trục thời gian**. Nếu Use Case Diagram trả lời câu hỏi *"Ai làm chức năng gì?"*, thì Sequence Diagram trả lời câu hỏi: *"Để hoàn thành chức năng đó, các bộ phận trong hệ thống phải trao đổi thông điệp với nhau theo thứ tự nào?"*.

### 1.2 Bốn thành phần cốt lõi trên biểu đồ
1. **Tác nhân (Actor):** Con người tương tác trực tiếp với giao diện (Khách hàng).
2. **Đối tượng tham gia (Participants / Lifelines):** Đại diện cho các tầng kiến trúc của BrewLite:
   - `Giao diện Web (Frontend Next.js)`: Nơi người dùng bấm nút, xem dữ liệu.
   - `Máy chủ xử lý (Backend NestJS)`: Nơi tiếp nhận yêu cầu, kiểm tra nghiệp vụ và xử lý logic.
   - `Cơ sở dữ liệu (PostgreSQL)`: Nơi lưu trữ vĩnh viễn đơn hàng, sản phẩm, tài khoản.
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

# PHẦN II: ĐẶC TẢ CHI TIẾT 6 KỊCH BẢN TUẦN TỰ

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
actor "Khách hàng" as User
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
note right of FE : Trường hợp lỗi/rỗng hiển thị loading/empty (khớp Task 3)
deactivate BE

FE --> User : Hiển thị danh sách đồ uống lên màn hình
User -> FE : Bấm chọn món (Cappuccino) và chọn Size L, thêm Trân châu
FE -> FE : Tự động tính toán lại số tiền tạm tính trên máy khách
FE --> User : Cập nhật giá mới tức thời (45.000đ -> 55.000đ)
deactivate FE
@enduml
```

#### C. Bảng đối chiếu kỹ thuật cho AI Agent
* **Backend Endpoint:** `GET /products` (`GET /products/:id` cho màn chi tiết)
* **Controller / Service:** `ProductController.findAll()` $\rightarrow$ `ProductService.findAll()`
* **Thực thể CSDL:** Bảng `Product` (lọc điều kiện `stock > 0`)
* **Xử lý Frontend:** Quản lý state hiển thị bằng React State / React Query.

---

### 2.2 UC02: Quản lý giỏ hàng trên trình duyệt

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
actor "Khách hàng" as User
participant "Màn hình đặt món\n(Giao diện)" as UI
participant "Bộ nhớ giỏ hàng\n(Lưu tạm trên máy)" as Cart

User -> UI : Bấm nút "Thêm vào giỏ hàng"
activate UI
UI -> Cart : Lưu món đã chọn (kèm size, topping, số lượng)
activate Cart

Cart -> Cart : Tính toán lại tổng tiền các món trong giỏ
Cart --> UI : Cập nhật số lượng trên biểu tượng Giỏ hàng
deactivate Cart

UI --> User : Hiển thị thông báo "Đã thêm món vào giỏ!"
deactivate UI

User -> UI : Mở giỏ hàng và bấm tăng/giảm (+ / -) số lượng
activate UI
UI -> Cart : Cập nhật số lượng mới cho món đó
activate Cart
Cart -> Cart : Tính lại tổng tiền giỏ hàng tức thời
Cart --> UI : Trả về tổng tiền mới
deactivate Cart
UI --> User : Cập nhật lại số tiền hiển thị trên màn hình
deactivate UI

User -> UI : Tôi muốn xóa món này khỏi giỏ
UI --> User : Xóa xong, tổng tiền cập nhật rồi nhé
@enduml
```

#### C. Bảng đối chiếu kỹ thuật cho AI Agent
* **Công nghệ Frontend:** Quản lý bằng `Zustand` store hoặc `React Context`.
* **Cơ chế lưu trữ:** Đồng bộ vào `window.localStorage` để F5 không bị mất giỏ hàng.
* **Cấu trúc dữ liệu:** `CartItem { productId, name, size, toppings: [], quantity, unitPrice, lineTotal }`.

---

### 2.3 UC03: Đăng ký & Đăng nhập tài khoản (JWT)

#### A. Bối cảnh nghiệp vụ
Khi khách hàng bấm đăng nhập, máy chủ sẽ tra cứu tài khoản trong cơ sở dữ liệu và kiểm tra mật khẩu đã được mã hóa an toàn (bằng bcrypt). 
* **Khối `alt` được sử dụng tại đây:**
  - **Nhánh 1 (Thất bại):** Nếu mật khẩu sai $\rightarrow$ Báo lỗi và dừng lại.
  - **Nhánh 2 (Thành công):** Nếu mật khẩu đúng $\rightarrow$ Máy chủ phát một mã khóa phiên làm việc dạng Token (JWT) để trình duyệt lưu lại. Khách hàng chính thức trở thành Thành viên.

#### B. Sơ đồ tuần tự (PlantUML)
```plantuml
@startuml
skinparam DefaultFontColor #1f2937
skinparam ArrowColor #5b6b8c
skinparam SequenceParticipantBackgroundColor #eef2fb
skinparam SequenceParticipantBorderColor #5b6b8c
skinparam SequenceLifeLineBorderColor #5b6b8c

autonumber
actor "Khách hàng" as User
participant "Giao diện Web\n(Frontend)" as FE
participant "Máy chủ xử lý\n(Backend)" as BE
database "Cơ sở dữ liệu" as DB

User -> FE : Nhập Email, Mật khẩu -> Bấm "Đăng nhập"
activate FE
FE -> BE : Gửi thông tin tài khoản đăng nhập
activate BE

BE -> DB : Tìm kiếm tài khoản theo Email
activate DB
DB --> BE : Trả về thông tin tài khoản và mật khẩu đã mã hóa
deactivate DB

BE -> BE : Kiểm tra đối chiếu mật khẩu người dùng nhập

opt Đăng ký tài khoản mới (bỏ qua nếu đã có)
    User -> FE : Tôi muốn tạo tài khoản mới
    FE --> User : Tạo xong, mời bạn đăng nhập
end

alt Mật khẩu KHÔNG chính xác (Kịch bản thất bại)
    BE --> FE : Báo lỗi: "Email hoặc mật khẩu không đúng"
    FE --> User : Hiển thị thông báo đăng nhập thất bại
else Mật khẩu chính xác (Kịch bản thành công)
    BE -> BE : Tạo mã phiên đăng nhập an toàn (Token JWT)
    BE --> FE : Báo đăng nhập thành công kèm Mã Token
    FE -> FE : Lưu mã Token vào bộ nhớ trình duyệt (Cookie / Storage)
    FE --> User : Chuyển sang giao diện tài khoản thành viên
end
deactivate BE
deactivate FE
@enduml
```

#### C. Bảng đối chiếu kỹ thuật cho AI Agent
* **Backend Endpoint:** `POST /auth/login` (và `POST /auth/register`)
* **Controller / Service:** `AuthController.login()` $\rightarrow$ `AuthService.validateUser()`
* **Bảo mật:** `bcrypt.compare(plainPassword, user.passwordHash)`
* **Mã phiên JWT:** Cấp chuỗi Bearer Token chứa `{ sub: user.id, email: user.email }` có thời hạn hết hạn (`expiresIn`).

---

### 2.4 UC04 + UC05 + UC05a: Đặt hàng & Thanh toán không tiền mặt

#### A. Bối cảnh nghiệp vụ
Đây là **trọng tâm nghiệp vụ lớn nhất của dự án BrewLite** (Bao gồm Task 6, 8 và 10):
1. **Bước 1 (UC04 - Tạo đơn):** Gửi giỏ hàng lên máy chủ (kèm token JWT) để tạo bản ghi đơn hàng ở trạng thái chờ thanh toán (`PENDING`).
2. **Bước 2 (UC05a - Khối `opt`):** Khách có mã giảm giá (`BREWLITE10`) thì nhập mã để được tính giảm trừ trực tiếp trên giao diện (hành động tùy chọn). Mã này sẽ được gửi kèm trong yêu cầu thanh toán để máy chủ xác thực nội bộ (không tạo thêm endpoint hay bảng ngoài đề bài).
3. **Bước 3 (UC05 - Thanh toán):** Khách chọn Ví/Thẻ để trả tiền. Hệ thống dùng **Khóa an toàn chống trừ tiền 2 lần (Idempotency-Key)**:
   - **Nhánh Trùng lặp (Cache Hit):** Nếu khóa đã tồn tại trong CSDL $\rightarrow$ trả về kết quả cũ đã lưu (HTTP 200), **tuyệt đối không gọi lại Cổng thanh toán để tránh trừ tiền 2 lần**.
   - **Nhánh Mới (Cache Miss):** Gọi Cổng thanh toán trừ tiền $\rightarrow$ Thực thi `assertTransition('PENDING' -> 'PAID')` $\rightarrow$ Mở Database Transaction cập nhật trạng thái đơn, trừ kho (kèm Optimistic Locking kiểm soát mua đồng thời) và cộng điểm tích lũy.

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
actor "Khách hàng" as User
participant "Giao diện Web\n(Frontend)" as FE
participant "Máy chủ xử lý\n(Backend)" as BE
database "Cơ sở dữ liệu" as DB
participant "Cổng thanh toán\n(Ví Momo / Thẻ)" as Gateway

== BƯỚC 1: TẠO ĐƠN HÀNG (UC04) ==
User -> FE : Tôi muốn thanh toán giỏ hàng này
activate FE
FE -> BE : Nhờ tạo giúp đơn hàng mới từ giỏ hàng nhé
note right of FE #fef3c7 : Gửi kèm token đăng nhập\nvà danh sách món đã chọn\nThiếu/kém token thì trả 401, dừng tại đây
activate BE
BE -> DB : Lưu giúp đơn hàng mới nhé, đơn đang chờ thanh toán
activate DB
DB --> BE : Xong rồi, đơn số #1042 đây nhé
deactivate DB
BE --> FE : Tạo đơn thành công rồi nhé, mã đơn là #1042
deactivate BE
deactivate FE

== BƯỚC 2: ÁP MÃ GIẢM GIÁ (UC05a - TÙY CHỌN EXTEND) ==
opt Khách hàng có mã khuyến mãi
    User -> FE : Tôi có mã "BREWLITE10", áp giúp tôi nhé
    activate FE
    FE -> FE : Tự kiểm tra mã và tính lại tiền còn phải trả
    FE --> User : Trừ 10% rồi nhé, còn phải trả 110.700đ
    deactivate FE
end

== BƯỚC 3: THANH TOÁN KHÔNG TIỀN MẶT (UC05 - BẮT BUỘC INCLUDE) ==
User -> FE : Tôi chọn trả bằng ví, xác nhận trả tiền nhé
activate FE
FE -> BE : Cho tôi thanh toán đơn #1042 bằng ví nhé
note right of FE #fef3c7 : Gửi kèm mã chống thu tiền trùng\nvà mã giảm giá (nếu có)
activate BE

BE -> DB : Kiểm tra giúp xem mã giao dịch này đã dùng chưa
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
        đúng mã thì trừ 10%, sai thì thôi
    end note
    BE -> BE : Tự kiểm tra mã giảm giá và tính tiền còn lại

    BE -> Gateway : Nhờ trừ giúp tiền của khách qua ví nhé
    activate Gateway

    alt Trừ tiền thất bại
        Gateway --> BE : Trừ tiền thất bại rồi nhé
        BE -> BE : Tự chuyển đơn sang thanh toán lỗi
        BE -> DB : Lưu giúp đơn sang trạng thái thanh toán lỗi nhé
        BE --> FE : Thanh toán lỗi rồi, giỏ hàng giữ nguyên nhé
        FE --> User : Thẻ/ví lỗi rồi, bạn thử lại nhé (giỏ vẫn còn)
    else Trừ tiền thành công
        Gateway --> BE : Trừ tiền thành công rồi nhé
        BE -> BE : Tự kiểm tra xem đơn có được chuyển\ntừ chờ thanh toán sang đã thanh toán không

        group Gói cập nhật cùng nhau, thiếu một là bỏ hết
            BE -> DB : Đổi giúp đơn #1042 sang đã thanh toán nhé
            BE -> DB : Trừ giúp tồn kho các món trong đơn nhé
            note over BE, DB #fef3c7
                Nếu hai người mua cùng lúc làm lệch
                phiên bản tồn kho thì thử lại tối đa 3 lần,
                vẫn kẹt thì báo hết hàng (409)
            end note
            BE -> DB : Cộng giúp điểm tích lũy cho khách nhé
            BE -> DB : Lưu giúp biên lai thanh toán kèm mã chống thu trùng nhé
        end

        BE --> FE : Thanh toán xong rồi nhé, đơn #1042 đã được trả tiền
        note right of BE #fef3c7 : Trả HTTP 201 cho lần thanh toán đầu tiên
        FE --> User : Xong rồi, mời bạn xem biên lai đơn #1042 nhé
    end
    deactivate Gateway
end
deactivate BE
deactivate FE
@enduml
```

#### C. Bảng đối chiếu kỹ thuật cho AI Agent
* **Backend Endpoints:**
  - Tạo đơn: `POST /orders` (Body: `items[]`, Header: `Bearer JWT`)
  - Thanh toán: `POST /payments` (Body: `{ orderId, paymentMethod, voucherCode? }`, Header: `Idempotency-Key: <UUID>`)
* Tạo đơn yêu cầu Bearer JWT, thiếu token trả 401 (khớp Task 7).
* **Xác thực Voucher:** Validate nội bộ trong `PaymentService` theo cấu hình chiết khấu (Task 10), không tạo thêm endpoint riêng ngoài 8 endpoint chính.
* **Chống trừ tiền trùng (Idempotent Test Criteria b):** Kiểm tra `Payment WHERE idempotencyKey = ?`. Nhánh Hit trả 200 OK kết quả cũ, nhánh Miss mới gọi Gateway.
* **Kiểm soát tồn kho đồng thời (Concurrency Test Criteria c):** Sử dụng Transaction Prisma/TypeORM kèm Optimistic Locking (cột `version` trong bảng `Product`), retry 3 lần nếu version xung đột trước khi ném lỗi 409.
* **State Machine (Test Criteria a):** Thực thi `assertTransition('PENDING' -> 'PAID')` trước khi lưu vào CSDL.

---

### 2.5 UC06: Hủy đơn / Thử lại thanh toán

#### A. Bối cảnh nghiệp vụ
Phục vụ máy trạng thái **Order State Machine** tại Mục 9.1 tài liệu môn học (`docs:301-322`). 
* Khối `alt` mô tả 3 ngã rẽ xử lý trạng thái theo chuẩn REST (`PATCH /orders/:id`):
  - **Kịch bản 1 (Thử lại):** Khi cổng thanh toán báo trừ tiền lỗi, đơn hàng ở trạng thái `PAYMENT_FAILED`. Khách bấm "Thử lại", hệ thống gọi lại thanh toán hoặc chuyển trạng thái đơn quay về `PENDING` (`PAYMENT_FAILED` $\rightarrow$ `PENDING`).
  - **Kịch bản 2 (Khách hủy đơn chưa trả):** Khi đơn hàng chưa thanh toán, khách có quyền bấm "Hủy đơn" (`PENDING` $\rightarrow$ `CANCELLED`).
  - **Kịch bản 3 (Hủy đơn đã thanh toán - Hoàn tiền):** Khi đơn đã trả tiền (`PAID`) nhưng quầy pha chế báo hết nguyên liệu đột xuất hoặc khách yêu cầu hủy kịp thời, hệ thống kích hoạt hủy đơn kèm hoàn tiền (`PAID` $\rightarrow$ `CANCELLED` theo đúng `docs:313`).

#### B. Sơ đồ tuần tự (PlantUML)
```plantuml
@startuml
skinparam DefaultFontColor #1f2937
skinparam ArrowColor #5b6b8c
skinparam SequenceParticipantBackgroundColor #eef2fb
skinparam SequenceParticipantBorderColor #5b6b8c
skinparam SequenceLifeLineBorderColor #5b6b8c

autonumber
actor "Khách hàng" as User
participant "Giao diện Web\n(Frontend)" as FE
participant "Máy chủ xử lý\n(Backend)" as BE
database "Cơ sở dữ liệu" as DB
participant "Cổng thanh toán\n(Ví Momo / Thẻ)" as Gateway

alt Kịch bản 1: Thử thanh toán lại (Khi bị lỗi trừ tiền)
    User -> FE : Bấm nút "Thử thanh toán lại"
    activate FE
    FE -> BE : POST /payments (Thử lại thanh toán với phương thức mới)
    activate BE
    BE -> BE : assertTransition(from: PAYMENT_FAILED, to: PENDING)
    BE -> DB : Cập nhật trạng thái đơn về "Chờ thanh toán (PENDING)"
    BE --> FE : Xác nhận mở lại trạng thái đơn (200 OK)
    deactivate BE
    FE --> User : Mở lại màn hình thanh toán để khách chọn lại Thẻ / Ví
    deactivate FE

else Kịch bản 2: Khách chủ động hủy đơn chưa thanh toán (PENDING -> CANCELLED)
    User -> FE : Bấm nút "Hủy đơn hàng này"
    activate FE
    FE -> BE : PATCH /orders/1042 { status: 'CANCELLED' }
    activate BE
    BE -> BE : assertTransition(from: PENDING, to: CANCELLED)
    BE -> DB : Cập nhật trạng thái đơn thành "CANCELLED"
    BE --> FE : Xác nhận hủy đơn thành công (200 OK)
    deactivate BE
    FE --> User : Thông báo: "Đơn hàng của bạn đã được hủy thành công"
    deactivate FE

else Kịch bản 3: Hủy đơn sau khi đã thanh toán (PAID -> CANCELLED / Hoàn tiền)
    User -> FE : Yêu cầu hủy đơn đã trả tiền (sự cố quầy / hết nguyên liệu)
    activate FE
    FE -> BE : PATCH /orders/1042 { status: 'CANCELLED' }
    activate BE
    BE -> BE : assertTransition(from: PAID, to: CANCELLED)
    BE -> Gateway : Yêu cầu hoàn tiền giao dịch (Refund)
    activate Gateway
    Gateway --> BE : Phản hồi: Hoàn tiền THÀNH CÔNG
    deactivate Gateway
    BE -> DB : Đổi trạng thái đơn thành "CANCELLED" & hoàn lại tồn kho
    BE --> FE : Xác nhận hủy và hoàn tiền thành công (200 OK)
    deactivate BE
    FE --> User : Thông báo: "Đơn hàng đã được hủy và hoàn tiền thành công"
    deactivate FE
end
@enduml
```

#### C. Bảng đối chiếu kỹ thuật cho AI Agent
* **Backend Endpoints:**
  - `POST /payments` (gửi lại yêu cầu thanh toán khi thử lại)
  - `PATCH /orders/:id` (cập nhật trạng thái đơn thành `CANCELLED` theo chuẩn REST)
* **Quy tắc State Machine (Task 10):**
  - `assertTransition('PAYMENT_FAILED' -> 'PENDING')`: Hợp lệ.
  - `assertTransition('PENDING' -> 'CANCELLED')`: Hợp lệ.
  - `assertTransition('PAID' -> 'CANCELLED')`: Hợp lệ (kèm nghiệp vụ hoàn tiền `refund()`).
  - `assertTransition('PREPARING' -> 'CANCELLED')`: **Không hợp lệ** (Bị chặn ném lỗi 400 Bad Request vì barista đang pha chế).

---

### 2.6 UC07: Xem xác nhận & Lịch sử đơn hàng

#### A. Bối cảnh nghiệp vụ
Tương ứng Task 9 trong đề tài:
1. **Phần 1 (Biên lai ngay sau khi đặt):** Được kích hoạt **ngay lập tức khi `POST /payments` ở UC05 trả về thành công (HTTP 201)**. Màn hình xác nhận hiển thị mã đơn số to `#1042`, trạng thái `PAID` và lời nhắn nhắc khách tới quầy nhận nước (khớp Wireframe 5).
2. **Phần 2 (Xem lại lịch sử):** Khi khách bấm vào trang cá nhân "Lịch sử đơn", hệ thống gọi `GET /orders/me` để hiển thị danh sách toàn bộ các đơn đã từng mua, ngày đặt và trạng thái hiện tại (`PAID`, `PREPARING`, `READY`, `COMPLETED`).

#### B. Sơ đồ tuần tự (PlantUML)
```plantuml
@startuml
skinparam DefaultFontColor #1f2937
skinparam ArrowColor #5b6b8c
skinparam SequenceParticipantBackgroundColor #eef2fb
skinparam SequenceParticipantBorderColor #5b6b8c
skinparam SequenceLifeLineBorderColor #5b6b8c

autonumber
actor "Khách hàng" as User
participant "Giao diện Web\n(Frontend)" as FE
participant "Máy chủ xử lý\n(Backend)" as BE
database "Cơ sở dữ liệu" as DB

== PHẦN 1: MÀN HÌNH XÁC NHẬN (LIÊN KẾT TRỰC TIẾP SAU KHI THANH TOÁN UC05) ==
BE --> FE : Báo thanh toán thành công (Mã đơn: #1042, Trạng thái: Đã thanh toán)
FE --> User : Hiển thị màn hình biên lai xác nhận:\n- Mã lấy nước: #1042\n- Trạng thái: Đã thanh toán\n- Lời nhắn: "Mời bạn đến quầy nhận đồ uống"

== PHẦN 2: XEM LỊCH SỬ CÁC ĐƠN HÀNG ĐÃ MUA ==
User -> FE : Bấm vào mục "Lịch sử đơn hàng"
activate FE
FE -> BE : Yêu cầu lấy lịch sử đơn hàng của tài khoản
activate BE

BE -> DB : Tra cứu toàn bộ các đơn đã đặt của khách (mới nhất lên đầu)
activate DB
DB --> BE : Trả về danh sách đơn kèm tiến độ (Đang pha, Đã xong, Đã hoàn tất)
deactivate DB

BE --> FE : Gửi danh sách lịch sử đơn về giao diện
deactivate BE

FE --> User : Hiển thị danh sách các ly nước đã từng mua và tiến độ hiện tại
deactivate FE
@enduml
```

#### C. Bảng đối chiếu kỹ thuật cho AI Agent
* **Backend Endpoint:** `GET /orders/me` (Được bảo vệ bởi `@UseGuards(JwtAuthGuard)`)
* **Controller / Service:** `OrderController.getMyOrders()` $\rightarrow$ `OrderService.findByUser(userId)`
* **Truy vấn CSDL:** `SELECT * FROM "Order" WHERE "userId" = :userId ORDER BY "createdAt" DESC`
* **Giao diện Wireframe:** Khớp với Wireframe (5) Xác nhận tại Mục 7 tài liệu môn học.

---

# PHẦN III: MA TRẬN NGỮ CẢNH KỸ THUẬT DÀNH CHO AI AGENTS & DEVELOPERS

Bảng ma trận dưới đây đảm bảo **Tính truy vết tuyệt đối 100% (Full Traceability)** với đúng **8 API Endpoints chính** (Mục 12.1) và **5 Thực thể CSDL tối thiểu** (Mục 12.2) trong tài liệu gốc `BrewLite-CongNghePhanMem-fixed.md`:

| Mã UC | Tên Ca Sử Dụng | Endpoint REST Chuẩn | Controller / Service (NestJS) | Bảng CSDL (5 Thực thể tối thiểu) | Cơ Chế Bảo Vệ / Logic Cốt Lõi (Task 10) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **UC01** | Xem menu & Tùy chọn món | `GET /products`<br>`GET /products/:id` | `ProductController`<br>`ProductService` | `Product` | Lọc `stock > 0`, trả về DTO kèm danh sách Size/Topping |
| **UC02** | Quản lý giỏ hàng | *(Client-side)* | *(Không gọi API)* | *(LocalStorage)* | Zustand Store, tự tính toán `lineTotal` và `cartTotal` |
| **UC03** | Đăng ký & Đăng nhập | `POST /auth/register`<br>`POST /auth/login` | `AuthController`<br>`AuthService` | `User` | `bcrypt.compare`, cấp JWT Access Token |
| **UC04** | Tạo đơn hàng mới | `POST /orders` | `OrderController`<br>`OrderService` | `Order`, `OrderItem` | Khởi tạo đơn `PENDING`, validate dữ liệu giỏ qua `class-validator`, Bearer JWT (401 nếu thiếu) |
| **UC05 / UC05a** | Thanh toán & Voucher | `POST /payments` | `PaymentController`<br>`PaymentService` | `Payment`, `Order`, `Product`, `User` | Header `Idempotency-Key` (alt hit/miss), validate voucher `BREWLITE10` nội bộ (Task 10), DB Transaction, Optimistic Locking trừ kho |
| **UC06** | Hủy đơn / Thử lại | `PATCH /orders/:id`<br>*(hoặc `POST /payments`)* | `OrderController`<br>`OrderService` | `Order`, `Payment` | Hàm `assertTransition()` cưỡng chế State Machine: `PENDING->CANCELLED`, `PAYMENT_FAILED->PENDING`, `PAID->CANCELLED` |
| **UC07** | Xác nhận & Lịch sử đơn | `GET /orders/me` | `OrderController`<br>`OrderService` | `Order`, `OrderItem` | `JwtAuthGuard` trích xuất `userId` từ token, sắp xếp giảm dần theo ngày |

### Hướng Dẫn Điều Hướng Cho AI Agent (Agent Rules):
1. **Tuyệt đối không tạo thêm bảng CSDL ngoài:** Hệ thống chỉ có 5 thực thể tối thiểu (`Product`, `User`, `Order`, `OrderItem`, `Payment`). Khuyến mãi và mã giảm giá `BREWLITE10` được cấu hình và validate nội bộ trong `PaymentService`.
2. **Tiêu chí chấm điểm Task 10:**
   - **(a) State Machine:** Mọi cập nhật trạng thái đơn phải đi qua `assertTransition()`.
   - **(b) Idempotency:** Gửi 2 lần cùng `Idempotency-Key` chỉ trừ tiền 1 lần (nhánh Cache Hit trả kết quả cũ đã lưu).
   - **(c) Concurrency:** Đặt hàng đồng thời sử dụng Optimistic Locking (`version` trên bảng `Product`), retry 3 lần trước khi trả lỗi xung đột 409.
3. **Phạm vi nộp bài:** Tài liệu này đóng vai trò **Phụ lục kiến trúc chuyên sâu (Appendix)** cho đội ngũ phát triển và AI Agent. Khi nộp bài chính, nhóm sử dụng bộ 3 biểu đồ tổng quan tinh gọn đã chốt.


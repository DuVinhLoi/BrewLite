<div align="center">

TRƯỜNG ĐẠI HỌC SÀI GÒN

KHOA CÔNG NGHỆ THÔNG TIN

<img src="logo-khoa-cntt.jpg" alt="Logo Khoa Công nghệ Thông tin – Đại học Sài Gòn" width="140">

# SOFTWARE ENGINEERING

---

**Bài tập lớn:**

## BrewLite

<span style="color:#e11d1d">**VER 1.0**</span>

---

Môn học: Công nghệ Phần mềm

Học kỳ: I – Năm học 2026–2027

TP. HỒ CHÍ MINH, NĂM 2026

</div>

---

## Mục lục

| Mục | Trang |
|---|---:|
| **1 Tóm tắt** | 2 |
| **2 Tổng quan quy trình Agile Scrum** | 2 |
| &emsp;2.1 Vai trò, Sự kiện, Tạo phẩm | 2 |
| &emsp;2.2 Vòng lặp Scrum | 2 |
| &emsp;2.3 Kế hoạch 3 Sprint cho BrewLite (gợi ý) | 2 |
| &emsp;2.4 Sprint Burndown chart (biểu đồ mẫu) | 2 |
| **3 Sản phẩm và người dùng** | 3 |
| &emsp;3.1 Product Vision | 3 |
| &emsp;3.2 Các bên liên quan (Stakeholders) | 3 |
| **4 Yêu cầu phần mềm (Requirements)** | 3 |
| &emsp;4.1 Yêu cầu chức năng (Functional) | 3 |
| &emsp;4.2 Yêu cầu phi chức năng (Non-functional) | 3 |
| &emsp;4.3 User Story tiêu biểu (mẫu để viết) | 4 |
| **5 Luồng nghiệp vụ: từ chọn sản phẩm đến thanh toán** | 4 |
| **6 Kiến trúc và công nghệ** | 4 |
| **7 Giao diện MVP tham khảo (wireframe)** | 5 |
| **8 Product Backlog: 10 task theo Scrum** | 5 |
| **9 Task 10 – nghiệp vụ backend** | 6 |
| &emsp;9.1 Sơ đồ máy trạng thái đơn hàng (Order State Machine) | 6 |
| **10 Definition of Done** | 7 |
| **11 Bàn giao sản phẩm cho khách hàng** | 7 |
| **12 API và chức năng tối thiểu** | 7 |
| &emsp;12.1 Một số endpoint chính | 7 |
| &emsp;12.2 Thực thể tối thiểu | 7 |

## 1 Tóm tắt

> **Tóm tắt nội dung**
>
> Đây là bài tập lớn cho nhóm sinh viên môn *Công nghệ Phần mềm*. Nhóm sẽ xây dựng **BrewLite** – một ứng dụng *đặt cà phê không dùng tiền mặt* – theo **quy trình Agile Scrum** đầy đủ, từ *thu thập yêu cầu* (requirements), *kịch bản* (scenario), *phát triển* (development) cho đến *bàn giao sản phẩm* cho khách hàng. Sản phẩm tối thiểu (**MVP**) trải dài từ lúc khách *chọn sản phẩm* đến lúc *thanh toán*. Đề bài gồm **10 task** (mỗi task **1 điểm**, tổng **10 điểm**) theo Scrum. Công nghệ bắt buộc: **NestJS** (Backend) + **Next.js** (Frontend).

## 2 Tổng quan quy trình Agile Scrum

### 2.1 Vai trò, Sự kiện, Tạo phẩm

| Nhóm yếu tố | Thành phần |
|---|---|
| Vai trò (Roles) | Product Owner (PO), Scrum Master (SM), Development Team. |
| Sự kiện (Events) | Sprint Planning, Daily Scrum, Sprint Review, Sprint Retrospective. |
| Tạo phẩm (Artifacts) | Product Backlog, Sprint Backlog, Increment (sản phẩm tăng dần). |

### 2.2 Vòng lặp Scrum

```mermaid
flowchart LR
    PB["Product<br>Backlog"] --> SP["Sprint<br>Planning"]
    SP --> SB["Sprint<br>Backlog"]
    SB --> S["Sprint<br>(1–2 tuần)"]
    S --> INC["Increment<br>(bản chạy được)"]
    S --> DS["Daily Scrum<br>(15 phút/ngày)"]
    INC --> SR["Sprint<br>Review"]
    SR --> RETRO["Sprint<br>Retrospective"]
    RETRO --> PB

    classDef artifact fill:#eaf0ff,stroke:#2f5bd0,color:#111
    classDef event fill:#e3f3ea,stroke:#0a7a3d,color:#111
    classDef sprint fill:#f5f0ea,stroke:#6b4a2b,color:#111
    class PB,SB,INC artifact
    class SP,SR,RETRO,DS event
    class S sprint
```

### 2.3 Kế hoạch 3 Sprint cho BrewLite (gợi ý)

| Sprint | Mục tiêu (Sprint Goal) | Task |
|---|---|---|
| Sprint 1 | Nền tảng & hiển thị menu | Task 1, 2, 3, 4 |
| Sprint 2 | Giỏ hàng & đặt đơn & đăng nhập | Task 5, 6, 7 |
| Sprint 3 | Thanh toán, bàn giao & nghiệp vụ nâng cao | Task 8, 9, 10 |

### 2.4 Sprint Burndown chart (biểu đồ mẫu)

*Burndown chart* theo dõi **khối lượng công việc còn lại** (story points) giảm dần theo từng ngày trong một Sprint. Đường *lý tưởng* (Ideal) là mục tiêu giảm đều; đường *thực tế* (Actual) phản ánh tiến độ thật của nhóm. Ví dụ dưới đây cho một Sprint 2 tuần (10 ngày làm việc, tổng 20 điểm).

```mermaid
%%{init: {"themeVariables": {"xyChart": {"plotColorPalette": "#007049, #d32f2f"}}}}%%
xychart-beta
    x-axis "Ngày làm việc" [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    y-axis "Story points còn lại" 0 --> 20
    line [20, 18, 16, 14, 12, 10, 8, 6, 4, 2, 0]
    line [20, 19, 17, 16, 15, 12, 11, 8, 5, 3, 0]
```

**Lý tưởng (Ideal)** – đường xanh lá, giảm đều từ 20 về 0; **Thực tế (Actual)** – đường đỏ.

<details>
<summary>Số liệu của biểu đồ</summary>

| Ngày làm việc | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Lý tưởng (Ideal) | 20 | 18 | 16 | 14 | 12 | 10 | 8 | 6 | 4 | 2 | 0 |
| Thực tế (Actual) | 20 | 19 | 17 | 16 | 15 | 12 | 11 | 8 | 5 | 3 | 0 |

</details>

> **Cách đọc:** nếu đường *thực tế* nằm *trên* đường *lý tưởng* ⇒ nhóm đang chậm tiến độ; nằm *dưới* ⇒ vượt tiến độ. Daily Scrum dùng biểu đồ này để phát hiện rủi ro sớm và điều chỉnh phạm vi Sprint. Mỗi nhóm cập nhật số điểm còn lại *cuối mỗi ngày*.

## 3 Sản phẩm và người dùng

### 3.1 Product Vision

> *“BrewLite giúp khách hàng đặt và thanh toán đồ uống **không dùng tiền mặt** chỉ trong vài chạm, giảm thời gian xếp hàng và nhận đơn nhanh tại quầy.”*

### 3.2 Các bên liên quan (Stakeholders)

- **Khách hàng:** đặt đồ uống, chọn size/topping, thanh toán không tiền mặt và theo dõi trạng thái đơn.
- **Nhân viên quầy/Barista:** tiếp nhận đơn và cập nhật trạng thái pha chế. Chức năng này nằm ngoài phạm vi MVP và là phần mở rộng.
- **Quản lý cửa hàng/Product Owner:** xác định yêu cầu, ưu tiên Product Backlog và nghiệm thu Increment sau mỗi Sprint.
- **Giảng viên nghiệm thu:** đánh giá quy trình, sản phẩm và mức độ đáp ứng các tiêu chí chấp nhận.
- **Nhóm phát triển:** phân tích, thiết kế, lập trình, kiểm thử và bàn giao hệ thống.
- **Đơn vị thanh toán:** cung cấp hoặc được mô phỏng qua cổng thanh toán Ví/Thẻ trong phạm vi bài tập lớn.

## 4 Yêu cầu phần mềm (Requirements)

### 4.1 Yêu cầu chức năng (Functional)

1. Hiển thị danh sách (menu) đồ uống kèm hình, tên, giá.
2. Xem chi tiết sản phẩm, chọn *size* và *topping*.
3. Thêm/sửa/xóa sản phẩm trong *giỏ hàng*; tự tính tổng tiền.
4. Đăng ký / đăng nhập tài khoản (JWT).
5. Tạo đơn hàng và *thanh toán không tiền mặt*.
6. Hiển thị xác nhận đơn (mã đơn, trạng thái) và lịch sử đơn.

### 4.2 Yêu cầu phi chức năng (Non-functional)

- Thời gian phản hồi API < 500ms với dữ liệu mẫu.
- Bảo mật: mật khẩu băm (hash), token JWT, validate dữ liệu đầu vào.
- Phù hợp trên các trình duyệt web.

### 4.3 User Story tiêu biểu (mẫu để viết)

> **US-05 – Thanh toán không tiền mặt**
>
> *Là một* khách hàng, *tôi muốn* thanh toán đơn bằng ví điện tử/thẻ, *để* tôi không cần mang tiền mặt.
>
> **Tiêu chí chấp nhận (Acceptance Criteria):**
>
> - Khi giỏ hàng có ít nhất 1 sản phẩm, nút “Thanh toán” hiển thị tổng tiền.
> - Chọn phương thức (Ví / Thẻ) rồi xác nhận ⇒ tạo đơn ở trạng thái `PAID`.
> - Nếu thanh toán lỗi, đơn ở trạng thái `PAYMENT_FAILED` và giỏ hàng được giữ nguyên.
> - Sau khi thành công, hiển thị mã đơn và màn hình xác nhận.

## 5 Luồng nghiệp vụ: từ chọn sản phẩm đến thanh toán

Luồng nghiệp vụ chính (happy path) của MVP:

```mermaid
flowchart TD
    A(["Mở app"]) --> B["Xem menu"]
    B --> C["Chọn sản phẩm<br>(size, topping)"]
    C --> D["Thêm vào giỏ hàng"]
    D --> E["Xem giỏ & tổng tiền"]
    E -- "mua thêm" --> F["Thêm sản phẩm khác"]
    F --> B
    E --> G["Đăng nhập<br>(nếu chưa)"]
    G --> H["Thanh toán<br>không tiền mặt"]
    H -- "lỗi" --> I(["Hủy /<br>thanh toán lỗi"])
    I --> E
    H --> J["Xác nhận đơn<br>(mã đơn)"]
    J --> K(["Nhận đồ uống"])

    classDef node fill:#f5f0ea,stroke:#6b4a2b,color:#111
    classDef terminal fill:#e9e9e9,stroke:#666,color:#111
    class B,C,D,E,F,G,H,J node
    class A,I,K terminal
```

## 6 Kiến trúc và công nghệ

Frontend **Next.js** gọi REST API của backend **NestJS**; NestJS dùng một CSDL (gợi ý PostgreSQL qua Prisma/TypeORM) và tích hợp cổng thanh toán giả lập (mock payment gateway).

```mermaid
flowchart LR
    FE["Next.js<br>(Frontend SSR/CSR)"] -- "REST/JSON" --> BE["NestJS<br>(REST API)"]
    BE -- "ORM" --> DB[("PostgreSQL")]
    BE -- "thanh toán" --> PAY["Payment Gateway<br>(mock)"]

    classDef fe fill:#fdeee0,stroke:#d9822b,color:#111
    classDef be fill:#fbe4e4,stroke:#d32f2f,color:#111
    classDef db fill:#e3f3ea,stroke:#0a7a3d,color:#111
    classDef pay fill:#e6efff,stroke:#2f6bd0,color:#111
    class FE fe
    class BE be
    class DB db
    class PAY pay
```

| Thành phần | Công nghệ |
|---|---|
| Frontend | Next.js (React, TypeScript), TailwindCSS, React Query/Zustand (giỏ hàng) |
| Backend | NestJS (TypeScript), REST, class-validator, JWT (Passport) |
| CSDL | PostgreSQL + Prisma (hoặc TypeORM) |
| Thanh toán | Mock Payment Service (mô phỏng Momo/VNPay/Stripe) |
| DevOps | Docker Compose, Git, README bàn giao |

## 7 Giao diện MVP <span style="color:#e11d1d">tham khảo</span> (wireframe)

Năm màn hình cốt lõi từ *chọn sản phẩm* đến *xác nhận thanh toán*. Sinh viên có thể bám theo bố cục này khi dựng UI bằng Next.js.

```mermaid
flowchart LR
    subgraph W1["(1) Menu"]
        direction TB
        a0["<b>BrewLite ≡</b>"] ~~~ a1["Cà phê sữa 35k"] ~~~ a2["Americano 40k"] ~~~ a3["Cappuccino 45k"] ~~~ a4["Trà đào 39k"] ~~~ a5(["Xem giỏ hàng (0)"])
    end
    subgraph W2["(2) Chi tiết"]
        direction TB
        b0["<b>← Cappuccino</b>"] ~~~ b1["Giá: 45.000đ"] ~~~ b2["Size<br>S · M · L"] ~~~ b3["Topping<br>Trân châu / Kem"] ~~~ b4(["Thêm vào giỏ"])
    end
    subgraph W3["(3) Giỏ hàng"]
        direction TB
        c0["<b>Giỏ hàng</b>"] ~~~ c1["Cappuccino M x1"] ~~~ c2["Trà đào L x2"] ~~~ c3["Tổng: 123.000đ"] ~~~ c4(["Thanh toán"])
    end
    subgraph W4["(4) Thanh toán"]
        direction TB
        d0["<b>Thanh toán</b>"] ~~~ d1["Tổng: 123.000đ"] ~~~ d2["Phương thức<br>(o) Ví điện tử<br>( ) Thẻ ngân hàng"] ~~~ d3["Không dùng tiền mặt"] ~~~ d4(["Xác nhận trả"])
    end
    subgraph W5["(5) Xác nhận"]
        direction TB
        e0["✓<br><b>Đặt hàng thành công</b>"] ~~~ e1["Mã đơn: #35;1042"] ~~~ e2["Trạng thái: PAID"] ~~~ e3["Mời tới quầy lấy nước"] ~~~ e4(["Về trang chủ"])
    end
    W1 --> W2 --> W3 --> W4 --> W5

    classDef el fill:#f5f0ea,stroke:#6b4a2b,color:#111
    classDef btn fill:#0a7a3d,stroke:#075c2e,color:#fff
    classDef screen fill:#fbfbfb,stroke:#444,color:#111
    class a0,a1,a2,a3,a4,b0,b1,b2,b3,c0,c1,c2,c3,d0,d1,d2,d3,e0,e1,e2,e3 el
    class a5,b4,c4,d4,e4 btn
    class W1,W2,W3,W4,W5 screen
```

## 8 Product Backlog: 10 task theo Scrum

Mỗi task là một hạng mục backlog, sắp xếp **từ dễ đến khó** và phân vào các Sprint. Mỗi task hoàn thành (đạt Definition of Done ở Mục 10) được **1 điểm**, tổng **10 điểm**.

| # | Task (Story) | Yêu cầu / Tiêu chí chấp nhận chính | Điểm |
|---|---|---|---:|
| 1 | Khởi tạo dự án và cấu trúc | Tạo monorepo/2 thư mục `frontend` (Next.js) + `backend` (NestJS), chạy được “Hello”, có README, Git, `.env.example`. | 1 |
| 2 | API danh sách sản phẩm | NestJS `GET /products` trả về JSON menu (id, tên, giá, ảnh) từ dữ liệu mẫu/CSDL. | 1 |
| 3 | Trang Menu (Frontend) | Next.js gọi `/products`, render lưới sản phẩm, có loading/empty state. | 1 |
| 4 | Chi tiết và tùy chọn sản phẩm | Màn hình chi tiết: chọn size (S/M/L) và topping; tính giá theo tùy chọn. | 1 |
| 5 | Giỏ hàng (Cart) | Thêm/sửa số lượng/xóa; lưu state (Zustand/Context); tự tính tổng tiền; badge số lượng. | 1 |
| 6 | API tạo đơn hàng | NestJS `POST /orders` nhận giỏ hàng, validate (class-validator), lưu đơn trạng thái `PENDING`, trả mã đơn. | 1 |
| 7 | Đăng ký / Đăng nhập (JWT) | `POST /auth/register`, `/auth/login`; băm mật khẩu (bcrypt); phát JWT; guard bảo vệ route đặt đơn. | 1 |
| 8 | Thanh toán không tiền mặt | Tích hợp *mock payment*: chọn Ví/Thẻ, gọi `POST /payments`; đơn chuyển `PAID` khi thành công, `PAYMENT_FAILED` khi lỗi. | 1 |
| 9 | Xác nhận, lịch sử đơn & bàn giao | Màn hình xác nhận (mã đơn, trạng thái) và `GET /orders/me` (lịch sử đơn); `docker-compose` chạy cả 3 (frontend, backend, DB); README; demo end-to-end. | 1 |
| 10 | Nghiệp vụ backend | State Machine đơn hàng, thanh toán idempotent, kiểm soát tồn kho khi đặt đồng thời, khuyến mãi/điểm thưởng (chi tiết ở Mục 9). | 1 |
| | | **Tổng** | **10** |

## 9 Task 10 – nghiệp vụ backend

> **Task 10: Xử lý đặt hàng và thanh toán.**
>
> Hiện thực *nghiệp vụ backend thực tế* trong NestJS bao gồm **cả 4** yêu cầu:
>
> 1. **Order State Machine:** `PENDING` → `PAID` → `PREPARING` → `READY` → `COMPLETED`; chặn chuyển trạng thái không hợp lệ.
> 2. **Thanh toán idempotent:** dùng *Idempotency-Key* để cùng một yêu cầu thanh toán lặp lại *không bị trừ tiền/đặt đơn 2 lần*.
> 3. **Kiểm soát tồn kho khi đặt đồng thời:** khi nhiều khách đặt cùng lúc, dùng *transaction* + *optimistic locking* để không bán quá số lượng nguyên liệu/sản phẩm còn lại.
> 4. **Khuyến mãi và điểm thưởng (loyalty):** áp mã giảm giá hợp lệ và cộng điểm tích lũy cho khách sau khi đơn `PAID`.
>
> **Tiêu chí chấm:** có *unit/integration test* chứng minh: (a) chặn được chuyển trạng thái sai; (b) gửi 2 lần cùng Idempotency-Key chỉ tạo 1 đơn; (c) đặt đồng thời không vượt tồn kho.

### 9.1 Sơ đồ máy trạng thái đơn hàng (Order State Machine)

Sơ đồ dưới đây mô tả các trạng thái hợp lệ của một đơn hàng và các chuyển tiếp được phép. *Mọi chuyển tiếp không có mũi tên* sẽ bị hàm `assertTransition` chặn lại (ném lỗi). `COMPLETED` và `CANCELLED` là trạng thái *kết thúc*.

```mermaid
stateDiagram-v2
    direction LR
    [*] --> PENDING
    PENDING --> PAID : thanh toán OK
    PAID --> PREPARING : barista nhận
    PREPARING --> READY : pha xong
    READY --> COMPLETED : giao khách
    COMPLETED --> [*]
    PENDING --> PAYMENT_FAILED : thanh toán lỗi
    PAYMENT_FAILED --> PENDING : thử lại
    PENDING --> CANCELLED : hủy
    PAID --> CANCELLED : hủy
    PAYMENT_FAILED --> CANCELLED : hủy

    classDef success fill:#d8ebe0,stroke:#0a7a3d,color:#111
    classDef failed fill:#fbe4e4,stroke:#d32f2f,color:#111
    classDef cancelled fill:#e0e0e0,stroke:#666,color:#111
    class COMPLETED success
    class PAYMENT_FAILED failed
    class CANCELLED cancelled
```

> **Mô tả:** đi theo *luồng xanh* (đường ngang) là trạng thái thành công: `PENDING` → `PAID` → `PREPARING` → `READY` → `COMPLETED`. Các nhánh *đỏ/xám* là ngoại lệ: thanh toán lỗi (`PAYMENT_FAILED`, có thể *thử lại*) hoặc *hủy* đơn (`CANCELLED`).

## 10 Definition of Done

Một task được tính điểm khi thỏa **Definition of Done (DoD)**:

- Code chạy được, không lỗi build; tuân theo tiêu chí chấp nhận của task.
- Có commit trên Git với mô tả rõ ràng; được review trong nhóm.
- API có validate đầu vào; UI xử lý trạng thái loading/lỗi cơ bản.
- Có hướng dẫn chạy trong README.

## 11 Bàn giao sản phẩm cho khách hàng

Ở cuối Sprint cuối, nhóm tổ chức buổi **Sprint Review / Demo** đóng vai bàn giao cho giảng viên:

1. Trình diễn luồng end-to-end: chọn sản phẩm → giỏ hàng → thanh toán → xác nhận đơn.
2. Bàn giao mã nguồn (Git), `docker-compose` chạy được, README.
3. Trình bày *Sprint Retrospective*: điều làm tốt, điều cần cải thiện.
4. Nhận phản hồi của “khách hàng” và ghi nhận backlog cho phiên bản sau.

## 12 API và chức năng tối thiểu

### 12.1 Một số endpoint chính

| Endpoint | Chức năng |
|---|---|
| `GET /products` | Danh sách sản phẩm (menu) |
| `GET /products/:id` | Chi tiết một sản phẩm |
| `POST /auth/register` | Đăng ký tài khoản |
| `POST /auth/login` | Đăng nhập, trả JWT |
| `POST /orders` | Tạo đơn (PENDING) |
| `POST /payments` | Thanh toán (idempotent) |
| `GET /orders/me` | Lịch sử đơn của user |

### 12.2 Thực thể tối thiểu

- **Product**(id, name, price, imageUrl, stock).
- **User**(id, email, passwordHash, loyaltyPoints).
- **Order**(id, userId, status, total, createdAt).
- **OrderItem**(id, orderId, productId, size, qty, lineTotal).
- **Payment**(id, orderId, idempotencyKey, amount, method).

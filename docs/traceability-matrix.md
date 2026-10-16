# Ma trận truy vết (đề A2 §8.1)

> **Baseline Task 1 theo phạm vi minimum đã chốt trong PR #5, đã rút gọn thêm (SRS mục 1.4).** Các cột thiết kế, code và test ghi kế hoạch/chờ đúng task, không phải bằng chứng đã hiện thực. Không chờ tạo phẩm Task 2–5 để merge Task 1.
>
> Nguồn: [`requirements/srs.md`](requirements/srs.md) (`FR-xx`, `NFR-xx`), [`requirements/uc-checkout.md`](requirements/uc-checkout.md), [`requirements/use-case-overview.svg`](requirements/use-case-overview.svg). Quy tắc kiểm và cách điền: kế hoạch A2 mục C ([`planning/2026-10-15-assignment2-plan.md`](planning/2026-10-15-assignment2-plan.md)).

## Cách điền dần

| Thời điểm | Cột điền | Việc làm |
|---|---|---|
| Cuối Task 1 (đã xong) | Mã yêu cầu, Use-case/User Story | Mỗi `FR-xx`, `NFR-xx` có một dòng; `FR-xx` gắn với use-case; `NFR-xx` ghi kiểu đo |
| Cuối Task 2 | Thiết kế/Sơ đồ | Điền sơ đồ và phần tử liên quan (lớp, bước sequence, nhánh activity) |
| Cuối Task 3 | Thiết kế/Sơ đồ (kiến trúc) | Dòng NFR triển khai trỏ tới ADR, `deployment.svg`, workflow |
| Task 4–5, mỗi PR | Code/API, Test | PR thêm chức năng thì thêm đường dẫn hoặc endpoint và mã test vào ma trận trong cùng PR |

**Quy ước:** chữ "dự kiến" nghĩa là tên đã nêu trong SRS mục 3.1 nhưng code chưa có; khi code xong thì thay bằng đường dẫn thật. Mã test: `UNIT-Txx`, `API-Txx`, `INT-Txx`, `E2E-Txx`. Mã sơ đồ dự kiến cho Task 2: `Activity-01` = `activity-checkout`, `Sequence-01` = `sequence-checkout`, `Class-01` = `class-domain`, `State-01` = `state-order` (tùy chọn); Task 3: `Deployment-01` = `deployment`.

## 1. Yêu cầu chức năng (FR)

| Mã yêu cầu | Use-case/User Story | Thiết kế/Sơ đồ | Code/API | Test |
|---|---|---|---|---|
| FR-01 | UC-01 Xem menu và chi tiết món | chờ Task 2 | dự kiến `GET /products`; chờ Task 4–5 | chờ Task 4–5 |
| FR-02 | UC-01 Xem menu và chi tiết món | chờ Task 2 | dự kiến màn menu trong `apps/web`; chờ Task 4–5 | chờ Task 4–5 |
| FR-03 | UC-01 Xem menu và chi tiết món | chờ Task 2 | dự kiến `GET /products/:id`; chờ Task 5 | chờ Task 4–5 |
| FR-04 | UC-01 Xem menu và chi tiết món | chờ Task 2 | dự kiến màn chi tiết trong `apps/web`; chờ Task 5 | chờ Task 4–5 |
| FR-05 | UC-02 Quản lý giỏ hàng | chờ Task 2 | dự kiến giỏ hàng phía client trong `apps/web`; chờ Task 5 | chờ Task 4–5 |
| FR-06 | UC-02 Quản lý giỏ hàng | chờ Task 2 | dự kiến giỏ hàng phía client trong `apps/web`; chờ Task 5 | chờ Task 4–5 |
| FR-07 | UC-02 Quản lý giỏ hàng; UC-04 (bước 1) | chờ Task 2 | dự kiến giỏ hàng phía client trong `apps/web`; chờ Task 5 | chờ Task 4–5 |
| FR-08 | UC-03 Đăng ký / Đăng nhập | chờ Task 2 | dự kiến `POST /auth/register`; chờ Task 5 | chờ Task 4–5 |
| FR-09 | UC-03 Đăng ký / Đăng nhập | chờ Task 2 | dự kiến `POST /auth/login`; chờ Task 5 | chờ Task 4–5 |
| FR-10 | UC-03; UC-04 (E1a chưa tạo đơn; E1b tiếp tục orderId cũ sau đăng nhập lại cùng tài khoản) | chờ Task 2 (Activity: nhánh chưa đăng nhập; Sequence: kiểm JWT và tiếp tục đơn cũ) | dự kiến JWT guard cho `POST /orders`, `POST /payments`, `GET /orders/me`, `GET /orders/:id`, `PATCH /orders/:id`; chờ Task 5 | chờ Task 4–5 |
| FR-11 | UC-04.1 Tạo đơn hàng | chờ Task 2 (Sequence: transaction tạo đơn; Class: `Order`, `OrderItem`) | dự kiến `POST /orders`; chờ Task 5 | chờ Task 4–5 |
| FR-12 | UC-04.1 Tạo đơn hàng; UC-04 (ngoại lệ E6) | chờ Task 2 (Sequence: validate) | dự kiến `POST /orders`; chờ Task 5 | chờ Task 4–5 |
| FR-13 | UC-04.1 Tạo đơn hàng; UC-04 (ngoại lệ E2) | chờ Task 2 (Activity: nhánh hết hàng; Class: `Product.stock`) | dự kiến `POST /orders` trả 409; chờ Task 5 | chờ Task 4–5 |
| FR-14 | UC-04.2 Thanh toán đơn hàng | chờ Task 2 (Sequence: gọi Payment Service; Class: `Payment`) | dự kiến `POST /payments`; chờ Task 5 | chờ Task 4–5 |
| FR-15 | UC-04.2, UC-04.5; UC-04 (ngoại lệ E3, thay thế A3) | chờ Task 2 (Activity: nhánh thanh toán thất bại; Sequence: `alt` thất bại) | dự kiến `POST /payments` trả 402; chờ Task 5 | chờ Task 4–5 |
| FR-16 | UC-04.2, UC-04.5; UC-04 (E4, E8b); chống thu trùng theo `orderId`, phục hồi AC-F16.7 | chờ Task 2 (Sequence: idempotency và phục hồi; Class: `Payment.idempotencyKey`), Task 3 (ADR 005) | dự kiến `POST /payments` với header `Idempotency-Key`, simulator theo mã `orderId`; chờ Task 5 | chờ Task 5 (integration gây lỗi sau simulator thành công, trước API commit; restart/retry) |
| FR-17 | Won’t bản nộp: UC-04.3; A1/E5 | Task 2 bắt buộc lớp `Promotion`, không cần luồng áp mã | không hiện thực trong bản nộp | không có AC (gộp vào bảng Won’t, SRS mục 5.9) |
| FR-18 | Won’t bản nộp: UC-04.4 | Task 2 bắt buộc lớp `LoyaltyTransaction`, không cần luồng ghi điểm | không hiện thực trong bản nộp | không có AC (gộp vào bảng Won’t, SRS mục 5.9) |
| FR-19 | Won’t bản nộp: UC-08; phụ thuộc FR-18 | ngoài bản nộp | không hiện thực trong bản nộp | không có AC (gộp vào bảng Won’t, SRS mục 5.9) |
| FR-20 | UC-04 (bước 16); UC-05 Xem lịch sử và theo dõi đơn | chờ Task 2 | dự kiến màn xác nhận trong `apps/web`, `GET /orders/:id`; chờ Task 5 | chờ Task 4–5 |
| FR-21 | UC-05 Xem lịch sử và theo dõi đơn | chờ Task 2 | dự kiến `GET /orders/me`; chờ Task 5 | chờ Task 4–5 |
| FR-22 | UC-05 Xem lịch sử và theo dõi đơn | chờ Task 2 | dự kiến `GET /orders/:id`; chờ Task 5 | chờ Task 4–5 |
| FR-23 | UC-07 Cập nhật trạng thái đơn | chờ Task 2 (Class: enum `OrderStatus`, 8 chuyển minimum; State-01 tùy chọn) | dự kiến hàm kiểm chuyển trạng thái trong module orders; chờ Task 5 | chờ Task 4–5 |
| FR-24 | UC-07 Cập nhật trạng thái đơn (Must) | chờ Task 2 | dự kiến `GET /orders/:id`, `PATCH /orders/:id` (Barista), Postman collection; chờ Task 5 | chờ Task 5: AC-F24.1–4; không yêu cầu Swagger UI |
| FR-25 | Could: UC-06 Hủy đơn; UC-04 (thay thế A5) | chờ Task 2 (hai chuyển `→ CANCELLED` vẫn có trong mô hình trạng thái) | dự kiến `PATCH /orders/:id` (Customer hủy), chỉ khi làm FR-25; chờ Task 5 | chờ Task 5, chỉ khi làm FR-25 (AC-F25.1–3) |
| FR-26 | Won’t bản nộp: UC-06 mở rộng | Task 2: PAID → CANCELLED không hợp lệ trong minimum | không hiện thực trong bản nộp | không có AC (gộp vào bảng Won’t, SRS mục 5.9) |
| FR-27 | Won’t bản nộp: UC-07 mở rộng: hàng đợi | ngoài bản nộp | không hiện thực trong bản nộp | không có AC (gộp vào bảng Won’t, SRS mục 5.9) |
| FR-28 | Won't: quản trị menu (ngoài phạm vi) | không thực hiện (lý do ở SRS mục 5.9) | không thực hiện | không thực hiện |
| FR-29 | Won't: quản trị kho (ngoài phạm vi) | không thực hiện (lý do ở SRS mục 5.9) | không thực hiện | không thực hiện |
| FR-30 | Won't: quản trị voucher (ngoài phạm vi); dữ liệu `Promotion` vẫn có trong mô hình | không thực hiện (lý do ở SRS mục 5.9) | không thực hiện | không thực hiện |
| FR-31 | Won't: thanh toán thật (ngoài phạm vi) | không thực hiện (lý do ở SRS mục 5.9) | không thực hiện | không thực hiện |
| FR-32 | Won't: đổi/trừ điểm thưởng (ngoài phạm vi) | không thực hiện (lý do ở SRS mục 5.9) | không thực hiện | không thực hiện |

## 2. Yêu cầu phi chức năng (NFR)

Cột "Use-case/User Story" của NFR ghi use-case chịu tác động chính và kiểu đo.

| Mã yêu cầu | Use-case/User Story | Thiết kế/Sơ đồ | Code/API | Test |
|---|---|---|---|---|
| NFR-01 | Should: UC-01; đo thời gian p95 `GET /products`, `GET /products/:id` trên local | chờ Task 3 | dự kiến `GET /products`, `GET /products/:id`; chờ Task 4 | chờ Task 4–5 |
| NFR-02 | Could: UC-01; đo Lighthouse (LCP, Performance) trang menu | chờ Task 3 | dự kiến trang menu `apps/web`; chờ Task 4 | chờ Task 4–5 |
| NFR-03 | Could: UC-04; đo thời gian p95 `POST /orders`, `POST /payments` | chờ Task 3 | dự kiến `POST /orders`, `POST /payments`; chờ Task 5 | chờ Task 4–5 |
| NFR-04 | UC-03; kiểm mẫu băm bcrypt, không lộ mật khẩu | chờ Task 3 | dự kiến `POST /auth/register`; chờ Task 5 | chờ Task 4–5 |
| NFR-05 | UC-03, UC-04, UC-05, UC-06, UC-07; kiểm ma trận quyền 401/403 | chờ Task 2 (Sequence: kiểm JWT), chờ Task 3 | dự kiến JWT guard và role guard trong `apps/api`; chờ Task 5 | chờ Task 4–5 |
| NFR-06 | UC-03, UC-04; kiểm 400 `VALIDATION_ERROR`, không tin giá client | chờ Task 2 (Sequence: validate) | dự kiến DTO validation `apps/api`, form validation `apps/web`; chờ Task 5 | chờ Task 4–5 |
| NFR-07 | Toàn hệ thống; kiểm các file Git theo dõi không chứa secret, `.gitignore` và `.env.example`, kiểm CORS, kiểm log | chờ Task 3 (ADR, deployment: secret/biến môi trường) | dự kiến `.gitignore`, `.env.example`, cấu hình CORS; chờ Task 4–5 | chờ Task 4–5 |
| NFR-08 | Toàn hệ thống; kiểm HTTPS và DB không public | chờ Task 3 (Deployment-01: HTTPS, kết nối nội bộ) | cấu hình nền tảng; chờ Task 5 | chờ Task 5 |
| NFR-09 | UC-01 đến UC-05; kiểm khung nhìn 360 px, vùng chạm 44 px | chờ Task 3 | dự kiến `apps/web`; chờ Task 4–5 | chờ Task 4–5 |
| NFR-10 | Toàn hệ thống (web); kiểm web app manifest (AC-N10.1) | chờ Task 3 | dự kiến manifest trong `apps/web`; chờ Task 5 | chờ Task 4–5 |
| NFR-11 | UC-01, UC-05; kiểm ba trạng thái loading/empty/error | chờ Task 3 | dự kiến `apps/web`; chờ Task 4–5 | chờ Task 4–5 |
| NFR-12 | Must: UC-01 đến UC-04; kiểm E2E Chromium | chờ Task 3 | dự kiến `apps/web`; chờ Task 5 | chờ Task 5 |
| NFR-13 | UC-04 (ngoại lệ E2, E4, E8); kiểm transaction, đồng thời | chờ Task 2 (Sequence: transaction), chờ Task 3 (ADR 005) | dự kiến module orders, payments; chờ Task 5 | chờ Task 5 |
| NFR-14 | Triển khai; kiểm `docker compose up` trên máy sạch | chờ Task 3 (Deployment-01: vùng Local) | dự kiến `docker-compose.yml`, Dockerfile; chờ Task 5 | chờ Task 5 |
| NFR-15 | Triển khai; kiểm `GET /health` 200/503 theo DB, `version`/SHA image và không cache (AC-N15.1–3) | chờ Task 3 (ADR, deployment: health check) | dự kiến `GET /health`; chờ Task 5 | chờ Task 5 |
| NFR-16 | Triển khai; kiểm migration/seed tái tạo DB; minimum không seed khuyến mãi | chờ Task 3 (ADR 003) | dự kiến migration và seed trong `apps/api`; chờ Task 4–5 | chờ Task 4–5 |
| NFR-17 | Triển khai; kiểm pipeline CI xanh và đỏ | chờ Task 3 (Deployment-01: vùng CI) | dự kiến `.github/workflows/ci.yml`; chờ Task 4 | chờ Task 4 |
| NFR-18 | Triển khai; kiểm pipeline CD chờ đúng SHA rồi smoke test; rollback kiểm SHA bản trước (AC-N18.2–3) | chờ Task 3 (ADR 004, Deployment-01) | dự kiến `.github/workflows/cd.yml`, `docs/deployment.md`; chờ Task 5 | chờ Task 5 |
| NFR-19 | Triển khai; kiểm URL production sống và người ngoài nhóm chạy theo README | chờ Task 3 (Deployment-01) | dự kiến `README.md`, nền tảng production; chờ Task 5 | chờ Task 5 |
| NFR-20 | Triển khai; kiểm log JSON mỗi yêu cầu | chờ Task 3 (architecture.md: logging) | dự kiến logger trong `apps/api`; chờ Task 5 | chờ Task 5 |

## 3. Thống kê và quy tắc kiểm

- **Số dòng:** 32 dòng FR (21 Must, 1 Could, 10 Won’t bản nộp) và 20 dòng NFR (16 Must, 2 Should, 2 Could).
- **MoSCoW:** FR Must: FR-01 đến FR-16, FR-20 đến FR-24 (21); FR Could: FR-25 (1); FR Won’t bản nộp: FR-17/18/19/26/27, FR-28 đến FR-32 (10). NFR Must: 16 (NFR-04 đến NFR-19); NFR Should: NFR-01, NFR-20 (2); NFR Could: NFR-02, NFR-03 (2).
- **Quy tắc đề A2 §8.1 và kế hoạch mục C:** mọi `FR-xx` Must có ít nhất một dòng đủ 5 cột trước khi kết thúc Task 5; mọi endpoint của `apps/api` xuất hiện trong ma trận; mọi mã test ghi ở đây phải tồn tại thật trong `apps/` hoặc `tests/`; cuối mỗi Sprint rà hai chiều (yêu cầu → test và test → yêu cầu) và ghi kết quả vào mô tả PR.
- **Dòng Won’t:** lý do/phạm vi theo SRS mục 1.4 và 5.9; giữ yêu cầu mô hình hóa hai lớp domain ở Task 2, không yêu cầu code/test tính năng mở rộng trong bản nộp.
- **Mẫu của đề A2 §8.1** (`FR-01 / US-01 Xem menu / Activity-01, Class-01 / GET /products / API-T01` và `FR-05 / UC-01 Thanh toán / Sequence-01 / POST /payments / INT-T03`) chỉ minh họa định dạng; mã yêu cầu thật của nhóm là bảng ở trên.

Các phụ thuộc minimum: FR-22 → FR-23/24. FR-25 (Could) không là phụ thuộc của luồng Must; BR-03 chỉ hoàn kho khi đơn `CANCELLED`. NFR-05 chỉ kiểm endpoint đã triển khai; NFR-16 chỉ cần seed minimum. Test E1b phải chứng minh số Order không tăng và tồn kho không bị trừ thêm sau đăng nhập lại (AC-F10.4); máy trạng thái kiểm 8/49 cặp hợp lệ ở minimum (AC-F23.1).

# Ma trận truy vết (đề A2 §8.1)

> **Baseline Task 1 theo phạm vi minimum đã chốt trong PR #5; bổ sung source/test Sprint 1 trên `a2/Task4` ngày 2026-10-19.** Các đường dẫn Task 4 là bản nháp local, chưa chứng minh đã merge hoặc nghiệm thu. Cột thiết kế vẫn chờ Task 2–3; tính năng Task 5 và các phép đo NFR chưa chạy giữ trạng thái chờ. Xem [checkpoint Task 4](checkpoints/2026-10-19-task4.md).
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
| FR-01 | UC-01 Xem menu và chi tiết món | chờ Task 2 | `GET /products` — `apps/api/src/catalog/`; `apps/web/src/components/menu/MenuScreen.tsx`, `ProductCard.tsx`; `apps/api/prisma/seed.ts` | `apps/api/test/products.e2e-spec.ts`: API-T01 (HTTP/provider giả); web: `src/components/menu/MenuScreen.test.tsx` UNIT-T04, `ProductCard.test.tsx` UNIT-T03; `src/lib/format.test.ts` UNIT-T01, `stock.test.ts` UNIT-T02. Seed đủ 8 món được kiểm riêng trên DB local; chưa kiểm DB trống tự động |
| FR-02 | UC-01 Xem menu và chi tiết món | chờ Task 2 | `apps/web/src/components/menu/MenuScreen.tsx`, `apps/web/src/lib/api.ts` | `apps/web/src/components/menu/MenuScreen.test.tsx`: UNIT-T04 loading, UNIT-T05 empty, UNIT-T06 mất mạng/retry, UNIT-T07 HTTP 503/retry; API-T04 tại `apps/api/test/products.e2e-spec.ts` kiểm API rỗng. Chưa đo ngưỡng loading 200 ms |
| FR-03 | UC-01 Xem menu và chi tiết món | chờ Task 2 | `GET /products/:id` — `apps/api/src/catalog/catalog.controller.ts`, `catalog.service.ts`; UI chi tiết chờ Task 5 | `apps/api/test/products.e2e-spec.ts`: API-T02 (200), API-T03 (404 PRODUCT_NOT_FOUND). AC-F03.3 UI chưa hiện thực |
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
| FR-15 | UC-04.2, UC-04.5; UC-04 (ngoại lệ E3, thay thế A3) | chờ Task 2 (Activity: nhánh thanh toán thất bại; Sequence: `alt` thất bại) | dự kiến `POST /payments` trả 402/502; chờ Task 5 | chờ Task 4–5 |
| FR-16 | UC-04.2, UC-04.5; UC-04 (ngoại lệ E4) | chờ Task 2 (Sequence: idempotency; Class: `Payment.idempotencyKey`) | dự kiến `POST /payments` với header `Idempotency-Key`; chờ Task 5 | chờ Task 4–5 |
| FR-17 | Won’t bản nộp: UC-04.3; A1/E5 | Task 2 bắt buộc lớp `Promotion`, không cần luồng áp mã | không hiện thực trong bản nộp | AC mở rộng chỉ áp dụng khi được phê duyệt đưa lại vào phạm vi |
| FR-18 | Won’t bản nộp: UC-04.4 | Task 2 bắt buộc lớp `LoyaltyTransaction`, không cần luồng ghi điểm | không hiện thực trong bản nộp | AC mở rộng chỉ áp dụng khi được phê duyệt đưa lại vào phạm vi |
| FR-19 | Won’t bản nộp: UC-08; phụ thuộc FR-18 | ngoài bản nộp | không hiện thực trong bản nộp | AC mở rộng chỉ áp dụng khi được phê duyệt đưa lại vào phạm vi |
| FR-20 | UC-04 (bước 16); UC-05 Xem lịch sử và theo dõi đơn | chờ Task 2 | dự kiến màn xác nhận trong `apps/web`, `GET /orders/:id`; chờ Task 5 | chờ Task 4–5 |
| FR-21 | UC-05 Xem lịch sử và theo dõi đơn | chờ Task 2 | dự kiến `GET /orders/me`; chờ Task 5 | chờ Task 4–5 |
| FR-22 | UC-05 Xem lịch sử và theo dõi đơn | chờ Task 2 | dự kiến `GET /orders/:id`; chờ Task 5 | chờ Task 4–5 |
| FR-23 | UC-07 Cập nhật trạng thái đơn | chờ Task 2 (Class: enum `OrderStatus`, 8 chuyển minimum; State-01 tùy chọn) | dự kiến hàm kiểm chuyển trạng thái trong module orders; chờ Task 5 | chờ Task 4–5 |
| FR-24 | UC-07 Cập nhật trạng thái đơn (Must) | chờ Task 2 | dự kiến `GET /orders/:id`, `PATCH /orders/:id` (Barista), Postman collection; chờ Task 5 | chờ Task 5: AC-F24.1–4; không yêu cầu Swagger UI |
| FR-25 | UC-06 Hủy đơn; UC-04 (thay thế A5) | chờ Task 2 | dự kiến `PATCH /orders/:id` (Customer hủy); chờ Task 5 | chờ Task 4–5 |
| FR-26 | Won’t bản nộp: UC-06 mở rộng; đảo điểm chỉ khi có FR-18 | Task 2: PAID → CANCELLED không hợp lệ trong minimum | không hiện thực trong bản nộp | AC mở rộng chỉ áp dụng khi được phê duyệt đưa lại vào phạm vi |
| FR-27 | Won’t bản nộp: UC-07 mở rộng: hàng đợi | ngoài bản nộp | không hiện thực trong bản nộp | AC mở rộng chỉ áp dụng khi được phê duyệt đưa lại vào phạm vi |
| FR-28 | Won't: quản trị menu (ngoài phạm vi) | không thực hiện (lý do ở SRS mục 5.9) | không thực hiện | không thực hiện |
| FR-29 | Won't: quản trị kho (ngoài phạm vi) | không thực hiện (lý do ở SRS mục 5.9) | không thực hiện | không thực hiện |
| FR-30 | Won't: quản trị voucher (ngoài phạm vi); dữ liệu `Promotion` vẫn có trong mô hình | không thực hiện (lý do ở SRS mục 5.9) | không thực hiện | không thực hiện |
| FR-31 | Won't: thanh toán thật (ngoài phạm vi) | không thực hiện (lý do ở SRS mục 5.9) | không thực hiện | không thực hiện |
| FR-32 | Won't: đổi/trừ điểm thưởng (ngoài phạm vi) | không thực hiện (lý do ở SRS mục 5.9) | không thực hiện | không thực hiện |

## 2. Yêu cầu phi chức năng (NFR)

Cột "Use-case/User Story" của NFR ghi use-case chịu tác động chính và kiểu đo.

| Mã yêu cầu | Use-case/User Story | Thiết kế/Sơ đồ | Code/API | Test |
|---|---|---|---|---|
| NFR-01 | UC-01; đo thời gian p95 `GET /products`, `GET /products/:id` | chờ Task 3 | `apps/api/src/catalog/` đã có hai endpoint | Chưa đo p95; HTTP smoke local không thay thế kiểm hiệu năng |
| NFR-02 | UC-01; đo Lighthouse (LCP, Performance) trang menu | chờ Task 3 | `apps/web/src/app/page.tsx`, `apps/web/src/components/menu/MenuScreen.tsx` | Chưa chạy Lighthouse/LCP; UNIT-T04 chỉ kiểm trạng thái loading |
| NFR-03 | UC-04; đo thời gian p95 `POST /orders`, `POST /payments` | chờ Task 3 | dự kiến `POST /orders`, `POST /payments`; chờ Task 5 | chờ Task 4–5 |
| NFR-04 | UC-03; kiểm mẫu băm bcrypt, không lộ mật khẩu | chờ Task 3 | dự kiến `POST /auth/register`; chờ Task 5 | chờ Task 4–5 |
| NFR-05 | UC-03, UC-04, UC-05, UC-06, UC-07; kiểm ma trận quyền 401/403 | chờ Task 2 (Sequence: kiểm JWT), chờ Task 3 | dự kiến JWT guard và role guard trong `apps/api`; chờ Task 5 | chờ Task 4–5 |
| NFR-06 | UC-03, UC-04; kiểm 400 `VALIDATION_ERROR`, không tin giá client | chờ Task 2 (Sequence: validate) | dự kiến DTO validation `apps/api`, form validation `apps/web`; chờ Task 5 | chờ Task 4–5 |
| NFR-07 | Toàn hệ thống; quét secret, kiểm CORS, kiểm log | chờ Task 3 (ADR, deployment: secret/biến môi trường) | `.gitignore`, `.env.example`, `apps/api/.env.example`, `apps/web/.env.example`, `apps/api/src/app.setup.ts`, `apps/api/src/common/api-exception.filter.ts` | API-T05 kiểm HTTP 500 không lộ lỗi DB; kiểm ignore/env local trong checkpoint. Chưa kiểm toàn bộ CORS/log/secret theo NFR-07 |
| NFR-08 | Toàn hệ thống; kiểm HTTPS và DB không public | chờ Task 3 (Deployment-01: HTTPS, kết nối nội bộ) | cấu hình nền tảng; chờ Task 5 | chờ Task 5 |
| NFR-09 | UC-01 đến UC-05; kiểm khung nhìn 360 px, vùng chạm 44 px | chờ Task 3 | Menu: `apps/web/src/components/menu/MenuScreen.module.css`, `ProductCard.module.css`; màn khác chờ Task 5 | Có CSS responsive; chưa kiểm trực quan 360 px/vùng chạm toàn bộ màn, chưa nghiệm thu AC-N09 |
| NFR-10 | Toàn hệ thống (web); kiểm Lighthouse Installable | chờ Task 3 | dự kiến manifest và service worker trong `apps/web`; chờ Task 5 | chờ Task 4–5 |
| NFR-11 | UC-01, UC-05; kiểm ba trạng thái loading/empty/error | chờ Task 3 | Menu: `apps/web/src/components/menu/MenuScreen.tsx`; màn khác chờ Task 5 | Menu: `apps/web/src/components/menu/MenuScreen.test.tsx` UNIT-T04–T07; chưa phủ màn Task 5 |
| NFR-12 | UC-01 đến UC-05; kiểm E2E Chromium và chạy tay trên 4 trình duyệt | chờ Task 3 | dự kiến `apps/web`; chờ Task 5 | chờ Task 5 |
| NFR-13 | UC-04 (ngoại lệ E2, E4, E8); kiểm transaction, đồng thời | chờ Task 2 (Sequence: transaction), chờ Task 3 (ADR 005) | dự kiến module orders, payments; chờ Task 5 | chờ Task 5 |
| NFR-14 | Triển khai; kiểm `docker compose up` trên máy sạch | chờ Task 3 (Deployment-01: vùng Local) | dự kiến `docker-compose.yml`, Dockerfile; chờ Task 5 | chờ Task 5 |
| NFR-15 | Triển khai; kiểm `GET /health` 200/503 | chờ Task 3 (ADR, deployment: health check) | dự kiến `GET /health`; chờ Task 5 | chờ Task 5 |
| NFR-16 | Triển khai; kiểm migration/seed tái tạo DB; minimum không seed khuyến mãi | chờ Task 3 (ADR 003) | `apps/api/prisma/schema.prisma`, `migrations/20261019000000_init/migration.sql`, `seed.ts` (8 món); tài khoản demo chờ Task 5 | DB local schema up to date, API đọc đủ 8 món; chưa chạy migration/seed hai lần trên DB trống, chưa đạt đầy đủ AC-N16.1–3 |
| NFR-17 | Triển khai; kiểm pipeline CI xanh và đỏ | chờ Task 3 (Deployment-01: vùng CI) | `.github/workflows/ci.yml`, `.nvmrc`, `CONTRIBUTING.md` | Kiểm local ghi ở `docs/evidence/ci/`; chưa có run GitHub xanh/đỏ hoặc xác minh branch protection chặn merge. AC-N17.2 chưa đạt |
| NFR-18 | Triển khai; kiểm pipeline CD, smoke test, rollback | chờ Task 3 (ADR 004, Deployment-01) | dự kiến `.github/workflows/cd.yml`, `docs/deployment.md`; chờ Task 5 | chờ Task 5 |
| NFR-19 | Triển khai; kiểm URL production sống và người ngoài nhóm chạy theo README | chờ Task 3 (Deployment-01) | dự kiến `README.md`, nền tảng production; chờ Task 5 | chờ Task 5 |
| NFR-20 | Triển khai; kiểm log JSON mỗi yêu cầu | chờ Task 3 (architecture.md: logging) | dự kiến logger trong `apps/api`; chờ Task 5 | chờ Task 5 |

## 3. Thống kê và quy tắc kiểm

- **Số dòng:** 32 dòng FR (22 Must, 10 Won’t bản nộp) và 20 dòng NFR.
- **MoSCoW:** FR Must: FR-01 đến FR-16, FR-20 đến FR-25 (22); FR Won’t bản nộp: FR-17/18/19/26/27, FR-28 đến FR-32 (10). NFR Must: 16 (NFR-01, NFR-04 đến NFR-09, NFR-11 đến NFR-19); NFR Should: NFR-02, NFR-03, NFR-10, NFR-20 (4).
- **Quy tắc đề A2 §8.1 và kế hoạch mục C:** mọi `FR-xx` Must có ít nhất một dòng đủ 5 cột trước khi kết thúc Task 5; mọi endpoint của `apps/api` xuất hiện trong ma trận; mọi mã test ghi ở đây phải tồn tại thật trong `apps/` hoặc `tests/`; cuối mỗi Sprint rà hai chiều (yêu cầu → test và test → yêu cầu) và ghi kết quả vào mô tả PR.
- **Dòng Won’t:** lý do/phạm vi theo SRS mục 1.4, 5.6, 5.8 và 5.9; giữ yêu cầu mô hình hóa hai lớp domain ở Task 2, không yêu cầu code/test tính năng mở rộng trong bản nộp.
- **Mẫu của đề A2 §8.1** (`FR-01 / US-01 Xem menu / Activity-01, Class-01 / GET /products / API-T01` và `FR-05 / UC-01 Thanh toán / Sequence-01 / POST /payments / INT-T03`) chỉ minh họa định dạng; mã yêu cầu thật của nhóm là bảng ở trên.

Các phụ thuộc minimum: FR-22 → FR-23/24; FR-15, BR-03 → FR-25. NFR-05 chỉ kiểm endpoint đã triển khai; NFR-16 chỉ cần seed minimum. Test E1b phải chứng minh số Order không tăng và tồn kho không bị trừ thêm sau đăng nhập lại (AC-F10.4); máy trạng thái kiểm 8/49 cặp hợp lệ ở minimum (AC-F23.1).

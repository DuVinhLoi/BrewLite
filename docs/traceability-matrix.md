# Ma trận truy vết (đề A2 §8.1)

> **BREW-INVENTORY-01:** cập nhật FR-25/29 Must và nguyên liệu cho Task 1–5. Bộ test dự án được loại khỏi bản phân phối cuối theo yêu cầu người dùng **sau kiểm chứng**; đường dẫn/test ID cũ bên dưới là truy vết bằng chứng lịch sử, không cam kết suite còn được giao. Kết quả inventory thực chạy và giới hạn tại [inventory-verification.md](inventory-verification.md).

> **Baseline Task 1 theo SRS mục 1.4 mới nhất.** Cột thiết kế theo Task 2–3 (ô "chờ Task 3" điền ở B10); cột Code/API và Test theo source Task 5 trên `feat/assignment2-task5-delivery`, riêng FR-02 và NFR-17 theo Task 4 (PR #9). Các đường dẫn code/test không thay thế nghiệm thu. Xem [checkpoint Task 4](checkpoints/2026-10-19-task4.md).
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

| Mã yêu cầu | Use-case/User Story | Thiết kế/Sơ đồ | Code/API hiện hành | Kiểm chứng / ID lịch sử (suite đã loại khỏi bản cuối) |
|---|---|---|---|---|
| FR-01 | UC-01 Xem menu và chi tiết món | Class-01 Product/Ingredient/Recipe; UC-10 | `GET /products` — `apps/api/src/catalog/`; `apps/web/src/components/menu/MenuScreen.tsx`, `ProductCard.tsx`; `apps/api/prisma/seed.ts` | bằng chứng trước cleanup: API-T01 (HTTP/provider giả); web: bằng chứng trước cleanup UNIT-T04, bằng chứng trước cleanup UNIT-T03; bằng chứng trước cleanup UNIT-T01, bằng chứng trước cleanup UNIT-T02. Seed đủ 8 món được kiểm riêng trên DB local; chưa kiểm DB trống tự động |
| FR-02 | UC-01 Xem menu và chi tiết món | chờ Task 2 | `apps/web/src/components/menu/MenuScreen.tsx`, `apps/web/src/lib/api.ts` | bằng chứng trước cleanup: UNIT-T04 loading, UNIT-T05 empty, UNIT-T06 mất mạng/retry, UNIT-T07 HTTP 503/retry; API-T04 tại bằng chứng trước cleanup kiểm API rỗng |
| FR-03 | UC-01 Xem menu và chi tiết món | Class-01 Product/Recipe; UC-01 | `GET /products/:id`; `apps/web/src/components/shop/ProductDetail.tsx` | API-T02/03; E2E-S2-01; UI error/not-found được hiện thực, chưa test browser riêng từng nhánh |
| FR-04 | UC-01 Xem menu và chi tiết món | Class-01 Recipe/RecipeLine; Activity-01 variant/cart availability | `GET /catalog/options`; `ProductDetail.tsx`; `apps/api/src/checkout/pricing.ts` | UNIT-S2-01, UNIT-S2-04; E2E-S2-01 |
| FR-05 | UC-02 Quản lý giỏ hàng | Activity-01 aggregate cart; Class-01 shared Ingredient | `apps/web/src/components/shop/ProductDetail.tsx`, `ShopProvider.tsx`; `apps/web/src/lib/shop.ts` | bằng chứng trước cleanup: P1-UI-01–16; bằng chứng trước cleanup: P1-CART-01–03; E2E-S2-01 reload giỏ. PR #23: AC-F05.1 → P1-UI-01; AC-F05.4 → P1-UI-02/03/04/07/11; AC-F05.5 → P1-CART-01/02, P1-UI-12/13; BR-02 → P1-CART-03, P1-UI-05/06/08/14 |
| FR-06 | UC-02 Quản lý giỏ hàng | chờ Task 2 | `apps/web/src/components/shop/CartScreen.tsx`; `shop.ts` | bằng chứng trước cleanup: UNIT-P2-01 hủy xác nhận, UNIT-P2-02 đồng ý giảm về 0, UNIT-P2-03 giảm 2 xuống 1 không hỏi, UNIT-P2-05 nút Xóa trực tiếp (PR #22); E2E-S2-01 tăng số lượng |
| FR-07 | UC-02 Quản lý giỏ hàng; UC-04 (bước 1) | chờ Task 2 | `CartScreen.tsx`; `ShopProvider.tsx`; `cartTotal` trong `shop.ts` | UNIT-P2-04 đơn giá/thành tiền/tổng giỏ (PR #22); UNIT-S2-04; E2E-S2-01/02/04 |
| FR-08 | UC-09 Đăng ký tài khoản | chờ Task 2 | `POST /auth/register`; `apps/api/src/auth/auth.service.ts`; `AuthScreen.tsx` | UNIT-S2-05 (từ chối role lạ); E2E-S2-01–06 tạo account thật qua API; validation từng ô UI chưa test riêng |
| FR-09 | UC-03 Đăng nhập | chờ Task 2 | `POST /auth/login`; `auth.service.ts`; `AuthScreen.tsx` | UNIT-S2-05; E2E-S2-01/06 login và login lại |
| FR-10 | UC-03; UC-04 (E1a chưa tạo đơn; E1b tiếp tục orderId cũ sau đăng nhập lại cùng tài khoản) | chờ Task 2 (Activity: nhánh chưa đăng nhập; Sequence: kiểm JWT và tiếp tục đơn cũ) | `apps/api/src/auth/auth.guard.ts`; `CheckoutScreen.tsx` lưu order/key theo tài khoản | UNIT-S2-05; INT-S2-02; E2E-S2-06 (401 rồi resume cùng key, không tạo thêm đơn) |
| FR-11 | UC-04.1 Tạo đơn hàng | Sequence-01 reserve transaction; Class-01 Order/OrderItem/OrderIngredient; ADR-006 | `POST /orders`; `apps/api/src/checkout/checkout.service.ts` transaction giữ kho/tạo đơn | INT-S2-01 (giá + tồn + rollback); E2E-S2-01/03 |
| FR-12 | UC-04.1 Tạo đơn hàng; UC-04 (ngoại lệ E6) | chờ Task 2 (Sequence: validate) | `apps/api/src/checkout/pricing.ts` parseItems; `CartScreen.tsx` | UNIT-S2-02; UNIT-S2-05; INT-S2-02 |
| FR-13 | UC-04.1; E2 thiếu nguyên liệu/công thức | Activity-01 nhánh shortage; Class-01 Ingredient/Recipe/OrderIngredient; ADR-006 | POST /inventory/availability tổng hợp giỏ; CheckoutService.create reserve transaction | AC-F13.1–5: Matcha 6 ly, giỏ dùng chung/topping, zero/missing recipes, rollback, tranh chấp lượng cuối; kết quả thực tế ở inventory-verification.md |
| FR-14 | UC-04.2 Thanh toán đơn hàng | Sequence-01 consume snapshot + Payment transaction; ADR-005/006 | `POST /payments`; `CheckoutService.pay`; `CheckoutScreen.tsx` tóm tắt giỏ/đơn, lỗi tại ô thẻ | UNIT-S2-03/05; INT-S2-03; bằng chứng trước cleanup: UNIT-P3-01/02 validation/reset, UNIT-P3-03/04 tóm tắt giỏ/đơn trả lại, UNIT-P3-05 decline (IDs từ source PR #24); E2E-S2-01/02/04 |
| FR-15 | UC-04.2, UC-04.5; UC-04 (ngoại lệ E3, thay thế A3) | Activity-01 decline; Sequence-01 unchanged reservation | `apps/api/src/checkout/payment.ts`; transaction ghi FAILED trước khi trả 402; `CheckoutScreen.tsx` giữ giỏ/đơn | UNIT-S2-03; INT-S2-04/07 decline và retry; UNIT-P3-05 một alert decline, giữ giỏ; E2E-S2-02 |
| FR-16 | UC-04.2, UC-04.5; UC-04 (E4); replay theo chủ đơn/`orderId`/key/`paymentMethod` (BR-05) | Sequence-01 replay without mutation; Class-01 Payment.idempotencyKey; ADR-005/006 | `CheckoutService.pay` advisory/row lock; fingerprint orderId + paymentMethod; tìm SUCCESS theo userId/orderId/key; unique một SUCCESS mỗi đơn; migration bỏ index key xuyên đơn | INT-S2-03 new key và key on other order; INT-S2-08 same key/method + different card replays; INT-S2-09 different method after PAID; INT-S2-10 legacy fingerprint replay; INT-S2-04/07 failed retry; E2E-S2-04/06 |
| FR-17 | Won’t bản nộp: UC-04.3; A1/E5 | Task 2 bắt buộc lớp `Promotion`, không cần luồng áp mã | không hiện thực trong bản nộp | AC mở rộng chỉ áp dụng khi được phê duyệt đưa lại vào phạm vi |
| FR-18 | Won’t bản nộp: UC-04.4 | Task 2 bắt buộc lớp `LoyaltyTransaction`, không cần luồng ghi điểm | không hiện thực trong bản nộp | AC mở rộng chỉ áp dụng khi được phê duyệt đưa lại vào phạm vi |
| FR-19 | Won’t bản nộp: UC-08; phụ thuộc FR-18 | ngoài bản nộp | không hiện thực trong bản nộp | AC mở rộng chỉ áp dụng khi được phê duyệt đưa lại vào phạm vi |
| FR-20 | UC-04 (bước 16); UC-05 Xem lịch sử và theo dõi đơn | chờ Task 2 | `GET /orders/:id`; `apps/web/src/components/shop/OrdersScreen.tsx` | E2E-S2-01/02/04 |
| FR-21 | UC-05 Xem lịch sử và theo dõi đơn | chờ Task 2 | `GET /orders/me` 50 đơn mới nhất; `OrdersScreen.tsx` | INT-S2-02 kiểm history của user khác rỗng; E2E-S2-01/03 |
| FR-22 | UC-05 Xem lịch sử và theo dõi đơn | chờ Task 2 | `OrdersScreen.tsx`: polling 5 giây, dừng request khi terminal, tiến trình có aria-current | E2E-S2-01 xác nhận; polling/terminal chưa test browser riêng |
| FR-23 | UC-07 Cập nhật trạng thái đơn | chờ Task 2 (Class: enum `OrderStatus`, 8 chuyển minimum; State-01 tùy chọn) | `apps/api/src/checkout/order-state.ts`; `CheckoutService.transition/pay` | UNIT-S2-06: đủ 49 cặp; INT-S2-05 |
| FR-24 | UC-07 Cập nhật trạng thái đơn (Must) | chờ Task 2 | `PATCH /orders/:id`; bằng chứng trước cleanup | INT-S2-05 kiểm role và 3 bước Barista; IDs trước cleanup; kiểm vận hành thủ công theo runbook |
| FR-25 | Must: UC-06; UC-04 A5 | State-01 hai chuyển CANCELLED; Sequence-01 snapshot release; ADR-006 | PATCH /orders/:id; owner PENDING/PAYMENT_FAILED; marker true giải phóng snapshot, false hoàn Product.stock | AC-F25.1–3: hủy/role/hủy lặp, snapshot sau sửa công thức, legacy; bằng chứng tại inventory-verification.md |
| FR-26 | Won’t bản nộp: UC-06 mở rộng | Task 2: PAID → CANCELLED không hợp lệ trong minimum | không hiện thực trong bản nộp | AC mở rộng chỉ áp dụng khi được phê duyệt đưa lại vào phạm vi |
| FR-27 | Won’t bản nộp: UC-07 mở rộng: hàng đợi | ngoài bản nộp | không hiện thực trong bản nộp | AC mở rộng chỉ áp dụng khi được phê duyệt đưa lại vào phạm vi |
| FR-28 | Won't: quản trị menu (ngoài phạm vi) | không thực hiện (lý do ở SRS mục 5.9) | không thực hiện | không thực hiện |
| FR-29 | Must: UC-10; UC-01/02/04 | UC-10; Class-01 Ingredient/Recipe/RecipeLine/StockMovement/OrderIngredient; ADR-006 | GET ingredients/movements/recipes; POST ingredient movements; PUT recipes; public availability; staff /inventory; Prisma migration/seed | AC-F29.1–6: receive/count/reason/role/unit, 6-cup demo, seed preservation, immutable snapshot và cutover; kết quả thực tại inventory-verification.md |
| FR-30 | Won't: quản trị voucher (ngoài phạm vi); dữ liệu `Promotion` vẫn có trong mô hình | không thực hiện (lý do ở SRS mục 5.9) | không thực hiện | không thực hiện |
| FR-31 | Won't: thanh toán thật (ngoài phạm vi) | không thực hiện (lý do ở SRS mục 5.9) | không thực hiện | không thực hiện |
| FR-32 | Won't: đổi/trừ điểm thưởng (ngoài phạm vi) | không thực hiện (lý do ở SRS mục 5.9) | không thực hiện | không thực hiện |

## 2. Yêu cầu phi chức năng (NFR)

Cột "Use-case/User Story" của NFR ghi use-case chịu tác động chính và kiểu đo.

| Mã yêu cầu | Use-case/User Story | Thiết kế/Sơ đồ | Code/API hiện hành | Kiểm chứng / ID lịch sử (suite đã loại khỏi bản cuối) |
|---|---|---|---|---|
| NFR-01 | Must: UC-01; đo thời gian p95 `GET /products`, `GET /products/:id` trên local | chờ Task 3 | `apps/api/src/catalog/` đã có hai endpoint | Chưa đo p95; HTTP smoke local không thay thế kiểm hiệu năng |
| NFR-02 | Could: UC-01; đo Lighthouse (LCP, Performance) trang menu | chờ Task 3 | `apps/web/src/app/page.tsx`, `apps/web/src/components/menu/MenuScreen.tsx` | Chưa chạy Lighthouse/LCP; UNIT-T04 chỉ kiểm trạng thái loading |
| NFR-03 | Could: UC-04; đo thời gian p95 `POST /orders`, `POST /payments` | chờ Task 3 | `POST /orders`, `POST /payments` trong `apps/api/src/checkout/` | Chưa đo p95 trên source cuối; kiểm chức năng integration không thay thế benchmark |
| NFR-04 | UC-09 (AC-N04.1: kiểm mẫu băm bcrypt khi đăng ký); toàn hệ thống đối với AC-N04.2 (không lộ mật khẩu/giá trị băm trong mọi phản hồi API và log) | chờ Task 3 | `auth.service.ts` bcrypt cost 12; seed opt-in demo users | E2E login account thật; chưa có bộ đo bcrypt timing |
| NFR-05 | UC-03, UC-04, UC-05, UC-06, UC-07; kiểm ma trận quyền 401/403 | chờ Task 2 (Sequence: kiểm JWT), chờ Task 3 | JWT HS256 secret env >=32, expiresIn 1h; AuthGuard; startup main.ts | UNIT-S2-05 (tamper, expired, role); INT-S2-02; E2E-S2-06 |
| NFR-06 | UC-03, UC-04, UC-09; kiểm 400 `VALIDATION_ERROR`, không tin giá client | chờ Task 2 (Sequence: validate) | `record/parseItems` validation; credentials validation; payment validation | UNIT-S2-02/05; INT-S2-02; chưa fuzz toàn bộ input |
| NFR-07 | Toàn hệ thống; kiểm các file Git theo dõi không chứa secret, `.gitignore` và `.env.example`, kiểm CORS, kiểm log | chờ Task 3 (ADR, deployment: secret/biến môi trường) | `.gitignore`, `.env.example`, `apps/api/.env.example`, `apps/web/.env.example`, `apps/api/src/app.setup.ts`, `apps/api/src/common/api-exception.filter.ts` | API-T05 kiểm HTTP 500 không lộ lỗi DB; kiểm ignore/env local trong checkpoint. Chưa kiểm toàn bộ CORS/log/secret theo NFR-07 |
| NFR-08 | Toàn hệ thống; kiểm HTTPS và DB không public | chờ Task 3 (Deployment-01: HTTPS, kết nối nội bộ) | Render API + Postgres Internal Database URL, DB IP allowlist; Vercel/Render HTTPS; `docs/deployment.md` | Pha A 23/10/2026: HTTPS web/health/products PASS, health database up, kiểm env DB nội bộ; bằng chứng tại report-task5 |
| NFR-09 | UC-01 đến UC-05; kiểm khung nhìn 360 px, vùng chạm 44 px | chờ Task 3 | Menu: `apps/web/src/components/menu/MenuScreen.module.css`, `ProductCard.module.css`; màn khác chờ Task 5 | Có CSS responsive; chưa kiểm trực quan 360 px/vùng chạm toàn bộ màn, chưa nghiệm thu AC-N09 |
| NFR-10 | Toàn hệ thống (web); kiểm web app manifest (AC-N10.1) | chờ Task 3 | `apps/web/src/app/manifest.ts`; `apps/web/public/icons/icon-192.png`, `icon-512.png`; service worker ngoài minimum | PR #22: HTTP manifest 200, name/short_name/start_url/display/theme_color; PNG 192/512 đúng kích thước; cần đối chiếu production release ở report |
| NFR-11 | UC-01, UC-05; kiểm ba trạng thái loading/empty/error | chờ Task 3 | Menu `MenuScreen.tsx`; `ProductDetail.tsx`, `CartScreen.tsx`, `CheckoutScreen.tsx`, `OrdersScreen.tsx` | UNIT-T04–T07; P1-UI-03/11 loading/stock boundary; UNIT-P3-01/05 lỗi thẻ/decline; chưa phủ mọi trạng thái của mọi màn |
| NFR-12 | UC-01–04; Chromium trước cleanup | Activity-01; Sequence-01; quy trình runbook | Trình duyệt/API chạy theo runbook; không giao suite trong bản cuối | E2E-S2-01–06 và CI PR #23 là bằng chứng lịch sử; kết quả inventory mới tại [verification](inventory-verification.md) |
| NFR-13 | UC-04 E2/E4/A5; transaction và cạnh tranh | Class-01, Activity-01, Sequence-01; ADR-006 | InventoryService + CheckoutService; recipe/ingredient/order locks; DB checks; snapshot; legacy marker | AC-N13.1, AC-F13.3; INT-S2 IDs lịch sử; kết quả kiểm rollback/oversell/replay/cancel mới tại [verification](inventory-verification.md) |
| NFR-14 | Triển khai; kiểm `docker compose up` trên máy sạch | chờ Task 3 (Deployment-01: vùng Local) | `docker-compose.yml`; Dockerfiles hai app | Compose build/up/health + smoke thực tế; kiểm persistence down/up trong verification.md |
| NFR-15 | Triển khai; kiểm `GET /health` 200/503 theo DB (AC-N15.1–2) | chờ Task 3 (ADR, deployment: health check) | `GET /health`; `HealthController` | UNIT-S2-05 DB-down 503 payload; Compose/API thật health 200 |
| NFR-16 | Migration/seed bảo toàn dữ liệu | ADR-003/006; runbook preflight/cutover | Prisma migrations additive; inventoryTracked false legacy / true new; zero-balance create-only ingredients/recipes | Kiểm migrate/seed twice trước cleanup và bảo toàn số dư/công thức; kết quả thực ở [verification](inventory-verification.md) |
| NFR-17 | Triển khai; kiểm pipeline CI xanh và đỏ | chờ Task 3 (Deployment-01: vùng CI) | `.github/workflows/ci.yml`, `.nvmrc`, `CONTRIBUTING.md` | [CI thật xanh PR #9, đỏ PR #10 và log](evidence/ci/github-runs.md), ngày 2026-10-21; Build bị skip khi test sai. Chưa xác minh branch protection chặn merge: repo private báo giới hạn gói, contributor không có admin. AC-N17.2 chưa đạt |
| NFR-18 | Triển khai; kiểm pipeline CD: smoke test chờ 200 có retry; rollback deploy lại image tag bản trước (AC-N18.2–3) | chờ Task 3 (ADR 004, Deployment-01) | `.github/workflows/cd.yml`; `apps/api/Dockerfile` migrate khi khởi động; `docs/deployment.md` Render image/Vercel CLI | Pha A deploy tay và HTTPS smoke PASS 23/10; tagRC1 đã push; manual release/rollback/restore smoke PASS27/10 (release-evidence.json); CD tự động thiếu secret, chưa PASS |
| NFR-19 | Triển khai; kiểm URL production sống và người ngoài nhóm chạy theo README | chờ Task 3 (Deployment-01) | `README.md`; `docs/deployment.md`; `docs/task5/release-notes.md`, review/retro | Pha A URL web https://brewlite-a2-web.vercel.app và API https://brewlite-a2-api.onrender.com hoạt động; release và bàn giao người ngoài nhóm cần bằng chứng trong report/release notes |
| NFR-20 | Triển khai; kiểm log JSON mỗi yêu cầu | chờ Task 3 (architecture.md: logging) | dự kiến logger trong `apps/api`; chờ Task 5 | chờ Task 5 |

## 3. Thống kê và quy tắc kiểm

- **Số dòng:** 32 dòng FR (23 Must, 0 Could, 9 Won’t bản nộp) và 20 dòng NFR (17 Must, 1 Should, 2 Could).
- **MoSCoW:** FR Must: FR-01 đến FR-16, FR-20 đến FR-25, FR-29 (23); FR Could: không; FR Won’t bản nộp: FR-17/18/19/26/27, FR-28/30/31/32 (9). NFR Must: 17 (NFR-01, NFR-04 đến NFR-19); NFR Should: NFR-20 (1); NFR Could: NFR-02, NFR-03 (2).
- **Quy tắc đề A2 §8.1 và kế hoạch mục C:** mọi `FR-xx` Must có ít nhất một dòng đủ 5 cột trước khi kết thúc Task 5; mọi endpoint của `apps/api` xuất hiện trong ma trận; mã test/đường dẫn lịch sử phải có trong revision đã kiểm; bản phân phối cuối không chứa suite theo yêu cầu người dùng, nên đối chiếu báo cáo verification và lịch sử git; cuối mỗi Sprint rà hai chiều (yêu cầu → test và test → yêu cầu) và ghi kết quả vào mô tả PR.
- **Dòng Won’t:** lý do/phạm vi theo SRS mục 1.4 và 5.9; giữ yêu cầu mô hình hóa hai lớp domain ở Task 2, không yêu cầu code/test tính năng mở rộng trong bản nộp.
- **Mẫu của đề A2 §8.1** (`FR-01 / US-01 Xem menu / Activity-01, Class-01 / GET /products / API-T01` và `FR-05 / UC-01 Thanh toán / Sequence-01 / POST /payments / INT-T03`) chỉ minh họa định dạng; mã yêu cầu thật của nhóm là bảng ở trên.

Các phụ thuộc minimum: FR-22 → FR-23/24. FR-25/29 là Must của increment; BR-03 giữ nguyên liệu khi tạo, tiêu thụ khi trả và giải phóng reserved khi hủy chưa trả. NFR-05 chỉ kiểm endpoint đã triển khai; NFR-16 chỉ cần seed minimum. Test E1b phải chứng minh số Order không tăng và tồn kho không bị trừ thêm sau đăng nhập lại (AC-F10.4); máy trạng thái kiểm 8/49 cặp hợp lệ ở minimum (AC-F23.1).

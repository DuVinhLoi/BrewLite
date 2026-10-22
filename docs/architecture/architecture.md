# Kiến trúc BrewLite — Task 3

> Đã đối chiếu SRS sau PR #11 (2026-10-21), quyết định D2/D3 và card Task 3; cập nhật 2026-10-22.

## 1. Phạm vi và nguồn yêu cầu

Tài liệu mô tả kiến trúc phân lớp theo đề A2 §5.1 và deployment theo §5.2. Nguồn nghiệp vụ là [SRS](../requirements/srs.md), đặc biệt BR-03, BR-05, §3.4 và các NFR; quyết định đồng bộ tại [handoff](../planning/handoff/2026-10-21-req-sync/README.md).

Bản minimum gồm menu/chi tiết, size/topping, giỏ hàng, đăng ký/đăng nhập, đặt đơn, thanh toán Ví/Thẻ mô phỏng, xác nhận, lịch sử và trạng thái đơn. Khuyến mãi, điểm thưởng và hủy đơn đã trả nằm ngoài minimum; hủy đơn chưa trả là FR-25 (Could). Các lớp domain ngoài luồng minimum vẫn có trong class diagram theo đề A2 §4.3.

Task 3 chốt thiết kế và ADR. Task 4/5 hiện thực mã nguồn, cấu hình nền tảng, đo hiệu năng và cung cấp minh chứng CI/CD; tài liệu này không xác nhận production đã triển khai hoặc rollback đã diễn tập.

## 2. Phương pháp và ranh giới hệ thống

Dùng kiến trúc phân lớp với container view: trình duyệt/PWA → Next.js Web → NestJS REST API → PostgreSQL. Payment Service mô phỏng là thành phần logic trong **tiến trình API**, không phải dịch vụ ngoài mạng.

Frontend chịu trách nhiệm hiển thị và trạng thái giỏ hàng; API là nơi quyết định giá, quyền truy cập, tồn kho, trạng thái đơn và replay thanh toán. PostgreSQL bảo đảm transaction và dữ liệu qua các lần restart. CI kiểm chất lượng; CD phát hành web trên Vercel và image API trên Render qua GHCR. Xem [Deployment-01](deployment.svg) và [nguồn PlantUML](deployment.puml).

## 3. Container và runtime view

| Thành phần | Trách nhiệm và ánh xạ mã nguồn | Runtime / giao tiếp |
|---|---|---|
| Thiết bị người dùng, Browser/PWA | Chạy web từ `apps/web`; state giỏ ở client, giữ đơn/key khi đăng nhập lại cùng tài khoản | HTTPS 443 tới Vercel và API; PWA manifest, không yêu cầu offline/service worker |
| Next.js Web | `apps/web`: mobile-first, trang menu/chi tiết, giỏ, checkout, lịch sử; loading/empty/error | Local :3000; production Vercel CDN/Edge; `NEXT_PUBLIC_API_URL` trỏ API HTTPS |
| NestJS API | `apps/api`: JWT, DTO, nghiệp vụ đơn và thanh toán, Prisma | Local :4000; Render Docker container :4000 sau HTTPS proxy 443; chỉ chấp nhận origin cấu hình |
| Payment mô phỏng | Thành phần logic trong `apps/api`, module `payments`; Ví/Thẻ mô phỏng, thành công/thất bại; không lưu trạng thái | Gọi nội bộ tiến trình; không lưu/log `cardNumber`; theo SRS §3.4 |
| PostgreSQL | Prisma schema/migrations/seed của `apps/api`; dữ liệu domain theo SRS §3.6 | Local :5432 với named volume; production Render Postgres, internal TCP 5432 và persistent storage |
| GHCR | Artifact build từ `apps/api/Dockerfile`, do `.github/workflows/cd.yml` phát hành | `ghcr.io/duvinhloi/brewlite-api:<commit-sha>`; Render pull qua HTTPS 443 |
| GitHub Actions CI/CD | `.github/workflows/ci.yml`, `cd.yml`; kiểm chất lượng, build/push/deploy/smoke | Runner tách production; Postgres tạm cho integration test, không kết nối DB production |
| Render logs | Nhận stdout JSON của `apps/api` | `LOG_LEVEL`; lọc dữ liệu nhạy cảm trước khi ghi |

Các đường dẫn trên là vị trí hiện thực của Task 4/5 theo contract, không sao chép mã từ branch phụ thuộc. Ba vùng local, CI và production tách bạch trên Deployment-01; GHCR là registry dùng bởi CD và Render.

## 4. Module, lớp và luồng dữ liệu

### Web

`apps/web` gồm route/page, component trình bày, state giỏ hàng và API client. Client kiểm email/mật khẩu, số thẻ demo và số lượng trước khi gửi; server vẫn kiểm lại. Thiết kế đáp ứng viewport 360×640, 390×844 và desktop 1280×800; vùng chạm chính ≥44×44 px, chữ nội dung ≥16 px. Mỗi màn tải API có loading, empty khi áp dụng, error tiếng Việt và nút thử lại.

### API theo domain

NestJS chia controller → service nghiệp vụ → Prisma/truy cập dữ liệu; DTO ở biên HTTP. Transaction thuộc service nghiệp vụ để giữ cùng ranh giới cập nhật đơn và tồn kho (ADR-002).

| Module | Trách nhiệm |
|---|---|
| `catalog` | `GET /products`, `GET /products/:id`; đọc sản phẩm, size/topping, mô tả và tồn kho |
| `auth` | Đăng ký/đăng nhập, băm mật khẩu, JWT, guard vai trò và quyền sở hữu |
| `orders` | Tính giá server, tạo đơn/giữ tồn trong transaction; lịch sử, chi tiết, kiểm chuyển trạng thái |
| `payments` | Ví/Thẻ mô phỏng, replay theo BR-05 ở API (ADR-005); cập nhật Payment và trạng thái đơn cùng transaction |
| `health` | `GET /health` kiểm DB, trả 200/503 (NFR-15) |
| Logging/cấu hình dùng chung | DTO whitelist, lỗi chuẩn SRS §3.2, log JSON, biến môi trường và CORS |

### Luồng đặt đơn và thanh toán

1. Browser tải web từ CDN, gọi API đọc menu/chi tiết; giỏ hàng chỉ là state của client.
2. Guest đi đăng nhập trước checkout; token hết hạn thì giữ giỏ, `orderId`, chủ đơn và key để tiếp tục đúng đơn sau khi đăng nhập lại cùng tài khoản (AC-F10.4).
3. `POST /orders`: kiểm DTO, quyền Customer, tính giá từ catalog; tạo `Order`, `OrderItem` và giữ tồn kho cùng transaction. Dùng `UPDATE … WHERE stock >= :n`; thiếu tồn ở một món thì rollback toàn bộ và trả 409 `OUT_OF_STOCK` (BR-03, FR-13).
4. `POST /payments`: kiểm xác thực/quyền sở hữu, replay nếu cùng chủ đơn + `orderId` + `Idempotency-Key` + `paymentMethod` đã thành công. `cardNumber` không dùng để so (D2). Yêu cầu mới chỉ xử lý với đơn `PENDING`/`PAYMENT_FAILED`.
5. Thành công: gọi simulator và lưu `Payment SUCCESS` + `Order PAID` cùng transaction, tối đa một lần thành công/đơn. Thất bại: lưu `FAILED`, giữ đơn và tồn, cho thử lại cùng key; cùng key trên đơn khác là yêu cầu mới (D3). Xem ADR-005 cho đồng thời và các nhánh 409.
6. Web xóa giỏ sau thành công và đọc lại `GET /orders/:id` cho biên lai; `GET /orders/me` chỉ trả đơn của chủ token.
7. Simulator không lưu trạng thái; API dừng giữa bước 13 và 14 của UC-04 là rủi ro chấp nhận (SRS §3.4).

### Lưu ý nhất quán

- `Product.description` có trong [class diagram](../diagrams/class-domain.puml) (D1).
- Giữ tồn khi tạo đơn, không giảm lần nữa khi thanh toán; thất bại vẫn giữ kho (BR-09).
- Đơn đã `PAID` nhận cùng key khác phương thức hoặc key mới: 409 `ORDER_NOT_PAYABLE`, không gọi simulator. Replay thành công được xét trước trạng thái.
- Tên domain, enum và chuyển trạng thái theo SRS §3.6 và sơ đồ Task 2; không tạo thêm hợp đồng API ở Task 3.

## 5. Thuộc tính chất lượng và cấu hình

### NFR-01: Thời gian phản hồi API đọc

Module `catalog` dùng truy vấn Prisma có phạm vi theo dữ liệu mẫu ≤50 sản phẩm. Đo trên docker-compose local: 100 yêu cầu tuần tự cho mỗi endpoint `GET /products` và `GET /products/:id`, p95 ≤500 ms (AC-N01.1). Không dùng cold start Render làm mốc đánh giá.

### NFR-03: Thời gian đặt đơn và thanh toán

`orders` giữ transaction ngắn, `payments` giới hạn simulator ≤500 ms; kiểm soát đồng thời theo đơn. Với dữ liệu mẫu trên local, đo 50 yêu cầu mỗi loại: p95 `POST /orders` ≤1 giây, `POST /payments` thành công ≤2 giây (AC-N03.1). Đây là mục tiêu cần Task 5 đo.

### NFR-04, NFR-05, NFR-07: Bảo mật

`auth` băm bcrypt cost ≥10 hoặc argon2; JWT đọc khóa ≥32 ký tự từ env, `exp` ≤3600 giây. Guard kiểm role và chủ đơn theo SRS; lỗi xác thực 401, sai quyền 403. Không trả/log mật khẩu, hash, token hay số thẻ. `.env` không commit; `.env.example` chỉ giá trị mẫu; CI che secret. `CORS_ORIGINS` là allow list origin Vercel.

NFR-06 được xử lý ở biên DTO với whitelist (trường lạ trả 400), truy vấn ORM có tham số và validation phía web (§4); client không được quyết định giá.

### NFR-08, NFR-14: Kết nối và môi trường

Web/API production dùng HTTPS 443. API chỉ truy cập Postgres qua internal URL, TCP 5432; tắt external access trên Render Postgres (ADR-004). Docker Compose local chạy web :3000, API :4000 và DB :5432 trong ≤5 phút; named volume giữ dữ liệu qua `down`/`up` không dùng `-v`.

### NFR-12: Trình duyệt và E2E

Luồng menu → giỏ → đăng nhập → thanh toán → xác nhận chạy bằng E2E tự động trên Chromium. Đưa E2E vào CI; yêu cầu dùng được trên trình duyệt theo SRS được kiểm ở §7.

### NFR-13: Transaction và tồn kho

Tạo đơn/OrderItem/giữ kho là một transaction, cập nhật có điều kiện; lỗi giữa chừng không để lại dữ liệu một phần. Xem ADR-005 §C và test đồng thời AC-F13.3; idempotency thanh toán theo BR-05/FR-16, không gán nhầm cho NFR về trình duyệt.

### NFR-15: Health check

`GET /health` kiểm kết nối DB, trả `{status, database}`: 200 `{"status":"ok","database":"up"}` trong ≤1 giây khi DB hoạt động; 503 `{"status":"error","database":"down"}` khi không kết nối được. Endpoint không cần token; Render cấu hình Health Check Path `/health`.

### NFR-16: Migration và seed

Prisma migration được version trong repo và chỉ thêm bảng/cột khi phát hành, không xóa/đổi tên cột, để image cũ vẫn chạy được khi rollback. Container API khởi động bằng `npx prisma migrate deploy && node dist/main.js`; migration lỗi thì API không bắt đầu phục vụ. CI dùng DB tạm để kiểm migration, không nối DB production.

Seed tái tạo đúng SRS §3.3: 8 sản phẩm, size/topping và 2 tài khoản demo; không seed khuyến mãi. Chạy seed hai lần không tăng số bản ghi. Seed là bước khởi tạo có chủ đích, không chạy lại mỗi lần production restart (ADR-003).

### NFR-17: CI

PR vào `develop-Assignment2` chạy Install → Lint → Unit Test → Build cho `apps/api` và `apps/web`. Check `ci` phải xanh mới merge; Task 4/5 cung cấp bằng chứng một lần xanh và một lần phát hiện lỗi. Integration test dùng Postgres tạm và E2E Chromium bổ sung vào CI theo §7.

### NFR-18, NFR-19: CD, rollback và bàn giao

Tag `a2-v*` chạy lint/test → build/push image SHA lên GHCR → deploy Render + Vercel. Migration chạy trong startup API. Sau cả hai deploy, smoke test `/health` (200 và `database = "up"`), `/products` và trang web; mỗi bước retry tối đa 10 phút, quá hạn pipeline đỏ và dừng.

Rollback bằng deploy hook Render với `imgURL` là image SHA trước và `vercel rollback` về web trước, sau đó chạy lại smoke test (AC-N18.3). Task 5 ghi URL HTTPS, ngày hết hạn DB free và minh chứng diễn tập trong README/`docs/deployment.md`; NFR-19 yêu cầu người ngoài nhóm chạy được theo hướng dẫn.

### NFR-20: Logging

API ghi một dòng JSON mỗi HTTP request: `timestamp`, `method`, `path`, `status`, `durationMs`, `requestId`. `LOG_LEVEL` điều khiển mức log; lỗi có stack đã lọc dữ liệu nhạy cảm. Stdout được Render thu vào log của service.

### Danh sách cấu hình

| Biến | Nơi dùng | Quy tắc |
|---|---|---|
| `DATABASE_URL` | API / Prisma | Local trỏ DB Compose; production là Render Internal Database URL, secret |
| `JWT_SECRET` | API | Secret ≥32 ký tự, không đưa vào web hay log |
| `CORS_ORIGINS` | API | Allow list origin web; production là origin Vercel |
| `NEXT_PUBLIC_API_URL` | Web khi build | URL API public HTTPS; không chứa secret |
| `LOG_LEVEL` | API | Mức log; giữ schema JSON và lọc dữ liệu nhạy cảm |
| `RENDER_DEPLOY_HOOK_URL` | GitHub environment production | Secret dùng deploy/rollback; không in URL vào log |
| `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` | GitHub environment production | Credential/định danh deploy Vercel theo CR-5.3 |
| `PRODUCTION_API_URL`, `PRODUCTION_WEB_URL` | GitHub Actions vars | URL cho smoke test, không phải secret |

Đây là tên cấu hình đã dùng trong contract handoff; Task 3 không bổ sung biến ép lỗi simulator. Nếu cần ép lỗi test, Task 5 chốt riêng; hai loại kết quả hiện dùng số thẻ demo của SRS §3.4.

## 6. Quyết định và trade-off

| ADR / quyết định | Lý do và ưu điểm | Hạn chế / đánh đổi |
|---|---|---|
| [ADR-001](adr/001-monorepo.md): monorepo | Web/API/docs cùng lịch sử và review, chia sẻ contract dễ | CI cần tách phạm vi, nhóm phải tuân thủ ownership để tránh xung đột |
| [ADR-002](adr/002-layered-nestjs.md): NestJS theo domain/lớp | Controller mỏng, nghiệp vụ và transaction tập trung, dễ test | Thêm cấu trúc so với app rất nhỏ; tránh tạo interface không cần thiết |
| [ADR-003](adr/003-containerization.md): Compose, Postgres, Prisma | Local/CI dùng DB thật; migration/seed tái tạo được | Tốn tài nguyên Docker, cần theo dõi startup; migration chỉ thêm giới hạn thay đổi schema |
| [ADR-004](adr/004-vercel-render.md): Vercel + Render + GHCR | CDN cho web, container API quản lý sẵn, image SHA chọn lại được | Hai nền tảng/secret/CORS; Render free cold start và DB có hạn dùng |
| [ADR-005](adr/005-idempotency-and-optimistic-lock.md): API replay, transaction kho | Retry thành công không gọi simulator lại; tránh tồn âm | Đồng bộ theo đơn; API dừng giữa bước 13 và 14 là rủi ro chấp nhận |
| Payment simulator trong API (ADR-005 §B) | Không cần vận hành dịch vụ thêm; kết quả demo lặp lại được | Không mô hình hóa thanh toán thật hoặc bảo đảm qua crash của cổng thu tiền thật |
| Next.js/PWA, ba trạng thái (§3–4) | Mobile-first, manifest và thông báo rõ khi API đang ngủ | Không hỗ trợ offline; phải kiểm viewport, hiệu năng và trạng thái lỗi |
| JSON stdout, env và health (§5, ADR-004) | Dễ thu log, phát hiện DB lỗi; cấu hình tách khỏi mã | Cần lọc dữ liệu nhạy cảm và cấu hình platform; health không thay thế smoke toàn luồng |

## 7. Kiểm chứng thiết kế và trách nhiệm hiện thực

- Task 3: render PlantUML, kiểm SVG, link nội bộ, thuật ngữ cũ, allowed paths và `python docs/validate_task2.py`. Đây là kiểm tài liệu/sơ đồ, không chứng minh runtime đáp ứng NFR.
- Task 4/5: unit test domain; integration với PostgreSQL thật cho rollback transaction, 10 yêu cầu tồn kho đồng thời và replay D2/D3; migration/seed hai lần trên DB trống.
- Task 5: E2E Chromium trong CI cho luồng chính, retry và giữ giỏ/đơn; kiểm mobile/desktop, loading/empty/error, PWA manifest. Đo NFR-01/NFR-03 trên Compose local, Lighthouse mobile cho NFR-02.
- Task 5/chủ repo: cấu hình branch protection, HTTPS, DB external access disabled, secret/CORS và log; lưu minh chứng smoke, rollback và URL production theo NFR-18/NFR-19.

## 8. Ánh xạ NFR sang thiết kế (đầu vào B10)

Bảng gồm **19 NFR chờ Task 3** (NFR-01–20 trừ NFR-06) theo card B10; NFR-06 đã được mô tả ở §4/§5. `Deployment-01` là [deployment.svg](deployment.svg), nguồn [deployment.puml](deployment.puml). B10 cập nhật cột Thiết kế/Sơ đồ trong PR riêng sau khi T2-M merge.

| NFR | Thiết kế / sơ đồ | Cách kiểm do Task 4/5 cung cấp |
|---|---|---|
| NFR-01 | architecture.md §4 `catalog`, §5; ADR-002 | p95 đọc trên docker-compose local |
| NFR-02 | architecture.md §3 Web Next.js, §4, §7 | Lighthouse mobile, loading khi API chậm |
| NFR-03 | architecture.md §4 `orders`/`payments`, §5; ADR-005 | p95 đặt đơn/thanh toán trên docker-compose local |
| NFR-04 | architecture.md §4 `auth`, §5; ADR-002 | Hash và quét response/log |
| NFR-05 | architecture.md §4 `auth`, §5; ADR-002, ADR-005 §A | JWT/role/chủ đơn, 401/403 |
| NFR-07 | architecture.md §5 cấu hình/log; ADR-004; Deployment-01 | Secret scan, log và CORS allow list |
| NFR-08 | architecture.md §3, §5; ADR-004; Deployment-01 | HTTPS; kết nối DB từ ngoài thất bại |
| NFR-09 | architecture.md §3 Web, §4, §7 | Viewport, vùng chạm, kích thước chữ |
| NFR-10 | architecture.md §3 Web PWA, §7 | Manifest và icon 192/512 |
| NFR-11 | architecture.md §3 Web, §4, §7 | Loading/empty/error tiếng Việt |
| NFR-12 | architecture.md §5, §7; Deployment-01 CI | E2E Chromium trong CI |
| NFR-13 | architecture.md §4, §5; ADR-005 §C | Transaction và 10 request tồn kho đồng thời |
| NFR-14 | architecture.md §3, §5; ADR-003; Deployment-01 local | Compose startup và volume qua restart |
| NFR-15 | architecture.md §4 `health`, §5; ADR-004; deployment.puml (smoke /health) | Health 200/503 theo kết nối DB |
| NFR-16 | architecture.md §5; ADR-003; Deployment-01 startup API | Migrate DB trống, seed hai lần, migration chỉ thêm |
| NFR-17 | architecture.md §5, §7; ADR-001; Deployment-01 CI | Install/Lint/Unit Test/Build; check ci |
| NFR-18 | architecture.md §5; ADR-004; Deployment-01 CD | Tag a2-v*, image SHA, smoke và rollback |
| NFR-19 | architecture.md §5, §7; ADR-004; Deployment-01 production | URL HTTPS trong README và bàn giao |
| NFR-20 | architecture.md §5; ADR-004; Deployment-01 Render logs | Schema JSON, LOG_LEVEL, lọc dữ liệu nhạy cảm |

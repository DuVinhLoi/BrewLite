# Kiến trúc BrewLite — Task 3

> BREW-INVENTORY-01 (2026-10-29) cập nhật kho nguyên liệu cho Assignment 2 Task 1–5. Hợp đồng: [inventory-contract.md](../inventory-contract.md); bằng chứng runtime nằm trong [verification](../inventory-verification.md).
>
> VNPay sandbox (2026-10-29, theo yêu cầu của giảng viên): thanh toán đi qua cổng ngoài thay cho Payment Service mô phỏng. Kế hoạch: [vnpay-payment-plan](../planning/2026-10-29-vnpay-payment-plan.md); quyết định kiến trúc sẽ ghi ở ADR-007 (chưa soạn). Các mục dưới đây đã đổi theo hướng đó; phần SRS, ADR-005 và truy vết cập nhật ở bước sau của kế hoạch.

## 1. Phạm vi và nguồn yêu cầu

Tài liệu mô tả kiến trúc phân lớp theo đề A2 §5.1 và deployment theo §5.2. Nguồn nghiệp vụ là [SRS](../requirements/srs.md), đặc biệt BR-03, BR-05, §3.4 và các NFR; quyết định đồng bộ tại [handoff](../planning/handoff/2026-10-21-req-sync/README.md).

Bản minimum gồm menu/chi tiết, size/topping, giỏ hàng, đăng ký/đăng nhập, đặt đơn, thanh toán Ví/Thẻ qua VNPay sandbox, xác nhận, lịch sử và trạng thái đơn. Khuyến mãi, điểm thưởng và hủy đơn đã trả nằm ngoài minimum; hủy đơn chưa trả và quản lý nguyên liệu/công thức là FR-25/29 Must của increment này. Các lớp domain ngoài luồng minimum vẫn có trong class diagram theo đề A2 §4.3.

Task 3 chốt thiết kế và ADR. Task 4/5 hiện thực mã nguồn, cấu hình nền tảng, đo hiệu năng và cung cấp minh chứng CI/CD; tài liệu này không xác nhận production đã triển khai hoặc rollback đã diễn tập.

## 2. Phương pháp và ranh giới hệ thống

Dùng kiến trúc phân lớp với container view: trình duyệt/PWA → Next.js Web → NestJS REST API → PostgreSQL. **VNPay sandbox** là hệ thống ngoài, nằm ngoài ranh giới BrewLite: trình duyệt được chuyển hướng sang VNPay để trả tiền, VNPay gọi ngược vào API (IPN) và API gọi ra VNPay để tra cứu kết quả (QueryDR). Cả ba luồng đều qua HTTPS.

Frontend chịu trách nhiệm hiển thị và trạng thái giỏ hàng; API là nơi quyết định giá, quyền truy cập, tồn kho, trạng thái đơn, replay thanh toán và xác thực kết quả từ VNPay. PostgreSQL bảo đảm transaction và dữ liệu qua các lần restart. CI kiểm chất lượng; CD phát hành web trên Vercel và image API trên Render qua GHCR. Xem [Deployment-01](deployment.svg) và [nguồn PlantUML](deployment.puml).

## 3. Container và runtime view

| Thành phần | Trách nhiệm và ánh xạ mã nguồn | Runtime / giao tiếp |
|---|---|---|
| Thiết bị người dùng, Browser/PWA | Chạy web từ `apps/web`; state giỏ ở client, giữ đơn/key khi đăng nhập lại cùng tài khoản | HTTPS 443 tới Vercel, API và (khi thanh toán) trang VNPay sandbox qua redirect; PWA manifest, không yêu cầu offline/service worker |
| Next.js Web | `apps/web`: mobile-first, trang menu/chi tiết, giỏ, checkout, trang nhận kết quả từ VNPay (`/payment/vnpay-return`), lịch sử; loading/empty/error | Local :3000; production Vercel CDN/Edge; `NEXT_PUBLIC_API_URL` trỏ API HTTPS |
| NestJS API | `apps/api`: JWT, DTO, nghiệp vụ đơn và thanh toán, Prisma; endpoint IPN/return công khai cho VNPay | Local :4000; Render Docker container :4000 sau HTTPS proxy 443; chỉ chấp nhận origin cấu hình |
| VNPay sandbox (hệ thống ngoài) | Cổng thanh toán bên thứ ba, không thuộc mã nguồn BrewLite; module `payments` trong `apps/api` ký URL thanh toán, nhận IPN, kiểm return và gọi QueryDR | HTTPS 443, ba luồng: trình duyệt ↔ VNPay (redirect), VNPay → API (IPN), API → VNPay (QueryDR); không nhận/lưu/log số thẻ; xem mục "Tích hợp VNPay sandbox" |
| PostgreSQL | Prisma schema/migrations/seed của `apps/api`; dữ liệu domain theo SRS §3.6 | Local :5432 với named volume; production Render Postgres, internal TCP 5432 và persistent storage |
| GHCR | Artifact build từ `apps/api/Dockerfile`, do `.github/workflows/cd.yml` phát hành | `ghcr.io/duvinhloi/brewlite-api:<commit-sha>`; Render pull qua HTTPS 443 |
| GitHub Actions CI/CD | `.github/workflows/ci.yml`, `cd.yml`; kiểm chất lượng, build/push/deploy/smoke | Runner tách production; lint/build trong bản cuối; kiểm chứng DB trước cleanup ghi ở inventory-verification.md |
| Render logs | Nhận stdout JSON của `apps/api` | `LOG_LEVEL`; lọc dữ liệu nhạy cảm trước khi ghi |

Các đường dẫn trên là vị trí hiện thực của Task 4/5 theo contract, không sao chép mã từ branch phụ thuộc. Ba vùng local, CI và production tách bạch trên Deployment-01; GHCR là registry dùng bởi CD và Render. VNPay sandbox nằm ngoài các vùng này, chỉ nối với production qua HTTPS.

### Tích hợp VNPay sandbox

Bốn đường HTTPS giữa BrewLite và hệ thống ngoài VNPay (đánh số khớp Deployment-01):

| Đường | Hướng | Nội dung |
|---|---|---|
| (10) Redirect thanh toán | Trình duyệt → VNPay | `POST /payments` trả `paymentUrl` đã ký (HMAC-SHA512); web chuyển hướng trình duyệt sang trang VNPay, khách nhập thẻ test tại đó |
| (11) IPN | VNPay → API | `GET /payments/vnpay/ipn` công khai, server-to-server; nguồn thông báo kết quả chính. API kiểm chữ ký, merchant, số tiền rồi trả `RspCode` cho VNPay (luôn HTTP 200) |
| (12) Return | VNPay → trình duyệt → web | VNPay chuyển trình duyệt về `/payment/vnpay-return` trên web; trang chỉ kiểm chữ ký qua `GET /payments/vnpay/return` và hiển thị, rồi đọc trạng thái đơn từ DB |
| (13) QueryDR | API → VNPay | `POST /payments/:id/sync` (khách chủ đơn) hoặc đối soát payment quá hạn: API hỏi `VNP_API_URL`, đối soát theo SRS rồi áp kết quả qua cùng hàm với IPN. Lỗi mạng/chữ ký/cấu hình trả 502 `PAYMENT_PROVIDER_ERROR`, không đổi DB |

Nguyên tắc: chỉ IPN hoặc QueryDR đã xác thực quyết định thanh toán thành công/thất bại (BR-11); return URL không đổi trạng thái. Cuộc gọi HTTP ra VNPay luôn nằm ngoài DB transaction giữ khóa đơn. Render free tier có thể đang ngủ khi VNPay gọi IPN: VNPay gọi lại (tối đa 10 lần, cách 5 phút) và QueryDR bù khi khách mở lại trang kết quả. Local không nhận được IPN vì VNPay không gọi được `localhost`, nên local dựa vào QueryDR.

## 4. Module, lớp và luồng dữ liệu

### Web

`apps/web` gồm route/page, component trình bày, state giỏ hàng và API client. Client kiểm email/mật khẩu, số thẻ demo và số lượng trước khi gửi; server vẫn kiểm lại. Thiết kế đáp ứng viewport 360×640, 390×844 và desktop 1280×800; vùng chạm chính ≥44×44 px, chữ nội dung ≥16 px. Mỗi màn tải API có loading, empty khi áp dụng, error tiếng Việt và nút thử lại.

### API theo domain

NestJS chia controller → service nghiệp vụ → Prisma/truy cập dữ liệu; DTO ở biên HTTP. Transaction thuộc service nghiệp vụ để giữ cùng ranh giới cập nhật đơn và tồn kho (ADR-002).

| Module | Trách nhiệm |
|---|---|
| `catalog` | Đọc sản phẩm/size/topping; stock trả ra là số ly S không topping từ inventory, không đọc số ly legacy làm khả năng bán |
| `inventory` | Decimal balances, availability tổng hợp giỏ, công thức, movement Barista, reserve/consume/release snapshot; dùng transaction do checkout cung cấp |
| `auth` | Đăng ký/đăng nhập, băm mật khẩu, JWT, guard vai trò và quyền sở hữu |
| `orders` | Tính giá server, tạo đơn/giữ tồn trong transaction; lịch sử, chi tiết, kiểm chuyển trạng thái |
| `payments` | Tạo `Payment PENDING` và URL VNPay, nhận IPN/return, đối soát QueryDR, replay theo BR-05 ở API (ADR-005); cập nhật Payment, trạng thái đơn và kho cùng transaction. Chỉ phần cần đăng nhập mới gắn guard; IPN/return công khai |
| `health` | `GET /health` kiểm DB, trả 200/503 (NFR-15) |
| Logging/cấu hình dùng chung | DTO whitelist, lỗi chuẩn SRS §3.2, log JSON, biến môi trường và CORS |

### Luồng đặt đơn và thanh toán

1. Browser tải web từ CDN, gọi API đọc menu/chi tiết; giỏ hàng chỉ là state của client.
2. Guest đi đăng nhập trước checkout; token hết hạn thì giữ giỏ, `orderId`, chủ đơn và key để tiếp tục đúng đơn sau khi đăng nhập lại cùng tài khoản (AC-F10.4).
3. `POST /orders`: kiểm DTO/quyền, tính giá server; khóa recipe theo ID, đọc base+size+topping, cộng nhu cầu toàn giỏ, khóa ingredient theo ID và kiểm onHand-reserved. Một transaction tăng reserved và tạo Order marker true, OrderItem, OrderIngredient bất biến. Thiếu công thức trả RECIPE_UNAVAILABLE; thiếu lượng trả OUT_OF_STOCK có details nguyên liệu, rollback toàn bộ.
4. `POST /payments`: kiểm xác thực/quyền sở hữu, replay nếu cùng chủ đơn + `orderId` + `Idempotency-Key` + `paymentMethod` đã thành công; request không còn `cardNumber`, thẻ chỉ nhập trên trang VNPay. Yêu cầu mới chỉ xử lý với đơn `PENDING`/`PAYMENT_FAILED`: tạo `Payment PENDING` (tối đa một cho mỗi đơn, BR-10), ký URL và trả `paymentUrl`, `expiresAt` (hạn 15 phút). Đơn vẫn `PENDING`, nguyên liệu vẫn giữ.
5. Khách trả trên trang VNPay. Kết quả về qua IPN, hoặc QueryDR khi IPN không tới; chỉ kết quả đã xác thực mới quyết định (BR-11). Thành công: dưới khóa đơn/nguyên liệu, giảm onHand/reserved theo snapshot và lưu Payment SUCCESS + Order PAID cùng transaction, đúng một lần. Thất bại giữ nguyên snapshot/reserved, ghi Payment FAILED và đưa đơn về `PAYMENT_FAILED`; retry cùng đơn không giữ thêm. Replay thành công trả kết quả trước xét trạng thái và không tiêu thụ thêm. Chủ đơn hủy PENDING/PAYMENT_FAILED chỉ giảm reserved theo snapshot trong transaction với CANCELLED; hủy lặp bị từ chối; có `Payment PENDING` còn hạn thì trả 409 `PAYMENT_IN_PROGRESS`, đã quá hạn thì đối soát QueryDR trước rồi mới xét hủy.
6. VNPay chuyển trình duyệt về `/payment/vnpay-return`; web đọc lại `GET /orders/:id` (poll có giới hạn, gọi `POST /payments/:id/sync` khi còn `PENDING`) rồi mới xóa giỏ và hiển thị biên lai khi DB xác nhận đã trả; `GET /orders/me` chỉ trả đơn của chủ token.
7. Kết quả đến bất đồng bộ nên có hai rủi ro vận hành: IPN tới muộn khi Render đang ngủ (VNPay gọi lại, QueryDR bù), và tiền về sau khi payment đã `FAILED` hoặc đơn đã hủy. Trường hợp sau không tự mở lại đơn hay trừ kho: API ghi warning `PAYMENT_RECONCILIATION_REQUIRED` kèm `vnp_TxnRef` để nhân viên đối soát/hoàn tiền tay ([deployment.md](../deployment.md)). Chưa có job tự hủy đơn bỏ dở.

### Lưu ý nhất quán

- `Product.description` có trong [class diagram](../diagrams/class-domain.puml) (D1).
- Đơn mới giữ reserved khi tạo, chỉ giảm onHand khi trả thành công. Không đọc lại công thức để tiêu thụ/giải phóng. Đơn cũ inventoryTracked=false tiếp tục Product.stock lifecycle cũ; không backfill snapshot hoặc chuyển số ly thành nguyên liệu (ADR-006).
- Đơn đã `PAID` nhận cùng key khác phương thức hoặc key mới: 409 `ORDER_NOT_PAYABLE`, không tạo URL VNPay mới. Replay thành công được xét trước trạng thái.
- Tên domain, enum và chuyển trạng thái theo SRS §3.6 và sơ đồ Task 2; không tạo thêm hợp đồng API ở Task 3.

## 5. Thuộc tính chất lượng và cấu hình

### NFR-01: Thời gian phản hồi API đọc

Module `catalog` dùng truy vấn Prisma có phạm vi theo dữ liệu mẫu ≤50 sản phẩm. Đo trên docker-compose local: 100 yêu cầu tuần tự cho mỗi endpoint `GET /products` và `GET /products/:id`, p95 ≤500 ms (AC-N01.1). Không dùng cold start Render làm mốc đánh giá.

### NFR-03: Thời gian đặt đơn và thanh toán

`orders` giữ transaction ngắn; kiểm soát đồng thời theo đơn. Với dữ liệu mẫu trên local, đo 50 yêu cầu mỗi loại: p95 `POST /orders` ≤1 giây, `POST /payments` thành công ≤2 giây (AC-N03.1). Đây là mục tiêu cần Task 5 đo. Từ khi dùng VNPay, `POST /payments` chỉ tạo `Payment PENDING` và ký URL, không chờ VNPay; thời gian khách trả trên trang VNPay không tính vào mục tiêu này. AC-N03.1 và câu "simulator trả trong 500 ms" trong SRS cần nhóm cập nhật ở bước sau.

### NFR-04, NFR-05, NFR-07: Bảo mật

`auth` băm bcrypt cost ≥10 hoặc argon2; JWT đọc khóa ≥32 ký tự từ env, `exp` ≤3600 giây. Guard kiểm role và chủ đơn theo SRS; lỗi xác thực 401, sai quyền 403. Không trả/log mật khẩu, hash, token hay số thẻ; với VNPay còn không log `VNP_HASH_SECRET`, chữ ký, payment URL hay toàn bộ query IPN/payload QueryDR, log vận hành chỉ gồm `vnp_TxnRef` và mã kết quả. `.env` không commit; `.env.example` chỉ giá trị mẫu; CI che secret. `CORS_ORIGINS` là allow list origin Vercel.

NFR-06 được xử lý ở biên DTO với whitelist (trường lạ trả 400), truy vấn ORM có tham số và validation phía web (§4); client không được quyết định giá.

### NFR-08, NFR-14: Kết nối và môi trường

Web/API production dùng HTTPS 443; IPN của VNPay bắt buộc gọi vào API qua HTTPS, và API gọi QueryDR ra VNPay cũng qua HTTPS. API chỉ truy cập Postgres qua internal URL, TCP 5432; tắt external access trên Render Postgres (ADR-004). Docker Compose local chạy web :3000, API :4000 và DB :5432 trong ≤5 phút; named volume giữ dữ liệu qua `down`/`up` không dùng `-v`.

### NFR-12: Trình duyệt và E2E

Luồng menu → giỏ → đăng nhập → thanh toán → xác nhận và inventory được kiểm chứng trước bàn giao. Theo yêu cầu cuối, bộ test dự án được loại khỏi bản phân phối sau kiểm chứng; các lệnh/test ID và mục §7 dưới đây mô tả kế hoạch hoặc bằng chứng lịch sử, không cam kết suite còn được giao. Xem inventory-verification.md cho kết quả thực chạy.

### NFR-13: Transaction và tồn kho

Tạo đơn/OrderItem/OrderIngredient/tăng reserved là một transaction; khóa recipe trước ingredient theo ID. Sửa recipe dùng cùng khóa recipe; payment/cancel/nhập/kiểm kê dùng cùng thứ tự ingredient. Availability dùng repeatable-read. DB CHECK giữ 0≤reserved≤onHand; lỗi giữa chừng không để lại dữ liệu một phần. Xem ADR-006; ADR-005 §C chỉ còn áp dụng đơn legacy và test đồng thời AC-F13.3; idempotency thanh toán theo BR-05/FR-16, không gán nhầm cho NFR về trình duyệt.

### NFR-15: Health check

`GET /health` kiểm kết nối DB, trả `{status, database}`: 200 `{"status":"ok","database":"up"}` trong ≤1 giây khi DB hoạt động; 503 `{"status":"error","database":"down"}` khi không kết nối được. Endpoint không cần token; Render cấu hình Health Check Path `/health`. Health giữ nguyên hình dạng này, không thêm trường trạng thái cổng thanh toán: thiếu biến VNPay không làm API ngừng khởi động hay `/health` đổi kết quả.

### NFR-16: Migration và seed

Prisma migration được version trong repo và chỉ thêm bảng/cột khi phát hành, không xóa/đổi tên cột, để bảo toàn dữ liệu; với kho nguyên liệu, rollback còn phải dùng image hiểu inventoryTracked/snapshot theo ADR-006. Container API khởi động bằng `npx prisma migrate deploy && node dist/main.js`; migration lỗi thì API không bắt đầu phục vụ. Migration được kiểm trên DB cô lập trước cleanup; bản cuối không giao bộ test, không nối CI vào DB production để kiểm thử.

Seed tạo 8 sản phẩm, size/topping, nguyên liệu missing ở số dư 0 và công thức demo; demo users chỉ khi SEED_DEMO_USERS=true. Upsert update rỗng bảo toàn số dư và công thức đã sửa, chạy lại không tăng bản ghi. Nhập số đếm thật qua movement API, không dùng seed reset kho. Không seed khuyến mãi; không chạy seed mỗi restart. Preflight legacy và rollback tương thích theo [runbook](../inventory-runbook.md).

### NFR-17: CI

Bản phân phối cuối chạy Install → Lint → Build cho API/web; các suite unit/integration/E2E đã được loại theo yêu cầu sau kiểm chứng. Check `ci` vẫn là gate chất lượng cấu hình trong workflow. Bằng chứng test trước cleanup được giữ tại inventory-verification.md và hồ sơ Task 4/5, không phải lệnh chạy từ bản cuối.

### NFR-18, NFR-19: CD, rollback và bàn giao

Tag `a2-v*` chạy lint/build (test suite đã loại sau kiểm chứng) → build/push image SHA lên GHCR → deploy Render + Vercel. Migration chạy trong startup API. Sau cả hai deploy, smoke test `/health` (200 và `database = "up"`), `/products` và trang web; mỗi bước retry tối đa 10 phút, quá hạn pipeline đỏ và dừng.

Rollback chỉ về API hiểu marker/snapshot (ADR-006); bằng deploy hook Render với `imgURL` là image SHA trước và `vercel rollback` về web trước, sau đó chạy lại smoke test (AC-N18.3). Task 5 ghi URL HTTPS, ngày hết hạn DB free và minh chứng diễn tập trong README/`docs/deployment.md`; NFR-19 yêu cầu người ngoài nhóm chạy được theo hướng dẫn.

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
| `VNP_TMN_CODE` | API | Mã merchant VNPay sandbox; bắt buộc để tạo URL, nhận IPN, kiểm return và QueryDR; không in vào log |
| `VNP_HASH_SECRET` | API | Secret ký HMAC-SHA512 của VNPay; bắt buộc như `VNP_TMN_CODE`; chỉ nằm trong `.env` local (bị `.gitignore` chặn) và biến môi trường Render |
| `WEB_URL` | API | Origin web để dựng `vnp_ReturnUrl`; chỉ bắt buộc khi tạo URL thanh toán mới, không cần cho IPN/return/QueryDR; production là origin Vercel |
| `VNP_URL`, `VNP_API_URL` | API | URL sandbox công khai (trang thanh toán, API QueryDR), có mặc định, không phải secret |
| `PAYMENT_PROVIDER` | API | Mặc định `vnpay`; giá trị không hỗ trợ thì API dừng khởi động, không tự chuyển sang cổng giả |
| `RENDER_DEPLOY_HOOK_URL` | GitHub environment production | Secret dùng deploy/rollback; không in URL vào log |
| `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` | GitHub environment production | Credential/định danh deploy Vercel theo CR-5.3 |
| `PRODUCTION_API_URL`, `PRODUCTION_WEB_URL` | GitHub Actions vars | URL cho smoke test, không phải secret |

Các biến `VNP_*`, `WEB_URL`, `PAYMENT_PROVIDER` đặt theo kế hoạch VNPay; giá trị chỉ nằm ở nơi lưu secret, tài liệu này chỉ ghi tên. Kiểm biến theo từng thao tác, không gom thành một cờ tắt toàn bộ: thiếu biến thì API vẫn khởi động (ghi một dòng cảnh báo chỉ liệt kê tên biến thiếu) để Docker/local chạy các chức năng không cần cổng thanh toán; riêng tạo URL mới và QueryDR trả 502 `PAYMENT_PROVIDER_ERROR`, IPN trả `RspCode` `99` mà không đọc/ghi DB, return trả `valid: false`. Bảng biến Render và điều kiện lưu biến trước deploy nằm ở [deployment.md](../deployment.md).

## 6. Quyết định và trade-off

| ADR / quyết định | Lý do và ưu điểm | Hạn chế / đánh đổi |
|---|---|---|
| [ADR-001](adr/001-monorepo.md): monorepo | Web/API/docs cùng lịch sử và review, chia sẻ contract dễ | CI cần tách phạm vi, nhóm phải tuân thủ ownership để tránh xung đột |
| [ADR-002](adr/002-layered-nestjs.md): NestJS theo domain/lớp | Controller mỏng, nghiệp vụ và transaction tập trung, dễ test | Thêm cấu trúc so với app rất nhỏ; tránh tạo interface không cần thiết |
| [ADR-003](adr/003-containerization.md): Compose, Postgres, Prisma | Local/CI dùng DB thật; migration/seed tái tạo được | Tốn tài nguyên Docker, cần theo dõi startup; migration chỉ thêm giới hạn thay đổi schema |
| [ADR-004](adr/004-vercel-render.md): Vercel + Render + GHCR | CDN cho web, container API quản lý sẵn, image SHA chọn lại được | Hai nền tảng/secret/CORS; Render free cold start và DB có hạn dùng |
| [ADR-005](adr/005-idempotency-and-optimistic-lock.md): API replay, transaction kho | Retry thành công không gọi simulator lại; tránh tồn âm | Đồng bộ theo đơn; API dừng giữa bước 13 và 14 là rủi ro chấp nhận |
| ADR-007 (chưa soạn): tích hợp VNPay sandbox thay Payment simulator (ADR-005 §B) | Đáp ứng yêu cầu giảng viên về cổng bên thứ ba; kết quả có chữ ký, kiểm chứng được qua IPN/QueryDR; không lưu số thẻ | Bất đồng bộ (đơn chờ kết quả), thêm secret, phụ thuộc sandbox và Render ngủ; tiền về muộn phải đối soát tay |
| Next.js/PWA, ba trạng thái (§3–4) | Mobile-first, manifest và thông báo rõ khi API đang ngủ | Không hỗ trợ offline; phải kiểm viewport, hiệu năng và trạng thái lỗi |
| JSON stdout, env và health (§5, ADR-004) | Dễ thu log, phát hiện DB lỗi; cấu hình tách khỏi mã | Cần lọc dữ liệu nhạy cảm và cấu hình platform; health không thay thế smoke toàn luồng |

## 7. Kiểm chứng thiết kế và trách nhiệm hiện thực

- Task 3: render PlantUML, kiểm SVG, link nội bộ, thuật ngữ cũ và allowed paths. Script smoke tự động cũ đã xóa cùng bộ test; kết quả lịch sử ở [báo cáo kho](../inventory-verification.md). Kiểm tài liệu/sơ đồ không chứng minh runtime đáp ứng NFR.
- Trước cleanup Task 4/5: kiểm domain và PostgreSQL thật cho rollback, cạnh tranh tồn, replay và seed hai lần; kết quả actual ở inventory-verification.md. Bộ suite không còn trong bản cuối.
- Bằng chứng E2E Chromium trước cleanup ghi ở verification; bản cuối kiểm thủ công luồng chính, retry, giỏ/đơn và inventory theo runbook, không có lệnh npm test/E2E để chạy lại.
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
| NFR-12 | architecture.md §5, §7; Deployment-01 CI | Bằng chứng Chromium trước cleanup; runbook thủ công bản cuối |
| NFR-13 | architecture.md §4, §5; ADR-006; ADR-005 §C chỉ cho đơn legacy | Transaction và 10 request tồn kho đồng thời |
| NFR-14 | architecture.md §3, §5; ADR-003; Deployment-01 local | Compose startup và volume qua restart |
| NFR-15 | architecture.md §4 `health`, §5; ADR-004; deployment.puml (smoke /health) | Health 200/503 theo kết nối DB |
| NFR-16 | architecture.md §5; ADR-003; Deployment-01 startup API | Migrate DB trống, seed hai lần, migration chỉ thêm |
| NFR-17 | architecture.md §5, §7; ADR-001; Deployment-01 CI | Install/Lint/Build; test evidence trước cleanup; check ci |
| NFR-18 | architecture.md §5; ADR-004; Deployment-01 CD | Tag a2-v*, image SHA, smoke và rollback |
| NFR-19 | architecture.md §5, §7; ADR-004; Deployment-01 production | URL HTTPS trong README và bàn giao |
| NFR-20 | architecture.md §5; ADR-004; Deployment-01 Render logs | Schema JSON, LOG_LEVEL, lọc dữ liệu nhạy cảm |

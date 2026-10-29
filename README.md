# BrewLite — Assignment 2

Next.js + NestJS + PostgreSQL/Prisma. Bổ sung kho nguyên liệu `BREW-INVENTORY-01` trên luồng đặt hàng Assignment 2.
Luồng: nhập nguyên liệu → xem số ly theo size/topping → đặt đơn giữ nguyên liệu → thanh toán trừ nguyên liệu hoặc hủy giải phóng lượng giữ.
Production demo: [web](https://brewlite-a2-web.vercel.app), [API health](https://brewlite-a2-api.onrender.com/health). Triển khai tay và menu tám món đã kiểm chứng ngày 23/10/2026; kết quả release hiện tại ở [báo cáo Task 5](docs/planning/handoff/2026-10-21-req-sync/report-task5.md).

- [Đề A2](docs/Assignment2-BrewLite.md), [SRS](docs/requirements/srs.md), [Use-case](docs/requirements/uc-checkout.md).
- [Audit/kế hoạch Task 5](docs/task5/implementation.md), [kết quả kiểm chứng và bàn giao](docs/task5/verification.md).
- [Deploy, secrets và rollback](docs/deployment.md), [release candidate](docs/task5/release-notes.md), [Sprint Review/Retro](docs/task5/sprint-review-retrospective.md).
- [Traceability](docs/traceability-matrix.md), [quy trình PR/DoD](CONTRIBUTING.md), [Task 4 checkpoint](docs/checkpoints/2026-10-19-task4.md).
- [Kiến trúc và ADR Task 3](docs/architecture/architecture.md), [log CI thật Task 4 xanh/đỏ](docs/evidence/ci/github-runs.md).
- [Contract kho](docs/inventory-contract.md), [hướng dẫn chuyển đổi và demo](docs/inventory-runbook.md), [kế hoạch](docs/planning/2026-10-29-ingredient-inventory.md), [kết quả kiểm chứng](docs/inventory-verification.md).

## Demo nhanh bằng một container

Web + API + PostgreSQL trong một container, một cổng web và volume riêng:

```powershell
docker compose -f compose.demo.yml up -d --build --wait
```

Máy Windows hiện tại đã có Docker Engine trong Ubuntu WSL. Từ PowerShell tại thư mục dự án, dùng lệnh sau nếu chưa có `docker` trên Windows:

```powershell
wsl.exe -d Ubuntu -u root --cd "$PWD" -- /usr/bin/docker compose -f compose.demo.yml up -d --build --wait
if ($LASTEXITCODE -ne 0) { throw 'Không khởi động được demo' }
Start-Process wsl.exe -ArgumentList '-d','Ubuntu','-u','root','--','/usr/bin/docker','wait','brewlite-demo-demo-1' -WindowStyle Hidden
```

Lệnh `docker wait` chạy ẩn giữ WSL hoạt động và tự thoát khi container dừng. Các lệnh Compose bên dưới cũng dùng được bằng cách thêm tiền tố `wsl.exe -d Ubuntu -u root --cd "$PWD" -- /usr/bin/`. Chi tiết kiểm chứng ở [báo cáo container demo](docs/docker-demo.md).

Mở `http://localhost:3000`. Tài khoản `barista.demo@brewlite.local` hoặc `customer.demo@brewlite.local`, mật khẩu `Demo@12345`. Nhân viên vào `/inventory` nhập nguyên liệu để bắt đầu bán; seed không tự tạo tồn thực tế. Container tự migrate/seed và tạo secret ngẫu nhiên lưu cùng volume, không cần chuẩn bị `.env`.

Đổi cổng với Docker CLI Windows: `$env:DEMO_PORT='8080'` rồi chạy lệnh trên; với WSL, dùng `-- env DEMO_PORT=8080 /usr/bin/docker` thay cho `-- /usr/bin/docker`. Mở `http://localhost:8080`. Frontend gọi API qua `/api` cùng origin. Dừng bằng `docker compose -f compose.demo.yml down` (thêm tiền tố WSL nếu cần); dữ liệu vẫn nằm trong volume. Không thêm `-v` nếu muốn giữ dữ liệu. Cấu hình này dành cho demo local; deployment tách dịch vụ bên dưới vẫn giữ nguyên.

## Chạy tách dịch vụ trên Windows bằng Docker

Cần Docker Desktop (Linux engine). Chạy từ thư mục clone/worktree được giao.

```powershell
Copy-Item .env.example .env  # chỉ trên clone mới, không ghi đè .env có sẵn
```

Tự điền `POSTGRES_PASSWORD` (hex ngẫu nhiên để URL-safe) và `JWT_SECRET` (>=32 ký tự ngẫu nhiên) vào `.env`, rồi:

```powershell
docker compose config --quiet
docker compose up -d --build --wait
docker compose run --rm -e SEED_DEMO_USERS=true api npm run prisma:seed
Invoke-RestMethod http://localhost:4000/health
Start-Process http://localhost:3000
```

DB chỉ ở network nội bộ, có volume bền vững. Không xóa volume hoặc dùng `down -v`/`prisma migrate reset`.
Compose chạy migration trước API. Seed tạo 8 sản phẩm, 15 nguyên liệu và 27 công thức nếu thiếu, không ghi đè giá/tồn kho/công thức đã có. Nguyên liệu mới bắt đầu bằng 0; nhân viên nhập số kiểm kê thực tế tại `/inventory` trước khi bán.
Tài khoản demo opt-in: `customer.demo@brewlite.local`, `barista.demo@brewlite.local`, mật khẩu `Demo@12345`. Chỉ bật seed tài khoản demo trên môi trường demo đã được nhóm cho phép; không dùng mật khẩu mẫu cho dữ liệu thật.

## Chạy hai app bằng Node.js

Node theo `.nvmrc` (24.19.0). Hai app có lockfile độc lập, không có package.json ở root.
Windows dùng `npm.cmd`; Linux/macOS dùng `npm`. Cần PostgreSQL demo riêng (không dùng DB dữ liệu nhóm để thử nghiệm).

```powershell
npm.cmd --prefix apps/api ci
npm.cmd --prefix apps/web ci
Copy-Item apps/api/.env.example apps/api/.env
Copy-Item apps/web/.env.example apps/web/.env.local
```

Điền `DATABASE_URL`, `JWT_SECRET` và `CORS_ORIGINS` trong `apps/api/.env`; điền `NEXT_PUBLIC_API_URL=http://localhost:4000` trong `apps/web/.env.local`.
Không ghi secret vào web. Root `.env` chỉ được Compose dùng; app local không tự nạp root env.

```powershell
Set-Location apps/api
npm.cmd run prisma:generate
npm.cmd run prisma:migrate
$env:SEED_DEMO_USERS='true' # chỉ demo DB riêng
npm.cmd run prisma:seed
npm.cmd run start:dev
```

Terminal khác từ root: `npm.cmd --prefix apps/web run dev`. Web 3000, API 4000.
Nếu thay cổng web phải thay CORS_ORIGINS; API URL được nhúng khi web build nên phải build lại khi đổi URL.

## API và nghiệp vụ

| Endpoint | Quyền | Nội dung |
|---|---|---|
| GET /products, /products/:id | Public | `stock` là số ly size S không topping, tính từ nguyên liệu |
| GET /catalog/options | Public | `{sizes, toppings}` phụ thu theo SRS §3.3 |
| POST /inventory/availability | Public | Kiểm tra lựa chọn và tổng nhu cầu nguyên liệu cả giỏ |
| GET /inventory/ingredients, /inventory/movements, /inventory/recipes | BARISTA | Số dư, lịch sử và công thức |
| POST /inventory/ingredients/:id/movements | BARISTA | Nhập thêm hoặc kiểm đếm tổng tồn, bắt buộc lý do |
| PUT /inventory/recipes | BARISTA | Thay công thức món/size hoặc topping |
| POST /auth/register | Public | `{email,password}`, chỉ tạo CUSTOMER |
| POST /auth/login | Public | `{accessToken,user}`, JWT HS256 1 giờ |
| POST /orders | CUSTOMER | `{items:[{productId,size,toppings,quantity}]}` |
| GET /orders/me | CUSTOMER | Tối đa 50 đơn mới nhất, chỉ của người gọi |
| GET /orders/:id | Chủ đơn/BARISTA | Món, trạng thái và các lần thanh toán |
| PATCH /orders/:id | Chủ đơn/BARISTA | `{status}`: khách hủy chưa trả; quầy PREPARING→READY→COMPLETED |
| POST /payments | CUSTOMER chủ đơn | `{orderId,paymentMethod}`, bắt buộc `Idempotency-Key`; trả `paymentUrl` của VNPay, kết quả đến qua IPN hoặc `POST /payments/:id/sync` |
| GET /health | Public | 200 DB up; 503 DB down |

JWT_SECRET tối thiểu 32 ký tự; bcrypt cost 12. Unknown fields bị từ chối (kể cả giá/userId/role do client tự gửi).
Giá integer VND do backend tính. Tạo đơn giữ nguyên liệu cùng transaction và lưu snapshot; thanh toán thành công trừ `onHand` và `reserved`, thất bại tiếp tục giữ; hủy chưa trả giải phóng `reserved` đúng một lần. Kho dùng Decimal và quy đổi kg→g, l→ml; không quy đổi khác loại.
Thanh toán PostgreSQL lock theo khách/đơn; replay thành công theo chủ đơn/orderId/key/paymentMethod, không so số thẻ. Key thất bại được retry; cùng key dùng cho đơn khác được xử lý độc lập.
Không lưu/log số thẻ; fingerprint HMAC chỉ băm orderId và paymentMethod. Mỗi đơn có tối đa một Payment SUCCESS.
Token lưu sessionStorage, giỏ lưu localStorage; cần bật browser storage. Khi mất phản hồi tạo đơn, UI chặn tạo lại và hướng tới lịch sử để đối soát.

Thanh toán dùng VNPay sandbox. Muốn trả tiền cần `VNP_TMN_CODE`, `VNP_HASH_SECRET`, `WEB_URL` trong `apps/api/.env` (không commit). Thiếu biến thì API vẫn chạy, chỉ tạo URL thanh toán mới trả 502; xem [docs/deployment.md](docs/deployment.md).
Chỉ dùng sandbox, không thu tiền thật. Thất bại giữ đơn và giỏ; chỉ xóa giỏ sau khi backend xác nhận thanh toán.

Barista đăng nhập để vào `/inventory`; đơn hàng tiếp tục dùng GET chi tiết, PATCH lần lượt PREPARING, READY, COMPLETED. [Runbook](docs/inventory-runbook.md) có request nhập kho, công thức và demo Matcha 6 ly.

## Kiểm chứng và build

Theo yêu cầu chủ dự án, toàn bộ test tự động, cấu hình, script và dependency phục vụ test đã được xóa sau khi chạy kiểm chứng. [Báo cáo kho](docs/inventory-verification.md) lưu kết quả unit/HTTP, PostgreSQL, trình duyệt, migration và seed trước khi xóa. Các hồ sơ CI/Sprint cũ là minh chứng lịch sử.

```powershell
npm.cmd --prefix apps/api run lint
npm.cmd --prefix apps/web run lint
npm.cmd --prefix apps/web run typecheck
npm.cmd --prefix apps/api run build
npm.cmd --prefix apps/web run build
```

Demo thủ công: đăng nhập BARISTA → vào /inventory → nhập Matcha 20 g, sữa không đường 2000 ml, siro đường 200 ml với lý do → đăng nhập CUSTOMER → chọn Matcha size S ở chi tiết món để đặt/thanh toán hoặc hủy. Trang kho chỉ có số dư, nhập kho/kiểm đếm và lịch sử; công thức cố định được dùng trong hệ thống. Hướng dẫn request và chuyển đổi dữ liệu cũ ở [runbook](docs/inventory-runbook.md).

Production local: build với API URL phù hợp, rồi `npm.cmd --prefix apps/api run start:prod` và `npm.cmd --prefix apps/web start`.

Đã có [PR #9 CI xanh](https://github.com/DuVinhLoi/BrewLite/pull/9) và [PR #10 CI bắt lỗi test, đã đóng không merge](https://github.com/DuVinhLoi/BrewLite/pull/10); log ở [hồ sơ CI](docs/evidence/ci/README.md). Quản trị viên còn phải bật branch protection yêu cầu check `ci` và một approval để chặn merge khi lỗi. API GitHub hiện báo repo private cần gói hỗ trợ hoặc đổi visibility để dùng tính năng này; tài khoản kiểm tra không có quyền admin. Chưa xác nhận điều kiện chặn merge đã đạt.

## CI/CD và production

CI giữ job `ci`: install → lint → migration/seed DB riêng → typecheck/build → Compose validation. Các bước test tự động đã được gỡ theo yêu cầu chủ dự án.
Push lên `feat/assignment2-task5-delivery`, tag `a2-v*` hoặc `workflow_dispatch` chạy Delivery: quality gate → kiểm cấu hình production → publish API image full SHA → Render API và Vercel web → smoke HTTPS có retry. PR và các nhánh CI khác chỉ chạy CI; Delivery gọi lại CI nên không cần thêm một run CI riêng cho cùng push delivery. Git auto-deploy của hai nền tảng tắt để release đi qua workflow. Render phải báo deployment mới live với đúng image commit trước smoke; Vercel CLI được cố định phiên bản; API chạy migration khi khởi động.
Cấu hình environment, secret, deploy hook, HTTPS/DB nội bộ và rollback theo [deployment.md](docs/deployment.md). Không dùng `continue-on-error` để làm xanh.
Rollback dùng image SHA trước trên Render và `vercel rollback`/promote deployment web trước, rồi chạy lại smoke; không reset hoặc tự đảo migration DB.

Production demo hoạt động từ Pha A. Pipeline/tag, smoke và diễn tập rollback của release hiện tại chỉ được coi PASS khi có run/URL và kết quả thật trong [verification](docs/task5/verification.md), [release notes](docs/task5/release-notes.md) và [báo cáo Task 5](docs/planning/handoff/2026-10-21-req-sync/report-task5.md). Video demo và buổi review/retro là bằng chứng nhóm phải hoàn thiện riêng.

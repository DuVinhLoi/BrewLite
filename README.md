# BrewLite — Assignment 2

Next.js + NestJS + PostgreSQL/Prisma. Task 5 phát triển tiếp từ Sprint 1 commit `f1b856a`, giữ nguyên Product API và Menu UI.
Luồng: menu → size/topping → giỏ → đăng ký/đăng nhập → đặt đơn → Ví/Thẻ demo → xác nhận/lịch sử/theo dõi.
Chưa có URL production hoặc GitHub CI/CD run được xác minh; sơ đồ/ADR Task 2–3 vẫn là phụ thuộc của nhóm.

- [Đề A2](docs/Assignment2-BrewLite.md), [SRS](docs/requirements/srs.md), [Use-case](docs/requirements/uc-checkout.md).
- [Audit/kế hoạch Task 5](docs/task5/implementation.md), [kết quả kiểm chứng và bàn giao](docs/task5/verification.md).
- [Deploy, secrets và rollback](docs/deployment.md), [release candidate](docs/task5/release-notes.md), [Sprint Review/Retro](docs/task5/sprint-review-retrospective.md).
- [Traceability](docs/traceability-matrix.md), [quy trình PR/DoD](CONTRIBUTING.md), [Task 4 checkpoint](docs/checkpoints/2026-10-19-task4.md).
- [Kiến trúc và ADR Task 3](docs/architecture/architecture.md), [log CI thật Task 4 xanh/đỏ](docs/evidence/ci/github-runs.md).

## Chạy trên Windows bằng Docker

Cần Docker Desktop (Linux engine). Dùng worktree Task 5, không chạy trong worktree Task 4.

```powershell
Set-Location C:\BrewLite-a2-Task5
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
Compose chạy migration trước API. Seed tạo 8 sản phẩm nếu thiếu, không ghi đè giá/tồn kho đã có.
Tài khoản demo opt-in: `customer.demo@brewlite.local`, `barista.demo@brewlite.local`, mật khẩu `Demo@12345`. Không seed tài khoản này trên production.

## Chạy hai app bằng Node.js

Node theo `.nvmrc` (24.19.0); kiểm chứng local dùng bản cài sẵn 24.21.0. Hai app có lockfile độc lập, không có package.json ở root.
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
| GET /products, /products/:id | Public | Contract Task 4 giữ nguyên |
| GET /catalog/options | Public | `{sizes, toppings}` phụ thu theo SRS §3.3 |
| POST /auth/register | Public | `{email,password}`, chỉ tạo CUSTOMER |
| POST /auth/login | Public | `{accessToken,user}`, JWT HS256 1 giờ |
| POST /orders | CUSTOMER | `{items:[{productId,size,toppings,quantity}]}` |
| GET /orders/me | CUSTOMER | Tối đa 50 đơn mới nhất, chỉ của người gọi |
| GET /orders/:id | Chủ đơn/BARISTA | Món, trạng thái và các lần thanh toán |
| PATCH /orders/:id | Chủ đơn/BARISTA | `{status}`: khách hủy chưa trả; quầy PREPARING→READY→COMPLETED |
| POST /payments | CUSTOMER chủ đơn | `{orderId,paymentMethod,cardNumber?}`, bắt buộc `Idempotency-Key` |
| GET /health | Public | 200 DB up; 503 DB down |

JWT_SECRET tối thiểu 32 ký tự; bcrypt cost 12. Unknown fields bị từ chối (kể cả giá/userId/role do client tự gửi).
Giá integer VND do backend tính; tạo đơn và trừ tồn cùng transaction. Hủy chưa trả hoàn kho đúng một lần.
Thanh toán PostgreSQL lock theo khách/đơn; key thành công không thu lại, key thất bại được retry.
Không lưu/log số thẻ: chỉ lưu fingerprint HMAC phục vụ so khớp idempotency.
Token lưu sessionStorage, giỏ lưu localStorage; cần bật browser storage. Khi mất phản hồi tạo đơn, UI chặn tạo lại và hướng tới lịch sử để đối soát.

Ví `WALLET` thành công; thẻ demo `4242424242424242` thành công, `4000000000000002` bị từ chối, `4000000000000119` timeout sau 5 giây.
Chỉ dùng thẻ demo, không thu tiền thật. Thất bại giữ đơn và giỏ; chỉ xóa giỏ sau khi backend xác nhận thanh toán.

Barista dùng [Postman collection](tests/postman/BrewLite-Sprint2.postman_collection.json): login, điền orderId từ biên lai, GET chi tiết, PATCH lần lượt PREPARING, READY, COMPLETED.

## Kiểm thử và build

```powershell
npm.cmd --prefix apps/api run lint
npm.cmd --prefix apps/web run lint
npm.cmd --prefix apps/api test -- --runInBand
npm.cmd --prefix apps/web test
npm.cmd --prefix apps/web run typecheck
npm.cmd --prefix apps/api run build
npm.cmd --prefix apps/web run build
```

Unit/HTTP provider giả không dùng database. Integration và E2E từ chối DB không có tên `brewlite_test` hoặc `brewlite_test_<suffix>`.
Tạo container test riêng (đổi tên/cổng nếu đã dùng), không dùng volume hay dữ liệu nhóm:

```powershell
docker run -d --name brewlite-task5-test -e POSTGRES_USER=brewlite -e POSTGRES_PASSWORD=local-test-only -e POSTGRES_DB=brewlite_test -p 127.0.0.1:55435:5432 postgres:16-alpine
# Đợi pg_isready trả accepting connections trước khi migrate.
docker exec brewlite-task5-test pg_isready -U brewlite -d brewlite_test
$env:TEST_DATABASE_URL='postgresql://brewlite:local-test-only@127.0.0.1:55435/brewlite_test?schema=public'
$env:DATABASE_URL=$env:TEST_DATABASE_URL
Push-Location apps/api
npm.cmd run prisma:migrate
$env:SEED_DEMO_USERS='true'
npm.cmd run prisma:seed
npm.cmd run test:integration
Pop-Location
```

Integration chỉ xóa các bản ghi test tự tạo trong DB test sau test. E2E tạo tài khoản demo riêng, không tự reset DB; chạy lại nhiều lần có thể hết tồn kho seed, nên dùng DB test sạch khác hoặc bổ sung tồn bằng thao tác có chủ đích trên DB test.

```powershell
$env:NEXT_PUBLIC_API_URL='http://127.0.0.1:4105'
npm.cmd --prefix apps/api run build
npm.cmd --prefix apps/web run build
Push-Location apps/web
npx.cmd playwright install chromium
npm.cmd run test:e2e
Pop-Location
```

Playwright tự chạy API 4105 và web 3105, không tái dùng server đang chạy. Đóng server chiếm cổng hoặc đổi cấu hình test trước.
E2E chạy browser + API + PostgreSQL thật; lỗi mất response được tiêm sau khi request thật đã tới server, không dùng mock để giả thành công.
Sau kiểm thử, bỏ các env test khỏi terminal hoặc mở terminal mới trước khi chạy demo. Production local: build với API URL demo, rồi `npm.cmd --prefix apps/api run start:prod` và `npm.cmd --prefix apps/web start`.

Đã có [PR #9 CI xanh](https://github.com/DuVinhLoi/BrewLite/pull/9) và [PR #10 CI bắt lỗi test, đã đóng không merge](https://github.com/DuVinhLoi/BrewLite/pull/10); log ở [hồ sơ CI](docs/evidence/ci/README.md). Quản trị viên còn phải bật branch protection yêu cầu check `ci` và một approval để chặn merge khi lỗi. API GitHub hiện báo repo private cần gói hỗ trợ hoặc đổi visibility để dùng tính năng này; tài khoản kiểm tra không có quyền admin. Chưa xác nhận điều kiện chặn merge đã đạt.

## CI/CD và production

CI giữ job `ci`, mở rộng pipeline Task 4: install → lint → unit → migration/seed/integration DB riêng → typecheck/build → Chromium E2E → Compose validation.
CD chạy theo tag `a2-v*` hoặc workflow_dispatch; **phải bật required reviewers ở environment release và production trước khi kích hoạt**. Quality gate xong mới được push image SHA; deploy cần approval riêng.
Secrets, HTTPS proxy, DB private, health/smoke và rollback theo [deployment.md](docs/deployment.md). Không tự deploy hoặc dùng `continue-on-error` để làm xanh.
Rollback: operator chọn full SHA trước đã kiểm chứng, chạy `RELEASE_SHA=<SHA> REGISTRY_IMAGE=ghcr.io/owner/repo bash /opt/brewlite/deploy.sh`; không rollback/reset DB tự động.

Trạng thái production: **BLOCKED** vì chưa có hosting, domain HTTPS, secrets, approval và URL thật. Nhóm phải hoàn thành Task 2–3, GitHub branch protection, chạy pipeline, release/tag, video demo, review/retro và thử rollback trước nghiệm thu.
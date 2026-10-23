> Pha A 23/10/2026: deploy tay Render/Vercel PASS. Web https://brewlite-a2-web.vercel.app HTTP 200; API https://brewlite-a2-api.onrender.com/health HTTP 200 với database up; /products và Chromium menu đủ 8 món. Migration/seed, CORS và auto-deploy off đã kiểm chứng. Xem [report-task5](../planning/handoff/2026-10-21-req-sync/report-task5.md) để có IDs/lệnh override. Các kiểm tra 21/10 bên dưới là lịch sử; CD mới và rollback chưa chạy.

# Task 5 — Báo cáo kiểm chứng và bàn giao

> Các mục dưới là snapshot kiểm chứng local ngày 21/10 trước commit/push. Bằng chứng deploy production ngày 23/10 nằm trong cập nhật Pha A và report-task5 ở trên.

Ngày: 21/10/2026. Task ID: 5.1–5.4.
Branch: `feat/assignment2-task5-delivery`. Worktree: `C:/BrewLite-a2-Task5`.
Base/HEAD: `f1b856a70ba1ae91674c75291f0117ab6643d9b0` (Task 4).
Chưa tạo commit mới, chưa push/tag/merge/publish image/deploy production.
Git status có thay đổi Task 5 chưa commit; inventory cuối tài liệu liệt kê từng đường dẫn.

## Kế thừa và thay đổi Task 4

Giữ nguyên `apps/api/src/catalog/*`, Product API list/detail, `MenuScreen`, các CSS module menu, dữ liệu mẫu tám món và migration init.
Regression Product API 5 test và menu/format/stock tests vẫn chạy trong các suite hiện tại.
Nút ProductCard từ chưa hoạt động sang mở trang chọn tùy chọn bằng form GET; sản phẩm hết hàng vẫn disabled.
Root layout bọc ShopProvider để thêm navigation/badge/session; app.module thêm CheckoutModule; main kiểm JWT secret.
Schema chỉ bổ sung relation và bảng mới; migration cũ không sửa. Seed chuyển sang create-if-missing, không reset giá/tồn kho đã có; demo account chỉ opt-in.
CI giữ tên check `ci`, thêm DB test/integration/E2E. Package manager, import resolution, tsconfig và cấu trúc apps không đổi.
Dependency mới phục vụ yêu cầu: bcryptjs, jsonwebtoken, @types/jsonwebtoken, @playwright/test; không nâng cấp hàng loạt.

## Mức hoàn thành

| Hạng mục | Kết quả có bằng chứng | Phần còn lại |
|---|---|---|
| 5.1 MVP | PASS luồng chính: tùy chọn, giỏ, login/register API, transaction tạo đơn, payment success/failure/retry, xác nhận/history; kiểm quyền và trạng thái | Không coi tất cả AC SRS đã đo; xem traceability cho những nhánh UI/chỉ tiêu chưa có test riêng |
| 5.2 Testing | PASS 20 backend unit/HTTP, 17 web unit/component, 7 PostgreSQL integration, 6 Chromium E2E; Compose build/up/health/seed/persistence | Chưa có đo tải/latency toàn bộ SRS hoặc audit accessibility tự động |
| 5.3 CI/CD | Source hoàn chỉnh, YAML parse và Bash syntax PASS; Docker image build PASS local | GitHub CI/CD run, GHCR push, deploy/smoke/rollback production NOT RUN |
| 5.4 Delivery | README Windows, deployment/rollback, release candidate, review/retro template, traceability có code/test | Production URL, release/tag thật, video/demo bàn giao và buổi họp thật BLOCKED/NOT RUN |

Không sửa tài liệu yêu cầu Task 1 hoặc viết thay sơ đồ/ADR Task 2–3. Thiếu thiết kế của nhóm vẫn là BLOCKED cho nghiệm thu truy vết đầy đủ.
Promotion/loyalty/refund/queue FR-17/18/19/26/27 là ngoài minimum SRS, NOT IMPLEMENTED có chủ đích.

## Lệnh thực tế và kết quả

Chạy trong worktree Task 5. Local Node cài sẵn 24.21.0; không đổi `.nvmrc` 24.19.0. Docker Engine 29.8.1.
PowerShell dùng npm.cmd; PATH phiên chạy trỏ vào bản Node cài sẵn, không đổi cấu hình Node toàn máy.

| Lệnh/kiểm tra | Kết quả |
|---|---|
| `npm.cmd --prefix apps/api ci --ignore-scripts` và web tương ứng | PASS cài baseline; Prisma generate riêng sau đó |
| `npm.cmd --prefix apps/api run prisma:generate` | PASS Prisma Client 6.19.3 |
| `npm.cmd --prefix apps/api run lint` | PASS |
| `npm.cmd --prefix apps/web run lint` | PASS, không còn lỗi/cảnh báo lint sau sửa hook/label |
| `npm.cmd --prefix apps/api test -- --runInBand` | PASS 4 suites, 20 tests |
| `npm.cmd --prefix apps/web test` | PASS 5 files, 17 tests |
| `npm.cmd --prefix apps/web run typecheck` | PASS |
| `npm.cmd --prefix apps/api run build` | PASS Nest build |
| `npm.cmd --prefix apps/web run build` | PASS Next production build, đủ routes mới |
| `npm.cmd run prisma:migrate` từ apps/api với DATABASE_URL test | PASS áp dụng init + sprint2 trên DB sạch |
| `npm.cmd run prisma:seed` với SEED_DEMO_USERS=true | PASS 8 món + demo users; chạy lặp trên Compose vẫn đúng 8 products/2 users |
| `npm.cmd --prefix apps/api run test:integration` với TEST_DATABASE_URL | PASS 7 tests; DB độc lập, transaction rollback, ownership/JWT, parallel replay/failure, timeout, cancel/state, oversell |
| `npm.cmd --prefix apps/web run test:e2e` | PASS 6 Chromium tests, lần cuối 17.5 giây |
| `docker compose config --quiet` | PASS local và production configuration (env kiểm chứng, không dùng production secrets) |
| `docker compose -p brewlite-task5-verification-20261021 up -d --build --wait --wait-timeout 180` | PASS build images, migration service exit 0, db/api/web healthy |
| HTTP Compose `/health`, `/products`, `/`, tạo đơn và Ví | PASS health ok, 8 món, web 200, server total 124000, order PAID |
| Compose `down` rồi `up -d --wait` (không -v) | PASS demo account và đơn PAID 124000 còn nguyên |
| `docker run --rm --entrypoint bash --mount ... brewlite-api:local -n /scripts/deploy.sh` | PASS chỉ kiểm syntax, không deploy |
| js-yaml parse CI/CD/Compose; JSON parse Postman | PASS syntax, không chứng minh GitHub/VPS execution |
| `git diff --check`; `git diff --name-status`; inventory untracked | PASS kiểm tra phạm vi và whitespace; không stage/commit |

DB integration riêng: container `brewlite-task5-test-20261021`, localhost:55435, database `brewlite_test`, không mount volume dữ liệu nhóm.
Compose kiểm chứng riêng: project `brewlite-task5-verification-20261021`, volume riêng, web http://localhost:3106, API http://localhost:4106.
Đây là URL local, không phải production. Không xóa volume. Dữ liệu test chưa được dọn phá hủy tự động.

## Chi tiết E2E và review

- E2E-S2-01: menu → L/Trân châu → 2 ly → reload giỏ → login → trả 124000 → receipt/history.
- E2E-S2-02: thẻ bị từ chối giữ giỏ/đơn, retry Ví trên cùng đơn.
- E2E-S2-03: POST orders đã commit nhưng mất response: chặn tạo lại, reload vẫn chặn, history có đúng một đơn.
- E2E-S2-04: thẻ đã thanh toán nhưng mất response: reload phục hồi PAID, không gửi payment lần hai.
- E2E-S2-05: GET saved order lỗi: chặn tạo mới, retry GET xong thanh toán đơn cũ.
- E2E-S2-06: payment 401 thật từ API: login lại, giữ cùng order/key, POST orders đúng một lần.

Đã review độc lập read-only theo skill requesting-code-review, kiểm tra lại feedback theo receiving-code-review.
Các lỗi được phát hiện và sửa: tạo trùng khi mất response, phục hồi thẻ đã PAID, lỗi GET đơn cũ, đơn bị hủy ở tab khác, tag trigger, giới hạn history, payload health.

## Lỗi trong quá trình làm và giới hạn còn lại

Đã sửa: typing bảng test Jest, khai báo effect trước state setter, dependency Context không ổn định, selectors Playwright trùng route announcer/label, fault-injection handler xử lý route hai lần.
Smoke PowerShell lần đầu gửi chuỗi topping sai encoding bị API từ chối 400; gửi UTF-8 bytes/charset=utf-8 kiểm lại đã PASS.
`playwright install chromium` tải Chrome thành công nhưng FFmpeg lỗi mạng ECONNRESET/ENOTFOUND; dùng full Chromium channel đã tải, không video, cả 6 browser tests chạy PASS. CI cài browser trên runner riêng; chưa kiểm chứng tải trên GitHub.
Next start local có cảnh báo output standalone nhưng E2E vẫn chạy; Docker dùng đúng standalone server và copy public/static assets.
Npm báo dependency audit hiện tại: API 23 (20 moderate/3 high), web 5 high; chưa khắc phục/nâng cấp vì ngoài phạm vi an toàn, không chạy audit fix --force. Cần nhóm đánh giá trước production.
Token sessionStorage không có refresh token, giỏ localStorage không đồng bộ nhiều tab; cần browser storage hoạt động. JWT secret thay đổi làm token cũ không hợp lệ; không lưu/log số thẻ demo.
Postman GUI NOT RUN; benchmark tải/độ trễ, toàn bộ AC UI, cấu hình branch protection và môi trường production NOT RUN.
GitHub required reviewers phải do quản trị viên cấu hình, source workflow không tự bật được. Không có URL production để kiểm chứng TLS/rollback.

## Biến môi trường, secrets và việc nhóm cần làm

- API: DATABASE_URL, JWT_SECRET, PORT, CORS_ORIGINS; SEED_DEMO_USERS chỉ true trên demo/test.
- Web build: NEXT_PUBLIC_API_URL, tuyệt đối không có JWT_SECRET.
- Compose: POSTGRES_PASSWORD (hex URL-safe), JWT_SECRET, CORS_ORIGINS, NEXT_PUBLIC_API_URL, WEB_PORT/API_PORT; production thêm REGISTRY_IMAGE/RELEASE_SHA.
- Test: TEST_DATABASE_URL riêng có tên database hợp lệ; DATABASE_URL trỏ cùng DB khi migrate/seed.
- GitHub: GITHUB_TOKEN packages:write cho publish; production secrets DEPLOY_HOST/DEPLOY_USER/DEPLOY_SSH_KEY/DEPLOY_KNOWN_HOSTS; vars PRODUCTION_API_URL (release và production), PRODUCTION_WEB_URL (production).
- Nhóm duyệt VPS/domain/proxy HTTPS, đặt DB nội bộ + backup, cấp GHCR read token riêng trên VPS, bảo vệ environment release/production và branch check ci.
- Review thay đổi, tự commit/PR/push/tag a2-v*, chạy CI/CD sau approval; ghi URL/run thật, thử rollback, hoàn thiện sơ đồ Task 2–3, video/demo, review/retro.

Hướng dẫn Windows đầy đủ và lệnh khởi chạy ở README; production/rollback ở docs/deployment.md. Không có yêu cầu cung cấp secret vào chat.

## Checklist Assignment 2

- [x] 7.1 Source luồng MVP tích hợp Task 4, không tạo hệ thống song song.
- [x] 7.2 Unit/integration/E2E thực chạy với PostgreSQL độc lập.
- [x] 7.2 Migration/seed, Compose bền vững và health endpoint.
- [x] 7.3 Cấu hình quality gate, image SHA, push/deploy/migrate/smoke và rollback guide.
- [ ] 7.3 Pipeline GitHub/registry/production thật và rollback đã thử trên hosting.
- [x] 7.4 README, release notes bản dự thảo, review/retro template.
- [ ] 7.4 HTTPS URL production, release/tag thật, video/demo và buổi review/retro thật.
- [x] 8 Ma trận dùng mã SRS thật, code/API và test có đường dẫn.
- [ ] 8 Tạo phẩm thiết kế Task 2–3 để truy vết đủ năm cột và nghiệm thu đầy đủ.

PASS = đã chạy/kiểm chứng; FAIL = đã chạy nhưng còn lỗi; BLOCKED = thiếu điều kiện; NOT RUN = chưa chạy; NOT IMPLEMENTED = chưa hiện thực.
Không có FAIL kiểm tra cuối được che bằng bỏ qua bước; phần chưa chạy được ghi riêng.

## Inventory đường dẫn

Danh sách dưới gồm file mới và sửa, chưa stage/commit. Mỗi dòng nêu mục đích thay đổi; không có .env thật hoặc migration cũ.
| Loại | Đường dẫn | Mục đích |
|---|---|---|
| Sửa | `.env.example` | Danh mục cấu hình mẫu, không chứa secret thật |
| Metadata | `.gitattributes` | Nội dung không đổi; git hash-object và HEAD cùng 26505f45150407f9926385400148facaf8ec7f77; Git vẫn báo M theo metadata |
| Sửa | `.github/workflows/ci.yml` | Quality gate CI và CD có release/production approvals |
| Sửa | `.gitignore` | Bỏ qua output Playwright sinh tự động |
| Sửa | `README.md` | Hướng dẫn local/Windows/test/build/deploy/rollback |
| Sửa | `apps/api/.env.example` | Danh mục cấu hình mẫu, không chứa secret thật |
| Sửa | `apps/api/package-lock.json` | Script/dependency cần thiết và lockfile tương ứng |
| Sửa | `apps/api/package.json` | Script/dependency cần thiết và lockfile tương ứng |
| Sửa | `apps/api/prisma/schema.prisma` | Model User/Order/OrderItem/Payment và quan hệ Product |
| Sửa | `apps/api/prisma/seed.ts` | Seed không ghi đè, demo account opt-in |
| Sửa | `apps/api/src/app.module.ts` | Đăng ký CheckoutModule, giữ CatalogModule |
| Sửa | `apps/api/src/main.ts` | Fail startup nếu JWT secret thiếu/yếu |
| Sửa | `apps/web/next.config.ts` | Standalone build phục vụ Docker |
| Sửa | `apps/web/package-lock.json` | Script/dependency cần thiết và lockfile tương ứng |
| Sửa | `apps/web/package.json` | Script/dependency cần thiết và lockfile tương ứng |
| Sửa | `apps/web/src/app/globals.css` | Style responsive theo màu/spacing hiện có |
| Sửa | `apps/web/src/app/layout.tsx` | Bọc ShopProvider và navigation |
| Sửa | `apps/web/src/components/menu/ProductCard.tsx` | Nối nút Task 4 tới trang chi tiết |
| Sửa | `docs/traceability-matrix.md` | Nối requirement thực tới code/test, giữ thiết kế BLOCKED |
| Mới | `.github/workflows/cd.yml` | Quality gate CI và CD có release/production approvals |
| Mới | `apps/api/.dockerignore` | Đóng gói/chạy app và DB, health/volume/network |
| Mới | `apps/api/Dockerfile` | Đóng gói/chạy app và DB, health/volume/network |
| Mới | `apps/api/prisma/migrations/20261021000000_sprint2/migration.sql` | Migration cộng thêm + ràng buộc dữ liệu |
| Mới | `apps/api/src/auth/auth.controller.ts` | Đăng ký/đăng nhập/JWT và guard |
| Mới | `apps/api/src/auth/auth.guard.ts` | Đăng ký/đăng nhập/JWT và guard |
| Mới | `apps/api/src/auth/auth.service.ts` | Đăng ký/đăng nhập/JWT và guard |
| Mới | `apps/api/src/checkout/checkout.controller.ts` | Validation, tính giá, đơn/thanh toán/state/health/options |
| Mới | `apps/api/src/checkout/checkout.module.ts` | Validation, tính giá, đơn/thanh toán/state/health/options |
| Mới | `apps/api/src/checkout/checkout.service.ts` | Validation, tính giá, đơn/thanh toán/state/health/options |
| Mới | `apps/api/src/checkout/order-state.ts` | Validation, tính giá, đơn/thanh toán/state/health/options |
| Mới | `apps/api/src/checkout/payment.ts` | Validation, tính giá, đơn/thanh toán/state/health/options |
| Mới | `apps/api/src/checkout/pricing.ts` | Validation, tính giá, đơn/thanh toán/state/health/options |
| Mới | `apps/api/test/auth.spec.ts` | Kiểm thử unit/HTTP hoặc PostgreSQL integration |
| Mới | `apps/api/test/checkout.integration-spec.ts` | Kiểm thử unit/HTTP hoặc PostgreSQL integration |
| Mới | `apps/api/test/checkout.spec.ts` | Kiểm thử unit/HTTP hoặc PostgreSQL integration |
| Mới | `apps/api/test/order-state.spec.ts` | Kiểm thử unit/HTTP hoặc PostgreSQL integration |
| Mới | `apps/web/.dockerignore` | Đóng gói/chạy app và DB, health/volume/network |
| Mới | `apps/web/Dockerfile` | Đóng gói/chạy app và DB, health/volume/network |
| Mới | `apps/web/playwright.config.ts` | E2E server/API/DB test riêng |
| Mới | `apps/web/src/app/cart/page.tsx` | Routes Next.js Sprint 2 |
| Mới | `apps/web/src/app/checkout/page.tsx` | Routes Next.js Sprint 2 |
| Mới | `apps/web/src/app/login/page.tsx` | Routes Next.js Sprint 2 |
| Mới | `apps/web/src/app/orders/[id]/page.tsx` | Routes Next.js Sprint 2 |
| Mới | `apps/web/src/app/orders/page.tsx` | Routes Next.js Sprint 2 |
| Mới | `apps/web/src/app/products/[id]/page.tsx` | Routes Next.js Sprint 2 |
| Mới | `apps/web/src/app/register/page.tsx` | Routes Next.js Sprint 2 |
| Mới | `apps/web/src/components/shop/AuthScreen.tsx` | Màn hình và Context cho luồng mua hàng |
| Mới | `apps/web/src/components/shop/CartScreen.tsx` | Màn hình và Context cho luồng mua hàng |
| Mới | `apps/web/src/components/shop/CheckoutScreen.tsx` | Màn hình và Context cho luồng mua hàng |
| Mới | `apps/web/src/components/shop/OrdersScreen.tsx` | Màn hình và Context cho luồng mua hàng |
| Mới | `apps/web/src/components/shop/ProductDetail.tsx` | Màn hình và Context cho luồng mua hàng |
| Mới | `apps/web/src/components/shop/ShopProvider.tsx` | Màn hình và Context cho luồng mua hàng |
| Mới | `apps/web/src/lib/shop.test.ts` | API client/tính giỏ và unit test |
| Mới | `apps/web/src/lib/shop.ts` | API client/tính giỏ và unit test |
| Mới | `docker-compose.production.yml` | Đóng gói/chạy app và DB, health/volume/network |
| Mới | `docker-compose.yml` | Đóng gói/chạy app và DB, health/volume/network |
| Mới | `docs/deployment.md` | Audit, bàn giao, kiểm chứng, deploy/release/review/retro |
| Mới | `docs/task5/implementation.md` | Audit, bàn giao, kiểm chứng, deploy/release/review/retro |
| Mới | `docs/task5/release-notes.md` | Audit, bàn giao, kiểm chứng, deploy/release/review/retro |
| Mới | `docs/task5/sprint-review-retrospective.md` | Audit, bàn giao, kiểm chứng, deploy/release/review/retro |
| Mới | `docs/task5/verification.md` | Audit, bàn giao, kiểm chứng, deploy/release/review/retro |
| Mới | `scripts/deploy.sh` | Deploy/migrate/smoke dừng khi lỗi |
| Mới | `tests/e2e/checkout.spec.ts` | Browser tests luồng thật và phục hồi lỗi |
| Mới | `tests/postman/BrewLite-Sprint2.postman_collection.json` | Collection Barista theo SRS |

# Plan: CI/CD BrewLite — test bằng GitHub Actions, deploy toàn bộ lên Vercel

## Context

Nhóm cần một URL công khai chạy đủ luồng (menu → giỏ → đặt đơn → thanh toán → quầy → kho) để demo và nộp bài, và cần test tự động trên mỗi PR. Người dùng đã chốt:
- **Toàn bộ trên Vercel**: project `brewlite-api` (root `backend/`, NestJS chạy thành 1 Vercel Function trên Fluid compute) và `brewlite-web` (root `frontend/`, Next.js 14). Postgres trên **Neon free** (qua Vercel Marketplace).
- **Tài khoản Vercel của Thuan** (không phải chủ repo `DuVinhLoi/BrewLite`, repo private của tài khoản cá nhân). Không dùng Vercel Git integration; **GitHub Actions deploy bằng Vercel CLI + token** sau khi CI xanh.
- **Môi trường**: `main` → production (Neon branch `main`); `develop` và PR cùng repo → một preview chung (Neon branch `preview`).

Ràng buộc đã kiểm chứng (nguồn trong hội thoại):
- Fluid compute chạy nhiều request trên một instance và nhiều instance cùng lúc → khóa trong RAM của `PaymentService` (comment `ponytail:` "đủ cho 1 instance") không còn bảo đảm tiêu chí (b) đề §9 → phải có khóa ở DB.
- Neon pooler là PgBouncer transaction mode → chỉ dùng được `pg_advisory_xact_lock` (khóa theo transaction), không dùng khóa theo session.
- GitHub Free + repo private: **không chặn được merge** (không có rulesets/branch protection, không có Environment secrets) → CI chỉ báo trạng thái; deploy vẫn bị chặn bởi `needs:`. Secret do **DuVinhLoi** đặt; phút Actions trừ vào quota của DuVinhLoi (2.000 phút/tháng).
- Vercel Standard Protection khóa mọi URL trừ domain production, Hobby không có team → **tắt Deployment Protection** ở cả 2 project, preview thành công khai.
- Hobby không có cộng tác trên repo private; deploy CLI bằng token của chủ tài khoản là cách cộng đồng dùng, nhưng là vùng xám về điều khoản → spike ở Task 1, thất bại thì chuyển repo public hoặc Vercel Pro.

Nhánh làm việc: tạo `feature/vercel-cicd` từ `develop` (cập nhật sau khi nhánh `docs/sequence-readability` được xử lý).

## Thiết kế

### Khóa chạy được trên nhiều instance (thay `withLock` private)
- `backend/src/contracts/lock.contract.ts`: `export interface ILockService { withLocks<T>(keys: string[], fn: () => Promise<T>): Promise<T> }`.
- `backend/src/common/in-memory-lock.ts`: `InMemoryLock` — chuyển nguyên logic `Map` của `PaymentService.withLock` (`payment.service.ts:26-38`) sang, khóa lồng theo đúng thứ tự `keys`.
- `backend/src/prisma/pg-advisory-lock.ts`: `PgAdvisoryLock(db: PrismaService)` — **chạy `InMemoryLock` trước** (mỗi instance chỉ 1 kết nối chờ cho mỗi key → không cạn pool), rồi **một** `db.$transaction(async (tx) => { await tx.$executeRaw\`SET LOCAL lock_timeout = '8s'\`; for (k of keys) await tx.$executeRaw\`SELECT pg_advisory_xact_lock(hashtextextended(${k}, 0))\`; return fn(); }, { maxWait: 10000, timeout: 20000 })`. Dùng `$executeRaw` (không `$queryRaw`: cột `void` làm Prisma lỗi). `fn` dùng repo như cũ (kết nối khác trong pool), nên `runInTransaction` bên trong (nhánh hủy, nhánh ghi sau charge) vẫn chạy: đỉnh 2 kết nối/request.
- `PaymentService`: tham số thứ 6 tùy chọn `lock: ILockService = new InMemoryLock()`; `processPayment` gọi `this.lock.withLocks([\`key:${k}\`, \`order:${id}\`], …)`; `cancelOrder`, `advanceOrder` gọi `withLocks([\`order:${id}\`], …)`. Thứ tự `key → order` giữ nguyên; `cancel`/`advance` chỉ khóa `order` → không deadlock.
- `payment.module.ts`: factory inject thêm khóa — `useDb ? PgAdvisoryLock : InMemoryLock` (cùng pattern chọn repo hiện có).
- Giới hạn ghi bằng comment `ponytail:` và vào mục C §2.4: `timeout` 20s hết thì Prisma rollback (nhả khóa) trong khi `fn` có thể còn chạy; chấp nhận vì cổng thanh toán là mock và nhanh.

### Chạy được trên Vercel
- `backend/src/main.ts`: `app.listen(process.env.PORT ?? 3000)`; `CORS_ORIGIN` nhận thêm phần tử dạng `/regex/`: `.map(o => o.startsWith('/') && o.endsWith('/') ? new RegExp(o.slice(1, -1)) : o)`. Regex khóa theo scope Vercel, không mở `*.vercel.app`.
- `backend/package.json`: `"build": "prisma generate && tsc -p tsconfig.json"` (**không** dùng `postinstall`: Dockerfile chạy `npm ci` trước `COPY . .`, chưa có schema).
- `backend/prisma/schema.prisma`: `generator client { binaryTargets = ["native", "rhel-openssl-3.0.x"] }` (build trên runner Ubuntu, runtime Vercel là RHEL). **Không** thêm `directUrl` (thiếu biến làm hỏng compose và `test/compose-env.spec.ts`); migrate dùng `DATABASE_URL=$DIRECT_URL`.
- `backend/Dockerfile`, `docker-compose.yml`: giữ nguyên (chạy local).
- Biến Vercel — `brewlite-api`: `DATABASE_URL` (Neon pooled + `connection_limit=5&pool_timeout=20&connect_timeout=15`), `JWT_SECRET` (bắt buộc, `auth.module.ts` throw nếu thiếu), `CORS_ORIGIN`; `brewlite-web`: `NEXT_PUBLIC_PAYMENT_MODE=api` (`NEXT_PUBLIC_API_URL` truyền lúc build). Không đánh dấu "Sensitive" (không `vercel pull` được).

### CI/CD: một file `.github/workflows/ci.yml`
Trigger: `pull_request` (vào `develop`, `main`) và `push` (`develop`, `main`). Không dùng `workflow_run` (chỉ chạy khi file nằm trên nhánh mặc định).
- **backend**: `services: postgres:16`; `npm ci`; `npx prisma generate`; `npx prisma migrate deploy`; `npx ts-node prisma/seed.ts`; `npx jest` **không** có `DATABASE_URL` (toàn bộ test RAM — các module chọn repo theo biến này lúc import); rồi `DATABASE_URL=… npx jest --runInBand test/pg-`; `npm run build`.
- **frontend**: `npm ci`; `npm run lint`; `npx vitest run`; `npm run build`.
- **docs**: `node --test "scripts/*.test.mjs"`; `node scripts/check-sequence-activation.mjs docs/user-sequence-specifications.md`.
- **deploy** (`needs: [backend, frontend, docs]`, `if: github.event_name == 'push' || github.event.pull_request.head.repo.full_name == github.repository`; `concurrency: deploy-${{ env }}`, `cancel-in-progress: false`):
  1. Chọn môi trường theo nhánh (`main` → production, còn lại → preview) và secret tương ứng (secret cấp repo: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID_API`, `VERCEL_PROJECT_ID_WEB`, `DIRECT_URL_PROD`, `DIRECT_URL_PREVIEW`, `WEB_URL_PROD`).
  2. Migrate + seed: `DATABASE_URL=$DIRECT_URL npx prisma migrate deploy && npx ts-node prisma/seed.ts`. PR có sửa `backend/prisma/migrations/**` thì **bỏ qua deploy** (chỉ `develop` được migrate preview chung).
  3. Backend: `vercel pull --environment=<env>` → `vercel build [--prod]` → `API_URL=$(vercel deploy --prebuilt [--prod])` (stdout là URL), chạy trong thư mục **không có `.git`** nếu spike cho thấy CLI bị chặn vì tác giả commit.
  4. Frontend: build với `NEXT_PUBLIC_API_URL=$API_URL` (production dùng domain cố định của `brewlite-api`), `vercel deploy --prebuilt [--prod]` → `WEB_URL`.
  5. Smoke chỉ đọc: `GET $API_URL/products` → 200 JSON; `GET $WEB_URL` → 200; `OPTIONS $API_URL/products` với `Origin: $WEB_URL` → `access-control-allow-origin: $WEB_URL`. Không tạo đơn (rule doc-code-sync cấm dùng tài khoản demo cho smoke).

## Tasks (thứ tự, mỗi task một commit, tiêu chí xong)

1. **Spike (bỏ được, không merge)** — `vercel link`/`build`/`deploy --prebuilt` thủ công `backend/` lên preview với Neon branch `preview`.
   Xong khi: `GET /products` 200 trên Vercel; deploy được một commit do tài khoản khác viết; `pg_advisory_xact_lock` chạy qua pooled URL. Thất bại ở mục tác giả commit → dừng, hỏi người dùng (repo public / Vercel Pro).
2. **Khóa trên DB** (`lock.contract.ts`, `in-memory-lock.ts`, `pg-advisory-lock.ts`, `payment.service.ts`, `payment.module.ts`) — TDD.
   Test mới trong `backend/test/pg-payment.integration.spec.ts`: (a) hai `PaymentService` với hai `PrismaService` riêng + `PgAdvisoryLock`, 10 request trả tiền song song cùng key → `MockPaymentGatewayService` `charge` đúng 1 lần, 1 biên lai; (b) `connection_limit=2`, 10 request cùng key trên một instance → không kẹt, xong trong thời gian giới hạn.
   Xong khi: `npx jest` xanh; `DATABASE_URL=… npx jest --runInBand test/pg-` xanh; test cũ không phải sửa.
   Tài liệu (cùng commit, theo `.claude/rules/doc-code-sync.md`): message "Xếp hàng theo khóa trong tiến trình" và mục C §2.4 trong `docs/user-sequence-specifications.md`, ma trận Phần III; `docs/class-diagrams.md` (contract mới, constructor `PaymentService`). `node scripts/check-sequence-activation.mjs docs/user-sequence-specifications.md` ra `0 activation, 0 dài, 0 giọng`; render PlantUML không lỗi.
3. **Sẵn sàng cho Vercel** (`main.ts`, `package.json` build, `schema.prisma` binaryTargets).
   Test mới: CORS nhận chuỗi và regex (`backend/test/` — tách hàm `parseCorsOrigins` ra `backend/src/common/cors.ts` để test thuần). Xong khi: `bootstrap-env.spec.ts`, `compose-env.spec.ts` xanh; `docker compose up` vẫn chạy.
4. **`ci.yml` (3 job test)**. Xong khi: một PR thử vào `develop` chạy xanh cả 3 job; 2 suite `test/pg-` chạy thật (không skip).
5. **Job deploy preview**. Xong khi: push `develop` → smoke + CORS đạt; mở URL web, đăng nhập `demo@brewlite.vn` (mật khẩu demo của seed), đặt và trả một đơn thành công.
6. **Deploy production + tài liệu vận hành**. README (mục "Deploy"): kiến trúc 2 project + Neon, biến môi trường, seed đặt lại mật khẩu demo mỗi lần deploy, Neon ngủ sau 5 phút (gọi trước khi demo), cách rollback `vercel rollback` (migration chỉ đi tiến, kiểu expand/contract), giới hạn: không chặn merge trên GitHub Free, secret prod đọc được bởi ai có quyền ghi workflow. Xong khi: push `main` → smoke đạt; thử `vercel rollback` một lần.

## Bước chỉ con người làm (gom vào script `/wizard`, chạy trước Task 5)
- Thuan: tạo Vercel Hobby, 2 project (root dir, **tắt Deployment Protection**, tắt Git integration), tích hợp Neon (branch `main`, `preview`), đặt env vars, tạo `VERCEL_TOKEN`, lấy `ORG_ID`/`PROJECT_ID`.
- DuVinhLoi (chủ repo): thêm 7 secret repo-level.

## Files chính
- Sửa: `backend/src/payment/payment.service.ts`, `backend/src/payment/payment.module.ts`, `backend/src/main.ts`, `backend/package.json`, `backend/prisma/schema.prisma`, `backend/test/pg-payment.integration.spec.ts`, `docs/user-sequence-specifications.md`, `docs/class-diagrams.md`, `README.md`.
- Tạo: `backend/src/contracts/lock.contract.ts`, `backend/src/common/in-memory-lock.ts`, `backend/src/prisma/pg-advisory-lock.ts`, `backend/src/common/cors.ts` (+ test), `.github/workflows/ci.yml`.
- Giữ nguyên: `backend/Dockerfile`, `docker-compose.yml`, `.env.example`.

## Verification
- Local: `cd backend && npx jest`; `docker compose up -d db` rồi `DATABASE_URL=postgresql://brewlite:brewlite@localhost:55432/brewlite npx jest --runInBand test/pg-` (máy có Postgres native chiếm 5432 — dùng cổng override 55432 theo ghi chú memory); `cd frontend && npm run lint && npx vitest run && npm run build`; `node --test "scripts/*.test.mjs"`; script kiểm sơ đồ.
- CI: PR thử vào `develop` xanh 3 job, log cho thấy `test/pg-` không skip.
- Deploy: smoke tự động (GET API, GET web, CORS preflight) + kiểm tay luồng đặt món – thanh toán trên preview, rồi production.
- Review: `/code-review` mức high trên nhánh trước khi merge vào `develop`.

## Rủi ro còn lại
- Vercel có thể chặn deploy CLI cho commit của người khác (Task 1 phát hiện sớm).
- Neon free ngủ sau 5 phút + cold start function → lần gọi đầu chậm vài giây.
- Preview chung: PR sau ghi đè preview của PR trước; dữ liệu preview dùng chung.

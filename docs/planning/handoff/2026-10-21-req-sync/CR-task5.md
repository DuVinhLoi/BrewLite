# CR-task5: đồng bộ Task 5 (`feat/assignment2-task5-delivery`) với `develop-Assignment2`

> Chỉ mục: [`README.md`](README.md). Branch: **`feat/assignment2-task5-delivery`** (quyết định P2). Branch `feat/assignment2-task5` ngừng dùng, không merge.
>
> CR-5.1 đến CR-5.3 là **sửa code**. Theo `.claude/rules/doc-code-sync.md`, code chỉ viết khi người dùng yêu cầu rõ, và nhóm phải giải thích được. D3 đã chốt 2026-10-22.

## Phân công Task 5 (chốt 2026-10-22)

| Pha | Ai | Việc |
|---|---|---|
| A | Chủ Task 5 | CR-5.0 lần 1 (sync ngay, không chờ PR #9); dựng Render, Vercel, deploy tay một lần để có URL (CR-5.3, phần cấu hình nền tảng). Xong thì báo Người 1–3 |
| B | Người 1 | [`card-task5-p1.md`](card-task5-p1.md): số lượng, giới hạn tồn kho, "20 món" |
| B | Người 2 | [`card-task5-p2.md`](card-task5-p2.md): xác nhận xóa, thành tiền từng dòng, PWA manifest (NFR-10) |
| B | Người 3 | [`card-task5-p3.md`](card-task5-p3.md): tóm tắt đơn, lỗi tại ô thẻ, bỏ 502 ở web |
| B | Chủ Task 5 | CR-5.1, CR-5.2 (phần API), CR-5.3 (CD, Dockerfile), CR-5.4 |
| C | Chủ Task 5 | Review và merge PR của Người 1–3 vào branch delivery; CR-5.0 lần 2 sau khi PR #9 merge; CR-5.5 (ma trận, chép mã test từ mô tả PR của Người 1–3); CR-5.6; mở PR vào `develop-Assignment2` |
| D | Chủ Task 5 | Tag `a2-v*`, smoke test, diễn tập rollback, release notes |

Người 1–3 chỉ sửa file trong card của mình. Chủ Task 5 không sửa các file đó trong Pha B, và là người duy nhất sửa `docs/traceability-matrix.md`.

## Vì sao cần làm

Branch delivery tách từ baseline SRS cũ (`0130ae0`), trước PR #11. Code còn 422 `IDEMPOTENCY_KEY_REUSED` và 502 `PAYMENT_SERVICE_UNAVAILABLE` (C3), so replay có cả `cardNumber` (D2), và CD deploy bằng SSH lên VPS (P1).

**Đã khớp, giữ nguyên:**
- `/health` trả `{status, database}`, 503 kèm `status: 'error'` (C2);
- `Product.description` (D1);
- không có cột `version` hay idempotency cho `POST /orders`;
- image API gắn tag `$GITHUB_SHA`; CD chạy khi có tag `a2-v*`;
- `tests/e2e/checkout.spec.ts` và `tests/postman/BrewLite-Sprint2.postman_collection.json` không dùng thẻ `…0119` (đã `git grep`).

**Allowed paths (chủ Task 5):** `apps/api/src/checkout/`, `apps/api/test/checkout*.ts`, `apps/api/prisma/migrations/` (một migration mới, CR-5.1), `apps/api/Dockerfile`, `apps/api/README.md`, `apps/web/README.md`, `.github/workflows/cd.yml`, `scripts/deploy.sh` (xóa), `docker-compose.production.yml` (xóa), `README.md`, `docs/deployment.md`, `docs/task5/`, `docs/traceability-matrix.md` (cột Code/API, Test), `tests/`, `docs/planning/handoff/2026-10-21-req-sync/report-task5.md`.

## CR-5.0: Lấy baseline mới

Làm **hai lần**:

- **Lần 1 (Pha A, ngay):** để Người 1–3 tách branch từ nền đã theo SRS mới. Branch delivery đang chậm `develop-Assignment2` 33 commit (đo tại `b67dc92`).
- **Lần 2 (Pha C, sau khi PR #9 merge):** lấy các commit sau `f1b856a` của PR #9. Đã thử `git merge-tree` giữa `a2/Task4` và branch delivery: chỉ xung đột `README.md` và `docs/traceability-matrix.md`.

Mỗi lần:

1. `git switch feat/assignment2-task5-delivery && git pull origin develop-Assignment2`.
2. Xung đột dự kiến ở lần 1 (đã thử tại `b67dc92`): `apps/api/README.md`, `apps/web/README.md`, `docs/traceability-matrix.md`. Giải bằng skill `resolving-merge-conflicts`:
   - **`docs/requirements/*`:** không xung đột. Sau khi pull, đây là nguồn sự thật.
   - **`apps/api/README.md`, `apps/web/README.md`, `README.md`:** giữ mô tả của Task 5 (code mới nhất), rồi sửa theo CR-5.4 và CR-5.5.
   - **`docs/traceability-matrix.md`:** cột Mã yêu cầu, Use-case, Thiết kế lấy theo `develop-Assignment2`; cột Code/API, Test lấy của Task 5, rồi sửa theo CR-5.5.
3. Commit merge. Chạy `python docs/validate_task2.py` (PASS), `npm --prefix apps/api test`, `npm --prefix apps/web test`. Push branch delivery.
4. Lần 1: báo Người 1–3 tách branch từ commit vừa push.

## CR-5.1: Replay thanh toán theo D2, D3

`apps/api/src/checkout/checkout.service.ts`:

| Dòng | Hiện tại | Đổi thành | Căn cứ |
|---|---|---|---|
| 73 | `fingerprint` băm `[orderId, paymentMethod, input.cardNumber ?? null]` | Băm `[orderId, paymentMethod]` | D2: `cardNumber` không dùng để so |
| 79 | tìm `payment` theo `{ userId, idempotencyKey: key, status: 'SUCCESS' }` | Tìm theo `{ userId, orderId, idempotencyKey: key, status: 'SUCCESS' }` | D2, BR-05: so cả `orderId` |
| 81 | `fingerprint` khác → 422 `IDEMPOTENCY_KEY_REUSED` | Bỏ lỗi 422. `fingerprint` khác thì không replay, đi tiếp tới kiểm trạng thái; đơn đã `PAID` → 409 `ORDER_NOT_PAYABLE` | AC-F16.1 (câu cuối), C3 |

**Migration (D3).** `apps/api/prisma/migrations/20261021000000_sprint2/migration.sql:93` có `CREATE UNIQUE INDEX payments_success_key_per_user ON payments ("userId", "idempotencyKey") WHERE status = 'SUCCESS'`. Sau khi dòng 79 so cả `orderId`, dùng lại key cho đơn khác sẽ thu tiền rồi vi phạm index này (500). Thêm migration mới `DROP INDEX payments_success_key_per_user;`. Không sửa migration cũ. Index `payments_one_success_per_order` (dòng 92) vẫn bảo đảm mỗi đơn một `Payment SUCCESS`.

**Test** trong `apps/api/test/checkout.integration-spec.ts` (viết test đỏ trước theo skill `mattpocock-skills:tdd`):

- INT-S2-03 dòng 69: `await pay(second.id, key).expect(422)` → `.expect(201)`, và dòng 70 kỳ vọng đơn thứ hai `PAID` (D3).
- `same key + same method replays`: lần hai 200, cùng `paymentId`, DB có đúng 1 `Payment SUCCESS` (AC-F16.1).
- `same key + same method + different card number replays`: CARD `4242424242424242` rồi CARD `5555555555554444`, cùng key → 200 replay (D2).
- `same key + different method after PAID returns 409`: WALLET thành công rồi CARD cùng key → 409 `ORDER_NOT_PAYABLE`, không thêm `Payment` (AC-F16.1).
- `new key after PAID returns 409` (AC-F16.4; đã có ở INT-S2-03 dòng 67).
- `failed attempt does not lock key`: đã có ở INT-S2-04 (AC-F15.5, AC-F16.5).

## CR-5.2: Bỏ nhánh `UNAVAILABLE` / 502 (C3)

- `apps/api/src/checkout/payment.ts:1-4`: bỏ nhánh thẻ kết thúc `0119`; kiểu trả về còn `'SUCCESS' | 'DECLINED'`.
- `apps/api/src/checkout/checkout.service.ts:93-94`: chỉ còn `PAYMENT_DECLINED` (402).
- `apps/web/src/components/shop/CheckoutScreen.tsx:77` (bỏ 502 ở web): chuyển sang Người 3, [`card-task5-p3.md`](card-task5-p3.md) bước P3-4.
- `apps/api/test/checkout.integration-spec.ts:96`: bỏ bước kỳ vọng 502; đổi tên INT-S2-07 bỏ "timeout is persisted".
- `apps/api/test/checkout.spec.ts:29-31`: bỏ test `UNAVAILABLE`.
- Giữ `SERVICE_UNAVAILABLE` trong `apps/api/src/common/api-exception.filter.ts:19`: dùng cho 503 của `/health`.

## CR-5.3: CD theo P1 (Vercel + Render), bỏ VPS

**Xóa:** `scripts/deploy.sh`, `docker-compose.production.yml`.

**`.github/workflows/cd.yml`** (hiện có job `quality`, `publish`, `deploy`; job `deploy` dùng SSH ở dòng 56–73):

| Job | Nội dung |
|---|---|
| `quality` | Giữ nguyên |
| `publish` | Chỉ build và push `"$IMAGE-api:$GITHUB_SHA"` (= `ghcr.io/duvinhloi/brewlite-api:<sha>`). Bỏ dòng 38, 40, 42, 44 (image web và kiểm `PUBLIC_API`), vì Vercel tự build Next.js |
| `deploy-api` | `curl -fsS -X POST "$RENDER_DEPLOY_HOOK_URL&imgURL=<url-encoded image:$GITHUB_SHA>"`, secret `RENDER_DEPLOY_HOOK_URL`. Đọc tài liệu Render về tham số `imgURL` cho service chạy từ image trước khi viết |
| `deploy-web` | Vercel CLI phiên bản cố định: `vercel pull --yes --environment=production`, `vercel build --prod`, `vercel deploy --prebuilt --prod`. Secret `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` |
| `smoke` | `needs: [deploy-api, deploy-web]`. Ba lệnh `curl` dòng 80–82 đổi `--retry 6 --retry-max-time 120 --retry-connrefused --retry-delay 5` thành `--retry 60 --retry-delay 10 --retry-max-time 600 --retry-all-errors` (AC-N18.2) |
| rollback | Giữ bước `if: failure()`; sửa câu in ra trỏ mục rollback mới của `docs/deployment.md` |

**`apps/api/Dockerfile`, dòng cuối:** `CMD ["node", "dist/main.js"]` → `CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]` (ADR-003). `docker-compose.yml` local vẫn chạy vì `migrate deploy` idempotent.

**Cấu hình nền tảng (người làm; dùng skill `wizard`):**
- **Render Postgres:** ghi ngày tạo và ngày hết hạn gói free vào `docs/deployment.md`; API chỉ dùng **Internal Database URL** (NFR-08).
- **Render Web Service (image):** `ghcr.io/duvinhloi/brewlite-api:<sha>` (package private thì thêm credential registry); Health Check Path `/health`; env `DATABASE_URL` (internal), `JWT_SECRET` (≥ 32 ký tự), `CORS_ORIGINS` = URL Vercel production; tắt auto-deploy; lấy Deploy Hook URL.
- **Vercel project:** Root Directory `apps/web`; env production `NEXT_PUBLIC_API_URL` = URL Render API (HTTPS); tắt Git auto-deploy.
- **GitHub environment `production`:** secret `RENDER_DEPLOY_HOOK_URL`, `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`; biến `PRODUCTION_API_URL`, `PRODUCTION_WEB_URL`. Xóa `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`, `DEPLOY_KNOWN_HOSTS`.

## CR-5.4: Tài liệu deploy

- **`docs/deployment.md`:** viết lại dòng 3 và mục "Production đề xuất: VPS…" (dòng 28–54) cho Vercel + Render: trỏ `docs/architecture/deployment.svg`; tên secret (không ghi giá trị); deploy bằng tag `a2-v*`; **rollback** = gọi deploy hook Render với `imgURL` là image SHA bản trước, `vercel rollback` (hoặc promote deployment trước), rồi chạy lại smoke (AC-N18.3); ghi một lần diễn tập rollback.
- **`README.md`:** dòng 83 bỏ "`4000000000000119` timeout sau 5 giây"; dòng 138 thay lệnh `deploy.sh` bằng cách rollback ở `docs/deployment.md`.
- **`docs/task5/implementation.md:40`:** VPS → Vercel + Render.
- **`docs/task5/verification.md`:** dòng 55–56, 92–93, 172, 179 bỏ `deploy.sh`, `docker-compose.production.yml`, secret SSH, VPS; ghi bằng chứng CD mới khi có. Dòng 68, 73 ("phục hồi PAID" khi reload) là luồng UI hợp lệ, giữ.

## CR-5.5: README app và ma trận

- `apps/api/README.md:21`: bỏ "simulator chống thu trùng theo `orderId`, kết quả thành công còn sau restart để phục hồi E8b (… AC-F16.7)"; thay bằng "API replay theo chủ đơn/`orderId`/key/`paymentMethod` (BR-05, FR-16); simulator không lưu trạng thái".
- `apps/api/README.md:29`: bỏ "thêm `version` từ `APP_VERSION` của image và không cache" và vế "CD chờ…" ở cuối dòng.
- `docs/traceability-matrix.md` (dòng sau khi giải xung đột):
  - FR-15, cột Code/API: "trả 402/502" → "trả 402"; cột Test: bỏ "timeout".
  - FR-16, cột Test: "reused/new key" → "new key, different method, key on other order".
  - NFR-18, cột Code/API: `scripts/deploy.sh` → `apps/api/Dockerfile` (migrate khi khởi động); cột Test: ghi kết quả smoke và rollback thật khi có.
  - Các dòng Task 5 khác: ghi đường dẫn code và mã test vào cột Code/API, Test.

## CR-5.6: Kiểm trước khi mở PR

Chạy sau khi commit:

```text
npm --prefix apps/api run lint && npm --prefix apps/api test && npm --prefix apps/api run build
npm --prefix apps/api run test:integration
npm --prefix apps/web run lint && npm --prefix apps/web run typecheck && npm --prefix apps/web test && npm --prefix apps/web run build
python docs/validate_task2.py
git diff --check origin/develop-Assignment2...HEAD
git grep -n -E "<<<<<<<|>>>>>>>|IDEMPOTENCY_KEY_REUSED|PAYMENT_SERVICE_UNAVAILABLE|'UNAVAILABLE'|0119|402, 502|\b422\b|E8b|AC-F16\.7|APP_VERSION|deploy\.sh|docker-compose\.production|DEPLOY_(HOST|USER|SSH_KEY|KNOWN_HOSTS)|\bVPS\b|timeout sau 5 giây|retry-max-time 120|cardNumber \?\? null|userId: user\.sub, idempotencyKey|402/502|reused/new key" -- apps tests .github README.md docs/deployment.md docs/task5 docs/traceability-matrix.md ':!**/package-lock.json'
```

- Lệnh `git grep` cuối ra 0 dòng.
- `test:integration` cần Postgres. Chạy theo `README.md` gốc của branch; **không** chạy `docker compose` khi cổng 5432/3000 đang có người dùng.
- Ghi `report-task5.md` (output từng lệnh), mở PR bằng skill `mattpocock-skills:pr`: liệt kê D2, D3, C3, chuyển CD sang Vercel + Render, link báo cáo smoke và rollback.

## Ngoài CR này

- `Payment.userId` và `Payment.fingerprint` là cột kỹ thuật, không có trong class diagram domain. Giữ; muốn thể hiện thì Task 2 sửa class diagram trong PR riêng.
- `docs/checkpoints/*` là nhật ký lịch sử, giữ nguyên.

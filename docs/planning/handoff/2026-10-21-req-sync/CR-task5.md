# CR-task5: đồng bộ Task 5 (`feat/assignment2-task5-delivery`) với develop

> Chỉ mục: [`README.md`](README.md). Branch: **`feat/assignment2-task5-delivery`** (quyết định P2). Branch `feat/assignment2-task5` ngừng dùng, không merge.
>
> CR-5.1 đến CR-5.3 là **sửa code**. Theo `.claude/rules/doc-code-sync.md`, code chỉ viết khi người dùng yêu cầu rõ, và nhóm phải giải thích được.

## Vì sao cần làm

Branch delivery tách từ baseline SRS cũ (`0130ae0`). Bản SRS đó còn AC-F15.2 (502 khi Payment Service quá 5 giây) và AC-F16.3 (422 `IDEMPOTENCY_KEY_REUSED`). SRS hiện tại đã bỏ hai tiêu chí này (`srs.md` §1.4, thay đổi 5) và thêm D1, D2, C1, C2 (PR #11). Nền tảng đã chốt là Vercel + Render (P1), trong khi CD hiện tại deploy bằng SSH lên VPS.

**Đã khớp, giữ nguyên:**
- `/health` trả `{status, database}`, 503 kèm `status: 'error'` (C2);
- `Product.description` (D1);
- không có cột `version` hay idempotency cho `POST /orders`;
- image API gắn tag `$GITHUB_SHA`;
- CD chạy khi có tag `a2-v*`.

## CR-5.0: Lấy baseline mới

1. **Chờ PR #9 (Task 4) merge** (README mục 2). Branch delivery đã chứa commit Task 4 `f1b856a`, nhưng chưa có các commit sau đó của PR #9.
2. `git switch feat/assignment2-task5-delivery && git pull origin develop-Assignment2`.
3. Xung đột dự kiến (thử với develop hiện tại: `apps/api/README.md`, `apps/web/README.md`, `docs/traceability-matrix.md`; sau khi PR #9 merge có thể thêm `README.md`). Giải bằng skill `resolving-merge-conflicts`:
   - **`docs/requirements/*`:** không có xung đột (branch không sửa). Sau khi pull, đây là nguồn sự thật mới.
   - **`apps/api/README.md`, `apps/web/README.md`, `README.md`:** giữ mô tả của Task 5 (code mới nhất). Bỏ mọi câu nhắc AC-F16.7, `version`/SHA ở `/health`, VPS/SSH.
   - **`docs/traceability-matrix.md`:**
     - cột Mã yêu cầu, Use-case, Thiết kế lấy theo develop;
     - cột Code/API, Test lấy của Task 5 cho các dòng Task 5 đã hiện thực;
     - các dòng FR-16, NFR-13, NFR-15, NFR-18 giữ câu chữ của develop, chỉ điền thêm đường dẫn code/test.
4. Chạy `python docs/validate_task2.py` (PASS) và các test ở CR-5.4.

## CR-5.1: Replay thanh toán theo D2 (`apps/api/src/checkout/checkout.service.ts:73-82`)

| Hiện tại | Đổi thành | Căn cứ |
|---|---|---|
| Dòng 73: `fingerprint` băm `[orderId, paymentMethod, cardNumber]` | Băm `[orderId, paymentMethod]` | D2: `cardNumber` không dùng để so |
| Dòng 79: tìm `payment` theo `{ userId, idempotencyKey, status: 'SUCCESS' }` | Tìm theo `{ userId, orderId, idempotencyKey, status: 'SUCCESS' }` | D2, BR-05: so theo cả `orderId` |
| Dòng 81: `fingerprint` khác → 422 `IDEMPOTENCY_KEY_REUSED` | Bỏ lỗi 422. `fingerprint` khác thì **không** replay mà đi tiếp tới kiểm trạng thái; đơn đã `PAID` → 409 `ORDER_NOT_PAYABLE` | AC-F16.1 (câu cuối), AC-F16.4; SRS §3.2 không có 422 |

Test cần có (thêm hoặc sửa trong `apps/api/test/checkout.integration-spec.ts`; viết test đỏ trước theo skill `mattpocock-skills:tdd`):

- `same key + same method replays`: lần hai trả 200, cùng `paymentId`, simulator gọi 1 lần, DB có đúng 1 `Payment` `SUCCESS` (AC-F16.1).
- `same key + same method + different card number replays`: CARD `4242424242424242` rồi CARD `5555555555554444`, cùng key → 200 replay (D2).
- `same key + different method after PAID returns 409`: WALLET thành công rồi CARD cùng key → 409 `ORDER_NOT_PAYABLE`, simulator không được gọi (D2).
- `new key after PAID returns 409` (AC-F16.4).
- `failed attempt does not lock key`: thẻ `4000000000000002` rồi `4242424242424242` cùng key → 201, đơn `PAID` (AC-F15.5, AC-F16.5).

Bỏ mọi test đang kỳ vọng 422 `IDEMPOTENCY_KEY_REUSED`.

## CR-5.2: Bỏ nhánh `UNAVAILABLE` / 502

- `apps/api/src/checkout/payment.ts:2-4`: bỏ nhánh thẻ kết thúc `0119` (chờ 5,1 giây rồi trả `UNAVAILABLE`). Kiểu trả về còn `'SUCCESS' | 'DECLINED'`.
- `apps/api/src/checkout/checkout.service.ts:93-94`: chỉ còn `PAYMENT_DECLINED` (402).
- Test: bỏ `apps/api/test/checkout.integration-spec.ts:96` (kỳ vọng 502) và `apps/api/test/checkout.spec.ts:29`. Gỡ thẻ `…0119` khỏi `tests/postman/BrewLite-Sprint2.postman_collection.json` và `tests/e2e/checkout.spec.ts` nếu có.
- **Căn cứ:** SRS §1.4 (5) bỏ "timeout Payment Service"; §3.2 không có 502. Nếu nhóm muốn giữ 502 thì phải sửa SRS trước, trong một PR riêng.

## CR-5.3: CD theo P1 (Vercel + Render), bỏ VPS

**Xóa:**
- `scripts/deploy.sh`, `docker-compose.production.yml` (chỉ dùng cho VPS);
- các secret `DEPLOY_SSH_KEY`, `DEPLOY_KNOWN_HOSTS`, `DEPLOY_HOST`, `DEPLOY_USER` trong tài liệu.

**`.github/workflows/cd.yml`:**

| Job | Nội dung |
|---|---|
| `quality` | Giữ nguyên (`uses: ./.github/workflows/ci.yml`) |
| `publish` | Chỉ build và push image **API** `ghcr.io/<repo>-api:$GITHUB_SHA`. Bỏ build/push image web, vì Vercel tự build Next.js |
| `deploy-api` | `curl -fsS -X POST "$RENDER_DEPLOY_HOOK_URL&imgURL=<url-encoded ghcr.io/<repo>-api:$GITHUB_SHA>"`. Secret `RENDER_DEPLOY_HOOK_URL`. Kiểm lại tài liệu Render về tham số `imgURL` cho service chạy từ image trước khi viết |
| `deploy-web` | Vercel CLI với phiên bản cố định: `vercel pull --yes --environment=production`, `vercel build --prod`, `vercel deploy --prebuilt --prod`. Secret `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` (ADR-004) |
| `smoke` | `needs: [deploy-api, deploy-web]`. `curl --fail --retry 60 --retry-delay 10 --retry-max-time 600 --retry-all-errors` cho `$API_URL/health`, `$API_URL/products`, `$WEB_URL/` (tối đa 10 phút, AC-N18.2) |
| rollback khi lỗi | In hướng dẫn trỏ `docs/deployment.md` (giữ bước hiện có) |

**API image (`apps/api/Dockerfile`, dòng cuối):** đổi `CMD ["node", "dist/main.js"]` thành `CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]` (ADR-003: chạy migration khi container khởi động; migration chỉ cộng thêm nên rollback image an toàn). `docker-compose.yml` local vẫn chạy được, vì migrate deploy idempotent.

**Cấu hình nền tảng (người làm; dùng skill `wizard` để tạo script hướng dẫn):**
- **Render Postgres:** ghi ngày tạo và ngày hết hạn gói free vào `docs/deployment.md`; API chỉ dùng **Internal Database URL** (NFR-08).
- **Render Web Service (Docker image):**
  - image `ghcr.io/<repo>-api:<sha>`; nếu package GHCR private thì thêm credential registry;
  - Health Check Path `/health`;
  - env `DATABASE_URL` (internal), `JWT_SECRET` (≥ 32 ký tự), `CORS_ORIGINS` = URL Vercel production; tắt auto-deploy;
  - lấy Deploy Hook URL để đặt vào secret.
- **Vercel project:** Root Directory `apps/web`; env production `NEXT_PUBLIC_API_URL` = URL Render API (HTTPS); tắt Git auto-deploy (ADR-004).
- **GitHub:** environment `production` với các secret ở bảng trên; biến `PRODUCTION_API_URL`, `PRODUCTION_WEB_URL`.

**`docs/deployment.md`:** viết lại phần production cho Vercel + Render:
- sơ đồ (trỏ `docs/architecture/deployment.svg` sau khi Task 3 merge);
- danh sách secret, chỉ ghi tên;
- deploy bằng tag `a2-v*`;
- **rollback:** gọi deploy hook Render với `imgURL` = image tag SHA bản trước, `vercel rollback` (hoặc promote deployment trước), rồi chạy lại smoke test (AC-N18.3);
- ghi lại một lần diễn tập rollback.
- Bỏ câu "chuẩn bị cho VPS Linux + Docker Compose".

## CR-5.4: Kiểm trước khi mở PR

```text
npm --prefix apps/api run lint && npm --prefix apps/api test && npm --prefix apps/api run build
npm --prefix apps/api run test:integration
npm --prefix apps/web run lint && npm --prefix apps/web run typecheck && npm --prefix apps/web test && npm --prefix apps/web run build
python docs/validate_task2.py
git grep -n "IDEMPOTENCY_KEY_REUSED\|PAYMENT_SERVICE_UNAVAILABLE\|0119\|deploy.sh\|DEPLOY_SSH_KEY\|APP_VERSION" -- apps tests .github docs/deployment.md README.md
```

- Lệnh `git grep` cuối không được ra dòng nào.
- `test:integration` cần Postgres. Chạy theo hướng dẫn trong `README.md` gốc của branch, **không** chạy `docker compose` khi cổng 5432/3000 đang được người khác dùng.

## CR-5.5: Truy vết và tài liệu Task 5

- Ghi đường dẫn code và mã test vào cột Code/API và Test của `docs/traceability-matrix.md` theo `FR-xx`/`NFR-xx`, chỉ các dòng Task 5 làm.
- `docs/task5/*.md` (implementation, verification, release notes, review/retro) giữ lại. Sửa các chỗ nhắc VPS, 502, 422.
- Mô tả PR (skill `mattpocock-skills:pr`) liệt kê: D2, bỏ 502/422, chuyển CD sang Vercel + Render, link báo cáo smoke và rollback.

## Ngoài CR này

- `Payment.userId` và `Payment.fingerprint` là cột kỹ thuật, không có trong class diagram domain. Có thể giữ; nếu Task 2 muốn thể hiện thì sửa class diagram trong PR riêng.
- Branch `thien35` và các branch `frontend/` + `backend/`: không merge. Muốn dùng lại giao diện thì chép có chọn lọc vào `apps/web` qua PR riêng.

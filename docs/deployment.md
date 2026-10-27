# Triển khai và rollback — Task 5

Production theo [Deployment-01](architecture/deployment.svg) và ADR 003/004: **Vercel web + Render API image + Render Postgres internal**.
Web: https://brewlite-a2-web.vercel.app; API: https://brewlite-a2-api.onrender.com.
Deploy tay ngày 23/10/2026 đã PASS health, products và menu tám món. Run/tag, smoke và rollback của release hiện tại được ghi ở [báo cáo Task 5](planning/handoff/2026-10-21-req-sync/report-task5.md) và [release notes](task5/release-notes.md); không suy diễn kết quả CD từ lần deploy tay.

## Cấu hình nền tảng

- Render Postgres `brewlite-a2-db`, PostgreSQL 16, Free/Singapore: tạo 23/10/2026, **hết hạn 22/11/2026**. IP allowlist chỉ 127.0.0.1/32 chặn client công khai. API chỉ nhận **Internal Database URL**; không ghi URL/password vào Git hoặc log.
- Render API `brewlite-a2-api` chạy public image `ghcr.io/duvinhloi/brewlite-api:<FULL_SHA>`, Free/Singapore; Health Check Path `/health`; auto-deploy off. Env: `DATABASE_URL`, JWT ngẫu nhiên ít nhất 32 ký tự trong `JWT_SECRET`, `CORS_ORIGINS=https://brewlite-a2-web.vercel.app`, `PORT=4000`.
- GHCR package brewlite-api public để Render pull anonymous; trong Package settings → Manage Actions access, cấp repository DuVinhLoi/BrewLite quyền Write để GITHUB_TOKEN publish. Public không đồng nghĩa workflow có quyền ghi. Run CD40475323601 đã chứng minh lỗi write_package khi quyền này chưa có.
- Vercel project `brewlite-a2-web`: Root Directory `apps/web`, Next.js, Node 24.x; Production `NEXT_PUBLIC_API_URL=https://brewlite-a2-api.onrender.com`. Không liên kết Git, vì vậy push không tự deploy.
- Docker CMD của API chạy migration trước server. Khi chuyển từ image Pha A, bỏ Docker Command override cũ trên Render để dùng CMD image mới. Migration chỉ thêm một bước bỏ index key xuyên đơn, giữ index mỗi đơn một lần trả thành công; không sửa lịch sử migration.
- Seed chỉ chạy có chủ đích, không ghi đè sản phẩm/tồn kho đã tồn tại. `SEED_DEMO_USERS=true` chỉ dành cho demo được nhóm cho phép; tài khoản demo không dành cho dữ liệu thật. Payment Service mô phỏng không thu tiền thật và không lưu/log số thẻ.

## Local Docker trên Windows

Dùng Docker Desktop Linux engine, worktree Task 5. Chỉ tạo `.env` trên clone mới, không ghi đè file có sẵn:

```powershell
Copy-Item .env.example .env
# Điền POSTGRES_PASSWORD (hex ngẫu nhiên), JWT_SECRET (>=32 ký tự).
docker compose config --quiet
docker compose up -d --build --wait
docker compose run --rm -e SEED_DEMO_USERS=true api npm run prisma:seed
Invoke-RestMethod http://localhost:4000/health
Start-Process http://localhost:3000
```

DB ở network nội bộ và named volume bền vững; không dùng `down -v`, migration reset hoặc xóa volume. Migration chạy idempotent trước API. Đổi cổng web phải đổi CORS; đổi API URL phải build lại web. Demo opt-in: customer.demo@brewlite.local / barista.demo@brewlite.local, mật khẩu Demo@12345.

## GitHub CD theo tag

Environment `production` cần secrets (chỉ tên, không ghi giá trị):

| Secret | Mục đích |
|---|---|
| `RENDER_DEPLOY_HOOK_URL` | Hook bí mật của API image service |
| `VERCEL_TOKEN` | Quyền deploy project Vercel của nhóm |
| `VERCEL_ORG_ID` | Team ID của project |
| `VERCEL_PROJECT_ID` | Project ID web |

Variables `PRODUCTION_API_URL` và `PRODUCTION_WEB_URL` dùng URL HTTPS trên, không có dấu `/` cuối; đặt ở environment mà job sử dụng. Job publish dùng `GITHUB_TOKEN` với `packages:write`, không dùng PAT quyền rộng. Nhóm cấu hình reviewer/tag policy ở GitHub nếu gói tài khoản hỗ trợ; workflow không tự tạo lớp bảo vệ này.

Release một commit đã kiểm chứng bằng tag mới `a2-v*`, không di chuyển hoặc ghi đè tag đã phát hành:

```powershell
git tag -a a2-v<VERSION> <FULL_SHA> -m "BrewLite Assignment 2 release"
git push origin a2-v<VERSION>
```

Workflow `.github/workflows/cd.yml` chạy quality gate, build/push **chỉ API** image full SHA; Render nhận image qua `imgURL` URL-encoded của deploy hook. Vercel CLI cố định phiên bản chạy `pull --environment=production`, `build --prod`, `deploy --prebuilt --prod` từ cấu hình project. Web build dùng env Production; không nhúng secret API vào frontend. Deploy hook được lưu dưới dạng secret; không in full hook URL trong log.
Trước mỗi release ghi lại image SHA API và deployment ID web đang live để rollback. Migration thất bại phải dừng server/deploy và điều tra, không đánh dấu applied thủ công hoặc reset DB để làm xanh.

## Smoke HTTPS

Sau khi hook Render được chấp nhận và Vercel deploy xong, workflow gọi health, products và web với retry cho cold start Render Free. Hook là bất đồng bộ: health có thể còn thuộc image cũ; người phát hành phải xác nhận Render deployment live và image đúng full SHA trong dashboard/CLI trước khi nghiệm thu release:

```bash
curl -fsS --retry 60 --retry-delay 10 --retry-max-time 600 --retry-all-errors "$PRODUCTION_API_URL/health"
curl -fsS --retry 60 --retry-delay 10 --retry-max-time 600 --retry-all-errors "$PRODUCTION_API_URL/products"
curl -fsS --retry 60 --retry-delay 10 --retry-max-time 600 --retry-all-errors "$PRODUCTION_WEB_URL/"
```

Nghiệm thu cần health 200 `{"status":"ok","database":"up"}`, products 200 có dữ liệu và trình duyệt web hiển thị menu qua CORS đúng origin. HTTP thành công chưa thay thế kiểm nội dung. Lưu run URL, tag/full SHA, deployment IDs, thời điểm và output đã che secret vào release notes.

## Rollback

1. Chọn **full SHA và deployment ID trước release** đã ghi lại; xác nhận code cũ tương thích schema sau migration.
2. Gọi Render deploy hook với image SHA trước qua `imgURL` URL-encoded. Ví dụ từ shell có secret được cấp qua env, không bật shell tracing:

```bash
previous_image="ghcr.io/duvinhloi/brewlite-api:$PREVIOUS_SHA"
encoded_image=$(printf '%s' "$previous_image" | jq -sRr @uri)
curl -fsS -X POST "${RENDER_DEPLOY_HOOK_URL}&imgURL=${encoded_image}"
```

3. Vercel: `vercel rollback <PREVIOUS_DEPLOYMENT_ID_OR_URL> --yes --token "$VERCEL_TOKEN"`, hoặc promote deployment trước theo quyền/gói tài khoản. Dùng đúng team/project đã link; không build lại và gọi đó là rollback deployment cũ.
4. Chờ Render báo live, Vercel production trỏ deployment trước; chạy lại ba smoke HTTPS và kiểm menu thật.
5. Ghi thời điểm, image/deployment trước/sau, run URL và kết quả thực tế vào release notes. Sau diễn tập có thể redeploy bản release đã kiểm chứng rồi smoke lại để production kết thúc ở bản mong muốn.

Không tự chạy SQL down migration hoặc rollback/reset DB. Nếu schema tương lai phá tương thích, cần forward-fix/backup plan đã duyệt. Lỗi DNS/TLS phải điều tra riêng. **Chưa có bằng chứng thực thi thì rollback vẫn NOT RUN**, không lấy hướng dẫn này làm bằng chứng PASS.

## Diễn tập ngày27/10/2026

Manual Render REST imageUrl và Vercel rollback đã đưa cả hai về bản trước, health/products/menu8PASS; sau đó khôi phục release d8dcb87 và smoke PASS. Không rollback DB. IDs/thời điểm ở [release notes](task5/release-notes.md) và [metadata](task5/release-evidence.json). Chưa nghiệm thu deploy hook trong CI vì hai secret dashboard còn thiếu.

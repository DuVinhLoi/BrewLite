# Triển khai và rollback — Task 5

Trạng thái: cấu hình được chuẩn bị cho VPS Linux + Docker Compose; chưa có URL/hosting của nhóm.
Không coi tài liệu này là bằng chứng production đã chạy. Task 3 architecture/deployment diagram vẫn do nhóm bổ sung.

## Local Docker trên Windows

Cần Docker Desktop Linux engine. Chạy từ root trong PowerShell:

```powershell
Copy-Item .env.example .env
# Tự điền POSTGRES_PASSWORD (chuỗi hex ngẫu nhiên), JWT_SECRET (>=32 ký tự ngẫu nhiên).
# Không commit .env. Không thay .env đang tồn tại.
docker compose config --quiet
docker compose up -d --build --wait
# Chỉ với database demo riêng: seed không ghi đè sản phẩm/tài khoản đã có.
docker compose run --rm -e SEED_DEMO_USERS=true api npm run prisma:seed
Invoke-RestMethod http://localhost:4000/health
Start-Process http://localhost:3000
```

Compose chạy migrate deploy trong service một lần trước API; migration cộng thêm, không sửa lịch sử.
PostgreSQL không publish cổng, dùng named volume `brewlite-task5_pgdata`. Không chạy `down -v`, migrate reset hoặc xóa volume.
Đổi WEB_PORT phải đổi CORS_ORIGINS; đổi API_PORT phải đổi NEXT_PUBLIC_API_URL và build lại web.
Demo account (chỉ khi opt-in seed): customer.demo@brewlite.local và barista.demo@brewlite.local, mật khẩu Demo@12345.
Seed sản phẩm giữ nguyên dữ liệu đã có, tạo đủ tám sản phẩm trên DB sạch; không dùng seed để reset tồn kho.

## Production đề xuất: VPS Docker Compose + reverse proxy HTTPS

1. Nhóm duyệt nền tảng VPS, domain web/API và cập nhật deployment diagram Task 3 trước nghiệm thu.
2. Operator cài Docker Compose v2 có `up --wait`, tạo `/opt/brewlite`, user deploy có quyền Docker.
3. Operator tạo `/opt/brewlite/.env` quyền 600, không đưa lên Git/CI: POSTGRES_PASSWORD (hex URL-safe), JWT_SECRET (>=32 ngẫu nhiên), CORS_ORIGINS=https://domain-web, REGISTRY_IMAGE=ghcr.io/owner/repo, RELEASE_SHA=SHA đầy đủ. `SEED_DEMO_USERS` không bật.
4. Operator cấu hình reverse proxy trên host (Caddy/Nginx đã có HTTPS): web upstream 127.0.0.1:3000, API upstream 127.0.0.1:4000. Mở 80/443, hạn chế SSH, không mở 5432. Compose chỉ bind app vào loopback; DB không có public port.
5. Operator đăng nhập GHCR trên VPS bằng token chỉ có `read:packages`; không lưu token trong repository. Bật backup PostgreSQL và kiểm tra phục hồi trên DB khác.
6. GitHub: tạo environment `release` và `production`, bật required reviewers và chỉ cho release branch/tag đã duyệt. Nếu không có bảo vệ environment, workflow không tự tạo được lớp phê duyệt này; không dispatch trước khi cấu hình xong.
7. Biến `PRODUCTION_API_URL` trong **cả release và production**, `PRODUCTION_WEB_URL` trong production: URL HTTPS không có dấu `/` cuối. API URL được nhúng vào web image lúc build.
8. Secrets production: `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`, `DEPLOY_KNOWN_HOSTS` (host key xác minh ngoài luồng; không dùng ssh-keyscan không kiểm chứng). Publish dùng `GITHUB_TOKEN` với packages:write, không hardcode credentials.
9. Sau khi được duyệt, người quản lý chạy workflow **Delivery (manual approval)** trên commit đã review hoặc push tag `a2-v*` sau khi được duyệt. Quality gate → phê duyệt release → build/push GHCR tag full SHA → phê duyệt production → pull/migrate/up → smoke HTTPS. Không dùng `latest`.
10. Ghi URL, run URL, full SHA và kết quả smoke vào release notes; tạo release/tag bằng thao tác của người phụ trách. Agent không tự commit/push/tag/deploy.

Script `scripts/deploy.sh` giữ nguyên volume, pull trước, migrate trước khi thay app, dừng ngay khi lỗi.
Migration Task 5 là additive nhưng lock bảng có thể chặn giao dịch ngắn; deploy lúc ít tải, backup trước và chỉ chạy một delivery cùng lúc.
Compose runtime không cấp TLS; production chưa sẵn sàng nếu reverse proxy/domain/certificate chưa cấu hình.
Payment Service là mô phỏng nội bộ, không thu tiền thật, không ghi/log số thẻ; chỉ dùng số thẻ demo.

## Smoke và rollback

Workflow gọi `/health`, `/products` và frontend qua HTTPS với curl fail-on-HTTP-error. Health trả 503 khi DB không dùng được.
Nếu migration fail: pipeline dừng trước khi thay app; điều tra, không đánh dấu migration applied thủ công hoặc reset DB để làm xanh.
Nếu app/smoke fail: pipeline đỏ. Operator chọn SHA trước đã kiểm chứng (ghi lại trước release), SSH vào VPS:

```bash
cd /opt/brewlite
RELEASE_SHA=<FULL_PREVIOUS_SHA> REGISTRY_IMAGE=ghcr.io/owner/repo bash deploy.sh
```

Không chạy SQL down migration tự động. Migration additive giữ tương thích app cũ; nếu migration tương lai phá tương thích phải có kế hoạch forward-fix/backup được duyệt trước.
Sau rollback xác minh health/API/web và ghi kết quả thật vào release notes. Nếu smoke ngoài host fail do DNS/TLS thì sửa proxy/DNS; không rollback DB mù quáng.
Không tự nhận rollback đã kiểm chứng khi chưa chạy trên hosting thật.
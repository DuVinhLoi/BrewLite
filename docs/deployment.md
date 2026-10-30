# Triển khai và rollback — Task 5

> **BREW-INVENTORY-01:** trước phát hành kho nguyên liệu, bắt buộc thực hiện preflight legacy pending orders và kiểm kê theo [inventory runbook](inventory-runbook.md). Sau khi có đơn inventoryTracked=true, bản rollback API phải hiểu cả marker/snapshot; không dùng image cũ chỉ biết Product.stock. Tài liệu triển khai cũ dưới đây không thay thế gate này.

Production theo [Deployment-01](architecture/deployment.svg) và ADR 003/004: **Vercel web + Render API image + Render Postgres internal**.
Web: https://brewlite-a2-web.vercel.app; API: https://brewlite-a2-api.onrender.com.
Deploy tay ngày 23/10/2026 đã PASS health, products và menu tám món. Run/tag, smoke và rollback của release hiện tại được ghi ở [báo cáo Task 5](planning/handoff/2026-10-21-req-sync/report-task5.md) và [release notes](task5/release-notes.md); không suy diễn kết quả CD từ lần deploy tay.

## Cấu hình nền tảng

- Render Postgres `brewlite-a2-db`, PostgreSQL 16, Free/Singapore: tạo 23/10/2026, **hết hạn 22/11/2026**. IP allowlist chỉ 127.0.0.1/32 chặn client công khai. API chỉ nhận **Internal Database URL**; không ghi URL/password vào Git hoặc log.
- Render API `brewlite-a2-api` chạy public image `ghcr.io/duvinhloi/brewlite-api:<FULL_SHA>`, Free/Singapore; Health Check Path `/health`; auto-deploy off. Env: `DATABASE_URL`, JWT ngẫu nhiên ít nhất 32 ký tự trong `JWT_SECRET`, `CORS_ORIGINS=https://brewlite-a2-web.vercel.app`, `PORT=4000`; biến thanh toán VNPay ở mục "Thanh toán VNPay sandbox" bên dưới.
- GHCR package brewlite-api public để Render pull anonymous; trong Package settings → Manage Actions access, cấp repository DuVinhLoi/BrewLite quyền Write để GITHUB_TOKEN publish. Public không đồng nghĩa workflow có quyền ghi. Run CD40475323601 đã chứng minh lỗi write_package khi quyền này chưa có.
- Vercel project `brewlite-a2-web`: Root Directory `apps/web`, Next.js, Node 24.x; Production `NEXT_PUBLIC_API_URL=https://brewlite-a2-api.onrender.com`. Project có liên kết repository; `gitProviderOptions.createDeployments=disabled` tắt native Git deployment để GitHub Actions kiểm soát phát hành. Đã kiểm và đặt lại cấu hình này ngày 28/10/2026.
- Docker CMD của API chạy migration trước server. Khi chuyển từ image Pha A, bỏ Docker Command override cũ trên Render để dùng CMD image mới. Migration trước đây bỏ index key xuyên đơn và giữ index mỗi đơn một lần thành công; BREW-INVENTORY-01 thêm bảng kho/marker/check theo runbook, không sửa lịch sử migration.
- Seed chỉ chạy có chủ đích, không ghi đè sản phẩm/tồn kho đã tồn tại. `SEED_DEMO_USERS=true` chỉ dành cho demo được nhóm cho phép; tài khoản demo không dành cho dữ liệu thật. Thanh toán qua VNPay sandbox không thu tiền thật; hệ thống không nhận, không lưu và không log số thẻ.

## Thanh toán VNPay sandbox

Thanh toán đi qua VNPay sandbox (hệ thống ngoài) theo [kế hoạch VNPay](planning/2026-10-29-vnpay-payment-plan.md) và mục "Tích hợp VNPay sandbox" trong [architecture.md](architecture/architecture.md). Mục này chỉ ghi **tên** biến và cách vận hành; giá trị secret, mã merchant, số thẻ và URL có chữ ký không được đưa vào repo, log CI hay mô tả PR.

### Biến môi trường trên Render

Đặt ở service `brewlite-a2-api` (Environment). Kiểm biến theo từng thao tác, không gom thành một cờ tắt toàn bộ:

| Biến | Tạo URL thanh toán mới | IPN, kiểm return, QueryDR | Mặc định / ghi chú |
|---|---|---|---|
| `VNP_TMN_CODE` | Bắt buộc | Bắt buộc | Không có mặc định; mã merchant do VNPay cấp |
| `VNP_HASH_SECRET` | Bắt buộc | Bắt buộc | Không có mặc định; **secret**, chỉ lưu ở Render và `apps/api/.env` local (bị `.gitignore` chặn) |
| `WEB_URL` | Bắt buộc | Không cần | Không có mặc định; production là `https://brewlite-a2-web.vercel.app`, dùng dựng `vnp_ReturnUrl` |
| `VNP_URL` | Không bắt buộc | Không cần | Mặc định `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html` (URL sandbox công khai, không phải secret) |
| `VNP_API_URL` | Không bắt buộc | Dùng cho QueryDR | Mặc định `https://sandbox.vnpayment.vn/merchant_webapi/api/transaction` (công khai, không phải secret) |
| `PAYMENT_PROVIDER` | Không bắt buộc | Không bắt buộc | Mặc định `vnpay`; giá trị không hỗ trợ thì API dừng khởi động, không tự chuyển sang cổng giả khi thiếu biến VNPay |

Khi thiếu biến:

- API vẫn khởi động và ghi một dòng cảnh báo chỉ gồm tên biến thiếu, không in giá trị; `/health` giữ nguyên `{ status, database }`.
- Tạo URL mới hoặc QueryDR thiếu biến trả 502 `PAYMENT_PROVIDER_ERROR`; IPN thiếu `VNP_TMN_CODE` hoặc `VNP_HASH_SECRET` trả `RspCode` `99` mà không đọc hay ghi DB (VNPay sẽ gọi lại); return trả `valid: false`.
- Replay thanh toán đã thành công và đọc trạng thái từ DB vẫn hoạt động, không cần biến VNPay.

### Điều kiện trước lần deploy đầu tiên chứa code VNPay

1. Thành viên giữ tài khoản Render lưu `VNP_TMN_CODE`, `VNP_HASH_SECRET`, `WEB_URL` vào service `brewlite-a2-api` **trước** lần deploy đầu tiên chứa code thay simulator bằng VNPay. Gửi secret qua kênh riêng, không qua nhóm chat chung, issue hay PR.
2. Người phụ trách deploy xác nhận điều kiện này trước khi phát hành. API vẫn khởi động được khi thiếu biến, nhưng điều đó không thay thế bước 1.
3. Workflow `cd.yml` chạy khi push nhánh delivery, tag `a2-v*` hoặc chạy tay (mục "GitHub CD" bên dưới); không suy luận push nhánh payment sẽ tự deploy.
4. Sau mỗi lần deploy, tạo một URL thanh toán và mở thử: trang VNPay phải hiện form nhập thẻ, không báo sai chữ ký. Smoke của CD chỉ gọi `/health`, `/products` và trang web nên không bắt được lỗi ký.

### Đăng ký IPN URL

IPN là cuộc gọi server-to-server của VNPay vào API để báo kết quả thanh toán.

1. Mở Merchant Admin của VNPay sandbox, hoặc trả lời email kết nối sandbox của VNPay.
2. Gửi IPN URL `https://brewlite-a2-api.onrender.com/payments/vnpay/ipn`. Endpoint công khai, không cần token, luôn trả HTTP 200 kèm `RspCode`.
3. Chỉ đăng ký cho production. Local không nhận được IPN vì VNPay không gọi được `localhost`; local dựa vào QueryDR (`POST /payments/:id/sync`). Render free tier có thể đang ngủ: VNPay gọi lại tối đa 10 lần, cách 5 phút.
4. Kiểm: sau một giao dịch thành công qua production, log Render có `RspCode=00` và Merchant Admin có giao dịch tương ứng.

### Đối soát và hoàn tiền tay

Warning `PAYMENT_RECONCILIATION_REQUIRED` trong log Render nghĩa là VNPay báo đã thu tiền nhưng BrewLite không thể áp kết quả: `Payment` đã `FAILED` (kể cả hết hạn), đơn đã `CANCELLED`, hoặc đơn đã trả bằng payment khác. Hệ thống không tự mở lại đơn và không trừ kho. Dòng warning kèm `vnp_TxnRef` để tra cứu:

1. Lấy `vnp_TxnRef` từ dòng warning. Log chỉ chứa `vnp_TxnRef` và mã kết quả, không chứa secret hay chữ ký.
2. `vnp_TxnRef` chính là `Payment.id`. Đối chiếu bản ghi `Payment` có `id` đó (`orderId`, `amount`, `status`) để biết đơn và số tiền. DB không public; truy cập bằng quyền Render của người phụ trách, không bật external access.
3. Tra giao dịch trong Merchant Admin của VNPay sandbox theo `vnp_TxnRef` để xác nhận số tiền và trạng thái.
4. Nhóm hoặc quản lý cửa hàng quyết định hoàn tiền theo từng trường hợp; hoàn tiền làm tay qua Merchant Admin, ứng dụng không có API hoàn tiền trong phạm vi hiện tại. Không sửa DB để mở lại đơn.
5. Ghi `vnp_TxnRef`, số tiền và kết quả xử lý vào ghi chú vận hành. Không dán chữ ký, payment URL hay secret.

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

Docker không có biến VNPay (không có `VNP_HASH_SECRET`, `VNP_TMN_CODE`): API vẫn khởi động, `/health`, menu, giỏ, đặt đơn, kho và hủy đơn chạy bình thường, nhưng tạo URL thanh toán mới trả 502 `PAYMENT_PROVIDER_ERROR`. Vì vậy Docker không demo được trả tiền offline: VNPay sandbox cần Internet và secret của nhóm, còn cổng giả đã hoãn. Image Docker đặt `NODE_ENV=production` nên không coi cổng giả là phương án mặc định. Demo mất mạng dùng video đã quay. Muốn thử trả tiền trong Docker, nhập biến VNPay vào `.env` local (không commit, không bake vào image) trên bản Compose đã truyền biến này vào runtime; xem thêm [docker-demo.md](docker-demo.md).

DB ở network nội bộ và named volume bền vững; không dùng `down -v`, migration reset hoặc xóa volume. Migration chạy idempotent trước API. Đổi cổng web phải đổi CORS; đổi API URL phải build lại web. Demo opt-in: customer.demo@brewlite.local / barista.demo@brewlite.local, mật khẩu Demo@12345.

## GitHub CD theo push delivery và tag

Environment `production` cần secrets (chỉ tên, không ghi giá trị):

| Secret | Mục đích |
|---|---|
| `RENDER_DEPLOY_HOOK_URL` | Hook bí mật của API image service |
| `RENDER_API_KEY` | Đọc trạng thái deployment mới để chờ đúng image live |
| `VERCEL_TOKEN` | Quyền deploy project Vercel của nhóm |
| `VERCEL_ORG_ID` | Team ID của project |
| `VERCEL_PROJECT_ID` | Project ID web |

Variables `PRODUCTION_API_URL` và `PRODUCTION_WEB_URL` dùng URL HTTPS trên, không có dấu `/` cuối; `RENDER_SERVICE_ID=srv-dbdms83ncjis73aodm1g`; đặt ở environment `production`. Render API key cần đọc deploy của service; dùng scope hẹp nếu tài khoản có hỗ trợ. Job publish dùng `GITHUB_TOKEN` với `packages:write`, không dùng PAT quyền rộng. Nhóm cấu hình reviewer/tag/branch policy ở GitHub nếu gói tài khoản hỗ trợ; phải cho phép delivery và tag release. Workflow không tự tạo lớp bảo vệ này.

Push lên `feat/assignment2-task5-delivery` tự chạy Delivery và deploy sau quality thành công, kể cả push chỉ sửa tài liệu. CI reusable bản cuối giữ lint/build; unit/integration/E2E đã loại sau kiểm chứng theo yêu cầu, bằng chứng tại inventory-verification.md; không có thêm standalone CI cho cùng sự kiện push delivery/tag. PR vào `develop-Assignment2` và các nhánh được CI hỗ trợ chỉ chạy CI. Reviewer environment nếu được bật sẽ làm run chờ duyệt. Các deploy production dùng chung concurrency và không hủy run đang chạy.

Release một commit đã kiểm chứng bằng tag mới `a2-v*`, không di chuyển hoặc ghi đè tag đã phát hành:

```powershell
git tag -a a2-v<VERSION> <FULL_SHA> -m "BrewLite Assignment 2 release"
git push origin a2-v<VERSION>
```

Workflow `.github/workflows/cd.yml` chạy quality gate, kiểm đủ cấu hình production trước khi publish/deploy, rồi build/push **chỉ API** image full SHA; Render nhận image qua `imgURL` URL-encoded của deploy hook. Job API chờ tối đa 600 giây, poll deployment mỗi 10 giây; chỉ đạt khi đúng deployment live và `image.ref` khớp image đã publish. Hook không được tự POST lại khi phản hồi không chắc chắn; người vận hành phải kiểm service trước khi rerun. Vercel CLI cố định phiên bản chạy `pull --environment=production`, `build --prod`, `deploy --prebuilt --prod` từ cấu hình project. Web build dùng env Production; không nhúng secret API vào frontend. Deploy hook được lưu dưới dạng secret; không in full hook URL trong log.
Trước mỗi release ghi lại image SHA API và deployment ID web đang live để rollback. Migration thất bại phải dừng server/deploy và điều tra, không đánh dấu applied thủ công hoặc reset DB để làm xanh.

## Smoke HTTPS

Sau khi Render báo deployment mới live đúng image SHA và Vercel deploy xong, workflow gọi health, products và web với retry cho cold start Render Free. Hook là bất đồng bộ nên workflow phải chờ metadata deployment thay vì lấy health của image cũ làm bằng chứng cho release mới. Khi kiểm tay, cũng phải xác nhận deployment ID/image trên Render trước các lệnh sau:

```bash
curl -fsS --retry 60 --retry-delay 10 --retry-max-time 600 --retry-all-errors "$PRODUCTION_API_URL/health"
curl -fsS --retry 60 --retry-delay 10 --retry-max-time 600 --retry-all-errors "$PRODUCTION_API_URL/products"
curl -fsS --retry 60 --retry-delay 10 --retry-max-time 600 --retry-all-errors "$PRODUCTION_WEB_URL/"
```

Nghiệm thu cần health 200 `{"status":"ok","database":"up"}`, products 200 có dữ liệu và trình duyệt web hiển thị menu qua CORS đúng origin. HTTP thành công chưa thay thế kiểm nội dung. Lưu run URL, tag/full SHA, deployment IDs, thời điểm và output đã che secret vào release notes.

## Rollback

1. Chọn **full SHA và deployment ID trước release** đã ghi lại; xác nhận code đích hiểu cả inventoryTracked true/false và snapshot nguyên liệu theo ADR-006; tương thích schema đơn thuần chưa đủ.
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

Ngày 28/10 bổ sung trigger push delivery, preflight và chờ Render tự động; trạng thái lần triển khai mới ở [báo cáo Task 5](planning/handoff/2026-10-21-req-sync/report-task5.md). Kết quả manual ngày 27/10 không thay thế nghiệm thu CD mới.

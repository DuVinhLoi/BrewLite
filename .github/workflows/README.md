# CI/CD Assignment 2

[`ci.yml`](ci.yml) chạy trên PR vào `develop-Assignment2` và `main`, các push được khai báo và workflow thủ công/tái sử dụng, với Node theo `.nvmrc`. Job **`ci`** chạy **Install → Lint → Unit API/web → Migration/seed ×2 → Typecheck/Build → HTTP integration → Chromium E2E → Compose validation**; mỗi bước dừng khi lệnh lỗi. Prisma Client được generate sau install. Unit VNPay nằm trong `npm --prefix apps/api test` cùng các unit API khác.

PostgreSQL 16 service dùng DB `brewlite_ci`, user `brewlite`, password `fake-ci-only-password`. API/web chỉ bind loopback tại 4105/3105; `JWT_SECRET=FAKE_JWT_SECRET_FOR_CI_ONLY_32_CHARS_MINIMUM`, `VNP_TMN_CODE=FAKETMN1`, `VNP_HASH_SECRET=FAKE_SECRET_FOR_CI_ONLY` đều **fake, CI only**. Không dùng GitHub environment/secret production. Integration chạy tuần tự; Playwright một worker tự quản API/web và ký IPN/return giả độc lập, không thanh toán qua sandbox. [Hướng dẫn local](../../tests/README.md).

Playwright giữ trace khi lỗi. Bước `Upload E2E failure artifacts` chạy khi job lỗi và upload `apps/web/test-results/` nếu có, retention 7 ngày; tải artifact `playwright-failure-<run_attempt>` trên trang run. Danh mục test đã có trên nhánh khôi phục; run đầu success với 219 API unit, 74 web, integration 20 pass/1 skip PR31, 5 E2E trong 195 giây; chuỗi ba run xanh còn chờ tại [hồ sơ CI](../../docs/evidence/ci/README.md).

Workflow chỉ có quyền `contents: read`; checkout không giữ credential. Cache dùng lockfile cả hai app. Không có path filter để PR tài liệu cũng nhận required check `ci`.

Ngày 04/11/2026 đã bật và đọc lại bảo vệ `main`: required check `ci` (strict), một approval, áp dụng cả admin, chặn force push/xóa. Các lần CI cũ nằm trong [hồ sơ minh chứng](../../docs/evidence/ci/README.md); kết quả cutover mới ghi trong [release notes](../../docs/task5/release-notes.md).

`main` là nguồn production duy nhất. `cd.yml` chạy khi push `main`, tag `a2-v*` hoặc chạy tay; PR vào `main` chỉ chạy `ci.yml`, không nhận secret từ environment production qua Delivery. Nhánh delivery cũ không còn trigger CD; push nhánh này chỉ chạy CI theo mẫu nhánh trong `ci.yml`.

Delivery gọi `quality` (CI reusable) → `preflight` → `publish` → `deploy-api` và `deploy-web` → `smoke`. Các deploy dùng chung concurrency `production-delivery`, không hủy run đang chạy. Cả environment `production` và `release` phải giới hạn nhánh `main` và tag `a2-v*` để chặn chạy tay từ nhánh khác. Trước merge cần bằng chứng cấu hình environment, Vercel Git auto-deploy production và điểm rollback; xem [deployment.md](../../docs/deployment.md). Thay đổi workflow không tự cấu hình dashboard.

`cd.yml` giữ pipeline publish image, Render/Vercel deployment, migration startup và smoke vận hành. Cutover/rollback kho phải theo [runbook](../../docs/inventory-runbook.md); không quay về API Product.stock cũ sau khi đã có đơn inventory.

# CI/CD Assignment 2

[`ci.yml`](ci.yml) chạy trên PR vào `develop-Assignment2` và `main`, các push được khai báo và workflow thủ công/tái sử dụng, với Node theo `.nvmrc`. Job **`ci`** chạy **Install → Lint → Migration/seed PostgreSQL riêng → Typecheck/Build → Compose validation** cho hai app; mỗi bước dừng khi lệnh lỗi. Prisma Client được generate sau install. Theo yêu cầu chủ dự án, bộ test và các bước Unit/Integration/E2E đã được xóa sau khi chạy kiểm chứng; chỉ còn unit test VNPay tối thiểu `apps/api/test/vnpay.test.ts` (D3), chạy tay bằng `node --import tsx --test test/vnpay.test.ts` và chưa nằm trong CI; [báo cáo](../../docs/inventory-verification.md) lưu kết quả trước khi xóa.

Workflow chỉ có quyền `contents: read`; checkout không giữ credential. Cache dùng lockfile cả hai app. Không có path filter để PR tài liệu cũng nhận required check `ci`.

Ngày 04/11/2026 đã bật và đọc lại bảo vệ `main`: required check `ci` (strict), một approval, áp dụng cả admin, chặn force push/xóa. Các lần CI cũ nằm trong [hồ sơ minh chứng](../../docs/evidence/ci/README.md); kết quả cutover mới ghi trong [release notes](../../docs/task5/release-notes.md).

`main` là nguồn production duy nhất. `cd.yml` chạy khi push `main`, tag `a2-v*` hoặc chạy tay; PR vào `main` chỉ chạy `ci.yml`, không nhận secret từ environment production qua Delivery. Nhánh delivery cũ không còn trigger CD; push nhánh này chỉ chạy CI theo mẫu nhánh trong `ci.yml`.

Delivery gọi `quality` (CI reusable) → `preflight` → `publish` → `deploy-api` và `deploy-web` → `smoke`. Các deploy dùng chung concurrency `production-delivery`, không hủy run đang chạy. Cả environment `production` và `release` phải giới hạn nhánh `main` và tag `a2-v*` để chặn chạy tay từ nhánh khác. Trước merge cần bằng chứng cấu hình environment, Vercel Git auto-deploy production và điểm rollback; xem [deployment.md](../../docs/deployment.md). Thay đổi workflow không tự cấu hình dashboard.

`cd.yml` giữ pipeline publish image, Render/Vercel deployment, migration startup và smoke vận hành. Cutover/rollback kho phải theo [runbook](../../docs/inventory-runbook.md); không quay về API Product.stock cũ sau khi đã có đơn inventory.

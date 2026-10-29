# CI/CD Assignment 2

[`ci.yml`](ci.yml) chạy trên PR vào `develop-Assignment2`, các push được khai báo và workflow thủ công/tái sử dụng, với Node theo `.nvmrc`. Job **`ci`** chạy **Install → Lint → Migration/seed PostgreSQL riêng → Typecheck/Build → Compose validation** cho hai app; mỗi bước dừng khi lệnh lỗi. Prisma Client được generate sau install. Theo yêu cầu chủ dự án, bộ test và các bước Unit/Integration/E2E đã được xóa sau khi chạy kiểm chứng; [báo cáo](../../docs/inventory-verification.md) lưu kết quả trước khi xóa.

Workflow chỉ có quyền `contents: read`; checkout không giữ credential. Cache dùng lockfile cả hai app. Không có path filter để PR tài liệu cũng nhận required check `ci`.

Quản trị viên cần bật branch protection và required check `ci` theo [CONTRIBUTING](../../CONTRIBUTING.md). Các lần CI cũ nằm trong [hồ sơ minh chứng](../../docs/evidence/ci/README.md); chưa chạy CI từ xa cho thay đổi kho chưa commit này.

`cd.yml` giữ pipeline publish image, Render/Vercel deployment, migration startup và smoke vận hành. Việc xóa test không xóa health check hay smoke sau deploy. Cutover/rollback kho phải theo [runbook](../../docs/inventory-runbook.md); không quay về API Product.stock cũ sau khi đã có đơn inventory.

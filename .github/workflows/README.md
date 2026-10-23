# CI/CD Assignment 2

[`ci.yml`](ci.yml) chạy trên `pull_request` vào `develop-Assignment2` và `workflow_dispatch`, với Node theo `.nvmrc`. Một job tên **`ci`** chạy tuần tự **Install → Lint → Unit Test → Build** cho `apps/api` và `apps/web`; mỗi bước dừng khi lệnh lỗi. Prisma Client được generate sau install; API test mock Prisma nên không cần PostgreSQL hoặc secret.

Workflow chỉ có quyền `contents: read`; checkout không giữ credential. Cache dùng lockfile cả hai app. Không có path filter để PR tài liệu cũng nhận required check `ci`.

Quản trị viên cần bật branch protection và required check `ci` theo [CONTRIBUTING](../../CONTRIBUTING.md). Chưa có bằng chứng GitHub đã bật protection hoặc chạy CI; xem [hồ sơ minh chứng](../../docs/evidence/ci/README.md).

`cd.yml`, build/push image, deploy, migration production, smoke và rollback thuộc Task 5.3, chưa có trong Sprint 1.

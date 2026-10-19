# Task 4 — tiếp tục Sprint 1 (2026-10-19)

**Task ID:** A2 Task 4. **Nhánh:** `a2/Task4`, base `0130ae0`.
**Workspace:** `C:\Users\baoth\OneDrive\Desktop\New folder\BrewLite`.
**Owner:** agent hiện tại; người dùng đã xác nhận toàn bộ phạm vi Task 4 và quyền tiếp tục các file chưa track trong phiên làm việc này.

## Phạm vi đã chốt

Theo [kế hoạch A2, Task 4](2026-10-15-assignment2-plan.md) và đề A2 §6: giữ NestJS + Prisma/PostgreSQL, Next.js và hợp đồng Product hiện có. Một job `ci` chạy Install → Lint → Unit Test → Build cho cả hai app; test CI không kết nối DB. Không thay dependency, schema, migration hoặc API.

Allowed paths: `apps/api/**`, `apps/web/**`, `.github/workflows/**`, `.gitignore`, `.nvmrc`, `.env.example`, `README.md`, `CONTRIBUTING.md`, `docs/traceability-matrix.md`, file kế hoạch này, `docs/sprint/backlog.md`, `docs/evidence/ci/**`, `docs/checkpoints/2026-10-19-task4.md`.

Không sửa Task 1–3, code A1 hoặc worktree khác. Sau handoff local, người dùng đã yêu cầu commit và push Task 4 lên `origin/a2/Task4`; không merge base hoặc tạo release. Giữ các file cá nhân/build hiện có, bổ sung ignore phù hợp. Không seed lại DB đang dùng để kiểm thử.

## Các bước và tiêu chí chấp nhận

- [x] Xác nhận root, branch, worktree, trạng thái và ownership; đọc Task 4 cùng SRS FR-01–03, NFR-07/09/11/16/17.
- [x] Baseline: API 3 test, web 12 test; lint/build hai app, web typecheck và smoke API trên PostgreSQL đều pass.
- [x] Setup: ví dụ biến môi trường theo app, Node 24.19.0, ignore output/secret, README chạy local và CONTRIBUTING có branch/PR/Definition of Done.
- [x] CI: `pull_request` vào `develop-Assignment2`, một check `ci`, tuần tự Install → Lint → Unit Test → Build, không bỏ qua lỗi. Chưa chạy hosted CI.
- [x] Bổ sung kiểm chứng `GET /products` rỗng, lỗi DB trả 500 không lộ chi tiết, và UI lỗi HTTP 503 rồi thử lại; sửa CSS chữ ≥16 px/nút cao tối thiểu 44 px theo review SRS.
- [x] Điền Code/API và Test cho phần Sprint 1 trong ma trận; giữ trạng thái chờ thiết kế và tính năng Task 5.
- [x] Chạy install từ lockfile trên bản copy tạm không có `.env`/`node_modules`, rồi các lệnh CI: lint, 18 test, typecheck/build đều pass; [log thật](../evidence/ci/local-verification.txt). Không ghi đè dependency đang có trong workspace.
- [x] Chạy kiểm tra DB chỉ đọc, kiểm YAML, link tài liệu, `git diff --check`, `git diff --name-status`, thống kê 68 file đổi/mới trong allowed paths; review trước handoff. Chi tiết/giới hạn ở [checkpoint](../checkpoints/2026-10-19-task4.md).

## Phụ thuộc và điều kiện nghiệm thu ngoài local

Task 2–3 còn placeholder trong checkout này: Task 4 chỉ là bản nháp, chưa đủ điều kiện merge/nghiệm thu theo cổng B.4. GitHub CLI chưa đăng nhập: chưa có bằng chứng branch protection, board, PR/run xanh-đỏ hoặc Sprint Review/tag. Ghi rõ phần thiếu trong checkpoint và hướng dẫn minh chứng; không tự tạo URL hay đánh dấu đã hoàn tất.

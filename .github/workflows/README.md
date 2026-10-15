# .github/workflows — CI/CD

Thư mục này **chưa có workflow**. Nhóm tự viết ở Task 4.4 và Task 5.3. Khi có workflow thật thì giữ file README này hoặc xóa, tùy nhóm.

## Nhóm phải nộp ở đây

| File | Khi nào chạy | Các bước | Đề A2 |
|---|---|---|---|
| `ci.yml` | `pull_request` | Install, Lint, Unit Test, Build | §6.4 |
| `cd.yml` | Push tag `a2-v*` | Lint và Test, Build Docker Image, Push Registry, Deploy, Smoke Test | §7.3 |

## Yêu cầu bắt buộc

- Pull request không được merge nếu lint, test hoặc build thất bại: bật branch protection cho `develop-Assignment2` (đề A2 §6.4).
- Minh chứng CI: link PR đã chạy CI, một lần pipeline xanh và một lần pipeline bắt được lỗi (đề A2 §6.4).
- CD: quality gate; image gắn tag commit SHA hoặc semantic version; push registry; deploy bằng secret của CI; migration an toàn; health check / smoke test; dừng pipeline khi lỗi và có cách rollback (đề A2 §7.3).
- Secret chỉ nằm ở GitHub Secrets và biến môi trường của nền tảng, không có trong repo hay log CI (đề A2 §7.4).

Hướng dẫn từng bước: `docs/planning/2026-10-15-assignment2-plan.md`, Task 4.4 và Task 5.3.

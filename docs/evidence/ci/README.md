# Minh chứng CI — Task 4.4

## Trạng thái

Source workflow: [ci.yml](../../../.github/workflows/ci.yml). Check bắt buộc dự kiến: **`ci`**. Báo cáo local: [checkpoint Task 4](../../checkpoints/2026-10-19-task4.md).

**Chưa có PR/run GitHub, ảnh protection hoặc minh chứng pipeline đỏ/xanh được xác nhận trong phiên này.** `gh auth status` báo chưa đăng nhập. Log local trong thư mục này chỉ là kiểm chứng local, không thay thế minh chứng GitHub của đề A2 §6.4.

## Thu minh chứng sau khi người có quyền publish nhánh

1. Hoàn tất/chốt Task 2–3 trước khi merge Task 4. Mở PR Task 4 vào `develop-Assignment2` với lý do thay đổi và FR-01–03/NFR-17.
2. Chờ job **`ci`** chạy xong. Lưu URL PR, URL run, commit SHA và ảnh/log có bốn bước Install, Lint, Unit Test, Build đều xanh cho cả hai app.
3. Bật branch protection cho `develop-Assignment2`: ít nhất 1 approval, required check `ci` từ GitHub Actions, branch up to date, không bypass/force-push. Lưu ảnh cấu hình. Hướng dẫn chi tiết: [CONTRIBUTING](../../../CONTRIBUTING.md).
4. Tạo nhánh riêng `a2/ci-demo-fail` từ bản Task 4 đã publish. Chỉ trên nhánh demo đó, đổi kỳ vọng test `formatVnd(45000)` trong `apps/web/src/lib/format.test.ts` từ `45.000đ` thành `0đ`; commit và mở PR vào `develop-Assignment2`. Không sửa workflow để bỏ qua test.
5. Lưu URL PR/run đỏ, log lỗi Unit Test và ảnh PR bị chặn merge. Đóng PR demo, không merge. Giữ PR đỏ đã đóng làm bằng chứng, không đưa test sai vào nhánh Task 4.
6. Trong PR Task 4, dẫn bằng chứng xanh/đỏ, ảnh protection và người review. Chỉ đánh dấu AC-N17.2 đạt sau khi kiểm việc chặn merge thực tế.

Tên file gợi ý khi đã thu thật: `github-green.png`, `github-red.png`, `branch-protection.png`, `github-runs.md` (URL PR/run, SHA, thời điểm, người kiểm). Hiện các file này chưa tồn tại; không dùng URL hay ảnh giả.

## Cơ chế workflow

Một job duy nhất giúp required check có tên ổn định `ci`. Các lệnh trong mỗi bước chạy tuần tự và dừng khi lỗi. Không có `continue-on-error`, điều kiện bỏ qua quality gate hoặc path filter. API test dùng provider Prisma giả; không cần DB/secret trong CI. `workflow_dispatch` cho phép chạy tay sau khi workflow có trên nhánh phù hợp.

Nguồn chính thức: [actions/setup-node](https://github.com/actions/setup-node), [actions/checkout](https://github.com/actions/checkout), [npm ci](https://docs.npmjs.com/cli/v11/commands/npm-ci/), [GitHub protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches). Có workflow trong source không tự bật branch protection.

# Minh chứng CI - Task 4.4

Đã thu minh chứng thật từ GitHub Actions ngày **2026-10-21**. [Báo cáo đối chiếu Task 4 và hồ sơ xanh/đỏ](github-runs.md) có URL PR/run, commit SHA, kết quả từng bước và giới hạn nghiệm thu.

| Minh chứng | GitHub | Log tải từ GitHub |
|---|---|---|
| Pipeline thành công | [PR #9](https://github.com/DuVinhLoi/BrewLite/pull/9), [run 39555707525](https://github.com/DuVinhLoi/BrewLite/actions/runs/39555707525) | [github-green.txt](github-green.txt) |
| Pipeline phát hiện lỗi test | [PR #10 đã đóng, không merge](https://github.com/DuVinhLoi/BrewLite/pull/10), [run 39555838160](https://github.com/DuVinhLoi/BrewLite/actions/runs/39555838160) | [github-red.txt](github-red.txt) |
| Giới hạn bảo vệ nhánh | GitHub trả HTTP 403: cần nâng gói hoặc chuyển repo public để dùng tính năng | [Phản hồi GitHub](github-branch-protection.txt), [quyền tài khoản](github-repository-access.json) |

Đề A2 §6.4 cho phép **ảnh hoặc log**. Hồ sơ dùng log tải từ API GitHub: bản `.txt` chỉ bỏ mã màu ANSI/khoảng trắng cuối dòng cho dễ đọc; [log xanh gốc](github-green-original.txt.gz) và [log đỏ gốc](github-red-original.txt.gz) giữ nguyên byte đã tải trong gzip. Các file `github-*-run.json`, `github-*-jobs.json`, `github-pr-9.json`, `github-pr-10.json` lưu metadata để kiểm tra chéo URL, SHA, bước chạy và trạng thái PR. [Log local cũ](local-verification.txt) chỉ dùng tham khảo riêng.

**Chưa đạt điều kiện bắt buộc chặn merge khi CI lỗi.** CI đỏ và Build bị skip chỉ chứng minh pipeline phát hiện lỗi; không chứng minh GitHub từ chối merge. Tài khoản hiện tại có `push: true`, `admin: false`. Chủ repo cần chọn gói/cấu hình hỗ trợ bảo vệ nhánh, bật required check **`ci`** cho `develop-Assignment2` và xác minh việc chặn merge. Không dùng trạng thái draft của PR #9 làm bằng chứng cho yêu cầu này.

Workflow [ci.yml](../../../.github/workflows/ci.yml) có một job `ci`, chạy tự động khi mở/cập nhật PR vào `develop-Assignment2`: Install -> Lint -> Unit Test -> Build cho cả hai app. Không có `continue-on-error`, path filter hoặc điều kiện bỏ qua quality gate. API test dùng Prisma provider giả; web test dùng fetch giả, không cần DB/secret trong CI.

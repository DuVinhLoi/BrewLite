# Minh chứng CI - Task 4.4

## Khôi phục test — PR32, 06/11/2026

PR [#32](https://github.com/DuVinhLoi/BrewLite/pull/32), nhánh `a2/restore-tests`, head `4e711a8a845c36c11ec09b2ca6dc928a196c495c`: [run 42132213624](https://github.com/DuVinhLoi/BrewLite/actions/runs/42132213624) **success**. Job chạy từ `2026-11-05T23:48:46Z` đến `23:52:01Z`, **195 giây (3 phút 15)**. Unit API 219 pass, web 74 pass, integration 20 pass/1 skip INT-T11b ([PR31](https://github.com/DuVinhLoi/BrewLite/pull/31)), Chromium E2E 5 pass. Workflow có PostgreSQL 16 riêng, seed hai lần và fake secret; xem [pipeline](../../../.github/workflows/README.md) và [lệnh local](../../../tests/README.md).

PR [#33](https://github.com/DuVinhLoi/BrewLite/pull/33) cố ý sai kỳ vọng UNIT-T03 (`124001` thay vì `124000`); [run 42132338210](https://github.com/DuVinhLoi/BrewLite/actions/runs/42132338210) **failure**, unit API 218 pass/1 fail. API GitHub ghi `mergeStateStatus=BLOCKED`, `reviewDecision=REVIEW_REQUIRED`; trạng thái này gồm cả thiếu review, chưa chứng minh riêng nút merge bị chặn chỉ vì test. Ảnh public không có nút merge của người đăng nhập. Không merge PR lỗi.

[Hồ sơ run/log/ảnh mới](2026-11-06-restored-tests.md) ghi metadata và giới hạn. **Còn chờ:** đủ ba run xanh liên tiếp cùng phạm vi, kiểm head cuối và bằng chứng tách rõ required `ci` chặn merge khi đủ các điều kiện khác. Đã đo thời gian tuyệt đối 195 giây; chưa đo phần tăng so với CI cũ. Skip không được tính pass, CI success không chứng minh PR31 đã sửa trên main.

## Hồ sơ lịch sử — 21/10/2026

Các giới hạn quyền/private/branch protection và mô tả workflow phía dưới chỉ áp dụng lần thu tháng 10. Repo hiện public; `main` đã bật required `ci` strict, một approval, áp dụng cả admin theo [P1](../../planning/handoff/2026-11-owner-p1-report.md). Workflow khôi phục hiện chạy đủ tầng theo phần trên.

Đã thu minh chứng thật từ GitHub Actions ngày **2026-10-21**. [Báo cáo đối chiếu Task 4 và hồ sơ xanh/đỏ](github-runs.md) có URL PR/run, commit SHA, kết quả từng bước và giới hạn nghiệm thu.

| Minh chứng | GitHub | Log tải từ GitHub |
|---|---|---|
| Pipeline thành công | [PR #9](https://github.com/DuVinhLoi/BrewLite/pull/9), [run 39555707525](https://github.com/DuVinhLoi/BrewLite/actions/runs/39555707525) | [github-green.txt](github-green.txt) |
| Pipeline phát hiện lỗi test | [PR #10 đã đóng, không merge](https://github.com/DuVinhLoi/BrewLite/pull/10), [run 39555838160](https://github.com/DuVinhLoi/BrewLite/actions/runs/39555838160) | [github-red.txt](github-red.txt) |
| Giới hạn bảo vệ nhánh | GitHub trả HTTP 403: cần nâng gói hoặc chuyển repo public để dùng tính năng | [Phản hồi GitHub](github-branch-protection.txt), [quyền tài khoản](github-repository-access.json) |

Đề A2 §6.4 cho phép **ảnh hoặc log**. Hồ sơ dùng log tải từ API GitHub: bản `.txt` chỉ bỏ mã màu ANSI/khoảng trắng cuối dòng cho dễ đọc; [log xanh gốc](github-green-original.txt.gz) và [log đỏ gốc](github-red-original.txt.gz) giữ nguyên byte đã tải trong gzip. Các file `github-*-run.json`, `github-*-jobs.json`, `github-pr-9.json`, `github-pr-10.json` lưu metadata để kiểm tra chéo URL, SHA, bước chạy và trạng thái PR. [Log local cũ](local-verification.txt) chỉ dùng tham khảo riêng.

**Chưa đạt điều kiện bắt buộc chặn merge khi CI lỗi.** CI đỏ và Build bị skip chỉ chứng minh pipeline phát hiện lỗi; không chứng minh GitHub từ chối merge. Tài khoản hiện tại có `push: true`, `admin: false`. Chủ repo cần chọn gói/cấu hình hỗ trợ bảo vệ nhánh, bật required check **`ci`** cho `develop-Assignment2` và xác minh việc chặn merge. Không dùng trạng thái draft của PR #9 làm bằng chứng cho yêu cầu này.

Workflow [ci.yml](../../../.github/workflows/ci.yml) có một job `ci`, chạy tự động khi mở/cập nhật PR vào `develop-Assignment2`: Install -> Lint -> Unit Test -> Build cho cả hai app. Không có `continue-on-error`, path filter hoặc điều kiện bỏ qua quality gate. API test dùng Prisma provider giả; web test dùng fetch giả, không cần DB/secret trong CI.

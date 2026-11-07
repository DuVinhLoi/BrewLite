# Đóng góp cho BrewLite Assignment 2

## Branch và pull request

- Base production: `main`; PR khôi phục test dùng `a2/restore-tests`. `develop-Assignment2` là base tích hợp A2 trước cutover. Mỗi task phải xác định branch, worktree và allowed paths trước khi sửa.
- Không commit/push thẳng vào base; không force-push hoặc merge thay người khác. Mỗi PR cần ít nhất một reviewer khác tác giả.
- Mô tả PR nêu vấn đề, lý do thay đổi, hành vi sau thay đổi, mục đề A2 hoặc mã `FR-xx`/`NFR-xx`, lệnh kiểm và kết quả thực tế.
- Task 4 được làm nháp khi Task 2–3 chưa xong, nhưng chỉ merge sau khi các tạo phẩm Task 1–3 được chốt qua PR (kế hoạch A2 mục B.4).
- Khi đổi yêu cầu/hành vi, đồng bộ SRS → sơ đồ/ADR liên quan → ma trận truy vết → code/test trong cùng PR. Không đổi tài liệu A1 thành bằng chứng A2.

## Commit

Dùng Conventional Commits, ví dụ:

```text
feat(api): expose product catalog (FR-01, FR-03)
test(web): cover menu retry after server error (FR-02)
ci: check both Sprint 1 apps on pull requests
docs: document Task 4 local setup and evidence
```

Các type thường dùng: `feat`, `fix`, `test`, `docs`, `ci`, `chore`. Commit chỉ chứa phạm vi của task, không chứa `.env`, dependency/build output hoặc capture tạm.

## Quality gate và review

Dùng Node trong `.nvmrc`, cài bằng `npm ci` ở từng app và chạy các lệnh [README](README.md#kiểm-chứng-và-build). PR-2 khôi phục unit API/web, HTTP integration và Chromium E2E; thiết lập DB test/secret giả theo [tests/README.md](tests/README.md). Workflow chạy test cùng lint, migration/seed hai lần, typecheck/build và Compose validation; không dùng `continue-on-error` để che lỗi. Báo cáo cleanup tháng 10 là lịch sử.

Bảo vệ `main` đã được cấu hình và đọc lại ngày 04/11/2026 theo [báo cáo P1](docs/planning/handoff/2026-11-owner-p1-report.md):

1. Require a pull request before merging; ít nhất **1 approval** từ người khác tác giả.
2. Require status checks to pass; chọn check **`ci`** từ GitHub Actions và require branch up to date.
3. Không cho bypass các yêu cầu trên, force-push hoặc xóa nhánh bảo vệ.
4. Kiểm PR cố ý đỏ thực sự không merge được; lưu ảnh/log theo [hồ sơ CI](docs/evidence/ci/README.md).

Đây là cấu hình GitHub, không được bật chỉ bằng workflow. Giới hạn HTTP 403/private ở [hồ sơ tháng 10](docs/evidence/ci/github-runs.md) là lịch sử; repo hiện public. Đã có ba lượt xanh đủ tầng trên `4e711a8` và PR #33 cố ý sai test có run đỏ; vẫn cần minh chứng tách riêng required `ci` chặn merge; không coi PR draft hoặc review thủ công là bằng chứng thay thế.

## Definition of Done

- [ ] Đạt tiêu chí chấp nhận của task và các phụ thuộc đã được chốt.
- [ ] Lint, typecheck/build liên quan chạy thật và pass; hành vi quan trọng được kiểm chứng và ghi kết quả; PR có CI xanh.
- [ ] Unit, integration và E2E liên quan pass trong CI; hành vi thêm/sửa có test phù hợp, gồm lỗi quan trọng, và cập nhật mã test trong ma trận. Skip chỉ áp dụng cho bug có lý do và PR sửa riêng được liên kết, không được báo thành pass.
- [ ] README, tài liệu và ma trận truy vết phản ánh đúng code và kết quả kiểm chứng hiện có.
- [ ] `git diff --check` sạch; đã xem diff và danh sách file mới; không có secret hay thay đổi ngoài allowed paths.
- [ ] Một reviewer khác tác giả đã approve; không còn blocker; required check `ci` đã đạt.
- [ ] Với Task 4: có minh chứng PR/CI xanh, CI bắt lỗi và chặn merge; Sprint Review/Retrospective và tag theo kế hoạch sau khi Sprint được chấp nhận.

## Backlog và bàn giao

[Product Backlog](docs/sprint/backlog.md) theo dõi Sprint 1 và 2 trong repository; nhóm phân công người thực hiện và bổ sung board GitHub Projects khi có. Cập nhật trạng thái dựa trên bằng chứng, không đánh dấu hoàn thành chỉ vì đã có source.

Bàn giao ghi task ID, branch/workspace, file đổi và lý do, lệnh kiểm/kết quả, commit SHA nếu có, giới hạn và blocker.

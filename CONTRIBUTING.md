# Đóng góp cho BrewLite Assignment 2

## Branch và pull request

- Base tích hợp A2: `develop-Assignment2`. Làm trên nhánh `a2/task-<n>-<tên>`; nhánh tiếp tục Task 4 hiện tại là `a2/Task4`.
- Không commit/push thẳng vào base; không force-push hoặc merge thay người khác. Mỗi PR cần ít nhất một reviewer khác tác giả.
- Mô tả PR nêu vấn đề, lý do thay đổi, hành vi sau thay đổi, mục đề A2 hoặc mã `FR-xx`/`NFR-xx`, lệnh kiểm và kết quả thực tế.
- Task 4 được làm nháp khi Task 2–3 chưa xong, nhưng chỉ merge sau khi các tạo phẩm Task 1–3 được chốt qua PR (kế hoạch A2 mục B.4).
- Khi đổi yêu cầu/hành vi, đồng bộ SRS → sơ đồ/ADR liên quan → ma trận truy vết → code/test trong cùng PR. Không đổi tài liệu A1 thành bằng chứng A2.
- Theo [AGENTS.md](AGENTS.md), xác nhận ownership và allowed paths trước khi agent sửa; một writer cho mỗi file ở mỗi pha.

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

Dùng Node trong `.nvmrc`, cài bằng `npm ci` ở từng app và chạy các lệnh [README](README.md#lint-test-và-build). Workflow phải kiểm cả hai app; không dùng `continue-on-error` để che lỗi lint/test/build.

Sau lần CI đầu tiên trên PR, quản trị viên cấu hình bảo vệ `develop-Assignment2`:

1. Require a pull request before merging; ít nhất **1 approval** từ người khác tác giả.
2. Require status checks to pass; chọn check **`ci`** từ GitHub Actions và require branch up to date.
3. Không cho bypass các yêu cầu trên, force-push hoặc xóa nhánh bảo vệ.
4. Kiểm PR cố ý đỏ thực sự không merge được; lưu ảnh/log theo [hồ sơ CI](docs/evidence/ci/README.md).

Đây là yêu cầu cần thiết lập trên GitHub, không được bật chỉ bằng workflow. Ngày 2026-10-21 đã có CI thật xanh/đỏ nhưng API kiểm rules trả HTTP 403 yêu cầu nâng gói hoặc chuyển repo public; contributor có quyền push, không có admin. [Hồ sơ CI](docs/evidence/ci/github-runs.md) lưu phản hồi và log. Chủ repo phải chọn cấu hình hỗ trợ, bật required check và kiểm việc chặn merge; không coi review thủ công, CI đỏ hoặc PR draft là thay thế cho điều kiện của đề A2 §6.4.

## Definition of Done

- [ ] Đạt tiêu chí chấp nhận của task và các phụ thuộc đã được chốt.
- [ ] Lint, test, typecheck/build liên quan chạy thật và pass; PR có CI xanh.
- [ ] Có kiểm chứng cho hành vi thêm/sửa, gồm lỗi quan trọng; không chỉ kiểm happy path.
- [ ] README, tài liệu và ma trận truy vết phản ánh đúng code/test hiện có.
- [ ] `git diff --check` sạch; đã xem diff và danh sách file mới; không có secret hay thay đổi ngoài allowed paths.
- [ ] Một reviewer khác tác giả đã approve; không còn blocker; required check `ci` đã đạt.
- [ ] Với Task 4: có minh chứng PR/CI xanh, CI bắt lỗi và chặn merge; Sprint Review/Retrospective và tag theo kế hoạch sau khi Sprint được chấp nhận.

## Backlog và bàn giao

[Product Backlog](docs/sprint/backlog.md) theo dõi Sprint 1 và 2 trong repository; nhóm phân công người thực hiện và bổ sung board GitHub Projects khi có. Cập nhật trạng thái dựa trên bằng chứng, không đánh dấu hoàn thành chỉ vì đã có source.

Bàn giao ghi task ID, branch/workspace, file đổi và lý do, lệnh kiểm/kết quả, commit SHA nếu có, giới hạn và blocker. Nhóm phải tự hiểu và giải thích được phần code được agent hỗ trợ theo quy tắc của môn học.

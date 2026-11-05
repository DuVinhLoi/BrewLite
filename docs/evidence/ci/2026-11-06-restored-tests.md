# Kiểm chứng CI khôi phục test — 06/11/2026

PR khôi phục: [#32](https://github.com/DuVinhLoi/BrewLite/pull/32),
nhánh `a2/restore-tests`. Ngày dưới đây dùng múi giờ Việt Nam (UTC+7).

## Lần chạy xanh đã xác nhận

| Run / attempt | Commit | Kết quả | Thời gian job |
|---|---|---|---|
| [42132213624 / 1](https://github.com/DuVinhLoi/BrewLite/actions/runs/42132213624/attempts/1) | `4e711a8` | Success | 06:48:46–06:52:01, 3 phút 15 giây |
| [42132213624 / 2](https://github.com/DuVinhLoi/BrewLite/actions/runs/42132213624/attempts/2) | `4e711a8` | Success | 06:52:57–06:54:51, 1 phút 54 giây |
| [42132213624 / 3](https://github.com/DuVinhLoi/BrewLite/actions/runs/42132213624/attempts/3) | `4e711a8` | Success | 06:55:17–06:57:20, 2 phút 3 giây |

Đã đủ ba lượt xanh liên tiếp trên cùng commit, chạy lại toàn bộ job bằng GitHub
rerun (không chỉ rerun test lỗi). [Metadata cả ba lượt](2026-11-06-green-attempts.json)
giữ timestamp và trạng thái từng bước. Cả ba log có cùng số test bên dưới.

Log đã kiểm tra: 219/219 unit API, 74/74 unit/component web, integration
20 pass / 1 skip / 0 fail, Chromium E2E 5/5 pass. Lint, migration, seed hai lần,
build và Compose validation đều thành công. API và web được khởi động mới trên
runner; PostgreSQL 16 dùng DB `brewlite_ci` và thông tin giả.

Skip duy nhất là `INT-T11b`: giữ assertion Barista hủy đơn chưa thanh toán phải
trả 403 theo SRS, nhưng runtime hiện trả 409. [PR #31](https://github.com/DuVinhLoi/BrewLite/pull/31)
sửa quyền và bật lại test; không thay assertion để làm xanh PR khôi phục.

Thời gian các bước lần 1: unit 8 giây, migration/seed 4 giây, build 12 giây,
integration 27 giây, cài Chromium 20 giây, E2E 28 giây. Đây là số đo tuyệt đối;
chưa có phép so sánh cùng điều kiện để kết luận phần thời gian tăng thêm.
Commit tài liệu sau chuỗi này không đổi code/test/workflow; required `ci` trên
head bàn giao được kiểm tra riêng qua checks của PR #32.

## Nhánh sửa quyền riêng — PR #31

[Run 42132522336](https://github.com/DuVinhLoi/BrewLite/actions/runs/42132522336)
success trên `071a3ce`: 227/227 unit API (thêm 8 regression), 74/74 web,
21/21 integration không skip và 5/5 E2E. Job chạy 06:51:15–06:54:41 (206 giây).
Kết quả này chứng minh bản sửa trên nhánh riêng; runtime trên `main` chưa có
guard cho đến khi PR #31 được duyệt và merge. Tích hợp PR #32 trước PR #31.

## Minh chứng test đỏ và cổng merge

[PR nháp #33](https://github.com/DuVinhLoi/BrewLite/pull/33) dùng commit
`037be4b`, chỉ đổi kỳ vọng ví dụ UNIT-T03 từ 124000 thành 124001 so với
nhánh khôi phục. [Run 42132338210](https://github.com/DuVinhLoi/BrewLite/actions/runs/42132338210)
thất bại tại `Unit Test (API and web)`: 218 pass / 1 fail, thực tế 124000,
kỳ vọng 124001, exit code 1. Migration, build, integration, E2E và Compose
validation đều bị skip sau lỗi; không có production deploy.

- [Ảnh run đỏ](2026-11-06-red-ci.png).
- [Trích log lỗi](2026-11-06-red-test.txt), chỉ giữ thông tin assertion và tổng test.
- [Ảnh PR công khai](2026-11-06-red-pr.png).
- [Trạng thái PR trước khi đóng](2026-11-06-red-pr-state.json): `mergeStateStatus=BLOCKED`,
  check `ci=FAILURE`, `reviewDecision=REVIEW_REQUIRED`, `isDraft=true`.

Branch protection được đọc qua GitHub API: required check `ci`, strict up-to-date,
1 approval, dismiss stale reviews và enforce admins. Vì PR còn draft và chưa có
approval, trạng thái BLOCKED có nhiều điều kiện; không quy riêng cho test đỏ.
Ảnh PR chụp khi chưa đăng nhập nên không hiển thị nút merge; bằng chứng trạng thái
merge là JSON API, không phải ảnh nút bị khóa.

PR #33 đã đóng, `mergedAt=null`, nhánh remote thử nghiệm đã xóa. Commit lỗi không
được merge vào `main` hoặc nhánh khôi phục. Worktree local giữ lại để tra cứu.

## Giới hạn bàn giao

Chưa merge PR #32/#31, chưa chạy Delivery từ các thay đổi này và chưa tạo tag hoặc
release. Compose được validate cấu hình; không có bằng chứng Compose smoke chạy
đủ ba container trong lượt CI này. Gia hạn/thay DB production là công việc riêng.

## Phạm vi và cách kiểm chứng

- Task B2–B7/D1–D3/D5–D6, branch `a2/restore-tests`, worktree
  `C:/BrewLite-a2-Task5`. Code/test/CI đã review độc lập tại `4e711a8`;
  tài liệu tại `9e93c4b` và hồ sơ mới cũng đã review, không có finding cần sửa.
- API: `apps/api/test/*.test.ts` và script `apps/api/package.json` khôi phục unit.
  Web: các file `*.test.ts[x]`, setup/helper/config và package/lock bổ sung đúng
  năm devDependency đã duyệt. Không nâng phiên bản package đã có.
- `tests/integration/` cung cấp HTTP fixtures và read-only invariant checks;
  `tests/e2e/` cùng `apps/web/playwright.config.ts` cung cấp Chromium flow.
  `.github/workflows/ci.yml` chạy cả bốn tầng trước build/deploy theo quality gate.
- README/CONTRIBUTING, SRS/UC/ma trận, architecture/ADR/sơ đồ, hướng dẫn deploy,
  backlog và hồ sơ Task5 được đồng bộ; báo cáo tháng 10 giữ nhãn lịch sử.
- Lệnh CI thực chạy: `npm --prefix apps/api test`, `npm --prefix apps/web test`,
  `node --test --test-concurrency=1 'tests/integration/*.test.mjs'`,
  `npm --prefix apps/web run test:e2e`, lint, typecheck, migration/seed, build,
  `docker compose config --quiet`. `git diff --check` và phạm vi diff đã kiểm tra.

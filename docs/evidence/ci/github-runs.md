# Đối chiếu Task 4 và minh chứng CI

Ngày kiểm tra: **2026-10-21**, giờ Việt Nam UTC+7. Đối chiếu trực tiếp đề `Assignment2-BrewLite.pdf`, mục 6.1-6.4, trang in 4-5 (trang PDF 5-6); nội dung tương ứng trong [đề lưu tại repo](../../Assignment2-BrewLite.md#6-task-4--triển-khai-sprint-1).

## Phạm vi và kết luận

- Task ID: **A2 Task 4**, tập trung Task 4.4 / NFR-17.
- Nhánh: `a2/Task4`; worktree: `C:\Users\baoth\OneDrive\Desktop\New folder\BrewLite`.
- HEAD ban đầu: `f1b856a70ba1ae91674c75291f0117ab6643d9b0`.
- Base tích hợp: `develop-Assignment2` tại `8c0ded94c4c023e6820986e089616fa6f359845d`.
- Commit có CI xanh trong hồ sơ: `8a39ea990290d7e1076ab72f82d9e98c3faf84bf`.
- Không merge PR, tạo release, đổi dependency/schema/API hoặc thay workflow trong phiên này.

| Mục đề | Kết quả | Bằng chứng / phần còn thiếu |
|---|---|---|
| 4.1 Repository | Có cấu trúc và tài liệu yêu cầu | `apps/web`, `apps/api`, `docs`, README, ignore, env example; [CONTRIBUTING](../../../CONTRIBUTING.md) có branch/PR, commit và DoD; [Product Backlog](../../sprint/backlog.md) có Sprint 1 và 2. Chưa có phân công/ngày Sprint hoặc link board online. |
| 4.2 Tài liệu | Chưa đủ tạo phẩm Task 1-3 | Task 1 có lịch sử PR; Task 2 đã merge [PR #7](https://github.com/DuVinhLoi/BrewLite/pull/7), [PR #8](https://github.com/DuVinhLoi/BrewLite/pull/8). Task 3 trong base/checkout mới nhất vẫn chỉ có README hướng dẫn, chưa có architecture, ADR thực chất và deployment diagram. |
| 4.3 MVP | Có source chạy được và kiểm tra tự động pass | Hai API sản phẩm, menu responsive, loading/empty/error, seed 8 món; API 5 test và web 13 test pass, hai app build được. Chưa kiểm trực quan viewport/browser hoặc chạy lại migrate/seed trên DB trống trong phiên này. |
| 4.4 CI | Có PR tự chạy CI và log thật xanh/đỏ; chưa nghiệm thu toàn bộ | Bốn quality gate chạy trên GitHub Ubuntu. Điều kiện chặn merge còn thiếu: repo private báo giới hạn gói, contributor không có admin. |

**Không đánh dấu Task 4 hoàn tất:** còn tạo phẩm Task 3 và cấu hình/xác minh required status check. Phần minh chứng thành công và phát hiện lỗi mà đề §6.4 yêu cầu đã có bên dưới.

## Pipeline thành công

| Thuộc tính | Giá trị |
|---|---|
| Pull request | [#9 - Sprint 1 catalog and CI](https://github.com/DuVinhLoi/BrewLite/pull/9), giữ draft để review, không merge |
| Workflow / event | `.github/workflows/ci.yml`, `CI`, `pull_request` |
| Nhánh | `a2/Task4` -> `develop-Assignment2` |
| Commit | `8a39ea990290d7e1076ab72f82d9e98c3faf84bf` |
| Run | [39555707525](https://github.com/DuVinhLoi/BrewLite/actions/runs/39555707525), conclusion `success` |
| Job | [`ci`, 119074874989](https://github.com/DuVinhLoi/BrewLite/actions/runs/39555707525/job/119074874989) |
| UTC | 2026-10-21 06:29:22 - 06:30:44 (13:29:22 - 13:30:44 giờ Việt Nam) |
| Log | [Bản dễ đọc](github-green.txt), [bản gốc nén gzip](github-green-original.txt.gz) |
| Metadata | [Run](github-green-run.json), [jobs/steps](github-green-jobs.json), [PR](github-pr-9.json) |

## Pipeline phát hiện lỗi

| Thuộc tính | Giá trị |
|---|---|
| Pull request | [#10 - CI failure demonstration](https://github.com/DuVinhLoi/BrewLite/pull/10), **đã đóng, không merge** |
| Workflow / event | Cùng `.github/workflows/ci.yml`, `CI`, `pull_request` |
| Nhánh | `a2/ci-demo-fail` -> `develop-Assignment2` |
| Commit demo | `e67001dd13213b20e8a473b2855986b02162a245` |
| Thay đổi | Chỉ một dòng trong `apps/web/src/lib/format.test.ts`: kỳ vọng `formatVnd(45000)` từ `45.000đ` thành `0đ` |
| Run | [39555838160](https://github.com/DuVinhLoi/BrewLite/actions/runs/39555838160), conclusion `failure` |
| Job | [`ci`, 119075273737](https://github.com/DuVinhLoi/BrewLite/actions/runs/39555838160/job/119075273737) |
| UTC | 2026-10-21 06:30:32 - 06:31:31 (13:30:32 - 13:31:31 giờ Việt Nam) |
| Log | [Bản dễ đọc](github-red.txt), [bản gốc nén gzip](github-red-original.txt.gz) |
| Metadata | [Run](github-red-run.json), [jobs/steps](github-red-jobs.json), [PR đã đóng](github-pr-10.json) |

Workflow, mã ứng dụng và test trên `a2/Task4` không bị sửa để tạo lỗi. API so sánh commit demo với commit xanh xác nhận đúng 1 file, 1 dòng thêm/1 dòng xóa. PR demo đóng lúc `2026-10-21T06:33:51Z`; metadata xác nhận `merged: false`.

| Quality gate | Run xanh | Run đỏ |
|---|---|---|
| Install: hai `npm ci`, Prisma generate | success | success |
| Lint: API và web | success | success |
| Unit Test: API và web | success: API 5/5, web 13/13 | failure: API 5/5, web 12 pass/1 fail |
| Build: web typecheck, API build, web build | success | skipped vì Unit Test thất bại |

Trích log đỏ, chỉ bỏ mã màu terminal khi trích dẫn:

```text
2026-10-21T06:31:29.1055319Z AssertionError: expected '45.000đ' to be '0đ' // Object.is equality
2026-10-21T06:31:29.1063856Z Expected: "0đ"
2026-10-21T06:31:29.1064454Z Received: "45.000đ"
2026-10-21T06:31:29.1077277Z  Test Files  1 failed | 3 passed (4)
2026-10-21T06:31:29.1078573Z       Tests  1 failed | 12 passed (13)
2026-10-21T06:31:29.1361085Z ##[error]Process completed with exit code 1.
```

## Điều kiện bắt buộc còn thiếu: chặn merge

[Phản hồi GitHub đã lưu](github-branch-protection.txt) khi kiểm rules áp dụng cho `develop-Assignment2`:

```text
HTTP/2.0 403 Forbidden
Upgrade to GitHub Pro or make this repository public to enable this feature.
```

[Quyền đã kiểm](github-repository-access.json): repo `private: true`, `push: true`, `admin: false`, `maintain: false`. Trước khi đóng PR đỏ, GitHub trả `mergeable: true`, `mergeable_state: unstable`; trạng thái này **không phải bằng chứng merge bị chặn**. Không thử merge PR có test sai.

Chủ repo cần chọn gói/cấu hình hỗ trợ bảo vệ nhánh, bật required check `ci` cho `develop-Assignment2`, yêu cầu review theo CONTRIBUTING và kiểm bằng PR test sai rằng merge thực sự bị từ chối. Lưu ảnh cấu hình và trạng thái chặn merge sau khi thực hiện. Giữ repo private trong phiên này; không đổi visibility, mua gói hoặc sửa quyền truy cập.

## Kiểm tra local đã chạy trong phiên

Windows, Node `v24.19.0`, npm `11.17.0`. Dùng dependency đã có trong workspace; bước cài mới từ lockfile được kiểm trên hai run GitHub Ubuntu.

| Lệnh | Kết quả |
|---|---|
| `npm.cmd --prefix apps/api run lint` | Exit 0 |
| `npm.cmd --prefix apps/api test -- --runInBand` | Exit 0; 1 suite, 5 test pass |
| `npm.cmd --prefix apps/api run build` | Exit 0 |
| `npm.cmd --prefix apps/web run lint` | Exit 0 |
| `npm.cmd --prefix apps/web test` | Exit 0; 4 file, 13 test pass |
| `npm.cmd --prefix apps/web run typecheck` | Exit 0 |
| `npm.cmd --prefix apps/web run build` | Exit 0; route `/` được tạo thành công |

## Thay đổi và cách thu hồ sơ

PR #9 ban đầu bị báo `mergeable: false`, `mergeable_state: dirty`, nên chưa lên lịch CI. Đã merge các commit Task 1-2 **đã có trên base** vào `a2/Task4`; giải quyết xung đột ở `apps/api/README.md`, `apps/web/README.md`, `docs/traceability-matrix.md`. Giữ source/test Sprint 1 và cập nhật mô tả yêu cầu theo SRS đã chốt. Không sửa tạo phẩm Task 1-2; các file đó được đưa vào nguyên trạng từ base. PR sau đó hết xung đột và tự kích hoạt run xanh.

Các thao tác GitHub dùng `gh api`/`gh pr` với thông tin Git đã đăng nhập sẵn, không in hoặc lưu token vào hồ sơ. Run/job JSON tải từ API Actions; hai log tải qua `GET /repos/DuVinhLoi/BrewLite/actions/jobs/{job_id}/logs`. File `.txt` chỉ bỏ mã màu ANSI/khoảng trắng cuối dòng, giữ timestamp/nội dung. File `github-*-original.txt.gz` giữ nguyên byte log tải về; đã giải nén và đối chiếu byte trước bàn giao. Không dùng ảnh giả hoặc kết quả workflow Task 5 làm bằng chứng Task 4.

Các file mới `github-*.json` là metadata GitHub; `github-green.txt`/`github-red.txt` là log; `github-branch-protection.txt` ghi phản hồi lỗi có thật. README thư mục này, README gốc, backlog, CONTRIBUTING, ma trận và checkpoint được cập nhật để dẫn minh chứng và giữ rõ blocker. Các commit bổ sung hồ sơ sau run xanh chỉ đổi tài liệu/minh chứng, không đổi code, test hoặc workflow đã chạy.

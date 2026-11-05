# Task 5 — Kiểm chứng và bàn giao

Branch hiện tại `a2/restore-tests`, worktree `C:/BrewLite-a2-Task5`. Phần PR-2 dưới đây ghi kết quả khôi phục; các mục sau giữ hồ sơ lịch sử của `feat/assignment2-task5-delivery`. Bằng chứng Task 5 tháng 10 ở [report-task5](../planning/handoff/2026-10-21-req-sync/report-task5.md); release/tag/smoke/rollback ở [release notes](release-notes.md).
PASS chỉ dùng cho lệnh đã chạy; kết quả contributor không thay thế kiểm tích hợp hiện tại.

## Khôi phục test PR-2 — 06/11/2026

Suite khôi phục trên nhánh `a2/restore-tests`, baseline kiểm local `4e711a8a845c36c11ec09b2ca6dc928a196c495c`, đã tích hợp SRS/main `5834af4`. Đây là kết quả local được ghi nhận trong các lượt task, **không phải run CI mới**. Lệnh/cấu hình DB riêng và fake secret: [tests/README.md](../../tests/README.md).

| Tầng | Lệnh từ root | Kết quả local ghi nhận |
|---|---|---|
| Unit API | `npm.cmd --prefix apps/api test` | 219 pass, 0 fail, 0 skip |
| Unit/component web | `npm.cmd --prefix apps/web test` | 74 pass, 0 fail, 0 skip |
| HTTP integration | `node --test --test-concurrency=1 'tests/integration/*.test.mjs'` | 21 ca: 20 pass, 0 fail, 1 skip INT-T11b |
| Chromium E2E | `npm.cmd --prefix apps/web run test:e2e` | 5 pass, 0 fail |

INT-T11b giữ yêu cầu Barista hủy PENDING phải 403 nhưng baseline trả 409; skip có lý do và [PR31 sửa runtime riêng](https://github.com/DuVinhLoi/BrewLite/pull/31). INT-T11a kiểm PAID → PREPARING → READY → COMPLETED vẫn chạy. Không coi skip là pass; khi tích hợp PR31 phải bỏ skip và chạy lại. Web đã theo SRS của PR30 (hai nhãn Còn hàng/Hết hàng, capacity giới hạn input/giỏ); bốn skip giao diện trước đó không còn áp dụng. UNIT-T12 chỉ kiểm helper cũ, không chứng minh nhãn UI.

Workflow đã khai báo Install/Lint/Unit/Migrate/seed ×2/Build/Integration/E2E/Compose trên PostgreSQL 16, fake secret và loopback; giữ trace khi E2E lỗi và upload thư mục kết quả khi có. [PR32/run 42132213624](https://github.com/DuVinhLoi/BrewLite/actions/runs/42132213624) success trên đúng head `4e711a8`, cùng số pass/skip như bảng; job `2026-11-05T23:48:46Z` → `23:52:01Z`, 195 giây (3 phút 15). [PR33/run 42132338210](https://github.com/DuVinhLoi/BrewLite/actions/runs/42132338210) cố ý sai UNIT-T03 (124001 thay 124000) đã failure, API unit 218 pass/1 fail. GitHub API ghi BLOCKED/REVIEW_REQUIRED; ảnh public chưa chứng minh riêng nút merge bị chặn do test. **Còn chờ:** đủ ba run CI xanh liên tiếp, CI trên head cuối và bằng chứng required `ci` chặn merge khi các điều kiện khác đủ. Chưa đo phần thời gian tăng so với CI cũ. Theo dõi tại [hồ sơ CI](../evidence/ci/README.md); không dùng Delivery đã xanh trước khôi phục làm minh chứng suite mới.

Cutover PR29 và sandbox smoke đã thực hiện riêng: menu 8 món, demo login/`/inventory`, một đơn thanh toán thật qua VNPay sandbox được API xác nhận PAID, sau đó nhân viên chuyển PREPARING/READY/COMPLETED **qua API**. IDs và giới hạn tại [release notes](release-notes.md#cutover-và-production-đã-kiểm-chứng--tháng-112026). Không tuyên bố có màn hình nhân viên đổi trạng thái đơn.

## Hồ sơ lịch sử tháng 10

## Bằng chứng đã thực hiện

| Mốc | Kiểm tra | Kết quả đã ghi nhận |
|---|---|---|
| 21/10/2026, baseline Sprint 2 | API lint/unit/build; web lint/unit/typecheck/build | PASS: 20 API tests, 17 web tests trên baseline lịch sử |
| 21/10/2026 | PostgreSQL integration DB riêng, Chromium E2E | PASS: 7 integration, 6 E2E; không phải kết quả trên source sau CR |
| 21/10/2026 | Compose build/up/migrate/seed/health và persistence down/up | PASS: health DB up, 8 món, web 200, đơn PAID còn sau restart; không xóa volume |
| 23/10/2026, Pha A | GHCR publish; deploy tay Render/Vercel; HTTPS anonymous và Chromium | PASS: web https://brewlite-a2-web.vercel.app; API https://brewlite-a2-api.onrender.com/health 200 database up; products/menu 8 món; CORS đúng origin |
| PR #21, #22, #23, #24 | Sync lần 2 và tích hợp Người 1–3 | Đã merge trên delivery; test IDs bên dưới, bằng chứng kiểm lại ở report hiện tại |

Pha A: API `srv-dbdms83ncjis73aodm1g`, Vercel project `prj_6BUoPh0TSriVnqrpLjZ1g0vijK3O`; cả hai tắt Git auto-deploy. Render DB Free tạo 23/10, hết hạn 22/11/2026. Không ghi DATABASE_URL/JWT/token/hook secret vào tài liệu.

## Truy vết test của Người 1–3

- PR #23: `ProductDetail.test.tsx` có `P1-UI-01`–`P1-UI-16`, kiểm số lượng, cap tồn mọi variant, cap mỗi dòng, giỏ 20 món, persistence/reset. `shop.test.ts`: `P1-CART-01`–`P1-CART-03`. CI workflow_dispatch [40170251749](https://github.com/DuVinhLoi/BrewLite/actions/runs/40170251749) success trên head `797c8de` trước merge.
- PR #22: `CartScreen.test.tsx` có `UNIT-P2-01`–`UNIT-P2-05`: hủy/đồng ý giảm về 0, giảm 2 xuống 1 không hỏi, đơn giá/thành tiền/tổng giỏ, Xóa trực tiếp. Mô tả PR ghi local manifest HTTP 200 và PNG 192/512 đúng kích thước; đây là bằng chứng contributor, cần kiểm lại production release.
- PR #24: `CheckoutScreen.test.tsx` có `UNIT-P3-01`–`UNIT-P3-05`: lỗi tại ô thẻ/ngăn API, xóa lỗi, tóm tắt giỏ, tóm tắt đơn trả lại, một alert decline và giữ giỏ. Mã lấy từ source đã merge vì mô tả PR không liệt kê IDs.

API CR-5.1 cần `INT-S2-03` (replay/new key/key trên đơn khác), `INT-S2-08` (đổi số thẻ vẫn replay), `INT-S2-09` (đổi phương thức sau PAID trả 409); `INT-S2-04/07` kiểm thất bại retry được. Migration mới chỉ bỏ index key xuyên đơn; index mỗi đơn một SUCCESS giữ nguyên.

## Kiểm lại sau CR-5.1 đến CR-5.5

Chạy các lệnh trong CR-5.6 sau commit: API lint/unit/build/integration; web lint/typecheck/unit/build; validator Task 2; diff whitespace và dò hợp đồng cũ. PostgreSQL integration/E2E chỉ dùng DB riêng có tên `brewlite_test` hoặc `brewlite_test_<suffix>`, không dùng DB production hoặc cổng người khác. Ghi output và exit code tại report, không lấy bảng lịch sử ở trên làm PASS hiện tại.

Browser E2E thật giữ sáu luồng: checkout thành công; decline rồi Ví; mất response tạo đơn chặn tạo lại; mất response thanh toán phục hồi PAID; lỗi tải đơn cũ chặn đơn mới; 401 đăng nhập lại tiếp tục cùng order/key. Không xóa giỏ trước xác nhận backend.
CD mới publish API image full SHA; Render migrate trước server; Vercel build từ env Production; smoke retry HTTPS sau cả hai deploy. Bằng chứng phải có run URL và image/deployment IDs. Diễn tập rollback cần thực sự đưa API và web về phiên bản trước, smoke lại, rồi ghi trạng thái production cuối cùng; hướng dẫn [deployment](../deployment.md) không thay thế kết quả.

## Giới hạn và phần nhóm hoàn thiện

- Snapshot 21/10 chưa đo p95/Lighthouse toàn bộ SRS; Postman GUI, mọi nhánh responsive/accessibility và buổi review/retro/video demo không tự được coi PASS.
- JWT sessionStorage không có refresh token, giỏ localStorage không đồng bộ nhiều tab. Stock trên trang chi tiết là snapshot; backend vẫn kiểm tồn trong transaction khi checkout.
- Branch/environment protection phụ thuộc quyền và gói GitHub; CI xanh không chứng minh việc chặn merge đã bật.
- Không tự nâng dependency hoặc audit fix hàng loạt. Giữ report audit lịch sử và để nhóm đánh giá riêng.
- Source không chứa secret thật; env Production dùng Render internal DB, JWT đủ mạnh và CORS đúng Vercel origin. Seed demo chỉ theo quyết định môi trường demo của nhóm.

## Tích hợp/release27/10/2026

API19unit, web50unit, integration10, Chromium6E2E, lint/typecheck/build và Compose/validator đều PASS. INT-S2-10 kiểm replay fingerprint lịch sử. CI40474909189success trên source d8dcb87. Manual release/rollback/khôi phục và ba lượt smoke production PASS; chi tiết [metadata](release-evidence.json). CD tự động còn thiếu credential, không coi run tag là PASS trước khi xác nhận đủ job.

## Tự động deploy khi push — 28/10/2026

Delivery nhận push đúng nhánh delivery và tag release, gọi CI reusable trên cùng commit. Preflight kiểm tên cấu hình trước publish/deploy. Render phải live đúng image mới trước smoke; CI-only không nhận cùng sự kiện push delivery/tag.

`python -B -m unittest discover -s tests/deployment -v`: 12/12 PASS, kiểm inline workflow thật với HTTP/clock fixture, gồm image cũ, deploy lỗi, timeout, queued/ambiguous và retry không POST trùng. Actionlint 1.7.7 PASS cho hai workflow, ShellCheck tắt; `git diff --check` PASS. Review riêng không có finding chặn triển khai. Các kiểm tra này không chứng minh credential hoặc production deployment; xem trạng thái thực thi mới trong báo cáo Task 5.

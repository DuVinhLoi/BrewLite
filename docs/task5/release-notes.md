# BrewLite Assignment 2 — a2-v0.2.0-rc.1

## Cutover và production đã kiểm chứng — tháng 11/2026

- PR [#29](https://github.com/DuVinhLoi/BrewLite/pull/29) đã merge, SHA `5f092643301e816bd708ef5ee735dc57ec206c29`; [Delivery 41829844261](https://github.com/DuVinhLoi/BrewLite/actions/runs/41829844261) success. API Render `dep-dblickt9el5s73d4m2vg` live với image `5f09264`; web `dpl_9oLQoX8vHGDU8168xeKd7MJEWtPt` Ready/production, deploy qua CLI. Health ok/database up, products 8 món, smoke HTTPS đạt.
- Ngày 04/11 đã hoàn tất một giao dịch **VNPay sandbox thật**, đơn demo `cmw240om40001fy21c1wuib91`, tổng 50.000 VND: menu → chi tiết L → giỏ → login → checkout CARD → sandbox → return → API xác nhận PAID; màn xác nhận khách hiển thị đã thanh toán. Sau demo login/kiểm màn `/inventory`, Barista gọi PATCH API lần lượt PREPARING → READY → COMPLETED trên đúng đơn đó. Không kiểm bằng màn hình đổi trạng thái nhân viên; không có top-up hay sửa công thức/DB, kho tiêu thụ một đồ uống demo. Lỗi listener trình duyệt ban đầu được phục hồi trên cùng đơn, không tạo đơn trùng; không lưu token, URL ký hoặc ảnh thẻ/OTP.
- Production main gần nhất được xác minh: `5834af47a60a072694d42247279d342add8603c7` sau PR30; [Delivery 41984655740](https://github.com/DuVinhLoi/BrewLite/actions/runs/41984655740) success; Render `dep-dbm2mmjm8hqs73ei6odg` live, image `ghcr.io/duvinhloi/brewlite-api:5834af47a60a072694d42247279d342add8603c7`, digest `sha256:350a04260f508f0b29455c86fdbc7f97fc7dcca2e3150943f5a4e30f60428723`. Deployment ID web của lượt này chưa đối chiếu, không dùng ID PR29 làm ID mới.
- PR30 giữ UI hai nhãn Còn hàng/Hết hàng; không có số ly/nguyên liệu giới hạn trên menu/chi tiết. PR-2 khôi phục test theo hợp đồng đó; [verification](verification.md#khôi-phục-test-pr-2--06112026) ghi local 219 API unit, 74 web, integration 20 pass/1 skip PR31, 5 E2E. [PR32/run 42132213624](https://github.com/DuVinhLoi/BrewLite/actions/runs/42132213624) đã success với số pass/skip đó tại head `4e711a8`, 195 giây; PR33 cố ý sai UNIT-T03 đã đỏ. Chuỗi ba run xanh, CI head cuối và bằng chứng riêng required ci chặn merge còn chờ; [hồ sơ CI](../evidence/ci/README.md). Delivery phía trên chạy trước bộ test khôi phục.
- DB Free vẫn hết hạn `2026-11-22T13:14:08.263534Z`. Hướng chuẩn bị dump/restore sang Free mới dự kiến 17/11; chưa thay DB, xóa dữ liệu hoặc phát sinh phí được phép. Cần chốt trước 15/11 và hoàn tất trước 18/11 theo kế hoạch; thao tác xóa hoặc tốn phí cần được chủ repo cho phép riêng.

Các mục dưới đây là **hồ sơ lịch sử chuẩn bị cutover/tháng 10**; trạng thái “chưa merge”, “chưa có secret” hay “suite bị gỡ” chỉ áp dụng thời điểm ghi.

## Cutover sang main — chuẩn bị ngày 04/11/2026

PR [#29](https://github.com/DuVinhLoi/BrewLite/pull/29) chuyển nguồn production sang `main`: Delivery chỉ nhận push `main`, tag `a2-v*` và chạy tay; PR vào `main` chỉ chạy CI. Đây là trạng thái chuẩn bị, chưa phải bằng chứng merge/deploy thành công. Các phần bên dưới giữ nguyên hồ sơ release tháng 10.

- Điểm rollback Render đã đọc từ deploy metadata: `dep-dbib4c61egvs73e43se0`, trạng thái `live`, image `ghcr.io/duvinhloi/brewlite-api:adf26bb86b9e983dfd2d26edb9a35aaade1ffd7f`, digest `sha256:84f94b804ab946091475bd88ad2c1d6d8760478568d55cb3db6b5b8876bc489e`. Không lấy `imagePath` cũ của service làm image live.
- Điểm rollback Vercel: `dpl_GeVr9mr2SibM6MA4og7qCVsq3ZKw`, target `production`, trạng thái `Ready`, URL `https://brewlite-a2-oxiqtynk3-du-vinh-loi.vercel.app`; alias production `https://brewlite-a2-web.vercel.app`.
- GitHub ngày 04/11/2026: đủ tên 5 secret/3 variable production; đã cấu hình và đọc lại `production`, `release` chỉ cho nhánh `main`/tag `a2-v*`. Bảo vệ `main` yêu cầu PR, một approval, check `ci` strict, dismiss stale review, áp dụng cả admin, chặn force push/xóa.
- Vercel API project ban đầu báo `createDeployments=disabled` và `disableRepositoryDispatchEvents=true`, nhưng push `19e04f2` vẫn tạo preview `dpl_AaP95gyJH9m4jekUrQz8KnAJybea` (target preview, không thay production). Đã ngắt liên kết Git bằng `vercel git disconnect` cho đúng project `prj_6BUoPh0TSriVnqrpLjZ1g0vijK3O`/scope `du-vinh-loi`; đọc lại API xác nhận `link=null`. Render `autoDeploy=no`. Không thay deployment production đang live.
- Render DB `dpg-dbdlr82vcj2c7387fol0-a` còn `available`, PostgreSQL 16/Singapore, Free, allowlist `127.0.0.1/32`, hết hạn `2026-11-22T13:14:08.263534Z`. Chưa gia hạn/chuyển DB; chưa có tài khoản giảng viên để xác nhận quyền truy cập. Cổng P1 chưa hoàn tất, chưa lập báo cáo "ĐÃ XONG CỔNG P1" và chưa bắt đầu PR-2 phụ thuộc cổng này.
- Kiểm trước push: `actionlint .github/workflows/ci.yml .github/workflows/cd.yml` và `git diff --check` đạt. Smoke hiện trạng đạt: health `{"status":"ok","database":"up"}`, products 8 món, web HTTP 200. Lần gọi PowerShell đầu timeout do chưa có phản hồi trong 45 giây; gọi lại bằng curl và PowerShell đều đạt, không deploy/restart để xử lý timeout.
- Run URL/SHA cutover, deploy ID mới, smoke và kiểm VNPay/Barista sau deploy: chưa thực hiện. Không có migration hoặc thay đổi code app trong phần cutover này.

### Cập nhật theo kế hoạch v1.2 — 04/11/2026

[Báo cáo P1](../planning/handoff/2026-11-owner-p1-report.md) xác nhận **ĐÃ XONG CỔNG P1** (việc 1–7). Kết luận thiếu tài khoản giảng viên/DB chặn cổng ở bản ghi phía trên không còn áp dụng: repo public, DB có hạn riêng. Đã chọn khôi phục đủ bốn tầng test với phiên bản khóa tại `73a6ccb`; chưa triển khai test trong PR-1. Hướng DB hiện tại là chuẩn bị Free mới kèm dump/restore để giữ dữ liệu, dự kiến 17/11, cần duyệt thao tác xóa trước khi thực hiện; chưa phát sinh phí hoặc thay DB.

CI tại `5ba2d55` đạt trong [run 41812742645](https://github.com/DuVinhLoi/BrewLite/actions/runs/41812742645). Commit thêm báo cáo cần CI mới; không dùng run cũ làm bằng chứng cho head mới. PR #29 vẫn chờ approval, chưa merge/deploy cutover. `GET /payments/vnpay/ipn` không có chữ ký trả `97`; không coi đó là bằng chứng giao dịch thành công.

Ngày chuẩn bị: 27/10/2026, branch feat/assignment2-task5-delivery. Release candidate; không tự nhận CD thành công trước khi có run/deployment thật.

## Thay đổi

- Tích hợp PR #22 (xác nhận xóa, thành tiền, manifest/icons), #23 (số lượng/tồn kho), #24 (tóm tắt checkout, lỗi ô thẻ). Các PR đã merge trước lượt này; review lại không thấy blocker và sáu E2E đạt.
- Replay theo chủ đơn/orderId/key/phương thức, bỏ số thẻ khỏi identity; key dùng được ở đơn khác; đổi phương thức sau trả thành công bị từ chối 409. Giữ replay cho bản ghi fingerprint cũ (INT-S2-10).
- Migration cộng thêm chỉ bỏ index key xuyên đơn; giữ một thanh toán thành công mỗi đơn. Payment simulator còn thành công/từ chối, không thu tiền thật.
- CD publish API SHA lên GHCR, Render hook, Vercel CLI 65.2.0 prebuilt, HTTPS smoke/retry và hướng dẫn rollback. Docker startup migrate trước server.

## Kiểm chứng local 27/10/2026

API lint/build PASS, unit 19/19; web lint/typecheck/build PASS, unit50/50 (8 files); PostgreSQL integration10/10; Chromium E2E6/6; validator Task2 và Compose config PASS. DB riêng brewlite_test_cr56 trên cổng55437, không dùng DB production cho test.

## Release thực tế

- Tag **a2-v0.2.0-rc.1**, source d8dcb870142cfba5fbe75038d33d2f438e77d391; [PR25](https://github.com/DuVinhLoi/BrewLite/pull/25) vào develop-Assignment2, chưa merge PR tổng hợp.
- [CI40474909189](https://github.com/DuVinhLoi/BrewLite/actions/runs/40474909189) **success** trên đúng source commit sau commit/push.
- Image public ghcr.io/duvinhloi/brewlite-api:d8dcb870142cfba5fbe75038d33d2f438e77d391; index digest sha256:91ba4c8f21e9451c6268572000202371472ecc1e103e9875e0e8b3dcc34b4acf.
- Deploy manual bằng CLI/Render REST: API dep-dbg66gd9el5s73c1a1f0 live08:40:13Z, web dpl_4s3z2Diu5TYtzUd4pghwmXnqFShc READY. Render Docker Command override đã bỏ; migration mới chạy từ Docker CMD.
- Smoke anonymous **PASS**: health200 với database up, products200/mảng8; Chromium menu8cards, manifest200, quantity picker hiển thị.

## Diễn tập rollback — PASS thủ công

Ngày27/10/2026, không rollback/reset DB hoặc sửa migration:

1. Render REST imageUrl về source6041b5f8fa7bba9211d78554f80bb2b2e3a46175, deployment dep-dbg67dt9el5s73c1ccbg live08:42:02Z. Vercel rollback về dpl_4P8q8ZvE4TSw12J3637oeEQ2iapW, giữ nguyên deployment cũ, không rebuild.
2. Smoke rollback: health/products HTTP200, database up,8products, Chromium8menu cards.
3. Khôi phục release image d8dcb87: dep-dbg682qfngtc738qn3fg live08:43:35Z. Promote lại web dpl_4s3z2Diu5TYtzUd4pghwmXnqFShc. Smoke sau khôi phục **PASS**, menu8, manifest200. Production kết thúc ở release mới.

Các giờ trên là UTC; lần lượt15:40,15:42,15:43 giờ Việt Nam. Metadata và kết quả từng chặng ở [release-evidence.json](release-evidence.json).

## Giới hạn CD chưa chốt

[Run CD của tag](https://github.com/DuVinhLoi/BrewLite/actions/runs/40475323601) **FAIL**: quality/ci success, publish build thành công nhưng push bị `permission_denied: write_package`; deploy-api/deploy-web/smoke skipped. Package public nhưng repository=null và chưa được cấp Manage Actions access cho DuVinhLoi/BrewLite (Write). Workflow đã khai báo packages:write; không thay bằng PAT quyền rộng. Sau khi cấp quyền package, vẫn cần RENDER_DEPLOY_HOOK_URL và token CI VERCEL_TOKEN ở environment production. Đã cấu hình project/org IDs và URL. Vercel CLI trả Cannot create tokens for this app; Render public API không cung cấp hook trong service object, cần lấy từ dashboard. Không đưa session token CLI vào GitHub thay token CI.
Rollback trên dùng Render REST đã xác thực và Vercel CLI; đường deploy hook trong CI chưa được thực thi. Vì vậy đây là release candidate với **manual deploy/smoke/rollback PASS**, chưa phải nghiệm thu CD tự động. Không claim branch protection hoặc người ngoài nhóm đã chạy demo.

Web https://brewlite-a2-web.vercel.app; API https://brewlite-a2-api.onrender.com. Postgres Free hết hạn22/11/2026. Xem [deploy/rollback](../deployment.md) và [báo cáo Task5](../planning/handoff/2026-10-21-req-sync/report-task5.md).

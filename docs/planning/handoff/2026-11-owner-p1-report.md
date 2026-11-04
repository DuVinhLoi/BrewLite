# Báo cáo P1 — 04/11/2026

Trạng thái: **ĐÃ XONG CỔNG P1 (việc 1–7 theo kế hoạch v1.2)**.

Chủ repo giao agent chọn phương án tối ưu trong cuộc trao đổi ngày 04/11/2026. Báo cáo áp dụng Q1/Q2 theo phương án khôi phục đầy đủ test; không xác nhận merge, deploy hoặc thay DB đã diễn ra. Nhánh thực hiện: `merge/a2-into-main`; worktree: `C:\BrewLite-a2-Task5`. Task: cutover/P1, tiếp nối A1–A2/D4.

## Kết quả

| # | Việc | Kết quả | Bằng chứng kiểm lại ngày 04/11/2026 |
|---|---|---|---|
| 1 | Q1 — khôi phục test | Chọn đầy đủ unit API, unit/component web, API/integration HTTP và E2E; đây là quyết định triển khai, chưa phải test đã khôi phục | Chủ repo giao chọn phương án tối ưu; đề A2 §6.4, §7.2, §7.3, §9.1 |
| 2 | Q2 — dependency web | Dùng các bản đã khóa tại `73a6ccb`: `vitest 5.0.5`, `@testing-library/react 16.3.3`, `@testing-library/jest-dom 7.0.1`, `jsdom 30.1.3`, `@playwright/test 1.64.1`; không thêm dependency API | Đọc `apps/web/package.json` và các entry `node_modules/…` trong lockfile của commit đó; chưa đổi dependency trong PR-1 |
| 3 | Điểm rollback | Render `dep-dbib4c61egvs73e43se0`, image `ghcr.io/duvinhloi/brewlite-api:adf26bb86b9e983dfd2d26edb9a35aaade1ffd7f`; Vercel `dpl_GeVr9mr2SibM6MA4og7qCVsq3ZKw` | Render deploy metadata `live`; Vercel alias production; [release notes](../../task5/release-notes.md) |
| 4 | Vercel Git | Đã ngắt repository khỏi đúng project `prj_6BUoPh0TSriVnqrpLjZ1g0vijK3O`; CLI vẫn dùng project/org ID | Đọc lại project API: `link=null`; push `5ba2d55` không tạo thêm deployment Git |
| 5 | Environment | `production` và `release`: Selected, nhánh `main`, tag `a2-v*` | Đọc lại API deployment-branch-policies; mỗi environment có đúng hai policy |
| 6 | Cấu hình production | Đủ 5 tên secret và 3 tên variable, không đọc giá trị | Secret: `RENDER_DEPLOY_HOOK_URL`, `RENDER_API_KEY`, `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`; variable: `RENDER_SERVICE_ID`, `PRODUCTION_API_URL`, `PRODUCTION_WEB_URL` |
| 7 | Bảo vệ main | PR, một approval, required check `ci` strict, dismiss stale review, áp dụng cả admin, chặn force push/xóa | Đọc lại branch protection; `require_last_push_approval=false` |
| 13 | Truy cập giảng viên | Repo public, không cần mời tài khoản riêng | API repo: `private=false`; [repository](https://github.com/DuVinhLoi/BrewLite) |

DB có hạn riêng và không chặn cổng P1 theo v1.2. Vì vậy kết luận chưa đạt cổng do thiếu tài khoản giảng viên/DB ở bản ghi trước đã được thay thế bởi báo cáo này.

## Cách kiểm tra

- [CI của head trước báo cáo](https://github.com/DuVinhLoi/BrewLite/actions/runs/41812742645): đạt, commit `5ba2d55`, job `ci` 1 phút 8 giây; gồm install, lint, migration/seed, build và Compose validation. Chưa có các tầng test khôi phục. Commit chứa báo cáo này cần CI riêng trước khi merge.
- `gh pr view 29 --json state,reviewDecision,mergeStateStatus`: PR đang mở, `REVIEW_REQUIRED`/`BLOCKED`, chưa có review; trạng thái này phản ánh thiếu approval, không phải cổng P1 chưa đạt.
- `gh api repos/DuVinhLoi/BrewLite/branches/main/protection`: check `ci`, một approval, không bắt approval của push cuối. Chỉ tác giả PR bị cấm tự approve; chọn một reviewer độc lập có quyền write để giữ giá trị review.
- `gh api repos/DuVinhLoi/BrewLite/environments/{production,release}/deployment-branch-policies`: kiểm tên và loại của hai policy, không đọc secret.
- Render MCP: DB `dpg-dbdlr82vcj2c7387fol0-a` đang `available`, allowlist `127.0.0.1/32`, hết hạn `2026-11-22T13:14:08.263534Z` (20:14 ngày 22/11 giờ Việt Nam).
- `GET /payments/vnpay/ipn` không có chữ ký trả `97 / Invalid signature`. Đây chỉ là kiểm tra đường xử lý từ chối chữ ký, không chứng minh giao dịch thanh toán thành công. Lần gọi `/health` đầu trong lượt kiểm lại timeout sau 45 giây; kiểm lại sau đó đạt `{"status":"ok","database":"up"}` và products 8 món. Vẫn phải kiểm readiness trước cutover, không lấy IPN thay cho health.
- Harness không cung cấp thao tác đọc/đổi effort của chính phiên đang chạy; không ghi nhãn `high`/`xhigh` như một giá trị đã xác minh.

## Còn lại

### PR #29 và phần test

Khuyến nghị: chốt báo cáo này, chờ CI của head cuối xanh và review thực chất, rồi chủ repo merge bằng Create a merge commit qua cổng A4. Không bỏ protection để vượt approval. Quy tắc `AGENTS.md` hiện cấm agent merge PR; chưa có ngoại lệ trực tiếp từ chủ repo. Agent không approve thay người dùng để tạo một review hình thức cho chính thay đổi mình vừa push.

Sau merge và kiểm Delivery/smoke, mới tạo `a2/restore-tests` từ `main` theo dependency của PR-2. Nhóm thực hiện D1–D3 trước, rồi B2–B7/D5–D6; ghi bằng chứng thay vì nhận các test dự kiến là đã pass. Trước merge phải xác nhận không có demo trong 30 phút tới và không có người khác chuẩn bị push `main`.

### DB: chọn phương án theo chi phí và dữ liệu

Ước lượng thời gian dưới đây dành cho người vận hành chuẩn bị và kiểm chứng, không phải cam kết downtime.

| Phương án | Ai làm, thời gian/chi phí | Rủi ro và khả năng đảo ngược | Mở khóa |
|---|---|---|---|
| Nâng DB trả phí | Chủ repo duyệt chi phí theo dashboard; người có tài khoản Render thực hiện, dự kiến 15–30 phút | Giữ dữ liệu, không có hạn Free 30 ngày; có phí định kỳ, cần duyệt trước | Phù hợp khi ngày chấm muộn hoặc cần vận hành lâu dài |
| **Khuyến nghị hiện tại: Free mới, dump/restore dữ liệu** | Người vận hành cùng workspace; dự kiến 30–90 phút; không chủ động mua compute trả phí | Có downtime; workspace chỉ có một DB Free nên phải xóa cũ trước. Không thể quay lại DB cũ sau xóa; chỉ tiến hành sau khi kiểm được dump/restore, không có payment pending và chủ repo duyệt thao tác xóa | Giữ lịch sử đơn và có thêm 30 ngày kể từ tạo DB mới |
| Free mới, seed lại | Người vận hành; dự kiến 30–60 phút; không chủ động mua compute trả phí | Mất lịch sử đơn/tồn kho cũ nếu không phục hồi; chỉ chọn khi chủ repo xác nhận dữ liệu có thể bỏ | Demo lại bằng dữ liệu mới |

Chọn hướng chuẩn bị Free mới kèm dump/restore để giữ dữ liệu và tránh phát sinh phí chưa được duyệt. Mốc dự kiến là **17/11/2026**, xác nhận lịch trước **15/11**, hoàn tất trước **18/11**. Đây là kế hoạch, chưa phải tác vụ đã được lên lịch tự động hay đã thực hiện. Nếu ngày chấm vượt khoảng 17/12 hoặc không kiểm chứng được khôi phục, xem lại phương án trả phí trước khi xóa bất cứ DB nào.

Đã kiểm [quy định Render Free](https://render.com/docs/free) ngày 04/11/2026: mỗi workspace chỉ có một DB Free hoạt động, hết hạn sau 30 ngày; DB hết hạn không truy cập được, có 14 ngày để nâng gói trước khi bị xóa. [Trang giá](https://render.com/pricing) không trả bảng giá compute qua nội dung đã đọc nên không đưa con số phí chưa xác minh. Chưa xóa DB, chưa đổi `DATABASE_URL`, chưa redeploy, chưa tạo backup dữ liệu thật trong lượt này.

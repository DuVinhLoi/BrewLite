# Task 5 — Kiểm chứng và bàn giao

Branch `feat/assignment2-task5-delivery`, worktree `C:/BrewLite-a2-Task5`. Bằng chứng run/commit hiện tại được ghi ở [report-task5](../planning/handoff/2026-10-21-req-sync/report-task5.md); release/tag/smoke/rollback ở [release notes](release-notes.md).
PASS chỉ dùng cho lệnh đã chạy; kết quả contributor không thay thế kiểm tích hợp hiện tại.

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

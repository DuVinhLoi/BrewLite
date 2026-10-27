# BrewLite Assignment 2 — a2-v0.2.0-rc.1

Ngày chuẩn bị: 27/10/2026, branch feat/assignment2-task5-delivery. Release candidate; không tự nhận CD thành công trước khi có run/deployment thật.

## Thay đổi

- Tích hợp PR #22 (xác nhận xóa, thành tiền, manifest/icons), #23 (số lượng/tồn kho), #24 (tóm tắt checkout, lỗi ô thẻ). Các PR đã merge trước lượt này; review lại không thấy blocker và sáu E2E đạt.
- Replay theo chủ đơn/orderId/key/phương thức, bỏ số thẻ khỏi identity; key dùng được ở đơn khác; đổi phương thức sau trả thành công bị từ chối 409. Giữ replay cho bản ghi fingerprint cũ (INT-S2-10).
- Migration cộng thêm chỉ bỏ index key xuyên đơn; giữ một thanh toán thành công mỗi đơn. Payment simulator còn thành công/từ chối, không thu tiền thật.
- CD publish API SHA lên GHCR, Render hook, Vercel CLI 65.2.0 prebuilt, HTTPS smoke/retry và hướng dẫn rollback. Docker startup migrate trước server.

## Kiểm chứng local 27/10/2026

API lint/build PASS, unit 19/19; web lint/typecheck/build PASS, unit50/50 (8 files); PostgreSQL integration10/10; Chromium E2E6/6; validator Task2 và Compose config PASS. DB riêng brewlite_test_cr56 trên cổng55437, không dùng DB production cho test.

## Trạng thái phát hành

Đang chuẩn bị tag/image/deployment và diễn tập rollback; IDs, URL và kết quả thật sẽ bổ sung sau. CD cần RENDER_DEPLOY_HOOK_URL và VERCEL_TOKEN ở environment production. CLI Vercel trả Cannot create tokens for this app; chưa có token dùng riêng cho CI. Đã đặt project/org IDs và URL production. Không đưa token đăng nhập cá nhân vào GitHub để thay thế token CI.

Web https://brewlite-a2-web.vercel.app; API https://brewlite-a2-api.onrender.com. Postgres Free hết hạn22/11/2026. Hướng dẫn [deploy/rollback](../deployment.md), bằng chứng chi tiết [báo cáo Task5](../planning/handoff/2026-10-21-req-sync/report-task5.md).

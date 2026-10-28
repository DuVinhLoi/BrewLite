# BrewLite Assignment 2 — a2-v0.2.0-rc.1

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

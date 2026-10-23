# Report Task 5 — Pha A, CR-5.0 lần 1

Ngày thực hiện: 23/10/2026. Chủ Task 5, branch feat/assignment2-task5-delivery.
Worktree: C:/BrewLite-a2-Task5. Trạng thái toàn Pha A: BLOCKED ở kết nối hosting; CR-5.0 lần 1 đã hoàn tất.

## Nguồn và phạm vi

Branch a2/req-sync-change-requests đã được merge qua PR #13, không còn ref remote.
Đọc nguồn duy nhất từ origin/develop-Assignment2 tại 30a7a9d2554b198a0f5592c0eef1c73698ab684c (gồm cập nhật phân công PR #18).
Đã đọc README handoff, CR-task5, card Người 1–3 và hai rule doc-code-sync/multi-agent-workflow.
Không chờ hoặc merge PR #9. Không sửa code/UI của Người 1–3, không thực hiện CR-5.1/5.2 hoặc CD thuộc Pha B.

## CR-5.0 lần 1 — PASS

Trước sync: HEAD f6490d35397f51ebb23def9b1f787a8e514a1ecf.
Commit merge: 45ae0016a61467c8925cf1b4873ac7ebd1b10619.
Lấy develop-Assignment2 bằng fetch rồi merge --no-ff, không pull/rebase mơ hồ.

Xung đột đã giải:
- apps/api/README.md: mô tả source Sprint 2 hiện có; ghi rõ API thanh toán còn cần CR-5.1/5.2, production đã chốt Render.
- apps/web/README.md: mô tả source hiện có, Vercel và phân công ba contributor, không sửa UI.
- docs/traceability-matrix.md: 52 dòng dùng cột requirement/use-case/design từ baseline mới; cột Code/API, Test giữ từ branch Task 5. CR-5.5 sẽ cập nhật sau khi tích hợp Pha B.

Các đường dẫn tài liệu/SRS/sơ đồ/handoff khác được kế thừa nguyên commit upstream, không biên soạn lại hoặc chép thủ công.
.gitattributes trùng hash HEAD trước sync; refresh staging cùng blob không tạo thay đổi nội dung.

## Kiểm chứng trên nội dung đã stage trước commit

| Lệnh | Output/kết quả |
|---|---|
| python docs/validate_task2.py (Python C:/msys64/mingw64/bin/python.exe) | PASS: All static checks PASSED. Run PlantUML -checkonly before PR merge. |
| npm.cmd --prefix apps/api test -- --runInBand | PASS: Test Suites 4 passed, Tests 20 passed. |
| npm.cmd --prefix apps/web test | PASS: Test Files 5 passed, Tests 17 passed. |
| git diff --cached --check | PASS, không output lỗi |
| git diff --name-only --diff-filter=U | PASS, không còn file unmerged |

Đây là kiểm sync baseline, không phải nghiệm thu code theo D2/D3/C3. Test hiện tại còn kiểm hợp đồng cũ; việc đổi test/code thuộc Pha B.
PlantUML -checkonly, integration/E2E/build toàn bộ, smoke và rollback production NOT RUN ở lượt Pha A này.
Không khởi động dev server/Compose hoặc dùng cổng 3000/5432 của người khác.

## CR-5.3 — cấu hình nền tảng Pha A

Người dùng chọn kết nối Render và Vercel trong chat. Hiện chưa có kết nối được xác nhận, nên chưa tạo database/service/project hoặc publish image.
Không có URL production, ngày tạo/hết hạn Postgres hay deploy hook để ghi nhận. Không ghi giá trị secret vào báo cáo.

Cấu hình đã đối chiếu tài liệu chính thức, sẽ áp dụng khi kết nối:
- Render Postgres: plan Free nếu khả dụng, cùng region API; API chỉ dùng Internal Database URL; ghi ngày tạo/hết hạn thực tế sau khi tạo. Theo tài liệu Free, database hết hạn sau 30 ngày; không tự bịa ngày khi chưa tạo.
- Render Web Service Existing Image: ghcr.io/duvinhloi/brewlite-api:<full SHA>; health /health; DATABASE_URL internal, JWT_SECRET >=32 ký tự, CORS_ORIGINS là URL Vercel production; image-backed service không tự deploy khi registry đổi tag.
- Image hiện tại chưa migrate khi boot (Dockerfile sẽ sửa ở Pha B). Lần tạo đầu có thể dùng Docker Command override được Render hỗ trợ để migrate/seed database sạch rồi chạy API; không sửa migration cũ hoặc reset DB.
- Vercel: Next.js, Root Directory apps/web, NEXT_PUBLIC_API_URL là HTTPS API Render; tắt Git auto-deploy bằng cấu hình nền tảng, không sửa file UI thuộc contributor.
- GitHub production: chuẩn bị RENDER_DEPLOY_HOOK_URL, VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID; vars PRODUCTION_API_URL/PRODUCTION_WEB_URL. Không xóa cấu hình SSH đang được dùng trước khi CD Pha B chuyển xong.
- Smoke thật sau deploy: HTTPS /health, /products và trang web; không coi URL local hoặc deploy hook accepted là deploy thành công.

Nguồn:
- https://render.com/docs/deploying-an-image
- https://render.com/docs/deploy-hooks
- https://render.com/docs/postgresql-creating-connecting
- https://render.com/docs/free
- https://vercel.com/docs/monorepos
- https://vercel.com/docs/project-configuration/git-settings

## Thông báo Người 1–3

Chưa gửi thông báo Pha A hoàn tất vì chưa có deploy/URL thật. Chưa có định danh/kênh liên hệ ba người trong phiên.
Nội dung sẽ gửi sau khi hosting PASS: tách branch từ origin/feat/assignment2-task5-delivery tại SHA được ghi lúc bàn giao; mỗi người chỉ sửa allowed paths trong card của mình, PR về branch delivery.
Nếu cần khởi động Pha B trước URL, trưởng nhóm phải xác nhận thay đổi điều kiện bắt đầu; agent không tự bỏ gate Pha A.
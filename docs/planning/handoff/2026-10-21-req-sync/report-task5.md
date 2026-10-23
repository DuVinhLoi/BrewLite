# Report Task 5 — Pha A, CR-5.0 lần 1

Ngày thực hiện: 23/10/2026. Chủ Task 5, branch feat/assignment2-task5-delivery.
Worktree: C:/BrewLite-a2-Task5. Trạng thái toàn Pha A: BLOCKED ở credential GHCR chỉ đọc và deploy lần đầu; CR-5.0 lần 1 đã hoàn tất.

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

## CR-5.3 — cấu hình nền tảng Pha A (cập nhật 23/10/2026)

Đã xác thực GitHub, Render CLI 2.31.0 và Vercel CLI 65.2.0. Không còn blocker đăng nhập nền tảng.
Đây là báo cáo bàn giao code/hạ tầng, không phải báo cáo đồ án LaTeX.

| Hạng mục | Trạng thái đã kiểm chứng | Bằng chứng |
|---|---|---|
| Build API image | PASS | Docker build thành công với source commit 6041b5f8fa7bba9211d78554f80bb2b2e3a46175 |
| Publish GHCR | PASS | ghcr.io/duvinhloi/brewlite-api:6041b5f8fa7bba9211d78554f80bb2b2e3a46175; private package; version ID 1434898354 |
| Image digest | PASS | sha256:f8bfa6b18d74f9cf41ed380f6f3cb0c591945a83333d3ed3807dfe55c633afa8 |
| Render PostgreSQL | PASS | brewlite-a2-db; ID dpg-dbdlr82vcj2c7387fol0-a; status available; PostgreSQL 16; plan free; region singapore |
| Hạn dùng PostgreSQL Free | Đã đọc metadata thật | Tạo 23/10/2026, hết hạn 22/11/2026; API timestamps 2026-10-23T13:14:08.263534Z và 2026-11-22T13:14:08.263534Z |
| Chặn kết nối DB công khai | PASS cấu hình | IP allowlist chỉ 127.0.0.1/32; chưa tạo API để kiểm chứng kết nối nội bộ đầu-cuối |
| Vercel project | PASS | brewlite-a2-web; ID prj_6BUoPh0TSriVnqrpLjZ1g0vijK3O; team DuVinhLoi (du-vinh-loi) |
| Root/framework/Node | PASS | Root Directory apps/web; framework nextjs; nodeVersion 24.x |
| Git auto-deploy web | PASS trạng thái cấu hình | Project link = null: không liên kết repository, deploy tay/CLI, Git push không tự deploy |
| Render API service | BLOCKED | Chờ registry credential chỉ có read:packages; chưa tạo service |
| DATABASE_URL internal / JWT_SECRET / CORS /health | NOT CONFIGURED trên API | Chờ tạo API; không có giá trị secret trong Git hoặc báo cáo |
| NEXT_PUBLIC_API_URL production | NOT CONFIGURED | Chưa có URL API Render thật |
| Migration/seed trên Render | NOT RUN | Image sẵn có chưa migrate khi boot; lần deploy đầu sẽ override command migrate/seed, Dockerfile cập nhật ở Pha B |
| Deploy web/API lần đầu và HTTPS smoke | NOT RUN | Chưa có URL production web/API/health/products để kiểm chứng |

### Credential và bước còn lại

Cơ chế duyệt tự động đã chặn việc gửi token GitHub CLI quyền rộng vào Render. Người dùng chọn phương án khuyến nghị: PAT riêng chỉ có read:packages, đồng thời đồng ý lưu Internal Database URL vào env API Render.
Không dùng token GitHub CLI quyền repo/workflow/write:packages làm credential cho Render.
Wizard tạm tại %TEMP%/brewlite-hosting-tools/ghcr-readonly-wizard.sh: nhập token ẩn, kiểm token chỉ có read:packages và đúng chủ package, lưu credential trên Render; không lưu PAT vào repository hoặc báo cáo. Hiện chưa có credential được wizard xác nhận.
Script được kiểm bash -n PASS. Đây là tiện ích local tạm, không được commit vì không phải tạo phẩm chung.

Bước tiếp theo sau khi token được nhập:
1. Tạo API Render Free cùng region Postgres, image SHA ở trên, health /health, tắt auto-deploy.
2. Đặt DATABASE_URL bằng Internal Database URL, JWT_SECRET ngẫu nhiên >=32 ký tự; migration deploy và seed create-if-missing trên DB sạch, không reset hoặc sửa lịch sử migration.
3. Cấu hình NEXT_PUBLIC_API_URL của Vercel production bằng URL HTTPS API thật và CORS_ORIGINS của API bằng URL production web thật.
4. Deploy snapshot apps/web từ commit đã push, Root Directory apps/web; không thay source UI của Người 1–3.
5. Smoke HTTPS /health, /products (menu có dữ liệu), trang web. Chỉ khi PASS mới bàn giao Pha A hoàn tất và báo Người 1–3.

### Lệnh/bằng chứng bổ sung

- docker build --label org.opencontainers.image.source=https://github.com/DuVinhLoi/BrewLite --label org.opencontainers.image.revision=6041b5f8fa7bba9211d78554f80bb2b2e3a46175 -t ghcr.io/duvinhloi/brewlite-api:6041b5f8fa7bba9211d78554f80bb2b2e3a46175 apps/api: PASS.
- docker push image SHA trên: PASS, digest khớp bảng. Token đăng nhập registry đi qua stdin, không ghi log.
- gh api users/DuVinhLoi/packages/container/brewlite-api/versions: PASS, tìm thấy đúng tag/version/digest.
- render postgres get brewlite-a2-db --output json: PASS, metadata available/free/singapore và IP allowlist.
- vercel api /v9/projects/brewlite-a2-web --scope du-vinh-loi: PASS, root/framework/node/link khớp bảng.
- Source snapshot chỉ apps/web và project metadata được chuẩn bị ở TEMP để deploy; không thêm dependency hay file generated vào repository.

Nguồn cấu hình:
- https://render.com/docs/deploying-an-image
- https://render.com/docs/postgresql-creating-connecting
- https://render.com/docs/free
- https://render.com/docs/cli
- https://vercel.com/docs/projects/managing-projects
- https://vercel.com/docs/monorepos

## Thông báo Người 1–3

Chưa gửi thông báo Pha A hoàn tất vì chưa có deploy/URL thật. Chưa có định danh/kênh liên hệ ba người trong phiên.
Nội dung sẽ gửi sau khi hosting PASS: tách branch từ origin/feat/assignment2-task5-delivery tại SHA được ghi lúc bàn giao; mỗi người chỉ sửa allowed paths trong card của mình, PR về branch delivery.
Nếu cần khởi động Pha B trước URL, trưởng nhóm phải xác nhận thay đổi điều kiện bắt đầu; agent không tự bỏ gate Pha A.
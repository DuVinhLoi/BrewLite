# Report Task 5 — Pha A, CR-5.0 lần 1

Ngày thực hiện: 23/10/2026. Chủ Task 5, branch feat/assignment2-task5-delivery.
Worktree: C:/BrewLite-a2-Task5. Trạng thái Pha A: PASS sync, cấu hình nền tảng, deploy tay và HTTPS smoke. Bàn giao Người 1–3 ở cuối báo cáo; chưa gửi qua kênh nhóm vì chưa có địa chỉ/kênh nhận.

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
PlantUML -checkonly, integration/E2E/build toàn bộ, rollback production NOT RUN ở lượt Pha A này. HTTPS smoke đã chạy sau triển khai, xem bên dưới.
Không khởi động dev server/Compose hoặc dùng cổng 3000/5432 của người khác.

## CR-5.3 — cấu hình nền tảng Pha A (cập nhật 23/10/2026)

Đã xác thực GitHub, Render CLI 2.31.0 và Vercel CLI 65.2.0. Không còn blocker đăng nhập nền tảng.
Đây là báo cáo bàn giao code/hạ tầng, không phải báo cáo đồ án LaTeX.

| Hạng mục | Trạng thái đã kiểm chứng | Bằng chứng |
|---|---|---|
| Build API image | PASS | Docker build thành công với source commit 6041b5f8fa7bba9211d78554f80bb2b2e3a46175 |
| Publish GHCR | PASS | ghcr.io/duvinhloi/brewlite-api:6041b5f8fa7bba9211d78554f80bb2b2e3a46175; public package (GitHub API và manifest anonymous HTTP 200); version ID 1434898354 |
| Image digest | PASS | sha256:f8bfa6b18d74f9cf41ed380f6f3cb0c591945a83333d3ed3807dfe55c633afa8 |
| Render PostgreSQL | PASS | brewlite-a2-db; ID dpg-dbdlr82vcj2c7387fol0-a; status available; PostgreSQL 16; plan free; region singapore |
| Hạn dùng PostgreSQL Free | Đã đọc metadata thật | Tạo 23/10/2026, hết hạn 22/11/2026; API timestamps 2026-10-23T13:14:08.263534Z và 2026-11-22T13:14:08.263534Z |
| Chặn kết nối DB công khai | PASS cấu hình | IP allowlist chỉ 127.0.0.1/32; API dùng DB nội bộ, health xác nhận database up |
| Vercel project | PASS | brewlite-a2-web; ID prj_6BUoPh0TSriVnqrpLjZ1g0vijK3O; team DuVinhLoi (du-vinh-loi) |
| Root/framework/Node | PASS | Root Directory apps/web; framework nextjs; nodeVersion 24.x |
| Git auto-deploy web | PASS trạng thái cấu hình | Project link = null: không liên kết repository, deploy tay/CLI, Git push không tự deploy |
| Render API service | PASS, live | brewlite-a2-api; srv-dbdms83ncjis73aodm1g; Free/Singapore; autoDeploy=no, autoDeployTrigger=off; health /health |
| DATABASE_URL / JWT_SECRET / CORS | PASS cấu hình thật | DATABASE_URL internal; JWT_SECRET ngẫu nhiên 64 ký tự; CORS_ORIGINS=https://brewlite-a2-web.vercel.app; SEED_DEMO_USERS=true; không ghi secret vào Git |
| NEXT_PUBLIC_API_URL production | PASS | https://brewlite-a2-api.onrender.com |
| Migration/seed | PASS | Áp dụng 20261019000000_init và 20261021000000_sprint2; seed xác nhận 8 sản phẩm; không reset DB |
| API HTTPS /health | PASS | HTTP 200, {"status":"ok","database":"up"} |
| API HTTPS /products | PASS | HTTP 200, mảng 8 món; Access-Control-Allow-Origin=https://brewlite-a2-web.vercel.app |
| Web HTTPS anonymous | PASS | https://brewlite-a2-web.vercel.app HTTP 200 |
| Menu Chromium | PASS | Request /products 200; 8 article: Americano, Bạc xỉu, Cà phê sữa, Cappuccino, Cold brew, Matcha latte, Trà đào, Trà sữa trân châu |

### Deployment và khởi động thực tế

- API https://brewlite-a2-api.onrender.com; deployment dep-dbdn0229lscs73cat9q0 live lúc 2026-10-23T14:33:34Z (21:33 Việt Nam).
- Web https://brewlite-a2-web.vercel.app; deployment dpl_4P8q8ZvE4TSw12J3637oeEQ2iapW READY/production. Snapshot apps/web từ commit 6041b5f8fa7bba9211d78554f80bb2b2e3a46175.
- Digest bảng là manifest index GHCR; Render báo platform manifest sha256:2812ff8ca5dbbcc1cb9de6487e2de91e2d544b856fcd2152a5154143653bc832 cho đúng image tag SHA.
- Package public: không cần PAT/registry credential; không gửi GitHub CLI token quyền rộng vào Render. Wizard PAT cũ không còn cần dùng.
- Deploy trước lỗi Docker Command: dấu nháy bị giữ trong đối số; bỏ shell thì chỉ migration chạy rồi thoát. Override dưới giữ script thành một đối số, ${IFS} được shell mở rộng thành khoảng trắng; đã kiểm chứng migrate, seed và Nest PID 1 khởi động thành công:

```sh
/bin/sh -c npx${IFS}prisma${IFS}migrate${IFS}deploy&&npx${IFS}prisma${IFS}db${IFS}seed&&exec${IFS}node${IFS}dist/main.js
```

Dockerfile chưa sửa ở Pha A; Pha B CR-5.3 sẽ chuyển migrate vào CMD chuẩn. Override hiện chạy migrate/seed idempotent trước server, không reset dữ liệu.
Kiểm chứng: Render logs/deploys/REST metadata; Invoke-WebRequest anonymous; Chromium qua @playwright/test có sẵn. Không dùng cookie/token Vercel để vượt bảo vệ deployment. Không chạy full checkout E2E production, không diễn tập rollback hoặc kích hoạt CD cũ VPS/SSH.

### Bàn giao Người 1–3

Pha A đã có baseline sync và URL hoạt động. Người 1–3 có thể bắt đầu theo card-task5-p1.md, card-task5-p2.md, card-task5-p3.md từ branch feat/assignment2-task5-delivery. Chủ Task 5 giữ API/CD và ma trận, không sửa UI contributor.
Nội dung thông báo: “CR-5.0 lần 1 xong, không chờ PR #9. Web https://brewlite-a2-web.vercel.app; API https://brewlite-a2-api.onrender.com. Health DB up, products/menu 8 món smoke PASS. Pull branch delivery rồi tách branch theo card P1–P3.”
Đã ghi thông báo tại đây để bàn giao; chưa gửi tới bên ngoài vì chưa xác định người nhận/kênh nhóm.

### Lệnh/bằng chứng bổ sung

- docker build --label org.opencontainers.image.source=https://github.com/DuVinhLoi/BrewLite --label org.opencontainers.image.revision=6041b5f8fa7bba9211d78554f80bb2b2e3a46175 -t ghcr.io/duvinhloi/brewlite-api:6041b5f8fa7bba9211d78554f80bb2b2e3a46175 apps/api: PASS.
- docker push image SHA trên: PASS, digest khớp bảng. Token đăng nhập registry đi qua stdin, không ghi log.
- gh api users/DuVinhLoi/packages/container/brewlite-api/versions: PASS, tìm thấy đúng tag/version/digest.
- render postgres get brewlite-a2-db --output json: PASS, metadata available/free/singapore và IP allowlist.
- vercel api /v9/projects/brewlite-a2-web --scope du-vinh-loi: PASS, root/framework/node/link khớp bảng.
- Source snapshot chỉ apps/web và project metadata ở TEMP đã deploy production READY; không thêm dependency hay file generated vào repository.

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
- Kiểm tra tài liệu sau cập nhật URL: python docs/validate_task2.py PASS (All static checks PASSED); git diff --check PASS; diff chỉ ba file docs/deployment.md, docs/task5/verification.md và report-task5.md. Không sửa source API/web nên không chạy lại unit suite trong lượt cập nhật tài liệu này.

## Pha B–D tiếp tục ngày 27/10/2026

Branch feat/assignment2-task5-delivery, worktree C:/BrewLite-a2-Task5. PR21 sync lần2 và PR22/23/24 của Người1–3 đã merge bởi nhóm; đã fetch/fast-forward, review lại nguồn và card. Merge ac4e758 lấy nốt PR20 vào delivery, không còn thiếu commit develop-Assignment2. Không merge lại các PR đã đóng.

CR-5.1/5.2: API D2/D3, migration mới DROP INDEX payments_success_key_per_user, bỏ nhánh simulator cũ. Test đỏ3fail/6pass trước sửa; xanh9/9. Bổ sung INT-S2-10 replay fingerprint cũ: đỏ1fail/9pass rồi xanh10/10. Replay kiểm method sau lookup owner/order/key/success, vẫn ghi fingerprint mới, không cần backfill dữ liệu thật.
CR-5.3: CD Render/Vercel, Docker migration CMD, bỏ hai file triển khai cũ. YAML parse PASS và9 shell blocks bash -n PASS; actionlint không có sẵn. Render hook bất đồng bộ nên nghiệm thu phải đọc deployment live + đúng image SHA.
CR-5.4/5.5: tài liệu deployment, README, verification, ma trận cập nhật; giữ nguyên52 bộ requirement/usecase/design. P1/P2 test IDs lấy từ mô tả PR23/22. PR24 không ghi mã nên UNIT-P3-01..05 lấy từ source đã merge, không gán nhầm là mô tả PR.

| Kiểm tra CR-5.6 trước commit | Kết quả thực tế |
|---|---|
| API lint / test --runInBand / build | PASS;19unit |
| Web lint / typecheck / test / build | PASS;8files50tests |
| Prisma migrate/seed DB test riêng | PASS;3migrations,8products |
| API test:integration | PASS10/10 |
| Web test:e2e Chromium | PASS6/6,11.3s |
| python docs/validate_task2.py | All static checks PASSED |
| docker compose config --quiet | PASS |
| git diff --check / scope inspection | PASS; chỉ đường dẫn card; CRLF conversion warnings không phải lỗi whitespace |

Production environment đã tạo; VERCEL_ORG_ID/VERCEL_PROJECT_ID và PRODUCTION_API_URL/PRODUCTION_WEB_URL đã đặt. Chưa có hai credential RENDER_DEPLOY_HOOK_URL/VERCEL_TOKEN; Vercel CLI bị nền tảng từ chối mint token cho app hiện tại. Không xuất session token quyền rộng để lách giới hạn. Các deploy/rollback manual sẽ dùng CLI hiện đã xác thực và được ghi riêng với CD tự động.

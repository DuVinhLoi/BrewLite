# Card Task 3 (Card B): đưa kiến trúc về lịch sử chung, đồng bộ ADR

> Chỉ mục: [`README.md`](README.md). Bản này thay cho mục "Card B" trong [`../../2026-10-21-req-sync-sprint2-scope-plan.md`](../../2026-10-21-req-sync-sprint2-scope-plan.md).
>
> Nên do chủ Task 3 tự làm để giữ tên tác giả của các ADR.

**Vì sao:** branch `feat/a2task-3-architecture` không có lịch sử chung với `develop-Assignment2` (`git merge-tree` lỗi 128), và diff của nó xóa `docs/requirements/`. Develop hiện chưa có ADR hay deployment diagram, nên PR #9 (Task 4) chưa được nghiệm thu (đề A2 §1).

**Branch:** `a2/task-3-architecture`, tạo mới từ `origin/develop-Assignment2`.

**Allowed paths:**
- Tạo: `docs/architecture/architecture.md`, `docs/architecture/adr/001-monorepo.md` đến `005-idempotency-and-optimistic-lock.md`, `docs/architecture/deployment.puml`, `docs/architecture/deployment.svg`
- Sửa: `docs/architecture/adr/README.md`
- Tạo: `docs/planning/handoff/2026-10-21-req-sync/report-task3.md`
- B7 (PR riêng): `docs/traceability-matrix.md`, chỉ cột Thiết kế/Sơ đồ

**Không mang theo:** `docs/architecture/srs.md`, `docs/architecture/Assignment2-BrewLite.md` (bản sao), và mọi thao tác xóa có trong branch cũ.

## Các bước

- [ ] **B0.** `git fetch origin && git switch -c a2/task-3-architecture origin/develop-Assignment2`
- [ ] **B1.** Chép file từ branch cũ:
  ```text
  git restore --source=origin/feat/a2task-3-architecture -- docs/architecture/architecture.md docs/architecture/adr/001-monorepo.md docs/architecture/adr/002-layered-nestjs.md docs/architecture/adr/003-prisma-migrations.md docs/architecture/adr/004-hosting-vercel-render.md docs/architecture/adr/005-idempotency-and-optimistic-lock.md docs/architecture/deployment.puml docs/architecture/deployment.svg
  ```
- [ ] **B2. ADR-005.**
  - Mục A: replay theo D2 (chủ đơn + `orderId` + `Idempotency-Key` + `paymentMethod`; cùng key khác `paymentMethod` sau `PAID` → 409 `ORDER_NOT_PAYABLE`).
  - Xóa mục B (bảng lưu bền vững của simulator) và mục C (phục hồi E8b). Thay bằng: "Simulator là module không lưu trạng thái; API dừng giữa bước 13 và 14 là rủi ro chấp nhận (SRS 3.4)."
  - Xóa "Câu hỏi cho nhóm" (đã chốt bằng D2). Bỏ "bảng lưu kết quả của simulator" khỏi phần Hệ quả.
  - Giữ mục D (trừ kho bằng `UPDATE … WHERE stock >= n` trong transaction).
  - Đổi tiêu đề thành "Idempotency thanh toán và chống bán vượt tồn kho". Trạng thái: "Đã chốt 2026-10-21".
- [ ] **B3. ADR-004 (nền tảng đã chốt P1: Vercel + Render).**
  - Trạng thái: "Đã chốt 2026-10-21".
  - Xóa gạch đầu dòng `/health.version là SHA của image …`.
  - Thay bằng: "`/health` trả `{status, database}`; CD chạy smoke test `/health`, `/products` và trang web, retry tới khi 200, tối đa 10 phút (AC-N18.2). Rollback: deploy hook Render với image tag SHA bản trước, `vercel rollback` cho web (AC-N18.3)."
  - Bảng rủi ro, dòng "Web service free ngủ": đổi "retry tới ~2 phút" thành "retry tới 10 phút".
  - Thêm: "Migration chạy trong lệnh khởi động container trên Render (ADR-003): `npx prisma migrate deploy && node dist/main.js`."
- [ ] **B3a. ADR-003.** Trạng thái: "Đã chốt 2026-10-21". Giữ nội dung.
- [ ] **B3b. `architecture.md`.**
  - Bỏ câu "chưa đối chiếu với `srs.md` …" ở đầu file. Thay bằng "Đã đối chiếu SRS sau PR #11 (2026-10-21)."
  - §5 "Health check": `GET /health` trả `{status, database}` (200/503); bỏ `version`, `APP_VERSION`, `Cache-Control`.
  - §5 "Cấu hình": bỏ `APP_VERSION` khỏi danh sách biến.
  - §5 "Lưu ý nhất quán": bỏ gạch đầu dòng về bảng simulator. Thêm "`Product.description` có trong class diagram (D1)."
  - §6, dòng ADR 005: bỏ "Thêm bảng lưu kết quả của simulator; logic phục hồi E8b phức tạp hơn".
- [ ] **B3c. `deployment.puml` (C2).**
  - Component API: bỏ `, APP_VERSION=<SHA>` khỏi dòng `Env: …`.
  - Artifact `cd.yml`: đổi `→ chờ /health đúng SHA → smoke test` thành `→ smoke test (retry ≤ 10 phút)`.
  - Mũi tên `(9)`: đổi `poll /health\nrồi smoke test` thành `smoke /health, /products, web`.
  - Giữ `brewlite-api:<commit-sha>` và `(6) pull theo SHA` (đề A2 §7.3 mục 2 vẫn đòi image tag SHA).
  - Dùng Edit/Write để sửa, không dùng heredoc của bash, vì file có `\n`.
- [ ] **B4.** `docs/architecture/adr/README.md` dòng 19–20: viết lại mô tả 004/005 theo B2–B3.
- [ ] **B5. Render và kiểm.**
  - Render `deployment.puml`: `java -jar plantuml-1.2026.8.jar -charset UTF-8 -tsvg -o <thư mục tạm> docs/architecture/deployment.puml`. Kiểm SVG có `<?plantuml` hoặc `data-diagram-type=`, không có "Syntax Error", rồi chép đè `docs/architecture/deployment.svg`. SVG trên branch cũ không do PlantUML sinh nên bắt buộc render lại.
  - `git grep -n "E8b\|AC-F16.7\|APP_VERSION\|version.*SHA\|~2 phút" -- docs/architecture` → 0 dòng.
  - `git diff --check` sạch; `git diff --name-only origin/develop-Assignment2...HEAD` chỉ gồm allowed paths.
- [ ] **B6. Commit, report, PR.**
  - `git commit -m "docs(architecture): add Task 3 ADRs and deployment diagram on shared history"`
  - Ghi `report-task3.md`.
  - Mở PR vào `develop-Assignment2`. PR này phải merge **trước** PR #9.
- [ ] **B7. Ma trận (PR riêng, chỉ sau khi PR #9 đã merge).**
  - Điền 19 ô "chờ Task 3" ở cột Thiết kế/Sơ đồ bằng ADR, `Deployment-01` (= `docs/architecture/deployment.svg`) và `architecture.md`, theo bảng §8 của `architecture.md`.
  - Phải chờ PR #9, vì PR #9 sửa các dòng NFR-01/02/07/09/11/16/17 và git báo xung đột cả khi hai bên sửa dòng sát nhau.

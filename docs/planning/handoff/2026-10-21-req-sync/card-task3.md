# Card Task 3: đưa kiến trúc về lịch sử chung, đồng bộ ADR

> Chỉ mục: [`README.md`](README.md). Bản này thay cho mục "Card B" trong [`../../2026-10-21-req-sync-sprint2-scope-plan.md`](../../2026-10-21-req-sync-sprint2-scope-plan.md).
>
> Chủ Task 3 tự làm để giữ tên tác giả của các ADR, và tự đọc lại từng câu: nhóm phải giải thích được nội dung khi vấn đáp.

**Vì sao:** branch `feat/a2task-3-architecture` không có lịch sử chung với `develop-Assignment2` (`git merge-tree` lỗi 128), và diff của nó xóa `docs/requirements/`. `develop-Assignment2` chưa có ADR hay deployment diagram, nên PR #9 (Task 4) chưa được nghiệm thu (đề A2 §1). Nội dung trên branch cũ soạn trước PR #11, nên còn E8b, `/health.version`, chờ SHA.

**Branch:** `a2/task-3-architecture`, tạo mới từ `origin/develop-Assignment2`.

**Allowed paths:**
- Tạo: `docs/architecture/architecture.md`, `docs/architecture/adr/001-monorepo.md` đến `005-idempotency-and-optimistic-lock.md`, `docs/architecture/deployment.puml`, `docs/architecture/deployment.svg`, `docs/planning/handoff/2026-10-21-req-sync/report-task3.md`
- Sửa: `docs/architecture/README.md`, `docs/architecture/adr/README.md`
- B10 (PR riêng): `docs/traceability-matrix.md`, chỉ cột Thiết kế/Sơ đồ, chỉ phần "chờ Task 3"

**Không mang theo:** `docs/architecture/srs.md`, `docs/architecture/Assignment2-BrewLite.md` (bản sao), và mọi thao tác xóa có trong branch cũ.

## Các bước

- [ ] **B0.** `git fetch origin && git switch -c a2/task-3-architecture origin/develop-Assignment2`
- [ ] **B1.** Chép file từ branch cũ rồi stage ngay (file chép về là untracked; cổng kiểm ở B5 chỉ thấy file đã stage):
  ```text
  git restore --source=origin/feat/a2task-3-architecture -- docs/architecture/architecture.md docs/architecture/adr/001-monorepo.md docs/architecture/adr/002-layered-nestjs.md docs/architecture/adr/003-prisma-migrations.md docs/architecture/adr/004-hosting-vercel-render.md docs/architecture/adr/005-idempotency-and-optimistic-lock.md docs/architecture/deployment.puml docs/architecture/deployment.svg
  git add docs/architecture
  ```
- [ ] **B2. Trạng thái mọi ADR (S1).** Ở ADR 001–005, dòng `- **Trạng thái:** Đề xuất (nhóm chốt qua PR)…` đổi thành `- **Trạng thái:** Accepted (2026-10-21)`.
- [ ] **B3. ADR-005** (đổi tiêu đề thành `# ADR-005: Idempotency thanh toán và chống bán vượt tồn kho`; giữ tên file để không đổi link).
  - Dòng **Liên quan**: bỏ `16.7` khỏi `AC-F16.1, 16.4, 16.5, 16.7` và bỏ `E8b` khỏi `(T1, T2, E4a, E8b)`.
  - **Bối cảnh**: bỏ vế "API có thể chết giữa lúc simulator đã thu tiền… (E8b)". Thay bằng: "API dừng giữa bước 13 và 14 của UC-04 là rủi ro chấp nhận vì Payment Service là mô phỏng (SRS 3.4)."
  - **Mục A**: thay "đúng người dùng/đơn/`idempotencyKey`/body" bằng "cùng chủ đơn, `orderId`, `Idempotency-Key` và `paymentMethod` (BR-05; `cardNumber` không lưu nên không so)". Thêm câu: "Cùng key nhưng khác `paymentMethod` sau khi đơn đã `PAID` là yêu cầu mới → 409 `ORDER_NOT_PAYABLE`, không gọi Payment Service (AC-F16.1)." Giữ ràng buộc một `Payment SUCCESS` mỗi đơn.
  - Xóa **mục B** (bảng lưu bền vững của simulator) và **mục C** (phục hồi E8b). Thay bằng: "**B. Simulator không lưu trạng thái** (SRS 3.4). Chống thu trùng do API bảo đảm theo mục A và trạng thái đơn."
  - Đổi tên mục D thành C, giữ nguyên nội dung (`UPDATE … WHERE stock >= :n` trong transaction).
  - **Hệ quả**: ưu điểm bỏ "phục hồi được sau crash" và vế "integration test dừng API ở khoảng giữa bước 13–14…, rồi retry", giữ test 10 yêu cầu đồng thời; hạn chế bỏ "thêm bảng của simulator" và "logic phục hồi phức tạp hơn", thêm "API dừng giữa bước 13 và 14 để lại đơn `PENDING` (rủi ro chấp nhận)".
  - Xóa dòng **Câu hỏi cho nhóm** (đã chốt bằng D2).
  - **Phương án đã loại**: bỏ "lưu kết quả simulator trong RAM (mất khi restart, vi phạm SRS 3.4)".
- [ ] **B4. ADR-004** (nền tảng P1: Vercel + Render).
  - Ngày: `2026-10-21`. Bỏ "– theo mục E của kế hoạch" ở dòng Trạng thái.
  - Xóa gạch đầu dòng `/health.version là SHA của image …`. Thay bằng: "`/health` trả `{status, database}`; CD chạy smoke test `/health`, `/products` và trang web, retry tới khi 200, tối đa 10 phút (AC-N18.2). Rollback: gọi deploy hook Render với image tag SHA bản trước và `vercel rollback` cho web, rồi smoke lại (AC-N18.3)."
  - Thêm gạch đầu dòng: "Migration chạy trong lệnh khởi động container trên Render (ADR-003): `npx prisma migrate deploy && node dist/main.js`."
  - Bảng rủi ro, dòng "Web service free ngủ": đổi "retry tới ~2 phút" thành "retry tới 10 phút".
  - Giữ tên image `ghcr.io/<org>/brewlite-api:<commit-sha>` (khớp `ghcr.io/${GITHUB_REPOSITORY,,}-api` trong `cd.yml` của Task 5).
- [ ] **B5. ADR-003.** Ngày `2026-10-21`. Giữ nội dung.
- [ ] **B6. `architecture.md`.**
  - Dòng 3: thay cả khối trích dẫn "Bản nháp do AI soạn… chưa đối chiếu…" bằng "> Đã đối chiếu SRS sau PR #11 (2026-10-21)."
  - §3, bảng Container, dòng Payment mô phỏng: "Ví/Thẻ mô phỏng, thành công/thất bại, chống thu trùng" → "Ví/Thẻ mô phỏng, thành công/thất bại; không lưu trạng thái".
  - §4, dòng `payments`: "simulator chống thu trùng (ADR-005)" → "replay theo BR-05 ở API (ADR-005)".
  - §4, dòng `health`: "`GET /health` kiểm DB, trả 200/503, có `version` (SHA), không cache" → "`GET /health` kiểm DB, trả 200/503 (NFR-15)".
  - §5 "Health check": "`GET /health` kiểm kết nối DB, trả `{status, database}` (200 hoặc 503)". Bỏ `version`, `APP_VERSION`, `Cache-Control`.
  - §5 "Cấu hình": bỏ `APP_VERSION` khỏi danh sách biến.
  - §5 "Lưu ý nhất quán": bỏ gạch đầu dòng về bảng lưu kết quả của simulator. Thêm "`Product.description` có trong class diagram (D1)."
  - §6, dòng ADR 005: cột hạn chế thay "Thêm bảng lưu kết quả của simulator; logic phục hồi…" bằng "API dừng giữa bước 13 và 14 là rủi ro chấp nhận".
  - §8: đổi `deployment.puml (poll /health)` ở dòng NFR-15 thành `deployment.puml (smoke /health)`. Thêm dòng cho đủ 19 NFR mà B10 sẽ điền: NFR-01, NFR-03 (§4 module `catalog`, `orders`, `payments`; đo trên docker-compose local), NFR-02, NFR-09, NFR-10, NFR-11 (§3 container Web: Next.js, PWA manifest, ba trạng thái), NFR-04, NFR-05 (§4 module `auth`), NFR-12 (§7, E2E chạy trong CI). Chủ Task 3 sửa lại nếu thấy ánh xạ khác đúng hơn.
- [ ] **B7a. `deployment.puml` (C2).** Sửa bằng Edit/Write.
  - Component API: bỏ `, APP_VERSION=<SHA>` khỏi dòng `Env: …`.
  - Artifact `cd.yml`: đổi `→ chờ /health đúng SHA → smoke test` thành `→ smoke test (retry ≤ 10 phút)`.
  - Mũi tên `(9)`: đổi `poll /health\nrồi smoke test` thành `smoke /health, /products, web`.
  - Giữ `brewlite-api:<commit-sha>` và `(6) pull theo SHA` (đề A2 §7.3 mục 2 đòi image tag SHA).
- [ ] **B7b. README thư mục.**
  - `docs/architecture/README.md` dòng 3: "Thư mục này **chưa có nội dung**…" → "Task 3: `architecture.md`, `adr/`, `deployment.puml`/`.svg`."
  - `docs/architecture/adr/README.md`: dòng 3 "Thư mục này **chưa có ADR**…" → "ADR của Task 3 (đề A2 §5.1)."; tiêu đề dòng 12 → `## Danh sách ADR`; dòng 19–20 viết lại mô tả 004/005 theo B3–B4 (bỏ `/health.version`, chờ SHA, simulator lưu bền vững, E8b, AC-F16.7).
- [ ] **B8. Render, stage, kiểm.**
  - Render: `java -jar plantuml-1.2026.8.jar -charset UTF-8 -tsvg -o <thư mục tạm> docs/architecture/deployment.puml`. SVG phải có `<?plantuml` hoặc `data-diagram-type=` và không có "Syntax Error"; chép đè `docs/architecture/deployment.svg`. Bắt buộc render lại vì SVG trên branch cũ không do PlantUML sinh.
  - `git add docs/architecture`
  - Cổng chữ cũ, phải ra **0 dòng**:
    ```text
    git grep -n --cached -E "E8b|16\.7|AC-N15\.3|APP_VERSION|version.*SHA|/health\.version|đúng SHA|poll .?/health|Cache-Control|phục hồi|lưu bền vững|bảng lưu|~2 phút|/body|thất bại, chống thu trùng|simulator chống thu trùng|vi phạm SRS 3\.4|Câu hỏi cho nhóm|Đề xuất \(nhóm chốt|Bản nháp do AI|chưa đối chiếu|chưa có ADR|chưa có nội dung" -- docs/architecture
    ```
  - `git diff --cached --check` sạch.
  - `git diff --cached --name-only origin/develop-Assignment2` chỉ gồm allowed paths.
  - `python docs/validate_task2.py` PASS.
- [ ] **B9. Commit, report, PR.**
  - `git commit -m "docs(architecture): add Task 3 ADRs and deployment diagram on shared history"`
  - Ghi `report-task3.md` (output của từng lệnh ở B8), commit `docs(planning): add Task 3 sync report`.
  - Mở PR vào `develop-Assignment2`. PR này merge **trước** PR #9.

## B10. Ma trận (đợt 4, PR riêng)

Bắt đầu khi PR T2-M của Task 2 đã merge (README mục 2). Branch mới `a2/task-3-matrix` từ `origin/develop-Assignment2`.

- [ ] **B10.1** Liệt kê ô: `awk -F'|' '/^\| (FR|NFR)-/{ if($4 ~ /chờ Task 3/) print $2 }' docs/traceability-matrix.md`. Tại `040dd25` có 19 ô (NFR-01 đến NFR-20, trừ NFR-06).
- [ ] **B10.2** Thay phần "chờ Task 3 (…)" theo bảng §8 của `architecture.md`, dùng mã `Deployment-01` (= `docs/architecture/deployment.svg`), `ADR-00x`, `architecture.md §n`.
- [ ] **B10.3** Kiểm: `git add docs/traceability-matrix.md`; `git diff --cached --check`; lệnh B10.1 ra 0 dòng; `git diff --cached --name-only origin/develop-Assignment2` chỉ có `docs/traceability-matrix.md`; `python docs/validate_task2.py` PASS.
- [ ] **B10.4** Commit `docs(traceability): fill Task 3 design column`, ghi kết quả vào `report-task3.md` trên branch này, mở PR.

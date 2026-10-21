# Kế hoạch: vá SRS (Product.description, "cùng body") và giảm tải Sprint 2

> **For agentic workers:** REQUIRED SUB-SKILL: dùng superpowers:subagent-driven-development hoặc superpowers:executing-plans để làm theo từng card. Bước dùng checkbox (`- [ ]`). Mỗi worker đọc `.claude/rules/multi-agent-workflow.md` và `.claude/rules/doc-code-sync.md` trước khi sửa.

**Goal:** Sửa hai lỗi đặc tả của Task 1, cắt hai cam kết vượt mức tối thiểu của đề A2 để giảm tải Sprint 2, rồi đồng bộ sơ đồ Task 2, ADR Task 3, ma trận truy vết và plan Task 5 trong cùng một đợt.

**Architecture:** Chỉ sửa tài liệu (Task 1–3), không viết code trong `apps/`, `tests/` hay `.github/`. Thứ tự sửa theo `doc-code-sync.md`: SRS → use-case → sơ đồ → ADR → ma trận.

**Tech Stack:** Markdown, PlantUML (render bằng PlantUML thật, không dùng `docs/render_svg.py`), Orca orchestration cho điều phối.

**Spec:** báo cáo rà soát Task 1 ngày 2026-10-21 (trong hội thoại) và đề A2 `docs/Assignment2-BrewLite.md` §3, §4, §7.3.

## Global Constraints

- Branch tích hợp: `develop-Assignment2`. Bắt đầu từ `origin/develop-Assignment2` (`8c0ded9`), vì branch local `develop-Assignment2` (`3397734`) đang chậm hơn.
- Commit message, comment, tên branch viết bằng tiếng Anh; nội dung tài liệu viết tiếng Việt. Không có trailer `Co-Authored-By`.
- Mã đã bỏ (AC, luồng) không dùng lại số hiệu. Ghi lý do vào ghi chú rút gọn ở SRS mục 1.4 (đề A2 §6.2).
- Mỗi `.puml` đã sửa phải có `.svg` render bằng PlantUML. File SVG phải có `<?plantuml` ở đầu và không chứa "Syntax Error".
- Không đổi số lượng Must/Could/Won't của FR. NFR-01 giữ Must (đã chốt ở commit `f890270`).

## Cổng quyết định (người dùng chốt trước khi giao card)

> **Trạng thái 2026-10-21:** người dùng chốt D1, D2, C1, C2 theo đề xuất; C3, C4 giữ nguyên. Card A đã làm trực tiếp trong phiên Integrator (một card, không có wave song song nên không dispatch worker Orca), render bằng `plantuml-1.2026.8.jar` (Docker Hub lỗi xác thực; class diagram dùng `-Playout=smetana` vì máy không có Graphviz). Card B, C chưa làm. Ngoài plan: sửa `docs/validate_task2.py` trỏ đúng `docs/diagrams`, đọc UTF-8, kiểm SVG do PlantUML sinh.

| Mã | Quyết định | Đề xuất | Lợi ích cho Sprint 2 |
|---|---|---|---|
| D1 | Thêm `description: String` vào `Product` (SRS 3.6, class diagram) | **Làm** | Hết mâu thuẫn AC-F03.1 ↔ 3.6 ↔ schema Task 4 |
| D2 | "Cùng yêu cầu" khi replay thanh toán = cùng chủ đơn + `orderId` + `Idempotency-Key` + `paymentMethod`; `cardNumber` không dùng để so | **Làm** | Hết câu hỏi mở ở ADR-005, test AC-F16.1 viết được |
| C1 | Bỏ AC-F16.7 / luồng E8b: simulator không cần lưu bền vững, không cần phục hồi sau crash | **Cắt** | Bớt bảng của simulator, logic phục hồi và integration test gây crash giữa chừng |
| C2 | Bỏ `/health.version` = SHA (AC-N15.3); smoke test chỉ chờ HTTP 200; rollback = deploy lại image tag cũ rồi smoke test | **Cắt** | Bớt build-arg `APP_VERSION` và script poll so SHA trong CD/rollback |
| C3 | Rút gọn E1b (AC-F10.4) | **Giữ nguyên** | Sơ đồ đã vẽ xong, phần UI không lớn; cắt thì phải vẽ lại sequence và activity |
| C4 | AC-F13.3 (10 request đồng thời) | **Giữ nguyên** | Đề §4.2 đòi transaction tồn kho; `UPDATE ... WHERE stock >= n` (ADR-005 mục D) làm test này rẻ |

Đề A2 không đòi C1 và C2: §7.3 chỉ yêu cầu "gọi health check/smoke test", còn image vẫn gắn tag SHA theo §7.3 mục 2. Nếu người dùng đổi một quyết định thì bỏ các bước gắn mã đó trong card A, B và C.

## Workflow điều phối (Orca)

```text
Cổng D1/D2/C1/C2 (người dùng)
        │
        ├── Card A  (worker 1, sonnet) ── branch a2/req-sync-sprint2-scope   ┐ chạy song song,
        └── Card B  (worker 2, sonnet) ── branch a2/task-3-architecture       ┘ file không giao nhau
                         │
            Integrator: cổng G1–G6, merge A rồi B vào develop-Assignment2 (khi người dùng đồng ý)
                         │
        Card C  (worker 3, sonnet) ── CR cho Task 4 và Task 5 (phụ thuộc A đã merge)
```

Lý do chọn hình dạng này:
- **Song song A và B có lợi thật.** Hai card ở hai branch khác nhau, bộ file tách rời, và mọi quyết định đã được chốt sẵn trong plan nên không phải chờ nhau.
- **Không tách card A làm hai** (SRS / sơ đồ). Sơ đồ phải dùng đúng câu chữ của SRS. Tách ra thì tốn thêm một worktree, một lần merge và một vòng đối chiếu, mà phần sửa mỗi bên chỉ vài chục dòng.
- **C chạy sau A** vì CR phải trỏ đúng mục SRS đã merge.
- **Phiên này làm Integrator/coordinator:** tạo worktree, giao card qua Orca, chạy cổng và ghi ledger. Người dùng là Dispatcher và duyệt merge.

Lệnh coordinator. Kiểm cú pháp bằng `orca orchestration worker-start --help` trước khi chạy, vì cờ chọn worktree và model có thể khác giữa các phiên bản:

```text
orca status --json
orca orchestration run-create --objective "A2 req sync + Sprint 2 scope cut" --json
orca orchestration worker-start --spec "<nội dung Card A>" --worktree <path worktree A> --agent claude --model sonnet --json
orca orchestration worker-start --spec "<nội dung Card B>" --worktree <path worktree B> --agent claude --model sonnet --json
orca orchestration check --wait --types "worker_done,escalation,question" --timeout-ms 900000 --json
```

Integrator dựng worktree trước khi giao card. Worker không được chạy lệnh `worktree`:

```text
git fetch origin
git worktree add -b a2/req-sync-sprint2-scope .worktrees/req-sync origin/develop-Assignment2
git worktree add -b a2/task-3-architecture  .worktrees/task3-rehome origin/develop-Assignment2
```

Report và CR nằm trong `docs/planning/handoff/2026-10-21-req-sync/` (`report-A.md`, `report-B.md`, `CR-*.md`). Ledger ghi ở `docs/planning/handoff/2026-10-21-req-sync/ledger.md`, chỉ Integrator ghi.

## Review Focus

- **Replay cùng key nhưng khác `paymentMethod` sau khi đã thành công.** Đây không phải replay, nên xử lý như yêu cầu mới: đơn đã `PAID` → 409 `ORDER_NOT_PAYABLE`, không gọi simulator. Card A ghi vào AC-F16.1.
- **Sau C1, đọc lại hậu quả khi API dừng giữa bước 13 và 14.** Simulator không thu tiền thật, đơn còn `PENDING`, khách thanh toán lại được. Phải ghi là "rủi ro chấp nhận", không được ghi là "không thể xảy ra". Card A kiểm ở SRS 3.4 và UC E8.
- **Còn sót tham chiếu tới AC-F16.7, E8b hoặc `version` = SHA.** Phải rà cả sơ đồ, ma trận, ADR README, plan A2 và ADR-004/005 bên Task 3. Card A và B đều có lệnh `git grep` cho việc này.
- **Xung đột ma trận với Task 4.** Branch `a2/Task4` sửa các dòng FR-01–03, NFR-01/02/07/09/11/16/17 và dòng mở đầu. Card A chỉ được sửa các dòng FR-16, NFR-13, NFR-15, NFR-18.
- **SVG giả.** `class-domain.svg` và `sequence-checkout.svg` hiện do graphviz/script sinh ra, không phải PlantUML. Card A render lại bằng PlantUML thật.

---

### Card A: Đồng bộ SRS, use-case, sơ đồ, ma trận (D1, D2, C1, C2)

**Branch / worktree:** `a2/req-sync-sprint2-scope` tại `.worktrees/req-sync`.

**Allowed paths:**
- Sửa: `docs/requirements/srs.md`, `docs/requirements/uc-checkout.md`
- Sửa: `docs/diagrams/class-domain.puml|.svg`, `docs/diagrams/sequence-checkout.puml|.svg`, `docs/diagrams/activity-checkout.puml|.svg`
- Sửa: `docs/validate_task2.py` (chỉ dòng 12 và 110)
- Sửa: `docs/traceability-matrix.md` (chỉ các dòng FR-16, NFR-13, NFR-15, NFR-18)
- Sửa: `docs/planning/2026-10-15-assignment2-plan.md` (chỉ các câu nói về E8b, AC-F16.7 và `/health.version`)
- Tạo: `docs/planning/handoff/2026-10-21-req-sync/report-A.md`

**Interfaces:**
- Produces: câu chữ chuẩn mà Card B và C trích lại:
  - D2: "cùng chủ đơn, `orderId`, `Idempotency-Key` và `paymentMethod`"
  - C1: "AC-F16.7 đã bỏ (rút gọn), rủi ro E8 chấp nhận"
  - C2: "`/health` trả `{ status, database }`; smoke test chờ 200"

- [ ] **A1. D1 – SRS.** Ở `srs.md:176`, sửa `Product(id, name, price, imageUrl, stock)` thành `Product(id, name, description, price, imageUrl, stock)`.
- [ ] **A2. D1 – class diagram.** Trong `class-domain.puml`, thêm `+description: String` ngay sau `+name: String` của `Product`. Ở `validate_task2.py:12`, đổi thành `'Product':['id','name','description','price','imageUrl','stock']`.
- [ ] **A3. D2 – SRS.**
  - BR-05 (`srs.md:159`): thêm câu "Hai yêu cầu là **cùng một yêu cầu** khi cùng chủ đơn, `orderId`, `Idempotency-Key` và `paymentMethod`; `cardNumber` không lưu nên không dùng để so."
  - AC-F14.3 (`srs.md:355`): thay "cùng người dùng/đơn/key/body" bằng "cùng chủ đơn/`orderId`/key/`paymentMethod` (BR-05)".
  - AC-F16.1 (`srs.md:372`): thay "cùng body" bằng "cùng `paymentMethod`". Thêm câu: "Cùng key nhưng khác `paymentMethod` sau khi đã thành công không phải replay: xử lý như yêu cầu mới, đơn đã `PAID` nên trả 409 `ORDER_NOT_PAYABLE`, không gọi Payment Service."
- [ ] **A4. D2 – use-case.** Trong `uc-checkout.md`, ở bước 10 (dòng 102), E4a (dòng 187) và E7 (dòng 206), thay "người dùng/đơn/key/body" bằng "chủ đơn/`orderId`/key/`paymentMethod`".
- [ ] **A5. D2 – sơ đồ.**
  - `sequence-checkout.puml:104` → `API -> DB : Lookup SUCCESS by owner + orderId + key + paymentMethod`
  - `activity-checkout.puml:128` → `:Look up SUCCESS by owner + order + key + paymentMethod;`
- [ ] **A6. C1 – SRS.**
  - Mục 3.4 (dòng 148–149): giữ câu "API gửi `orderId` làm mã tham chiếu". Thay phần chống thu trùng / lưu bền vững bằng: "Chống thu trùng do API bảo đảm (FR-16: trả lại kết quả thành công theo BR-05; đơn đã `PAID` thì 409). Simulator không lưu trạng thái. Nếu API dừng sau khi simulator trả thành công nhưng trước commit bước 14 của UC-04 thì đơn vẫn `PENDING` và khách thanh toán lại được; đây là rủi ro chấp nhận vì không có tiền thật."
  - Xóa AC-F16.7 (dòng 376).
  - Ở mục 1.4 ghi chú rút gọn: thêm "(6) bỏ AC-F16.7 và luồng phục hồi E8b; (7) bỏ AC-N15.3 và điều kiện so SHA ở AC-N18.2–3 (đề A2 §7.3 chỉ đòi health check/smoke test)".
  - Mục 8: sửa ý 4 (bỏ "chống thu trùng theo `orderId` ở simulator và phục hồi sau lỗi E8b"), xóa ý 10.
- [ ] **A7. C1 – use-case.**
  - Bước 12: bỏ câu "simulator chống thu trùng … không thu thêm".
  - Bước 14: bỏ câu "Kết quả phục hồi E8b …".
  - Viết lại E8b thành: "chưa biết kết quả, hoặc API dừng trước commit bước 14: UI giữ `orderId`/key và báo lỗi như E8a; khách thanh toán lại đơn cũ (đơn vẫn `PENDING`). Rủi ro trùng thu được chấp nhận vì Payment Service là mô phỏng (SRS 3.4)."
  - Ở mục 9, dòng E8 bỏ `AC-F16.7`. Ở mục 10, xóa gạch đầu dòng E8b.
- [ ] **A8. C1 – sơ đồ.**
  - Sequence: xóa note E8b ở dòng 120. Gộp `alt Normal commit … else E8b … end` (dòng 131–155) thành một `group Transaction T2` duy nhất.
  - Activity: xóa action ở dòng 151 và đoạn note E8b quanh dòng 170.
  - `validate_task2.py:110`: bỏ `'E8b: API crashes'` khỏi bộ chuỗi phải có.
- [ ] **A9. C2 – SRS.**
  - AC-N15.1 trả `{ "status": "ok", "database": "up" }`. AC-N15.2 trả 503 `{ "status": "error", "database": "down" }`. Xóa AC-N15.3.
  - AC-N18.2 thay bằng: "Sau deploy, Smoke Test gọi `GET /health`, `GET /products` và trang web; mỗi bước thử lại tới khi nhận 200, tối đa 10 phút (chống ngủ đông); quá hạn thì pipeline đỏ và dừng."
  - AC-N18.3 thay bằng: "Rollback: deploy lại image có tag SHA của bản trước và deployment web trước, rồi chạy lại smoke test; quy trình ghi trong `docs/deployment.md` và README, đã thử một lần."
  - Xóa `/health.version` khỏi mục 3.1 (dòng 110).
- [ ] **A10. Ma trận.** Chỉ sửa:
  - FR-16: bỏ E8b, AC-F16.7 và ADR 005 phục hồi.
  - NFR-13: "E2, E4".
  - NFR-15: "200/503 theo DB".
  - NFR-18: "smoke test chờ 200; rollback image tag cũ".
- [ ] **A11. Plan A2.** Trong `2026-10-15-assignment2-plan.md`, sửa các câu về E8b, AC-F16.7 và `/health.version` cho khớp A6–A9. Giữ nguyên mọi câu "image tag SHA" vì đề §7.3 mục 2 vẫn đòi.
- [ ] **A12. Render.** Chạy `docker run --rm -v "<worktree>/docs/diagrams:/data" -v "<scratchpad>/render:/out" plantuml/plantuml -tsvg -o /out /data/class-domain.puml /data/sequence-checkout.puml /data/activity-checkout.puml`. Docker image có sẵn Graphviz mà class diagram cần. Kiểm ba file trong `<scratchpad>/render` đều có `<?plantuml` và không chứa "Syntax Error", rồi chép đè vào `docs/diagrams/`.
- [ ] **A13. Kiểm.**
  - `git grep -n "AC-F16.7\|E8b" -- docs/requirements docs/diagrams/*.puml docs/traceability-matrix.md`: chỉ còn trong ghi chú mục 1.4 và câu E8b đã viết lại ở UC.
  - `git grep -n "identical body\|cùng body\|key/body\|+ body" -- docs/requirements docs/diagrams/*.puml`: 0 dòng.
  - `git grep -n "AC-N15.3\|version.*SHA" -- docs/requirements docs/traceability-matrix.md`: chỉ còn trong ghi chú mục 1.4.
  - `python docs/validate_task2.py`: tất cả PASS. Nếu script báo không thấy thư mục (ROOT đang trỏ `docs/docs/diagrams`), ghi vào report, không sửa thêm.
  - `git diff --check`: sạch. `git diff --name-only origin/develop-Assignment2...HEAD` nằm trong allowed paths.
- [ ] **A14. Commit và report.**
  - `git commit -m "docs(requirements): define payment replay identity, add Product.description, drop E8b recovery and SHA health check"`
  - Ghi `report-A.md` gồm hash commit, danh sách file, dòng tổng kết của từng lệnh ở A13 và rủi ro. Gửi `worker_done`.

### Card B: Đưa Task 3 về lịch sử chung và cập nhật ADR (D2, C1, C2)

> **Đã thay thế 2026-10-21:** bản thực thi là [`handoff/2026-10-21-req-sync/card-task3.md`](handoff/2026-10-21-req-sync/card-task3.md) (thêm quyết định P1 Vercel + Render, ADR-003/004 đã chốt). Agent đọc [`handoff/2026-10-21-req-sync/README.md`](handoff/2026-10-21-req-sync/README.md) trước; phần dưới đây chỉ giữ làm lịch sử.

**Branch / worktree:** `a2/task-3-architecture` tại `.worktrees/task3-rehome`. Branch này chỉ được tạo khi chủ Task 3 đồng ý; tốt nhất là chủ Task 3 tự làm card này để giữ tác giả.

**Allowed paths:**
- Tạo: `docs/architecture/architecture.md`, `docs/architecture/adr/001-*.md` … `005-*.md`, `docs/architecture/deployment.puml|.svg`
- Sửa: `docs/architecture/adr/README.md`
- Tạo: `docs/planning/handoff/2026-10-21-req-sync/report-B.md`

**Không mang theo:** `docs/architecture/srs.md`, `docs/architecture/Assignment2-BrewLite.md` (bản sao), và mọi thao tác xóa có trong branch `feat/a2task-3-architecture`.

**Interfaces:**
- Consumes: câu chữ D2/C1/C2 ở mục Interfaces của Card A.

- [ ] **B0.** `git fetch origin && git switch -c a2/task-3-architecture origin/develop-Assignment2` (develop đã có PR #11, merge commit `040dd25`).
- [ ] **B1.** Chạy `git restore --source=origin/feat/a2task-3-architecture -- docs/architecture/architecture.md docs/architecture/adr/001-monorepo.md docs/architecture/adr/002-layered-nestjs.md docs/architecture/adr/003-prisma-migrations.md docs/architecture/adr/004-hosting-vercel-render.md docs/architecture/adr/005-idempotency-and-optimistic-lock.md docs/architecture/deployment.puml docs/architecture/deployment.svg`
- [ ] **B2. ADR-005.**
  - Mục A: định nghĩa replay theo D2.
  - Xóa mục B (bảng lưu bền vững của simulator) và mục C (phục hồi E8b). Thay bằng: "Simulator là module không lưu trạng thái; crash giữa bước 13–14 là rủi ro chấp nhận (SRS 3.4)."
  - Xóa "Câu hỏi cho nhóm" vì đã chốt. Bỏ "bảng lưu kết quả của simulator" khỏi phần Hệ quả.
  - Đổi tiêu đề thành "Idempotency thanh toán và chống bán vượt tồn kho".
- [ ] **B3. ADR-004 và `architecture.md`.**
  - Bỏ việc chờ `/health.version` đúng SHA trước smoke test.
  - `architecture.md` §5: health trả `{status, database}`, bỏ `APP_VERSION`.
  - `architecture.md` §5 lưu ý thứ hai và §6 dòng ADR 005: bỏ bảng simulator.
  - Bỏ câu "chưa đối chiếu với srs.md" ở đầu file; thay bằng "đã đối chiếu SRS ngày <ngày merge Card A>".
  - Thêm ghi chú "Product.description có trong class diagram" ở lưu ý nhất quán.
- [ ] **B3b. `deployment.puml` theo C2.**
  - Component API: bỏ `, APP_VERSION=<SHA>` khỏi dòng `Env: …`.
  - Artifact `cd.yml`: đổi `→ chờ /health đúng SHA → smoke test` thành `→ smoke test (chờ 200)`.
  - Mũi tên `(9)`: đổi `poll /health\nrồi smoke test` thành `smoke /health, /products, web`.
  - Giữ `brewlite-api:<commit-sha>` và `(6) pull theo SHA`, vì đề §7.3 mục 2 vẫn đòi image tag SHA.
- [ ] **B4.** `adr/README.md` dòng 19–20: viết lại mô tả 004/005 theo B2–B3.
- [ ] **B5. Render và kiểm.**
  - Render `deployment.puml` bằng `java -jar plantuml-1.2026.8.jar -charset UTF-8 -tsvg` (thêm `-Playout=smetana` nếu máy không có Graphviz). SVG phải có `<?plantuml` hoặc `data-diagram-type=`; SVG hiện tại trên branch cũ không có cả hai nên phải render lại.
  - `git grep -n "E8b\|AC-F16.7\|APP_VERSION\|version.*SHA" -- docs/architecture`: 0 dòng.
  - `git diff --check`: sạch.
- [ ] **B6. Commit và report.** `git commit -m "docs(architecture): add Task 3 ADRs and deployment diagram on shared history"`. Ghi report rồi gửi `worker_done`. Mở PR vào `develop-Assignment2`; PR này merge **trước** PR #9 (đề A2 §1).
- [ ] **B7. Ma trận, cột Thiết kế cho NFR (PR riêng, chỉ sau khi PR #9 đã merge).** Điền 19 ô "chờ Task 3" bằng ADR, `Deployment-01` và `architecture.md` theo bảng §8 của `architecture.md`. Phải chờ PR #9, vì PR #9 sửa các dòng NFR-01/02/07/09/11/16/17 và git báo xung đột cả khi hai bên sửa dòng sát nhau.

### Card C: CR cho Task 4 và Task 5 (chạy sau khi A đã merge)

**Allowed paths:** chỉ tạo `docs/planning/handoff/2026-10-21-req-sync/CR-task4.md` và `CR-task5.md`, trên branch `a2/req-sync-change-requests` (tách từ develop sau khi PR #11 merge). Card này không sửa branch Task 4/5, vì các branch đó có chủ riêng.

> **Trạng thái 2026-10-21:** đã soạn [`CR-task4.md`](handoff/2026-10-21-req-sync/CR-task4.md) và [`CR-task5.md`](handoff/2026-10-21-req-sync/CR-task5.md). Cập nhật cùng ngày: người dùng chốt Task 5 dùng `feat/assignment2-task5-delivery` (format `apps/web`, `apps/api`) và production Vercel + Render; `CR-task5.md` đã viết lại cho branch này. Branch `feat/assignment2-task5` (format `backend/` + `frontend/`, `apps/webs`) ngừng dùng.

- [ ] **C1. `CR-task4.md`.**
  - Ma trận dòng FR-02 bỏ "Chưa đo ngưỡng loading 200 ms" (SRS không có ngưỡng này).
  - Sau khi merge `develop-Assignment2`, cột Thiết kế các dòng FR-01–03 điền Class-01 (`Product`, gồm `description`).
  - Mỗi mục ghi đoạn cũ, đoạn mới và lý do.
- [ ] **C2. `CR-task5.md`.**
  - Trong `docs/planning/2026-10-21-task5-minimum-alignment-plan.md`: bỏ mọi việc về E8b, AC-F16.7, bảng simulator, `APP_VERSION` và poll so SHA. Câu "Đặc biệt giữ … phục hồi E8b … health có SHA" sửa theo D2/C1/C2.
  - Sửa `apps/webs` thành `apps/web`.
  - `docs/task5-traceability.md` phải dùng mã `FR-xx` / `UC-04` của A2 thay cho UC01–UC07 của A1.
- [ ] **C3.** Commit `docs(planning): add change requests for Task 4 and Task 5 after scope cut`, rồi gửi `worker_done`.

## Cổng của Integrator

- G1–G4 theo `multi-agent-workflow.md`, rồi `git merge --no-ff` (G5). Chỉ merge khi người dùng đồng ý.
- G6 sau merge A + B: chạy lại `python docs/validate_task2.py` và lệnh grep ở A13/B5 trên `develop-Assignment2`.
- Kiểm rằng bảng cuối `2026-10-15-assignment2-plan.md` vẫn phủ mọi yêu cầu bắt buộc của đề (rule doc-code-sync, mục "Xong khi").
- Ledger: mỗi card một dòng. Cuối đợt nhận xét: hai worker song song có đáng không.

## Ngoài phạm vi plan này

- Điền toàn bộ 25 ô "chờ Task 2" của cột Thiết kế. Việc này để PR riêng sau khi Task 4 merge, để tránh xung đột.
- Mọi code trong `apps/`: chỉ làm khi người dùng yêu cầu rõ.
- Mốc ngày C-10 trong `context-and-scope.md`: nhóm tự điền.

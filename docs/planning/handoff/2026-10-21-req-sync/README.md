# Bàn giao đợt 2026-10-21: đồng bộ Task 2–5 sau PR #11

> **Agent đọc file này trước.** Tìm dòng task của mình ở mục 3, mở đúng file card, làm theo thứ tự trong card. Không đọc các card của task khác trừ khi card của mình trỏ tới.
>
> **Nguồn duy nhất:** đọc card trên `develop-Assignment2`. Trước khi PR handoff merge, đọc trên branch `a2/req-sync-change-requests` (ví dụ `git show origin/a2/req-sync-change-requests:docs/planning/handoff/2026-10-21-req-sync/card-task3.md`). Không chép thư mục này vào branch task; mỗi task chỉ tạo file `report-task<N>.md` của mình. Mục "Card B/C" trong `docs/planning/2026-10-21-req-sync-sprint2-scope-plan.md` đã được thay bằng các card ở đây.

## 1. Quyết định

| Mã | Quyết định | Nguồn sự thật |
|---|---|---|
| D1 | `Product.description` có trong SRS 3.6 và class diagram | `docs/requirements/srs.md` §3.6; `docs/diagrams/class-domain.puml` |
| D2 | Replay thanh toán khi cùng **chủ đơn + `orderId` + `Idempotency-Key` + `paymentMethod`**; `cardNumber` không dùng để so. Cùng key nhưng khác `paymentMethod` sau khi `PAID` → 409 `ORDER_NOT_PAYABLE` | `srs.md` BR-05, AC-F14.3, AC-F16.1 |
| D3 | **Đề xuất, nhóm chốt trước khi code CR-5.1.** Cùng key dùng cho **đơn khác** là yêu cầu mới (BR-05 so cả `orderId`): đơn `PENDING`/`PAYMENT_FAILED` thì thanh toán bình thường. Hệ quả: bỏ unique index `payments_success_key_per_user ("userId","idempotencyKey")` bằng migration mới; index `payments_one_success_per_order` vẫn chặn thu trùng một đơn | `srs.md` BR-05; CR-task5 mục CR-5.1 |
| C1 | Bỏ AC-F16.7/E8b. Simulator không lưu trạng thái; API dừng giữa bước 13 và 14 là rủi ro chấp nhận | `srs.md` §1.4 (6), §3.4 |
| C2 | Bỏ AC-N15.3. `/health` trả `{status, database}`; smoke test `/health`, `/products`, trang web, retry tới khi 200, **tối đa 10 phút**; rollback = deploy lại image tag SHA bản trước rồi smoke lại | `srs.md` §1.4 (7), AC-N15.1–2, AC-N18.2–3 |
| C3 | Bỏ 502 khi Payment Service quá 5 giây (AC-F15.2) và 422 `IDEMPOTENCY_KEY_REUSED` (AC-F16.3). Thanh toán chỉ còn 402 `PAYMENT_DECLINED` | `srs.md` §1.4 (5), §3.2 |
| P1 | **Production: Vercel cho web (`apps/web`), Render cho API (container `ghcr.io/duvinhloi/brewlite-api:<sha>`) và Render Postgres (internal URL).** Không dùng VPS/SSH | `docs/requirements/context-and-scope.md` C-08; ADR-004 (Task 3) |
| P2 | **Task 5 dùng branch `feat/assignment2-task5-delivery`.** Branch `feat/assignment2-task5` ngừng dùng, không merge | file này |
| F1 | Format repo A2: `apps/api`, `apps/web`, `docs`, `tests`, `.github/workflows`. Branch format `backend/` + `frontend/` (`develop`, `develop-agile`, `main`, `thien35`, …) **không merge** vào `develop-Assignment2`; muốn dùng lại thì chép có chọn lọc vào `apps/` qua PR riêng | đề A2 §6.1, §9 |
| S1 | Trạng thái ADR theo mẫu `docs/architecture/adr/README.md`: `Proposed` / `Accepted` / `Superseded`. ADR đã chốt ghi `Accepted (2026-10-21)` | `adr/README.md` dòng 8 |

Lý do của D1–C2: kế hoạch [`../../2026-10-21-req-sync-sprint2-scope-plan.md`](../../2026-10-21-req-sync-sprint2-scope-plan.md), mục "Cổng quyết định".

## 2. Thứ tự merge vào `develop-Assignment2`

```text
Đợt 1 (song song, không chung file)
  Task 2  pull develop-Assignment2, kiểm sơ đồ       → card-task2.md (T2-1..T2-4)
  Task 3  branch mới từ develop-Assignment2          → card-task3.md (B0–B9)
  Task 4  pull develop-Assignment2, áp CR-task4      → CR-task4.md
Đợt 2 (tuần tự, đề A2 §1: task trước phải có trên repo)
  merge PR Task 3  →  merge PR #9 (Task 4)
Đợt 3
  Task 5  pull develop-Assignment2, áp CR-task5, mở PR → CR-task5.md
Đợt 4 (tuần tự, cùng sửa ma trận; NFR-05, NFR-13 chung một ô)
  Task 2  T2-M: điền 25 ô "chờ Task 2" (PR riêng)
  Task 3  B10: điền 19 ô "chờ Task 3" (PR riêng)
```

Chỉ người tích hợp (Integrator) merge, và chỉ khi người dùng đồng ý. Agent làm task **không** merge, không push lên `develop-Assignment2`.

## 3. Mỗi task đọc gì

| Task | Branch làm việc | File card | Đọc thêm (theo thứ tự) |
|---|---|---|---|
| 2 | `a2/task-2-diagrams` | [`card-task2.md`](card-task2.md) | `docs/diagrams/*.puml`; `docs/traceability-matrix.md` (T2-M) |
| 3 | `a2/task-3-architecture` (tạo mới từ `origin/develop-Assignment2`) | [`card-task3.md`](card-task3.md) | `srs.md` §1.4, §3.4, NFR-15, NFR-18; `docs/diagrams/class-domain.puml`; [`CR-task5.md`](CR-task5.md) mục CR-5.3 (cách deploy mà ADR phải mô tả) |
| 4 | `a2/Task4` (PR #9) | [`CR-task4.md`](CR-task4.md) | `docs/traceability-matrix.md` |
| 5 | `feat/assignment2-task5-delivery` | [`CR-task5.md`](CR-task5.md) | `srs.md` BR-05, FR-14–16, NFR-15, NFR-18; ADR-003, ADR-004, ADR-005 sau khi Task 3 merge |

## 4. Quy tắc chung cho mọi agent

1. Đọc `.claude/rules/doc-code-sync.md` và `.claude/rules/multi-agent-workflow.md` trước khi sửa.
2. Kiểm `git branch --show-current` đúng branch của card; chỉ sửa allowed paths của card.
3. Tầng dưới theo tầng trên: đề A2 → `docs/requirements/` → `docs/diagrams/`, `docs/architecture/` → code. Thấy lệch thì sửa tầng dưới; chưa rõ thì hỏi người dùng.
4. Code trong `apps/`, `tests/`, `.github/workflows/` chỉ viết khi người dùng yêu cầu rõ (giảng viên cấm vibecoding). Nhóm phải giải thích được từng dòng.
5. Sơ đồ: render bằng PlantUML thật (`java -jar plantuml-1.2026.8.jar -charset UTF-8 -tsvg`, thêm `-Playout=smetana` nếu không có Graphviz), lưu cả `.puml` và `.svg`. Không dùng `docs/render_svg.py`. Sửa `.puml` bằng Edit/Write, không dùng heredoc của bash (heredoc làm mất `\`).
6. **Cổng kiểm chạy trên nội dung đã stage hoặc đã commit.** `git grep` và `git diff` bỏ qua file untracked, nên chạy `git add <allowed paths>` trước, rồi dùng `git grep --cached`, `git diff --cached --check`, `git diff --cached --name-only origin/develop-Assignment2`.
7. Commit message tiếng Anh, không có trailer `Co-Authored-By`. Không push lên `develop-Assignment2`, không force push.
8. Trước khi báo xong: chạy mọi lệnh kiểm trong card; ghi `report-task<N>.md` vào thư mục này: hash commit, file đổi, output từng lệnh kiểm, rủi ro.

## 5. Skill nên dùng

- `superpowers:executing-plans`: làm card theo từng bước có checkbox.
- `superpowers:verification-before-completion`: chạy lại lệnh kiểm và đọc output trước khi báo xong.
- `uml`: sửa `.puml` (Task 3).
- `resolving-merge-conflicts`: khi `git pull origin develop-Assignment2` báo xung đột (Task 4, Task 5).
- `mattpocock-skills:tdd`: sửa code thanh toán (Task 5, CR-5.1, CR-5.2), khi người dùng đã yêu cầu viết code.
- `mattpocock-skills:pr`: viết mô tả PR.
- `wizard`: các bước chỉ người làm được, như tạo service trên Render/Vercel và nhập secret GitHub (Task 5, CR-5.3).

## 6. Việc mở ngoài các card

- `a2/task-1-requirements` có 3 commit chưa có PR (`89d3276`, `bbd6d80`, `1bab022`: thay `use-case-overview.svg` bằng bản xuất draw.io, sửa ghi chú UC-04). Chủ Task 1 quyết định mở PR hay bỏ; nếu mở thì chạy `python docs/validate_task2.py` trên branch đó trước.
- Branch protection (AC-N17.2) là việc của chủ repo.

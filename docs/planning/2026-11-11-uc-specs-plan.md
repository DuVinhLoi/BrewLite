# Plan: đặc tả các use-case còn thiếu so với use-case tổng quát (2026-11-11)

## 1. Mục tiêu

`docs/requirements/use-case-overview.puml` có 9 use-case cấp cao. Hiện mới có đặc tả cho UC-04 (`uc-checkout.md`, use-case trọng tâm theo đề A2 §3.3) và UC-10 (`uc-inventory.md`). Đợt này soạn nháp đặc tả cho 7 use-case còn lại: UC-01, UC-02, UC-03, UC-05, UC-06, UC-07, UC-09.

Đây là tài liệu Task 1, agent được soạn nháp (`.claude/rules/doc-code-sync.md`). Không viết code. Nhóm đọc lại, sửa và chốt trước khi nộp.

## 2. Quyết định đã chốt với người dùng

- **Folder:** 7 đặc tả mới nằm trong `docs/requirements/use-cases/`. `uc-checkout.*` và `uc-inventory.md` giữ nguyên chỗ cũ để không gãy link.
- **Độ sâu:** mức vừa, cùng khung với UC-04 (8 mục, khoảng 80–150 dòng), mỗi UC có `.md` + `.puml` + `.svg`.
- **Nguồn sự thật:** `docs/requirements/srs.md` bản trên `origin/main`. Code lệch SRS thì ghi vào report, không sửa code, không sửa SRS.
- **Sơ đồ:** nhãn use-case chỉ ghi mã và tên, không ghi mã FR, theo `use-case-overview.puml` hiện tại (SRS mục 2.2).
- **UC-05:** actor chính là Customer; quyền xem đơn của Barista (AC-F22.1) ghi thành luồng thay thế, không vẽ thêm đường nối.
- **Thuật ngữ ngoài SRS** (ví dụ `canOrder` của `uc-inventory.md`) được dùng nếu ghi nguồn.
- **Report** `report-<X>.md` được commit cùng card.
- **Một nhánh, một worktree:** nhánh `a2/uc-specs`, worktree `.worktrees/uc-specs`, đặt trên `origin/main` tại `213d7bb` (merge PR #35, 2026-11-08). Nhánh ban đầu tạo từ `main` local cũ (`5f09264`, thua `origin/main` 47 commit) nên đã rebase; trước khi giao việc phải `git fetch origin` và kiểm `git rev-list --count HEAD..origin/main` ra 0. Đây là ngoại lệ so với "mỗi card một worktree" của `.claude/rules/multi-agent-workflow.md`. Điều kiện để an toàn: mỗi file chỉ một card tạo, worker không chạy lệnh git làm đổi repo, mọi commit do Integrator làm.

## 3. Tạo phẩm

```text
docs/requirements/
├── uc-checkout.md/.puml/.svg        (UC-04, giữ nguyên)
├── uc-inventory.md                  (UC-10, giữ nguyên)
└── use-cases/
    ├── README.md                    (Integrator)
    ├── uc-01-menu.md/.puml/.svg             (Card B)
    ├── uc-02-cart.md/.puml/.svg             (Card B)
    ├── uc-03-login.md/.puml/.svg            (Card A)
    ├── uc-05-order-history.md/.puml/.svg    (Card A)
    ├── uc-06-cancel-order.md/.puml/.svg     (Card C)
    ├── uc-07-order-status.md/.puml/.svg     (Card C)
    └── uc-09-register.md/.puml/.svg         (Card A)
```

Worker tạo `.md` và `.puml`. Integrator render `.svg`.

## 4. Task cho sub-agent

Quy tắc chung, khung file, mẫu `.puml` và lệnh acceptance: [`handoff/2026-11-11-uc-specs/README.md`](handoff/2026-11-11-uc-specs/README.md).

| Task | Card | Use-case | Độ phức tạp | Model gợi ý |
|---|---|---|---|---|
| T-A | [`card-A.md`](handoff/2026-11-11-uc-specs/card-A.md) | UC-03, UC-09, UC-05 | Đơn giản: luồng thẳng, ít nhánh | `sonnet` |
| T-B | [`card-B.md`](handoff/2026-11-11-uc-specs/card-B.md) | UC-01, UC-02 | Trung bình: khả năng bán theo nguyên liệu (AC-F01.3, AC-F04.4, AC-F05.4, SRS mục 3.5a), ba trạng thái giao diện | `sonnet` |
| T-C | [`card-C.md`](handoff/2026-11-11-uc-specs/card-C.md) | UC-06, UC-07 | Phức tạp: máy trạng thái (SRS mục 3.6), nhả giữ chỗ, đối soát VNPay trước khi hủy | `sonnet` (hoặc `opus` nếu người dùng yêu cầu) |

Ba task không chung file nên chạy song song được. Prompt giao việc, thay `<X>` bằng A, B hoặc C:

```text
Bạn là Worker của Card <X> trong plan docs/planning/2026-11-11-uc-specs-plan.md.
Thư mục làm việc: E:\CNPM\BrewLite\.worktrees\uc-specs (nhánh a2/uc-specs, dùng chung với hai worker khác).
Đọc docs/planning/handoff/2026-11-11-uc-specs/README.md rồi card-<X>.md, làm đúng các bước trong card.
Chỉ tạo file trong allowed paths của card. Không sửa code, không sửa file của card khác.
Không chạy lệnh git làm đổi repo (add, commit, stash, checkout, reset, push...).
Xong thì ghi report-<X>.md và trả về DONE / DONE_WITH_CONCERNS / BLOCKED / NEEDS_CONTEXT.
```

## 5. Việc của Integrator (sau khi cả ba task báo xong)

- [ ] **I1.** Với từng card: đọc report; kiểm `git status --porcelain` chỉ có file trong allowed paths; đọc từng đặc tả đối chiếu SRS (mã FR, AC, mã lỗi, tên trạng thái, endpoint) và đối chiếu quan hệ actor với `use-case-overview.puml`. Sai thì trả card về worker, tối đa 3 vòng.
- [ ] **I2.** Commit từng card (file đặc tả và `report-<X>.md`) bằng message ghi ở bước cuối của card, không có trailer `Co-Authored-By`.
- [ ] **I3.** Render 7 file `.puml` ra `.svg` bằng PlantUML 1.2026.8 (lệnh mẫu ở `docs/diagrams/README.md`; đường dẫn jar do người dùng cung cấp), kiểm không có "Syntax Error", chép `.svg` vào `use-cases/`.
- [ ] **I4.** Viết `docs/requirements/use-cases/README.md`: mục lục 9 use-case, ghi UC-04 là trọng tâm và dẫn về `../uc-checkout.md`, `../uc-inventory.md`.
- [ ] **I5.** Cập nhật bảng ở `docs/requirements/README.md` và thêm một dòng dẫn link ở `docs/requirements/srs.md` mục 2.3. Không đổi nội dung yêu cầu nào.
- [ ] **I6.** Commit I3–I5: `docs(requirements): index use-case specifications and render diagrams`.
- [ ] **I7.** Tổng hợp cho người dùng các chỗ code lệch SRS và các điểm SRS còn mơ hồ lấy từ ba report.

Push và merge vào `main` chỉ làm khi người dùng đồng ý.

## 6. Xong khi

- Đủ 7 bộ `.md` + `.puml` + `.svg` và `use-cases/README.md`.
- Mọi AC của FR-01 đến FR-10 và FR-20 đến FR-25 xuất hiện trong mục 8 của ít nhất một đặc tả.
- Mọi `.puml` render được; `git diff --check origin/main...HEAD` sạch; link tương đối trỏ tới file tồn tại.
- `uc-checkout.*`, `uc-inventory.md`, `apps/`, `tests/` không đổi so với `origin/main`: `git diff --name-only origin/main...HEAD -- docs/requirements/uc-checkout.md docs/requirements/uc-checkout.puml docs/requirements/uc-checkout.svg docs/requirements/uc-inventory.md apps tests` ra 0 dòng. Không so với `main` local, vì nó còn ở `5f09264` và sẽ báo sai.

## 7. Việc còn mở

- **PlantUML jar:** máy có Java 24 nhưng không có jar (đường dẫn cũ `Temp/opencode/puml/plantuml.jar` không còn). Người dùng cần cung cấp đường dẫn `plantuml-1.2026.8.jar` trước bước I3; cho tới lúc đó tiêu chí "mọi `.puml` render được" chưa kiểm được và worker ghi "chưa render".

## 8. Lịch sử sửa plan

- 2026-11-11, sau review: rebase lên `origin/main` (`213d7bb`); sửa actor UC-06 (thêm VNPay sandbox), bỏ mã FR khỏi mẫu `.puml`, bỏ mục "quyền hủy của Barista còn mở" vì PR #31 đã merge và AC-F24.3 đã chốt 403; sửa phần FR-29 của Card B, cách xử lý Barista ở UC-05, lệnh acceptance 3 và quy định commit report.

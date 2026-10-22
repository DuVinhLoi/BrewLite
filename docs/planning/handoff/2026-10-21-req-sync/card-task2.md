# Card Task 2: đồng bộ branch sơ đồ với `develop-Assignment2`

> Chỉ mục: [`README.md`](README.md). Branch: `a2/task-2-diagrams`. PR #11 đã sửa class, sequence, activity diagram theo D1, D2, C1 và render lại bằng PlantUML, nên đợt 1 không có việc sửa sơ đồ.

**Allowed paths:**
- Đợt 1 (T2-1..T2-4): chỉ tạo `docs/planning/handoff/2026-10-21-req-sync/report-task2.md`.
- Đợt 4 (T2-M, PR riêng): `docs/traceability-matrix.md`, chỉ cột Thiết kế/Sơ đồ, chỉ phần "chờ Task 2".

## Đợt 1: bước bắt buộc

- [ ] **T2-1.** `git switch a2/task-2-diagrams && git pull origin develop-Assignment2`. Kết quả mong đợi: merge không xung đột (đã thử `git merge-tree` với `develop-Assignment2` @ `040dd25`: 0 xung đột).
- [ ] **T2-2.** `python docs/validate_task2.py` in `All static checks PASSED` (đã chạy thử trên cây merge: PASS).
- [ ] **T2-3.** `java -jar <đường dẫn>/plantuml-1.2026.8.jar -charset UTF-8 -checkonly docs/diagrams/*.puml`: không có lỗi.
- [ ] **T2-4.** Ghi `report-task2.md`: hash HEAD sau khi pull, output T2-2 và T2-3. Commit `docs(planning): add Task 2 sync report`.

## Đợt 4: T2-M, điền ô "chờ Task 2" (PR riêng)

Bắt đầu khi PR Task 5 đã merge (README mục 2). Branch mới `a2/task-2-matrix` từ `origin/develop-Assignment2`.

- [ ] **T2-M1.** Liệt kê ô cần điền: `awk -F'|' '/^\| (FR|NFR)-/{ if($4 ~ /chờ Task 2/) print $2 }' docs/traceability-matrix.md`. Tại `develop-Assignment2` @ `040dd25` có 25 ô; ghi số thực tế vào report.
- [ ] **T2-M2.** Thay phần "chờ Task 2 (…)" bằng mã sơ đồ và phần tử cụ thể: `Activity-01` (nhánh), `Sequence-01` (bước, fragment `alt`/`opt`, T1/T2), `Class-01` (lớp và thuộc tính, ví dụ `Product.description` cho FR-01–03), `State-01` (chuyển trạng thái). Mỗi mã phải trỏ tới phần tử có thật trong `docs/diagrams/*.puml`.
- [ ] **T2-M3.** Ô NFR-05 và NFR-13 có cả "chờ Task 2" và "chờ Task 3": chỉ thay phần Task 2, giữ nguyên phần "chờ Task 3" cho B10 của Task 3.
- [ ] **T2-M4.** Kiểm: `git add docs/traceability-matrix.md`; `git diff --cached --check`; `python docs/validate_task2.py` PASS; lệnh ở T2-M1 ra 0 dòng; `git diff --cached --name-only origin/develop-Assignment2` chỉ có `docs/traceability-matrix.md`.
- [ ] **T2-M5.** Commit `docs(traceability): fill Task 2 design column`, ghi kết quả vào `report-task2.md` trên branch này, mở PR. PR này merge **trước** B10 của Task 3.

## Việc tùy chọn (PR riêng, chỉ sau đợt 2)

Plan cũ `docs/planning/2026-10-21-sequence-checkout-minimum.md` đã bị revert (commit `556560e`), vì nó giữ E8b và so replay theo body. Muốn rút gọn `sequence-checkout.puml` thì viết plan mới dựa trên bản hiện tại. Các ý còn dùng được:

- tách riêng 401 (E1a/E1b), 403 sai vai trò (AC-F11.4, AC-F14.4) và 400 (E6);
- truy vấn DB trước khi trả 404 `PRODUCT_NOT_FOUND`;
- dùng `break` để rút gọn sơ đồ.

Plan mới phải giữ D2, C1, C3: so chủ đơn/`orderId`/key/`paymentMethod`, không có nhánh phục hồi E8b, không có 502/422. `python docs/validate_task2.py` vẫn phải PASS.

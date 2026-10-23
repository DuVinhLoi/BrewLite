# Report Task 2 - đồng bộ branch sơ đồ với develop-Assignment2

Ngày: **2026-10-23**. Kết quả: **DONE** - hoàn tất Đợt 1 (T2-1 đến T2-4); không sửa sơ đồ.

## Task và commit

- Card: [card-task2.md](card-task2.md), nguồn trên `develop-Assignment2`.
- Task ID: **T2-1 đến T2-4**. Branch: `a2/task-2-diagrams`. Worktree: `E:\CNPM\BrewLite\.worktrees\task2`.
- HEAD trước đồng bộ: `556560e6747959d8be1bfe70f3feda310da00d1d`.
- Base đã pull: `develop-Assignment2` tại `f92b188147ad65c0528d53fa418eb1e6c92c6520` (card ghi `040dd25`; base đã có thêm PR #13, #18, #19 và #9).
- HEAD sau khi pull (merge commit): `e17830989c9f8bbae857977cbe9a59c987810ab4`, message mặc định của Git, không có trailer `Co-Authored-By`.
- Commit báo cáo: `docs(planning): add Task 2 sync report`.

## Việc đã làm

- [x] **T2-1:** `git pull --no-edit origin develop-Assignment2` trên `a2/task-2-diagrams`: merge không xung đột.
- [x] **T2-2:** `python docs/validate_task2.py`: exit 0, 35 dòng `PASS`, 0 dòng `FAIL`.
- [x] **T2-3:** `java -jar plantuml-1.2026.8.jar -charset UTF-8 -checkonly docs/diagrams/*.puml` (PlantUML 1.2026.8): exit 0, không có lỗi cho 4 file `activity-checkout`, `class-domain`, `sequence-checkout`, `state-order`.
- [x] **T2-4:** ghi báo cáo này.

## Output

```text
$ python docs/validate_task2.py
...
PASS sequence: balanced alt/opt/group/end fragments

All static checks PASSED. Run PlantUML -checkonly before PR merge.

$ java -jar plantuml-1.2026.8.jar -charset UTF-8 -checkonly docs/diagrams/*.puml
(không có output)  exit=0
```

## Ghi chú cho Đợt 4 (T2-M)

- Tại `f92b188`, lệnh awk ở T2-M1 vẫn ra **25** ô "chờ Task 2"; NFR-05 và NFR-13 vẫn có cả "chờ Task 2" và "chờ Task 3".
- Dòng quy ước `docs/traceability-matrix.md` mục "Mã sơ đồ dự kiến" và câu "Cột thiết kế cần rà soát" ở đầu file sẽ lỗi thời sau T2-M, nhưng nằm ngoài cột Thiết kế; cần Integrator nới phạm vi hoặc nhận change request.
- Đợt 4 chưa bắt đầu được: PR Task 5 chưa merge vào `develop-Assignment2`.

## Rủi ro

- Merge commit và commit báo cáo mới ở local, chưa push. Push và mở PR do người dùng/Integrator quyết định.

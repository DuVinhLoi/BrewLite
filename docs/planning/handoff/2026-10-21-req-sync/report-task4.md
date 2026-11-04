# Report Task 4 - đồng bộ yêu cầu sau PR #11

Ngày: **2026-10-22**. Kết quả: **DONE_WITH_CONCERNS** - hoàn tất CR-task4; nghiệm thu/merge Task 4 vẫn chờ điều kiện bên dưới.

## Task và commit

- Card: [CR-task4.md](CR-task4.md), nguồn trên `develop-Assignment2` sau PR #13.
- Task ID: **T4-1 đến T4-4 / CR-4.1 đến CR-4.3**. Người thực hiện: agent được người dùng giao Task 4.
- Branch: `a2/Task4`, [PR #9](https://github.com/DuVinhLoi/BrewLite/pull/9).
- Worktree: `C:\Users\baoth\OneDrive\Desktop\New folder\BrewLite`.
- HEAD trước đồng bộ: `dd94220775e959e581c52bc95da6d457d7204757`.
- Base đã pull: `develop-Assignment2` tại `30a7a9d2554b198a0f5592c0eef1c73698ab684c` (chứa PR #11, #12, #13 và #18).
- Merge commit đã push và kiểm CI: `3ea4056b5c2e3c333eee600506388b574fe48b02`.
- Message merge dùng mặc định Git: `Merge branch 'develop-Assignment2' of https://github.com/DuVinhLoi/BrewLite into a2/Task4`.
- Commit báo cáo theo card: `docs(planning): add Task 4 sync report`; hash tra bằng `git log -1 --format=%H -- docs/planning/handoff/2026-10-21-req-sync/report-task4.md` sau commit.

## Việc đã làm và phạm vi

- [x] **T4-1:** chuyển từ `thien35` sang `a2/Task4`, chạy `git pull origin develop-Assignment2`. Các file untracked ban đầu là env/build output, không trùng file được checkout; không xóa hoặc ghi đè chúng.
- [x] **T4-2 / CR-4.1:** chỉ có xung đột ở ma trận, khối NFR-15 đến NFR-18. Giữ nguyên NFR-15 và NFR-18 từ base; giữ nguyên NFR-16 và NFR-17 từ Task 4, bao gồm đường dẫn seed/migration và minh chứng CI #9/#10.
- [x] **CR-4.2:** thay đúng đoạn cuối `apps/api/README.md` về simulator không lưu trạng thái, replay theo chủ đơn/orderId/key/paymentMethod và health check theo DB.
- [x] **CR-4.3:** bỏ câu ngưỡng loading 200 ms tại dòng FR-02, giữ các mã/đường dẫn test.
- [x] **T4-3:** chạy kiểm sau merge commit; kết quả ở phần dưới. PR #9 có CI xanh trên đúng merge commit.
- [x] **T4-4:** ghi báo cáo này và bàn giao qua commit/push nhánh Task 4; PR giữ draft.
- [x] **T4-5:** giữ thứ tự merge, không merge PR #9 hoặc push vào base.

| File tự chỉnh trong CR | Nội dung |
|---|---|
| `docs/traceability-matrix.md` | FR-02 và giải xung đột NFR-15..18 theo card |
| `apps/api/README.md` | Đoạn phạm vi Task 5 ở dòng 35 |
| `docs/planning/handoff/2026-10-21-req-sync/report-task4.md` | Báo cáo, output kiểm và giới hạn |

Các thay đổi khác từ Task 1/2 và thư mục handoff đi vào qua merge các commit đã có trên base, không chép hoặc sửa riêng. Trong ma trận, FR-16 và NFR-13 nhận tự động bản sửa của PR #11. Không tự sửa cột thiết kế FR-01 đến FR-03 (T2-M) hoặc nhật ký lịch sử `docs/checkpoints/2026-10-19-task4.md`.

## Output các cổng local (chạy sau merge commit)

Python được gọi bằng interpreter cài sẵn `C:\Users\baoth\AppData\Local\Programs\Python\Python310\python.exe`, tương đương lệnh trong card; không cài dependency hoặc đổi validator.

### `git diff --check origin/develop-Assignment2...HEAD`

```text
(không có output)
```

Exit code: **0**.

### `python docs/validate_task2.py`

```text
PASS activity-checkout: source .puml + image .svg
PASS activity-checkout: PlantUML boundary markers
PASS activity-checkout: SVG valid XML rendered by PlantUML
PASS state-order: source .puml + image .svg
PASS state-order: PlantUML boundary markers
PASS state-order: SVG valid XML rendered by PlantUML
PASS sequence-checkout: source .puml + image .svg
PASS sequence-checkout: PlantUML boundary markers
PASS sequence-checkout: SVG valid XML rendered by PlantUML
PASS class-domain: source .puml + image .svg
PASS class-domain: PlantUML boundary markers
PASS class-domain: SVG valid XML rendered by PlantUML
PASS User: minimum properties
PASS Product: minimum properties
PASS Order: minimum properties
PASS OrderItem: minimum properties
PASS Payment: minimum properties
PASS Promotion: minimum properties
PASS LoyaltyTransaction: minimum properties
PASS Role: exact values
PASS OrderStatus: exact values
PASS PaymentMethod: exact values
PASS PaymentStatus: exact values
PASS LoyaltyType: exact values
PASS class diagram: 7 associations & multiplicities
PASS state machine: exactly eight business transitions
PASS state machine: PAID -> CANCELLED is forbidden
PASS activity: all four swimlanes
PASS activity: start and explicit terminal nodes for failures
PASS activity: E1/E2/E3 explicit
PASS activity: balanced if/endif, note blocks
PASS sequence: all five required lifelines
PASS sequence: calls, JWT, idempotency header
PASS sequence: T1/T2, replay, retry same order
PASS sequence: balanced alt/opt/group/end fragments

All static checks PASSED. Run PlantUML -checkonly before PR merge.
```

Exit code: **0**.

### `git grep -n -E "<<<<<<<|>>>>>>>|AC-F16\.7|AC-N15\.3|200 ms|version./SHA|đúng SHA|SHA bản trước" -- apps README.md docs/traceability-matrix.md`

```text
(không có output)
```

Exit code: **1**. Với `git grep`, exit 1 nghĩa là không tìm thấy dòng khớp; đúng yêu cầu 0 dòng.

## CI của PR #9

- Run: [39786057372](https://github.com/DuVinhLoi/BrewLite/actions/runs/39786057372).
- Job: [ci](https://github.com/DuVinhLoi/BrewLite/actions/runs/39786057372/job/119849449055).
- Event: `pull_request`; head SHA: `3ea4056b5c2e3c333eee600506388b574fe48b02`.
- Status: `completed`; conclusion: **success**.
- PR tại lúc kiểm: open, draft, `merged: false`, `mergeable: true`.

| Gate | Kết quả |
|---|---|
| Install | success |
| Lint | success |
| Unit Test | success |
| Build | success |

## Kiểm phạm vi bổ sung

- So sánh toàn bộ `apps/` và `.github/workflows/` giữa `dd94220` và merge commit: chỉ `apps/api/README.md` đổi. Không đổi source, test, dependency, Prisma schema, migration hoặc workflow.
- NFR-15/18 so nguyên dòng với base: khớp; NFR-16/17 so nguyên dòng với Task 4 trước merge: khớp.
- Cột thiết kế FR-01/02/03 và nhật ký lịch sử so với Task 4 trước merge: không đổi.
- `git diff --cached --check` trước merge commit: exit 0. Link tương đối trong các tài liệu tự chỉnh trỏ đến file tồn tại.

## Giới hạn và bước tiếp theo

- Không merge PR. [PR Task 3 #19](https://github.com/DuVinhLoi/BrewLite/pull/19) vẫn open lúc kiểm; Integrator cần merge Task 3 trước PR #9 theo card và đề A2 §1.
- Branch protection/required check `ci` (AC-N17.2) vẫn là phần việc chủ repo; CR này không cấu hình quyền hoặc đổi visibility.
- Validator chỉ là kiểm tĩnh, không thay PlantUML `-checkonly`. Không sửa sơ đồ trong CR; sơ đồ đi vào từ base và kiểm tĩnh đã pass.
- Tài liệu minh chứng/checkpoint lịch sử giữ nguyên dù có nhắc yêu cầu cũ; không dùng phần lịch sử đó làm yêu cầu hiện hành.
- Commit bổ sung báo cáo chỉ đổi file báo cáo; CI trên head sau commit báo cáo được kiểm riêng khi bàn giao.

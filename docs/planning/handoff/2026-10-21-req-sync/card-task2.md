# Card Task 2: đồng bộ branch sơ đồ với develop

> Chỉ mục: [`README.md`](README.md). Branch: `a2/task-2-diagrams`. Không có việc sửa sơ đồ bắt buộc: PR #11 đã sửa class, sequence, activity diagram theo D1, D2, C1 và render lại bằng PlantUML.

**Allowed paths:** không sửa file nào trong bước bắt buộc.

## Bước bắt buộc

- [ ] **T2-1.** `git switch a2/task-2-diagrams && git pull origin develop-Assignment2`. Kết quả mong đợi: fast-forward hoặc merge không có xung đột (đã thử bằng `git merge-tree`: 0 xung đột).
- [ ] **T2-2.** Chạy `python docs/validate_task2.py`. Phải in `All static checks PASSED`.
- [ ] **T2-3.** Chạy `java -jar <đường dẫn>/plantuml-1.2026.8.jar -charset UTF-8 -checkonly docs/diagrams/*.puml`. Không có lỗi.
- [ ] **T2-4.** Ghi `report-task2.md` vào thư mục này: hash HEAD sau khi pull, kết quả T2-2 và T2-3.

## Việc tùy chọn (PR riêng, chỉ sau đợt 2 của README)

Plan cũ `docs/planning/2026-10-21-sequence-checkout-minimum.md` đã bị revert (commit `556560e`), vì nó giữ E8b và so replay theo body. Nếu vẫn muốn rút gọn `sequence-checkout.puml`, viết plan mới dựa trên bản hiện tại. Các ý còn dùng được:

- tách riêng 401 (E1a/E1b), 403 sai vai trò (AC-F11.4, AC-F14.4) và 400 (E6);
- truy vấn DB trước khi trả 404 `PRODUCT_NOT_FOUND`;
- dùng `break` để rút gọn sơ đồ.

Plan mới phải giữ D2 và C1: so chủ đơn/`orderId`/key/`paymentMethod`, không có nhánh phục hồi E8b. `python docs/validate_task2.py` vẫn phải PASS.

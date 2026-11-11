# Card B: UC-01 Xem menu và chi tiết món, UC-02 Quản lý giỏ hàng (trung bình)

> Chỉ mục và quy tắc chung: [`README.md`](README.md). Đọc README trước, rồi `.claude/rules/doc-code-sync.md` và mục "Worker phải tuân" của `.claude/rules/multi-agent-workflow.md`.

**Branch:** `a2/uc-b-menu-cart` · **Worktree:** `.worktrees/uc-b` · **Base:** `a2/uc-specs`

**Allowed paths (chỉ tạo mới):**

- `docs/requirements/use-cases/uc-01-menu.md`, `uc-01-menu.puml`
- `docs/requirements/use-cases/uc-02-cart.md`, `uc-02-cart.puml`
- `docs/planning/handoff/2026-11-11-uc-specs/report-B.md`

## Đầu vào phải đọc

- `docs/requirements/srs.md`: mục 2.1, 2.3, 3.1–3.3, 3.5 (BR, nhất là BR-01, BR-02), 3.5a (kho nguyên liệu và thuật ngữ), mục 5.1–5.3 (FR-01 đến FR-07), mục 5.10 (FR-29, phần số ly còn bán), NFR-02, NFR-09, NFR-11.
- `docs/requirements/uc-inventory.md`: bước 5 (cách tính số ly, `canOrder` của cả giỏ) để dẫn chiếu.
- `docs/requirements/uc-checkout.md`: trigger và tiền điều kiện 2 (giỏ hợp lệ) để UC-02 nối đúng sang UC-04.
- `docs/requirements/use-case-overview.puml`.
- Code để đối chiếu: `apps/api/src/catalog/`, phần tính khả năng bán trong `apps/api/src/inventory/`, các trang menu, chi tiết món, giỏ hàng trong `apps/web/src/app/` và phần lưu giỏ trong `apps/web/src/lib/`.

## Nội dung từng use-case

- **UC-01 Xem menu và chi tiết món (size, topping)** — FR-01 đến FR-04; AC-F01.x, AC-F02.x, AC-F03.x, AC-F04.x. Phần số ly còn bán dẫn FR-29 (chỉ các AC nói về hiển thị cho khách).
  - Actor: Guest (Customer kế thừa Guest, vẽ mũi tên kế thừa như overview).
  - Luồng chính đi từ mở menu, xem danh sách, mở chi tiết một món, chọn size và topping, thấy giá cập nhật.
  - Luồng thay thế cần có: menu rỗng (empty), món hết khả năng bán (số ly = 0, không đặt được).
  - Ngoại lệ cần có: lỗi tải menu (error, có nút thử lại nếu SRS nêu), ID món không tồn tại, lựa chọn size/topping không hợp lệ.
  - Ba trạng thái loading / empty / error của FR-02 phải hiện rõ trong luồng (đề A2 §6.3).
- **UC-02 Quản lý giỏ hàng** — FR-05, FR-06, FR-07; AC-F05.1 đến .5, AC-F06.1 đến .3, AC-F07.1 đến .3.
  - Actor: Guest (giỏ dùng được khi chưa đăng nhập). Nêu rõ giỏ lưu ở đâu **theo SRS**.
  - Luồng chính: thêm món đã chọn size/topping vào giỏ, xem giỏ, sửa số lượng, xóa dòng, thấy tổng tiền.
  - Luồng thay thế cần có: thêm món trùng cấu hình (gộp dòng hay tách dòng, theo SRS), giỏ rỗng.
  - Ngoại lệ cần có: vượt giới hạn BR-02 (số lượng 1–99, tối đa 20 dòng), cả giỏ không đủ nguyên liệu (`canOrder = false`, dẫn FR-29 và UC-10 bước 5).
  - Ghi rõ tổng tiền trong giỏ chỉ để hiển thị; giá chính thức do máy chủ tính ở UC-04 (BR-01).
  - Hậu điều kiện nối sang UC-04: bấm "Thanh toán" là trigger của UC-04, không đặc tả tiếp ở đây.
  - Sơ đồ: có thể vẽ UC-01 và UC-04 như use-case liên quan, nhưng chỉ dùng `<<include>>` / `<<extend>>` nếu overview hoặc SRS mục 2 có quan hệ đó; nếu không thì để liên kết thường hoặc ghi chú.

## Các bước

- [ ] **B0.** `git branch --show-current` ra `a2/uc-b-menu-cart`; `git status --porcelain` sạch.
- [ ] **B1.** Đọc đầu vào. Lập danh sách AC của FR-01 đến FR-07 và các AC của FR-29 liên quan tới khách.
- [ ] **B2.** Viết hai file `.puml` theo mẫu trong README.
- [ ] **B3.** Viết hai file `.md` theo khung 8 mục trong README.
- [ ] **B4.** Đối chiếu code, ghi chỗ lệch.
- [ ] **B5.** Chạy các lệnh acceptance trong README.
- [ ] **B6.** `git add docs/requirements/use-cases docs/planning/handoff/2026-11-11-uc-specs/report-B.md` rồi commit: `docs(requirements): add UC-01 and UC-02 specifications`. Không có trailer `Co-Authored-By`.

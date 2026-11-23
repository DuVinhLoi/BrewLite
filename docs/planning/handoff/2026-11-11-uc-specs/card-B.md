# Card B: UC-01 Xem menu và chi tiết món, UC-02 Quản lý giỏ hàng (trung bình)

> Plan: [`../../2026-11-11-uc-specs-plan.md`](../../2026-11-11-uc-specs-plan.md). Quy tắc chung, khung file và lệnh acceptance: [`README.md`](README.md). Đọc README trước, rồi `.claude/rules/doc-code-sync.md`.

**Branch:** `a2/uc-specs` · **Worktree:** `.worktrees/uc-specs` (dùng chung với các card khác, xem README mục "Một nhánh, một worktree")

**Allowed paths (chỉ tạo mới):**

- `docs/requirements/use-cases/uc-01-menu.md`, `uc-01-menu.puml`
- `docs/requirements/use-cases/uc-02-cart.md`, `uc-02-cart.puml`
- `docs/planning/handoff/2026-11-11-uc-specs/report-B.md`

## Đầu vào phải đọc

- `docs/requirements/srs.md`: mục 2.1, 2.3, 3.1–3.3, 3.5 (BR-01, BR-02), **3.5a (kho nguyên liệu, cách khách thấy giới hạn số lượng)**, mục 5.1–5.3 (FR-01 đến FR-07), NFR-02, NFR-09, NFR-11.
- `docs/requirements/uc-inventory.md`: phần tính khả năng bán và kiểm cả giỏ, để dẫn chiếu.
- `docs/requirements/uc-checkout.md`: trigger và tiền điều kiện về giỏ hợp lệ, để UC-02 nối đúng sang UC-04.
- `docs/requirements/use-case-overview.puml`.
- Code để đối chiếu: `apps/api/src/catalog/`, endpoint availability trong `apps/api/src/inventory/`, các trang `apps/web/src/app/page.tsx`, `products`, `cart`, và `apps/web/src/lib/shop.ts`, `stock.ts`, `inventory.ts`.

## Về FR-29 và khả năng bán

Các AC của FR-29 (AC-F29.1 đến .6) chỉ nói về Barista, seed và nghiệm thu, **không** thuộc hai use-case này. Phần khách nhìn thấy nằm ở **AC-F01.3, AC-F04.4, AC-F05.4 và SRS mục 3.5a**; chỉ dẫn các nguồn đó. Hai điểm dễ viết sai:

- Menu chỉ hiện nhãn "Hết hàng" hoặc "Còn hàng" theo `stock`; **không hiển thị số ly** (AC-F01.3). Khách chỉ thấy giới hạn qua ô số lượng (mục 3.5a).
- `stock` trong `GET /products` là ước tính cho size S không topping, không phải trần cho M/L/topping; trang chi tiết và giỏ kiểm bằng `POST /inventory/availability`.

Từ `canOrder` không có trong `srs.md`, chỉ có trong `uc-inventory.md`. Nếu dùng thì ghi nguồn kèm link (quy tắc chung 2 của README), hoặc diễn đạt theo lời AC-F05.4.

## Nội dung từng use-case

- **UC-01 Xem menu và chi tiết món (size, topping)** — FR-01 đến FR-04; AC-F01.1 đến .3, AC-F02.1 đến .3, AC-F03.1 đến .3, AC-F04.1 đến .4.
  - Actor: Guest; Customer kế thừa Guest (vẽ `Guest <|- Customer` như overview). Không cần đăng nhập.
  - Luồng chính: mở menu, thấy lưới thẻ món (hình, tên, giá, nhãn còn hàng), mở chi tiết một món, size mặc định `M`, chọn size và topping, giá cập nhật ngay.
  - Ba trạng thái loading / empty / error của FR-02 phải hiện rõ trong luồng, kèm đúng câu thông báo của AC-F02.2 và AC-F02.3 (đề A2 §6.3).
  - Luồng thay thế cần có: menu rỗng; món có nhãn "Hết hàng"; đổi size/topping làm lựa chọn không đủ nguyên liệu thì khóa nút "Thêm vào giỏ" (AC-F04.4).
  - Ngoại lệ cần có: lỗi tải menu và nút "Thử lại"; `id` món không tồn tại (404 `PRODUCT_NOT_FOUND`, giao diện "Không tìm thấy sản phẩm"); phản hồi availability cũ về muộn không được ghi đè lựa chọn mới.
  - Hậu điều kiện nối sang UC-02: bấm "Thêm vào giỏ" là trigger của UC-02.
- **UC-02 Quản lý giỏ hàng** — FR-05, FR-06, FR-07; AC-F05.1 đến .5, AC-F06.1 đến .3, AC-F07.1 đến .3.
  - Actor: Guest (giỏ dùng được khi chưa đăng nhập, lưu `localStorage`, còn nguyên sau khi tải lại trang hoặc đăng nhập: AC-F05.3).
  - Luồng chính: thêm món đã chọn size/topping/số lượng, xem giỏ, tăng giảm số lượng, xóa dòng, thấy thành tiền từng dòng và tổng.
  - Luồng thay thế cần có: thêm trùng món + size + topping thì gộp dòng, khác thì tạo dòng riêng (AC-F05.2); giảm ở số lượng 1 (AC-F06.2); giỏ rỗng (AC-F06.3).
  - Ngoại lệ cần có: dòng thứ 21 bị từ chối (AC-F05.5, BR-02); số lượng chạm 99 (AC-F06.1); cả giỏ thiếu nguyên liệu hoặc công thức không khả dụng thì không cho tiếp tục checkout, giữ giỏ để sửa (AC-F05.4).
  - Ghi rõ tổng ở giỏ chỉ để hiển thị và phải bằng `Order.total` do server tính (AC-F07.3, BR-01); giá chính thức do máy chủ tính ở UC-04.
  - Hậu điều kiện nối sang UC-04: bấm "Thanh toán" là trigger của UC-04, không đặc tả tiếp ở đây.
  - Sơ đồ: UC-01 và UC-04 có thể xuất hiện như use-case liên quan, nhưng overview và SRS mục 2 **không** có `<<include>>` / `<<extend>>` giữa UC-01, UC-02 và UC-04, nên không vẽ quan hệ đó; dùng ghi chú (`note`) nếu cần nói thứ tự.

## Các bước

- [ ] **B0.** `git branch --show-current` ra `a2/uc-specs`. Không chạy lệnh git nào làm đổi repo.
- [ ] **B1.** Đọc đầu vào. Lập danh sách AC của FR-01 đến FR-07.
- [ ] **B2.** Viết hai file `.puml` theo mẫu trong README.
- [ ] **B3.** Viết hai file `.md` theo khung 8 mục trong README.
- [ ] **B4.** Đối chiếu code, ghi chỗ lệch.
- [ ] **B5.** Chạy các lệnh acceptance trong README.
- [ ] **B6.** Ghi `report-B.md` và dừng. **Không `git add`, không commit**: Integrator kiểm rồi commit với message `docs(requirements): add UC-01 and UC-02 specifications`.

# Card C: UC-06 Hủy đơn chưa trả, UC-07 Cập nhật trạng thái đơn (phức tạp)

> Plan: [`../../2026-11-11-uc-specs-plan.md`](../../2026-11-11-uc-specs-plan.md). Quy tắc chung, khung file và lệnh acceptance: [`README.md`](README.md). Đọc README trước, rồi `.claude/rules/doc-code-sync.md`.

**Branch:** `a2/uc-specs` · **Worktree:** `.worktrees/uc-specs` (dùng chung với các card khác, xem README mục "Một nhánh, một worktree")

**Allowed paths (chỉ tạo mới):**

- `docs/requirements/use-cases/uc-06-cancel-order.md`, `uc-06-cancel-order.puml`
- `docs/requirements/use-cases/uc-07-order-status.md`, `uc-07-order-status.puml`
- `docs/planning/handoff/2026-11-11-uc-specs/report-C.md`

## Đầu vào phải đọc

- `docs/requirements/srs.md`: mục 2.1, 2.3, 3.1–3.3, 3.5 (BR, nhất là BR-09, BR-10, BR-11), 3.5a, mục 5.8 (FR-23, FR-24, FR-25), mục 5.9 (FR-26, FR-27 là Won't), AC-F16.9 và AC-F16.10 (đối soát payment quá hạn trước khi hủy), FR-29 (nhả giữ chỗ theo snapshot), NFR-05, NFR-13.
- `docs/diagrams/state-order.puml`: mọi chuyển trạng thái trong hai đặc tả phải khớp sơ đồ này.
- `docs/requirements/uc-checkout.md`: luồng A5 (hủy bị chặn), E11 (payment quá hạn), E12 (tiền về sau trạng thái cuối) và bảng hậu điều kiện thất bại. Dẫn chiếu, không chép lại.
- `docs/requirements/uc-inventory.md`: bước 6 (hủy thì nhả đúng phần trong snapshot).
- `docs/requirements/use-case-overview.puml`, `docs/requirements/uc-checkout.puml` (UC-06 đã xuất hiện ở đó).
- Code để đối chiếu: phần `PATCH /orders/:id` và state machine trong `apps/api/src/checkout/`, phần đối soát trong `apps/api/src/payment/`, phần nhả giữ chỗ trong `apps/api/src/inventory/`, nút hủy đơn trong `apps/web/src/app/`.

## Nội dung từng use-case

- **UC-06 Hủy đơn chưa trả** — FR-25 (Must); AC-F25.1 đến .4. FR-26 (hủy đơn đã trả, hoàn tiền) là Won't: nêu trong mục "không làm", không đặc tả luồng.
  - Actor: Customer (chủ đơn). Overview chỉ nối Customer với UC-06; Barista không tham gia phần Must.
  - Luồng chính: Customer mở đơn `PENDING` hoặc `PAYMENT_FAILED`, bấm hủy, API kiểm quyền sở hữu và trạng thái, trong một transaction chuyển đơn sang `CANCELLED` và nhả giữ chỗ nguyên liệu theo snapshot (onHand không đổi).
  - Luồng thay thế cần có: hủy lặp lại một đơn đã `CANCELLED` (kết quả theo SRS); đơn legacy không có snapshot (nếu SRS nêu).
  - Ngoại lệ cần có: đơn có `Payment PENDING` còn hạn thì 409 `PAYMENT_IN_PROGRESS` (AC-F25.4, UC-04 A5); `Payment PENDING` quá hạn thì đối soát QueryDR trước rồi mới xét hủy (AC-F16.9, UC-04 E11); đơn đã `PAID` trở đi không hủy được; không phải chủ đơn; chưa đăng nhập; ID không tồn tại.
  - Hậu điều kiện ghi theo bảng: `Order`, `Payment`, kho (reserved / onHand), giống cách `uc-checkout.md` mục 4 trình bày.
- **UC-07 Cập nhật trạng thái đơn** — FR-23, FR-24; AC-F23.1 đến .4, AC-F24.1 đến .4. FR-27 (hàng đợi Barista) là Won't, không vẽ.
  - Actor: Barista, thao tác qua API (Postman), không có màn hình riêng trong bản nộp (SRS mục 2.1).
  - Luồng chính: Barista đã đăng nhập gửi `PATCH /orders/:id` với trạng thái kế tiếp; API kiểm vai trò, kiểm chuyển trạng thái hợp lệ theo vòng đời, ghi trạng thái mới; Customer thấy trạng thái mới ở UC-05.
  - Phải có **bảng chuyển trạng thái hợp lệ** (từ → sang, ai được làm) chép đúng từ FR-23 và `state-order.puml`, kèm các chuyển bị chặn.
  - Ngoại lệ cần có: chuyển trạng thái sai thứ tự, đơn chưa trả, sai vai trò (Customer gọi chuyển trạng thái của Barista), thiếu JWT, ID không tồn tại, hai Barista cập nhật cùng lúc (nếu SRS nêu khóa lạc quan hoặc transaction).
  - Nêu ranh giới với UC-06: cùng endpoint `PATCH /orders/:id` nhưng khác actor và khác trạng thái đích. Quyền của Barista với `CANCELLED` ghi **đúng theo SRS hiện tại**; nếu SRS, sơ đồ trạng thái và code không thống nhất ở điểm này thì ghi vào report, không tự phân xử.

## Các bước

- [ ] **C0.** `git branch --show-current` ra `a2/uc-specs`. Không chạy lệnh git nào làm đổi repo.
- [ ] **C1.** Đọc đầu vào. Lập danh sách AC của FR-23, 24, 25 và bảng chuyển trạng thái từ `state-order.puml`.
- [ ] **C2.** Viết hai file `.puml` theo mẫu trong README. Sơ đồ UC-06 không mâu thuẫn với `uc-checkout.puml`.
- [ ] **C3.** Viết hai file `.md` theo khung 8 mục trong README.
- [ ] **C4.** Đối chiếu code, ghi chỗ lệch (đặc biệt: quyền hủy, thứ tự kiểm 401/403/404/409, nhả giữ chỗ).
- [ ] **C5.** Chạy các lệnh acceptance trong README.
- [ ] **C6.** Ghi `report-C.md` và dừng. **Không `git add`, không commit**: Integrator kiểm rồi commit với message `docs(requirements): add UC-06 and UC-07 specifications`.

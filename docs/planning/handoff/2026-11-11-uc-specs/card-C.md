# Card C: UC-06 Hủy đơn chưa trả, UC-07 Cập nhật trạng thái đơn (phức tạp)

> Plan: [`../../2026-11-11-uc-specs-plan.md`](../../2026-11-11-uc-specs-plan.md). Quy tắc chung, khung file và lệnh acceptance: [`README.md`](README.md). Đọc README trước, rồi `.claude/rules/doc-code-sync.md`.

**Branch:** `a2/uc-specs` · **Worktree:** `.worktrees/uc-specs` (dùng chung với các card khác, xem README mục "Một nhánh, một worktree")

**Allowed paths (chỉ tạo mới):**

- `docs/requirements/use-cases/uc-06-cancel-order.md`, `uc-06-cancel-order.puml`
- `docs/requirements/use-cases/uc-07-order-status.md`, `uc-07-order-status.puml`
- `docs/planning/handoff/2026-11-11-uc-specs/report-C.md`

## Đầu vào phải đọc

- `docs/requirements/srs.md`: mục 2.1, 2.3, 3.1–3.2, 3.4 (quy ước VNPay, QueryDR), 3.5 (BR-08, BR-09, BR-10, BR-11), 3.5a, **3.6 (máy trạng thái đơn: 8 chuyển hợp lệ và ai thực hiện)**, mục 5.8 (FR-23, FR-24, FR-25), mục 5.9 (FR-26, FR-27 là Won't), AC-F16.9 và AC-F16.10 (đối soát payment quá hạn), NFR-05, NFR-13.
- `docs/diagrams/state-order.puml`: mọi chuyển trạng thái trong hai đặc tả phải khớp sơ đồ này và bảng mục 3.6.
- `docs/requirements/uc-checkout.md`: luồng A5 (chủ đơn hủy đơn chưa trả), E11 (`Payment PENDING` quá hạn), E12 (tiền về sau trạng thái cuối). Dẫn chiếu, không chép lại.
- `docs/requirements/uc-inventory.md`: phần hủy thì nhả đúng phần trong snapshot.
- `docs/requirements/use-case-overview.puml`, `docs/requirements/uc-checkout.puml` (UC-06 đã có ở cả hai, kèm đường nối tới VNPay).
- Code để đối chiếu: phần `PATCH /orders/:id` và máy trạng thái trong `apps/api/src/checkout/`, phần đối soát trong `apps/api/src/payment/`, phần nhả giữ chỗ trong `apps/api/src/inventory/`, nút hủy đơn trong `apps/web/src/app/orders`.

## Nội dung từng use-case

- **UC-06 Hủy đơn chưa trả** — FR-25 (Must); AC-F25.1 đến .4. FR-26 (hủy đơn đã trả, hoàn tiền) là Won't: nêu trong phần "không làm", không đặc tả luồng.
  - Actor chính: Customer (chủ đơn). **Actor phụ: VNPay sandbox, chỉ khi đối soát payment quá hạn** (SRS mục 2.3; overview có `UC06 --- Pay`). Sơ đồ vẽ `UC06 --- Pay` với nhãn như `uc-checkout.puml` ("kiểm tra giao dịch quá hạn"). Barista không tham gia.
  - Luồng chính: Customer mở đơn `PENDING` hoặc `PAYMENT_FAILED` không có payment chưa kết luận, bấm "Hủy đơn", xác nhận; API kiểm quyền sở hữu và trạng thái, trong một transaction chuyển đơn sang `CANCELLED` và giảm `reserved` theo snapshot, `onHand` không đổi; nhãn đơn thành "Đã hủy" và nút biến mất (AC-F25.1, AC-F25.3).
  - Luồng thay thế cần có: đơn `inventoryTracked=false` chỉ hoàn `Product.stock` theo vòng đời cũ (AC-F25.1); đơn có `Payment PENDING` quá hạn thì API đối soát QueryDR trước, kết luận xong mới xét hủy (AC-F25.4, AC-F16.9, UC-04 E11).
  - Ngoại lệ cần có: `Payment PENDING` còn hạn thì 409 `PAYMENT_IN_PROGRESS` (AC-F25.4, UC-04 A5); gọi hủy lần hai trả 409 và không nhả lần hai (AC-F25.1); đơn của người khác 403 `FORBIDDEN`; Customer hủy đơn `PAID` 403 `FORBIDDEN`; đơn `PREPARING`, `READY`, `COMPLETED`, `CANCELLED` 409 `INVALID_ORDER_TRANSITION` (AC-F25.2); chưa đăng nhập 401; ID không tồn tại 404 `ORDER_NOT_FOUND`.
  - Ghi rõ đơn không tự hủy theo thời gian, và `Payment FAILED` không nhả nguyên liệu, chỉ hủy hợp lệ mới nhả (mục 3.6).
  - Hậu điều kiện trình bày theo bảng `Order` / `Payment` / kho (`reserved`, `onHand`), giống cách `uc-checkout.md` mục 4 làm.
- **UC-07 Cập nhật trạng thái đơn** — FR-23, FR-24; AC-F23.1 đến .4, AC-F24.1 đến .4. FR-27 (hàng đợi Barista) là Won't, không vẽ.
  - Actor: Barista, thao tác qua API theo hướng dẫn thủ công, không có màn hình riêng và không giao Postman collection (AC-F24.4).
  - Luồng chính: Barista đăng nhập lấy Bearer token (UC-03), `GET /orders/:id` theo mã đơn, rồi `PATCH /orders/:id` lần lượt `PREPARING`, `READY`, `COMPLETED` trên đơn `PAID`; mỗi lần trả 200; Customer thấy nhãn mới trong vòng 6 giây ở UC-05 (AC-F22.2).
  - Phải có **bảng 8 chuyển hợp lệ** (từ, sang, ai thực hiện) chép đúng SRS mục 3.6, và nói rõ UC-07 chỉ phủ ba chuyển của Barista; năm chuyển còn lại thuộc hệ thống (UC-04) và chủ đơn (UC-06).
  - Ngoại lệ cần có, đúng mã theo SRS:
    - chuyển không có trong bảng (ví dụ `PAID → READY`, `COMPLETED → PREPARING`): 409 `INVALID_ORDER_TRANSITION` (AC-F23.2);
    - `status` đích là `PENDING`, `PAID`, `PAYMENT_FAILED`: 400 `VALIDATION_ERROR` (AC-F23.3);
    - Barista chuyển đơn `PENDING` hoặc `PAYMENT_FAILED` sang `PREPARING`: 409 (AC-F24.3);
    - **Barista gửi `CANCELLED` trên đơn `PENDING` hoặc `PAYMENT_FAILED`: 403 `FORBIDDEN`; trên đơn `PAID` trở đi hoặc đã `CANCELLED`: 409 `INVALID_ORDER_TRANSITION`** (AC-F24.3, đã chốt ở PR #31);
    - Customer gọi `PREPARING` / `READY` / `COMPLETED`: 403; không token: 401 (AC-F24.2); ID không tồn tại: 404 `ORDER_NOT_FOUND`.
    - Mọi trường hợp bị từ chối không đổi trạng thái đơn, snapshot và số dư.
  - Hai Barista cập nhật cùng lúc: chỉ viết nếu SRS (NFR-13 hoặc FR-23/24) có nêu; không có thì ghi vào report như điểm SRS chưa nói.
  - Ranh giới với UC-06: cùng endpoint `PATCH /orders/:id`, khác actor và khác trạng thái đích.

## Các bước

- [ ] **C0.** `git branch --show-current` ra `a2/uc-specs`. Không chạy lệnh git nào làm đổi repo.
- [ ] **C1.** Đọc đầu vào. Lập danh sách AC của FR-23, 24, 25 và chép bảng 8 chuyển từ SRS mục 3.6; đối chiếu với `state-order.puml`.
- [ ] **C2.** Viết hai file `.puml` theo mẫu trong README. Sơ đồ UC-06 không mâu thuẫn với `uc-checkout.puml`.
- [ ] **C3.** Viết hai file `.md` theo khung 8 mục trong README.
- [ ] **C4.** Đối chiếu code, ghi chỗ lệch (đặc biệt: thứ tự kiểm 401 / 403 / 404 / 409, quyền hủy theo AC-F24.3, nhả giữ chỗ đúng một lần).
- [ ] **C5.** Chạy các lệnh acceptance trong README.
- [ ] **C6.** Ghi `report-C.md` và dừng. **Không `git add`, không commit**: Integrator kiểm rồi commit với message `docs(requirements): add UC-06 and UC-07 specifications`.

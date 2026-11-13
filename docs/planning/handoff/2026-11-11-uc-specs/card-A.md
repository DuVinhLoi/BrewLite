# Card A: UC-03 Đăng nhập, UC-09 Đăng ký, UC-05 Lịch sử đơn (đơn giản)

> Plan: [`../../2026-11-11-uc-specs-plan.md`](../../2026-11-11-uc-specs-plan.md). Quy tắc chung, khung file và lệnh acceptance: [`README.md`](README.md). Đọc README trước, rồi `.claude/rules/doc-code-sync.md`.

**Branch:** `a2/uc-specs` · **Worktree:** `.worktrees/uc-specs` (dùng chung với các card khác, xem README mục "Một nhánh, một worktree")

**Allowed paths (chỉ tạo mới):**

- `docs/requirements/use-cases/uc-03-login.md`, `uc-03-login.puml`
- `docs/requirements/use-cases/uc-09-register.md`, `uc-09-register.puml`
- `docs/requirements/use-cases/uc-05-order-history.md`, `uc-05-order-history.puml`
- `docs/planning/handoff/2026-11-11-uc-specs/report-A.md`

## Đầu vào phải đọc

- `docs/requirements/srs.md`: mục 2.1 (actor), 2.3 (danh mục UC), 3.1–3.3 (endpoint, lỗi, seed), 3.6 (nhãn trạng thái tiếng Việt), mục 5.4 (FR-08, FR-09, FR-10), mục 5.7 (FR-20, FR-21, FR-22), NFR-04, NFR-05.
- `docs/requirements/context-and-scope.md`: giả định A-04 (tài khoản Barista do seed tạo, không có màn tự đăng ký).
- `docs/requirements/uc-checkout.md`: ngoại lệ E1 (chưa đăng nhập hoặc JWT hết hạn) và phần màn xác nhận đơn, để dẫn chiếu chứ không chép lại.
- `docs/requirements/use-case-overview.puml`, `docs/requirements/uc-checkout.puml` (cách vẽ UC-03 extend UC-04), `docs/diagrams/state-order.puml`.
- Code để đối chiếu: `apps/api/src/auth/`, phần đọc đơn trong `apps/api/src/checkout/`, các trang `apps/web/src/app/login`, `register`, `orders`, và `apps/web/src/app/payment/vnpay-return/page.tsx` (AC-F20.1: trang này đọc `GET /orders/:id` rồi chuyển tới màn xác nhận).

## Nội dung từng use-case

- **UC-03 Đăng nhập (JWT)** — FR-09, FR-10; AC-F09.1 đến .4, AC-F10.1 đến .5.
  - Actor: Guest và Barista (overview nối cả hai với UC-03). Barista dùng cùng form và endpoint (AC-F09.4).
  - Sơ đồ: `UC-03 <<extend>> UC-04` với nhãn điều kiện như `uc-checkout.puml` ("chưa đăng nhập hoặc hết phiên"). Vẽ UC-04 như use-case liên quan.
  - Luồng chính: nhập email, mật khẩu; `POST /auth/login` trả `accessToken`; giao diện chuyển về trang trước đó theo tham số `next` hoặc về menu (AC-F09.3).
  - Luồng thay thế cần có: Guest có giỏ bấm "Thanh toán" bị chuyển tới `/login?next=/checkout` rồi quay lại, giỏ còn nguyên (AC-F10.3); Barista đăng nhập; đăng xuất (xóa token, giữ giỏ).
  - Ngoại lệ cần có: sai email hoặc mật khẩu, cùng một thông điệp (AC-F09.2); thiếu token, token sai chữ ký hoặc hết hạn ở các endpoint cần đăng nhập (AC-F10.1, .2); 401 giữa lúc thanh toán (AC-F10.4) thì chỉ tóm tắt và dẫn UC-04 E1, không chép lại.
  - AC-F10.5 (Guest không bị chặn ở menu, chi tiết, giỏ) ghi ở mục phạm vi hoặc hậu điều kiện.
- **UC-09 Đăng ký tài khoản** — FR-08; AC-F08.1 đến .4.
  - Actor: Guest. Ghi rõ Barista không đăng ký (A-04) và tài khoản mới luôn là `CUSTOMER`.
  - Ngoại lệ cần có: email trùng không phân biệt hoa thường (409 `EMAIL_ALREADY_EXISTS`); email sai định dạng, mật khẩu yếu, body có trường lạ như `role` (400 `VALIDATION_ERROR`); lỗi định dạng bị chặn ngay ở form, không gọi API (AC-F08.4). Dẫn NFR-04 cho việc băm mật khẩu.
  - SRS chỉ nói `POST /auth/register` trả 201, **không nói** sau đó tự đăng nhập hay chuyển tới trang đăng nhập. Đặc tả dừng hậu điều kiện ở "tài khoản đã được tạo"; ghi hành vi thực tế của code vào report như một điểm SRS còn mơ hồ.
- **UC-05 Xem lịch sử và theo dõi đơn** — FR-20, FR-21, FR-22; AC-F20.1 đến .3, AC-F21.1 đến .5, AC-F22.1 đến .4.
  - Actor chính: Customer, đúng như overview. Sơ đồ **không** nối Barista với UC-05.
  - Quyền của Barista: `GET /orders/:id` với token Barista trả 200 cho mọi đơn (AC-F22.1), còn `GET /orders/me` trả 403 (AC-F21.4). Ghi điểm này thành **một luồng thay thế** có dẫn UC-07 (Barista đọc đơn trước khi đổi trạng thái, AC-F24.4), và nêu điểm lệch nhẹ với overview trong report để nhóm quyết có vẽ thêm đường nối hay không.
  - Luồng chính: mở danh sách đơn của tôi (mới nhất trước, tối đa 50), mở chi tiết một đơn, thấy tiến trình và nhãn trạng thái tiếng Việt; trang tự làm mới mỗi 5 giây và dừng khi đơn `COMPLETED` hoặc `CANCELLED`.
  - Luồng thay thế cần có: danh sách rỗng; vào thẳng trang chi tiết như màn xác nhận sau UC-04 (FR-20: màn xác nhận chính là `/orders/:id`).
  - Ngoại lệ cần có: chưa đăng nhập (401), đơn của người khác (403 `FORBIDDEN`), ID không tồn tại (404 `ORDER_NOT_FOUND`), lỗi tải (loading và error như FR-02).
  - Hủy đơn (UC-06) và đổi trạng thái (UC-07) chỉ nhắc như use-case liên quan, không đặc tả ở đây.

## Các bước

- [ ] **A0.** `git branch --show-current` ra `a2/uc-specs`. Không chạy lệnh git nào làm đổi repo.
- [ ] **A1.** Đọc đầu vào. Lập danh sách AC của FR-08, 09, 10, 20, 21, 22.
- [ ] **A2.** Viết ba file `.puml` theo mẫu trong README.
- [ ] **A3.** Viết ba file `.md` theo khung 8 mục trong README.
- [ ] **A4.** Đối chiếu code, ghi chỗ lệch.
- [ ] **A5.** Chạy các lệnh acceptance trong README.
- [ ] **A6.** Ghi `report-A.md` và dừng. **Không `git add`, không commit**: Integrator kiểm rồi commit với message `docs(requirements): add UC-03, UC-05 and UC-09 specifications`.

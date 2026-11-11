# Card A: UC-03 Đăng nhập, UC-09 Đăng ký, UC-05 Lịch sử đơn (đơn giản)

> Chỉ mục và quy tắc chung: [`README.md`](README.md). Đọc README trước, rồi `.claude/rules/doc-code-sync.md` và mục "Worker phải tuân" của `.claude/rules/multi-agent-workflow.md`.

**Branch:** `a2/uc-a-auth-history` · **Worktree:** `.worktrees/uc-a` · **Base:** `a2/uc-specs`

**Allowed paths (chỉ tạo mới):**

- `docs/requirements/use-cases/uc-03-login.md`, `uc-03-login.puml`
- `docs/requirements/use-cases/uc-09-register.md`, `uc-09-register.puml`
- `docs/requirements/use-cases/uc-05-order-history.md`, `uc-05-order-history.puml`
- `docs/planning/handoff/2026-11-11-uc-specs/report-A.md`

## Đầu vào phải đọc

- `docs/requirements/srs.md`: mục 2.1 (actor), 2.3 (danh mục UC), 3.1–3.3 (endpoint, lỗi, seed), mục 5.4 (FR-08, FR-09, FR-10), mục 5.7 (FR-20, FR-21, FR-22), NFR-04, NFR-05.
- `docs/requirements/context-and-scope.md`: giả định A-04 (Barista không đăng ký, tài khoản do seed tạo).
- `docs/requirements/uc-checkout.md`: ngoại lệ E1 (chưa đăng nhập) và phần màn xác nhận đơn, để dẫn chiếu chứ không chép lại.
- `docs/requirements/use-case-overview.puml`, `docs/diagrams/state-order.puml` (tên trạng thái đơn cho UC-05).
- Code để đối chiếu: `apps/api/src/auth/`, phần đọc đơn trong `apps/api/src/checkout/`, các trang đăng nhập, đăng ký, lịch sử và chi tiết đơn trong `apps/web/src/app/`.

## Nội dung từng use-case

- **UC-03 Đăng nhập (JWT)** — FR-09, FR-10; AC-F09.1 đến .4, AC-F10.1 đến .5.
  - Actor: Guest và Barista (overview nối cả hai với UC-03). Sau khi đăng nhập, Guest trở thành Customer.
  - Sơ đồ có quan hệ `UC-03 <<extend>> UC-04`: đăng nhập chen vào khi khách chưa đăng nhập mà bấm thanh toán (UC-04 E1). Vẽ UC-04 trong sơ đồ như use-case liên quan.
  - Luồng thay thế cần có: quay lại trang đang dở sau khi đăng nhập (nếu SRS có); Barista đăng nhập để dùng API/màn `/inventory`.
  - Ngoại lệ cần có: sai email/mật khẩu, dữ liệu không hợp lệ, JWT hết hạn hoặc thiếu khi gọi endpoint cần đăng nhập, sai vai trò (401/403 theo SRS).
- **UC-09 Đăng ký tài khoản** — FR-08; AC-F08.1 đến .4.
  - Actor: Guest. Ghi rõ Barista không đăng ký (A-04).
  - Ngoại lệ cần có: email trùng, mật khẩu/email không hợp lệ. Dẫn NFR-04 cho việc băm mật khẩu.
  - Nêu rõ sau khi đăng ký thành công hệ thống làm gì tiếp (tự đăng nhập hay chuyển tới UC-03) **đúng theo SRS**; nếu SRS không nói thì ghi vào report, không tự chọn.
- **UC-05 Xem lịch sử và theo dõi đơn** — FR-20, FR-21, FR-22; AC-F20.1 đến .3, AC-F21.1 đến .5, AC-F22.1 đến .4.
  - Actor: Customer. Use-case chỉ đọc dữ liệu.
  - Luồng chính: mở danh sách đơn của tôi, mở chi tiết một đơn, thấy trạng thái hiện tại. Luồng thay thế: danh sách rỗng; vào thẳng màn xác nhận sau UC-04 (FR-20).
  - Ngoại lệ cần có: chưa đăng nhập, xem đơn của người khác, ID đơn không tồn tại, lỗi tải.
  - Hủy đơn (UC-06) và đổi trạng thái (UC-07) chỉ nhắc như use-case liên quan, không đặc tả ở đây.

## Các bước

- [ ] **A0.** `git branch --show-current` ra `a2/uc-a-auth-history`; `git status --porcelain` sạch.
- [ ] **A1.** Đọc đầu vào. Lập danh sách AC của FR-08, 09, 10, 20, 21, 22.
- [ ] **A2.** Viết ba file `.puml` theo mẫu trong README.
- [ ] **A3.** Viết ba file `.md` theo khung 8 mục trong README.
- [ ] **A4.** Đối chiếu code, ghi chỗ lệch.
- [ ] **A5.** Chạy các lệnh acceptance trong README.
- [ ] **A6.** `git add docs/requirements/use-cases docs/planning/handoff/2026-11-11-uc-specs/report-A.md` rồi commit: `docs(requirements): add UC-03, UC-05 and UC-09 specifications`. Không có trailer `Co-Authored-By`.

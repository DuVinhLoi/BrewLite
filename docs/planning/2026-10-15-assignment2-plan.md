# Kế hoạch thực hiện BrewLite Assignment 2 (Requirements to Deployment)

> Ngày lập: 2026-10-15. Nhánh: `develop-Assignment2`. Đề: [`docs/Assignment2-BrewLite.md`](../Assignment2-BrewLite.md) (gọi tắt **đề A2**). Đề của lần trước: [`docs/BrewLite-CongNghePhanMem-fixed.md`](../BrewLite-CongNghePhanMem-fixed.md) (gọi tắt **đề A1**).
>
> Đây là kế hoạch **cho nhóm thực hiện**. Giảng viên cấm vibecoding: tài liệu Task 1–3 (SRS, sơ đồ, ADR) có thể nhờ agent soạn nháp rồi nhóm sửa và chốt; code và pipeline Task 4–5 do nhóm viết (agent chỉ viết khi được yêu cầu rõ). Mọi tạo phẩm, thành viên phụ trách phải tự giải thích được. Kế hoạch này nói *làm gì, ở đâu, theo thứ tự nào, đạt tiêu chí nào*.
>
> Chỗ ghi `[nhóm điền]` là thông tin chỉ nhóm biết (người phụ trách, ngày, URL...).

## Mục lục

- A. Bối cảnh và nguyên tắc
- B. Quy trình làm việc cho mọi task
- Task 1. Yêu cầu (`docs/requirements/`)
- Task 2. Mô hình hóa (`docs/diagrams/`)
- Task 3. Kiến trúc (`docs/architecture/`)
- Task 4. Sprint 1 (repo, MVP menu, CI)
- Task 5. Sprint 2, CI/CD và Delivery
- C. Truy vết (`docs/traceability-matrix.md`)
- D. Khác biệt có chủ đích giữa A2 và A1
- E. Nền tảng triển khai: Vercel (web) + Render (API, Postgres) + GHCR
- F. Backlog gợi ý cho Sprint 1 và Sprint 2
- G. Bảng phủ: yêu cầu đề A2 → mục trong kế hoạch
- H. Rủi ro tổng hợp

---

## A. Bối cảnh và nguyên tắc

### A.1 Hiện trạng

- Assignment 1 (A1) đã xong 10 task trên nhánh `develop`: monorepo `backend/` (NestJS) + `frontend/` (Next.js) + PostgreSQL + `docker-compose.yml`, kèm hai tài liệu UML đã chuyển vào [`docs/reference/a1/`](../reference/a1/README.md).
- Assignment 2 (A2) dùng lại đề tài BrewLite nhưng đòi một chuỗi hoàn chỉnh: **yêu cầu → mô hình hóa → kiến trúc → Sprint 1 → Sprint 2 → CI/CD → production** (đề A2 §2). Điểm: mỗi task 2 điểm, tổng 10.
- Nhánh `develop-Assignment2` được tách từ `develop`, đã xóa code A1, chỉ còn tài liệu, khung thư mục (mỗi thư mục có `README.md` nêu cần nộp gì) và kế hoạch này. Code A2 viết mới trong `apps/web` và `apps/api`, **không chép** từ `backend/` hay `frontend/` của `develop`.

### A.2 Ba nguyên tắc cứng của đề

1. **Tuần tự** (đề A2 §1): task sau chỉ được nghiệm thu khi tạo phẩm bắt buộc của task trước đã có trên repo và có lịch sử commit rõ ràng.
2. **Truy vết** (đề A2 §8.1): nếu task trước thiếu tạo phẩm bắt buộc, task sau không được tính điểm phần truy vết.
3. **Production phải sống lúc chấm** (đề A2 §8.1): không có URL production hoạt động tại thời điểm chấm thì phần triển khai của Task 5 không được tính.

### A.3 Công nghệ bắt buộc và tự chọn

- Bắt buộc, không được thay: **Next.js** (mobile-first/PWA), **NestJS**, **PostgreSQL** (đề A2 §1.1). Docker là công nghệ ghi trên trang bìa và cần cho `docker-compose.yml` và image.
- Nhóm được bổ sung công nghệ khác. Gợi ý trong kế hoạch này (nhóm chốt bằng ADR): Prisma cho ORM/migration, Jest + supertest, Vitest + Testing Library, Playwright, GitHub Actions, GHCR, Vercel, Render.

### A.4 Vai trò của AI agent trên nhánh này

Xem [`.claude/rules/doc-code-sync.md`](../../.claude/rules/doc-code-sync.md): agent được soạn nháp tài liệu Task 1–3 (`docs/requirements/`, `docs/diagrams/`, `docs/architecture/`, ma trận truy vết); code trong `apps/`, `tests/`, `.github/workflows/` chỉ viết khi người dùng yêu cầu rõ. Agent luôn được review, đối chiếu đề và giải thích. Bản nháp do agent soạn phải được thành viên phụ trách đọc, sửa, chốt qua PR và tự giải thích được khi vấn đáp.

---

## B. Quy trình làm việc cho mọi task

### B.1 Nhánh, commit, pull request

- Nhánh tích hợp: `develop-Assignment2`. Không commit thẳng vào đó.
- Mỗi task (hoặc task con) làm trên một nhánh riêng `a2/task-<n>-<tên>`, ví dụ:
  - `a2/task-1-requirements`, `a2/task-2-diagrams`, `a2/task-3-architecture`;
  - `a2/task-4-1-repo-setup`, `a2/task-4-3-menu-mvp`, `a2/task-4-4-ci`;
  - `a2/task-5-1-order-flow`, `a2/task-5-2-tests`, `a2/task-5-3-cd`, `a2/task-5-4-delivery`.
- Commit theo Conventional Commits: `docs(requirements): ...`, `docs(diagrams): ...`, `feat(api): ...`, `feat(web): ...`, `test(api): ...`, `ci: ...`, `chore: ...`. Quy ước này ghi trong `CONTRIBUTING.md` (Task 4.1).
- Mỗi PR vào `develop-Assignment2`:
  - có ít nhất một người review khác tác giả;
  - mô tả PR nêu **lý do thay đổi** (đề A2 §6.2) và mã `FR-xx` hoặc mục đề liên quan;
  - PR đổi hành vi thì cập nhật đồng thời SRS, sơ đồ, `docs/traceability-matrix.md` (thứ tự ở `doc-code-sync.md`).
- Sau khi merge, xóa nhánh `a2/...` đã xong. Lịch sử commit chính là bằng chứng "task trước đã có trên repo" (đề A2 §1).

### B.2 Branch protection

- Trước Task 4.4 (chưa có CI): bắt buộc PR và một approval.
- **Từ Task 4.4**: bật branch protection cho `develop-Assignment2`, bắt buộc status check `ci` xanh và một approval trước khi merge; cấm push thẳng và force-push. Đây là yêu cầu "Pull request không được merge nếu lint, test hoặc build thất bại" (đề A2 §6.4).
- Lưu ý: branch protection trên repository private có thể cần gói trả phí của GitHub. Kiểm tra sớm ở Task 4.1; nếu không bật được thì chuyển repo sang public, hoặc dùng tổ chức (organization) hỗ trợ; ghi quyết định vào `CONTRIBUTING.md`.

### B.3 Tag và release

- Production deploy chỉ từ tag `a2-v*` (ví dụ `a2-v0.1.0`, `a2-v1.0.0`).
- `a2-v0.1.0`: đánh dấu hết Sprint 1 (chưa deploy, vì CD thuộc Task 5.3).
- `a2-v1.0.0`: bản nộp bài. Tạo GitHub Release kèm release notes (đề A2 §7.4).

### B.4 Cổng giữa các task

Trước khi bắt đầu task kế tiếp, cả nhóm kiểm checklist nghiệm thu của task hiện tại ở mục tương ứng bên dưới. Task chưa qua cổng thì task sau vẫn có thể làm nháp trên nhánh riêng nhưng **chưa merge**.

### B.5 Hồ sơ Scrum

- Product Backlog và board Sprint 1, Sprint 2: GitHub Projects (hoặc nền tảng tương đương), link ghi vào `README.md` (Task 4.1).
- Sprint Review và Sprint Retrospective cho từng Sprint ghi tại `docs/sprint/sprint-1-review-retro.md` và `docs/sprint/sprint-2-review-retro.md` (đường dẫn gợi ý; đề A2 §7.4 chỉ đòi có hai sự kiện này).
- Số liệu Scrum của A1 (`docs/scrum-process.md`) chỉ là mẫu tham khảo, không phải của A2.

---

## Task 1. Khai thác và đặc tả yêu cầu (đề A2 §3)

**Mục tiêu:** người đọc xác định rõ hệ thống làm gì, không làm gì, và dùng tiêu chí chấp nhận để viết test ở các task sau (đề A2 §3.3).
> **Trạng thái:** đã chốt qua PR #5 (merge `0130ae0`). Phạm vi minimum ghi ở [`srs.md`](../requirements/srs.md) mục 1.4 và 8; khi mục này lệch SRS thì SRS đúng. Các quyết định đã chốt:
> - quản lý trạng thái đơn: FR-23 và FR-24 là **Must**, Barista đổi trạng thái qua `PATCH /orders/:id` bằng **Postman collection** (AC-F24.4); FR-25 (khách hủy đơn chưa thanh toán) là **Could** vì đề A2 §7.1 không đòi hủy đơn; Swagger UI không là tiêu chí nghiệm thu;
> - khuyến mãi, điểm thưởng, hoàn tiền, hàng đợi Barista (FR-17, FR-18, FR-19, FR-26, FR-27) là **Won't trong bản nộp**; class diagram vẫn có `Promotion` và `LoyaltyTransaction`;
> - SRS đã rút gọn thêm về mức tối thiểu của đề (ghi chú ở `srs.md` mục 1.4): NFR-01 giữ Must (nhóm chọn, chỉ đo ở local), NFR-12 giữ Must cho E2E tự động tối thiểu, NFR-02 và NFR-03 thành Could, NFR-10 (PWA) thành Must nhưng chỉ cần web app manifest.

**Nhánh gợi ý:** `a2/task-1-requirements`, tách PR theo Task 1.1, 1.2, 1.3.
**Đầu vào tham khảo:** đề A1 §3.1–3.2 (vision, stakeholder), §4 (yêu cầu), §5 (luồng nghiệp vụ); [`docs/reference/a1/use-case-specifications.md`](../reference/a1/use-case-specifications.md) §1 (actor), §2 (Bản 1), §4 (bảng UC).

### Task 1.1 — Bối cảnh, stakeholder, phạm vi (đề A2 §3.1)

**Tạo phẩm (bắt buộc):** `docs/requirements/context-and-scope.md`.

Nội dung phải có:

| Mục | Nội dung cần viết | Gợi ý nguồn |
|---|---|---|
| Vấn đề nghiệp vụ | BrewLite giải quyết vấn đề gì (xếp hàng, thanh toán tiền mặt...) | đề A1 §3.1 (Product Vision) |
| Bảng stakeholder | 6 bên theo đề A2 §3.1: khách hàng, nhân viên quầy, quản lý cửa hàng, giảng viên/khách hàng nghiệm thu, nhóm phát triển, đơn vị thanh toán. Mỗi bên có mục tiêu và kỳ vọng | đề A1 §3.2 (đã mô tả 6 bên) |
| In-scope (MVP) | Luồng Xem menu → Chọn tùy chọn → Giỏ hàng → Đặt đơn → Thanh toán → Theo dõi đơn | đề A2 §1.1 |
| Phạm vi mở rộng | Việc ngoài bản nộp (đã chốt: FR-25 Could; Won't: FR-17, FR-18, FR-19, FR-26, FR-27, chỉ làm khi có PR phê duyệt) | `context-and-scope.md` mục 3.2 |
| Out-of-scope | Việc không làm, ví dụ quản trị menu, quản trị voucher động, quản trị kho (A1 gọi là UC13, UC14, UC15) | A1 use-case §4 |
| Giả định | Ví dụ thanh toán là mô phỏng, một cửa hàng, tiền tệ VND | tự quyết |
| Ràng buộc | 3 công nghệ bắt buộc, thứ tự task, thời hạn, free tier hạ tầng | đề A2 §1.1, §1 |
| Rủi ro ban đầu | Xem mục H để lấy ý tưởng | mục H |

Lưu ý cho nhóm: `Promotion` và `LoyaltyTransaction` là lớp bắt buộc của class diagram (đề A2 §4.3). Vì vậy "quản trị voucher" ngoài scope nghĩa là *không có màn hình quản trị*, nhưng dữ liệu khuyến mãi và điểm thưởng vẫn phải có trong mô hình. Ghi rõ điều này ở out-of-scope để SRS và class diagram không mâu thuẫn.

### Task 1.2 — Yêu cầu chức năng và phi chức năng (đề A2 §3.2)

**Tạo phẩm:**

- `docs/requirements/srs.md` (SRS rút gọn);
- `docs/requirements/use-case-overview.puml` và `use-case-overview.svg` (use-case diagram tổng quát toàn hệ thống; đề A2 §3.2 mục 5).

SRS phải có đủ 5 thành phần (đề A2 §3.2):

1. Yêu cầu chức năng mã `FR-01`, `FR-02`, ...
2. Yêu cầu phi chức năng mã `NFR-01`, `NFR-02`, ...
3. Mức ưu tiên MoSCoW (Must, Should, Could, Won't) cho từng yêu cầu.
4. Tiêu chí chấp nhận kiểm chứng được cho **từng** yêu cầu (đo được: mã HTTP, thời gian, trạng thái hiển thị).
5. Use-case diagram tổng quát.

**12 nhóm yêu cầu tối thiểu** và chỗ đặt gợi ý:

| # | Nhóm (đề A2 §3.2) | Loại | Gợi ý xếp loại | Ghi chú |
|---|---|---|---|---|
| 1 | Menu | FR | Must | A1: đề §4.1 mục 1 |
| 2 | Chi tiết sản phẩm (size, topping) | FR | Must | A1: đề §4.1 mục 2 |
| 3 | Giỏ hàng | FR | Must | thêm/sửa/xóa, tổng tiền |
| 4 | Xác thực | FR | Must | đăng ký, đăng nhập, JWT |
| 5 | Đặt đơn | FR | Must | |
| 6 | Thanh toán | FR | Must | Ví/Thẻ mô phỏng, thành công/thất bại, idempotency |
| 7 | Lịch sử đơn | FR | Must | |
| 8 | Quản lý trạng thái đơn | FR | Must (đã chốt) | FR-23, FR-24 Must; FR-25 Could; xem bên dưới |
| 9 | Hiệu năng | NFR | Must / Could | A1: đề §4.2 (API < 500ms với dữ liệu mẫu, đo ở local); đề A2 không đặt ngưỡng số |
| 10 | Bảo mật | NFR | Must | A1: đề §4.2 (băm mật khẩu, JWT, validate) |
| 11 | Tính khả dụng | NFR | Must | mobile-first, PWA (chỉ manifest), loading/empty/error; E2E tự động trên Chromium theo NFR-12 (đề A2 §7.2) |
| 12 | Khả năng triển khai | NFR | Must | docker-compose, CI/CD, health check, migration |

Mã `FR-xx` cụ thể do nhóm tự đánh số. Bảng mẫu trong đề A2 §8.1 (`FR-01`, `FR-05`) chỉ để minh họa định dạng.

Quyết định nhóm phải chốt trong SRS:

- **Quản lý trạng thái đơn (đã chốt Must):** state machine chặn chuyển sai (FR-23); Barista đổi trạng thái qua `GET /orders/:id` và `PATCH /orders/:id` bằng Postman collection, mã đơn lấy từ biên lai demo (FR-24, AC-F24.4). Khách hủy đơn chưa thanh toán và hoàn tồn kho (FR-25) chỉ là Could; hai chuyển `→ CANCELLED` vẫn nằm trong state machine. Không có màn quầy; Swagger UI không là tiêu chí nghiệm thu.
- **Khuyến mãi và điểm thưởng (đã chốt Won't trong bản nộp):** FR-17, FR-18, FR-19 giữ đặc tả để truy vết, chỉ làm khi có PR phê duyệt mở rộng phạm vi. Class diagram vẫn phải có `Promotion` và `LoyaltyTransaction` (đề A2 §4.3); lý do ghi ở `srs.md` mục 1.4.
- **Thanh toán lỗi, hết hàng, chưa đăng nhập:** ba tình huống này phải có FR hoặc tiêu chí chấp nhận riêng, vì activity diagram bắt buộc có ba nhánh này (đề A2 §4.1).

Use-case diagram tổng quát: rút từ Bản 1 của [`docs/reference/a1/use-case-specifications.md`](../reference/a1/use-case-specifications.md) §2, rồi **cắt theo scope** của `context-and-scope.md` (bỏ UC quản trị kho, menu, voucher). Vẽ lại bằng tay trong PlantUML, không chép nguyên.

### Task 1.3 — Đặc tả một use-case trọng tâm (đề A2 §3.3)

**Tạo phẩm:**

- `docs/requirements/uc-checkout.md`;
- `docs/requirements/uc-checkout.puml` và `uc-checkout.svg` (use-case diagram cho phạm vi use-case này).

Use-case khuyến nghị: **Đặt và thanh toán đơn hàng**. Ghép từ A1: UC04 (tạo đơn), UC05 (thanh toán), UC05a (áp mã giảm giá); xem bảng UC ở [`docs/reference/a1/use-case-specifications.md`](../reference/a1/use-case-specifications.md) §4 và đặc tả luồng ở [`docs/reference/a1/user-sequence-specifications.md`](../reference/a1/user-sequence-specifications.md) §2.4 phần A.

`uc-checkout.md` gồm (đề A2 §3.3):

- actor (chính và phụ), trigger;
- tiền điều kiện, hậu điều kiện (cả khi thành công và khi thất bại);
- luồng chính;
- luồng thay thế (ví dụ đổi phương thức, thử lại thanh toán);
- luồng ngoại lệ (hết hàng, chưa đăng nhập, thanh toán thất bại, gửi lại yêu cầu thanh toán);
- bảng liên kết tới các mã `FR-xx` / `NFR-xx` liên quan.

### Checklist nghiệm thu Task 1

Chép từ đề A2 §3 (đánh dấu khi xong):

- [ ] `docs/requirements/context-and-scope.md` có **bảng stakeholder, in-scope, out-of-scope, giả định và ràng buộc** (bắt buộc, §3.1).
- [ ] Có mô tả vấn đề nghiệp vụ, mục tiêu và kỳ vọng của **từng** stakeholder, phạm vi MVP / mở rộng / không thực hiện, rủi ro ban đầu (§3.1).
- [ ] SRS có `FR-xx`, `NFR-xx`, MoSCoW, tiêu chí chấp nhận kiểm chứng được cho từng yêu cầu (§3.2 mục 1-4).
- [ ] Có use-case diagram tổng quát của toàn hệ thống (§3.2 mục 5).
- [ ] SRS phủ đủ 12 nhóm: menu, chi tiết sản phẩm, giỏ hàng, xác thực, đặt đơn, thanh toán, lịch sử đơn, quản lý trạng thái đơn, hiệu năng, bảo mật, tính khả dụng, khả năng triển khai (§3.2).
- [ ] `docs/requirements/uc-checkout.md` có use-case diagram, actor, trigger, tiền/hậu điều kiện, luồng chính, thay thế, ngoại lệ, liên kết mã yêu cầu (§3.3).
- [ ] **Tiêu chí nghiệm thu:** một người ngoài nhóm đọc xong biết hệ thống làm gì, không làm gì, và viết được test từ tiêu chí chấp nhận (§3.3).
- [ ] Mọi tạo phẩm đã nằm trên `develop-Assignment2` qua PR có lý do thay đổi.

---

## Task 2. Mô hình hóa hệ thống (đề A2 §4)

**Mục tiêu:** ba loại sơ đồ khớp nhau và khớp SRS (đề A2 §4.3).
**Nhánh gợi ý:** `a2/task-2-diagrams` (có thể tách mỗi sơ đồ một PR).
**Quy tắc lưu:** mỗi sơ đồ có tệp nguồn `.puml` **và** ảnh kết xuất `.svg` (đề A2 §4.2). Công cụ vẽ do nhóm chọn; PlantUML là định dạng nguồn.

### Task 2.1 — Activity diagram (đề A2 §4.1)

**Tạo phẩm:** `docs/diagrams/activity-checkout.puml` và `activity-checkout.svg`.

Yêu cầu của đề:

- điểm bắt đầu và kết thúc;
- hành động của người dùng và của hệ thống;
- decision/merge cho nhánh thành công và thất bại;
- swimlane (gợi ý: Khách | Web | API | Payment);
- **ba nhánh bắt buộc:** hết hàng, chưa đăng nhập, thanh toán thất bại.

Gợi ý nội dung (nhóm tự thiết kế):

- Luồng happy path: đề A1 §5 (hình luồng nghiệp vụ). Nhánh lỗi: tham khảo [`docs/reference/a1/user-sequence-specifications.md`](../reference/a1/user-sequence-specifications.md) §2.4 phần B (các nhánh `alt`).
- Hết hàng: hệ thống từ chối tạo đơn, khách quay lại giỏ. Chưa đăng nhập: chuyển tới trang đăng nhập rồi quay lại thanh toán. Thanh toán thất bại: đơn ở trạng thái thất bại, giỏ hàng được giữ để thử lại.
- Mỗi nhánh phải kết thúc ở một trạng thái rõ ràng (end node), không bỏ lửng.

### Task 2.2 — Sequence diagram (đề A2 §4.2)

**Tạo phẩm (bắt buộc):** `docs/diagrams/sequence-checkout.puml` và `docs/diagrams/sequence-checkout.svg`.

Lifeline tối thiểu theo đề A2 §4.2: **Customer, Next.js UI, NestJS API, Database, Payment Service**.

Sơ đồ phải thể hiện đủ 6 điểm (đề A2 §4.2):

- [ ] request/response và thứ tự gọi API;
- [ ] kiểm tra JWT và validate dữ liệu;
- [ ] transaction khi tạo đơn và cập nhật tồn kho;
- [ ] nhánh `alt` cho thanh toán thành công/thất bại;
- [ ] idempotency khi client gửi lại yêu cầu thanh toán;
- [ ] thông báo kết quả cuối cùng cho người dùng.

Gợi ý: đọc [`docs/reference/a1/user-sequence-specifications.md`](../reference/a1/user-sequence-specifications.md) §2.4 (JWT guard, validate, transaction, `alt`, Idempotency-Key trả kết quả cache), phần I (cách đọc PlantUML: loại mũi tên, `alt`, `group`). **Vẽ lại theo thiết kế A2**, không chép: lifeline khác, có thể có `Payment Service` là thành phần riêng, phải khớp use-case `uc-checkout.md` (luồng chính, thay thế, ngoại lệ).

### Task 2.3 — Class diagram (đề A2 §4.3)

**Tạo phẩm:** `docs/diagrams/class-domain.puml` và `class-domain.svg`.

Yêu cầu của đề: tối thiểu 7 lớp, có thuộc tính chính, quan hệ, multiplicity và enum trạng thái.

| Lớp | Ghi chú cho nhóm |
|---|---|
| `User` | có vai trò khách và nhân viên (Barista), vì quản lý trạng thái đơn là Must |
| `Product` | tồn kho, size, topping: tùy nhóm mô hình hóa (thuộc tính hay lớp riêng) |
| `Order` | gắn với `User`, có trạng thái |
| `OrderItem` | gắn `Order` và `Product`, số lượng, tùy chọn |
| `Payment` | gắn `Order`, phương thức, trạng thái, khóa idempotency |
| `Promotion` | **mới so với A1** (A1 chỉ có mã `BREWLITE10` viết cứng trong code, không có bảng) |
| `LoyaltyTransaction` | **mới so với A1** (A1 cộng điểm trực tiếp vào cột của `User`) |

Enum: trạng thái đơn (A1 có 7 trạng thái, xem đề A1 §9.1 và [`docs/reference/a1/user-sequence-specifications.md`](../reference/a1/user-sequence-specifications.md) §2.5 mục B2), phương thức thanh toán, trạng thái thanh toán, vai trò. Tên enum, giá trị và 8 chuyển trạng thái hợp lệ của minimum đã chốt ở `srs.md` mục 3.6.

Thuộc tính, quan hệ và multiplicity của `Promotion` và `LoyaltyTransaction` lấy theo `srs.md` mục 3.6. Hai lớp có mặt trong mô hình dù luồng runtime của chúng ngoài bản nộp.

Tùy chọn nhưng nên có: `docs/diagrams/state-order.puml` và `state-order.svg` (state machine của đơn hàng), để nhất quán với yêu cầu "quản lý trạng thái đơn". Đề A1 §9.1 là nguồn tham khảo.

### Kiểm chéo bắt buộc trước khi nghiệm thu

Lập bảng kiểm trong mô tả PR của Task 2 (đề A2 §4.3: "ba loại sơ đồ không mâu thuẫn với SRS, use-case hoặc mô hình dữ liệu"):

| Kiểm | Cách kiểm |
|---|---|
| Tên lớp, thuộc tính, trạng thái trong class diagram | trùng từ ngữ trong `srs.md` và `uc-checkout.md` |
| Trạng thái đơn ở sequence và activity | là tập con của enum trạng thái ở class diagram |
| Ba nhánh lỗi của activity | mỗi nhánh có FR hoặc tiêu chí chấp nhận trong SRS và có luồng ngoại lệ trong `uc-checkout.md` |
| Lifeline sequence | khớp actor của `uc-checkout.md` |
| Idempotency, transaction | có trong sequence **và** có NFR/FR tương ứng; cache API E4a theo chủ đơn/`orderId`/key/`paymentMethod` (BR-05); E8b là rủi ro chấp nhận, không có luồng phục hồi |

### Checklist nghiệm thu Task 2

- [ ] `activity-checkout` có start/end, hành động người dùng/hệ thống, decision/merge, swimlane, **ba nhánh** hết hàng / chưa đăng nhập / thanh toán thất bại (§4.1).
- [ ] `sequence-checkout` có lifeline Customer, Next.js UI, NestJS API, Database, Payment Service và đủ 6 điểm ở trên (§4.2).
- [ ] Có **cả `.puml` và `.svg`** cho mỗi sơ đồ, ví dụ `docs/diagrams/sequence-checkout.puml` và `docs/diagrams/sequence-checkout.svg` (bắt buộc, §4.2).
- [ ] `class-domain` có tối thiểu 7 lớp `User`, `Product`, `Order`, `OrderItem`, `Payment`, `Promotion`, `LoyaltyTransaction`, thuộc tính chính, quan hệ, multiplicity, enum trạng thái (§4.3).
- [ ] **Tiêu chí nghiệm thu:** ba loại sơ đồ không mâu thuẫn với SRS, use-case hoặc mô hình dữ liệu (§4.3); đã kiểm bằng bảng kiểm chéo.
- [ ] Mọi sơ đồ đã nằm trên `develop-Assignment2` qua PR, `.svg` mở được.

---

## Task 3. Thiết kế kiến trúc (đề A2 §5)

**Mục tiêu:** quyết định kiến trúc có lý do, và deployment diagram phản ánh đúng nền tảng thật (đề A2 §5.2).
**Nhánh gợi ý:** `a2/task-3-architecture`.

### Task 3.1 — Mô tả kiến trúc và ADR (đề A2 §5.1)

**Tạo phẩm:** `docs/architecture/architecture.md` và các ADR trong `docs/architecture/adr/`.

`architecture.md` theo C4 (mức 1-2) hoặc kiến trúc phân lớp, phải nêu (đề A2 §5.1):

- frontend Next.js/PWA;
- backend NestJS theo module/domain (gợi ý các module: `auth`, `catalog`, `orders`, `payments`, `health`; chưa cần module `promotions` vì FR-17/18 ngoài bản nộp; nhóm tự chốt);
- PostgreSQL và cơ chế migration;
- dịch vụ thanh toán mô phỏng;
- logging (gợi ý log JSON), health check (`GET /health`), quản lý cấu hình qua biến môi trường;
- lý do chọn kiến trúc, ưu điểm, hạn chế, trade-off.

Mẫu bảng truy vết "container → thành phần → mã nguồn" (để đạt tiêu chí nghiệm thu §5.2; điền thật khi có code):

| Container / dịch vụ (trong deployment diagram) | Thành phần trong `architecture.md` | Mã nguồn |
|---|---|---|
| Web (Next.js/PWA) | mục Web | `apps/web` |
| API (NestJS) | mục API và các module | `apps/api` |
| PostgreSQL | mục Dữ liệu | `apps/api` (migration, seed) |
| Payment mô phỏng | mục Thanh toán | `apps/api` (module payments) hoặc dịch vụ riêng |
| CI/CD, registry | mục Triển khai | `.github/workflows` |

**ADR** (đề A2 §5.1: mỗi quyết định quan trọng một ADR ngắn trong `docs/architecture/adr`). Mẫu ADR và quy ước đặt tên: [`docs/architecture/adr/README.md`](../architecture/adr/README.md). Đề xuất 5 ADR; câu hỏi mỗi ADR phải trả lời:

| File | Câu hỏi quyết định |
|---|---|
| `001-monorepo.md` | Vì sao một repo cho `apps/web` và `apps/api`? Chia sẻ gì, tách gì? Hệ quả cho CI |
| `002-layered-nestjs.md` | Chia module theo domain thế nào? Phân lớp controller / service / data access ra sao? Payment mô phỏng nằm trong API hay tách riêng? |
| `003-prisma-migrations.md` | ORM nào, quản lý migration và seed thế nào để "tái tạo được database" (đề A2 §7.2), chính sách migration an toàn khi deploy |
| `004-hosting-vercel-render.md` | Nền tảng production và rủi ro đã biết; chờ SHA qua `/health` trước smoke test; chốt ngày tạo/hết hạn DB so với lịch chấm (mục E) |
| `005-idempotency-and-optimistic-lock.md` | Idempotency-Key ở API, replay theo chủ đơn/`orderId`/key/`paymentMethod` (BR-05); simulator không lưu trạng thái, E8b là rủi ro chấp nhận (SRS mục 3.4); cập nhật tồn kho có điều kiện trong transaction; phương án đã loại |

### Task 3.2 — Deployment diagram (đề A2 §5.2)

**Tạo phẩm:** `docs/architecture/deployment.puml` và `deployment.svg` (UML deployment diagram cho production).

Đề A2 §5.2 đòi sơ đồ tối thiểu thể hiện, và với nền tảng đề xuất ở mục E thì đối chiếu như sau:

| Phải thể hiện (đề A2 §5.2) | Với phương án Vercel + Render + GHCR |
|---|---|
| Thiết bị người dùng chạy trình duyệt/PWA | Browser/PWA |
| Dịch vụ/CDN phục vụ Next.js | Vercel (edge/CDN) |
| Container/dịch vụ chạy NestJS API | Render Web Service chạy container, image kéo từ GHCR |
| PostgreSQL có persistent storage | Render Postgres có disk |
| Container registry và nền tảng triển khai | GHCR và GitHub Actions |
| HTTPS, kết nối nội bộ, cổng | Browser → Vercel và Browser → API qua HTTPS; API → DB qua internal URL; cổng API và 5432 |
| Secret/biến môi trường, health check, log | GitHub Secrets, Vercel env, Render env; health check `/health`; log ở Render |
| Ranh giới local / CI / production | ba vùng (boundary) trên sơ đồ: Local (compose), CI (GitHub Actions), Production |

Đề yêu cầu sơ đồ **phản ánh đúng nền tảng thực tế**. Nếu nhóm đổi nền tảng ở ADR 004 thì phải vẽ lại sơ đồ cho khớp.

### Checklist nghiệm thu Task 3

- [ ] `architecture.md` nêu frontend Next.js/PWA, backend NestJS theo module, PostgreSQL + migration, thanh toán mô phỏng, logging, health check, cấu hình; có lý do chọn, ưu điểm, hạn chế, trade-off (§5.1).
- [ ] Thư mục `docs/architecture/adr` có ADR ngắn cho từng quyết định quan trọng, ví dụ `001-monorepo.md` (§5.1).
- [ ] `deployment` có `.puml` và `.svg`, thể hiện đủ 8 mục ở bảng trên (§5.2).
- [ ] Sơ đồ khớp nền tảng nhóm **thực sự** dùng (§5.2).
- [ ] **Tiêu chí nghiệm thu:** mỗi container/dịch vụ trong deployment diagram truy vết được tới một thành phần trong `architecture.md` và tới mã nguồn (§5.2). Bảng truy vết ở trên đã điền (các dòng mã nguồn điền ở Task 5).
- [ ] Mọi tạo phẩm đã nằm trên `develop-Assignment2` qua PR.

---

## Task 4. Triển khai Sprint 1 (đề A2 §6)

> **Sprint Goal (đề A2 §6):** tạo nền tảng kỹ thuật, tài liệu có kiểm soát phiên bản và một MVP đầu tiên chạy được cho luồng xem menu.

Chỉ bắt đầu merge code khi Task 1-3 đã qua cổng (mục B.4).

### Task 4.1 — Thiết lập repository (đề A2 §6.1)

**Nhánh gợi ý:** `a2/task-4-1-repo-setup`.

| Tạo phẩm | Ghi chú |
|---|---|
| `apps/web`, `apps/api`, `docs` | khung đã có; thay `README.md` khung bằng dự án Next.js / NestJS thật khi nhóm khởi tạo |
| `README.md` | gốc; mục lục chạy local, test, build, deploy, rollback sẽ hoàn thiện ở Task 5.4; link board và link tới kế hoạch này |
| `.gitignore` | `node_modules`, `.env`, build output, `.next`, `dist`, `coverage` |
| `.env.example` | liệt kê **tên** biến, không có giá trị thật: `DATABASE_URL`, `JWT_SECRET`, `NEXT_PUBLIC_API_URL`, ... |
| `CONTRIBUTING.md` | chiến lược nhánh và PR (mục B), quy ước commit, **Definition of Done**, quyền review (đề A2 §6.1) |
| Board / Product Backlog | GitHub Projects có Sprint 1 và Sprint 2 (mục F làm điểm xuất phát); mỗi item gắn mã task và `FR-xx` |
| Quyền truy cập | thêm giảng viên vào repository (đề A2 §9.1) |

Definition of Done (nhóm chốt, ví dụ): PR đã review, CI xanh, có test cho phần mới, tài liệu và ma trận truy vết đã cập nhật, không có secret trong diff.

### Task 4.2 — Quản lý tài liệu (đề A2 §6.2)

Đưa toàn bộ tạo phẩm Task 1-3 vào `docs` (đã làm khi merge Task 1-3). Từ đây, **mọi thay đổi** yêu cầu, sơ đồ, kiến trúc đi qua commit/PR và ghi rõ lý do trong mô tả PR.

Minh chứng: lịch sử `git log -- docs/requirements docs/diagrams docs/architecture` cho thấy nhiều commit qua PR có mô tả lý do.

### Task 4.3 — MVP Sprint 1 (đề A2 §6.3)

**Nhánh gợi ý:** `a2/task-4-3-api-products`, `a2/task-4-3-menu-ui`.

| Hạng mục (đề A2 §6.3) | Tạo phẩm gợi ý |
|---|---|
| API `GET /products` và `GET /products/:id` | module trong `apps/api`, trả 404 khi không có sản phẩm |
| Dữ liệu mẫu / database seed | migration và seed trong `apps/api`; chạy lại được trên DB trống |
| Màn menu mobile-first (Next.js) | trong `apps/web`, gọi API thật |
| Trạng thái loading, empty, error | mỗi trạng thái có giao diện và có test |
| Kiểm thử tối thiểu | test API (gợi ý Jest + supertest) và test component/luồng chính (gợi ý Vitest + Testing Library) |

MVP là phiên bản nhỏ nhất **chạy được** (đề A2 §6.3), không phải mockup tĩnh. Mỗi chức năng ghi vào cột Code/API và Test của ma trận truy vết (mục C).

### Task 4.4 — Continuous Integration (đề A2 §6.4)

**Nhánh gợi ý:** `a2/task-4-4-ci`.

**Tạo phẩm:** `.github/workflows/ci.yml`.

- Trigger: `pull_request` (vào `develop-Assignment2`).
- Thứ tự bước: **Install → Lint → Unit Test → Build** (đề A2 §6.4), chạy cho cả `apps/api` và `apps/web`.
- Unit test trong CI không cần DB thật; integration test với Postgres thêm ở Task 5.2.
- Bật branch protection như mục B.2 (status check `ci` bắt buộc).

**Minh chứng bắt buộc (đề A2 §6.4):**

1. Link PR đã chạy CI.
2. Một lần pipeline **thành công** (ảnh hoặc log).
3. Một lần pipeline **phát hiện lỗi** (ảnh hoặc log): tạo PR thử trên nhánh `a2/ci-demo-fail` cố ý làm lint hoặc test đỏ, chụp ảnh, giữ PR ở trạng thái đóng, không merge.

Lưu minh chứng trong `docs/evidence/ci/` (đường dẫn gợi ý) và dẫn link trong `README.md`.

### Checklist nghiệm thu Task 4

- [ ] Repository có cấu trúc `apps/web`, `apps/api`, `docs` (§6.1).
- [ ] Có chiến lược branch và PR, `README.md`, `.gitignore`, `.env.example`, quy ước commit và Definition of Done (§6.1).
- [ ] Có issue board / Product Backlog cho Sprint 1 và Sprint 2 (§6.1).
- [ ] Tạo phẩm Task 1-3 nằm trong `docs`; thay đổi yêu cầu/sơ đồ/kiến trúc đều qua commit/PR có lý do (§6.2).
- [ ] `GET /products` và `GET /products/:id` chạy được, có seed (§6.3).
- [ ] Menu mobile-first có loading, empty, error (§6.3).
- [ ] Có test tối thiểu cho API và component/luồng chính (§6.3).
- [ ] `ci.yml` chạy tự động khi mở PR: Install → Lint → Unit Test → Build (§6.4).
- [ ] **Bắt buộc:** PR không merge được nếu lint, test hoặc build thất bại (§6.4); đã bật branch protection.
- [ ] **Minh chứng:** link PR đã chạy CI, một lần pipeline xanh và một lần bắt lỗi (§6.4).
- [ ] Sprint 1 Review đã ghi; tag `a2-v0.1.0`.

---

## Task 5. Triển khai Sprint 2, CI/CD và Delivery (đề A2 §7)

> **Sprint Goal (đề A2 §7):** hoàn thành luồng end-to-end, tự động hóa đóng gói và triển khai một phiên bản production có thể truy cập được.

### Task 5.1 — Hoàn thiện MVP (đề A2 §7.1)

**Nhánh gợi ý:** `a2/task-5-1-product-detail-cart`, `a2/task-5-1-auth`, `a2/task-5-1-orders-payments`, `a2/task-5-1-history`.

| Hạng mục (đề A2 §7.1) | Nơi hiện thực | Ghi chú |
|---|---|---|
| Chi tiết sản phẩm, size, topping | `apps/web`, `apps/api` | giá theo tùy chọn; server tính lại giá, không tin giá từ client |
| Giỏ hàng, tính tổng tiền | `apps/web` | |
| Đăng ký, đăng nhập, JWT | `apps/web`, `apps/api` | băm mật khẩu, guard bảo vệ route đặt đơn |
| Tạo đơn hàng | `apps/api` | transaction tạo đơn và trừ tồn kho (khớp sequence) |
| Thanh toán Ví/Thẻ mô phỏng | `apps/api` | idempotency; thành công/thất bại; không áp khuyến mãi, không ghi điểm (FR-17/18 ngoài bản nộp) |
| Xác nhận, trạng thái, lịch sử đơn | `apps/web`, `apps/api` | FR-20, FR-21, FR-22; khách hủy đơn chưa thanh toán, hoàn tồn kho (FR-25, Could: làm nếu còn thời gian) |
| Đổi trạng thái đơn bởi Barista | `apps/api`, Postman collection | `GET /orders/:id`, `PATCH /orders/:id` theo state machine (FR-23, FR-24); collection kèm hướng dẫn lấy token Barista demo và chạy đủ `PAID → PREPARING → READY → COMPLETED` (AC-F24.4); gợi ý lưu ở `docs/postman/` |
| Xử lý lỗi và validate ở frontend **và** backend | cả hai | thông báo lỗi dễ hiểu |

Mỗi chức năng phải khớp SRS, sơ đồ và được ghi vào ma trận truy vết. Khác biệt có chủ đích với A1 ở mục D.

### Task 5.2 — Tích hợp và kiểm thử (đề A2 §7.2)

**Nhánh gợi ý:** `a2/task-5-2-tests`, `a2/task-5-2-compose-health`.

| Hạng mục (đề A2 §7.2) | Tạo phẩm gợi ý |
|---|---|
| Unit test cho nghiệp vụ quan trọng | cạnh code trong `apps/api`: state machine đơn hàng (49 cặp: 8 hợp lệ, 41 bị từ chối, AC-F23.1), tính giá theo size/topping |
| Integration test API tạo đơn/thanh toán | `tests/integration/` chạy với Postgres thật; trong CI dùng service container; có test gửi lại cùng key (AC-F16.1) và đặt đồng thời (AC-F13.3) |
| Ít nhất một E2E từ menu đến xác nhận đơn | `tests/e2e/` (gợi ý Playwright) |
| Migration/seed tái tạo được database | chạy `migrate` + seed trên DB trống ra cùng một kết quả |
| `docker-compose.yml` chạy web, API, database ở local | gốc repo; kèm `Dockerfile` cho `apps/web`, `apps/api` |
| Health endpoint | `GET /health` kiểm kết nối DB, trả 200/503 theo AC-N15.1–2 |

Test phải bám tiêu chí chấp nhận trong SRS: mỗi mã test (`API-Txx`, `INT-Txx`, `E2E-Txx`, `UNIT-Txx`) xuất hiện trong ma trận truy vết. Cập nhật `ci.yml` để chạy thêm integration test.

### Task 5.3 — Continuous Delivery/Deployment (đề A2 §7.3)

**Nhánh gợi ý:** `a2/task-5-3-cd`.

**Tạo phẩm:** `.github/workflows/cd.yml`, chạy khi có tag `a2-v*`.

Chuỗi bắt buộc (đề A2 §7.3): **Push/Tag → Lint và Test → Build Docker Image → Push Registry → Deploy → Smoke Test**. Đối chiếu từng yêu cầu của pipeline:

| # | Yêu cầu của đề A2 §7.3 | Cách làm đề xuất |
|---|---|---|
| 1 | Quality gate: lint, test, build | job đầu tiên; các job sau `needs:` job này |
| 2 | Image gắn tag bằng commit SHA hoặc semver | tag `${{ github.sha }}` và tag semver lấy từ tag git |
| 3 | Push image lên registry | push lên GHCR bằng `GITHUB_TOKEN` (quyền `packages: write`) |
| 4 | Deploy vào production bằng secret của CI | API: gọi Render deploy hook với `imgURL` trỏ tới image SHA, kiểm lỗi HTTP; 200/202 chỉ là đã nhận/bắt đầu hoặc xếp hàng deploy, phải chờ ở dòng 6. Web: `vercel deploy --prebuilt --prod` với `VERCEL_TOKEN`, đợi lệnh hoàn tất thành công; tắt auto-deploy từ Git trên Vercel để pipeline nắm quyền triển khai |
| 5 | Migration an toàn | `prisma migrate deploy` (hoặc tương đương) trong lệnh khởi động container; chỉ dùng migration **cộng thêm** (thêm bảng/cột nullable), không xóa/đổi tên cột trong cùng lần phát hành, để rollback image vẫn chạy được với schema mới |
| 6 | Health check/smoke test sau deploy | Sau khi deploy API và web, smoke `/health` (200, `database=up`), `GET /products` và trang web; mỗi bước retry tới khi 200, tối đa 10 phút chống ngủ đông; hết hạn thì pipeline đỏ (AC-N18.2) |
| 7 | Dừng pipeline và có cách rollback khi lỗi | step lỗi làm job thất bại; ghi cách rollback trong `docs/deployment.md` (xem dưới) |

Quy tắc cho secret (đề A2 §7.4): chỉ nằm ở GitHub Secrets, biến môi trường Vercel và Render. Không in secret ra log CI (không `echo` biến, không bật debug in env). Gợi ý tên secret của GitHub: `RENDER_DEPLOY_HOOK_URL`, `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `PROD_API_URL`, `PROD_WEB_URL`.

Smoke test chỉ chờ HTTP 200, không so SHA qua `/health` (SRS mục 1.4, thay đổi (7)). Chạy CD tuần tự cho cùng môi trường production để hai tag không deploy chồng nhau. Xác nhận hành vi hook: [Render Deploy Hooks](https://render.com/docs/deploy-hooks), kiểm tra ngày 2026-10-16.

**Rollback (viết vào `docs/deployment.md` và README):**

- API: deploy lại image có tag SHA của bản trước qua deploy hook (hoặc re-deploy image cũ ở Render), rồi chạy lại smoke test theo AC-N18.2; không cần đổi DB nếu migration chỉ cộng thêm.
- Web: `vercel rollback` về deployment trước, hoặc promote deployment cũ.
- Thực hành rollback API và web ít nhất một lần; ghi SHA/deployment trước và sau, kết quả chờ đúng phiên bản cùng smoke test vào `docs/evidence/` và dẫn link trong `docs/deployment.md` (AC-N18.3).
- Lỗi do dữ liệu/migration: quy trình khôi phục từ backup, nêu rõ giới hạn của gói free.

### Task 5.4 — Triển khai và bàn giao (đề A2 §7.4)

**Nhánh gợi ý:** `a2/task-5-4-delivery`.

| Sản phẩm bàn giao (đề A2 §7.4) | Tạo phẩm / nơi ghi |
|---|---|
| URL frontend production, HTTPS | `README.md` mục "Production" |
| URL API và health check | `README.md`, ví dụ `https://<api>/health` |
| Database production không public trực tiếp | cấu hình ở nền tảng + ghi trong `docs/deployment.md` và `deployment.svg` |
| Secret không xuất hiện trong repo/log CI | rà `git log -p`, rà log các run CI/CD |
| Release/tag và release notes | GitHub Release `a2-v1.0.0`, release notes liệt kê chức năng, thay đổi, vấn đề đã biết |
| README hướng dẫn local, test, build, deploy, rollback | `README.md` gốc; chi tiết triển khai ở `docs/deployment.md` |
| Video/demo trực tiếp luồng end-to-end | link video trong `README.md` (đề A2 §7.4 chấp nhận video hoặc demo trực tiếp) |
| Sprint Review và Sprint Retrospective | `docs/sprint/sprint-2-review-retro.md` (và Sprint 1) |
| Link repo + quyền truy cập cho giảng viên | đề A2 §9.1 |

**Tiêu chí nghiệm thu (đề A2 §7.4):** một người ngoài nhóm clone repository, chạy theo README và truy cập được production từ các URL cung cấp. Cách kiểm: nhờ một bạn ngoài nhóm làm thử trên máy sạch, ghi lỗi gặp phải và sửa README.

### Checklist nghiệm thu Task 5

- [ ] 5.1: có chi tiết sản phẩm size/topping; giỏ hàng + tổng tiền; đăng ký/đăng nhập/JWT; tạo đơn; thanh toán Ví/Thẻ mô phỏng; xác nhận, trạng thái, lịch sử đơn; validate ở frontend/backend.
- [ ] 5.1 (theo SRS): Barista đổi trạng thái qua `PATCH /orders/:id`, có Postman collection chạy được (AC-F24.4); khách hủy đơn chưa thanh toán (FR-25) là tùy chọn (Could).
- [ ] 5.2: unit test nghiệp vụ quan trọng; integration test tạo đơn/thanh toán; ít nhất một E2E từ menu đến xác nhận đơn; migration/seed tái tạo DB; `docker-compose.yml` chạy web + API + DB; `GET /health`.
- [ ] 5.3: pipeline thể hiện Push/Tag → Lint và Test → Build Docker Image → Push Registry → Deploy → Smoke Test; đủ 7 yêu cầu ở bảng trên.
- [ ] 5.3 (theo SRS): chờ `/health` đúng SHA và DB up trước smoke; đã thử rollback một lần, kiểm SHA bản trước và smoke test đạt, có minh chứng (AC-N18.2–3).
- [ ] 5.4: URL frontend HTTPS; URL API + health; DB không public; secret không lộ; release/tag + release notes; README đủ local/test/build/deploy/rollback; video/demo; Sprint Review + Retrospective.
- [ ] **Tiêu chí nghiệm thu:** người ngoài nhóm clone, chạy theo README, và truy cập production (§7.4).
- [ ] URL production **còn sống** vào ngày chấm (đề A2 §8.1); đã kiểm lại ngày trước hạn.

---

## C. Truy vết (đề A2 §8)

**Tạo phẩm (bắt buộc):** `docs/traceability-matrix.md`, theo mẫu đề A2 §8.1:

| Mã yêu cầu | Use-case/User Story | Thiết kế/Sơ đồ | Code/API | Test |
|---|---|---|---|---|
| FR-01 | US-01 Xem menu | Activity-01, Class-01 | `GET /products` | API-T01 |
| FR-05 | UC-01 Thanh toán | Sequence-01 | `POST /payments` | INT-T03 |

(Hai dòng trên là mẫu của đề, không phải dữ liệu của nhóm.)

### Cách điền dần theo task

| Thời điểm | Cột điền | Việc làm |
|---|---|---|
| Cuối Task 1 | Mã yêu cầu, Use-case/User Story | mỗi `FR-xx` có use-case hoặc user story; có `NFR-xx` thì ghi kiểu đo |
| Cuối Task 2 | Thiết kế/Sơ đồ | ghi sơ đồ và phần tử (lớp, bước sequence, nhánh activity) liên quan, đặt mã `Activity-01`, `Sequence-01`, `Class-01` |
| Task 4-5, mỗi PR | Code/API, Test | PR thêm chức năng thì thêm đường dẫn / endpoint và mã test vào ma trận trong cùng PR |
| Cuối Task 3 và 5 | Thiết kế/Sơ đồ (kiến trúc) | thêm dòng cho NFR triển khai trỏ tới ADR, `deployment.svg`, workflow |

### Quy tắc kiểm

- Mọi `FR-xx` Must có ít nhất một dòng đầy đủ 5 cột trước khi kết thúc Task 5. Won't thì ghi "không thực hiện" kèm lý do trong SRS.
- Mọi endpoint của `apps/api` xuất hiện trong ma trận. Mọi mã test trong ma trận tồn tại thật trong `apps/` hoặc `tests/`.
- Dùng quy ước đánh mã test: `UNIT-Txx`, `API-Txx`, `INT-Txx`, `E2E-Txx`.
- Cuối mỗi Sprint, một người chạy rà soát hai chiều: yêu cầu → test, và test → yêu cầu; ghi kết quả vào mô tả PR.
- Nhắc lại quy tắc của đề A2 §8.1: thiếu tạo phẩm bắt buộc của task trước thì task sau mất điểm truy vết.

---

## D. Khác biệt có chủ đích giữa A2 và A1

Ghi ở đây để nhóm không chép nhầm từ `develop`.

| Khía cạnh | A1 (`develop`) | A2 (`develop-Assignment2`) |
|---|---|---|
| Thư mục | `backend/`, `frontend/` | `apps/api`, `apps/web` (đề A2 §9) |
| Thực thể dữ liệu | 5 thực thể; mã `BREWLITE10` viết cứng trong code; điểm thưởng là cột của `User` | 7 lớp domain; `Promotion` và `LoyaltyTransaction` là lớp/bảng riêng (đề A2 §4.3) |
| Hạ tầng | chỉ `docker-compose` local | có `GET /health`, CI (PR) và CD (tag), PWA, production có URL (đề A2 §5-§7) |
| Phạm vi | mở rộng Barista/Admin (UC08–UC16) | không có màn Admin hay màn quầy; quản lý trạng thái đơn là Must, Barista gọi API bằng Postman (FR-23, FR-24; FR-25 Could); không khuyến mãi, điểm thưởng, hoàn tiền |
| Tài liệu UML | sequence cho nhiều UC, use-case 2 bản | 3 sơ đồ bắt buộc cho 1 use-case trọng tâm + deployment + use-case tổng quát (đề A2 §3-§5) |
| Code | do nhóm và công cụ hỗ trợ viết | **nhóm tự viết**, không vibecoding |
| Nội dung của sơ đồ | lifeline gồm Guest/Customer, Frontend, Backend, Mock Gateway, DB | lifeline đề A2 §4.2: Customer, Next.js UI, NestJS API, Database, Payment Service |
| Quy trình | nhánh `feat/...`, merge vào `develop` | nhánh `a2/task-<n>-<tên>` qua PR, branch protection, tag `a2-v*` |

---

## E. Nền tảng triển khai: Vercel (web) + Render (API và Postgres) + GHCR

Đây là đề xuất (người dùng nghiêng về Vercel). Nhóm chốt lại bằng ADR `004-hosting-vercel-render.md` ở Task 3.

### E.1 Lý do chọn

Vercel hợp với Next.js: có CDN, HTTPS và preview sẵn, đúng ý "dịch vụ/CDN phục vụ Next.js" của đề A2 §5.2. Nhưng dùng Vercel cho **cả** hệ thống thì lệch đề ở 3 điểm:

1. **Chuỗi Docker.** Đề A2 §7.3 bắt buộc *Build Docker Image → Push Registry → Deploy*. Vercel không chạy container: API NestJS sẽ thành serverless function, nên image build ra không được dùng ở đâu, và deployment diagram không khớp thực tế (đề A2 §5.2 đòi đúng nền tảng thật).
2. **Serverless và Prisma.** Cold start và giới hạn thời gian chạy; kết nối DB dễ cạn pool, cần thêm connection pooler.
3. **DB không public.** Postgres trên Vercel Marketplace (Neon, Supabase...) là endpoint public mặc định, trong khi đề A2 §7.4 yêu cầu "database production không public trực tiếp".

Render chạy container lấy image từ GHCR và có Postgres managed. Để trống IP allowlist thì DB chỉ nối được qua internal URL. Cả hai nền tảng đều có gói free.

### E.2 Sơ đồ khối

```text
Browser/PWA --HTTPS--> Vercel (CDN, Next.js)
Browser/PWA --HTTPS--> Render Web Service (container NestJS, image từ GHCR)
Render Web Service --internal URL--> Render Postgres (disk, không public)
GitHub Actions --push image--> GHCR --image SHA--> Render (deploy hook)
GitHub Actions --vercel deploy --prebuilt--> Vercel
```

### E.3 Rủi ro cần ghi vào ADR 004

| Rủi ro | Hệ quả | Cách xử lý |
|---|---|---|
| Postgres free của Render hết hạn sau khoảng 30 ngày | mất DB lúc chấm | ADR 004 ghi ngày tạo DB, ngày hết hạn theo nền tảng và lịch chấm; bảo đảm DB còn hạn hết đợt chấm, nếu không thì tạo lại/seed hoặc chuyển gói trước ngày hết hạn; kiểm tra lại chính sách hiện hành của Render |
| Web service free ngủ sau 15 phút không có request | request đầu chậm hoặc timeout; smoke test có thể hỏng giả | smoke test có retry tới khoảng 2 phút; bật request "đánh thức" trước buổi demo/chấm |
| `NEXT_PUBLIC_API_URL` nhúng lúc build | đổi URL API phải build lại web | đặt là biến env của Vercel cho môi trường production; deploy `--prebuilt` dùng đúng giá trị |
| Image trên GHCR là private | Render không kéo được | cấp credential cho registry ở Render, hoặc đặt package public (không chứa secret) |
| CORS giữa web (Vercel) và API (Render) | trình duyệt chặn request | cấu hình origin được phép qua biến env của API |
| Điều khoản free tier thay đổi | kế hoạch lệch thực tế | đọc trang giá/điều khoản của nền tảng ngay khi chốt ADR; ghi ngày kiểm tra |

### E.4 Phương án dự phòng

Nếu nhóm đổi nền tảng (Railway, Fly.io, VPS...), giữ nguyên các yêu cầu: có container chạy API, registry, DB không public, HTTPS, health check. Vẽ lại `deployment.svg` và viết lại `docs/deployment.md` cho khớp.

---

## F. Backlog gợi ý cho Sprint 1 và Sprint 2

Gợi ý để tạo board ở Task 4.1; cột phụ trách, ngày, ước lượng do nhóm điền. Mốc ngày: `[nhóm điền]`.

| ID | Giai đoạn | Hạng mục | Task đề A2 | Phụ thuộc | Phụ trách | Ước lượng |
|---|---|---|---|---|---|---|
| B-01 | Chuẩn bị | `context-and-scope.md` | 1.1 | — | [nhóm điền] | [nhóm điền] |
| B-02 | Chuẩn bị | `srs.md` + use-case tổng quát | 1.2 | B-01 | [nhóm điền] | [nhóm điền] |
| B-03 | Chuẩn bị | `uc-checkout.md` + diagram | 1.3 | B-02 | [nhóm điền] | [nhóm điền] |
| B-04 | Chuẩn bị | Activity diagram | 2.1 | B-03 | [nhóm điền] | [nhóm điền] |
| B-05 | Chuẩn bị | Sequence diagram | 2.2 | B-03 | [nhóm điền] | [nhóm điền] |
| B-06 | Chuẩn bị | Class diagram (+ state order) | 2.3 | B-02 | [nhóm điền] | [nhóm điền] |
| B-07 | Chuẩn bị | `architecture.md` + ADR 001-003, 005 | 3.1 | B-04..B-06 | [nhóm điền] | [nhóm điền] |
| B-08 | Chuẩn bị | ADR 004 + `deployment.puml` | 3.2 | B-07 | [nhóm điền] | [nhóm điền] |
| B-09 | Sprint 1 | Khởi tạo `apps/web`, `apps/api`, `.gitignore`, `.env.example`, `CONTRIBUTING.md` (DoD, commit) | 4.1 | B-08 | [nhóm điền] | [nhóm điền] |
| B-10 | Sprint 1 | Board Product Backlog + quyền cho giảng viên | 4.1 | B-09 | [nhóm điền] | [nhóm điền] |
| B-11 | Sprint 1 | `GET /products`, `GET /products/:id`, migration, seed, test API | 4.3 | B-09 | [nhóm điền] | [nhóm điền] |
| B-12 | Sprint 1 | Màn menu mobile-first + loading/empty/error + test component | 4.3 | B-11 | [nhóm điền] | [nhóm điền] |
| B-13 | Sprint 1 | `ci.yml` + branch protection + minh chứng PR xanh/đỏ | 4.4 | B-11 hoặc B-12 | [nhóm điền] | [nhóm điền] |
| B-14 | Sprint 1 | Ma trận truy vết cập nhật; Sprint 1 Review + Retro; tag `a2-v0.1.0` | 4.2, 8.1 | B-11..B-13 | [nhóm điền] | [nhóm điền] |
| B-15 | Sprint 2 | Chi tiết sản phẩm: size, topping | 5.1 | B-12 | [nhóm điền] | [nhóm điền] |
| B-16 | Sprint 2 | Giỏ hàng + tổng tiền | 5.1 | B-15 | [nhóm điền] | [nhóm điền] |
| B-17 | Sprint 2 | Đăng ký, đăng nhập, JWT (web + api) | 5.1 | B-09 | [nhóm điền] | [nhóm điền] |
| B-18 | Sprint 2 | Tạo đơn (transaction, tồn kho) | 5.1 | B-16, B-17 | [nhóm điền] | [nhóm điền] |
| B-19 | Sprint 2 | Thanh toán mô phỏng + idempotency | 5.1 | B-18 | [nhóm điền] | [nhóm điền] |
| B-20 | Sprint 2 | Xác nhận, trạng thái, lịch sử đơn; khách hủy đơn chưa thanh toán (FR-25, Could: làm nếu còn thời gian) | 5.1 | B-19 | [nhóm điền] | [nhóm điền] |
| B-30 | Sprint 2 | Barista đổi trạng thái `PATCH /orders/:id` + Postman collection (FR-23, FR-24) | 5.1 | B-19 | [nhóm điền] | [nhóm điền] |
| B-21 | Sprint 2 | Unit test (state machine, giá) | 5.2 | B-19, B-30 | [nhóm điền] | [nhóm điền] |
| B-22 | Sprint 2 | Integration test tạo đơn/thanh toán (Postgres) + CI | 5.2 | B-19 | [nhóm điền] | [nhóm điền] |
| B-23 | Sprint 2 | E2E menu → xác nhận đơn | 5.2 | B-20 | [nhóm điền] | [nhóm điền] |
| B-24 | Sprint 2 | `docker-compose.yml`, Dockerfile, `GET /health`, log JSON | 5.2 | B-19 | [nhóm điền] | [nhóm điền] |
| B-25 | Sprint 2 | Dựng Render (API + Postgres), Vercel (web), secrets | 5.3, 5.4 | B-24 | [nhóm điền] | [nhóm điền] |
| B-26 | Sprint 2 | `cd.yml` (build, push GHCR, deploy, smoke, rollback) | 5.3 | B-25 | [nhóm điền] | [nhóm điền] |
| B-27 | Sprint 2 | `docs/deployment.md`, README đủ local/test/build/deploy/rollback | 5.4 | B-26 | [nhóm điền] | [nhóm điền] |
| B-28 | Sprint 2 | Release `a2-v1.0.0` + release notes, kiểm tra người ngoài nhóm, video demo | 5.4 | B-27 | [nhóm điền] | [nhóm điền] |
| B-29 | Sprint 2 | Hoàn tất ma trận truy vết, Sprint 2 Review + Retro | 8.1, 5.4 | B-28 | [nhóm điền] | [nhóm điền] |

Ghi chú:

- "Chuẩn bị" gồm Task 1-3 (tài liệu), phải qua cổng trước khi merge code Task 4 (mục B.4). Đề A2 §6 coi tài liệu có kiểm soát phiên bản là một phần của Sprint 1.
- Ước lượng (điểm hoặc giờ) do nhóm chấm bằng planning poker; kế hoạch này không áp điểm.

---

## G. Bảng phủ: yêu cầu đề A2 → mục trong kế hoạch

Mọi tạo phẩm bắt buộc của đề A2 §1-§9 và checklist §9.1 đều được ánh xạ dưới đây. Cột "Tạo phẩm" là đường dẫn dự kiến trên repo.

### G.1 Tổng quan và quy trình (§1-§2)

| Yêu cầu đề A2 | § | Mục kế hoạch | Tạo phẩm / bằng chứng |
|---|---|---|---|
| Tiếp tục đề tài BrewLite, đi từ yêu cầu tới triển khai | 1 | A.1 | toàn bộ repo |
| Làm 5 task tuần tự, task sau chỉ nghiệm thu khi task trước có trên repo + lịch sử commit | 1 | A.2, B.4 | lịch sử `git log`, PR đã merge |
| Next.js mobile-first/PWA; NestJS; PostgreSQL (không thay) | 1.1 | A.3, Task 4, Task 5 | `apps/web`, `apps/api` |
| Luồng: xem menu → chọn tùy chọn → giỏ → đặt đơn → thanh toán → theo dõi đơn | 1.1 | Task 1.1, Task 5.1 | `context-and-scope.md`, `apps/` |
| 5 task với bảng điểm 2+2+2+2+2 | 2 | Task 1-5 | các checklist nghiệm thu |

### G.2 Task 1 (§3)

| Yêu cầu đề A2 | § | Mục kế hoạch | Tạo phẩm |
|---|---|---|---|
| Vấn đề nghiệp vụ | 3.1 | Task 1.1 | `docs/requirements/context-and-scope.md` |
| 6 stakeholder + mục tiêu, kỳ vọng | 3.1 | Task 1.1 | `context-and-scope.md` (bảng stakeholder) |
| Phạm vi MVP, mở rộng, không thực hiện | 3.1 | Task 1.1 | `context-and-scope.md` (in-scope, out-of-scope) |
| Giả định, ràng buộc, rủi ro ban đầu | 3.1 | Task 1.1, H | `context-and-scope.md` |
| **Bắt buộc:** `context-and-scope.md` có bảng stakeholder, in-scope, out-of-scope, giả định, ràng buộc | 3.1 | Task 1.1 | `context-and-scope.md` |
| `FR-xx` | 3.2 | Task 1.2 | `docs/requirements/srs.md` |
| `NFR-xx` | 3.2 | Task 1.2 | `srs.md` |
| MoSCoW | 3.2 | Task 1.2 | `srs.md` |
| Tiêu chí chấp nhận kiểm chứng được cho từng yêu cầu | 3.2 | Task 1.2 | `srs.md` |
| Use-case diagram tổng quát toàn hệ thống | 3.2 | Task 1.2 | `docs/requirements/use-case-overview.puml/.svg` |
| 12 nhóm yêu cầu tối thiểu | 3.2 | Task 1.2 (bảng 12 nhóm) | `srs.md` |
| Chọn use-case trọng tâm (khuyến nghị Đặt và thanh toán đơn hàng) | 3.3 | Task 1.3 | `docs/requirements/uc-checkout.md` |
| Use-case diagram cho phạm vi use-case đã chọn | 3.3 | Task 1.3 | `uc-checkout.puml/.svg` |
| Actor, trigger, tiền/hậu điều kiện | 3.3 | Task 1.3 | `uc-checkout.md` |
| Luồng chính, thay thế, ngoại lệ | 3.3 | Task 1.3 | `uc-checkout.md` |
| Liên kết use-case với mã yêu cầu | 3.3 | Task 1.3, C | `uc-checkout.md`, `docs/traceability-matrix.md` |
| Tiêu chí nghiệm thu: làm gì / không làm gì, viết test từ AC | 3.3 | Checklist Task 1 | toàn bộ `docs/requirements/` |

### G.3 Task 2 (§4)

| Yêu cầu đề A2 | § | Mục kế hoạch | Tạo phẩm |
|---|---|---|---|
| Activity: start/end, hành động người dùng/hệ thống, decision/merge, swimlane | 4.1 | Task 2.1 | `docs/diagrams/activity-checkout.puml/.svg` |
| Activity: hết hàng, chưa đăng nhập, thanh toán thất bại | 4.1 | Task 2.1 | `activity-checkout` |
| Sequence cho use-case của Task 1.3, lifeline Customer / Next.js UI / NestJS API / Database / Payment Service | 4.2 | Task 2.2 | `docs/diagrams/sequence-checkout.puml/.svg` |
| Sequence: request/response, thứ tự gọi API | 4.2 | Task 2.2 | `sequence-checkout` |
| Sequence: kiểm tra JWT và validate | 4.2 | Task 2.2 | `sequence-checkout` |
| Sequence: transaction tạo đơn và cập nhật tồn kho | 4.2 | Task 2.2 | `sequence-checkout` |
| Sequence: `alt` thanh toán thành công/thất bại | 4.2 | Task 2.2 | `sequence-checkout` |
| Sequence: idempotency khi gửi lại yêu cầu thanh toán | 4.2 | Task 2.2 | `sequence-checkout` |
| Sequence: thông báo kết quả cuối cùng | 4.2 | Task 2.2 | `sequence-checkout` |
| **Bắt buộc:** lưu cả tệp nguồn và ảnh kết xuất (`.puml` + `.svg`) | 4.2 | Task 2 (quy tắc lưu) | mọi sơ đồ trong `docs/diagrams/` |
| Class: 7 lớp `User`, `Product`, `Order`, `OrderItem`, `Payment`, `Promotion`, `LoyaltyTransaction` | 4.3 | Task 2.3 | `docs/diagrams/class-domain.puml/.svg` |
| Class: thuộc tính chính, quan hệ, multiplicity, enum trạng thái | 4.3 | Task 2.3 | `class-domain` |
| Tiêu chí: ba sơ đồ không mâu thuẫn với SRS, use-case, mô hình dữ liệu | 4.3 | Task 2 (kiểm chéo) | bảng kiểm trong PR |

### G.4 Task 3 (§5)

| Yêu cầu đề A2 | § | Mục kế hoạch | Tạo phẩm |
|---|---|---|---|
| Kiến trúc C4 hoặc phân lớp: frontend, backend module, PostgreSQL + migration, thanh toán mô phỏng, logging/health/config | 5.1 | Task 3.1 | `docs/architecture/architecture.md` |
| Lý do chọn, ưu điểm, hạn chế, trade-off | 5.1 | Task 3.1 | `architecture.md` |
| ADR ngắn trong `docs/architecture/adr` (ví dụ `001-monorepo.md`) | 5.1 | Task 3.1 (5 ADR) | `docs/architecture/adr/001..005-*.md` |
| UML deployment diagram production | 5.2 | Task 3.2 | `docs/architecture/deployment.puml/.svg` |
| Deployment: thiết bị người dùng, CDN Next.js, container API, PostgreSQL persistent, registry + nền tảng, HTTPS/nội bộ/cổng, secret/health/log, ranh giới local/CI/production | 5.2 | Task 3.2 (bảng 8 mục), E | `deployment.puml/.svg` |
| Sơ đồ phản ánh đúng nền tảng thực tế | 5.2 | Task 3.2, E.4 | `deployment.svg`, ADR 004 |
| Truy vết container → thành phần kiến trúc → mã nguồn | 5.2 | Task 3.1 (bảng truy vết), C | `architecture.md`, ma trận |

### G.5 Task 4 (§6)

| Yêu cầu đề A2 | § | Mục kế hoạch | Tạo phẩm |
|---|---|---|---|
| Repository GitHub/Bitbucket/tương đương | 6.1 | Task 4.1 | repository |
| Cấu trúc `apps/web`, `apps/api`, `docs` | 6.1 | Task 4.1 | thư mục tương ứng |
| Chiến lược branch và PR | 6.1 | B.1, Task 4.1 | `CONTRIBUTING.md` |
| `README.md`, `.gitignore`, `.env.example` | 6.1 | Task 4.1 | các file ở gốc repo |
| Issue board/Product Backlog Sprint 1 và 2 | 6.1 | B.5, F, Task 4.1 | board, link trong README |
| Quy ước commit, Definition of Done | 6.1 | B.1, Task 4.1 | `CONTRIBUTING.md` |
| Tạo phẩm Task 1-3 nằm trong `docs`; thay đổi qua commit/PR có lý do | 6.2 | B.1, Task 4.2 | lịch sử PR |
| `GET /products`, `GET /products/:id` | 6.3 | Task 4.3 | `apps/api` |
| Menu mobile-first Next.js; loading, empty, error | 6.3 | Task 4.3 | `apps/web` |
| Dữ liệu mẫu hoặc seed | 6.3 | Task 4.3 | migration/seed trong `apps/api` |
| Test tối thiểu API và component/luồng chính | 6.3 | Task 4.3 | test trong `apps/` |
| CI khi mở PR: Install → Lint → Unit Test → Build | 6.4 | Task 4.4 | `.github/workflows/ci.yml` |
| **Bắt buộc:** PR không merge nếu lint/test/build thất bại | 6.4 | B.2, Task 4.4 | branch protection |
| Minh chứng: link PR, pipeline xanh, pipeline bắt lỗi | 6.4 | Task 4.4 | `docs/evidence/ci/`, README |

### G.6 Task 5 (§7)

| Yêu cầu đề A2 | § | Mục kế hoạch | Tạo phẩm |
|---|---|---|---|
| Chi tiết sản phẩm, size, topping | 7.1 | Task 5.1 | `apps/web`, `apps/api` |
| Giỏ hàng và tổng tiền | 7.1 | Task 5.1 | `apps/web` |
| Đăng ký, đăng nhập, JWT | 7.1 | Task 5.1 | `apps/web`, `apps/api` |
| Tạo đơn hàng | 7.1 | Task 5.1 | `apps/api` |
| Thanh toán Ví/Thẻ mô phỏng | 7.1 | Task 5.1 | `apps/api` |
| Xác nhận, trạng thái, lịch sử đơn | 7.1 | Task 5.1 | `apps/web`, `apps/api` |
| Xử lý lỗi và validate frontend/backend | 7.1 | Task 5.1 | `apps/` |
| Unit test cho nghiệp vụ quan trọng | 7.2 | Task 5.2 | test trong `apps/api` |
| Integration test tạo đơn/thanh toán | 7.2 | Task 5.2 | `tests/integration/` |
| Ít nhất một E2E menu → xác nhận đơn | 7.2 | Task 5.2 | `tests/e2e/` |
| Migration/seed tái tạo DB | 7.2 | Task 5.2 | `apps/api` |
| `docker-compose.yml` chạy web, API, DB local | 7.2 | Task 5.2 | `docker-compose.yml` |
| Health endpoint (`GET /health`) | 7.2 | Task 5.2 | `apps/api` |
| Pipeline: Push/Tag → Lint và Test → Build Docker Image → Push Registry → Deploy → Smoke Test | 7.3 | Task 5.3 | `.github/workflows/cd.yml` |
| 7 yêu cầu pipeline (quality gate, tag image, push registry, deploy bằng secret CI, migration an toàn, health/smoke, dừng + rollback) | 7.3 | Task 5.3 (bảng 7 dòng) | `cd.yml`, `docs/deployment.md` |
| URL frontend production, HTTPS | 7.4 | Task 5.4, E | README |
| URL API và health check | 7.4 | Task 5.4 | README |
| Database production không public | 7.4 | Task 5.4, E.1 | cấu hình nền tảng, `deployment.md` |
| Secret không có trong repo/log CI | 7.4 | Task 5.3, 5.4 | GitHub Secrets, rà log |
| Release/tag + release notes | 7.4 | B.3, Task 5.4 | GitHub Release `a2-v1.0.0` |
| README hướng dẫn local, test, build, deploy, rollback | 7.4 | Task 5.4 | `README.md`, `docs/deployment.md` |
| Video/demo trực tiếp luồng end-to-end | 7.4 | Task 5.4 | link trong README |
| Sprint Review, Sprint Retrospective | 7.4 | B.5, Task 5.4 | `docs/sprint/*.md` |
| Tiêu chí: người ngoài nhóm clone, chạy theo README, truy cập production | 7.4 | Task 5.4 | kiểm thử bởi người ngoài nhóm |

### G.7 Truy vết và cấu trúc (§8-§9)

| Yêu cầu đề A2 | § | Mục kế hoạch | Tạo phẩm |
|---|---|---|---|
| `docs/traceability-matrix.md` theo mẫu 5 cột | 8.1 | C | `docs/traceability-matrix.md` |
| Thiếu tạo phẩm task trước thì task sau không tính truy vết | 8.1 | A.2, B.4, C | cổng giữa các task |
| Không có URL production sống lúc chấm thì Task 5 triển khai không tính | 8.1 | A.2, Task 5 (checklist), H | URL production |
| Cấu trúc: `apps/web`, `apps/api` | 9 | Task 4.1 | `apps/` |
| `docs/requirements`, `docs/diagrams`, `docs/architecture` | 9 | Task 1, 2, 3 | thư mục tương ứng |
| `docs/traceability-matrix.md`, `docs/deployment.md` | 9 | C, Task 5.3, 5.4 | hai file ở `docs/` |
| `tests/` (integration/E2E) | 9 | Task 5.2 | `tests/` |
| `.github/workflows/` (CI/CD) | 9 | Task 4.4, 5.3 | `ci.yml`, `cd.yml` |
| `docker-compose.yml`, `.env.example`, `README.md` ở gốc | 9 | Task 4.1, 5.2, 5.4 | file ở gốc repo |

### G.8 Checklist nộp bài (§9.1)

| Mục checklist §9.1 | Mục kế hoạch | Tạo phẩm |
|---|---|---|
| Link repository và quyền truy cập cho giảng viên | Task 4.1, Task 5.4 | link trong README, quyền đã cấp |
| SRS, đặc tả use-case và ma trận truy vết | Task 1.2, 1.3, C | `srs.md`, `uc-checkout.md`, `docs/traceability-matrix.md` |
| Activity, sequence, class và deployment diagram | Task 2.1-2.3, 3.2 | `docs/diagrams/*`, `docs/architecture/deployment.*` |
| Source code frontend, backend và migration | Task 4.3, 5.1, 5.2 | `apps/web`, `apps/api` |
| Unit, integration và E2E test | Task 4.3, 5.2 | test trong `apps/`, `tests/` |
| Pipeline CI/CD chạy thành công | Task 4.4, 5.3 | run xanh của `ci.yml`, `cd.yml` |
| URL production, API và health check | Task 5.4 | README |
| Release notes, README và hướng dẫn rollback | Task 5.3, 5.4 | GitHub Release, `README.md`, `docs/deployment.md` |
| Video/demo và Sprint Retrospective | Task 5.4, B.5 | link video, `docs/sprint/*.md` |

---

## H. Rủi ro tổng hợp

| Rủi ro | Mức | Giảm thiểu |
|---|---|---|
| Không giải thích được tạo phẩm khi vấn đáp (nghi vibecoding) | Cao | mỗi người tự viết phần mình, ghi rõ người phụ trách trong PR; luyện giải thích trước Sprint Review |
| Tạo phẩm Task trước thiếu, task sau mất điểm truy vết (đề A2 §8.1) | Cao | cổng nghiệm thu mục B.4, checklist từng task |
| URL production chết lúc chấm (đề A2 §8.1) | Cao | kiểm tra hằng ngày tuần chấm; Postgres free hết hạn (mục E.3); đánh thức dịch vụ trước buổi chấm |
| Branch protection không bật được trên repo private gói free | Trung bình | kiểm tra ở Task 4.1; repo public hoặc tổ chức hỗ trợ (mục B.2) |
| Sơ đồ mâu thuẫn SRS (đề A2 §4.3) | Trung bình | bảng kiểm chéo Task 2; cập nhật cả hai trong cùng PR |
| Sao chép sơ đồ/code từ A1 | Trung bình | A1 chỉ là tham khảo; xem mục D |
| Smoke test hỏng giả do ngủ đông | Trung bình | smoke retry tới khi 200, tối đa 10 phút; rollback deploy lại image tag bản trước rồi smoke lại (Task 5.3) |
| Migration làm hỏng dữ liệu production | Trung bình | chỉ migration cộng thêm; thử trên DB sao chép trước |
| Lộ secret trong repo hoặc log CI (đề A2 §7.4) | Trung bình | `.gitignore` cho `.env`; không `echo` biến; rà log trước khi nộp |
| Thiếu thời gian cho Sprint 2 (nhiều hạng mục nhất) | Cao | khuyến mãi, điểm thưởng, hoàn tiền, hàng đợi đã ngoài bản nộp từ Task 1; nếu vẫn thiếu thì cắt FR-25 (Could) và `state-order` (tùy chọn) trước, giữ Must; PWA (NFR-10, Must, chỉ cần manifest) vẫn phải làm vì đề A2 §1.1 ghi mobile-first/PWA; xếp B-24..B-26 (hạ tầng) sớm để còn thời gian sửa lỗi triển khai |

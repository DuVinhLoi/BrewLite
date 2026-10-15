# Plan: nhánh `develop-agile` (Agile Scrum bám đề A1)

## Context

`develop` (HEAD `dff84c0`) đã xong 10 task của đề `docs/BrewLite-CongNghePhanMem-fixed.md` (gọi tắt **đề A1**), kèm phần mở rộng Barista/Admin (UC08–UC16) và 2 tài liệu UML (`use-case-specifications.md`, `user-sequence-specifications.md`). Người dùng cần hai hướng đi riêng:

1. **`develop-agile`**: bám đúng đề A1 theo Agile Scrum. Chỉ giữ user story có trong đề. Bỏ giao diện Barista/Admin. State Machine tiến đơn được gọi qua **Swagger**. Không dùng sơ đồ use-case / sequence, thay bằng Product Backlog gồm user story và tiêu chí chấp nhận.
2. **`develop-Assignment2`**: chuẩn bị cho đề `docs/Assignment2-BrewLite.md` (gọi tắt **đề A2**). Giảng viên cấm vibecoding, nên nhánh này **chỉ có plan và tài liệu tham khảo, chưa có code**. Code A2 sẽ được viết mới trong `apps/web` và `apps/api`, không chép từ `backend/` hay `frontend/` của develop.

Các quyết định người dùng đã chốt:
- agile: giữ API và role ở backend, chỉ xoá UI; xoá 2 tài liệu UC/sequence, thay bằng user story;
- A2: xoá code cũ, dựng `apps/` mới;
- nền tảng production: người dùng nghiêng về Vercel (ý kiến của Claude ở Phần B, mục B3).

Theo memory [[planner-only-role]]: duyệt plan **không** có nghĩa là bắt đầu thực thi. Mỗi bước (A0, A1…, B0…) chỉ chạy khi người dùng gọi đúng tên bước.

---

## Phần A — Nhánh `develop-agile`

### A0. Tạo nhánh
```
git switch develop && git switch -c develop-agile
```
Sau đó ghi plan này vào `docs/planning/2026-10-15-develop-agile-plan.md`, chỉ giữ Phần A.

### A1. Backend: thêm Swagger (commit `feat(api): add Swagger UI for order state transitions`)
- Thêm dependency `@nestjs/swagger@^7.4.2`, bản 7.x hợp với Nest 10, vào `backend/package.json`, rồi `npm install` để cập nhật lockfile.
- `backend/src/main.ts`: dùng `DocumentBuilder`, đặt title `BrewLite API`, gọi `.addBearerAuth()`, rồi `SwaggerModule.setup('docs', app, document)`. Kết quả: trang **http://localhost:3000/docs**.
- Gắn decorator ở mức tối thiểu để Swagger gửi đúng request. Không chú thích toàn bộ API.
  - `backend/src/payment/dto/update-order-status.dto.ts`: thêm `@ApiProperty({ enum: OrderStatus })`.
  - `backend/src/payment/payment.controller.ts`: thêm `@ApiBearerAuth()` và `@ApiTags('orders')`.
  - Thêm `@ApiHeader({ name: 'Idempotency-Key' })` cho `POST /payments` và `POST /orders`.
  - Thêm `@ApiProperty` cho các DTO `auth/dto.ts`, `create-order.dto.ts`, `create-payment.dto.ts` để thử được trọn luồng qua Swagger.
- Giữ nguyên `RolesGuard`, role `BARISTA`/`ADMIN`, tài khoản seed, các endpoint `GET /orders?status=`, `/admin/products` và `PATCH /orders/:id`.
- Test mới `backend/test/swagger.spec.ts`: dựng app, gọi `GET /docs-json`, khẳng định có path `/orders/{id}` với method `patch` và có schema enum `OrderStatus`.

### A2. Frontend: gỡ giao diện Barista/Admin (commit `refactor(web): remove barista and admin UI, staff use Swagger`)
- Xoá các file:
  - `app/barista/`, `app/admin/`;
  - `components/BaristaView.*`, `components/InventoryView.*`;
  - `lib/barista.*`, `lib/admin.*`, `lib/stock.*`.
- Rút gọn những file đang rẽ nhánh theo role:
  - `lib/nav.ts`: `navLinks` luôn trả Menu và Lịch sử; bỏ `staffRedirect` và `CUSTOMER_ROUTES`.
  - `lib/auth.ts`: bỏ `isStaff`, `homeFor` và `HOME`. Vẫn giữ `Role` và `roleFromToken`, vì cần biết role để từ chối tài khoản nhân viên.
  - `lib/session.ts`, `components/Header.tsx`, `HeaderView.tsx`: bỏ nhánh chuyển nhân viên sang `/barista` và `/admin`.
  - `lib/api.ts`: bỏ `advanceOrder` và `patchOrderStatus` nếu chỉ màn quầy dùng; giữ `cancelOrder`, vì khách tự hủy đơn.
  - `lib/order-status.ts`: bỏ phần "bước tiếp theo ở quầy"; giữ `statusTrack` cho thanh 5 bước.
- Đăng nhập bằng tài khoản BARISTA/ADMIN trên web (trong `lib/login.ts`): không lưu phiên, báo "Tài khoản nhân viên thao tác qua Swagger: http://localhost:3000/docs".
- Sửa test đi kèm: `nav.test.ts`, `auth.test.ts`, `session.test.ts`, `HeaderView.test.ts`, `api.test.ts`, `login.test.ts`. Bỏ test của các file đã xoá. Thêm test cho câu báo nhân viên ở `login.test.ts`.

### A3. Tài liệu Scrum (commit `docs(scrum): product backlog with user stories, drop UC and sequence docs`)
- **Mới** `docs/product-backlog.md` (thay 2 tài liệu UC/sequence), gồm:
  1. Product Vision (đề §3.1) và stakeholder (đề §3.2): ghi rõ Barista là ngoài MVP và chỉ thao tác qua Swagger.
  2. **10 user story US-01…US-10**, ứng 1–1 với Task 1–10 (đề §8). Mỗi story có:
     - câu "Là một… tôi muốn… để…";
     - tiêu chí chấp nhận (AC) kiểm chứng được, lấy từ đề §8, §4.1 và §4.3 (US-05 giữ nguyên văn đề);
     - điểm 1, Sprint (đề §2.3);
     - cột bằng chứng: endpoint/file và tên test.
  3. Story không có trong đề thì không viết.
     - US-01: "Là nhóm phát triển…", vì Task 1 là task kỹ thuật.
     - US-10 chia thành 4 AC theo đề §9 (a–d). AC của State Machine: "tiến đơn qua Swagger `PATCH /orders/:id` bằng JWT barista; chuyển sai trả 400".
  4. Ghi chú các API mở rộng của nhóm (đề §12.1): chỉ gọi qua Swagger, không có màn hình.
- **Viết lại** `docs/scrum-process.md`, giữ số liệu git và burndown đã có:
  - bảng Sprint Backlog trỏ tới US-xx thay vì UC;
  - Definition of Done chép từ đề §10, thêm Definition of Ready ngắn: story có AC và điểm;
  - mục Review/Demo (đề §11): demo state machine bằng Swagger;
  - mục Retro giữ dạng khung `[nhóm điền]`.
- **Xoá** `docs/use-case-specifications.md` và `docs/user-sequence-specifications.md`.
- **Sửa** `.claude/rules/doc-code-sync.md`:
  - 3 nguồn mới theo thứ tự: đề → code → `docs/product-backlog.md` (AC và cột bằng chứng);
  - bỏ mọi quy tắc về sơ đồ sequence, ma trận Phần III và PlantUML;
  - giữ các quy tắc về 5 thực thể, tài khoản demo và `@smoke.test`.
- **Sửa** `README.md`:
  - mục "Demo State Machine" đổi sang Swagger, theo các bước ở mục Kiểm tra A bên dưới, giữ `scripts/demo-state-machine.sh` làm dự phòng;
  - xoá mục "Demo tồn kho (UC14)" và mọi nhắc `/barista`, `/admin`;
  - cập nhật số test sau A1 và A2.
- **Sửa** ghi chú của nhóm trong `docs/BrewLite-CongNghePhanMem-fixed.md` §12.1 và §12.2: bỏ nhãn UCxx và `/barista` `/admin`, ghi "thao tác qua Swagger `/docs`". Không đụng nội dung gốc của đề.
- Rà các chỗ còn nhắc UC/sequence/`/barista`. Không viết lại nhật ký lịch sử, chỉ thêm một dòng ghi chú đầu file:
  - `docs/develop-status-report.md`;
  - `EXTRA_TASKS.md`;
  - `graphify-out/` (chạy `graphify update .` ở cuối).

### Kiểm tra A
1. `cd backend && npx jest` và `cd frontend && npx vitest run` đều xanh. Chạy `cd frontend && npm run lint` ra 0 lỗi.
2. Chạy `docker compose up --build`, mở http://localhost:3000/docs:
   1. Gọi `POST /auth/login` bằng tài khoản `demo@brewlite.vn`, qua web: đặt và trả một đơn, đơn thành `PAID`.
   2. Gọi `POST /auth/login` bằng tài khoản barista demo, rồi Authorize bằng token vừa nhận.
   3. Gọi `PATCH /orders/{id}` lần lượt với `PREPARING`, `READY`, `COMPLETED`: cả ba trả 200.
   4. Gọi `PATCH` sang `CANCELLED`: phải trả 400 `Invalid transition`.
   5. Mở `/history` của khách: thanh 5 bước tự chuyển trong khoảng 3 giây.
3. Đăng nhập web bằng tài khoản barista: hiện câu báo dùng Swagger, không vào được trang nào.
4. `grep -rn "barista\|/admin\|UC0\|sequence" README.md docs/*.md frontend/src`: chỉ còn chỗ có chủ đích (role trong backend, ghi chú lịch sử).

---

## Ghi chú thực thi
- Thứ tự: A0 → A1 → A2 → A3, rồi B0. Phần B độc lập với A nên có thể làm song song.
- Không push và không merge vào `develop`/`main` khi người dùng chưa đồng ý. Không thêm trailer `Co-Authored-By` (memory [[no-coauthor-trailer]]).
- Khi giao cho subagent: dùng `sonnet` cho A1, A2, A3 và cho việc viết nội dung plan B1; dùng `haiku` cho A0, B0 và các việc dọn file.

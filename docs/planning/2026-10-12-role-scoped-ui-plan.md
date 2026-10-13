# Plan: giới hạn giao diện và API theo vai trò (Barista chỉ pha chế, Admin = Barista + Kho)

## Context

Hiện tại nhân viên đăng nhập vẫn thấy và dùng được toàn bộ phần của khách, tức là code đang lệch so với Use Case Bản 1:
- `frontend/src/lib/nav.ts:9-15`: `navLinks()` luôn có "Menu" và "Lịch sử". Barista thấy Menu, Quầy, Lịch sử; Admin thấy Menu, Quầy, Kho, Lịch sử.
- `HeaderView.tsx:43-56`: nút "Xem giỏ hàng" và viên vai trò (link tới `/profile`) hiện với mọi vai trò.
- Các trang `/`, `/cart`, `/history`, `/profile` không kiểm vai trò.
- Backend: `POST /orders`, `GET /orders/me`, `GET /orders/:id` (`order.controller.ts:14-48`), `POST /payments` (`payment.controller.ts:12-18`) và `GET /users/me` (`user.controller.ts`) chỉ gắn `JwtAuthGuard`, nên token BARISTA/ADMIN đặt món và trả tiền được.

Trong Bản 1, Barista và Admin **không** kế thừa Customer hay Guest (chỉ có `Customer --|> Guest` và `Admin --|> Barista`). UC01–UC07 và UC16 chỉ nối với Guest/Customer.

**Quyết định đã chốt (người dùng, 2026-10-12):**
1. Chặn ở cả giao diện lẫn backend. API của khách trả 403 `Insufficient role` khi token là BARISTA hoặc ADMIN.
2. Nhân viên mở trang khách (`/`, `/cart`, `/history`, `/profile`) thì tự chuyển về trang nhà: Barista về `/barista`, Admin về `/admin`, dùng `homeFor()` có sẵn ở `lib/auth.ts:63-64`.
3. `/profile` (UC16) chỉ dành cho Customer. Với nhân viên, viên vai trò trên header thành nhãn tĩnh, không còn là link. `GET /users/me` trả 403 cho nhân viên.

Kết quả mong muốn:
- **Barista:** header chỉ có "Quầy"; logo trỏ về `/barista`; không có giỏ hàng; vai trò là nhãn tĩnh "Quầy".
- **Admin:** header có "Quầy" và "Kho" (kế thừa Barista); logo trỏ về `/admin`; không có giỏ hàng.
- **Khách vãng lai và Customer:** không đổi gì.

Luật repo: `.claude/rules/doc-code-sync.md` (đổi hành vi thì sửa tài liệu trong cùng commit).

## Phạm vi

| Có làm | Không làm |
|---|---|
| Gắn `@Roles(CUSTOMER)` cho 5 endpoint của khách | `PATCH /orders/:id` giữ nguyên: khách hủy đơn của mình, nhân viên tiến hoặc hủy đơn (UC06 và UC08–UC12 dùng chung endpoint) |
| Lọc nav, header, chuyển hướng phía client, đích sau đăng nhập | `GET /products` giữ công khai (Guest dùng; thực đơn không phải dữ liệu riêng) |
| Sửa tài liệu UC và sequence cho khớp | Không dùng Next middleware: token nằm trong `sessionStorage`, phía server không đọc được |
| Test theo TDD cho từng thay đổi | Không sửa `docs/BrewLite-CongNghePhanMem-fixed.md`, không đổi schema/DB, không thêm dependency |

## Thiết kế

### Backend (card B)

Thêm `@UseGuards(JwtAuthGuard, RolesGuard)` và `@Roles(Role.CUSTOMER)` cho:
- `OrderController.create` (`POST /orders`);
- `OrderController.mine` (`GET /orders/me`);
- `OrderController.byId` (`GET /orders/:id`);
- `PaymentController.pay` (`POST /payments`);
- `UserController.me` (`GET /users/me`).

Thứ tự trả lỗi: thiếu hoặc sai token → 401 (JwtAuthGuard chạy trước); đúng token nhưng sai vai trò → 403 `Insufficient role` (`roles.guard.ts:14`), trước mọi bước nghiệp vụ.

Không cần thêm hàm mới, chỉ dùng `RolesGuard` và `Roles` có sẵn. Token cũ hoặc có role lạ đã được `jwt-auth.guard.ts:16` coi là CUSTOMER, nên khách cũ không bị khóa nhầm.

### Frontend (card F)

1. **`lib/nav.ts`** thêm hàm thuần:
   - `CUSTOMER_ROUTES = ['/', '/cart', '/history', '/profile']`;
   - `staffRedirect(pathname, role): string | null`: nếu `isStaff(role)` và pathname khớp một route khách (khớp bằng `isActive`, nên `/` chỉ khớp đúng `/`) thì trả `homeFor(role)`, không thì trả `null`.
2. **`navLinks(role)`:**
   - nhân viên bỏ "Menu" và "Lịch sử": BARISTA → `[Quầy]`, ADMIN → `[Quầy, Kho]`;
   - khách và CUSTOMER giữ `[Menu, Lịch sử]`;
   - sửa comment ở `nav.ts:3`.
3. **`HeaderView.tsx`**, với `staff = isStaff(session?.role)`:
   - logo trỏ `homeFor(role)` khi là nhân viên, không thì `/`;
   - ẩn nút "Xem giỏ hàng" khi là nhân viên;
   - viên vai trò của nhân viên là `<span>` cùng class `pill`, có `title` là email, không phải `<Link href="/profile">`;
   - "Đăng xuất" giữ nguyên.
4. **`Header.tsx`**: trong effect chạy theo `pathname`, đọc phiên rồi gọi `staffRedirect(pathname, role)`; có kết quả thì `router.replace(to)`. Header nằm trong layout và đã đọc lại phiên mỗi lần đổi trang (`Header.tsx:14-19`), nên đây là chỗ duy nhất phải thêm chuyển hướng.
5. **`lib/session.ts` `postLoginTarget(search, role)`**: nếu `?next=` hợp lệ nhưng `staffRedirect(next, role)` khác `null` thì về `homeFor(role)`. Ví dụ: Barista đăng nhập từ `/login?next=/history` thì vào thẳng `/barista`, không nháy qua `/history`.
6. **Giới hạn đã biết** (ghi vào tài liệu): trang khách có thể hiện trong tích tắc trước khi `router.replace` chạy, vì chuyển hướng ở phía client. Bảo mật không phụ thuộc vào việc này, vì backend đã trả 403.

### Tài liệu (card D)

- **`docs/use-case-specifications.md`:**
  - §1: dòng Barista và Admin ghi "không dùng Phân hệ Khách hàng (không kế thừa Customer/Guest)", kèm cách code thực thi: chuyển về trang nhà, API khách trả 403. Dòng Admin ghi giao diện gồm Quầy + Kho.
  - §4: cột căn cứ của UC04, UC05, UC07 và UC16 thêm `@Roles(CUSTOMER)`.
  - §5.2: sửa câu 6 (nhân viên đăng nhập xong vào thẳng trang nhà) và câu 7 (UC16 chỉ Customer, bỏ ý "mọi tài khoản mở được"). Thêm câu 8: vì sao Barista/Admin không đặt món được (sơ đồ không có `Barista --|> Customer`, code chặn cả hai phía).
- **`docs/user-sequence-specifications.md`:**
  - §1.2: tác nhân.
  - §2.3: luồng 2 và 4, đích sau đăng nhập bỏ qua `?next=` trỏ tới trang khách khi là nhân viên; các note "Áp dụng mọi vai trò" ở dòng 279 và 314 vẫn đúng cho form đăng nhập.
  - §2.4: thêm nhánh 403 `Insufficient role` sau JwtAuthGuard cho `POST /orders` và `POST /payments`.
  - §2.6: thêm 403 cho `GET /orders/me` và `GET /orders/:id`.
  - §2.7 mục A và §2.8: header của nhân viên.
  - §2.9: dòng 1023 và 1076 đổi thành "chỉ CUSTOMER", sơ đồ thêm nhánh 403 hoặc chuyển hướng cho nhân viên.
  - Phần III: cột guard.
- **`README.md:57`:** ghi các endpoint của khách là chỉ CUSTOMER.
- Số khối PlantUML không đổi (12). Render lại phải sạch.

## Thực thi

**Một branch `feat/role-scoped-ui` tách từ `develop` (`4820138`) (trước khi gộp là `dfe9770`), một worktree.** Lý do không chia nhiều agent: chỉ khoảng 12 file. Card D phụ thuộc hành vi của B và F, còn B và F đụng file khác nhau nên làm tuần tự cũng nhanh. Thứ tự: B → F → D. Mỗi card một commit; mỗi card review riêng, cuối cùng review cả branch. Người dùng quyết định ai thực thi (agent riêng hoặc `superpowers:subagent-driven-development`).

Lưu ý môi trường:
- `develop` đang hơn `origin/develop` 13 commit chưa push.
- Checkout chính có file chưa commit (`.graphifyignore`, `CLAUDE.md`, …). Worktree phải tạo bằng `git worktree add -b feat/role-scoped-ui <path> develop`, không dùng `EnterWorktree` (công cụ này mở từ `main`).
- Chép `CLAUDE.md`, `.claude/settings.json` và `graphify-out/` vào worktree, rồi chạy `npm ci` cho backend và frontend.

### Card B: backend chặn API khách cho nhân viên

- **Allowed:**
  - `backend/src/order/order.controller.ts`
  - `backend/src/payment/payment.controller.ts`
  - `backend/src/auth/user.controller.ts`
  - `backend/test/customer-only.spec.ts` (mới)
- **TDD:** viết test trước, theo mẫu `barista-queue.spec.ts` và `admin-inventory.spec.ts` (đọc metadata bằng `Reflector`, gọi `RolesGuard.canActivate`). Với mỗi handler trong 5 handler:
  - CUSTOMER qua;
  - BARISTA và ADMIN ném `ForbiddenException`;
  - handler có `RolesGuard` trong danh sách guard.

  Chạy để thấy đỏ rồi mới sửa controller.
- **Acceptance:** `cd backend && npx jest` xanh (mốc hiện tại 132 pass / 3 skip, cộng test mới) và `npx tsc --noEmit` sạch.
- **Commit:** `feat(backend): customer-only guard on order, payment and profile endpoints`

### Card F: frontend theo vai trò

- **Allowed:**
  - `frontend/src/lib/nav.ts`, `nav.test.ts`
  - `frontend/src/lib/session.ts`, `session.test.ts`
  - `frontend/src/components/HeaderView.tsx`, `HeaderView.test.ts`, `Header.tsx`
- **TDD:** viết test đỏ trước cho:
  - `navLinks` theo 4 vai trò (sửa 2 test BARISTA và ADMIN ở `nav.test.ts:16-24`);
  - `staffRedirect`:
    - BARISTA ở `/`, `/cart`, `/history`, `/profile` → `/barista`;
    - ADMIN ở các trang đó → `/admin`;
    - nhân viên ở `/barista`, `/admin`, `/login` → `null`;
    - CUSTOMER hoặc `null` → luôn `null`;
  - `postLoginTarget`:
    - BARISTA với `?next=/history` → `/barista`;
    - BARISTA với `?next=/admin` giữ `/admin` (kiểm quyền ở trang `/admin`, không ở đây);
    - CUSTOMER với `?next=/history` → `/history`;
  - `HeaderView` (renderToStaticMarkup như test hiện có):
    - nhân viên không có link `/cart` và không có `href="/profile"`;
    - logo trỏ về trang nhà;
    - khách và CUSTOMER giữ nguyên.
- **Acceptance:** `cd frontend && npx vitest run` xanh (mốc 48 file / 810 test), `npx tsc --noEmit` sạch, `npm run lint` 0 lỗi.
- **Commit:** `feat(frontend): staff see only counter/inventory UI and are redirected from customer pages`

### Card D: tài liệu

- **Allowed:** `docs/use-case-specifications.md`, `docs/user-sequence-specifications.md`, `README.md`
- **Làm theo** mục "Tài liệu" ở trên. Dùng Edit/Write cho PlantUML (heredoc làm mất `\`).
- **Acceptance:**
  - 12 khối PlantUML render sạch (`java -jar C:/Users/Admin/AppData/Local/Temp/opencode/puml/plantuml.jar -charset UTF-8 -tpng`);
  - grep không còn "Mọi vai trò đều mở được" và "mọi vai trò)" ở §2.9;
  - bảng §4 file UC khớp Phần II và Phần III file seq.
- **Commit:** `docs: staff do not use customer use cases (UI redirect + 403)`

## Kiểm chứng (sau cả 3 card)

1. `cd backend && npx jest && npx tsc --noEmit`.
2. `cd frontend && npx vitest run && npx tsc --noEmit && npm run lint`.
3. Render 12 khối PlantUML.
4. Chạy thật bằng `docker compose up -d --build`, dùng tài khoản demo trong `README.md:80`:
   - **Barista:** đăng nhập thì vào `/barista`; header chỉ có "Quầy", không có giỏ hàng, vai trò không bấm được; gõ `/`, `/cart`, `/history`, `/profile` đều bị chuyển về `/barista`.
   - **Admin:** đăng nhập thì vào `/admin`; header có "Quầy" và "Kho"; trang khách bị chuyển về `/admin`; vẫn tiến đơn được ở `/barista`.
   - **Customer:** mọi thứ như cũ (đặt món, trả tiền, lịch sử, hồ sơ).
   - **API**, dùng `curl` với token Barista:
     - `POST /orders`, `POST /payments`, `GET /orders/me`, `GET /users/me` → 403 `Insufficient role`;
     - `GET /orders?status=PAID` → 200;
     - `PATCH /orders/:id {PREPARING}` → 200.
5. Không có trailer `Co-Authored-By`. Không push, không merge vào `develop` khi người dùng chưa đồng ý. Merge xong thì chạy `graphify update .`.

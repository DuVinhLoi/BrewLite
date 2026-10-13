# Plan: đánh giá 6 commit UI, đồng bộ code ↔ Use Case ↔ Sequence (workflow multi-agent)

## Context

`develop` vừa nhận 6 commit UI "nét mực": `e3698bb`, `6ee4236`, `85cf7b6`, `fe681ec`, `3fdc36b`, `4e4c843`. Người dùng muốn:
- đánh giá 6 commit này;
- đồng bộ code với `docs/use-case-specifications.md` và `docs/user-sequence-specifications.md`. Barista phải khớp máy trạng thái đơn (Nhận pha → Pha xong → Đã giao), Admin phải khớp phần chỉnh tồn kho, use case phải khớp sequence;
- có một workflow nhiều agent chạy trơn tru: Claude dựng sẵn worktree, người dùng tự giao agent cho từng wave, và plan phải có luật để các agent không giẫm chân nhau.

Luật đồng bộ của repo là `.claude/rules/doc-code-sync.md`, thứ tự ưu tiên **đề → code → tài liệu**.

## 1. Kết quả đánh giá 6 commit (đã kiểm, chỉ đọc)

**Chạy test**
- Backend jest: 130 pass, 3 skip.
- Frontend vitest: 778/778 test pass, nhưng `HeaderView.test.ts` không nạp được vì máy chưa cài `@phosphor-icons/react` (gói có trong lockfile, `npm ci` là hết; `tsc` báo đúng lỗi này).

**Không có hồi quy.**
- `/barista` sau khi tách sang `BaristaView`: giữ chặn vai trò, poll 5 giây, bỏ response cũ, dừng khi gặp 401/403, khóa nút khi đang chuyển, nút Hủy chỉ ở cột PAID.
- `/admin` sau khi tách sang `InventoryView`: giữ −1 / +1 / +10, gửi `version`, tải lại bảng trước rồi mới báo lỗi.
- `GET /users/me` có `JwtAuthGuard`, không trả `passwordHash`.

**Điểm tốt:** logic tách thành hàm thuần có test (`cardActions`, `quickSteps`, `parseStockDraft`, `startPolling`, `safeNext` chặn open redirect); accessibility tốt; tài liệu sequence được sửa cùng từng commit.

**Điểm yếu**

| Mức | Chỗ | Vấn đề |
|---|---|---|
| TB | `app/{barista,admin,history}/page.tsx` | Logic trang không có test (vitest chạy môi trường `node`, không có jsdom) |
| TB | `LoginView.test.ts:167-183`, ~55 assert CSS | So chuỗi nguồn / giá trị CSS, dễ gãy, không chứng minh hành vi |
| Thấp-TB | `OrderService.withProductNames` | Mỗi món một `findById`, `/history` poll 3 giây; một lần tra lỗi là hỏng cả danh sách |
| Thấp | `BaristaView` | Không có trạng thái đang tải (lần đầu cả 3 cột hiện "Không có đơn") |
| Thấp | `lib/api.ts` `getProfile` / `getMyOrders` / `getOrder` | Thiếu `cache: 'no-store'` |
| Thấp | `components/ui/Card.tsx`; `profile/page.tsx:10` | Component không trang nào dùng; comment ghi localStorage, thực tế là sessionStorage |
| Thấp (có từ trước) | `store/cart.ts`, `cart-limits.ts`, `use-order-poll.ts` | Chặn tồn kho theo dòng chứ không theo món; deps của effect thiếu token |

**Lệch giữa tài liệu và code**

| # | Chỗ | Lệch |
|---|---|---|
| L1 | seq §2.4 (~436-440) | 422 "key đã dùng cho đơn khác" vẽ ở nhánh kiểm chủ đơn. Code (`payment.service.ts:50-66`): chủ đơn → tra key → key thuộc đơn khác (404/403/422) |
| L2 | seq §2.5 C (~676) | Ghi `cancelOrderAs` chạy dưới khóa. Thực tế chỉ `cancel()` lấy khóa `order:<id>` (xác minh lại khi sửa) |
| L3 | seq §2.6 C (~789), §2.7 C | Response thiếu `userId`, `idempotencyKey` (hai trường có thật) |
| L4 | UC §1, Bản 1, §4 | ADMIN làm được mọi việc của Barista nhưng biểu đồ không thể hiện |
| L5 | UC + seq | `/profile` và `GET /users/me` chưa có UC, chưa có sơ đồ |
| L6 | UC §4 dòng UC02, UC04 | Thiếu giới hạn 20 dòng / 99 ly |
| L7 | seq §2.3 luồng 4 | Lifeline Guest nhưng có thao tác Barista/Admin; chưa giải thích nhân viên đăng nhập qua UC03 thế nào |
| L8 | seq dòng 8, 1029 | Nhắc "Sequence thanh toán rút gọn" và "bộ 3 biểu đồ" nhưng repo không có |
| L9 | UC §4 | Tên UC09–UC12 thiếu hậu tố "(PAID -> PREPARING)…" |

## 2. Quyết định đã chốt (người dùng, 2026-10-11)

- Thêm **UC16 "Xem hồ sơ & điểm tích lũy"** (Customer), sơ đồ sequence §2.9. Tổng 17 UC, 15 đã hiện thực.
- Thêm **`Admin --|> Barista`**.
- Code: chỉ sửa nhỏ, an toàn, làm theo TDD. Không sửa lỗi giỏ hàng.
- **Không sửa `docs/BrewLite-CongNghePhanMem-fixed.md`.** Không ẩn `idempotencyKey`. Ghi chú nhóm ở đề dòng 369 ("Chưa là UC riêng") để nguyên; tài liệu seq ghi rằng ghi chú đó có trước UC16.
- L8: bỏ cụm "Sequence thanh toán rút gọn". Dòng 8 và 1029 ghi đúng tên các sơ đồ nộp chính đang có: Use Case Bản 1 / Bản 2, Activity đề §5, State Machine đề §9.1 (B2). Không vẽ sơ đồ mới.
- **Phân vai:** Claude dựng worktree và làm Integrator. **Người dùng giao agent cho từng card.** Claude chỉ chạy một bước khi người dùng gọi tên bước đó (mục 3.1).

## 3. Workflow multi-agent

Áp dụng workflow 4 mức người dùng đưa, chỉnh lại cho repo này:

| Mức | Áp dụng thế nào |
|---|---|
| 01 Foundation | Mỗi agent có quyền ghi thì có worktree và branch riêng. Không bao giờ có 2 agent cùng ghi trong một worktree. Integrator kiểm `status` / `branch` / `diff` trước khi nhận bàn giao |
| 02 Coordination | Mỗi task là một Task Card (mục 5), ghi rõ: allowed paths, vùng được sửa trong file dùng chung, forbidden, contract, acceptance, phụ thuộc. Có đồ thị phụ thuộc trước khi chạy song song (3.4) |
| 03 Quality | Integrator chặn ở cổng (3.5): kiểm phạm vi file, test / tsc / lint / render PlantUML, trailer, bằng chứng trong report. Không ai ghi thẳng vào `develop` / `main` |
| 04 Optimization | Ledger ghi số liệu từng card (3.6). Lần này tối đa 4 agent song song; chỉ tăng khi có thêm task độc lập |

### 3.1 Vai trò

| Vai | Ai | Làm gì |
|---|---|---|
| Integrator | Claude (phiên này) | W0 dựng worktree. Sau mỗi wave: chạy cổng, merge branch task vào `sync/uc-sequence`, chạy W3. Là người duy nhất ghi `_coord/ledger.md`. Chỉ chạy khi người dùng gọi: **"W0"**, **"tích hợp W1"**, **"tích hợp W2"**, **"W3"** |
| Dispatcher | Người dùng | Giao từng Task Card cho agent hoặc công cụ tùy chọn, chỉ đúng worktree của card đó |
| Worker | Agent được giao | Làm đúng một card, commit trên branch của card, ghi report |

Merge `sync/uc-sequence` vào `develop` và mọi lệnh push: **chỉ khi người dùng đồng ý** ở cuối W3.

### 3.2 Worktree và branch

Gốc là `develop` (`4e4c843`). Không dùng `EnterWorktree` hay `isolation: "worktree"`, vì cả hai mở từ `main`.

| Worktree (`E:/CNPM/BrewLite-wt/…`) | Branch | Người ghi | `npm ci` |
|---|---|---|---|
| `integration` | `sync/uc-sequence` | Integrator | backend + frontend |
| `t1-backend` | `sync/t1-backend` | Worker T1 | backend (+ `prisma generate`) |
| `t2-frontend` | `sync/t2-frontend` | Worker T2 | frontend |
| `d-uc` | `sync/d-uc` | Worker D-UC | không cần |
| `d-seq` | `sync/d-seq` | Worker D-SEQ | không cần |
| `_coord/` (thư mục thường, không phải worktree) | — | Integrator ghi ledger; mỗi worker chỉ ghi file report của mình; D-UC16 ghi `handoff/` | — |

D-UC16 chỉ đọc, nên không có worktree riêng: đọc ở `integration` (lúc đó Integrator đang rảnh), ghi kết quả vào `_coord/handoff/`.

**Vì sao không dùng 1 worktree chung:** các agent sẽ dùng chung index, HEAD và stash. Agent A thấy file của agent B trong `git status`/`git diff`, dễ "dọn" nhầm hoặc commit lẫn. Test chạy chồng lên nhau. **Vì sao không phải 3 worktree:** có 4 task ghi file (T1, T2, D-UC, D-SEQ), D-UC16 chỉ đọc. Worktree tài liệu không cần `node_modules` nên tốn rất ít.

### 3.3 Luật chống giẫm chân (mọi worker phải tuân)

1. **Một worktree, một người ghi.** Chỉ làm việc trong worktree của card mình. Trước khi sửa, kiểm `git branch --show-current` đúng tên branch của card.
2. **Chỉ sửa allowed paths.** Với file dùng chung, chỉ sửa đúng vùng (mục) đã khai trong card. Cần sửa ngoài vùng thì **không tự sửa**: ghi change request vào `_coord/handoff/CR-<card>.md` gồm đoạn cũ, đoạn mới và lý do. Chủ của file sẽ áp CR đó.
3. **Mỗi file có một chủ trong một wave.** Ngoại lệ duy nhất là file seq ở W1: T1 và T2 sửa các mục đã khai, không liền kề nhau (git merge sạch). Sang W2, D-SEQ là chủ toàn bộ file seq.
4. **Cấm lệnh git nguy hiểm:**
   - push, merge, rebase, `checkout` hoặc `switch` sang branch khác;
   - `reset --hard`, `clean`, các lệnh `worktree`;
   - **`stash`**: stash dùng chung cho mọi worktree của repo.
5. **Cấm đụng tài nguyên dùng chung:**
   - sửa `package*.json`, chạy `npm install`;
   - chạy `docker compose` hoặc dev server: cổng 3000 / 5432 dùng chung;
   - `graphify update` (chỉ Integrator chạy ở W3);
   - sửa file ở worktree khác hoặc ở checkout chính `E:/CNPM/BrewLite`;
   - sửa `~/.claude`.
6. **Đầu vào chung:**
   - đọc `.claude/rules/doc-code-sync.md`;
   - chạy `graphify query "<câu hỏi>"` trước khi đọc code (Integrator đã chép `graphify-out/` vào worktree);
   - dùng Edit/Write cho text có `\` (PlantUML; heredoc bash làm mất dấu `\`);
   - render PlantUML ra thư mục tạm riêng, không ghi ảnh vào repo.
7. **Commit trên branch của card**, đúng message trong card, **không có trailer Co-Authored-By**.
8. **Trước khi báo xong:**
   - `git status --porcelain` chỉ được còn `?? CLAUDE.md` và `?? .claude/settings.json` (hai bản Integrator chép vào);
   - `git diff --name-only sync/uc-sequence...HEAD` nằm trong allowed paths;
   - đã chạy các lệnh acceptance;
   - đã ghi `_coord/reports/<card>.md`: hash commit, danh sách file, dòng tổng kết của từng lệnh, output test đỏ (nếu là TDD), rủi ro hoặc câu hỏi.
9. **Trả về** một trong `DONE` / `DONE_WITH_CONCERNS` / `BLOCKED` / `NEEDS_CONTEXT`, kèm đường dẫn report. Không tự gọi thêm agent con.

### 3.4 Đồ thị phụ thuộc

```
W0 (Integrator)
 ├─ W1 song song: T1 ∥ T2 ∥ D-UC ∥ D-UC16
 │    └─ "tích hợp W1": merge T1 → T2 → D-UC vào sync/uc-sequence; d-seq fast-forward theo
 ├─ W2: D-SEQ (cần: doc lines của T1/T2 đã merge, handoff/uc16-section.md, CR-*.md, tên UC chuẩn do D-UC chốt)
 │    └─ "tích hợp W2": merge D-SEQ
 └─ W3 (Integrator): số liệu tài liệu, kiểm chứng, /code-review high, graphify update, hỏi merge vào develop
```

D-UC và D-UC16 đều chạy ở W1, vì không cần code mới. D-SEQ phải chờ W1, vì file seq đã có dòng của T1/T2 và cần bản nháp UC16.

### 3.5 Cổng tích hợp (Integrator chạy cho mỗi branch, theo thứ tự)

- **G1:** `git -C <wt> status --porcelain` sạch (trừ 2 file chép vào), và `branch --show-current` đúng tên.
- **G2:** `git diff --name-only sync/uc-sequence...sync/<card>` nằm trong allowed paths. Với file dùng chung, xem diff có ra ngoài vùng đã khai không.
- **G3:** `git log --format=%B sync/uc-sequence..sync/<card>` không có `Co-Authored-By`.
- **G4:** report có đủ bằng chứng theo luật 8.
- **G5:** `git merge --no-ff sync/<card>` trong `integration`.
  - Có conflict: `git merge --abort`, ghi ledger, trả card về worker kèm lý do.
  - Conflict chỉ ở tài liệu, trong vùng đã khai: Integrator tự giải và ghi vào ledger.
- **G6:** sau mỗi lần merge, chạy trong `integration`: test của phần bị đụng (jest hoặc vitest + tsc + lint) và render PlantUML.
- Không qua cổng nào thì gửi lại cho worker. Tối đa 3 vòng một card; quá 3 vòng thì Integrator ghi phán quyết vào ledger và báo người dùng.

### 3.6 Ledger và số liệu (`_coord/ledger.md`, chỉ Integrator ghi)

Bảng: card | agent / công cụ | bắt đầu | xong | số vòng sửa | số lần test đỏ trước khi xanh | conflict khi merge | file ngoài phạm vi bị chặn | token (nếu công cụ có báo). Thêm một dòng `Ruling:` cho mỗi quyết định Integrator tự đưa ra. Cuối W3 có một dòng nhận xét: chạy song song lần này có đáng không, lần sau tăng hay giảm số agent.

## 4. W0: Integrator chuẩn bị (chạy khi người dùng gọi "W0")

1. Tạo branch và worktree tích hợp:
   - `git branch sync/uc-sequence develop`
   - `git worktree add E:/CNPM/BrewLite-wt/integration sync/uc-sequence`
2. Trong `integration`, commit `docs: plan va luat multi-agent dong bo UC/sequence` gồm 2 file:
   - `docs/planning/2026-10-11-uc-sequence-sync-plan.md`: bản sao plan này, có Task Card;
   - `.claude/rules/multi-agent-workflow.md`: mục 3.3 và 3.5 viết thành luật chung, dùng lại cho các lần sau.
3. Tạo 4 worktree worker từ commit đó: `git worktree add -b sync/<card> E:/CNPM/BrewLite-wt/<card> sync/uc-sequence`, với `<card>` lần lượt là `t1-backend`, `t2-frontend`, `d-uc`, `d-seq`.
4. Chép vào mỗi worktree những thứ không có trong git:
   - `CLAUDE.md` (luật graphify);
   - `.claude/settings.json` (tắt trailer, hook graphify);
   - `graphify-out/`.
5. `npm ci` theo bảng 3.2. Trong `t1-backend` và `integration` chạy thêm `npx prisma generate`.
6. Mốc trong `integration`:
   - `npx jest`;
   - `npx vitest run`, `npx tsc --noEmit`, `npm run lint`;
   - script tách khối PlantUML (viết bằng Write, đặt trong `_coord/tools/`), render bằng `java -jar C:/Users/Admin/AppData/Local/Temp/opencode/puml/plantuml.jar -tpng`, phải ra 11 ảnh sạch.
7. Tạo `_coord/{handoff,reports,tools}` và `_coord/ledger.md`.
8. Báo người dùng: đường dẫn 4 worktree, số liệu mốc, các card sẵn sàng giao ở W1.

## 5. Task Card

Mọi card đều theo luật 3.3. Lệnh trong card chạy trong worktree của chính card.

### Card T1: tên món lấy bằng 1 truy vấn (W1)

- **Worktree / branch:** `E:/CNPM/BrewLite-wt/t1-backend` / `sync/t1-backend`
- **Allowed:**
  - `backend/src/order/order.service.ts`
  - `backend/test/order-product.spec.ts`
  - `docs/user-sequence-specifications.md`, **chỉ trong §2.6 mục C và Phần III**
- **Contract:**
  - `withProductNames()` gọi `this.products.findAll()` đúng **1 lần**, dựng `Map` id → tên, không gọi `findById`. Món không còn thì tên là `productId`.
  - `listMine()` / `listQueue()` trả dữ liệu giống như cũ.
  - Không đổi `IProductRepository`. Thêm comment `ponytail:` (thực đơn nhỏ nên đọc cả bảng).
- **Acceptance:**
  - Viết test đỏ trước rồi mới sửa. Test kiểm: gọi repo 1 lần, không gọi `findById`, món bị xóa thì tên là `productId`.
  - `npx jest` xanh, `npx tsc --noEmit` sạch.
  - Trong file seq không còn chữ "tra song song mỗi productId".
- **Commit:** `perf(backend): ten mon cho lich su va hang doi lay bang 1 truy van`

### Card T2: sửa nhỏ frontend (W1)

- **Worktree / branch:** `E:/CNPM/BrewLite-wt/t2-frontend` / `sync/t2-frontend`
- **Allowed:**
  - `frontend/src/app/barista/page.tsx`
  - `frontend/src/components/BaristaView.tsx`, `BaristaView.module.css`, `BaristaView.test.ts`
  - `frontend/src/lib/api.ts`, `api.test.ts`
  - `frontend/src/components/ui/Card.tsx` và `Card.module.css` (xóa); `ui/ui.test.ts` (chỉ bỏ khối `Card`)
  - `frontend/src/app/profile/page.tsx` (chỉ sửa comment)
  - `docs/user-sequence-specifications.md`, **chỉ trong §2.7 mục A và §2.7 mục B (sơ đồ)**
- **Ngoài vùng:** muốn sửa §2.7 mục C hoặc Phần III dòng UC08 thì ghi `CR-T2.md`.
- **Contract:**
  - `orders` có kiểu `QueueOrder[] | undefined` (undefined = chưa tải), giống `app/admin/page.tsx:12`.
  - `BaristaView` hiện "Đang tải…" khi `!orders && !error`, theo mẫu `InventoryView.tsx:109`.
  - `getProfile` / `getMyOrders` / `getOrder` gửi `cache: 'no-store'`.
  - Comment `profile/page.tsx:10` đổi localStorage → sessionStorage.
- **Acceptance:**
  - Viết test đỏ trước, cho trạng thái đang tải và cho tham số `init` của fetch.
  - `npx vitest run` xanh (48 file, không còn lỗi phosphor), `npx tsc --noEmit` sạch, `npm run lint` 0 lỗi.
  - Khối PlantUML §2.7 render sạch.
- **Commit:** `fix(frontend): quay hien dang tai, fetch no-store cho ho so va lich su, bo Card thua`

### Card D-UC: tài liệu use case (W1)

- **Worktree / branch:** `E:/CNPM/BrewLite-wt/d-uc` / `sync/d-uc`
- **Allowed:** `docs/use-case-specifications.md`
- **Contract:**
  - §1: dòng Customer thêm việc xem hồ sơ và điểm; dòng Admin ghi kế thừa Barista; ghi chú phạm vi thành "UC01–UC07 + UC05a + UC16".
  - Bản 1: thêm `usecase "UC16: Xem hồ sơ & điểm tích lũy"` vào gói Khách hàng, `Customer --- UC16`, `Admin --|> Barista`; câu đếm thành 17 UC (UC01–UC16 + UC05a).
  - Bản 2: thêm UC16, thành 9 UC.
  - §4:
    - thêm dòng UC16: `GET /users/me`, `/profile`, §2.9, Đã hiện thực; ghi rằng tài khoản nào đăng nhập cũng mở được, điểm chỉ có nghĩa với khách;
    - UC02 / UC04 thêm 20 dòng / 99 ly;
    - tác nhân UC08–UC12 ghi "`Barista` (Admin kế thừa)";
    - tên UC09–UC12 thêm hậu tố;
    - câu đếm thành "17 UC, 15 đã hiện thực".
  - §5.1: thêm ví dụ `Admin --|> Barista`.
  - §5.2: thêm 3 câu phản biện: vì sao Admin kế thừa Barista; nhân viên đăng nhập qua UC03 thế nào; vì sao UC16 là UC riêng.
- **Acceptance:**
  - 2 khối PlantUML render sạch. Ảnh Bản 1 có UC16 và mũi tên kế thừa.
  - Report liệt kê **tên chuẩn** của 17 UC (đúng chữ trên biểu đồ) để D-SEQ dùng.
- **Commit:** `docs(uc): UC16 ho so, Admin ke thua Barista, gioi han gio hang`

### Card D-UC16: nháp §2.9 (W1, chỉ đọc)

- **Đọc ở:** `E:/CNPM/BrewLite-wt/integration`, không sửa gì trong đó.
- **Ghi:** chỉ `_coord/handoff/uc16-section.md` và ảnh kiểm `_coord/handoff/uc16.png`.
- **Contract:**
  - Đọc `app/profile/page.tsx`, `components/ProfileView.tsx`, `components/GuestState.tsx` (`?next=/profile`), `lib/api.ts` `getProfile`, `backend/src/auth/user.controller.ts`, `auth.service.ts` `profile()`.
  - Viết §2.9 gồm A / B / C theo khuôn §2.8, cùng skinparam. Sơ đồ có các nhánh:
    - chưa có token: GuestState, không gọi API;
    - 401 / 404: `handleUnauthorized()`, chuyển về `/login?next=/profile`;
    - lỗi khác: `role="alert"`;
    - 200: email, vai trò, điểm, "Mỗi 10.000đ… 1 điểm".
  - Ghi chú rằng `getProfile` sẽ có `cache: 'no-store'` sau khi T2 merge.
- **Acceptance:** khối PlantUML render sạch; mọi câu chữ giao diện trích trong sơ đồ đều grep thấy trong code.

### Card D-SEQ: tài liệu sequence (W2)

- **Worktree / branch:** `E:/CNPM/BrewLite-wt/d-seq` / `sync/d-seq`. Integrator đã fast-forward branch này theo `sync/uc-sequence` sau khi tích hợp W1.
- **Allowed:** `docs/user-sequence-specifications.md` (toàn file)
- **Đầu vào:**
  - `_coord/handoff/uc16-section.md`
  - `_coord/handoff/CR-*.md`
  - tên chuẩn UC trong `_coord/reports/d-uc.md`
- **Contract:**
  - **L1:** đưa 404/403/422 của "key thuộc đơn khác" vào bên trong nhánh "Đúng chủ đơn", sau bước tra key.
  - **L2:** xác minh `payment.service.ts` rồi sửa câu khóa ở §2.5 mục C (và §2.7 mục C nếu cũng sai).
  - **L3:** thêm `userId`, `idempotencyKey` vào dạng response ở §2.6 mục C và §2.7 mục C.
  - **L4:** §1.2, bảng Phần II dòng UC08–UC12 và §2.7 mục A: Admin (kế thừa Barista) dùng cùng màn `/barista`.
  - **L7:** §2.3 luồng 4 thêm `note` "áp dụng mọi vai trò".
  - **L8:** sửa dòng 8 và 1029 theo mục 2.
  - Áp các CR.
  - Chèn §2.9 sau §2.8.
  - Sửa phần khung:
    - mục lục;
    - "8 kịch bản" → 9; "8 sơ đồ cho 14 UC" → "9 sơ đồ cho 15 UC"; dòng 8 → "17 UC & 9 UC";
    - bảng Phần II thêm UC16;
    - Phần III: `GET /users/me` thành "UC16, §2.9", thêm dòng UC16 vào ma trận, thêm câu ghi chú về đề dòng 369.
- **Acceptance:**
  - 10 khối PlantUML render sạch.
  - Grep không còn: "chưa là UC riêng", "16 UC", "8 kịch bản", "8 sơ đồ cho 14", "Sequence thanh toán rút gọn".
  - Bảng Phần II có 15 UC đã hiện thực, cùng tên và cùng tác nhân với bảng §4 của file UC.
- **Commit:** `docs(sequence): sua thu tu 422 o 2.4, khoa huy don, dang response, them 2.9 UC16`

## 6. W3: Integrator kết thúc (chạy khi người dùng gọi "W3")

1. Sửa `docs/develop-status-report.md:109` và `docs/scrum-process.md:143`: số khối PlantUML 11 → 12, số test mới. Commit `docs: cap nhat so khoi PlantUML va so test`.
2. Chạy toàn bộ mục 8.
3. `/code-review high` trên `develop..sync/uc-sequence`. Có phát hiện thì soạn card sửa để người dùng giao; sửa xong thì review lại trong phạm vi đã sửa.
4. Chốt ledger: số liệu và dòng nhận xét.
5. Hỏi người dùng: merge `sync/uc-sequence` vào `develop`, giữ nhánh, hay bỏ.
6. Chỉ khi người dùng đồng ý merge: merge, rồi chạy `graphify update .` trong `E:/CNPM/BrewLite`, rồi xóa 5 worktree và `_coord/`.

## 7. Không làm

- Lỗi giỏ hàng; deps token của `use-order-poll`.
- `/admin` gọi API với token không phải ADMIN (§2.8 đã ghi đúng).
- Dọn các re-export mà tài liệu đang trích.
- Viết lại test CSS; thêm jsdom.
- Sửa đề; ẩn `idempotencyKey`; vẽ sơ đồ cho UC13 / UC15.
- Cài hook `git-guardrails-claude-code`: chỉ làm nếu người dùng muốn chặn bằng hook. Luật 3.3 cộng cổng 3.5 đã đủ cho lần này.

## 8. Kiểm chứng (trong `integration`, sau W2)

- `cd backend && npx jest`: xanh, số test ≥ mốc W0 cộng test mới.
- `cd frontend && npx vitest run && npx tsc --noEmit && npm run lint`: xanh, 48/48 file test, lint 0 lỗi.
- PlantUML: **12 khối** (UC 2, seq 10) render sạch. Mở ảnh Bản 1, §2.4, §2.7, §2.9 để xem bằng mắt.
- Grep theo acceptance của D-SEQ trên cả 2 file tài liệu.
- Đối chiếu chéo: 17 dòng bảng §4 của file UC khớp bảng Phần II và ma trận Phần III của file seq (mã, tên, tác nhân, mục §).
- `git log develop..sync/uc-sequence`: 5–6 commit task cộng các merge commit, không có trailer Co-Authored-By.
- Ledger có đủ dòng cho cả 5 card.

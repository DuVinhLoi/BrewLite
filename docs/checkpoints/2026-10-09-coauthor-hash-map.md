# Bảng ánh xạ hash có dòng `Co-Authored-By: Claude`

- **Ngày lập:** 2026-10-09.
- **Nguồn:** `develop` @ `bce799c` (139 commit). Bản đối chiếu là `develop-clean` @ `4be7034`, là bản đã xóa dòng `Co-Authored-By: Claude` nhưng **chưa push**.
- **Kiểm tra:** 139/139 vị trí khớp ngày tác giả, ngày commit, tác giả và tiêu đề. Cây file của `develop-clean` giống hệt `develop`.
- **Trạng thái trên remote:** `origin/develop` vẫn ở `79cfb62` (đã fetch). Cột "Hash mới" chỉ có hiệu lực sau khi nhánh viết lại được push.
- **Cột "Nơi":** `origin` = đã có trên `origin/develop`; `local` = chỉ có ở local `develop`, chưa push.

## Cách dùng

Khi một hash trong `docs/` (status report, checkpoint, plan) nằm trong bảng này, thay bằng hash mới sau khi viết lại được push. Hash không có trong bảng thì không đổi.

Commit checkpoint `4c2b994` không có trailer nên không nằm trong bảng. Nó nằm sau `bce799c` nên đổi hash khi viết lại: trên nhánh `develop` đã viết lại, nó là `912e0fd` (cùng tác giả và thời gian).

## Bảng (68 commit, cũ → mới, theo thứ tự thời gian)

| Hash cũ | Hash mới (`develop-clean`) | Nơi | Ngày | Đồng tác giả Claude | Tiêu đề |
|---|---|---|---|---|---|
| `8f2c514` | `7917f6c` | origin | 2026-10-08 | Sonnet 5.5 x1 | test(pg): pg-payment chạy lại được nhiều lần — dọn Payment→OrderItem→Order trước/sau, key ngẫu nhiên |
| `7cad02f` | `c73e451` | origin | 2026-10-08 | Sonnet 5.5 x1 | docs: nháp hồ sơ quy trình Scrum — Sprint Backlog 3 sprint, burndown từ git, khung Retrospective |
| `cfbf56a` | `b4f16d0` | origin | 2026-10-08 | Opus 5.5 x1 | merge: chore/pg-test-plantuml-scrum — pg test chay lai duoc, nhap ho so Scrum |
| `62c0868` | `023d35c` | origin | 2026-10-08 | Opus 5.5 x1 | docs: doi chieu de goc PDF, dong bo use case (root) voi sequence |
| `a23654c` | `07510e2` | origin | 2026-10-08 | Opus 5.5 x1 | docs: sua 4 cho lech phat hien khi code-review (spec axis) |
| `8425785` | `182611d` | origin | 2026-10-08 | Sonnet 5.5 x1 | fix(payment): mọi lỗi sau charge thành công đều hoàn tiền + PAYMENT_FAILED, không chỉ kẹt kho |
| `75e5e6f` | `6006e57` | origin | 2026-10-09 | Sonnet 5.5 x1 | fix(compose): cp .env.example .env rồi docker compose up không còn làm backend mất DB |
| `03c8aa8` | `f8a5427` | origin | 2026-10-09 | Sonnet 5.5 x1 | fix(frontend): thanh toán lỗi hiện câu tiếng Việt thay vì JSON thô |
| `0e8773b` | `d137c8c` | origin | 2026-10-09 | Opus 5.5 x1 | merge: fix/review-3-bugs — hoan tien moi loi sau charge, compose khong doc DATABASE_URL tu .env, UI loi thanh toan tieng Viet |
| `e672b04` | `d73a4fa` | origin | 2026-10-09 | Sonnet 5.5 x1 | feat(frontend): thanh tiến trình trạng thái đơn theo sơ đồ §9.1 (/history + biên lai) |
| `adf52ce` | `f62c692` | origin | 2026-10-09 | Sonnet 5.5 x1 | feat(frontend): nút "Quầy (demo)" tiến đơn PAID → PREPARING → READY → COMPLETED trên /history |
| `9861d70` | `b654bc3` | origin | 2026-10-09 | Sonnet 5.5 x1 | chore(demo): script curl demo Order State Machine + mục README |
| `e052551` | `42b81f4` | origin | 2026-10-09 | Sonnet 5.5 x1 | docs: Order State Machine hiện được trên giao diện — sơ đồ trạng thái §9.1, Kịch bản 4, UC06 (Use Case gốc giữ nguyên) |
| `e938c18` | `b368f67` | origin | 2026-10-09 | Opus 5.5 x1 | merge: feat/state-machine-visible — thanh tien trinh §9.1, nut Quay (demo), script demo, so do trang thai |
| `a7a3f98` | `7bcc832` | origin | 2026-10-09 | Opus 5.5 x1 | docs: use case tong quan 16 UC (Khach hang + Barista + Admin) va ban 2 phan he Khach hang |
| `259f9ff` | `388660c` | origin | 2026-10-09 | Opus 5.5 x1 | docs: chuyen plan/spec tu docs/superpowers (bi gitignore) sang docs/planning de commit |
| `da047b6` | `5d0865a` | origin | 2026-10-09 | Sonnet 5.5 x1 | docs: ghi lai plan sua 3 loi review (2026-10-09) va cap nhat status report |
| `96fbf9a` | `0cabcfa` | origin | 2026-10-09 | Sonnet 5.5 x1 | docs: tick cac o da xong o plan task-8-10 (10-04) va integration (10-07) |
| `b5fe9db` | `7878b93` | origin | 2026-10-09 | Sonnet 5.5 x1 | docs: don docs/planning - xoa plan da tick het, rut gon plan con o mo; cap nhat status report |
| `2ac0853` | `452ed06` | origin | 2026-10-09 | Sonnet 5.5 x1 | docs: use-case 16 UC co cot Trang thai hien thuc; dong bo sequence va scrum-process ve pham vi Barista/Admin |
| `cbfbdb8` | `a30383b` | origin | 2026-10-09 | Haiku 5.5 x1 | chore(skills): bo ban sao superpowers trung voi plugin 6.4.1 |
| `b495fbf` | `cace4c3` | origin | 2026-10-09 | Sonnet 5.5 x1 | feat(auth): vai tro CUSTOMER/BARISTA/ADMIN tren User + JWT + RolesGuard, seed tai khoan quay/quan tri |
| `8b97687` | `f23ae4a` | origin | 2026-10-09 | Sonnet 5.5 x1 | feat(order): hang doi quay GET /orders?status= cho BARISTA/ADMIN, FIFO, kem ten mon |
| `de96087` | `3a1292e` | origin | 2026-10-09 | Sonnet 5.5 x1 | feat(order): PATCH /orders/:id theo vai tro - chi quay/quan tri tien don, quay huy duoc don PAID (UC12) |
| `1538017` | `1de3ee8` | origin | 2026-10-09 | Sonnet 5.5 x1 | feat(product): API ton kho cho ADMIN - GET /admin/products, PATCH /admin/products/:id/stock (optimistic lock) |
| `fe0c06e` | `1be4426` | origin | 2026-10-09 | Sonnet 5.5 x1 | feat(frontend): doc vai tro tu JWT, dieu huong /barista /admin sau dang nhap, bo nut Quay (demo) |
| `d9117a3` | `ea4a291` | origin | 2026-10-09 | Sonnet 5.5 x1 | feat(frontend): man quay /barista - hang doi 3 cot, Nhan pha/Pha xong/Da giao, huy het nguyen lieu, tu tai lai 5s |
| `56f4027` | `2b23dc4` | origin | 2026-10-09 | Sonnet 5.5 x1 | feat(frontend): man ton kho /admin - xem ca mon het hang, dat so/cong tru, bao 409 khi kho vua doi |
| `7493606` | `15b144e` | origin | 2026-10-09 | Sonnet 5.5 x1 | docs: dong bo Barista/Admin - use case goc (UC08-UC12, UC14 hien thuc; UC13, UC15 backlog), sequence §2.7 §2.8, so do trang thai |
| `8c143d1` | `a6c0433` | origin | 2026-10-09 | Sonnet 5.5 x1 | chore(demo): script state machine dung tai khoan barista, kiem khach tu tien don bi 403 |
| `79ff5bb` | `e412654` | origin | 2026-10-09 | Sonnet 5.5 x1 | fix(backend): kiem staff theo danh sach duong, ?status lap lai tra 400, chan stock vuot Int32, seed staff theo email |
| `1a91348` | `c19e384` | origin | 2026-10-09 | Sonnet 5.5 x1 | fix(frontend): /barista chi tai khi la staff va dung khi 401/403, bo ban cu ghi de; 400 ton kho khong luon bao am; dung chung getToken |
| `129fcdf` | `c2bd420` | origin | 2026-10-09 | Sonnet 5.5 x1 | docs: sua scrum-process (Barista/Admin da co UC08-UC12, UC14), bao cao develop ghi bang chung compose that, README them luu y bao mat demo |
| `4974abd` | `ddb547a` | origin | 2026-10-09 | Sonnet 5.5 x1 | merge: feat/barista-admin - phan he Barista + Admin (UC08-UC12, UC14), vai tro User.role, man /barista /admin |
| `e94648d` | `1ec1852` | origin | 2026-10-09 | Opus 5.5 x1 | docs: xoa plan barista-admin da xong (merge 4974abd), tro status report sang git show |
| `43e87b5` | `9f20ab4` | origin | 2026-10-09 | Haiku 5.5 x1 | chore(docker): them .dockerignore cho backend va frontend |
| `79cfb62` | `96bfb90` | origin | 2026-10-09 | Haiku 5.5 x1 | docs: checkpoint 2026-10-09 va patch sua plan barista-admin sau review |
| `db47dda` | `c531c9e` | local | 2026-10-09 | Opus 5.5 x1 | docs: dong bo use-case/sequence voi code, plan doc-code-sync, rule .claude/rules/doc-code-sync.md |
| `3949c1a` | `3ab3299` | local | 2026-10-09 | Opus 5.5 x1 | fix(backend): bat buoc DATABASE_URL khi chay, bo bien PORT; chot Q4 modal |
| `e039890` | `2debfe5` | local | 2026-10-09 | Opus 5.5 x1 | docs: cap nhat bao cao trang thai, scrum va plan (D2, F1-F3, F6, Q3, Q4) |
| `805f807` | `cb484cd` | local | 2026-10-09 | Sonnet 5.5 x1 | docs: plan backend-hardening |
| `9344b9c` | `0e5aff5` | local | 2026-10-09 | Sonnet 5.5 x1 | fix(backend): chan topping khoa prototype, gioi han so luong va tong don |
| `facd300` | `ff119c9` | local | 2026-10-09 | Sonnet 5.5 x1 | fix(backend): huy don PAID chi hoan so thuc thu |
| `a37842f` | `e517ef7` | local | 2026-10-09 | Sonnet 5.5 x1 | fix(backend): Idempotency-Key dung cho don khac tra 422 |
| `bd3fb8b` | `413f025` | local | 2026-10-09 | Sonnet 5.5 x1 | feat: Idempotency-Key cho POST /orders (tieu chi b) |
| `751e734` | `3426350` | local | 2026-10-09 | Sonnet 5.5 x1 | feat: anh mon cho menu (seed imageUrl + SVG tinh) |
| `a4ba4d5` | `d82b44a` | local | 2026-10-09 | Sonnet 5.5 x1 | feat: cong gia tu choi theo MOCK_GATEWAY_DECLINE_METHOD de demo PAYMENT_FAILED |
| `049327b` | `ddef4d1` | local | 2026-10-09 | Sonnet 5.5 x1 | fix(seed): order-1042 dung bang gia |
| `2b819ed` | `59a65a5` | local | 2026-10-09 | Sonnet 5.5 x1 | refactor(backend): don smell sau code-review (khong doi hanh vi) |
| `cbf1f85` | `c2fd4ec` | local | 2026-10-09 | Sonnet 5.5 x1 | fix(backend): gioi han do dai Idempotency-Key (400 thay cho 500) |
| `8230566` | `f306de4` | local | 2026-10-09 | Sonnet 5.5 x1 | fix(frontend): sua kieu trong mock-products.test (imageUrl co the undefined) |
| `7081334` | `303f284` | local | 2026-10-09 | Sonnet 5.5 x1 | fix(frontend): tran 99 moi dong gio hang, khop @Max(99) cua POST /orders |
| `abaae5b` | `f8f4550` | local | 2026-10-09 | Sonnet 5.5 x1 | docs: bao cao backend-hardening |
| `57fd521` | `87dea97` | local | 2026-10-09 | Sonnet 5.5 x1 | docs: plan giu key tra tien (phuong an A) |
| `1998d45` | `a1faae6` | local | 2026-10-09 | Sonnet 5.5 x1 | test(backend): ghim thu lai cung Idempotency-Key sau loi cong / ket kho |
| `4c1675c` | `45fd462` | local | 2026-10-09 | Sonnet 5.5 x1 | fix(frontend): giu mot key tra tien cho moi man Thanh toan (phuong an A) |
| `585cc9f` | `d7393a5` | local | 2026-10-09 | Sonnet 5.5 x1 | docs: bao cao phuong an A va chot chan truoc merge |
| `66e66fc` | `76c58da` | local | 2026-10-09 | Haiku 5.5 x1 | chore(claude): bo 6 skill trung voi superpowers |
| `8520512` | `43a734f` | local | 2026-10-09 | Sonnet 5.5 x1 | docs: plan demo mượt (phien theo tab, giu don dang tra, du lieu demo ben) |
| `ad3be60` | `878bd5d` | local | 2026-10-09 | Sonnet 5.5 x1 | fix(frontend): moi tab mot phien dang nhap (token o sessionStorage) |
| `08941a6` | `5ac8e40` | local | 2026-10-09 | Sonnet 5.5 x1 | feat(frontend): giu don dang thanh toan do qua reload (sessionStorage theo gio) |
| `ebafb05` | `fe7eb42` | local | 2026-10-09 | Sonnet 5.5 x1 | feat(frontend): header hien tai khoan cua tab va nut Dang xuat |
| `313cebb` | `32cca89` | local | 2026-10-09 | Sonnet 5.5 x1 | fix(seed): chi tao du lieu con thieu, giu don va ton kho qua cac lan khoi dong |
| `f9fa917` | `0f1c777` | local | 2026-10-09 | Sonnet 5.5 x1 | feat(backend): smoke:clean don du lieu smoke (@smoke.test) khoi DB demo |
| `8559a24` | `fa9469f` | local | 2026-10-09 | Sonnet 5.5 x1 | fix(backend): smoke:clean tang timeout transaction len 60 giay |
| `b2bb5f6` | `1134395` | local | 2026-10-09 | Sonnet 5.5 x1 | docs: bao cao demo muot |
| `29abed8` | `5999610` | local | 2026-10-09 | Opus 5.5 x1 | docs: xoa 2 plan da xong, tro bao cao sang git show, ghi da lam sach DB demo |
| `bce799c` | `4be7034` | local | 2026-10-09 | Opus 5.5 x1 | merge: fix/backend-hardening - nghiep vu backend theo de, Idempotency-Key cho POST /orders, phuong an A, demo muot |

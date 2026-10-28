# Task 4 - Triển khai Sprint 1

Phần báo cáo này đối chiếu mục 6.1-6.4 của [đề Assignment 2](../../Assignment2-BrewLite.pdf), trang in 4-5, với nhánh `a2/Task4` tại commit `0030c2a672b883d00db931955e3672a7218106e6`. Ngày lập báo cáo: **23/10/2026**. Các nhận định về mã nguồn và tài liệu giới hạn ở phiên bản này; trạng thái GitHub được dẫn theo hồ sơ minh chứng có ghi ngày thu thập.

Mục tiêu Sprint 1 là xây dựng nền tảng kỹ thuật, quản lý tài liệu bằng Git và hiện thực một MVP chạy được cho luồng xem menu. Nhóm sử dụng Next.js cho frontend, NestJS cho backend và PostgreSQL để lưu dữ liệu. Kết quả của Sprint tạo nền tảng cho luồng đặt hàng và thanh toán trong Sprint 2.

## 4.1. Thiết lập repository

### 4.1.1. Tổ chức mã nguồn và cấu hình môi trường

Dự án được quản lý tại repository [DuVinhLoi/BrewLite](https://github.com/DuVinhLoi/BrewLite). Mã nguồn Assignment 2 được tổ chức trong cùng repository, tách frontend và backend thành hai ứng dụng độc lập. Mỗi ứng dụng có manifest và lockfile riêng để cài dependency bằng `npm ci`.

| Thành phần | Đường dẫn | Vai trò |
|---|---|---|
| Frontend | `apps/web/` | Next.js, giao diện menu, component và kiểm thử giao diện |
| Backend | `apps/api/` | NestJS, API sản phẩm, truy cập PostgreSQL qua Prisma |
| Tài liệu | `docs/` | Yêu cầu, sơ đồ, kiến trúc, backlog, truy vết và minh chứng |
| Tích hợp liên tục | `.github/workflows/ci.yml` | Kiểm tra tự động cả hai ứng dụng khi có pull request |
| Hướng dẫn sử dụng | `README.md` | Cài đặt, cấu hình, khởi tạo dữ liệu, chạy ứng dụng và kiểm thử |
| Quy trình đóng góp | `CONTRIBUTING.md` | Quy tắc branch, pull request, commit, review và Definition of Done |
| Cấu hình mẫu | `.env.example`, `apps/api/.env.example`, `apps/web/.env.example` | Mô tả biến môi trường để người khác thiết lập môi trường riêng |
| Phiên bản Node.js | `.nvmrc` | Thống nhất Node.js 24.19.0 giữa local và CI |

Backend sử dụng `DATABASE_URL`, `PORT` và `CORS_ORIGINS`; frontend sử dụng `NEXT_PUBLIC_API_URL`. Trong cấu hình local mặc định, frontend chạy tại `http://localhost:3000`, API tại `http://localhost:4000`. Các tệp môi trường thực tế, dependency và kết quả build được loại khỏi Git bằng `.gitignore`.

[README gốc](../../../README.md) hướng dẫn sao chép cấu hình mẫu, tạo database demo, generate Prisma Client, chạy migration và seed rồi khởi động hai ứng dụng. Dữ liệu kết nối phải được người chạy cấu hình trên môi trường riêng.

### 4.1.2. Chiến lược branch, pull request và commit

Nhánh tích hợp Assignment 2 là `develop-Assignment2`; phần việc Sprint 1 được triển khai trên `a2/Task4` và đưa vào [PR #9](https://github.com/DuVinhLoi/BrewLite/pull/9). Theo [quy trình đóng góp](../../../CONTRIBUTING.md), thay đổi được thực hiện trên nhánh task, mở pull request để review và chỉ tích hợp sau khi đạt các điều kiện chất lượng. Mỗi PR cần ít nhất một reviewer khác tác giả.

Mô tả PR phải nêu vấn đề, lý do thay đổi, hành vi sau thay đổi, mục đề hoặc mã yêu cầu liên quan và kết quả kiểm chứng. Quy ước commit sử dụng Conventional Commits với các loại như `feat`, `fix`, `test`, `docs`, `ci` và `chore` để phân biệt mục đích thay đổi.

Definition of Done đã được ghi trong `CONTRIBUTING.md`, bao gồm: đáp ứng tiêu chí chấp nhận và phụ thuộc; lint, test, typecheck/build liên quan đạt; CI xanh; tài liệu và truy vết khớp mã nguồn; kiểm tra diff; review độc lập và không còn blocker. Đây là các điều kiện được tài liệu hóa; việc cưỡng chế trên GitHub cần cấu hình bảo vệ nhánh riêng, được đánh giá tại mục 4.4.

### 4.1.3. Product Backlog

[Product Backlog](../../sprint/backlog.md) đã được lưu trong repository cho cả Sprint 1 và Sprint 2.

| Sprint | Nội dung được theo dõi |
|---|---|
| Sprint 1 | Yêu cầu, mô hình hóa, kiến trúc, thiết lập repository, quản lý tài liệu, API sản phẩm, menu, dữ liệu mẫu và CI |
| Sprint 2 | Chi tiết món và tùy chọn, giỏ hàng, xác thực, đơn hàng, thanh toán mô phỏng, trạng thái/lịch sử đơn, kiểm thử tích hợp/E2E, Docker Compose, health check, CD và bàn giao production |

Các item có mã định danh, truy vết và trạng thái/phụ thuộc. Hồ sơ hiện chưa có phân công cá nhân, ngày bắt đầu/kết thúc Sprint hoặc URL GitHub Projects. Đề cho phép sử dụng issue board hoặc Product Backlog; bản backlog trong repository là tạo phẩm đang có để đáp ứng phần lập danh sách công việc.

## 4.2. Quản lý tài liệu có kiểm soát phiên bản

Tài liệu được tổ chức trong `docs/`, liên kết từ README và lưu cùng lịch sử Git. Theo quy trình đóng góp, khi thay đổi yêu cầu hoặc hành vi, nhóm phải cập nhật các phần liên quan từ SRS, sơ đồ/ADR đến ma trận truy vết, code và test trong PR, đồng thời nêu lý do thay đổi.

| Nhóm tài liệu | Tạo phẩm trong nhánh khảo sát | Đánh giá |
|---|---|---|
| Task 1 - Yêu cầu | `docs/requirements/`: bối cảnh/phạm vi, SRS, use-case tổng quát, đặc tả checkout và sơ đồ liên quan | Có tạo phẩm và lịch sử thay đổi |
| Task 2 - Mô hình hóa | `docs/diagrams/`: activity, sequence, class và state diagram bổ sung; có nguồn `.puml` và bản `.svg` | Có tạo phẩm; sự tồn tại của tệp không thay cho nghiệm thu nội dung |
| Task 3 - Kiến trúc | `docs/architecture/README.md` và `adr/README.md` | Mới là hướng dẫn; chưa có mô tả kiến trúc, ADR thực chất và deployment diagram |
| Truy vết | `docs/traceability-matrix.md` | Đã bổ sung code/API và test Sprint 1; còn liên kết thiết kế cần hoàn thiện |
| Quản lý Sprint và minh chứng | `docs/sprint/backlog.md`, `docs/evidence/ci/`, checkpoint và báo cáo đồng bộ | Có backlog, log local, log/metadata GitHub và hồ sơ bàn giao |

Trong [ma trận truy vết](../../traceability-matrix.md), FR-01 đã liên kết tới API danh sách, component menu, seed và các test liên quan; FR-02 liên kết tới xử lý loading/empty/error và retry; FR-03 có API chi tiết cùng test trả 200/404, còn giao diện chi tiết thuộc Sprint 2. Cột thiết kế của các dòng này vẫn ghi chờ Task 2, dù các tệp sơ đồ đã tồn tại, nên chưa thể xem chuỗi truy vết là hoàn chỉnh.

Lịch sử đồng bộ tài liệu được ghi trong [báo cáo ngày 22/10/2026](../../planning/handoff/2026-10-21-req-sync/report-task4.md), trong đó nêu cách giữ các thay đổi yêu cầu và minh chứng CI khi giải xung đột ma trận. Cách ghi nhận này giúp người đọc xác định nguyên nhân và phạm vi thay đổi thay vì chỉ xem trạng thái cuối của tệp.

**Đánh giá Task 4.2:** đã có cơ chế quản lý tài liệu và tạo phẩm Task 1-2; yêu cầu đưa đầy đủ tạo phẩm Task 1-3 vào repository chưa đạt tại commit khảo sát vì Task 3 còn thiếu. Theo quy tắc thực hiện tuần tự của đề, đây là một điều kiện phải hoàn thiện trước khi nghiệm thu Task 4.

## 4.3. Hiện thực MVP Sprint 1

### 4.3.1. API danh mục sản phẩm

Backend tổ chức phần danh mục trong [Catalog Module](../../../apps/api/src/catalog/catalog.module.ts). Controller tiếp nhận request, service xử lý truy vấn và Prisma Service kết nối PostgreSQL. Hai endpoint được cung cấp cho khách chưa đăng nhập:

| Endpoint | Hành vi đã hiện thực |
|---|---|
| `GET /products` | Trả `200` cùng mảng sản phẩm, sắp xếp tên tăng dần; trả `[]` khi không có dữ liệu |
| `GET /products/:id` | Trả `200` cùng thông tin sản phẩm; trả `404` với mã `PRODUCT_NOT_FOUND` nếu ID không tồn tại |

Mỗi sản phẩm có `id`, `name`, `description`, `price`, `imageUrl` và `stock`. Giá lưu dưới dạng số nguyên VND. Khi xảy ra lỗi nội bộ, bộ xử lý lỗi trả mã `500` và thông báo chung, tránh đưa chi tiết lỗi database vào response.

Mã nguồn chính: [Catalog Controller](../../../apps/api/src/catalog/catalog.controller.ts), [Catalog Service](../../../apps/api/src/catalog/catalog.service.ts) và [bộ xử lý lỗi](../../../apps/api/src/common/api-exception.filter.ts).

### 4.3.2. Giao diện menu mobile-first

Frontend sử dụng Next.js, với [MenuScreen](../../../apps/web/src/components/menu/MenuScreen.tsx) phụ trách tải dữ liệu và trạng thái màn hình; [ProductCard](../../../apps/web/src/components/menu/ProductCard.tsx) hiển thị từng sản phẩm. Dữ liệu menu được lấy từ API thay vì gán cố định vào giao diện.

| Trạng thái | Hành vi giao diện |
|---|---|
| Loading | Hiển thị bốn thẻ skeleton và trạng thái đang tải thực đơn |
| Có dữ liệu | Hiển thị ảnh, tên, giá định dạng VND và thông tin tồn kho |
| Empty | Hiển thị thông báo “Hiện chưa có món nào” |
| Error | Hiển thị “Không tải được thực đơn” và nút “Thử lại”; xử lý cả mất mạng và HTTP lỗi |
| Sắp hết hàng | Hiển thị “Sắp hết, còn N” khi tồn kho từ 1 đến 5 |
| Hết hàng | Hiển thị “Hết hàng”, làm mờ ảnh và vô hiệu hóa nút “Thêm vào giỏ” |

CSS bắt đầu với một cột trên màn hình nhỏ, tăng lên hai cột từ 560 px và ba cột từ 900 px. Nội dung chính có cỡ chữ từ 16 px, hai loại nút thêm vào giỏ/thử lại có chiều cao tối thiểu 44 px. Đây là đặc điểm xác nhận từ mã nguồn; hồ sơ chưa có kết quả kiểm trực quan trên thiết bị thật hoặc đo đầy đủ các tiêu chí hiệu năng và khả dụng.

Nút “Thêm vào giỏ” mới có phần hiển thị và điều kiện disabled, chưa có thao tác thêm sản phẩm. Giao diện chi tiết, size/topping, giỏ hàng, xác thực, đặt đơn, thanh toán và chức năng PWA tiếp tục ở Sprint 2.

### 4.3.3. Migration và dữ liệu mẫu

[Prisma schema](../../../apps/api/prisma/schema.prisma) hiện có model `Product`, ánh xạ tới bảng `products`. Migration khởi tạo được lưu tại `apps/api/prisma/migrations/20261019000000_init/migration.sql`.

[Seed](../../../apps/api/prisma/seed.ts) định nghĩa tám sản phẩm: Cà phê sữa, Americano, Cappuccino, Trà đào, Trà sữa trân châu, Matcha latte, Bạc xỉu và Cold brew. Các mức tồn kho khác nhau phục vụ kiểm tra giao diện, chẳng hạn Cappuccino có giá 45.000đ và tồn 30, Bạc xỉu tồn 3, Cold brew tồn 0.

Seed dùng `upsert` theo ID để cập nhật hoặc tạo sản phẩm. Khi chạy lại trên database demo, dữ liệu mẫu có thể ghi lại giá và tồn kho; vì vậy không sử dụng thao tác này tùy tiện trên dữ liệu đang vận hành. Hồ sơ hiện chưa chứng minh tự động việc migrate/seed lặp lại trên một database trống.

### 4.3.4. Kiểm thử MVP

API sử dụng Jest, Nest Testing và Supertest. Năm test tại [products.e2e-spec.ts](../../../apps/api/test/products.e2e-spec.ts) gọi HTTP qua ứng dụng NestJS với Prisma provider giả:

| Mã test | Nội dung kiểm tra |
|---|---|
| API-T01 | Danh sách trả `200`, có dữ liệu sản phẩm và giá dạng số, không cần đăng nhập |
| API-T02 | Chi tiết sản phẩm trả `200`, có mô tả và truy vấn đúng ID |
| API-T03 | ID không tồn tại trả `404 PRODUCT_NOT_FOUND` |
| API-T04 | Danh sách rỗng trả `200` và `[]` |
| API-T05 | Lỗi database trả `500` với thông báo chung, không lộ chi tiết nội bộ |

Frontend sử dụng Vitest và Testing Library, gồm 13 test trong bốn tệp:

| Tệp kiểm thử | Số test | Phạm vi |
|---|---:|---|
| `src/lib/format.test.ts` | 3 | Định dạng tiền VND |
| `src/lib/stock.test.ts` | 3 | Nhãn còn hàng, sắp hết và hết hàng |
| `src/components/menu/ProductCard.test.tsx` | 3 | Hiển thị thông tin sản phẩm và trạng thái nút theo tồn kho |
| `src/components/menu/MenuScreen.test.tsx` | 4 | Loading, tám thẻ món, empty, mất mạng/retry và HTTP 503/retry |
| **Tổng frontend** | **13** | |

Ngày 23/10/2026, hai lệnh được chạy lại trên workspace của nhánh khảo sát, với kết quả:

| Lệnh | Kết quả thực tế |
|---|---|
| `npm.cmd --prefix apps/api test -- --runInBand` | Exit 0; 1 suite, 5/5 test đạt |
| `npm.cmd --prefix apps/web test` | Exit 0; 4 tệp, 13/13 test đạt |

Tổng cộng **18/18 test đạt** trong lần kiểm tra này. API test dùng Prisma giả; frontend test mô phỏng fetch. Kết quả này chứng minh các hành vi được kiểm tra trong bộ test, chưa thay thế kiểm thử frontend-backend-PostgreSQL xuyên suốt trên trình duyệt. Kiểm tra PostgreSQL thật được ghi riêng trong [checkpoint](../../checkpoints/2026-10-19-task4.md).

## 4.4. Thiết lập Continuous Integration

### 4.4.1. Cấu hình pipeline

[Workflow CI](../../../.github/workflows/ci.yml) chạy tự động khi mở hoặc cập nhật pull request vào `develop-Assignment2`, đồng thời hỗ trợ chạy thủ công bằng `workflow_dispatch`. Workflow có một job tên `ci`, chạy trên `ubuntu-latest` và sử dụng phiên bản Node.js từ `.nvmrc`.

Sau checkout và thiết lập Node.js, pipeline chạy tuần tự:

**Install → Lint → Unit Test → Build**

| Bước | Công việc |
|---|---|
| Install | `npm ci` cho API và web; generate Prisma Client |
| Lint | Chạy ESLint cho cả hai ứng dụng |
| Unit Test | Chạy bộ test API bằng Jest và web bằng Vitest |
| Build | Typecheck web, build NestJS API và build Next.js |

Pipeline không dùng `continue-on-error`; lỗi ở một bước khiến các bước thông thường tiếp theo không chạy. API test dùng Prisma giả nên job không cần database hoặc secret kết nối. Workflow chỉ cấp quyền `contents: read`, checkout không giữ credential và cache npm dựa trên lockfile của cả hai app.

### 4.4.2. Minh chứng pipeline thành công

[PR #9](https://github.com/DuVinhLoi/BrewLite/pull/9) đã kích hoạt [run 39555707525](https://github.com/DuVinhLoi/BrewLite/actions/runs/39555707525) ngày 21/10/2026 trên commit `8a39ea990290d7e1076ab72f82d9e98c3faf84bf`. Metadata và log lưu trong repository ghi nhận kết quả `success` cho cả bốn bước. API đạt 5/5 test, web đạt 13/13 test và bước Build thành công.

Minh chứng có thể kiểm tra qua [log pipeline thành công](github-green.txt), [metadata run](github-green-run.json) và [metadata job/steps](github-green-jobs.json). Đối chiếu Git cho thấy source, test, schema/seed, manifest/lockfile hai app, workflow CI và `.nvmrc` ở commit lập báo cáo không thay đổi so với commit của run này. Các lần sửa tài liệu về sau được quản lý riêng trong lịch sử nhánh.

### 4.4.3. Minh chứng pipeline phát hiện lỗi

Nhóm tạo [PR #10](https://github.com/DuVinhLoi/BrewLite/pull/10) trên nhánh demo riêng `a2/ci-demo-fail`, cố ý thay một kỳ vọng trong test định dạng tiền: kết quả của `formatVnd(45000)` bị đặt thành `0đ` thay vì `45.000đ`.

[Run 39555838160](https://github.com/DuVinhLoi/BrewLite/actions/runs/39555838160) ngày 21/10/2026 phát hiện sai khác này và kết thúc với `failure`. Log thể hiện:

```text
AssertionError: expected '45.000đ' to be '0đ'
Expected: "0đ"
Received: "45.000đ"
Tests  1 failed | 12 passed (13)
Process completed with exit code 1.
```

| Bước | Run thành công | Run cố ý lỗi |
|---|---|---|
| Install | success | success |
| Lint | success | success |
| Unit Test | success | failure |
| Build | success | skipped |

Minh chứng: [log phát hiện lỗi](github-red.txt), [metadata run](github-red-run.json) và [metadata job/steps](github-red-jobs.json). Hồ sơ PR đã lưu xác nhận PR #10 đóng và không merge; test sai không được đưa vào nhánh `a2/Task4`.

### 4.4.4. Điều kiện chặn merge

Đề yêu cầu pull request không được merge khi lint, test hoặc build thất bại. Pipeline phát hiện lỗi và bỏ qua Build mới chứng minh việc dừng các bước CI; để chặn merge còn cần cấu hình required status check trên nhánh tích hợp.

[Phản hồi GitHub lưu ngày 21/10/2026](github-branch-protection.txt) ghi nhận HTTP 403 khi truy vấn rules, với thông báo repository private cần gói hỗ trợ hoặc đổi visibility để sử dụng tính năng. Hồ sơ quyền truy cập tại thời điểm đó cho biết tài khoản kiểm tra có quyền push nhưng không có quyền admin. Trong nhánh khảo sát chưa có minh chứng bổ sung chứng nhận required check `ci` đã được bật và một PR lỗi thực sự bị chặn merge.

Vì vậy, **chưa xác nhận đạt đầy đủ Task 4.4**. Chủ repository cần cấu hình bảo vệ `develop-Assignment2`, yêu cầu check `ci`, kiểm tra việc chặn merge và lưu minh chứng. PR ở chế độ draft hoặc CI có kết quả đỏ không được dùng thay cho bằng chứng này.

## 4.5. Đánh giá kết quả Sprint 1

| Mục đề | Kết quả có minh chứng | Nội dung chưa hoàn tất/xác minh |
|---|---|---|
| Task 4.1 - Repository | Cấu trúc hai app và docs; README, ignore, env mẫu; quy trình branch/PR, commit, DoD; Product Backlog hai Sprint | Hồ sơ chưa có phân công cá nhân/ngày Sprint; cấu hình bảo vệ nhánh cần xác minh riêng |
| Task 4.2 - Tài liệu | Tạo phẩm Task 1-2 và lịch sử Git/PR; ma trận đã bổ sung code/API/test Sprint 1 | Thiếu tạo phẩm thực chất Task 3 và liên kết thiết kế còn chờ trong ma trận |
| Task 4.3 - MVP | Hai API sản phẩm, menu lấy dữ liệu từ API, loading/empty/error, seed tám món; kiểm tra lại 18/18 test đạt | Chưa có kiểm trực quan thiết bị thật, kiểm thử xuyên suốt với PostgreSQL và chứng minh migrate/seed lặp trên DB trống |
| Task 4.4 - CI | Workflow PR tự động; log thật cho pipeline thành công và phát hiện lỗi; lỗi test khiến Build bị bỏ qua | Chưa có bằng chứng merge bị chặn khi lint/test/build thất bại |

Sprint 1 đã tạo được MVP cho luồng xem menu, nền tảng kiểm thử và pipeline kiểm tra tự động. Tuy nhiên, tại commit khảo sát, chưa đủ cơ sở tuyên bố Task 4 được nghiệm thu toàn bộ do thiếu tạo phẩm Task 3 và minh chứng required check chặn merge. Việc hoàn thiện các điều kiện này cần được thực hiện trước khi chốt nghiệm thu theo thứ tự của đề.

Docker Compose, health endpoint, đóng gói image, CD, production, rollback và luồng đặt hàng/thanh toán được triển khai tiếp trong Task 5. Các nội dung này không được tính là thành quả đã có của Sprint 1.

## 4.6. Danh mục minh chứng kèm báo cáo

| Mã | Minh chứng | Nguồn kiểm tra |
|---|---|---|
| MC-T4-01 | Repository, nhánh Task 4 và PR triển khai | [Repository](https://github.com/DuVinhLoi/BrewLite), [PR #9](https://github.com/DuVinhLoi/BrewLite/pull/9); phiên bản khảo sát `0030c2a` |
| MC-T4-02 | Hướng dẫn chạy, quy trình đóng góp và backlog | [README](../../../README.md), [CONTRIBUTING](../../../CONTRIBUTING.md), [backlog](../../sprint/backlog.md) |
| MC-T4-03 | API, dữ liệu mẫu và kiểm thử | [API test](../../../apps/api/test/products.e2e-spec.ts), [seed](../../../apps/api/prisma/seed.ts), [MenuScreen test](../../../apps/web/src/components/menu/MenuScreen.test.tsx) |
| MC-T4-04 | Cấu hình CI | [ci.yml](../../../.github/workflows/ci.yml) |
| MC-T4-05 | Pipeline thành công | [Run 39555707525](https://github.com/DuVinhLoi/BrewLite/actions/runs/39555707525), [log](github-green.txt) |
| MC-T4-06 | Pipeline phát hiện lỗi | [PR #10](https://github.com/DuVinhLoi/BrewLite/pull/10), [run 39555838160](https://github.com/DuVinhLoi/BrewLite/actions/runs/39555838160), [log](github-red.txt) |
| MC-T4-07 | Giới hạn bảo vệ nhánh đã ghi nhận | [Phản hồi rules API](github-branch-protection.txt), [hồ sơ quyền](github-repository-access.json) |
| MC-T4-08 | Lịch sử kiểm local và đồng bộ tài liệu | [Log local ngày 19/10](local-verification.txt), [checkpoint](../../checkpoints/2026-10-19-task4.md), [báo cáo đồng bộ ngày 22/10](../../planning/handoff/2026-10-21-req-sync/report-task4.md) |

Các log và metadata trên là minh chứng đã có; báo cáo không thay thế chúng bằng ảnh mô phỏng. Kết quả chạy lại test ngày 23/10 được ghi tại mục 4.3.4. Lint, typecheck và build không được chạy lại trong phiên soạn báo cáo; kết quả tương ứng được dẫn từ hồ sơ CI đã lưu. Không thực hiện migrate/seed lại hoặc thay đổi dữ liệu trong phiên này.

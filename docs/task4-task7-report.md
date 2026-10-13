# Báo cáo Task 4 và Task 7 — BrewLite, 13/10/2026

Task ID: Task 4 / Task 7. Branch: `feat/task4-task7`. Worktree: `C:\BrewLite-task4-task7`.
Nguồn: `origin/develop`, HEAD `92ff320e7070c611cec0b0a81ca23b337eca41f0`. Không tạo commit hoặc push; toàn bộ thay đổi để nhóm review.
Worktree riêng đã tồn tại và sạch khi bắt đầu. Không di chuyển code chưa commit từ worktree gốc, không xử lý bốn conflict của `C:\BrewLite`, không stash/reset/clean/merge/rebase/cherry-pick. Không sửa .env thật hoặc dữ liệu database.

## 1. Phát hiện và phạm vi

Bản nguồn đã có cả hai task: modal sản phẩm, bảng giá, Zustand cart, Login/Register chung tại `/login`, bcryptjs, JWT, guard và POST /orders lấy req.user.id. Đợt này bổ sung các khoảng thiếu và kiểm thử, không viết lại chức năng đã có. API contract, schema, migration, dependency và business logic tạo đơn được giữ nguyên.

## 2. File tạo/sửa và lý do

| Đường dẫn | Thay đổi |
|---|---|
| backend/src/auth/dto.ts | Chuẩn hóa email trim/lowercase trước validate; cùng helper dùng trong service. |
| backend/src/auth/auth.service.ts | Lookup/lưu email chuẩn hóa; bắt lỗi unique email P2002 khi có đăng ký đồng thời, trả 409; lỗi DB khác vẫn được ném. |
| backend/src/auth/auth.module.ts | Đọc JWT_SECRET lúc khởi tạo module, từ chối thiếu/rỗng; bỏ secret hardcode trong mã auth, giữ thời hạn 7 ngày. |
| backend/src/auth/jwt-auth.guard.ts | Sau xác minh chữ ký/thời hạn, kiểm tra sub/email là chuỗi không rỗng trước gắn danh tính. |
| backend/src/prisma/prisma-user.repo.ts | Lookup email không phân biệt hoa/thường để tài khoản cũ có email viết hoa vẫn dùng được; giữ import User. |
| backend/src/stubs/in-memory-user.repo.ts | Kho test có cùng cách so sánh email không phân biệt hoa/thường. |
| backend/test/task47-auth.spec.ts | 14 test hồi quy/email/JWT/secret và HTTP Nest; HTTP fixture dùng kho in-memory, order service spy, không kết nối DB. |
| frontend/src/lib/api.ts | Thêm getProduct(id), GET /products/:id với ID encode, no-store; giữ mã lỗi/404, không dùng mock thay lỗi. |
| frontend/src/components/ProductDetailModal.tsx | Chế độ tải API, loading/lỗi/404/retry; ẩn tùy chọn cũ khi chưa tải; chặn thêm món lỗi/hết hàng. |
| frontend/src/components/ProductCard.tsx | Mở modal tải API khi có NEXT_PUBLIC_API_URL; giữ tùy chọn dùng dữ liệu có sẵn trong demo không cấu hình API. |
| frontend/src/lib/product-detail.test.ts | 4 test endpoint, chuẩn hóa response, lỗi 404/500 và mất kết nối. |
| frontend/src/components/ProductDetailLoading.test.ts | 6 test HTML cho loading/lỗi/retry, giá/tồn kho mới và nút thêm món hết hàng. |
| docs/planning/2026-10-13-task4-task7-plan.md | Kế hoạch và giới hạn triển khai. |
| docs/task4-task7-report.md | Báo cáo này và hướng dẫn review/chạy/kiểm tra. |

Tích hợp Task 5: tiếp tục gọi useCart.addItem với cùng payload; không sửa store/cart. Task 6: không sửa controller/service/DTO tạo đơn; HTTP test chứng minh client userId không được dùng. ProductCard chỉ thay cách mở modal, API client chỉ thêm hàm chi tiết; không tái cấu trúc menu hoặc module khác.

## 3. Task 4

Mở chi tiết từ menu, lấy dữ liệu mới từ GET /products/:id trong chế độ API thật. Có loading, lỗi kèm retry, 404 và trạng thái hết hàng. Chọn S/M/L, topping, số lượng và giá cập nhật theo logic hiện có; thêm vào giỏ Zustand. Giữ style, responsive, aria-modal, Escape và bẫy focus hiện có.

Bảng giá được tái sử dụng, không tự đặt giá mới: S +0, M +5.000, L +10.000; Trân châu +5.000, Kem cheese +8.000, Thạch cà phê +6.000 VND. Công thức frontend: calcUnitPrice + calcLineTotal; backend vẫn tự tính lại theo bảng đã có. Test pricing/cart và bảng phí backend hiện có vẫn pass. Chế độ demo cũ chỉ hoạt động khi không cấu hình API; lỗi API thật không được thay bằng mock.

## 4. Task 7

Giữ POST /auth/register và POST /auth/login. Register validate DTO, chuẩn hóa email, từ chối trùng, bcrypt 10 rounds, chỉ trả id/email. Login so sánh bcrypt và phát JWT 7 ngày chỉ mang sub/email/role cùng iat/exp; response không lộ hash. Guard từ chối thiếu token, token hỏng, hết hạn, sai chữ ký hoặc claim định danh sai. Register công khai luôn tạo CUSTOMER.

Giao diện Login/Register đã có nên được tái sử dụng: form gọi backend thật, validate/loading/thông báo lỗi và đăng ký thành công. Token lưu sessionStorage theo tab, gửi Authorization: Bearer cho API bảo vệ, xóa khi đăng xuất hoặc nhận 401; không đưa secret/database URL vào frontend. POST /orders giữ guard/role và lấy req.user.id.

## 5. Lỗi Prisma User

Tái hiện nguyên văn TS2305 thiếu User trước generate; Product/Payment/OrderGetPayload cũng thiếu. package.json và lockfile đều dùng prisma/@prisma/client 6.19.3. Schema thật backend/prisma/schema.prisma có model User và generator prisma-client-js, không custom output.

npm ci trong môi trường này chặn postinstall chưa được approve, nên client cài ban đầu chưa có type model theo schema. Lệnh dưới tạo client 6.19.3 thành công; build sau đó pass:

```powershell
Set-Location C:\BrewLite-task4-task7\backend
node node_modules/prisma/build/index.js generate --schema prisma/schema.prisma
```

Giữ import User, không đổi tên model, không thêm schema/migration và không chạy reset. Client được generate trong node_modules (ignored); máy khác cần generate sau khi cài dependency nếu postinstall bị chặn. Lookup email của Prisma repo được sửa riêng cho tương thích auth, không phải để né lỗi User.

## 6. Kiểm thử thực sự đã chạy

| Lệnh / vị trí | Kết quả |
|---|---|
| npm ci --no-audit --no-fund, backend + frontend | Pass; cài theo lockfile, không đổi dependency/lockfile. Hai lần thử npm.cmd trước đó thất bại vì máy dùng npm.exe. |
| npm run build, backend trước generate | Fail: thiếu type Prisma User/Product/Payment/OrderGetPayload. |
| node node_modules/prisma/build/index.js generate --schema prisma/schema.prisma, backend | Pass, generated v6.19.3. |
| npm run build, backend sau sửa cuối | Pass, exit 0. |
| npm test, backend sau sửa cuối | 166 pass / 3 skip, 15 suite pass / 2 suite skip, exit 0. Skip PostgreSQL vì không có DATABASE_URL. |
| npm test -- --runTestsByPath test/task47-auth.spec.ts | Red trước sửa email/claim/HTTP; green sau sửa. Test tài khoản cũ cũng đã red 401 trước sửa repository. |
| Cùng test auth với DATABASE_URL trỏ localhost:1 | 13/13 pass ở lần kiểm tra cách ly trước khi thêm test tài khoản cũ; không dùng DB thực. |
| npm test, frontend baseline | 836/836 pass. |
| npm test, frontend sau sửa | 846/846 pass, 50 suite pass, exit 0. |
| npm run lint, frontend | Không có lỗi, có cảnh báo next/no-img-element của style ảnh SVG hiện có. |
| node node_modules/typescript/bin/tsc --noEmit, frontend | Pass; không có script typecheck riêng. |
| npm run build, frontend | Pass; tạo 10 trang tĩnh, exit 0. |
| git diff --check / git diff --name-status | Đã chạy, whitespace đã sửa; diff nằm trong phạm vi trên. File mới được kiểm tra thêm bằng git ls-files --others --exclude-standard. |

HTTP test chạy server Nest trên localhost/cổng ngẫu nhiên, kiểm tra 201 đăng ký, 400 validate, 409 trùng, 200 đăng nhập, 401 sai mật khẩu/thiếu token/token hỏng và POST /orders dùng JWT ID. Order service được thay bằng spy trong test: đây không phải kiểm thử tạo đơn qua PostgreSQL. Lỗi unique race được mô phỏng bằng lỗi P2002, chưa chạy hai request đồng thời với DB thực. Không chạy các thao tác dọn/reset dữ liệu.

Review read-only phát hiện và đã sửa mất chế độ demo, test phụ thuộc DATABASE_URL. Các test mới cách ly khỏi DB dùng chung.

## 7. Biến môi trường và chạy hai terminal

Backend: DATABASE_URL bắt buộc, JWT_SECRET bắt buộc và không rỗng, CORS_ORIGIN cho origin frontend. Backend không tự đọc .env. Frontend: NEXT_PUBLIC_API_URL=http://localhost:3000 để dùng API thật; NEXT_PUBLIC_PAYMENT_MODE=api để nối luồng thanh toán hiện có. Các mẫu .env.example đã có đủ biến, không cần chỉnh.

Cần PostgreSQL đã được nhóm chuẩn bị đúng schema/migration và có sản phẩm. Agent chưa tạo DB, apply migration hoặc seed. Chỉ dùng database thử nghiệm cho thử register/order; các API này tạo dữ liệu.

Terminal 1 — backend (nhập giá trị của môi trường được nhóm cấp, không dùng DB/secret chung trong ví dụ):

```powershell
Set-Location C:\BrewLite-task4-task7\backend
$env:DATABASE_URL = Read-Host 'DATABASE_URL của database thử nghiệm đã chuẩn bị'
$env:JWT_SECRET = Read-Host 'JWT_SECRET riêng của môi trường thử nghiệm'
$env:CORS_ORIGIN = 'http://localhost:3001'
node node_modules/prisma/build/index.js generate --schema prisma/schema.prisma
npm run start:dev
```

Terminal 2 — frontend:

```powershell
Set-Location C:\BrewLite-task4-task7\frontend
$env:NEXT_PUBLIC_API_URL = 'http://localhost:3000'
$env:NEXT_PUBLIC_PAYMENT_MODE = 'api'
npm run dev
```

Mở http://localhost:3001. Nếu chạy compose thay cho hai terminal, cần cấp JWT_SECRET riêng qua môi trường trước khi chạy; default dev trong compose vẫn thuộc cấu hình demo có sẵn.

## 8. Postman / cURL / trình duyệt

Postman: base http://localhost:3000, body raw JSON, Content-Type application/json. Dùng email thử nghiệm chưa tồn tại và mật khẩu ví dụ thay thế.

1. GET /products và GET /products/{id thật}: 200; ID không có: 404.
2. POST /auth/register body {"email":"Test47@Example.test","password":"SamplePass47!"}: 201 id/email lowercase, không hash. Gửi lại cùng email hoặc đổi hoa/thường: 409. Email sai/mật khẩu ngắn: 400.
3. POST /auth/login body tương tự: 200 accessToken/user; mật khẩu sai: 401.
4. POST /orders body {"items":[{"productId":"ID từ menu","quantity":1,"size":"M","toppings":[]}]}: thiếu token hoặc Bearer invalid phải 401. Chọn Authorization → Bearer Token và nhập accessToken: với sản phẩm còn hàng phải 201. Field là quantity, không phải qty.
5. Thêm userId giả vào body: server vẫn dùng danh tính JWT. Không dùng tài khoản nhân viên để tạo đơn khách (role guard hiện có sẽ 403).

Ví dụ cURL trong Git Bash, chỉ chạy khi backend và database thử nghiệm đã sẵn sàng; mật khẩu dưới là dữ liệu mẫu:

```bash
curl -i http://localhost:3000/products
curl -i http://localhost:3000/products/not-found
curl -i http://localhost:3000/auth/register -H 'Content-Type: application/json' -d '{"email":"Test47@Example.test","password":"SamplePass47!"}'
curl -i http://localhost:3000/auth/login -H 'Content-Type: application/json' -d '{"email":"test47@example.test","password":"SamplePass47!"}'
curl -i http://localhost:3000/orders -H 'Content-Type: application/json' -d '{"items":[{"productId":"replace-with-real-product-id","quantity":1,"size":"M","toppings":[]}]}'
```

Request cuối phải 401. Để kiểm tra request có xác thực, thêm header Authorization: Bearer với accessToken vừa nhận trong Postman; không paste token vào báo cáo/log.

Trình duyệt: mở /login → tab đăng ký → đăng nhập → menu → tùy chọn size/topping → thay S/M/L/topping/quantity, kiểm tra tạm tính và giỏ → tạo đơn qua luồng hiện có. Có thể dùng DevTools Network throttling để thấy loading, tắt backend để thử lỗi/retry; 404 cần ID đã xóa hoặc request kiểm thử. Kiểm tra mobile 360/760px và desktop. Khi đăng xuất/401 token của tab được xóa; giỏ giữ nguyên theo cơ chế cũ.

## 9. Giới hạn và đưa code vào develop

Chưa kiểm thử PostgreSQL/E2E browser hoặc ảnh chụp responsive; không có DATABASE_URL/database thử nghiệm được cấp. Unit test, HTML component test và HTTP Nest in-memory không thay thế các kiểm tra này. Task 5/6 đã có trong origin/develop và không có blocker code từ worktree gốc. Trường hợp DB lịch sử đã có nhiều tài khoản cùng email khác hoa/thường cần nhóm đối soát riêng; không tự sửa dữ liệu hay unique index.

Nhóm review tại worktree riêng bằng git status, git diff và đọc các file mới ở bảng trên. Chạy lại các lệnh trong mục 6, sau đó cung cấp DB thử nghiệm để kiểm tra mục 8. Người dùng tự quyết định commit/push/PR từ feat/task4-task7 khi đã review; chưa có commit SHA mới. Chỉ đưa thay đổi vào develop sau khi nhóm xử lý trạng thái/conflict hiện có của worktree gốc theo quy trình của nhóm. Agent không thực hiện bước tích hợp Git này.

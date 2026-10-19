# BrewLite — Assignment 2

MVP Sprint 1 dùng **Next.js**, **NestJS** và **PostgreSQL**: xem menu, giá, tồn kho, loading/empty/error và API chi tiết sản phẩm. Giỏ hàng, tài khoản, thanh toán và PWA thuộc Task 5; nút thêm vào giỏ chưa thực hiện thao tác.

Task 4 đang là bản nháp trên `a2/Task4`. Task 2–3 chưa có tạo phẩm bắt buộc trong checkout này, nên chưa đủ điều kiện merge/nghiệm thu. Xem [checkpoint Task 4](docs/checkpoints/2026-10-19-task4.md) để biết kiểm chứng và phần còn thiếu. Nhóm phải đọc, hiểu và giải thích được code khi vấn đáp.

## Tài liệu và backlog

- [Đề A2](docs/Assignment2-BrewLite.md), [kế hoạch Task 1–5](docs/planning/2026-10-15-assignment2-plan.md).
- [Yêu cầu](docs/requirements/README.md), [sơ đồ Task 2](docs/diagrams/README.md), [kiến trúc Task 3](docs/architecture/README.md).
- [Ma trận truy vết](docs/traceability-matrix.md), [Product Backlog Sprint 1 và 2](docs/sprint/backlog.md).
- [Branch, PR, commit và Definition of Done](CONTRIBUTING.md), [CI và minh chứng](docs/evidence/ci/README.md).

Code A1 ở nhánh `develop` (`backend/`, `frontend/`), không phải code A2 trong `apps/`. Tài liệu A1 trong `docs/reference/a1/` và các kế hoạch cũ chỉ dùng tham khảo.

## Chạy local

Cần **Node.js 24.19.0** (file `.nvmrc`), npm và một database **PostgreSQL** riêng cho demo. Hai app cài dependency độc lập bằng lockfile; không cần `package.json` ở gốc.

Ví dụ dùng PowerShell, chạy từ thư mục gốc trên bản clone mới. Windows dùng `npm.cmd` nếu PowerShell chặn `npm.ps1`; macOS/Linux dùng `npm`, `cp` thay `Copy-Item`.

```powershell
Copy-Item apps/api/.env.example apps/api/.env
Copy-Item apps/web/.env.example apps/web/.env.local
npm.cmd --prefix apps/api ci
npm.cmd --prefix apps/web ci
```

Tạo database demo tên `brewlite` bằng công cụ PostgreSQL của bạn, rồi điền `DATABASE_URL` trong `apps/api/.env` bằng thông tin kết nối riêng. Định dạng: `postgresql://DB_USER:DB_PASSWORD@localhost:5432/brewlite?schema=public`; thay user/password/cổng theo máy, URL-encode ký tự đặc biệt. Các file `.env` thật được Git bỏ qua. `.env.example` ở gốc chỉ liệt kê biến, không được app tự nạp.

| App | Biến | Ý nghĩa / giá trị local |
|---|---|---|
| API | `DATABASE_URL` | URL PostgreSQL; phải điền trước khi migrate/start |
| API | `PORT` | Mặc định `4000` |
| API | `CORS_ORIGINS` | Danh sách origin ngăn cách bằng dấu phẩy; mặc định `http://localhost:3000` |
| Web | `NEXT_PUBLIC_API_URL` | Mặc định `http://localhost:4000`, không thêm `/` cuối; được nhúng lúc build |

Khởi tạo database demo từ `apps/api` (Prisma nạp `.env` ở thư mục này):

```powershell
Set-Location apps/api
npm.cmd run prisma:generate
npm.cmd run prisma:migrate
npm.cmd run prisma:seed
npm.cmd run start:dev
```

Seed upsert 8 sản phẩm theo SRS mục 3.3, gồm Bạc xỉu tồn 3 và Cold brew tồn 0. Chạy lại không tạo trùng ID nhưng cập nhật giá/tồn kho về dữ liệu mẫu, nên chỉ dùng trên database demo. Tài khoản, size/topping và các lớp domain còn lại sẽ bổ sung ở Task 5.

Mở terminal thứ hai từ thư mục gốc:

```powershell
npm.cmd --prefix apps/web run dev
```

Mở `http://localhost:3000`. API ở `http://localhost:4000`. Đổi cổng web thì cập nhật `CORS_ORIGINS`; đổi API URL thì cập nhật web env và khởi động/build lại web.

## API Sprint 1

| Endpoint (không cần token) | Kết quả |
|---|---|
| `GET /products` | `200` mảng sản phẩm; `[]` khi bảng rỗng |
| `GET /products/:id` | `200` sản phẩm, hoặc `404 PRODUCT_NOT_FOUND` |

Product có `id`, `name`, `description`, `price` (số nguyên VND), `imageUrl`, `stock`. Ảnh `/images/*.svg` nằm trong `apps/web/public`, do web phục vụ. Lỗi dùng các trường `statusCode`, `error`, `message`; lỗi nội bộ trả 500 với thông báo chung.

```powershell
Invoke-RestMethod http://localhost:4000/products
Invoke-RestMethod http://localhost:4000/products/cappuccino
```

## Lint, test và build

Chạy từ thư mục gốc sau khi cài dependency và generate Prisma Client:

```powershell
npm.cmd --prefix apps/api run lint
npm.cmd --prefix apps/web run lint
npm.cmd --prefix apps/api test -- --runInBand
npm.cmd --prefix apps/web test
npm.cmd --prefix apps/web run typecheck
npm.cmd --prefix apps/api run build
npm.cmd --prefix apps/web run build
git diff --check
```

API test chạy NestJS/HTTP với Prisma provider giả, không cần database; web test dùng Vitest + Testing Library. Kiểm PostgreSQL thật được ghi riêng trong checkpoint.

Sau build, chạy production local ở hai terminal:

```powershell
npm.cmd --prefix apps/api run start:prod
npm.cmd --prefix apps/web start
```

## CI và nghiệm thu

[Workflow CI](.github/workflows/ci.yml) chạy khi mở/cập nhật PR vào `develop-Assignment2`: **Install → Lint → Unit Test → Build** cho cả hai app, cùng Node trong `.nvmrc`, một job tên `ci`. Không cần secret hay database cho job này.

Quản trị viên còn phải bật branch protection yêu cầu check `ci` và một approval để chặn merge khi lỗi. Hướng dẫn/bằng chứng xanh-đỏ ở [hồ sơ CI](docs/evidence/ci/README.md); có workflow trong source chưa chứng minh GitHub đã bật các thiết lập này.

Docker Compose, `GET /health`, CD, deploy production, rollback và release thuộc Task 5. Chưa có URL production, workflow CD hoặc quy trình rollback đã kiểm chứng trong Sprint 1.

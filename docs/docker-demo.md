# Demo web + API + PostgreSQL trong một container

Task `BREW-DOCKER-DEMO-01`, branch `feat/ingredient-inventory`, worktree `C:\Users\baoth\orca\workspaces\BrewLite\jumbo`. Container này phục vụ demo local theo lựa chọn của người dùng.

## Chạy trên máy hiện tại

Docker Engine đã được cài và khởi động trong distro Ubuntu WSL. Từ PowerShell ở thư mục dự án:

```powershell
wsl.exe -d Ubuntu -u root --cd "$PWD" -- /usr/bin/docker compose -f compose.demo.yml up -d --build --wait
if ($LASTEXITCODE -ne 0) { throw 'Không khởi động được demo' }
Start-Process wsl.exe -ArgumentList '-d','Ubuntu','-u','root','--','/usr/bin/docker','wait','brewlite-demo-demo-1' -WindowStyle Hidden
```

Trên máy này, WSL tự tắt khi không còn tiến trình foreground từ Windows dù Docker là systemd service. Đây cũng là hành vi [Microsoft mô tả cho systemd trong WSL](https://learn.microsoft.com/en-us/windows/wsl/systemd). `docker wait` ẩn giữ distro hoạt động, tự thoát khi container dừng; không sửa cấu hình WSL toàn máy. Nếu muốn xem log ở terminal và giữ WSL trực tiếp, dùng `wsl.exe -d Ubuntu -u root --cd "$PWD" -- /usr/bin/docker compose -f compose.demo.yml up --build` và để terminal mở.

Mở <http://localhost:3000>. Đăng nhập `barista.demo@brewlite.local` để quản lý kho hoặc `customer.demo@brewlite.local` để mua hàng; mật khẩu chung `Demo@12345`.

Xem trạng thái và log:

```powershell
wsl.exe -d Ubuntu -u root --cd "$PWD" -- /usr/bin/docker compose -f compose.demo.yml ps
wsl.exe -d Ubuntu -u root --cd "$PWD" -- /usr/bin/docker compose -f compose.demo.yml logs --tail 80
```

Dừng và chạy lại, giữ dữ liệu:

```powershell
wsl.exe -d Ubuntu -u root --cd "$PWD" -- /usr/bin/docker compose -f compose.demo.yml down
wsl.exe -d Ubuntu -u root --cd "$PWD" -- /usr/bin/docker compose -f compose.demo.yml up -d --wait
if ($LASTEXITCODE -ne 0) { throw 'Không khởi động được demo' }
Start-Process wsl.exe -ArgumentList '-d','Ubuntu','-u','root','--','/usr/bin/docker','wait','brewlite-demo-demo-1' -WindowStyle Hidden
```

Nếu máy khác đã có Docker CLI hoạt động, dùng trực tiếp `docker compose -f compose.demo.yml ...`. Đổi cổng bằng `DEMO_PORT`; với WSL, thay đoạn `-- /usr/bin/docker` bằng `-- env DEMO_PORT=8080 /usr/bin/docker`. API dùng `/api` cùng origin nên không cần build lại khi đổi cổng.

## Dữ liệu và tiến trình

- Image `brewlite-demo:local`, service duy nhất `demo`, container `brewlite-demo-demo-1`.
- Volume `brewlite-demo_demo_data` chứa PostgreSQL và secret database/JWT được sinh ngẫu nhiên. `down` giữ volume; không dùng `down -v` nếu muốn giữ dữ liệu.
- Web công bố duy nhất `127.0.0.1:3000`. API chạy cổng 4000 trong container; PostgreSQL chỉ nghe loopback trong container.
- Startup đợi database, chạy migration và seed bổ sung bản ghi còn thiếu rồi khởi động API/web. Seed không ghi đè tồn kho hoặc công thức hiện có. Database mới có 8 món, 15 nguyên liệu, 27 công thức và tồn kho 0; nhân viên nhập kho ở `/inventory`.
- Tini chuyển tín hiệu cho các tiến trình; entrypoint dừng PostgreSQL và các app khi nhận yêu cầu dừng hoặc một dịch vụ thoát. App chạy bằng user `brewlite`, database bằng user `postgres`.
- Cấu hình tách dịch vụ trong `docker-compose.yml` vẫn dùng được như trước. Không thay đổi dependency ứng dụng, không thêm lại bộ test đã xóa theo yêu cầu.

## Kiểm chứng ngày 29/10/2026

Đã build và chạy image thực tế; container được để chạy cho người dùng. Docker Engine 29.9.2 và Compose 5.6.1 trong Ubuntu WSL. Image ID `sha256:44b66a5f0400d050e5ea685fa877fa78bf92eb82f6c449b0513b9cdc57484d23`, dung lượng local 1.31 GB. HEAD vẫn là `73a6ccb53691d5a6304d631761f1b7446a25701a`; chưa tạo commit/push hoặc deploy production.

| Kiểm tra | Kết quả thực tế |
|---|---|
| `bash -n docker/demo-entrypoint.sh` trong Ubuntu WSL | Exit 0 |
| Web lint, typecheck và build với `NEXT_PUBLIC_API_URL=/api`, `BREWLITE_SINGLE_CONTAINER=true` | Exit 0 |
| `docker compose -f compose.demo.yml config --quiet` | Exit 0 |
| `docker compose -f compose.demo.yml up -d --build --wait --wait-timeout 180` | Exit 0, một container healthy; API và web build thành công trong Linux |
| `GET /` từ Windows | HTTP 200 |
| `GET /api/health` từ Windows | `{"status":"ok","database":"up"}` |
| Products, ingredients, recipes qua `/api` | 8 món, 15 nguyên liệu, 27 công thức |
| Đăng nhập cả hai tài khoản demo | BARISTA và CUSTOMER đúng role |
| Nhập kho qua API có lý do kiểm chứng | Matcha 20 g, sữa không đường 2000 ml, siro đường 200 ml; bán được 6 Matcha Latte S |
| Đặt rồi hủy một Matcha Latte S | Giữ 3 g matcha, hủy giải phóng về 0 g |
| Đặt và thanh toán ví một Matcha Latte S | SUCCESS; matcha còn 17 g, reserved 0 |
| `docker compose ... stop` | Exit 0 trong 0.7 giây; container exit 0; log PostgreSQL ghi `database system is shut down` |
| `docker compose ... up -d --wait --wait-timeout 180` | Healthy; seed chạy lại không đổi số dư; JWT cũ và đơn PAID vẫn hợp lệ |
| Rà soát lifecycle độc lập | Đã sửa xử lý dừng lúc khởi tạo/migrate/seed; rà lại không còn finding mở |
| WSL sau khi terminal startup kết thúc | Phát hiện distro tự tắt, container exit 0 và OOMKilled=false. Thêm `docker wait` ẩn; kiểm tra HTTP từ Windows sau thời gian idle vẫn healthy, Matcha Latte S còn 5 ly |

Dữ liệu mẫu sau kiểm chứng được giữ lại: một đơn CANCELLED, một đơn PAID; matcha 17 g, sữa không đường 1850 ml, siro đường 180 ml. Không còn nguyên liệu bị giữ. Có thể mua thêm 5 Matcha Latte S ngay; muốn bán các món khác thì nhân viên nhập kho ở `/inventory`.

`npm ci` của API báo 7 cảnh báo audit (1 moderate, 6 high); web báo 0. Task Docker giữ nguyên dependency/lockfile ứng dụng, không chạy tự động `npm audit fix`. npm cũng báo peer warning ESLint của web và Prisma báo cấu hình `package.json#prisma` deprecated; các lệnh build vẫn exit 0. Kiểm chứng runtime được chạy trực tiếp, không thêm bộ test vào dự án.

## Phạm vi thay đổi của task Docker

| Đường dẫn | Mục đích |
|---|---|
| `Dockerfile` | Build API/web, đóng gói Node + PostgreSQL + Tini, healthcheck |
| `.dockerignore` | Loại dependency/build local, cấu hình secret và dữ liệu không cần khỏi context |
| `compose.demo.yml` | Một service, một cổng loopback, volume riêng |
| `docker/demo-entrypoint.sh` | Secret bền vững, startup migration/seed, giám sát và dừng tiến trình |
| `apps/web/next.config.ts` | Rewrite `/api` bật riêng cho image demo |
| `README.md` | Lệnh chạy nhanh và lệnh WSL trên máy hiện tại |
| `docs/planning/2026-10-29-single-container-demo.md` | Phạm vi, thiết kế và checklist đã hoàn tất |
| `docs/docker-demo.md` | Hướng dẫn vận hành và kết quả kiểm chứng |

Các thay đổi kho nguyên liệu/xóa test có sẵn trước task Docker được giữ lại. Không sửa worktree khác.

## Điều chỉnh trang kho — BREW-INVENTORY-UI-02

Sau khi người dùng kiểm tra demo, đã bỏ bảng sửa công thức và bảng số ly có thể bán trên `/inventory`. Trang còn số dư nguyên liệu, nhập kho/kiểm đếm và lịch sử biến động. Xóa luôn state, component, style/type và các request công thức/sản phẩm/options chỉ phục vụ hai phần này. Công thức trong database vẫn được dùng để tính nguyên liệu đơn hàng.

Root session thực hiện trên cùng branch/worktree; chưa commit/push. Phạm vi gồm `apps/web/src/components/shop/InventoryScreen.tsx`, `apps/web/src/lib/inventory.ts`, `apps/web/src/app/globals.css`, `apps/web/README.md`, root README, `docs/inventory-runbook.md`, `docs/planning/2026-10-29-ingredient-inventory.md` và báo cáo này. Không đổi API/schema/dependency.

- `npm.cmd --prefix apps/web run lint`: exit 0.
- `npm.cmd --prefix apps/web run typecheck`: exit 0.
- Compose `up -d --build --wait --wait-timeout 180`: exit 0; web build thành công; container healthy. Image mới `sha256:b81948f4a93a4a2e8d6ee797c15a225ed08212794d62ac9120a2c31b8a1ae5a6`.
- So sánh JSON ingredients và recipes trước/sau thay container bằng JWT cũ: khớp hoàn toàn; không reset volume hay nhập kho thêm.
- HTTP `/inventory`: 200. Đọc 8 JavaScript chunk được trang thực tế tham chiếu: có `balances-title`, `movement-title`, `history-title`; không còn `recipes-title`, `preview-title`, `RecipeEditor`, `AvailabilityPreview` hoặc request `/inventory/recipes`.
- `/api/health`: `{"status":"ok","database":"up"}`. `git diff --check`: exit 0.
- Không thêm test. Không kiểm tra tương tác trình duyệt lần này: Computer Use báo native pipe/browser access host unavailable. Mã submit biến động và cơ chế abort/refresh vẫn được giữ; chưa khẳng định đã click form trên bản mới.

Demo tiếp tục chạy tại <http://localhost:3000/inventory>; tải lại trang đang mở để nhận bundle mới.

## Điều chỉnh giỏ hàng và giao diện sau khi test demo

Theo yêu cầu người dùng trên cùng branch/worktree:

- `ProductDetail.tsx`, `CartScreen.tsx`, `useAvailability.ts`: bỏ nút kiểm tra lại và các khung thông tin nguyên liệu; tự kiểm tra khả dụng, giới hạn lượng thêm theo toàn bộ giỏ và khóa nút tăng khi không đủ nguyên liệu. Lỗi kết nối/thiếu nguyên liệu vẫn được hiển thị khi cần.
- `ProductCard.tsx`: khóa nút thêm khi hết hàng; bỏ dòng ước tính size S và số ly ước tính, dùng nhãn Còn hàng/Hết hàng.
- `AuthScreen.tsx`: bỏ phần thông báo mật khẩu tối đa 72 byte; giữ điều kiện kiểm tra hiện có.
- Trang kho cập nhật ngay sau khi lưu nhập/kiểm đếm. Khi khách đặt/thanh toán/hủy đơn ở phiên khác, số dư database tự cập nhật; trang kho đang mở cần bấm Làm mới kho để tải số dư mới.

Người dùng đã yêu cầu commit và push các thay đổi lên `feat/ingredient-inventory`; yêu cầu này thay thế trạng thái chưa commit/push của các lần bàn giao trước. Không thêm lại bộ test đã xóa. Kiểm tra trước khi push: API lint/build và web lint/typecheck exit 0; kiểm tra logic giỏ hàng tạm ngoài repo đạt (tồn dùng chung, giới hạn 99, lỗi, trạng thái tải và thêm/tăng số lượng). Kết quả test lịch sử vẫn được phân biệt trong [inventory-verification.md](inventory-verification.md).

Web build và Docker Compose rebuild/wait cuối cùng cũng exit 0; container healthy, HTTP trang chủ 200 và `/api/health` trả database up. `git diff --check` trước staging exit 0; sau staging, `git diff --cached --check` phát hiện một dòng trống cuối file migration mới ở dòng 105. Giữ nguyên file migration đã áp dụng trong database demo để không thay đổi checksum; cảnh báo này chỉ liên quan khoảng trắng, không phải lỗi SQL/build. Đã rà soát danh sách đường dẫn staged; không đưa cấu hình secret, dữ liệu PostgreSQL hoặc dependency/build local vào commit.

Điều chỉnh tiếp theo theo ảnh người dùng: `InventoryScreen.tsx` chỉ hiện **“Số lượng không hợp lệ”** cho dữ liệu số lượng sai; giữ nguyên điều kiện kiểm tra. Cùng task/branch/worktree ở trên, chỉ đổi thông báo và ghi nhận tại báo cáo này; chưa commit. Docker build/typecheck và Compose healthy đều exit 0, `git diff --check` exit 0. Đọc bundle đang phục vụ xác nhận có đúng câu mới và không còn câu cũ; `/api/health` báo database up. Chưa kiểm tra click trên trình duyệt do host không khả dụng.

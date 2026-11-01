# Hướng dẫn: migrate và seed DB production trước khi deploy VNPay

Người thực hiện: thành viên giữ tài khoản Render (owner). Ngày soạn: 2026-10-30.

## Vì sao phải làm

Bản deploy kế tiếp (`develop-Assignment2` @ `adf26bb`, PR #26) gồm VNPay sandbox và kho nguyên liệu. Khi tạo đơn, API giữ chỗ nguyên liệu theo công thức (`apps/api/src/inventory/inventory.service.ts`, hàm `reserve`):

- món chưa có công thức: `409 RECIPE_UNAVAILABLE`;
- không đủ nguyên liệu: `409 OUT_OF_STOCK`.

Container chỉ chạy `prisma migrate deploy` khi khởi động (`apps/api/Dockerfile`), không chạy seed (`docs/deployment.md`: seed chỉ chạy có chủ đích). Nếu deploy khi chưa seed, bảng `ingredients` và `recipes` rỗng, **khách không đặt được đơn nào**. Lần deploy ngày 2026-10-30 (run `41071830235`) đã bị hủy trước bước deploy vì lý do này; production vẫn chạy bản cũ.

Làm migrate và seed **trước** khi deploy để production không có khoảng thời gian code mới chạy mà chưa có công thức. Bản cũ vẫn chạy được với schema mới vì migration chỉ thêm bảng, thêm cột có mặc định và thêm giá trị enum.

## Seed ghi gì

- `prisma/seed.ts`: `upsert` sản phẩm với `update: {}`, không sửa sản phẩm đã có.
- `prisma/inventory.seed.ts`: `upsert` nguyên liệu (`onHand`/`reserved` = 0) và công thức với `update: {}`.
- Không có lệnh xóa hay ghi đè. Chạy lại seed không cộng thêm tồn kho.
- Tài khoản demo chỉ được tạo khi `SEED_DEMO_USERS=true`. **Không bật biến này trên production**: repo public, mật khẩu demo nằm trong README.

Ba migration sẽ được áp dụng:

| Migration | Nội dung |
|---|---|
| `20261029000000_ingredient_inventory` | 5 bảng kho mới, cột `orders.inventoryTracked` mặc định `false` |
| `20261029100000_vnpay_payment_enum` | thêm `PaymentStatus.PENDING`, 9 cột mới của `payments`, đặt `provider = 'SIMULATOR'` cho dòng cũ |
| `20261029100001_vnpay_pending_index` | unique index một phần: tối đa một `Payment PENDING` mỗi đơn |

Không có `DROP`/`DELETE`. Giá trị enum `PENDING` khó gỡ lại, nhưng giữ nó không làm hỏng dữ liệu cũ.

## Chuẩn bị

- Node.js ≥ 22 (dự án dùng 24, xem `.nvmrc`), Git, Docker nếu muốn backup bằng `pg_dump`.
- Clone repo và lấy đúng commit sẽ deploy:

  ```powershell
  git clone https://github.com/DuVinhLoi/BrewLite.git
  cd BrewLite
  git checkout adf26bb
  cd apps/api
  npm ci
  npx prisma generate
  ```

- **Không push lên `feat/assignment2-task5-delivery` và không re-run workflow `cd.yml`** cho tới khi xong mục "Kiểm tra". Branch delivery đã ở `adf26bb`; mọi push hoặc re-run sẽ deploy ngay.

## Các bước

1. **Lưu biến VNPay trên Render.** Service `brewlite-a2-api` → Environment: `VNP_TMN_CODE`, `VNP_HASH_SECRET`, `WEB_URL=https://brewlite-a2-web.vercel.app`. Chọn "Save only" nếu có. Giá trị secret nhận qua tin nhắn riêng, không ghi vào repo.
2. **Mở quyền kết nối tạm thời.** DB `brewlite-a2-db` → Networking / Access Control → thêm IP public của máy đang chạy (xem `https://api.ipify.org`). Copy **External Database URL**; không dán vào chat chung, issue, PR hay log.
3. **Backup (khuyến nghị).** Gói Free có thể không có backup tự động.

   ```powershell
   docker run --rm -v "${PWD}:/out" postgres:16 pg_dump "<External Database URL>" -Fc -f /out/brewlite-before-vnpay.dump
   ```

   File `.dump` chứa dữ liệu thật: giữ trên máy owner, không commit.
4. **Migrate rồi seed**, tại `apps/api`:

   ```powershell
   $env:DATABASE_URL = '<External Database URL>'
   npx prisma migrate status
   npx prisma migrate deploy
   npm run prisma:seed
   npx prisma migrate status
   Remove-Item Env:DATABASE_URL
   ```

   - `migrate status` lần đầu: liệt kê 3 migration chưa áp dụng ở bảng trên.
   - `migrate status` lần cuối: `Database schema is up to date!`.
   - Lỗi SSL: thêm `?sslmode=require` vào cuối URL.
   - Seed lỗi khóa ngoại (công thức trỏ tới mã sản phẩm như `matcha-latte` không có trên production): dừng lại, gửi output (đã che URL) cho nhóm. Không sửa DB bằng SQL tay.
5. **Đóng quyền kết nối.** Xóa IP vừa thêm khỏi allowlist của `brewlite-a2-db`.
6. **Báo nhóm** đã xong bước 1–5, kèm dòng cuối của `migrate status` và output seed (đã che URL).

## Sau khi owner báo xong (người phụ trách deploy)

1. Deploy: `gh run rerun 41071830235` hoặc chạy tay workflow `cd.yml`; đợi job deploy Render và Vercel thành công.
2. Kiểm API:
   - `GET https://brewlite-a2-api.onrender.com/health` → `{"status":"ok","database":"up"}`;
   - `GET https://brewlite-a2-api.onrender.com/payments/vnpay/ipn` → `{"RspCode":"97",...}` (`99` là thiếu biến VNPay, `404` là bản cũ).
3. Barista đăng nhập web production, vào `/inventory`, nhập kho (RECEIVE) cho nguyên liệu của ít nhất một món theo số kiểm kê thật. Cách nhập và ví dụ Matcha ở [inventory-runbook.md](../inventory-runbook.md).
4. Đăng ký IPN URL `https://brewlite-a2-api.onrender.com/payments/vnpay/ipn` trong Merchant Admin của VNPay sandbox (mục "Đăng ký IPN URL" ở [deployment.md](../deployment.md)).
5. Thử thanh toán: đặt một đơn, trả bằng thẻ test NCB trong email sandbox. Log Render có `RspCode=00`, đơn chuyển sang đã thanh toán.

## Kiểm tra

- `npx prisma migrate status` báo `Database schema is up to date!`.
- Sau deploy: `/payments/vnpay/ipn` trả `97`; khách tạo được đơn cho món đã nhập kho; trang VNPay hiện form chọn ngân hàng, không báo sai chữ ký.

## Nếu có sự cố

- Không chạy down migration, không reset DB, không xóa bảng (`docs/deployment.md`, mục rollback).
- Deploy lỗi: rollback image Render và Vercel về bản trước theo `docs/deployment.md`; schema mới vẫn tương thích bản cũ.
- Dữ liệu sai sau seed: dừng, giữ nguyên hiện trạng, khôi phục từ file `.dump` chỉ khi nhóm thống nhất.

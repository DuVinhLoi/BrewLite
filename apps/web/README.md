# BrewLite Web — Next.js

Sprint 1 có menu gọi Product API thật, ảnh/giá/tồn kho, skeleton/empty/error/retry.
Sprint 2 có trang chi tiết, size/topping, giỏ lưu browser, đăng nhập/đăng ký, tạo đơn/thanh toán demo, xác nhận và lịch sử/theo dõi đơn.
Routes nằm trong `src/app`, màn hình và Context trong `src/components/shop`.

```powershell
npm.cmd ci
npm.cmd run dev
```

Copy `.env.example` thành `.env.local` trên clone mới. NEXT_PUBLIC_API_URL mặc định http://localhost:4000; đổi URL phải build lại.
API CORS phải cho phép origin web. Không đặt JWT_SECRET trong frontend.
Giỏ dùng localStorage, session dùng sessionStorage; không xóa giỏ khi lỗi thanh toán hoặc đăng xuất.
Chi tiết setup/test/DB riêng: [README root](../../README.md).

## Phân công sau sync Pha A

- Người 1: số lượng ở chi tiết, cap tồn kho, giới hạn 20 món; card-task5-p1.md.
- Người 2: xác nhận giảm về 0, thành tiền từng dòng, manifest/icons; card-task5-p2.md.
- Người 3: tóm tắt checkout, lỗi tại ô thẻ và bỏ nhánh lỗi cũ ở web; card-task5-p3.md.

Các card ở `docs/planning/handoff/2026-10-21-req-sync/` trên develop-Assignment2.
Không sửa file của người khác trong Pha B. Production đã chốt Vercel, Root Directory apps/web; API trên Render.

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npm.cmd run test:e2e
```

Unit Vitest không cần DB. Playwright dùng browser/API thật và TEST_DATABASE_URL riêng; xem root README.
Nhóm phải hiểu và giải thích được code khi vấn đáp.
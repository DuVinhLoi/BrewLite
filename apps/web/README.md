# BrewLite Web — Next.js

Sprint 1 có menu gọi Product API thật, ảnh/giá/tồn kho, skeleton/empty/error/retry.
Sprint 2 có trang chi tiết, size/topping, giỏ lưu browser, đăng nhập/đăng ký, tạo đơn/thanh toán demo, xác nhận và lịch sử/theo dõi đơn.
Màn nhân viên `/inventory` gồm số dư nguyên liệu, nhập kho/kiểm đếm và lịch sử biến động. Công thức cố định được dùng trong hệ thống; trang kho không có bảng sửa công thức hoặc bảng số ly có thể bán. Chi tiết kiểm tra biến thể được chọn; giỏ kiểm tra tổng nhu cầu nguyên liệu dùng chung.
Routes nằm trong `src/app`, màn hình và Context trong `src/components/shop`.

```powershell
npm.cmd ci
npm.cmd run dev
```

Mở `http://localhost:3000`.
Copy `.env.example` thành `.env.local` trên clone mới. NEXT_PUBLIC_API_URL mặc định http://localhost:4000; đổi URL phải build lại.
API CORS phải cho phép origin web. Không đặt JWT_SECRET trong frontend.
Giỏ dùng localStorage, session dùng sessionStorage; không xóa giỏ khi lỗi thanh toán hoặc đăng xuất.
Chi tiết setup/DB riêng: [README root](../../README.md).

## Phần Người 1–3 đã tích hợp

- PR #23 (Người 1): số lượng tại chi tiết, cap 99 mỗi dòng và 20 món. Giới hạn tồn chung cũ đã được thay bằng công thức riêng và kiểm tra nguyên liệu cả giỏ. Các mã `P1-UI-*`, `P1-CART-*` là minh chứng lịch sử.
- PR #22 (Người 2): xác nhận khi giảm 1 về 0, nút Xóa trực tiếp, thành tiền từng dòng; `UNIT-P2-01`–`UNIT-P2-05`. Web manifest và icons PNG 192/512 px đáp ứng minimum PWA.
- PR #24 (Người 3): tóm tắt giỏ/đơn đang trả lại, lỗi tại ô thẻ, chỉ xử lý decline; mã `UNIT-P3-01`–`UNIT-P3-05` là minh chứng lịch sử.

Card và giới hạn ownership ở `docs/planning/handoff/2026-10-21-req-sync/`. Mã test và truy vết chi tiết ở [ma trận](../../docs/traceability-matrix.md).
Production: Vercel Root Directory `apps/web`, `NEXT_PUBLIC_API_URL=https://brewlite-a2-api.onrender.com`. Project không liên kết Git; release deploy qua CLI/CD. URL demo: https://brewlite-a2-web.vercel.app.

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build
```

Toàn bộ bộ test, cấu hình và dependency test được xóa theo yêu cầu chủ dự án sau khi kiểm chứng; [báo cáo kho](../../docs/inventory-verification.md) ghi kết quả trước khi xóa. [Ma trận](../../docs/traceability-matrix.md) giữ các mã kiểm chứng lịch sử.
PWA chỉ cần web app manifest theo AC-N10.1; service worker không thuộc yêu cầu minimum.
Nhóm phải hiểu và giải thích được code khi vấn đáp.

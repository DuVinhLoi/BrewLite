# BrewLite Web — Next.js

Sprint 1 có menu gọi API thật, ảnh/giá/tồn kho, skeleton, danh sách rỗng, lỗi và thử lại. CSS dùng một cột trên mobile, hai cột từ 560 px và ba cột từ 900 px. Size/topping, chi tiết UI, giỏ hàng, auth, checkout và PWA thuộc Task 5; nút thêm vào giỏ chưa xử lý thao tác.

## Chạy từ thư mục này

Dùng Node 24.19.0. Copy `.env.example` thành `.env.local`; `NEXT_PUBLIC_API_URL` mặc định `http://localhost:4000`, không có `/` cuối. Khởi động API theo [README gốc](../../README.md#chạy-local).

```powershell
npm.cmd ci
npm.cmd run dev
```

Mở `http://localhost:3000`. Trình duyệt gọi `GET /products` bằng `fetch` không cache; đổi API origin cần cấu hình CORS tương ứng ở API. `NEXT_PUBLIC_API_URL` được nhúng khi build, nên đổi URL cần build lại production.

```powershell
npm.cmd run lint
npm.cmd test
npm.cmd run typecheck
npm.cmd run build
npm.cmd start
```

Test Vitest + Testing Library trong `src/`: `UNIT-T01` định dạng VND, `UNIT-T02` tồn kho, `UNIT-T03` thẻ món, `UNIT-T04` tải/8 món, `UNIT-T05` rỗng, `UNIT-T06` mất mạng/thử lại, `UNIT-T07` HTTP 503/thử lại. Fetch được mock trong test; không cần API/DB đang chạy. Xem [ma trận](../../docs/traceability-matrix.md) và [checkpoint](../../docs/checkpoints/2026-10-19-task4.md) cho phạm vi đã kiểm.

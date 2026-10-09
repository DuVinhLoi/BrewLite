# EXTRA_TASKS — handover note to teammates (branch develop)

Các task thuộc phạm vi teammate đã implement sẵn trên nhánh này để demo
end-to-end chạy được. Không đụng logic auth/products/orders/payments/cart.

| Task | Why (cho demo) | Key files | Commit |
|---|---|---|---|
| Task 2 `GET /products` | Menu có data thật thay vì mock | `backend/src/product/*`, `frontend/src/lib/api.ts` | `eb865e0` |
| Task 4 UI modal | Chọn size/topping trong menu (đã chốt dùng modal làm màn hình chi tiết; wireframe đề §7 chỉ tham khảo) | `frontend/src/components/ProductDetailModal.tsx` | `e14ccb6` |
| Task 6 `POST /orders` | Checkout tạo đơn thật trước khi pay | `backend/src/order/*` | `eb865e0` |
| Task 7 auth + login page | Login lấy JWT cho `/orders/me` + `/history` | `backend/src/auth/*`, `frontend/src/app/login/page.tsx` | `bee596a` |
| Task 9 history + compose + seed | Xem lại đơn đã đặt; `docker compose up --build` boot 1 lệnh; login demo `demo@brewlite.vn` / `demo1234` | `frontend/src/app/history/page.tsx`, `frontend/src/components/Header.tsx`, `backend/prisma/seed.ts`, `backend/Dockerfile`, `frontend/Dockerfile`, `docker-compose.yml`, `.env.example` | (commit này) |

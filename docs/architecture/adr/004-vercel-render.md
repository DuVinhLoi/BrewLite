# ADR-004: Nền tảng production: Vercel + Render

- Trạng thái: Accepted (2026-10-21)
- Liên quan: A2 §7.3, NFR-15, NFR-16, NFR-17

## Bối cảnh

Do yêu cầu Assignment 2, hệ thống cần deploy được front-end và API trên các nền tảng dễ quản lý, có health check rõ ràng, và CD tự động sau khi release.

## Quyết định

- Frontend chạy trên Vercel.
- Backend chạy trên Render.
- Image Docker được build và push dựa trên commit SHA tới registry container.
- `GET /health` trả `{ status, database }`; smoke test kiểm tra `/health`, `/products`, và web home page.
- Retry trong pipeline CD tối đa 10 phút.

## Hệ quả

### Ưu điểm
- Mỗi thay đổi commit đều có đường traceability rõ nét.
- Frontend và backend tách rõ, deployment logic đơn giản.
- Health check và smoke test cho phép phát hiện lỗi sớm.

### Hạn chế
- Vercel/Render có thể có thời gian cold start.
- Cần kiểm soát secret và biến môi trường cẩn thận.

## Phương án đã loại

- Deploy cả front-end và back-end trên một service duy nhất: khó scale và khó xác định lỗi.
- Chạy production trên máy cá nhân hoặc VM tự quản: không phù hợp cho CI/CD và chất lượng team.

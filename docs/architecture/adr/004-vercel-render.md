# ADR-004: Nền tảng production: Vercel + Render

- Trạng thái: Accepted (2026-10-21)
- Liên quan: A2 §5.2, §7.3; NFR-07, NFR-08, NFR-15, NFR-18, NFR-19, NFR-20

## Bối cảnh

Nhóm cần phục vụ Next.js/PWA, chạy container NestJS với PostgreSQL và triển khai qua CI/CD có smoke test, rollback. Quyết định P1 của handoff chọn Vercel + Render; Task 5 hiện thực theo CR-5.3–4.

## Quyết định

- Frontend `apps/web` chạy trên Vercel, Next.js được phục vụ qua CDN/Edge; `NEXT_PUBLIC_API_URL` trỏ URL HTTPS của API. Tắt Git auto-deploy để CD kiểm soát bản phát hành.
- Backend `apps/api` chạy dưới dạng Render Web Service từ image `ghcr.io/duvinhloi/brewlite-api:<commit-sha>` (mẫu `ghcr.io/<org>/brewlite-api:<commit-sha>`). CD build/push image lên GHCR rồi gọi deploy hook với tham số `imgURL` đã URL-encode; tag SHA cho phép chọn lại đúng image.
- Render Postgres dùng persistent storage do nền tảng quản lý. API và DB cùng region, `DATABASE_URL` chỉ dùng **Internal Database URL**. Tắt external access của DB bằng cách xóa toàn bộ IP allow list; chỉ dùng URL nội bộ chưa đủ để đóng cổng public (NFR-08).
- Web và API public qua HTTPS 443; API lắng nghe cổng 4000 phía sau proxy Render. PostgreSQL chỉ được API truy cập nội bộ TCP 5432.
- Migration chạy trong lệnh khởi động container trên Render (ADR-003): `npx prisma migrate deploy && node dist/main.js`. CI không chạy migration trực tiếp vào DB production.
- Render cấu hình Health Check Path `/health`. Endpoint công khai trả `{status, database}`: 200 khi DB hoạt động, 503 khi DB mất kết nối (NFR-15).
- CD chạy khi đẩy tag `a2-v*`: lint/build (bản cuối không giao test suite) → build image → push registry → deploy API và web → smoke test. Smoke gọi `/health` (200 và `database = "up"`), `/products` và trang web; mỗi bước retry tới khi 200, tối đa 10 phút. Quá hạn thì pipeline đỏ và dừng (AC-N18.2).
- Rollback: gọi deploy hook Render với `imgURL` trỏ image SHA bản trước, chạy `vercel rollback` về deployment web trước, rồi chạy lại smoke test như trên (AC-N18.3). Migration chỉ thêm bảng/cột; sau BREW-INVENTORY-01, image rollback phải hiểu inventoryTracked/snapshot theo ADR-006, không chỉ tương thích schema. Task 5 ghi minh chứng diễn tập vào `docs/deployment.md`.
- Secret runtime nằm trên Render (`DATABASE_URL`, `JWT_SECRET`), secret deploy nằm trong GitHub environment `production` (`RENDER_DEPLOY_HOOK_URL`, `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`). `CORS_ORIGINS` giới hạn đúng origin Vercel. Log JSON ra stdout, được Render thu nhận; không ghi số thẻ, token, mật khẩu hay giá trị secret.

## Hệ quả

### Ưu điểm

- CDN phục vụ web và container API được triển khai độc lập; nhóm không phải quản trị VM.
- Image SHA và deployment web trước giúp rollback rõ ràng; smoke test kiểm tra cả API lẫn giao diện.
- DB nằm ngoài filesystem tạm của API, dữ liệu không mất khi API restart/redeploy.

### Hạn chế

- [Render free](https://render.com/docs/free) hiện cho Postgres dùng 30 ngày từ khi tạo; sau hạn DB không truy cập được. Task 5 phải ghi ngày tạo/hết hạn và chuẩn bị nâng gói hoặc tái tạo dữ liệu demo trước ngày nghiệm thu.
- Web service free ngủ sau 15 phút không có traffic. Smoke retry tới 10 phút xử lý cold start; không dùng kết quả production cold start để đánh giá hiệu năng local của NFR-01/NFR-03.
- Hai origin Vercel/Render cần cấu hình CORS; biến public của Next.js phải đúng khi build web.
- Cần quản lý hai deployment, credential GHCR nếu package private và các secret CI/platform. Việc deploy/rollback thật và minh chứng vận hành thuộc Task 5.

## Phương án đã loại

- Một VM tự quản: có toàn quyền nhưng tăng công vận hành TLS, database và bảo trì.
- Một dịch vụ chứa cả web và API: giảm số nền tảng nhưng ràng buộc hai vòng đời triển khai và mất lợi ích CDN của Vercel.

## Tài liệu nền tảng

- [Render deploy hooks và imgURL](https://render.com/docs/deploy-hooks).
- [Render Postgres: internal URL và external access](https://render.com/docs/postgresql-creating-connecting).

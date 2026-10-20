# ADR-004: Nền tảng production – Vercel (web) + Render (API, Postgres) + GHCR

- **Trạng thái:** Đề xuất (nhóm chốt qua PR) – theo mục E của kế hoạch
- **Ngày:** 2026-10-20
- **Liên quan:** đề A2 §5.2, §7.3, §7.4, §8.1

## Bối cảnh
Đề yêu cầu chuỗi *Build Docker Image → Push Registry → Deploy*, deployment diagram đúng nền tảng thật, database production không public và URL production sống lúc chấm. Dùng Vercel cho cả hệ thống lệch đề: Vercel không chạy container (image không được dùng), NestJS thành serverless (cold start, cạn pool khi dùng Prisma), và Postgres trên Marketplace mặc định public.

## Quyết định
- **Web:** Vercel (CDN/HTTPS cho Next.js), deploy bằng `vercel deploy --prebuilt --prod` từ CI; tắt auto-deploy từ Git.
- **API:** Render Web Service chạy container, kéo image `ghcr.io/<org>/brewlite-api:<commit-sha>` từ GHCR; deploy qua deploy hook.
- **Database:** Render Postgres managed có disk, chỉ nối qua internal URL (không đặt IP allowlist công khai).
- **Registry và CI/CD:** GHCR + GitHub Actions (`ci.yml` khi PR, `cd.yml` khi tag `a2-v*`).
- `/health.version` là SHA của image để CD biết bản mới đã chạy; CD chờ tối đa 10 phút rồi mới smoke test.

## Rủi ro đã biết và cách xử lý
| Rủi ro | Hệ quả | Cách xử lý |
|---|---|---|
| Postgres free của Render có hạn dùng (khoảng 30 ngày theo kế hoạch) | Mất DB lúc chấm | Ghi ngày tạo `[nhóm điền]`, ngày hết hạn `[nhóm điền]` và lịch chấm `[nhóm điền]`; tạo lại/seed hoặc đổi gói trước hạn; kiểm tra lại chính sách hiện hành của Render |
| Web service free ngủ sau 15 phút không có request | Request đầu chậm, smoke test hỏng giả | Smoke test retry tới ~2 phút; đánh thức dịch vụ trước buổi demo/chấm |
| `NEXT_PUBLIC_API_URL` nhúng lúc build | Đổi URL API phải build lại web | Đặt làm biến env production của Vercel; deploy `--prebuilt` dùng đúng giá trị |
| Image GHCR private | Render không kéo được | Cấp credential registry cho Render, hoặc đặt package public (image không chứa secret) |
| CORS giữa Vercel và Render | Trình duyệt chặn request | `CORS_ORIGINS` của API là origin của web |
| Điều khoản free tier thay đổi | Kế hoạch lệch thực tế | Đọc trang giá/điều khoản khi chốt ADR; ghi ngày kiểm tra `[nhóm điền]` |

## Hệ quả
- Ưu điểm: khớp chuỗi Docker của đề; DB không public; có HTTPS, health check, log sẵn; gói free.
- Hạn chế: hai nền tảng phải cấu hình CORS và secret riêng; phụ thuộc free tier.
- Nếu đổi nền tảng (Railway, Fly.io, VPS…): giữ các yêu cầu container chạy API, registry, DB không public, HTTPS, health check; sửa ADR này và vẽ lại `deployment.puml/.svg`, `docs/deployment.md`.

# Task 5 — Sprint 2, CI/CD và Delivery

Task: 5.1–5.4. Owner: **[nhóm điền]**. Branch: feat/assignment2-task5-delivery.
Worktree: C:/BrewLite-a2-Task5. Base: f1b856a.

## Audit Task 4

| Thành phần | File | Trạng thái đọc source | Cần sửa | Lý do |
|---|---|---|---|---|
| Product API | apps/api/src/catalog/* | Đã có list/detail | Không | Giữ contract |
| Menu | apps/web/src/components/menu/* | Đã có loading/empty/error | Tối thiểu | Nối nút vào chi tiết |
| Database | apps/api/prisma/* | Chỉ có Product | Có | Thêm User/Order/OrderItem/Payment |
| Test | apps/api/test, apps/web/src | Có unit và HTTP mock | Bổ sung | Nghiệp vụ, DB thật và browser E2E |
| CI | .github/workflows/ci.yml | Install/lint/test/build | Mở rộng | Integration/E2E và CD |
| Task 2–3 | docs/diagrams, docs/architecture | README ghi chưa có tạo phẩm | Không | Phụ thuộc nhóm, không tự viết thay |
| Compose/health/CD | root, apps/api, workflows | Chưa có | Tạo | Task 5.2–5.4 |

## Thiết kế theo SRS đã cung cấp

Giữ Next.js/NestJS/Prisma/PostgreSQL và endpoint trong SRS §3.1.
React Context lưu giỏ, phân biệt product/size/toppings; token chỉ lưu sessionStorage.
Backend bcrypt cost 12, JWT HS256 thời hạn 1 giờ, secret >=32 ký tự từ env.
Giá size/topping là quy tắc SRS; backend cung cấp GET /catalog/options, web không tự hardcode bảng giá.
Tạo đơn và giữ tồn kho trong transaction. Thanh toán mô phỏng backend theo SRS §3.4;
PostgreSQL advisory lock theo user và row lock theo order để tuần tự hóa payment/cancel;
chỉ giữ fingerprint của request, không lưu/log số thẻ. Thất bại được commit trước khi trả lỗi.
Không thêm Promotion/LoyaltyTransaction vì ngoài minimum SRS; Task 2 vẫn cần mô hình hóa.

## Kế hoạch và phạm vi

- [x] Backend: tests trước, validation/pricing, auth, schema và migration cộng thêm, orders/payments/health.
- [x] Frontend: Context, chi tiết, giỏ, đăng nhập/đăng ký, checkout, lịch sử/chi tiết polling.
- [x] Kiểm thử: unit, HTTP auth, integration DB riêng, Playwright luồng thật.
- [x] Delivery: Dockerfiles/Compose, CI và CD thủ công có environment production approval, smoke, rollback.
- [x] Tài liệu: README, deployment, release notes, review/retro mẫu, traceability bổ sung.
- [x] Kiểm chứng: lint/test/typecheck/build/diff; ghi rõ NOT RUN/BLOCKED nếu thiếu điều kiện.

Không sửa .env thật hoặc reset DB; commit/push/release theo phạm vi người dùng đã giao.
Chỉ thêm dependency bcryptjs/jsonwebtoken và Playwright phục vụ yêu cầu được giao.
Production dùng Vercel (web) + Render (API image và Postgres internal) theo ADR 004.
Pha A đã deploy tay và smoke menu tám món ngày 23/10/2026. CR-5.0 lần 2 và PR Người 1–3 đã merge; CR-5.1/5.2 sửa replay/decline, CR-5.3 chuyển CD và migration startup, CR-5.4/5.5 cập nhật tài liệu/truy vết.
Checkbox delivery mô tả source chuẩn bị; kết quả CI/CD/tag/smoke/rollback phải có bằng chứng thực ở [verification](verification.md), [release notes](release-notes.md) và [report-task5](../planning/handoff/2026-10-21-req-sync/report-task5.md).

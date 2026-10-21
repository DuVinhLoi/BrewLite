# Release candidate 0.2.0 — Sprint 2

Ngày chuẩn bị: 21/10/2026. Chưa tạo Git tag/release. Chưa deploy production.
Branch: feat/assignment2-task5-delivery. Base Task 4: f1b856a.

## Nội dung

- Kế thừa Product API và Menu UI Task 4; nút thêm giỏ mở trang tùy chọn.
- Chi tiết sản phẩm, size M mặc định, topping API, giỏ lưu browser, badge, tăng/giảm/xóa.
- Đăng ký bcrypt cost 12, đăng nhập JWT HS256 1 giờ, phân quyền Customer/Barista.
- Tạo đơn transaction + giữ tồn kho; backend tính tiền, từ chối trường lạ và dữ liệu sai.
- Ví/thẻ demo, thất bại/timeout, retry, idempotency bền vững PostgreSQL; không lưu/log số thẻ.
- Xác nhận, lịch sử, polling chi tiết 5 giây, hủy đơn chưa trả và hoàn tồn một lần; API Barista đổi trạng thái.
- Migration cộng thêm, seed opt-in account demo, health DB, Docker/CI/CD và hướng dẫn rollback.

## Giới hạn cần nghiệm thu

- Chưa có URL production, run CI/CD trên GitHub, release/tag hoặc minh chứng rollback thực tế.
- Task 2–3 thiếu sơ đồ/ADR; không tự nhận hoàn thành truy vết thiết kế.
- FR-17/18/19/26/27 ngoài minimum SRS, không triển khai promotion/loyalty/refund/queue.
- Giỏ lưu localStorage; token chỉ sessionStorage (có rủi ro XSS và không chia sẻ tab), không refresh token. API quyết định giá và quyền cuối cùng.
- Lịch sử trả tối đa 50 đơn gần nhất; chưa có phân trang cho quy mô lớn.
- Không tự thay .env thật, không dùng migrate reset, không commit/push/deploy.

Kết quả lệnh thực tế và blocker: xem `verification.md`. Chỉ PASS khi lệnh đã chạy thành công.
Vận hành/triển khai/rollback: `../deployment.md`. Hướng dẫn Windows: README root.
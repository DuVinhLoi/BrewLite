# Tài liệu chuẩn bị Sprint Review / Retrospective

Đây là kịch bản hỗ trợ buổi họp, không phải biên bản họp đã diễn ra.

Sprint Goal: hoàn thành menu → tùy chọn → giỏ → đăng nhập → đặt đơn → thanh toán → xác nhận/theo dõi; đóng gói và chuẩn bị delivery có quality gate.

## Kịch bản demo

1. Database demo riêng, migrate và seed; mở menu mobile/desktop, xem Cold brew hết hàng.
2. Chọn Cappuccino L + Trân châu, thêm 2 ly: 124.000đ; reload giỏ, giảm/tăng/xóa.
3. Đăng ký hoặc đăng nhập customer demo; giỏ vẫn giữ sau chuyển trang.
4. Thẻ 4000000000000002 → lỗi từ backend, giỏ không bị xóa, đơn PAYMENT_FAILED.
5. Thử lại Ví → PAID; xem mã đơn, món, tổng tiền, phương thức và thời gian.
6. Lịch sử và chi tiết polling; dùng JWT Barista gọi PATCH lần lượt PREPARING, READY, COMPLETED.
7. Tạo đơn chưa trả và hủy → tồn kho được hoàn đúng một lần.
8. Trình bày test log thực tế, CI/CD source, migration, health, giới hạn production.

## Acceptance checklist

- [ ] Luồng E2E browser thật thành công với DB độc lập.
- [ ] Request giá giả, JWT sai, truy cập đơn người khác đều bị từ chối.
- [ ] Payment gửi song song không tạo hai lần thu thành công.
- [ ] Pipeline GitHub thật chạy và branch protection có hiệu lực.
- [ ] HTTPS web/API/health production truy cập được, không lộ DB/secrets.
- [ ] Release/tag, video demo và rollback được nhóm xác minh.
- [ ] Nhóm hoàn thành Task 2–3 và nối đúng thiết kế trong ma trận.

## Câu hỏi cho buổi retrospective

- Phần nào tích hợp thuận lợi? Có bằng chứng từ test/PR nào?
- Phụ thuộc Task 2–3 và hạ tầng ảnh hưởng kế hoạch ra sao?
- Lỗi đáng chú ý nào thực sự đã xảy ra, nguyên nhân và cách phòng tránh?
- Hành động cải tiến nào có người phụ trách và hạn hoàn thành?

Chỉ điền người tham dự, quyết định, phản hồi và kết quả họp sau khi họp thật.
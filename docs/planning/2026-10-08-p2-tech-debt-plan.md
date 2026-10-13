# Kế hoạch Ưu tiên 2 — nợ kỹ thuật: phần còn lại

> Task 1–6 và Task 8 đã xong, đã bỏ khỏi file (xem lịch sử git). Chỉ giữ Task 7 — chưa tick. Ghi chú của chính task này: hiện không áp dụng cho compose 1 backend.

### Task 7: Khóa thanh toán dùng được với nhiều instance (chỉ khi scale)

**File:** `backend/src/payment/payment.service.ts` (`withLock`)

- [ ] Chỉ làm nếu chạy > 1 backend. Thay khóa trong tiến trình bằng `pg_advisory_xact_lock(hashtext(orderId))` hoặc `SELECT … FOR UPDATE` trên `Order`, đặt quanh bước kiểm tra cache → charge. *(Không áp dụng: compose 1 backend — ghi ở `develop-status-report.md` mục 2.8.)*
- [ ] Test trên pg suite với nhiều request song song.

**Xong khi:** không áp dụng cho compose hiện tại (1 backend) — giữ nguyên ghi chú `ponytail:` trong code.

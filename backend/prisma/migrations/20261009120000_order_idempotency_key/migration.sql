-- Đề §9 tiêu chí (b): POST /orders nhận Idempotency-Key, gửi 2 lần chỉ tạo 1 đơn. Thêm cột, vẫn 5 thực thể
ALTER TABLE "Order" ADD COLUMN "idempotencyKey" TEXT;
CREATE UNIQUE INDEX "Order_idempotencyKey_key" ON "Order"("idempotencyKey");

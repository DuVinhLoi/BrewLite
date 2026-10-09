-- Mở rộng ngoài đề §12.2: vai trò người dùng (CUSTOMER / BARISTA / ADMIN), vẫn 5 thực thể
ALTER TABLE "User" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'CUSTOMER';

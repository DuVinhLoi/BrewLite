import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

// Seed chạy mỗi lần container backend khởi động (CMD của backend/Dockerfile) nên chỉ TẠO dữ liệu còn thiếu:
// 3 tài khoản demo (mật khẩu demo được đặt lại), 4 món (tồn kho 10 chỉ khi tạo mới). Không đụng đơn, biên lai,
// điểm thưởng hay tồn kho đã có: lịch sử demo giữ qua các lần khởi động lại.
async function main() {
  const db = new PrismaClient();
  try {
    await db.user.upsert({
      where: { id: 'u1' },
      create: { id: 'u1', email: 'demo@brewlite.vn', passwordHash: await bcrypt.hash('demo1234', 10), loyaltyPoints: 0, role: 'CUSTOMER' },
      update: { email: 'demo@brewlite.vn', passwordHash: await bcrypt.hash('demo1234', 10), role: 'CUSTOMER' },
    });
    // Mở rộng ngoài đề (§3.2): tài khoản quầy + quản trị, thao tác qua Swagger /docs (web không có màn cho hai vai trò này)
    for (const s of [
      { id: 'staff-barista', email: 'barista@brewlite.vn', password: 'barista1234', role: 'BARISTA' },
      { id: 'staff-admin', email: 'admin@brewlite.vn', password: 'admin1234', role: 'ADMIN' },
    ]) {
      const passwordHash = await bcrypt.hash(s.password, 10);
      // upsert theo email (unique): DB cũ đã có sẵn email này dưới id khác thì update thay vì lỗi P2002 làm container không khởi động
      await db.user.upsert({
        where: { email: s.email },
        create: { id: s.id, email: s.email, passwordHash, role: s.role, loyaltyPoints: 0 },
        update: { email: s.email, passwordHash, role: s.role },
      });
    }
    // imageUrl: SVG tĩnh trong frontend/public/images (đề §8 Task 2 cần ảnh). update chỉ ghi ảnh để DB cũ có ảnh,
    // không đặt lại tồn kho: số đã bán và số Admin chỉnh giữ qua các lần khởi động
    for (const p of [
      { id: 'p1', name: 'Latte', price: 35000, imageUrl: '/images/latte.svg' },
      { id: 'p2', name: 'Americano', price: 40000, imageUrl: '/images/americano.svg' },
      { id: 'p3', name: 'Cappuccino', price: 45000, imageUrl: '/images/cappuccino.svg' },
      { id: 'p4', name: 'Trà đào', price: 39000, imageUrl: '/images/tra-dao.svg' },
    ]) {
      await db.product.upsert({
        where: { id: p.id },
        create: { ...p, stock: 10, version: 1 },
        update: { imageUrl: p.imageUrl },
      });
    }
    console.log('seeded: u1 (CUSTOMER), staff-barista, staff-admin, p1..p4 (tồn kho 10 khi tạo mới); giữ nguyên đơn và tồn kho đã có');
  } finally {
    await db.$disconnect();
  }
}

main();

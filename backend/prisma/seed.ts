import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { OrderStatus } from '../src/contracts/order.contract';

// Seed tối thiểu cho demo Task 8: user + Latte 35k + đơn order-1042 PENDING (Latte size S: 35.000 + S 0 = 35.000, khớp bảng giá server)
async function main() {
  const db = new PrismaClient();
  try {
    await db.user.upsert({
    where: { id: 'u1' },
    create: { id: 'u1', email: 'demo@brewlite.vn', passwordHash: await bcrypt.hash('demo1234', 10), loyaltyPoints: 0, role: 'CUSTOMER' },
    update: { email: 'demo@brewlite.vn', passwordHash: await bcrypt.hash('demo1234', 10), role: 'CUSTOMER' },
  });
  // Mở rộng ngoài đề (§3.2): tài khoản quầy + quản trị cho demo /barista, /admin
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
  await db.product.upsert({
    where: { id: 'p1' },
    create: { id: 'p1', name: 'Latte', price: 35000, imageUrl: '/images/latte.svg', stock: 10, version: 1 },
    update: { price: 35000, imageUrl: '/images/latte.svg', stock: 10, version: 1 },
  });
  // imageUrl: SVG tĩnh trong frontend/public/images (đề §8 Task 2 cần ảnh); update ghi lại để DB cũ có ảnh sau khi khởi động lại
  for (const p of [
    { id: 'p2', name: 'Americano', price: 40000, imageUrl: '/images/americano.svg' },
    { id: 'p3', name: 'Cappuccino', price: 45000, imageUrl: '/images/cappuccino.svg' },
    { id: 'p4', name: 'Trà đào', price: 39000, imageUrl: '/images/tra-dao.svg' },
  ]) {
    await db.product.upsert({
      where: { id: p.id },
      create: { ...p, stock: 10, version: 1 },
      update: { price: p.price, imageUrl: p.imageUrl, stock: 10, version: 1 },
    });
  }
  await db.orderItem.deleteMany({ where: { orderId: 'order-1042' } });
  await db.payment.deleteMany({ where: { orderId: 'order-1042' } });
  await db.order.deleteMany({ where: { id: 'order-1042' } });
  await db.order.create({
    data: {
      id: 'order-1042',
      userId: 'u1',
      status: OrderStatus.PENDING,
      total: 35000,
      items: { create: [{ productId: 'p1', size: 'S', qty: 1, lineTotal: 35000 }] },
    },
  });
    console.log('seeded: u1 (CUSTOMER), staff-barista, staff-admin, p1..p4 (stock 10), order-1042 PENDING 35000 (Latte size S)');
  } finally {
    await db.$disconnect();
  }
}

main();

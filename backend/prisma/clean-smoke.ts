import { PrismaClient } from '@prisma/client';

// Dữ liệu smoke test trên DB demo: tài khoản email đuôi @smoke.test cùng mọi đơn, biên lai của họ.
// Chạy: docker compose exec backend npm run smoke:clean (hoặc đặt DATABASE_URL rồi npm run smoke:clean).
export const SMOKE_EMAIL_SUFFIX = '@smoke.test';

// Trạng thái đã trừ kho (trừ lúc lên PAID). CANCELLED đã hoàn kho lúc hủy; PENDING / PAYMENT_FAILED chưa trừ.
const STOCK_TAKEN = ['PAID', 'PREPARING', 'READY', 'COMPLETED'];

export async function cleanSmokeData(db: PrismaClient): Promise<{ users: number; orders: number }> {
  const users = await db.user.findMany({ where: { email: { endsWith: SMOKE_EMAIL_SUFFIX } }, select: { id: true } });
  const userIds = users.map((u) => u.id);
  const orders = await db.order.findMany({ where: { userId: { in: userIds } }, include: { items: true } });
  const orderIds = orders.map((o) => o.id);
  await db.$transaction(async (tx) => {
    // hoàn kho đơn smoke đã trừ kho, tăng version như mọi lần đổi tồn kho
    for (const o of orders) {
      if (!STOCK_TAKEN.includes(o.status)) continue;
      for (const i of o.items) await tx.product.update({ where: { id: i.productId }, data: { stock: { increment: i.qty }, version: { increment: 1 } } });
    }
    await tx.payment.deleteMany({ where: { orderId: { in: orderIds } } });
    await tx.orderItem.deleteMany({ where: { orderId: { in: orderIds } } });
    await tx.order.deleteMany({ where: { id: { in: orderIds } } });
    await tx.user.deleteMany({ where: { id: { in: userIds } } });
  }, { timeout: 60000 }); // mặc định 5 giây: hàng trăm đơn smoke sẽ hết giờ và không dọn được gì
  return { users: userIds.length, orders: orderIds.length };
}

if (require.main === module) {
  const db = new PrismaClient();
  cleanSmokeData(db)
    .then((r) => console.log(`smoke:clean: xóa ${r.users} tài khoản ${SMOKE_EMAIL_SUFFIX}, ${r.orders} đơn`))
    .finally(() => db.$disconnect());
}

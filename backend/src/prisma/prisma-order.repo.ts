import { Injectable } from '@nestjs/common';
import { IOrderRepository, OrderDto, OrderStatus } from '../contracts/order.contract';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaOrderRepo implements IOrderRepository {
  constructor(private db: PrismaService) {}

  async findById(id: string): Promise<OrderDto | null> {
    const o = await this.db.order.findUnique({ where: { id }, include: { items: true } });
    if (!o) return null;
    return {
      id: o.id,
      userId: o.userId,
      status: o.status as OrderStatus,
      total: o.total,
      // §12.2 OrderItem không có cột unitPrice → suy ra từ lineTotal/qty (lineTotal = unitPrice*qty, số nguyên)
      items: o.items.map((i) => ({
        productId: i.productId,
        quantity: i.qty,
        unitPrice: i.qty > 0 ? Math.floor(i.lineTotal / i.qty) : i.lineTotal,
        size: i.size,
        toppings: parseToppings(i.toppings),
      })),
      createdAt: o.createdAt,
    };
  }

  async updateStatus(id: string, status: OrderStatus): Promise<OrderDto> {
    await this.db.order.update({ where: { id }, data: { status } });
    return (await this.findById(id))!;
  }

  async save(order: OrderDto): Promise<OrderDto> {
    await this.db.order.create({
      data: {
        id: order.id,
        userId: order.userId,
        status: order.status,
        total: order.total,
        items: {
          create: order.items.map((i) => ({
            productId: i.productId,
            size: i.size ?? 'M',
            toppings: JSON.stringify(i.toppings ?? []),
            qty: i.quantity,
            lineTotal: i.unitPrice * i.quantity,
          })),
        },
      },
    });
    return (await this.findById(order.id))!;
  }
}

// UC02: toppings lưu chuỗi JSON, đọc lỗi thì coi như rỗng thay vì nổ
function parseToppings(raw: string): string[] {
  try {
    const v: unknown = JSON.parse(raw);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

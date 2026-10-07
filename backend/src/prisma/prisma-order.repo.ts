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
      items: o.items.map((i) => ({ productId: i.productId, quantity: i.qty, unitPrice: i.lineTotal })),
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
          create: order.items.map((i) => ({ productId: i.productId, size: 'M', qty: i.quantity, lineTotal: i.unitPrice })),
        },
      },
    });
    return (await this.findById(order.id))!;
  }
}

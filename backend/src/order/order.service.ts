import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { IOrderRepository, OrderStatus } from '../contracts/order.contract';
import { IProductRepository } from '../contracts/product.contract';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrderService {
  constructor(
    private orders: IOrderRepository,
    private products: IProductRepository,
  ) {}

  async create(userId: string, dto: CreateOrderDto) {
    for (const i of dto.items) {
      const p = await this.products.findById(i.productId);
      if (!p) throw new NotFoundException('Product not found');
    }
    const total = dto.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    return this.orders.save({
      id: randomUUID(),
      userId,
      status: OrderStatus.PENDING,
      total,
      items: dto.items.map((i) => ({ ...i })),
      createdAt: new Date(),
    });
  }

  listMine(userId: string) {
    return this.orders.findByUserId(userId);
  }

  // Gap 1: receipt poll trạng thái; 404 đơn lạ, 403 đơn của người khác
  async getById(userId: string, orderId: string) {
    const o = await this.orders.findById(orderId);
    if (!o) throw new NotFoundException('Order not found');
    if (o.userId !== userId) throw new ForbiddenException('Not your order');
    return o;
  }
}

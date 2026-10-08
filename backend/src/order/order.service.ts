import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { IOrderRepository, OrderStatus } from '../contracts/order.contract';
import { IProductRepository } from '../contracts/product.contract';
import { CreateOrderDto } from './dto/create-order.dto';
import { DEFAULT_SIZE, SIZE_UPCHARGE, TOPPING_PRICES } from './pricing';

@Injectable()
export class OrderService {
  constructor(
    private orders: IOrderRepository,
    private products: IProductRepository,
  ) {}

  async create(userId: string, dto: CreateOrderDto) {
    // Giá tính lại hoàn toàn ở server: client sửa giá trong request không có tác dụng
    const items = [];
    for (const i of dto.items) {
      const p = await this.products.findById(i.productId);
      if (!p) throw new NotFoundException('Product not found');
      const size = i.size ?? DEFAULT_SIZE;
      const toppings = i.toppings ?? [];
      const unknown = toppings.find((t) => !(t in TOPPING_PRICES));
      if (unknown) throw new BadRequestException(`Unknown topping: ${unknown}`);
      const unitPrice = p.price + SIZE_UPCHARGE[size] + toppings.reduce((s, t) => s + TOPPING_PRICES[t], 0);
      items.push({ productId: i.productId, quantity: i.quantity, unitPrice, size, toppings });
    }
    const total = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    return this.orders.save({
      id: randomUUID(),
      userId,
      status: OrderStatus.PENDING,
      total,
      items,
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

import { BadRequestException, ForbiddenException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { IOrderRepository, OrderDto, OrderItemDto, OrderStatus } from '../contracts/order.contract';
import { IProductRepository } from '../contracts/product.contract';
import { CreateOrderDto } from './dto/create-order.dto';
import { DEFAULT_SIZE, SIZE_UPCHARGE, TOPPING_PRICES } from './pricing';

export const QUEUE_STATUSES = [OrderStatus.PAID, OrderStatus.PREPARING, OrderStatus.READY];
export type QueueOrderDto = OrderDto & { items: Array<OrderItemDto & { productName: string }> };

@Injectable()
export class OrderService {
  constructor(
    private orders: IOrderRepository,
    private products: IProductRepository,
  ) {}

  // Đề §9 tiêu chí (b): cùng Idempotency-Key chỉ tạo 1 đơn. Key đã có → trả lại đơn cũ (isCached), không so sánh nội dung giỏ
  // (FE giữ 1 key cho 1 giỏ). Key của người khác → 422.
  async create(userId: string, dto: CreateOrderDto, idempotencyKey?: string): Promise<OrderDto & { isCached: boolean }> {
    if (idempotencyKey) {
      const hit = await this.orders.findByIdempotencyKey(idempotencyKey);
      if (hit) return this.replay(userId, hit);
    }
    // Giá tính lại hoàn toàn ở server: client sửa giá trong request không có tác dụng
    const items = [];
    for (const i of dto.items) {
      const p = await this.products.findById(i.productId);
      if (!p) throw new NotFoundException('Product not found');
      const size = i.size ?? DEFAULT_SIZE;
      const toppings = i.toppings ?? [];
      // `in` nhận cả khóa prototype ("constructor"), ra unitPrice NaN: phải kiểm khóa sở hữu
      const unknown = toppings.find((t) => !Object.prototype.hasOwnProperty.call(TOPPING_PRICES, t));
      if (unknown) throw new BadRequestException(`Unknown topping: ${unknown}`);
      const unitPrice = p.price + SIZE_UPCHARGE[size] + toppings.reduce((s, t) => s + TOPPING_PRICES[t], 0);
      items.push({ productId: i.productId, quantity: i.quantity, unitPrice, size, toppings });
    }
    const total = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    // cột total là Int ở Postgres: vượt Int32 sẽ 500
    if (total > 2147483647) throw new BadRequestException('Order total too large');
    try {
      const saved = await this.orders.save({
        id: randomUUID(),
        userId,
        status: OrderStatus.PENDING,
        total,
        items,
        createdAt: new Date(),
        idempotencyKey,
      });
      return { ...saved, isCached: false };
    } catch (e) {
      // 2 request song song cùng key: bên thua vi phạm chỉ số unique, đọc lại đơn của bên thắng thay vì tạo đơn thứ 2
      const hit = idempotencyKey ? await this.orders.findByIdempotencyKey(idempotencyKey) : null;
      if (hit) return this.replay(userId, hit);
      throw e;
    }
  }

  private replay(userId: string, hit: OrderDto) {
    if (hit.userId !== userId) throw new UnprocessableEntityException('Idempotency-Key already used by another user');
    return { ...hit, isCached: true };
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

  // UC08 (mở rộng ngoài MVP §3.2): hàng đợi quầy, kèm tên món để barista đọc được
  async listQueue(statuses: OrderStatus[] = QUEUE_STATUSES): Promise<QueueOrderDto[]> {
    const bad = statuses.find((s) => !QUEUE_STATUSES.includes(s));
    if (bad) throw new BadRequestException(`Status ${bad} is not in the counter queue`);
    const orders = await this.orders.findByStatuses(statuses);
    const names = new Map<string, string>();
    for (const o of orders) for (const i of o.items) {
      if (!names.has(i.productId)) names.set(i.productId, (await this.products.findById(i.productId))?.name ?? i.productId);
    }
    return orders.map((o) => ({ ...o, items: o.items.map((i) => ({ ...i, productName: names.get(i.productId)! })) }));
  }
}

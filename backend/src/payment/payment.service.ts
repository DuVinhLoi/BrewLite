import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { IOrderRepository, OrderStatus } from '../contracts/order.contract';
import { IProductRepository } from '../contracts/product.contract';
import { IPaymentRepository } from '../contracts/payment.contract';
import { IUserRepository } from '../contracts/user.contract';
import { MockPaymentGatewayService } from './mock-payment-gateway.service';
import { assertTransition } from '../state-machine/order-state.machine';
import { CreatePaymentDto } from './dto/create-payment.dto';

const VOUCHER_CODE = 'BREWLITE10';
const VOUCHER_RATE = 0.1;
const LOYALTY_RATE = 0.1;
const VND_PER_POINT = 1000;

@Injectable()
export class PaymentService {
  constructor(
    private orders: IOrderRepository,
    private products: IProductRepository,
    private payments: IPaymentRepository,
    private users: IUserRepository,
    private gateway: MockPaymentGatewayService,
  ) {}

  async processPayment(dto: CreatePaymentDto, idempotencyKey: string) {
    if (!idempotencyKey) throw new BadRequestException('Missing Idempotency-Key');
    const hit = await this.payments.findByIdempotencyKey(idempotencyKey);
    if (hit) return { isCached: true, status: 'PAID', orderId: hit.orderId, amount: hit.amount, paymentId: hit.id, discount: hit.discount, loyaltyPointsEarned: hit.loyaltyPointsEarned };

    const order = await this.orders.findById(dto.orderId);
    if (!order) throw new NotFoundException('Order not found');

    const discount = dto.voucherCode === VOUCHER_CODE ? Math.floor(order.total * VOUCHER_RATE) : 0;
    const finalAmount = Math.max(0, order.total - discount);

    if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.PAYMENT_FAILED) {
      assertTransition(order.status, OrderStatus.PAID);
    }

    if (order.status === OrderStatus.PAYMENT_FAILED) {
      assertTransition(order.status, OrderStatus.PENDING);
      await this.orders.updateStatus(order.id, OrderStatus.PENDING);
      order.status = OrderStatus.PENDING;
    }

    try {
      await this.gateway.charge({ amount: finalAmount, method: dto.paymentMethod });
    } catch {
      assertTransition(order.status, OrderStatus.PAYMENT_FAILED);
      await this.orders.updateStatus(order.id, OrderStatus.PAYMENT_FAILED);
      throw new BadRequestException('Payment failed');
    }

    assertTransition(order.status, OrderStatus.PAID);

    // ponytail: sequential stock loop, parallel TX if throughput matters
    const deducted: { productId: string; quantity: number }[] = [];
    for (const item of order.items) {
      let done = false;
      for (let attempt = 0; attempt < 3 && !done; attempt++) {
        const p = await this.products.findById(item.productId);
        if (!p) throw new NotFoundException('Product not found');
        done = await this.products.deductStockWithOptimisticLock(item.productId, item.quantity, p.version);
      }
      if (!done) {
        for (const d of deducted) await this.products.restoreStock(d.productId, d.quantity);
        await this.gateway.refund(order.id, finalAmount).catch(() => undefined);
        await this.orders.updateStatus(order.id, OrderStatus.PAYMENT_FAILED);
        throw new ConflictException('Out of stock');
      }
      deducted.push({ productId: item.productId, quantity: item.quantity });
    }

    await this.orders.updateStatus(order.id, OrderStatus.PAID);
    const points = Math.floor((finalAmount * LOYALTY_RATE) / VND_PER_POINT);
    if (points > 0) await this.users.addLoyaltyPoints(order.userId, points);

    const payment = await this.payments.save({
      id: crypto.randomUUID(),
      orderId: order.id,
      idempotencyKey,
      amount: finalAmount,
      method: dto.paymentMethod,
      status: 'SUCCESS',
      discount,
      loyaltyPointsEarned: points,
      createdAt: new Date(),
    });
    return { isCached: false, status: 'PAID', orderId: order.id, amount: finalAmount, discount, loyaltyPointsEarned: points, paymentId: payment.id };
  }

  async cancelOrder(orderId: string) {
    const order = await this.orders.findById(orderId);
    if (!order) throw new NotFoundException('Order not found');
    assertTransition(order.status, OrderStatus.CANCELLED);
    if (order.status === OrderStatus.PAID) {
      // UC06 KB3: hoàn đúng số tiền thực thu = cộng mọi biên lai SUCCESS của đơn
      const receipts = await this.payments.findAllByOrderId(order.id);
      const collected = receipts.filter((p) => p.status === 'SUCCESS').reduce((s, p) => s + p.amount, 0);
      await this.gateway.refund(order.id, collected > 0 ? collected : order.total);
      for (const item of order.items) await this.products.restoreStock(item.productId, item.quantity);
    }
    return this.orders.updateStatus(order.id, OrderStatus.CANCELLED);
  }

  // Gap 1: tiến đơn PAID→PREPARING→READY→COMPLETED, chỉ chủ đơn; CANCELLED đi đường cancelOrder (hoàn tiền)
  async advanceOrder(userId: string, orderId: string, status: OrderStatus) {
    if (status === OrderStatus.CANCELLED) throw new BadRequestException('Use cancel for CANCELLED');
    const order = await this.orders.findById(orderId);
    if (!order) throw new NotFoundException('Order not found');
    if (order.userId !== userId) throw new ForbiddenException('Not your order');
    assertTransition(order.status, status);
    return this.orders.updateStatus(order.id, status);
  }

  // Gap 1: chặn chủ đơn lạ hủy hộ; refund/stock giữ nguyên trong cancelOrder
  async cancelOrderAs(userId: string, orderId: string) {
    const order = await this.orders.findById(orderId);
    if (!order) throw new NotFoundException('Order not found');
    if (order.userId !== userId) throw new ForbiddenException('Not your order');
    return this.cancelOrder(orderId);
  }
}

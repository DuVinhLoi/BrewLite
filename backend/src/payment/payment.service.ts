import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { IOrderRepository, OrderStatus } from '../contracts/order.contract';
import { IProductRepository } from '../contracts/product.contract';
import { IPaymentRepository } from '../contracts/payment.contract';
import { Actor, IUserRepository, isStaff } from '../contracts/user.contract';
import { MockPaymentGatewayService } from './mock-payment-gateway.service';
import { assertTransition } from '../state-machine/order-state.machine';
import { assertIdempotencyKeyLength } from '../common/idempotency-key';
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

  // Khóa trong tiến trình, chỉ đúng với 1 instance backend. Nhiều instance thì cần khóa DB (pg advisory lock / SELECT ... FOR UPDATE).
  private locks = new Map<string, Promise<unknown>>();

  private async withLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const run = (this.locks.get(key) ?? Promise.resolve()).then(fn);
    const tail = run.catch(() => undefined);
    this.locks.set(key, tail);
    try {
      return await run;
    } finally {
      if (this.locks.get(key) === tail) this.locks.delete(key);
    }
  }

  // 10b: khóa theo key rồi theo đơn; request trùng chờ nhau và đọc lại cache, không charge() lần 2.
  async processPayment(userId: string, dto: CreatePaymentDto, idempotencyKey: string) {
    if (!idempotencyKey) throw new BadRequestException('Missing Idempotency-Key');
    assertIdempotencyKeyLength(idempotencyKey);
    return this.withLock(`key:${idempotencyKey}`, () =>
      this.withLock(`order:${dto.orderId}`, () => this.pay(userId, dto, idempotencyKey)),
    );
  }

  private async pay(userId: string, dto: CreatePaymentDto, idempotencyKey: string) {
    // Kiểm tra chủ đơn trước cache để người khác không đọc được biên lai qua key.
    const order = await this.orders.findById(dto.orderId);
    if (!order) throw new NotFoundException('Order not found');
    if (order.userId !== userId) throw new ForbiddenException('Not your order');

    const hit = await this.payments.findByIdempotencyKey(idempotencyKey);
    if (hit) {
      // Key đã dùng cho đơn khác: vẫn kiểm chủ đơn đó, rồi trả 422 (FE dành 409 cho hết hàng).
      if (hit.orderId !== order.id) {
        const hitOrder = await this.orders.findById(hit.orderId);
        if (!hitOrder) throw new NotFoundException('Order not found');
        if (hitOrder.userId !== userId) throw new ForbiddenException('Not your order');
        throw new UnprocessableEntityException('Idempotency-Key already used for another order');
      }
      return { isCached: true, status: OrderStatus.PAID, orderId: hit.orderId, amount: hit.amount, paymentId: hit.id, discount: hit.discount, loyaltyPointsEarned: hit.loyaltyPointsEarned };
    }

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

    const points = Math.floor((finalAmount * LOYALTY_RATE) / VND_PER_POINT);
    let paymentId = '';
    try {
      // Trừ kho, PAID, cộng điểm, lưu biên lai trong 1 transaction; hoàn tiền nằm ngoài vì gọi cổng ngoài.
      await this.orders.runInTransaction(async (tx) => {
        // Optimistic lock: lệch version thì đọc lại, thử tối đa 3 lần.
        for (const item of order.items) {
          let done = false;
          for (let attempt = 0; attempt < 3 && !done; attempt++) {
            const p = await this.products.findById(item.productId, tx);
            if (!p) throw new NotFoundException('Product not found');
            done = await this.products.deductStockWithOptimisticLock(item.productId, item.quantity, p.version, tx);
          }
          if (!done) throw new ConflictException('Out of stock');
        }

        await this.orders.updateStatus(order.id, OrderStatus.PAID, tx);
        if (points > 0) await this.users.addLoyaltyPoints(order.userId, points, tx);

        const payment = await this.payments.save(
          {
            id: crypto.randomUUID(),
            orderId: order.id,
            idempotencyKey,
            amount: finalAmount,
            method: dto.paymentMethod,
            status: 'SUCCESS',
            discount,
            loyaltyPointsEarned: points,
            createdAt: new Date(),
          },
          tx,
        );
        paymentId = payment.id;
      });
    } catch (e) {
      // Đã charge nhưng ghi DB lỗi: hoàn tiền, chuyển PAYMENT_FAILED, ném lại lỗi gốc.
      // Lỗi ở bước bù bị bỏ qua; chạy thật cần job đối soát.
      await this.gateway.refund(order.id, finalAmount).catch(() => undefined);
      // Transaction đã rollback nên đơn vẫn PENDING.
      assertTransition(order.status, OrderStatus.PAYMENT_FAILED);
      await this.orders.updateStatus(order.id, OrderStatus.PAYMENT_FAILED).catch(() => undefined);
      throw e;
    }
    return { isCached: false, status: OrderStatus.PAID, orderId: order.id, amount: finalAmount, discount, loyaltyPointsEarned: points, paymentId };
  }

  async cancelOrder(orderId: string) {
    return this.withLock(`order:${orderId}`, () => this.cancel(orderId));
  }

  private async cancel(orderId: string) {
    const order = await this.orders.findById(orderId);
    if (!order) throw new NotFoundException('Order not found');
    assertTransition(order.status, OrderStatus.CANCELLED);
    if (order.status === OrderStatus.PAID) {
      // Hoàn tổng các biên lai SUCCESS; không có biên lai thì không hoàn.
      const receipts = await this.payments.findAllByOrderId(order.id);
      const collected = receipts.filter((p) => p.status === 'SUCCESS').reduce((s, p) => s + p.amount, 0);
      if (collected > 0) await this.gateway.refund(order.id, collected);
      // Hoàn kho + CANCELLED trong 1 transaction. Refund nằm ngoài: transaction lỗi sau refund thì hủy lại sẽ hoàn lần 2.
      return this.orders.runInTransaction(async (tx) => {
        for (const item of order.items) await this.products.restoreStock(item.productId, item.quantity, tx);
        return this.orders.updateStatus(order.id, OrderStatus.CANCELLED, tx);
      });
    }
    return this.orders.updateStatus(order.id, OrderStatus.CANCELLED);
  }

  // Chỉ nhân viên tiến đơn PAID → PREPARING → READY → COMPLETED.
  async advanceOrder(actor: Actor, orderId: string, status: OrderStatus) {
    if (status === OrderStatus.CANCELLED) throw new BadRequestException('Use cancel for CANCELLED');
    if (!isStaff(actor)) throw new ForbiddenException('Only staff can advance orders');
    return this.withLock(`order:${orderId}`, async () => {
      const order = await this.orders.findById(orderId);
      if (!order) throw new NotFoundException('Order not found');
      assertTransition(order.status, status);
      return this.orders.updateStatus(order.id, status);
    });
  }

  // Khách hủy đơn của mình, quầy hủy đơn đã trả.
  async cancelOrderAs(actor: Actor, orderId: string) {
    const order = await this.orders.findById(orderId);
    if (!order) throw new NotFoundException('Order not found');
    if (!isStaff(actor) && order.userId !== actor.id) throw new ForbiddenException('Not your order');
    // Quầy chỉ hủy đơn đã trả; từ PREPARING trở đi assertTransition trả 400.
    if (isStaff(actor) && (order.status === OrderStatus.PENDING || order.status === OrderStatus.PAYMENT_FAILED))
      throw new ForbiddenException('Staff can only cancel paid orders');
    return this.cancelOrder(orderId);
  }
}

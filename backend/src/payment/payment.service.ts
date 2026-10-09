import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { IOrderRepository, OrderStatus } from '../contracts/order.contract';
import { IProductRepository } from '../contracts/product.contract';
import { IPaymentRepository } from '../contracts/payment.contract';
import { Actor, IUserRepository, isStaff } from '../contracts/user.contract';
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

  // ponytail: khóa trong tiến trình — đủ cho 1 instance backend (compose); chạy nhiều instance thì đổi sang khóa DB (pg advisory lock / SELECT ... FOR UPDATE)
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

  // 10b: tuần tự hóa theo key VÀ theo đơn → request song song (cùng key hoặc khác key cùng đơn)
  // chờ nhau, request sau đọc lại cache/trạng thái mới nên không gọi charge() lần 2
  async processPayment(userId: string, dto: CreatePaymentDto, idempotencyKey: string) {
    if (!idempotencyKey) throw new BadRequestException('Missing Idempotency-Key');
    return this.withLock(`key:${idempotencyKey}`, () =>
      this.withLock(`order:${dto.orderId}`, () => this.pay(userId, dto, idempotencyKey)),
    );
  }

  private async pay(userId: string, dto: CreatePaymentDto, idempotencyKey: string) {
    // chủ đơn kiểm tra TRƯỚC cache: người lạ không thanh toán hộ và không đọc được biên lai bằng key
    const order = await this.orders.findById(dto.orderId);
    if (!order) throw new NotFoundException('Order not found');
    if (order.userId !== userId) throw new ForbiddenException('Not your order');

    const hit = await this.payments.findByIdempotencyKey(idempotencyKey);
    if (hit) {
      // key có thể thuộc biên lai của đơn khác (không phải dto.orderId): đơn đó cũng phải là của người gọi
      if (hit.orderId !== order.id) {
        const hitOrder = await this.orders.findById(hit.orderId);
        if (!hitOrder) throw new NotFoundException('Order not found');
        if (hitOrder.userId !== userId) throw new ForbiddenException('Not your order');
      }
      return { isCached: true, status: 'PAID', orderId: hit.orderId, amount: hit.amount, paymentId: hit.id, discount: hit.discount, loyaltyPointsEarned: hit.loyaltyPointsEarned };
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
      // 3 ghi sau charge (trừ kho + lên PAID + điểm/loyalty + biên lai) trong 1 transaction
      // nguyên tử qua seam I*Repository: rollback tự ném bỏ phần đã trừ, bù hoàn tiền +
      // PAYMENT_FAILED thực hiện ngoài transaction.
      await this.orders.runInTransaction(async (tx) => {
        // ponytail: sequential stock loop, parallel TX if throughput matters
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
      // charge đã thành công mà ghi DB lỗi (kẹt kho 409, sản phẩm mất, lỗi DB…): hoàn đúng số đã thu + PAYMENT_FAILED
      // để thử lại bằng key mới không trừ tiền lần 2; luôn ném lại lỗi gốc (lỗi của bước bù không được che nó).
      // ponytail: hoàn tiền/ghi PAYMENT_FAILED lỗi thì bỏ qua (chưa có sổ đối soát) — cần job đối soát nếu chạy thật
      await this.gateway.refund(order.id, finalAmount).catch(() => undefined);
      // transaction đã rollback nên đơn đang PENDING (không đọc order.status: repo in-memory trả cùng object, đã bị đổi sang PAID)
      assertTransition(OrderStatus.PENDING, OrderStatus.PAYMENT_FAILED);
      await this.orders.updateStatus(order.id, OrderStatus.PAYMENT_FAILED).catch(() => undefined);
      throw e;
    }
    return { isCached: false, status: 'PAID', orderId: order.id, amount: finalAmount, discount, loyaltyPointsEarned: points, paymentId };
  }

  async cancelOrder(orderId: string) {
    return this.withLock(`order:${orderId}`, () => this.cancel(orderId));
  }

  private async cancel(orderId: string) {
    const order = await this.orders.findById(orderId);
    if (!order) throw new NotFoundException('Order not found');
    assertTransition(order.status, OrderStatus.CANCELLED);
    if (order.status === OrderStatus.PAID) {
      // UC06 KB3: hoàn đúng số tiền thực thu = cộng mọi biên lai SUCCESS của đơn
      const receipts = await this.payments.findAllByOrderId(order.id);
      const collected = receipts.filter((p) => p.status === 'SUCCESS').reduce((s, p) => s + p.amount, 0);
      await this.gateway.refund(order.id, collected > 0 ? collected : order.total);
      // hoàn kho (mọi món) + CANCELLED trong 1 transaction: lỗi giữa chừng thì rollback, đơn vẫn PAID, kho không đổi dở.
      // ponytail: refund nằm ngoài transaction (gọi cổng ngoài) — transaction lỗi sau refund thì tiền đã hoàn mà đơn vẫn PAID, hủy lại sẽ hoàn lần 2
      return this.orders.runInTransaction(async (tx) => {
        for (const item of order.items) await this.products.restoreStock(item.productId, item.quantity, tx);
        return this.orders.updateStatus(order.id, OrderStatus.CANCELLED, tx);
      });
    }
    return this.orders.updateStatus(order.id, OrderStatus.CANCELLED);
  }

  // UC09–UC11 (mở rộng §3.2): chỉ quầy/quản trị tiến đơn PAID→PREPARING→READY→COMPLETED; khách nhận 403
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

  // UC06 (khách hủy đơn của mình) + UC12 (quầy hủy đơn hết nguyên liệu); hoàn tiền/hoàn kho trong cancelOrder
  async cancelOrderAs(actor: Actor, orderId: string) {
    const order = await this.orders.findById(orderId);
    if (!order) throw new NotFoundException('Order not found');
    if (!isStaff(actor) && order.userId !== actor.id) throw new ForbiddenException('Not your order');
    // UC12: quầy chỉ hủy đơn đã trả (hết nguyên liệu); PREPARING trở đi để assertTransition trả 400 như cũ
    if (isStaff(actor) && (order.status === OrderStatus.PENDING || order.status === OrderStatus.PAYMENT_FAILED))
      throw new ForbiddenException('Staff can only cancel paid orders');
    return this.cancelOrder(orderId);
  }
}

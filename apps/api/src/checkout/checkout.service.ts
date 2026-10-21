import { createHmac } from 'node:crypto';
import { ConflictException, ForbiddenException, HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, OrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { Identity } from '../auth/auth.service';
import { invalid, parseItems, record, unitPrice } from './pricing';
import { simulatePayment } from './payment';
import { canTransition } from './order-state';

@Injectable()
export class CheckoutService {
  constructor(private readonly prisma: PrismaService) {}
  customer(user: Identity) { if (user.role !== 'CUSTOMER') throw new ForbiddenException(); }
  private async owned(tx: Prisma.TransactionClient, id: string, user: Identity) {
    const order = await tx.order.findUnique({ where: { id }, include: { items: true } });
    if (!order) throw new NotFoundException({ code: 'ORDER_NOT_FOUND', message: 'Không tìm thấy đơn hàng' });
    if (user.role !== 'BARISTA' && order.userId !== user.sub) throw new ForbiddenException();
    return order;
  }
  async create(user: Identity, body: unknown) {
    this.customer(user);
    const items = parseItems(body);
    return this.prisma.$transaction(async (tx) => {
      const lines = [];
      // Stable lock order avoids deadlocks when two carts contain the same products.
      for (const item of [...items].sort((a, b) => a.productId.localeCompare(b.productId))) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product) throw new NotFoundException({ code: 'PRODUCT_NOT_FOUND', message: 'Không tìm thấy sản phẩm' });
        const changed = await tx.product.updateMany({ where: { id: product.id, stock: { gte: item.quantity } }, data: { stock: { decrement: item.quantity } } });
        if (changed.count !== 1) throw new ConflictException({ code: 'OUT_OF_STOCK', message: `${product.name} không đủ tồn kho` });
        const price = unitPrice(product.price, item.size, item.toppings);
        lines.push({ ...item, name: product.name, unitPrice: price, lineTotal: price * item.quantity });
      }
      return tx.order.create({ data: { userId: user.sub, total: lines.reduce((total, line) => total + line.lineTotal, 0), items: { create: lines } }, include: { items: true } });
    });
  }
  async list(user: Identity) {
    this.customer(user);
    return this.prisma.order.findMany({ where: { userId: user.sub }, include: { items: true }, orderBy: { createdAt: 'desc' }, take: 50 });
  }
  async detail(user: Identity, id: string) {
    const order = await this.owned(this.prisma, id, user);
    const payments = await this.prisma.payment.findMany({ where: { orderId: id }, select: { id: true, method: true, status: true, amount: true, createdAt: true }, orderBy: { createdAt: 'desc' } });
    return { ...order, payments };
  }
  async transition(user: Identity, id: string, body: unknown) {
    const { status } = record(body, ['status']);
    if (typeof status !== 'string' || !['PREPARING', 'READY', 'COMPLETED', 'CANCELLED'].includes(status)) invalid('status không hợp lệ');
    if (user.role === 'CUSTOMER' && status !== 'CANCELLED') throw new ForbiddenException();
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM orders WHERE id = ${id} FOR UPDATE`;
      const order = await this.owned(tx, id, user);
      const cancel = user.role === 'CUSTOMER' && status === 'CANCELLED' && ['PENDING', 'PAYMENT_FAILED'].includes(order.status);
      if (user.role === 'CUSTOMER' && order.status === 'PAID') throw new ForbiddenException();
      if (!cancel && !(user.role === 'BARISTA' && status !== 'CANCELLED' && canTransition(order.status, status as OrderStatus))) throw new ConflictException({ code: 'INVALID_ORDER_TRANSITION', message: 'Không thể chuyển trạng thái đơn' });
      if (cancel) {
        for (const line of [...order.items].sort((a, b) => a.productId.localeCompare(b.productId))) {
          await tx.product.update({ where: { id: line.productId }, data: { stock: { increment: line.quantity } } });
        }
      }
      return tx.order.update({ where: { id }, data: { status: status as OrderStatus }, include: { items: true } });
    });
  }
  async pay(user: Identity, body: unknown, key?: string) {
    this.customer(user);
    if (!key?.trim() || key.length > 255) throw new HttpException({ code: 'IDEMPOTENCY_KEY_REQUIRED', message: 'Thiếu Idempotency-Key hợp lệ' }, 400);
    const input = record(body, ['orderId', 'paymentMethod', 'cardNumber']);
    if (typeof input.orderId !== 'string' || !input.orderId || input.orderId.length > 100) invalid('orderId không hợp lệ');
    if (input.paymentMethod !== 'WALLET' && input.paymentMethod !== 'CARD') invalid('paymentMethod không hợp lệ');
    if (input.paymentMethod === 'CARD' && (typeof input.cardNumber !== 'string' || !/^\d{16}$/.test(input.cardNumber))) invalid('cardNumber phải gồm 16 chữ số demo');
    if (input.paymentMethod === 'WALLET' && input.cardNumber !== undefined) invalid('Ví không nhận cardNumber');
    const { orderId, paymentMethod } = input;
    const fingerprint = createHmac('sha256', process.env.JWT_SECRET!).update(JSON.stringify([orderId, paymentMethod, input.cardNumber ?? null])).digest('hex');
    const result = await this.prisma.$transaction(async (tx) => {
      // Cross-process lock: successful keys are scoped to the customer, including different orders.
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${user.sub}))::text`;
      await tx.$queryRaw`SELECT id FROM orders WHERE id = ${orderId} FOR UPDATE`;
      const order = await this.owned(tx, orderId, user);
      const prior = await tx.payment.findFirst({ where: { userId: user.sub, idempotencyKey: key, status: 'SUCCESS' } });
      if (prior) {
        if (prior.fingerprint !== fingerprint) throw new HttpException({ code: 'IDEMPOTENCY_KEY_REUSED', message: 'Key đã dùng cho yêu cầu khác' }, 422);
        return { replay: true, paymentId: prior.id, orderId, orderStatus: 'PAID', amount: prior.amount, status: 'SUCCESS' };
      }
      if (!['PENDING', 'PAYMENT_FAILED'].includes(order.status)) throw new ConflictException({ code: 'ORDER_NOT_PAYABLE', message: 'Đơn không thể thanh toán' });
      if (order.status === 'PAYMENT_FAILED') await tx.order.update({ where: { id: orderId }, data: { status: 'PENDING' } });
      const outcome = await simulatePayment(paymentMethod, input.cardNumber as string | undefined);
      const success = outcome === 'SUCCESS';
      const payment = await tx.payment.create({ data: { orderId, userId: user.sub, method: paymentMethod, status: success ? 'SUCCESS' : 'FAILED', amount: order.total, idempotencyKey: key, fingerprint } });
      await tx.order.update({ where: { id: orderId }, data: { status: success ? 'PAID' : 'PAYMENT_FAILED' } });
      return { replay: false, paymentId: payment.id, orderId, orderStatus: success ? 'PAID' : 'PAYMENT_FAILED', amount: order.total, status: payment.status, outcome };
    }, { maxWait: 20000, timeout: 20000 });
    if ('outcome' in result && result.outcome !== 'SUCCESS') {
      const unavailable = result.outcome === 'UNAVAILABLE';
      throw new HttpException({ code: unavailable ? 'PAYMENT_SERVICE_UNAVAILABLE' : 'PAYMENT_DECLINED', message: unavailable ? 'Dịch vụ thanh toán không phản hồi, vui lòng thử lại' : 'Thanh toán bị từ chối, vui lòng thử lại' }, unavailable ? 502 : 402);
    }
    const { replay, paymentId, orderStatus, amount, status } = result;
    return { replay, body: { paymentId, orderId, orderStatus, amount, status } };
  }
}
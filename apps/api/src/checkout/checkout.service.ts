import { createHmac } from 'node:crypto';
import { BadGatewayException, ConflictException, ForbiddenException, HttpException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma, OrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { Identity } from '../auth/auth.service';
import { invalid, parseItems, record, unitPrice } from './pricing';
import { canTransition } from './order-state';
import { InventoryService } from '../inventory/inventory.service';
import { VnpayGateway, type QueryResult } from '../payment/payment-gateway';
import { ipnAction, isPastGrace, parseVnDate, queryDrAction, unansweredQueryAction, verifyReturn } from '../payment/vnpay';
import { canVerify, readVnpayConfig } from '../payment/vnpay-config';

const transactionOptions = { maxWait: 20000, timeout: 20000 };
const IPN_MESSAGES: Record<string, string> = {
  '00': 'Confirm Success', '01': 'Order not found', '02': 'Order already confirmed', '04': 'Invalid amount', '97': 'Invalid signature', '99': 'Unknown error',
};

const inProgress = () => new ConflictException({ code: 'PAYMENT_IN_PROGRESS', message: 'Thanh toán đang chờ VNPay xác nhận, vui lòng kiểm tra lại sau' });
const providerError = () => new BadGatewayException({ code: 'PAYMENT_PROVIDER_ERROR', message: 'Không kết nối được cổng thanh toán VNPay, vui lòng thử lại sau' });
// now >= expiresAt (plan 1.6).
const isExpired = (payment: { expiresAt: Date | null }, now: Date) => payment.expiresAt !== null && payment.expiresAt <= now;
const text = (value: unknown) => (typeof value === 'string' && value ? value : null);

// Final result of an authenticated IPN or QueryDR answer, already normalized for applyGatewayResult (plan 1.3).
type GatewayResult = {
  outcome: 'SUCCESS' | 'FAILED'; responseCode: string; transactionStatus: string | null;
  transactionNo: string | null; bankCode: string | null; paidAt: Date | null;
};
type PayInput = { orderId: string; paymentMethod: 'WALLET' | 'CARD'; key: string; fingerprint: string; ipAddr: string };
type QueryVerdict = 'DONE' | 'IN_PROGRESS' | 'PROVIDER_ERROR';
// What closing a payment after the grace (D6) writes; gatewayTransactionStatus stays null.
const EXPIRED_RESULT: GatewayResult = { outcome: 'FAILED', responseCode: 'EXPIRED', transactionStatus: null, transactionNo: null, bankCode: null, paidAt: null };

@Injectable()
export class CheckoutService {
  private readonly logger = new Logger(CheckoutService.name);
  constructor(private readonly prisma: PrismaService, private readonly inventory: InventoryService, private readonly gateway: VnpayGateway) {}
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
      for (const item of [...items].sort((a, b) => a.productId.localeCompare(b.productId))) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product) throw new NotFoundException({ code: 'PRODUCT_NOT_FOUND', message: 'Không tìm thấy sản phẩm' });
        const price = unitPrice(product.price, item.size, item.toppings);
        lines.push({ ...item, name: product.name, unitPrice: price, lineTotal: price * item.quantity });
      }
      const ingredients = await this.inventory.reserve(tx, items);
      return tx.order.create({ data: { userId: user.sub, inventoryTracked: true, ingredients: { create: ingredients }, total: lines.reduce((total, line) => total + line.lineTotal, 0), items: { create: lines } }, include: { items: true } });
    }, { maxWait: 20000, timeout: 20000 });
  }
  async list(user: Identity) {
    this.customer(user);
    return this.prisma.order.findMany({ where: { userId: user.sub }, include: { items: true }, orderBy: { createdAt: 'desc' }, take: 50 });
  }
  async detail(user: Identity, id: string) {
    const order = await this.owned(this.prisma, id, user);
    const payments = await this.prisma.payment.findMany({ where: { orderId: id }, select: { id: true, method: true, status: true, amount: true, createdAt: true, paymentUrl: true, expiresAt: true, gatewayResponseCode: true, gatewayTransactionStatus: true }, orderBy: { createdAt: 'desc' } });
    return { ...order, payments };
  }
  async transition(user: Identity, id: string, body: unknown) {
    const { status } = record(body, ['status']);
    if (typeof status !== 'string' || !['PREPARING', 'READY', 'COMPLETED', 'CANCELLED'].includes(status)) invalid('status không hợp lệ');
    if (user.role === 'CUSTOMER' && status !== 'CANCELLED') throw new ForbiddenException();
    // Ownership first, then settle an expired PENDING payment with VNPay outside the transaction that locks the order (AC-F25.4).
    if (user.role === 'CUSTOMER') {
      await this.owned(this.prisma, id, user);
      await this.resolveExpired(id);
    }
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM orders WHERE id = ${id} FOR UPDATE`;
      const order = await this.owned(tx, id, user);
      const cancel = user.role === 'CUSTOMER' && status === 'CANCELLED' && ['PENDING', 'PAYMENT_FAILED'].includes(order.status);
      if (user.role === 'CUSTOMER' && order.status === 'PAID') throw new ForbiddenException();
      if (!cancel && !(user.role === 'BARISTA' && status !== 'CANCELLED' && canTransition(order.status, status as OrderStatus))) throw new ConflictException({ code: 'INVALID_ORDER_TRANSITION', message: 'Không thể chuyển trạng thái đơn' });
      if (cancel) {
        // A PENDING payment left now is still undecided (or appeared after the reconcile): the customer may be paying right now.
        if (await tx.payment.count({ where: { orderId: id, status: 'PENDING' } })) throw inProgress();
        if (order.inventoryTracked) await this.inventory.settle(tx, order.id, false);
        else {
          for (const line of [...order.items].sort((a, b) => a.productId.localeCompare(b.productId))) {
            await tx.product.update({ where: { id: line.productId }, data: { stock: { increment: line.quantity } } });
          }
        }
      }
      return tx.order.update({ where: { id }, data: { status: status as OrderStatus }, include: { items: true } });
    }, transactionOptions);
  }
  // POST /payments, in the order of plan 1.5. replay=true is answered with HTTP 200, replay=false with 201.
  async pay(user: Identity, body: unknown, key: string | undefined, ipAddr: string) {
    this.customer(user);
    if (!key?.trim() || key.length > 255) throw new HttpException({ code: 'IDEMPOTENCY_KEY_REQUIRED', message: 'Thiếu Idempotency-Key hợp lệ' }, 400);
    const input = record(body, ['orderId', 'paymentMethod']);
    if (typeof input.orderId !== 'string' || !input.orderId || input.orderId.length > 100) invalid('orderId không hợp lệ');
    if (input.paymentMethod !== 'WALLET' && input.paymentMethod !== 'CARD') invalid('paymentMethod không hợp lệ');
    const { orderId, paymentMethod } = input;
    const fingerprint = createHmac('sha256', process.env.JWT_SECRET!).update(JSON.stringify([orderId, paymentMethod])).digest('hex');
    const args: PayInput = { orderId, paymentMethod, key, fingerprint, ipAddr };
    // Step 1: the caller must own the order before anything asks VNPay or writes.
    await this.owned(this.prisma, orderId, user);
    let result = await this.tryPay(user, args);
    if (!result) {
      // Step 4: an expired PENDING payment is asked about at VNPay with no lock held, then the whole check runs again (replay first).
      await this.resolveExpired(orderId);
      result = await this.tryPay(user, args);
    }
    if (!result) throw inProgress();
    return result;
  }
  // One pass of steps 2-7 under the order lock. Returns null when an expired PENDING payment has to be reconciled first.
  private async tryPay(user: Identity, input: PayInput) {
    const { orderId, paymentMethod, key } = input;
    return this.prisma.$transaction(async (tx) => {
      // Serialize customer payment transactions across processes before checking replay.
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${user.sub}))::text`;
      await tx.$queryRaw`SELECT id FROM orders WHERE id = ${orderId} FOR UPDATE`;
      const order = await this.owned(tx, orderId, user);
      // Step 2: replay of a confirmed payment (BR-05) comes before the order status check.
      const prior = await tx.payment.findFirst({ where: { userId: user.sub, orderId, idempotencyKey: key, status: 'SUCCESS' } });
      if (prior?.method === paymentMethod) {
        return { replay: true, body: { paymentId: prior.id, orderId, orderStatus: 'PAID', amount: prior.amount, status: 'SUCCESS' } };
      }
      // Step 3.
      if (!['PENDING', 'PAYMENT_FAILED'].includes(order.status)) throw new ConflictException({ code: 'ORDER_NOT_PAYABLE', message: 'Đơn không thể thanh toán' });
      // Step 5: at most one PENDING payment per order (BR-10).
      const pending = await tx.payment.findFirst({ where: { orderId, status: 'PENDING' } });
      if (pending) {
        if (isExpired(pending, new Date())) return null;
        if (pending.method !== paymentMethod) throw inProgress();
        return { replay: true, body: { paymentId: pending.id, orderId, orderStatus: 'PENDING', amount: pending.amount, status: 'PENDING', paymentUrl: pending.paymentUrl, expiresAt: pending.expiresAt?.toISOString() ?? null } };
      }
      // Steps 6-7: the payment id is the vnp_TxnRef, so the row is created first. Any error below rolls it back,
      // so a missing configuration leaves no Payment and no change to the order.
      const payment = await tx.payment.create({ data: { orderId, userId: user.sub, method: paymentMethod, status: 'PENDING', amount: order.total, idempotencyKey: key, fingerprint: input.fingerprint } });
      const url = this.gateway.createUrl({ paymentId: payment.id, orderId, amount: order.total, method: paymentMethod, ipAddr: input.ipAddr });
      if (!url.ok) throw providerError();
      await tx.payment.update({ where: { id: payment.id }, data: { paymentUrl: url.paymentUrl, gatewayCreateDate: url.gatewayCreateDate, expiresAt: url.expiresAt } });
      if (order.status === 'PAYMENT_FAILED') await tx.order.update({ where: { id: orderId }, data: { status: 'PENDING' } });
      return { replay: false, body: { paymentId: payment.id, orderId, orderStatus: 'PENDING', amount: order.total, status: 'PENDING', paymentUrl: url.paymentUrl, expiresAt: url.expiresAt.toISOString() } };
    }, transactionOptions);
  }
  // POST /payments/:id/sync: permission checks first, then QueryDR only while the payment is still PENDING.
  async sync(user: Identity, paymentId: string) {
    this.customer(user);
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new NotFoundException({ code: 'PAYMENT_NOT_FOUND', message: 'Không tìm thấy giao dịch thanh toán' });
    if (payment.userId !== user.sub) throw new ForbiddenException();
    await this.owned(this.prisma, payment.orderId, user);
    if (payment.status === 'PENDING') await this.settleByQuery(payment.id);
    const current = await this.prisma.payment.findUniqueOrThrow({ where: { id: paymentId }, select: { id: true, orderId: true, status: true, order: { select: { status: true } } } });
    return { paymentId: current.id, orderId: current.orderId, orderStatus: current.order.status, status: current.status };
  }
  // Plan 1.6: settle the PENDING payment of an order if it is past expiresAt. Throws while it is still undecided.
  async resolveExpired(orderId: string) {
    const pending = await this.prisma.payment.findFirst({ where: { orderId, status: 'PENDING' } });
    if (pending && isExpired(pending, new Date())) await this.settleByQuery(pending.id);
  }
  // Asks VNPay about one PENDING payment (HTTP, no transaction), then applies the answer under the order lock.
  // Returns once the payment is no longer PENDING; throws 409 while undecided and 502 when VNPay cannot be trusted.
  // D6: 15 minutes after expiresAt a payment without a usable answer is closed as FAILED "EXPIRED" instead of staying PENDING.
  private async settleByQuery(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment || payment.status !== 'PENDING') return;
    const queriedAt = new Date();
    const pastGrace = isPastGrace(payment.expiresAt, queriedAt);
    const answer = await this.gateway.query({ paymentId, orderId: payment.orderId, amount: payment.amount, gatewayCreateDate: payment.gatewayCreateDate, now: queriedAt });
    if (!answer.ok) {
      // The response code of an UNSIGNED answer is unverified (exactly 2 digits): it is only logged, never used to decide.
      const code = answer.reason === 'UNSIGNED' && answer.responseCode ? ` vnp_ResponseCode=${answer.responseCode}` : '';
      this.logger.warn(`VNPAY_QUERYDR_FAILED vnp_TxnRef=${paymentId} reason=${answer.reason}${code}`);
    }
    const verdict = await this.prisma.$transaction(async (tx): Promise<QueryVerdict> => {
      await tx.$queryRaw`SELECT id FROM orders WHERE id = ${payment.orderId} FOR UPDATE`;
      // Read the payment again: an IPN may have settled it while we waited for VNPay.
      const stillPending = (await tx.payment.findUniqueOrThrow({ where: { id: paymentId }, select: { status: true } })).status === 'PENDING';
      if (!answer.ok) {
        // No verified answer: unansweredQueryAction gives only PROVIDER_ERROR or EXPIRED.
        const unanswered = unansweredQueryAction(answer.reason, pastGrace);
        if (unanswered.kind === 'PROVIDER_ERROR') {
          if (unanswered.reconcile) this.logger.warn(`PAYMENT_RECONCILIATION_REQUIRED vnp_TxnRef=${paymentId} reason=${answer.reason}`);
          return stillPending ? 'PROVIDER_ERROR' : 'DONE';
        }
        const closed = await this.applyGatewayResult(tx, paymentId, EXPIRED_RESULT);
        if (closed) this.expiredUnconfirmed(paymentId, answer);
        return 'DONE';
      }
      const action = queryDrAction(answer.responseCode, answer.transactionStatus, isExpired(payment, queriedAt), pastGrace);
      if (action.kind === 'PROVIDER_ERROR') {
        if (action.reconcile) this.reconciliationRequired(paymentId, answer.responseCode, answer.transactionStatus);
        return stillPending ? 'PROVIDER_ERROR' : 'DONE';
      }
      if (action.kind === 'IN_PROGRESS') return stillPending ? 'IN_PROGRESS' : 'DONE';
      if (action.kind === 'EXPIRED') {
        const closed = await this.applyGatewayResult(tx, paymentId, EXPIRED_RESULT);
        // A verified 91 is VNPay saying it never saw the payment, so it needs no warning. Every other close had no clear answer.
        if (closed && answer.responseCode !== '91') this.expiredUnconfirmed(paymentId, answer);
        return 'DONE';
      }
      await this.applyGatewayResult(tx, paymentId, {
        outcome: action.kind, responseCode: answer.responseCode, transactionStatus: answer.transactionStatus, transactionNo: answer.transactionNo, bankCode: answer.bankCode, paidAt: answer.payDate,
      });
      return 'DONE';
    }, transactionOptions);
    if (verdict === 'IN_PROGRESS') throw inProgress();
    if (verdict === 'PROVIDER_ERROR') throw providerError();
  }
  // Plan 1.3 steps 4-6, shared by IPN and QueryDR. The caller holds the order lock inside tx.
  // Returns true when this call changed the payment, false when it was already final (nothing is overwritten).
  private async applyGatewayResult(tx: Prisma.TransactionClient, paymentId: string, result: GatewayResult) {
    const payment = await tx.payment.findUniqueOrThrow({ where: { id: paymentId }, include: { order: true } });
    if (payment.status !== 'PENDING' || payment.order.status !== 'PENDING') {
      // Money arrived after the payment failed or the order was closed: a person has to refund it. A repeat of our own SUCCESS is not a warning.
      if (result.outcome === 'SUCCESS' && payment.status !== 'SUCCESS') this.reconciliationRequired(paymentId, result.responseCode, result.transactionStatus);
      return false;
    }
    const success = result.outcome === 'SUCCESS';
    await tx.payment.update({ where: { id: paymentId }, data: { status: result.outcome, gatewayResponseCode: result.responseCode, gatewayTransactionStatus: result.transactionStatus, gatewayTxnNo: result.transactionNo, bankCode: result.bankCode, paidAt: success ? result.paidAt : null } });
    // Orders created before the inventory snapshot have nothing to settle.
    if (success && payment.order.inventoryTracked) await this.inventory.settle(tx, payment.orderId, true);
    await tx.order.update({ where: { id: payment.orderId }, data: { status: success ? 'PAID' : 'PAYMENT_FAILED' } });
    return true;
  }
  // GET /payments/vnpay/ipn (plan 1.3). Always answers with an RspCode; an unexpected error is 99 so that VNPay calls again.
  async ipn(query: Record<string, unknown>) {
    let details = '';
    try {
      const config = readVnpayConfig();
      // Step 0: without the secret the signature cannot be checked, so answer 99 (not 97) and touch no data.
      if (!canVerify(config)) return this.ipnReply('99');
      // Step 1.
      if (!verifyReturn(query, config.hashSecret, config.tmnCode)) return this.ipnReply('97');
      // From here on the vnp_* values are signed by VNPay, so they are safe to log.
      const txnRef = text(query.vnp_TxnRef) ?? '';
      const responseCode = text(query.vnp_ResponseCode) ?? '';
      const transactionStatus = text(query.vnp_TransactionStatus) ?? '';
      details = ` vnp_TxnRef=${txnRef} vnp_ResponseCode=${responseCode} vnp_TransactionStatus=${transactionStatus}`;
      // Steps 2-3.
      const payment = txnRef ? await this.prisma.payment.findUnique({ where: { id: txnRef } }) : null;
      if (!payment) return this.ipnReply('01', details);
      if (query.vnp_Amount !== String(payment.amount * 100)) return this.ipnReply('04', details);
      // Steps 4-7.
      const code = await this.prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM orders WHERE id = ${payment.orderId} FOR UPDATE`;
        const action = ipnAction(responseCode, transactionStatus);
        if (action.kind === 'UNRESOLVED') {
          if (action.reconcile) this.reconciliationRequired(payment.id, responseCode, transactionStatus);
          // Already final: 02 stops the retries. Still open: change nothing and answer 99 so VNPay calls again.
          const current = await tx.payment.findUniqueOrThrow({ where: { id: payment.id }, include: { order: true } });
          return current.status === 'PENDING' && current.order.status === 'PENDING' ? '99' : '02';
        }
        const applied = await this.applyGatewayResult(tx, payment.id, {
          outcome: action.kind, responseCode, transactionStatus, transactionNo: text(query.vnp_TransactionNo), bankCode: text(query.vnp_BankCode),
          paidAt: parseVnDate(text(query.vnp_PayDate) ?? ''),
        });
        return applied ? '00' : '02';
      }, transactionOptions);
      return this.ipnReply(code, details);
    } catch {
      this.logger.error(`VNPAY_IPN_UNEXPECTED_ERROR${details}`);
      return this.ipnReply('99', details);
    }
  }
  // GET /payments/vnpay/return: checks the signature and the merchant, writes nothing.
  async checkReturn(query: Record<string, unknown>) {
    const config = readVnpayConfig();
    if (!canVerify(config) || !verifyReturn(query, config.hashSecret, config.tmnCode)) return { valid: false };
    const txnRef = text(query.vnp_TxnRef);
    const payment = txnRef ? await this.prisma.payment.findUnique({ where: { id: txnRef }, select: { id: true, orderId: true } }) : null;
    if (!payment) return { valid: false };
    return { valid: true, paymentId: payment.id, orderId: payment.orderId, responseCode: text(query.vnp_ResponseCode) };
  }
  private ipnReply(code: string, details = '') {
    this.logger.log(`VNPAY_IPN RspCode=${code}${details}`);
    return { RspCode: code, Message: IPN_MESSAGES[code] };
  }
  // Staff look the payment up by vnp_TxnRef in the VNPay Merchant Admin and refund by hand.
  private reconciliationRequired(paymentId: string, responseCode: string, transactionStatus: string | null) {
    this.logger.warn(`PAYMENT_RECONCILIATION_REQUIRED vnp_TxnRef=${paymentId} vnp_ResponseCode=${responseCode} vnp_TransactionStatus=${transactionStatus ?? ''}`);
  }
  // D6: a payment closed with no clear answer from VNPay. The detail is the verified codes, or the reason code of the failed call.
  private expiredUnconfirmed(paymentId: string, answer: QueryResult) {
    const detail = answer.ok ? `vnp_ResponseCode=${answer.responseCode} vnp_TransactionStatus=${answer.transactionStatus}` : `reason=${answer.reason}`;
    this.logger.warn(`PAYMENT_EXPIRED_UNCONFIRMED vnp_TxnRef=${paymentId} ${detail}`);
  }
}

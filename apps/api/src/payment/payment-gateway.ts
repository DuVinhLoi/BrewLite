import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { PaymentMethod } from '@prisma/client';
import { buildPaymentUrl, buildQueryDr, formatVnDate, parseVnDate, type QueryDrFailure, verifyQueryDrResponse } from './vnpay';
import { canCreateUrl, canVerify, readVnpayConfig } from './vnpay-config';

const PAYMENT_TTL_MS = 15 * 60 * 1000;
const QUERY_TIMEOUT_MS = 10_000;
// vnp_IpAddr of QueryDR is the server calling the API (plan 1.2); the spike records the value VNPay accepts.
const QUERY_IP_ADDR = '127.0.0.1';

const orderInfo = (orderId: string) => `Thanh toan don ${orderId}`;

export type CreateUrlInput = { paymentId: string; orderId: string; amount: number; method: PaymentMethod; ipAddr: string; now?: Date };
export type CreateUrlResult =
  | { ok: true; paymentUrl: string; gatewayCreateDate: string; expiresAt: Date }
  | { ok: false; reason: 'NOT_CONFIGURED' };

export type QueryInput = { paymentId: string; orderId: string; amount: number; gatewayCreateDate: string | null; now?: Date };
export type QueryResult =
  | { ok: true; responseCode: string; transactionStatus: string; transactionNo: string | null; bankCode: string | null; payDate: Date | null }
  | { ok: false; reason: 'NOT_CONFIGURED' | 'MISSING_CREATE_DATE' | 'TIMEOUT' | 'NETWORK' | QueryDrFailure };

// Talks to VNPay. The signing itself lives in vnpay.ts; this class adds the configuration and the HTTP call.
@Injectable()
export class VnpayGateway {
  createUrl(input: CreateUrlInput): CreateUrlResult {
    const config = readVnpayConfig();
    if (!canCreateUrl(config)) return { ok: false, reason: 'NOT_CONFIGURED' };
    // Whole seconds only, so expiresAt is the same instant as the signed vnp_ExpireDate.
    const created = new Date(Math.floor((input.now ?? new Date()).getTime() / 1000) * 1000);
    const expiresAt = new Date(created.getTime() + PAYMENT_TTL_MS);
    const gatewayCreateDate = formatVnDate(created);
    const paymentUrl = buildPaymentUrl({
      vnpUrl: config.vnpUrl, tmnCode: config.tmnCode, secret: config.hashSecret, txnRef: input.paymentId, amountVnd: input.amount,
      orderInfo: orderInfo(input.orderId), returnUrl: `${config.webUrl.replace(/\/+$/, '')}/payment/vnpay-return`, ipAddr: input.ipAddr,
      createDate: gatewayCreateDate, expireDate: formatVnDate(expiresAt),
      // D2: CARD opens the domestic bank page; WALLET lets the customer choose on VNPay.
      bankCode: input.method === 'CARD' ? 'VNBANK' : undefined,
    });
    return { ok: true, paymentUrl, gatewayCreateDate, expiresAt };
  }

  // Every failure comes back as { ok: false, reason }; nothing is thrown and nothing is collapsed into a boolean.
  async query(input: QueryInput): Promise<QueryResult> {
    const config = readVnpayConfig();
    if (!canVerify(config)) return { ok: false, reason: 'NOT_CONFIGURED' };
    if (!input.gatewayCreateDate) return { ok: false, reason: 'MISSING_CREATE_DATE' };
    const request = buildQueryDr({
      tmnCode: config.tmnCode, secret: config.hashSecret, requestId: randomUUID().replaceAll('-', ''), txnRef: input.paymentId,
      transactionDate: input.gatewayCreateDate, createDate: formatVnDate(input.now ?? new Date()), ipAddr: QUERY_IP_ADDR,
      orderInfo: orderInfo(input.orderId),
    });
    let body: unknown;
    try {
      const response = await fetch(config.apiUrl, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request), signal: AbortSignal.timeout(QUERY_TIMEOUT_MS),
      });
      if (!response.ok) return { ok: false, reason: 'BAD_RESPONSE' };
      body = await response.json();
    } catch (error) {
      if (error instanceof SyntaxError) return { ok: false, reason: 'BAD_RESPONSE' };
      return { ok: false, reason: error instanceof Error && error.name === 'TimeoutError' ? 'TIMEOUT' : 'NETWORK' };
    }
    const verified = verifyQueryDrResponse(body, { secret: config.hashSecret, tmnCode: config.tmnCode, txnRef: input.paymentId, amountVnd: input.amount });
    if (!verified.ok) return { ok: false, reason: verified.reason };
    const { fields } = verified;
    return {
      ok: true, responseCode: fields.vnp_ResponseCode, transactionStatus: fields.vnp_TransactionStatus,
      transactionNo: fields.vnp_TransactionNo || null, bankCode: fields.vnp_BankCode || null, payDate: parseVnDate(fields.vnp_PayDate),
    };
  }
}

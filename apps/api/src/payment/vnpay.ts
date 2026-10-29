import { createHmac, timingSafeEqual } from 'node:crypto';

// Pure VNPay helpers (plan 1.1-1.3, 1.6): no Nest, no database, no network.
// Signing rules: HMAC-SHA512 with the VNPay secret used as a UTF-8 string, hex output.

const VN_OFFSET_MS = 7 * 60 * 60 * 1000;
const SHA512_HEX = /^[0-9a-fA-F]{128}$/;

const QUERYDR_REQUEST_FIELDS = [
  'vnp_RequestId', 'vnp_Version', 'vnp_Command', 'vnp_TmnCode', 'vnp_TxnRef', 'vnp_TransactionDate', 'vnp_CreateDate', 'vnp_IpAddr', 'vnp_OrderInfo',
] as const;
const QUERYDR_RESPONSE_FIELDS = [
  'vnp_ResponseId', 'vnp_Command', 'vnp_ResponseCode', 'vnp_Message', 'vnp_TmnCode', 'vnp_TxnRef', 'vnp_Amount', 'vnp_BankCode', 'vnp_PayDate',
  'vnp_TransactionNo', 'vnp_TransactionType', 'vnp_TransactionStatus', 'vnp_OrderInfo', 'vnp_PromotionCode', 'vnp_PromotionAmount',
] as const;

export type QueryDrFields = Record<(typeof QUERYDR_RESPONSE_FIELDS)[number], string>;
export type QueryDrFailure = 'BAD_RESPONSE' | 'BAD_SIGNATURE' | 'MISMATCH';

const sign = (secret: string, data: string) => createHmac('sha512', secret).update(data, 'utf8').digest('hex');

// Date format yyyyMMddHHmmss in GMT+7, whatever the server time zone is (Render runs UTC).
export function formatVnDate(date: Date) {
  return new Date(date.getTime() + VN_OFFSET_MS).toISOString().slice(0, 19).replace(/[-T:]/g, '');
}

export function parseVnDate(value: string) {
  const match = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/.exec(value);
  if (!match) return null;
  const [year, month, day, hour, minute, second] = match.slice(1).map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second) - VN_OFFSET_MS);
  // Impossible dates (month 13, 31 February) roll over, so they no longer format back to the input.
  return formatVnDate(date) === value ? date : null;
}

// Signed string of a payment URL, IPN or return: vnp_* params sorted by name, without the hash fields.
// URLSearchParams encodes a space as '+' like the VNPay samples; encodeURIComponent would give %20.
function signedQuery(params: Record<string, string>) {
  const names = Object.keys(params).filter((name) => name.startsWith('vnp_') && name !== 'vnp_SecureHash' && name !== 'vnp_SecureHashType').sort();
  return new URLSearchParams(names.map((name) => [name, params[name]])).toString();
}

// The length check comes first because timingSafeEqual throws on buffers of different length.
function sameSignature(received: string, expected: string) {
  return SHA512_HEX.test(received) && timingSafeEqual(Buffer.from(received, 'hex'), Buffer.from(expected, 'hex'));
}

export function buildPaymentUrl(input: {
  vnpUrl: string; tmnCode: string; secret: string; txnRef: string; amountVnd: number; orderInfo: string;
  returnUrl: string; ipAddr: string; createDate: string; expireDate: string; bankCode?: string;
}) {
  const params: Record<string, string> = {
    vnp_Version: '2.1.0', vnp_Command: 'pay', vnp_TmnCode: input.tmnCode, vnp_Amount: String(input.amountVnd * 100), vnp_CurrCode: 'VND',
    vnp_TxnRef: input.txnRef, vnp_OrderInfo: input.orderInfo, vnp_OrderType: 'other', vnp_Locale: 'vn', vnp_ReturnUrl: input.returnUrl,
    vnp_IpAddr: input.ipAddr, vnp_CreateDate: input.createDate, vnp_ExpireDate: input.expireDate,
  };
  if (input.bankCode) params.vnp_BankCode = input.bankCode;
  const query = signedQuery(params);
  return `${input.vnpUrl}?${query}&${new URLSearchParams({ vnp_SecureHash: sign(input.secret, query) })}`;
}

// Used for both the IPN and the return URL. Never throws: a bad, missing or non-string value is just "false".
export function verifyReturn(params: Record<string, unknown>, secret: string, tmnCode: string) {
  const received = params.vnp_SecureHash;
  if (typeof received !== 'string' || params.vnp_TmnCode !== tmnCode) return false;
  const vnp: Record<string, string> = {};
  for (const [name, value] of Object.entries(params)) {
    if (!name.startsWith('vnp_')) continue;
    if (typeof value !== 'string') return false;
    vnp[name] = value;
  }
  return sameSignature(received, sign(secret, signedQuery(vnp)));
}

// QueryDR signs raw values (no URL-encoding) joined with '|'; an absent optional field is an empty string.
const joinFields = (names: readonly string[], values: Record<string, string>) => names.map((name) => values[name] ?? '').join('|');

export function buildQueryDr(input: {
  tmnCode: string; secret: string; requestId: string; txnRef: string; transactionDate: string; createDate: string; ipAddr: string; orderInfo: string;
}) {
  const body: Record<string, string> = {
    vnp_RequestId: input.requestId, vnp_Version: '2.1.0', vnp_Command: 'querydr', vnp_TmnCode: input.tmnCode, vnp_TxnRef: input.txnRef,
    vnp_OrderInfo: input.orderInfo, vnp_TransactionDate: input.transactionDate, vnp_CreateDate: input.createDate, vnp_IpAddr: input.ipAddr,
  };
  return { ...body, vnp_SecureHash: sign(input.secret, joinFields(QUERYDR_REQUEST_FIELDS, body)) };
}

// Checks signature, then merchant and reference of the request. A 00 response also needs the amount (Payment.amount * 100) and type 01.
export function verifyQueryDrResponse(body: unknown, expected: { secret: string; tmnCode: string; txnRef: string; amountVnd: number }):
  { ok: true; fields: QueryDrFields } | { ok: false; reason: QueryDrFailure } {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return { ok: false, reason: 'BAD_RESPONSE' };
  const raw = body as Record<string, unknown>;
  const fields = {} as QueryDrFields;
  for (const name of QUERYDR_RESPONSE_FIELDS) {
    const value = raw[name];
    fields[name] = typeof value === 'string' || typeof value === 'number' ? String(value) : '';
  }
  const received = raw.vnp_SecureHash;
  if (typeof received !== 'string' || !sameSignature(received, sign(expected.secret, joinFields(QUERYDR_RESPONSE_FIELDS, fields)))) {
    return { ok: false, reason: 'BAD_SIGNATURE' };
  }
  if (fields.vnp_TmnCode !== expected.tmnCode || fields.vnp_TxnRef !== expected.txnRef) return { ok: false, reason: 'MISMATCH' };
  if (fields.vnp_ResponseCode === '00' && (fields.vnp_Amount !== String(expected.amountVnd * 100) || fields.vnp_TransactionType !== '01')) {
    return { ok: false, reason: 'MISMATCH' };
  }
  return { ok: true, fields };
}

// Transaction statuses for reversal, refund or suspected fraud: money may have moved, so a human must look.
const SUSPECT_STATUSES = ['04', '05', '06', '07', '09'];

export type QueryDrAction =
  | { kind: 'SUCCESS' }
  | { kind: 'IN_PROGRESS' }
  | { kind: 'FAILED' }
  | { kind: 'EXPIRED' }
  | { kind: 'PROVIDER_ERROR'; reconcile: boolean };

// Plan table 1.6 for a verified QueryDR response. vnp_ResponseCode is the answer to the query,
// vnp_TransactionStatus is the state of the payment itself.
export function queryDrAction(responseCode: string, transactionStatus: string, expired: boolean): QueryDrAction {
  if (responseCode === '91') {
    // pending spike: 91 after expiry -> FAILED with gatewayResponseCode "EXPIRED"; before expiry the payment stays PENDING.
    return expired ? { kind: 'EXPIRED' } : { kind: 'IN_PROGRESS' };
  }
  if (responseCode !== '00') return { kind: 'PROVIDER_ERROR', reconcile: false };
  if (transactionStatus === '00') return { kind: 'SUCCESS' };
  // pending spike: 00/01 after expiry stays IN_PROGRESS (the caller must still guarantee an exit for abandoned payments).
  if (transactionStatus === '01') return { kind: 'IN_PROGRESS' };
  if (transactionStatus === '02') return { kind: 'FAILED' };
  return { kind: 'PROVIDER_ERROR', reconcile: SUSPECT_STATUSES.includes(transactionStatus) };
}

export type IpnAction = { kind: 'SUCCESS' } | { kind: 'FAILED' } | { kind: 'UNRESOLVED'; reconcile: boolean };

// Plan 1.3 steps 5-7 for a verified IPN. UNRESOLVED means: change nothing and answer 99 so VNPay calls again.
// reconcile = some code hints that money was taken, so log PAYMENT_RECONCILIATION_REQUIRED.
export function ipnAction(responseCode: string, transactionStatus: string): IpnAction {
  if (responseCode === '00' && transactionStatus === '00') return { kind: 'SUCCESS' };
  // pending spike: IPN failure rule - status 02 with a response code other than 00/07 (includes the customer cancelling, 24).
  if (transactionStatus === '02' && responseCode !== '00' && responseCode !== '07') return { kind: 'FAILED' };
  const hintsAtDebit = SUSPECT_STATUSES.includes(transactionStatus) || transactionStatus === '00' || responseCode === '00' || responseCode === '07';
  return { kind: 'UNRESOLVED', reconcile: hintsAtDebit };
}

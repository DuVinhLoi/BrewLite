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
export type QueryDrFailure = 'BAD_RESPONSE' | 'BAD_SIGNATURE' | 'MISMATCH' | 'UNSIGNED';
// Every way a QueryDR call can end without a verified answer (used by the gateway result and unansweredQueryAction).
export type QueryFailureReason = 'NOT_CONFIGURED' | 'MISSING_CREATE_DATE' | 'TIMEOUT' | 'NETWORK' | QueryDrFailure;

/** Tính chữ ký HMAC-SHA512 dạng hex cho dữ liệu bằng khóa bí mật VNPay. */
const sign = (secret: string, data: string) => createHmac('sha512', secret).update(data, 'utf8').digest('hex');

// Date format yyyyMMddHHmmss in GMT+7, whatever the server time zone is (Render runs UTC).
/** Định dạng thời điểm theo giờ Việt Nam thành chuỗi yyyyMMddHHmmss mà VNPay yêu cầu. */
export function formatVnDate(date: Date) {
  return new Date(date.getTime() + VN_OFFSET_MS).toISOString().slice(0, 19).replace(/[-T:]/g, '');
}

/** Chuyển chuỗi ngày giờ VNPay về Date; trả null nếu định dạng hoặc ngày thực tế không hợp lệ. */
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
/** Sắp xếp và mã hóa các tham số vnp_ thành chuỗi dùng để ký, bỏ qua các trường chữ ký. */
function signedQuery(params: Record<string, string>) {
  const names = Object.keys(params).filter((name) => name.startsWith('vnp_') && name !== 'vnp_SecureHash' && name !== 'vnp_SecureHashType').sort();
  return new URLSearchParams(names.map((name) => [name, params[name]])).toString();
}

// The length check comes first because timingSafeEqual throws on buffers of different length.
/** Kiểm tra định dạng chữ ký và so sánh bằng timingSafeEqual để hạn chế lộ thông tin qua thời gian xử lý. */
function sameSignature(received: string, expected: string) {
  return SHA512_HEX.test(received) && timingSafeEqual(Buffer.from(received, 'hex'), Buffer.from(expected, 'hex'));
}

/** Tạo URL thanh toán có chữ ký, quy đổi số tiền VND sang đơn vị nhân 100 theo VNPay. */
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
/** Kiểm tra mã đơn vị và chữ ký dữ liệu IPN hoặc return; trả false nếu dữ liệu không hợp lệ. */
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
/** Ghép giá trị theo thứ tự trường bằng dấu | để tạo chuỗi ký cho QueryDR. */
const joinFields = (names: readonly string[], values: Record<string, string>) => names.map((name) => values[name] ?? '').join('|');

/** Tạo nội dung yêu cầu tra cứu giao dịch QueryDR kèm chữ ký HMAC-SHA512. */
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
// A signed error answer can carry empty fields and only 00 leads to SUCCESS, so a wrong or empty merchant or reference is
// MISMATCH (never closed) for 00 only; for any other code, 91 included, it is BAD_RESPONSE, which the grace can still close.
// UNSIGNED (spike 2026-10-30: the sandbox answers 99 with no vnp_SecureHash) carries the response code for the log only:
// it is the code of an unverified body, so it is kept only when it is exactly 2 digits and is never used to decide anything.
/** Xác thực chữ ký và đối chiếu đơn vị, mã giao dịch, số tiền, loại giao dịch trong phản hồi QueryDR. */
export function verifyQueryDrResponse(body: unknown, expected: { secret: string; tmnCode: string; txnRef: string; amountVnd: number }):
  { ok: true; fields: QueryDrFields } | { ok: false; reason: QueryDrFailure; responseCode?: string | null } {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return { ok: false, reason: 'BAD_RESPONSE' };
  const raw = body as Record<string, unknown>;
  const fields = {} as QueryDrFields;
  for (const name of QUERYDR_RESPONSE_FIELDS) {
    const value = raw[name];
    fields[name] = typeof value === 'string' || typeof value === 'number' ? String(value) : '';
  }
  const received = raw.vnp_SecureHash;
  if (received === undefined) return { ok: false, reason: 'UNSIGNED', responseCode: /^\d{2}$/.test(fields.vnp_ResponseCode) ? fields.vnp_ResponseCode : null };
  if (typeof received !== 'string' || !sameSignature(received, sign(expected.secret, joinFields(QUERYDR_RESPONSE_FIELDS, fields)))) {
    return { ok: false, reason: 'BAD_SIGNATURE' };
  }
  const isSuccessCode = fields.vnp_ResponseCode === '00';
  if (fields.vnp_TmnCode !== expected.tmnCode || fields.vnp_TxnRef !== expected.txnRef) {
    return { ok: false, reason: isSuccessCode ? 'MISMATCH' : 'BAD_RESPONSE' };
  }
  if (isSuccessCode && (fields.vnp_Amount !== String(expected.amountVnd * 100) || fields.vnp_TransactionType !== '01')) {
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

// D6: a PENDING payment is closed (FAILED, "EXPIRED") when VNPay gave no usable answer 15 minutes after expiresAt.
export const EXPIRY_GRACE_MS = 15 * 60 * 1000;

// now >= expiresAt + 15 minutes. A payment without expiresAt never leaves its grace.
/** Kiểm tra đã qua thời điểm hết hạn thanh toán cộng thêm 15 phút chờ xác minh hay chưa. */
export function isPastGrace(expiresAt: Date | null, now: Date) {
  return expiresAt !== null && now.getTime() >= expiresAt.getTime() + EXPIRY_GRACE_MS;
}

// Plan table 1.6 and D6 for a verified QueryDR response. vnp_ResponseCode is the answer to the query,
// vnp_TransactionStatus is the state of the payment itself. "expired" is now >= expiresAt, "pastGrace" is isPastGrace.
/** Chuyển mã phản hồi và trạng thái QueryDR thành quyết định xử lý theo thời hạn giao dịch. */
export function queryDrAction(responseCode: string, transactionStatus: string, expired: boolean, pastGrace: boolean): QueryDrAction {
  if (responseCode === '91') {
    // Spike 2026-10-30 never saw 91 (the sandbox QueryDR answers 99 unsigned); 91 after expiry still closes the payment, before it stays PENDING.
    return expired ? { kind: 'EXPIRED' } : { kind: 'IN_PROGRESS' };
  }
  if (responseCode === '00') {
    if (transactionStatus === '00') return { kind: 'SUCCESS' };
    if (transactionStatus === '02') return { kind: 'FAILED' };
    // Money may have moved: a human must look, so even the grace never closes these.
    if (SUSPECT_STATUSES.includes(transactionStatus)) return { kind: 'PROVIDER_ERROR', reconcile: true };
    // D6: 00/01 (the customer may still be paying) stays open until the grace ends.
    if (transactionStatus === '01') return pastGrace ? { kind: 'EXPIRED' } : { kind: 'IN_PROGRESS' };
  }
  // A missing or unsupported status, or any other query code (02, 03, 94, 97, 99...): close after the grace (D6).
  return pastGrace ? { kind: 'EXPIRED' } : { kind: 'PROVIDER_ERROR', reconcile: false };
}

// D6 for a QueryDR call with no verified answer. MISMATCH is a signed 00 answer about another merchant, reference, amount or type:
// a human must look, so it is never closed. Every other reason closes the payment once the grace has ended.
// Without a verified answer there is no SUCCESS, FAILED or IN_PROGRESS, hence the narrower return type.
/** Quyết định đóng giao dịch hết hạn hoặc báo lỗi khi QueryDR không có phản hồi xác thực dùng được. */
export function unansweredQueryAction(reason: QueryFailureReason, pastGrace: boolean): Extract<QueryDrAction, { kind: 'EXPIRED' | 'PROVIDER_ERROR' }> {
  if (reason === 'MISMATCH') return { kind: 'PROVIDER_ERROR', reconcile: true };
  return pastGrace ? { kind: 'EXPIRED' } : { kind: 'PROVIDER_ERROR', reconcile: false };
}

export type IpnAction = { kind: 'SUCCESS' } | { kind: 'FAILED' } | { kind: 'UNRESOLVED'; reconcile: boolean };

// Plan 1.3 steps 5-7 for a verified IPN. UNRESOLVED means: change nothing and answer 99 so VNPay calls again.
// reconcile = some code hints that money was taken, so log PAYMENT_RECONCILIATION_REQUIRED.
/** Phân loại IPN đã xác thực thành thành công, thất bại hoặc chưa rõ kết quả cần kiểm tra thêm. */
export function ipnAction(responseCode: string, transactionStatus: string): IpnAction {
  if (responseCode === '00' && transactionStatus === '00') return { kind: 'SUCCESS' };
  // Spike 2026-10-30: the customer cancelling (24/02) and expiry at the OTP step (15/02) both arrive as status 02 with a response code other than 00/07.
  if (transactionStatus === '02' && responseCode !== '00' && responseCode !== '07') return { kind: 'FAILED' };
  const hintsAtDebit = SUSPECT_STATUSES.includes(transactionStatus) || transactionStatus === '00' || responseCode === '00' || responseCode === '07';
  return { kind: 'UNRESOLVED', reconcile: hintsAtDebit };
}

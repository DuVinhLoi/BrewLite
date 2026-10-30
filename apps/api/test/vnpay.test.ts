// Unit tests for the VNPay helpers (plan D3). Run from apps/api:
//   node --import tsx --test test/vnpay.test.ts
// No database, no network (fetch is stubbed), fake secret and fake merchant code only.
//
// Expected signatures were computed independently of the code under test:
//   printf '%s' '<string to sign>' | openssl dgst -sha512 -hmac 'FAKE_SECRET_FOR_UNIT_TESTS'
// Each "string to sign" below is the exact input given to that command.
import assert from 'node:assert/strict';
import { afterEach, describe, it, mock } from 'node:test';
import { VnpayGateway } from '../src/payment/payment-gateway';
import {
  assertPaymentProvider,
  canCreateUrl,
  canVerify,
  missingVnpayVars,
  readVnpayConfig,
} from '../src/payment/vnpay-config';
import {
  buildPaymentUrl,
  buildQueryDr,
  EXPIRY_GRACE_MS,
  formatVnDate,
  ipnAction,
  isPastGrace,
  parseVnDate,
  queryDrAction,
  unansweredQueryAction,
  verifyQueryDrResponse,
  verifyReturn,
} from '../src/payment/vnpay';

const SECRET = 'FAKE_SECRET_FOR_UNIT_TESTS';
const TMN = 'FAKETMN1';
const SANDBOX_URL = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';

// Payment URL: params sorted by name, values URL-encoded with space as '+'.
const URL_SIGNED =
  'vnp_Amount=1000000&vnp_BankCode=VNBANK&vnp_Command=pay&vnp_CreateDate=20261029100000&vnp_CurrCode=VND' +
  '&vnp_ExpireDate=20261029101500&vnp_IpAddr=127.0.0.1&vnp_Locale=vn&vnp_OrderInfo=Thanh+toan+don+ORDER1' +
  '&vnp_OrderType=other&vnp_ReturnUrl=http%3A%2F%2Flocalhost%3A3000%2Fpayment%2Fvnpay-return' +
  '&vnp_TmnCode=FAKETMN1&vnp_TxnRef=PAYMENT1&vnp_Version=2.1.0';
const URL_HASH =
  'e693c1c1f77f2a85c88bb47dfba386c1e2f5f93c56f9427a2b5ef49383dcb45a795789c6696388dcca9da7dc11336e052757015ae7d83308c0fec06ce027651e';

// IPN / return: same rules; the space in vnp_OrderInfo is the encoding trap. String given to openssl:
//   vnp_Amount=1000000&vnp_BankCode=NCB&vnp_OrderInfo=Thanh+toan+don+ORDER1&vnp_PayDate=20261029100500
//   &vnp_ResponseCode=00&vnp_TmnCode=FAKETMN1&vnp_TransactionNo=14000001&vnp_TransactionStatus=00&vnp_TxnRef=PAYMENT1
const RETURN_HASH_PLUS =
  '7edea1b2041306ec577bf4d8ddc488d27210cdec8d3e5f3297bc3f8a4cce1c118009297802f676867818c4636d513d280aed17dd2b521c545a2fe216ce0919cb';
// Same string with '%20' for the space (what encodeURIComponent would give): a different signature.
const RETURN_HASH_PERCENT20 =
  '86700abb04005501c191382a8963e4bacf5c35b95dc7e849f6918349aa2b147333b2a7ad9e8f33e598dacff7b3b77cdc14cedd06e1f760da1f435c43d7112efc';
// The same fields as VNPay sends them after the web framework decoded the query.
const returnQuery = (): Record<string, string> => ({
  vnp_Amount: '1000000',
  vnp_BankCode: 'NCB',
  vnp_OrderInfo: 'Thanh toan don ORDER1',
  vnp_PayDate: '20261029100500',
  vnp_ResponseCode: '00',
  vnp_TmnCode: TMN,
  vnp_TransactionNo: '14000001',
  vnp_TransactionStatus: '00',
  vnp_TxnRef: 'PAYMENT1',
});

// QueryDR request: raw values (no URL-encoding) joined with '|'.
//   vnp_RequestId|vnp_Version|vnp_Command|vnp_TmnCode|vnp_TxnRef|vnp_TransactionDate|vnp_CreateDate|vnp_IpAddr|vnp_OrderInfo
// String given to openssl:
//   REQ0001|2.1.0|querydr|FAKETMN1|PAYMENT1|20261029100000|20261029100800|127.0.0.1|Thanh toan don ORDER1
const QUERYDR_REQUEST_HASH =
  'fad54b649bb0ce9ab7cd76e9e378c6f3196db9eb077692bdf923febb2b41a112c19dbd796888d2914172e0d5a5157bd8fe9c0205cf7be22ad28df761781dca32';

// QueryDR response: 15 fields joined with '|', absent optional fields stay empty but keep their '|'.
//   vnp_ResponseId|vnp_Command|vnp_ResponseCode|vnp_Message|vnp_TmnCode|vnp_TxnRef|vnp_Amount|vnp_BankCode|vnp_PayDate
//   |vnp_TransactionNo|vnp_TransactionType|vnp_TransactionStatus|vnp_OrderInfo|vnp_PromotionCode|vnp_PromotionAmount
const queryDrBody = (signed: string, hash: string): Record<string, string> => {
  const names = [
    'vnp_ResponseId', 'vnp_Command', 'vnp_ResponseCode', 'vnp_Message', 'vnp_TmnCode', 'vnp_TxnRef', 'vnp_Amount',
    'vnp_BankCode', 'vnp_PayDate', 'vnp_TransactionNo', 'vnp_TransactionType', 'vnp_TransactionStatus', 'vnp_OrderInfo',
    'vnp_PromotionCode', 'vnp_PromotionAmount',
  ];
  const values = signed.split('|');
  assert.equal(values.length, names.length);
  const body: Record<string, string> = { vnp_SecureHash: hash };
  // Absent fields are omitted from the JSON, as VNPay does for optional fields.
  names.forEach((name, index) => { if (values[index] !== '') body[name] = values[index]; });
  return body;
};
const RESP_SUCCESS = // 00 / 00, amount 10000 VND, trailing optional fields empty
  'RESP0001|querydr|00|QueryDR Success|FAKETMN1|PAYMENT1|1000000|NCB|20261029100500|14000001|01|00|Thanh toan don ORDER1||';
const RESP_SUCCESS_HASH =
  '31e3fb928ce0be5ed8ed83c407f9e3ce0db5930aa8471563a0ecf81d80dcfb8f819374f8095e02867038d42b857613d69463a0aac6b1c153d018704ddb9d675f';
const RESP_NOT_FOUND = // 91, most fields absent
  'RESP0002|querydr|91|Transaction not found|FAKETMN1|PAYMENT1|||||||||';
const RESP_NOT_FOUND_HASH =
  '4ed0ef727416f04e83fa0c2abf6f6eee569d1ddfd5a9070a63909cf09d608b6f4c90f9825505e9bff94078078c733ed90b1ec31b4302355e9316878b757caa7b';
const RESP_WRONG_TYPE = // 00 but vnp_TransactionType = 02
  'RESP0003|querydr|00|QueryDR Success|FAKETMN1|PAYMENT1|1000000|NCB|20261029100500|14000001|02|00|Thanh toan don ORDER1||';
const RESP_WRONG_TYPE_HASH =
  'ccaf1a89493240d8d1639ce64d13b30685f87b5308a8100634947305a4a5b77f29bbc9c487d68590fd07035ec11e42b757126f106453a1e30b5c56bb89b37aef';
// Signed answers whose vnp_TmnCode and vnp_TxnRef are empty (review 2026-10-30: VNPay may sign an error answer like this).
const RESP_ERROR_EMPTY_IDS = // 97, nothing but the code and message
  'RESP0004|querydr|97|Invalid checksum|||||||||||';
const RESP_ERROR_EMPTY_IDS_HASH =
  '0fb0ac21e3270a49ddf35d199195063f6f157b8afad3ec9a977e633278f69c60c092764a81f37adf922cfe6cb0b325d8deab2e87229a125034e625e482e89f76';
const RESP_SUCCESS_EMPTY_IDS = // 00 with the amount and type of RESP_SUCCESS, but no merchant or reference
  'RESP0005|querydr|00|QueryDR Success|||1000000|NCB|20261029100500|14000001|01|00|Thanh toan don ORDER1||';
const RESP_SUCCESS_EMPTY_IDS_HASH =
  'e253ff7f68c67c84e90e706575b76120f616bd4ea53a02783cf7b094c80c7440bf8323a1174220896882d44edaf45b208b5a48a53c207b16461febc0fa1601ed';
// The request formula applied to the response data (slots the response does not have stay empty) gives a
// different signature, so the two formulas must not be mixed. String given to openssl:
//   ||querydr|FAKETMN1|PAYMENT1||||Thanh toan don ORDER1
const RESP_SUCCESS_WITH_REQUEST_FORMULA_HASH =
  'eaac29e23bf999892f8fccac8b884f76d3b2d87bc24e0c834a23a4a2a827d57a3282a1c0971d799c0fe70fe0a6d4993bb019d8d12bc9da6b164596b60842c889';

const expectation = { secret: SECRET, tmnCode: TMN, txnRef: 'PAYMENT1', amountVnd: 10000 };

describe('formatVnDate / parseVnDate (GMT+7)', () => {
  it('formats a UTC instant as Vietnam wall-clock time', () => {
    assert.equal(formatVnDate(new Date('2026-10-29T03:00:00.999Z')), '20261029100000');
  });
  it('rolls into the next day when UTC is 23:30 (server runs in UTC)', () => {
    assert.equal(formatVnDate(new Date('2026-10-29T23:30:00Z')), '20261030063000');
  });
  it('parses a Vietnam wall-clock string back to the right instant', () => {
    assert.equal(parseVnDate('20261030063000')?.toISOString(), '2026-10-29T23:30:00.000Z');
  });
  it('rejects malformed or impossible dates', () => {
    assert.equal(parseVnDate(''), null);
    assert.equal(parseVnDate('2026-10-29'), null);
    assert.equal(parseVnDate('20261329100000'), null);
    assert.equal(parseVnDate('20260231100000'), null);
  });
});

describe('buildPaymentUrl', () => {
  const input = {
    vnpUrl: SANDBOX_URL, tmnCode: TMN, secret: SECRET, txnRef: 'PAYMENT1', amountVnd: 10000,
    orderInfo: 'Thanh toan don ORDER1', returnUrl: 'http://localhost:3000/payment/vnpay-return', ipAddr: '127.0.0.1',
    createDate: '20261029100000', expireDate: '20261029101500', bankCode: 'VNBANK',
  };
  it('sorts params, encodes the space as + and signs with HMAC-SHA512', () => {
    assert.equal(buildPaymentUrl(input), `${SANDBOX_URL}?${URL_SIGNED}&vnp_SecureHash=${URL_HASH}`);
  });
  it('multiplies the amount by 100', () => {
    assert.match(buildPaymentUrl(input), /vnp_Amount=1000000&/);
  });
  it('never encodes a space as %20', () => {
    assert.ok(!buildPaymentUrl(input).includes('%20'));
  });
  it('omits vnp_BankCode when no bank is given', () => {
    assert.ok(!buildPaymentUrl({ ...input, bankCode: undefined }).includes('vnp_BankCode'));
  });
});

describe('verifyReturn (IPN and return URL)', () => {
  const signed = (overrides: Record<string, unknown> = {}) => ({ ...returnQuery(), vnp_SecureHash: RETURN_HASH_PLUS, ...overrides });
  it('accepts a correct signature over decoded values (space encoded as +)', () => {
    assert.equal(verifyReturn(signed(), SECRET, TMN), true);
  });
  it('rejects the signature computed with %20 for the space', () => {
    assert.equal(verifyReturn(signed({ vnp_SecureHash: RETURN_HASH_PERCENT20 }), SECRET, TMN), false);
  });
  it('does not depend on the order the keys arrive in', () => {
    const reversed = Object.fromEntries(Object.entries(signed()).reverse());
    assert.equal(verifyReturn(reversed, SECRET, TMN), true);
  });
  it('ignores vnp_SecureHashType and params without the vnp_ prefix', () => {
    assert.equal(verifyReturn(signed({ vnp_SecureHashType: 'HmacSHA512', utm_source: 'x' }), SECRET, TMN), true);
  });
  it('accepts an upper-case hex signature', () => {
    assert.equal(verifyReturn(signed({ vnp_SecureHash: RETURN_HASH_PLUS.toUpperCase() }), SECRET, TMN), true);
  });
  it('rejects tampered data', () => {
    assert.equal(verifyReturn(signed({ vnp_Amount: '1' }), SECRET, TMN), false);
  });
  it('rejects a wrong secret', () => {
    assert.equal(verifyReturn(signed(), 'OTHER_FAKE_SECRET', TMN), false);
  });
  it('rejects a valid signature for another merchant code', () => {
    assert.equal(verifyReturn(signed(), SECRET, 'OTHERTMN'), false);
  });
  it('rejects a missing signature without throwing', () => {
    assert.equal(verifyReturn(returnQuery(), SECRET, TMN), false);
  });
  it('rejects a signature of the wrong length without throwing', () => {
    assert.equal(verifyReturn(signed({ vnp_SecureHash: RETURN_HASH_PLUS.slice(0, 127) }), SECRET, TMN), false);
    assert.equal(verifyReturn(signed({ vnp_SecureHash: `${RETURN_HASH_PLUS}0` }), SECRET, TMN), false);
  });
  it('rejects a signature that is not hex without throwing', () => {
    assert.equal(verifyReturn(signed({ vnp_SecureHash: 'z'.repeat(128) }), SECRET, TMN), false);
  });
  it('rejects a non-string value such as a repeated query parameter', () => {
    assert.equal(verifyReturn(signed({ vnp_BankCode: ['NCB', 'NCB'] }), SECRET, TMN), false);
    assert.equal(verifyReturn(signed({ vnp_SecureHash: [RETURN_HASH_PLUS] }), SECRET, TMN), false);
  });
});

describe('QueryDR request', () => {
  const input = {
    tmnCode: TMN, secret: SECRET, requestId: 'REQ0001', txnRef: 'PAYMENT1', transactionDate: '20261029100000',
    createDate: '20261029100800', ipAddr: '127.0.0.1', orderInfo: 'Thanh toan don ORDER1',
  };
  it('signs the raw values joined with | (the space in vnp_OrderInfo stays a space)', () => {
    assert.equal(buildQueryDr(input).vnp_SecureHash, QUERYDR_REQUEST_HASH);
  });
  it('sends the fields VNPay expects', () => {
    const { vnp_SecureHash, ...body } = buildQueryDr(input);
    assert.equal(vnp_SecureHash, QUERYDR_REQUEST_HASH);
    assert.deepEqual(body, {
      vnp_RequestId: 'REQ0001', vnp_Version: '2.1.0', vnp_Command: 'querydr', vnp_TmnCode: TMN, vnp_TxnRef: 'PAYMENT1',
      vnp_OrderInfo: 'Thanh toan don ORDER1', vnp_TransactionDate: '20261029100000', vnp_CreateDate: '20261029100800',
      vnp_IpAddr: '127.0.0.1',
    });
  });
});

describe('verifyQueryDrResponse', () => {
  const ok = (signed: string, hash: string, expect = expectation) => verifyQueryDrResponse(queryDrBody(signed, hash), expect);
  it('accepts a signed 00/00 response, keeping empty optional fields in the signed string', () => {
    const result = ok(RESP_SUCCESS, RESP_SUCCESS_HASH);
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.fields.vnp_ResponseCode, '00');
      assert.equal(result.fields.vnp_TransactionStatus, '00');
      assert.equal(result.fields.vnp_PromotionCode, '');
    }
  });
  it('does not accept a signature built with the request formula', () => {
    assert.deepEqual(ok(RESP_SUCCESS, RESP_SUCCESS_WITH_REQUEST_FORMULA_HASH), { ok: false, reason: 'BAD_SIGNATURE' });
  });
  it('accepts a signed 91 response where most fields are absent', () => {
    const result = ok(RESP_NOT_FOUND, RESP_NOT_FOUND_HASH);
    assert.equal(result.ok && result.fields.vnp_ResponseCode, '91');
    assert.equal(result.ok && result.fields.vnp_TransactionStatus, '');
  });
  it('rejects a tampered body', () => {
    const body = { ...queryDrBody(RESP_SUCCESS, RESP_SUCCESS_HASH), vnp_TransactionStatus: '02' };
    assert.deepEqual(verifyQueryDrResponse(body, expectation), { ok: false, reason: 'BAD_SIGNATURE' });
  });
  it('rejects a short, non-hex or non-string signature without throwing', () => {
    const body = queryDrBody(RESP_SUCCESS, RESP_SUCCESS_HASH);
    assert.deepEqual(verifyQueryDrResponse({ ...body, vnp_SecureHash: 'abc' }, expectation), { ok: false, reason: 'BAD_SIGNATURE' });
    assert.deepEqual(verifyQueryDrResponse({ ...body, vnp_SecureHash: 'z'.repeat(128) }, expectation), { ok: false, reason: 'BAD_SIGNATURE' });
    assert.deepEqual(verifyQueryDrResponse({ ...body, vnp_SecureHash: 123 }, expectation), { ok: false, reason: 'BAD_SIGNATURE' });
  });
  // Spike 2026-10-30: the sandbox answers every QueryDR with 99 and no vnp_SecureHash.
  it('reports UNSIGNED, with the 2-digit response code, for an object without vnp_SecureHash', () => {
    const unsigned = { vnp_ResponseCode: '99', vnp_Message: 'Unexpected error' };
    assert.deepEqual(verifyQueryDrResponse(unsigned, expectation), { ok: false, reason: 'UNSIGNED', responseCode: '99' });
  });
  it('never trusts an unsigned response, even one that claims 00/00', () => {
    const { vnp_SecureHash, ...withoutHash } = queryDrBody(RESP_SUCCESS, RESP_SUCCESS_HASH);
    assert.ok(vnp_SecureHash);
    assert.deepEqual(verifyQueryDrResponse(withoutHash, expectation), { ok: false, reason: 'UNSIGNED', responseCode: '00' });
  });
  // Review finding 9: only a missing vnp_SecureHash is UNSIGNED; an empty or null one is a signature that does not match.
  it('reports BAD_SIGNATURE, not UNSIGNED, for an empty or null vnp_SecureHash', () => {
    const body = queryDrBody(RESP_SUCCESS, RESP_SUCCESS_HASH);
    assert.deepEqual(verifyQueryDrResponse({ ...body, vnp_SecureHash: '' }, expectation), { ok: false, reason: 'BAD_SIGNATURE' });
    assert.deepEqual(verifyQueryDrResponse({ ...body, vnp_SecureHash: null }, expectation), { ok: false, reason: 'BAD_SIGNATURE' });
  });
  it('gives responseCode null for UNSIGNED when vnp_ResponseCode is not exactly 2 digits', () => {
    for (const vnp_ResponseCode of ['9', '123', 'ab', '9 ', '99\nforged log line', '', undefined, null, 5]) {
      assert.deepEqual(verifyQueryDrResponse({ vnp_ResponseCode }, expectation), { ok: false, reason: 'UNSIGNED', responseCode: null });
    }
    assert.deepEqual(verifyQueryDrResponse({}, expectation), { ok: false, reason: 'UNSIGNED', responseCode: null });
  });
  it('rejects a body that is not a JSON object', () => {
    for (const body of [null, undefined, 'text', 42, [], ['x']]) {
      assert.deepEqual(verifyQueryDrResponse(body, expectation), { ok: false, reason: 'BAD_RESPONSE' });
    }
  });
  it('rejects a response for another TxnRef or merchant even with a valid signature', () => {
    assert.deepEqual(ok(RESP_SUCCESS, RESP_SUCCESS_HASH, { ...expectation, txnRef: 'PAYMENT2' }), { ok: false, reason: 'MISMATCH' });
    assert.deepEqual(ok(RESP_SUCCESS, RESP_SUCCESS_HASH, { ...expectation, tmnCode: 'OTHERTMN' }), { ok: false, reason: 'MISMATCH' });
  });
  it('rejects a 00 response with an empty merchant or reference as MISMATCH', () => {
    assert.deepEqual(ok(RESP_SUCCESS_EMPTY_IDS, RESP_SUCCESS_EMPTY_IDS_HASH), { ok: false, reason: 'MISMATCH' });
  });
  // Review finding 1: only 00 can lead to SUCCESS, so only 00 is a MISMATCH that is never closed.
  it('reports BAD_RESPONSE for a signed error answer with an empty merchant and reference', () => {
    assert.deepEqual(ok(RESP_ERROR_EMPTY_IDS, RESP_ERROR_EMPTY_IDS_HASH), { ok: false, reason: 'BAD_RESPONSE' });
  });
  it('reports BAD_RESPONSE for a signed 91 answer about another TxnRef or merchant', () => {
    assert.deepEqual(ok(RESP_NOT_FOUND, RESP_NOT_FOUND_HASH, { ...expectation, txnRef: 'PAYMENT2' }), { ok: false, reason: 'BAD_RESPONSE' });
    assert.deepEqual(ok(RESP_NOT_FOUND, RESP_NOT_FOUND_HASH, { ...expectation, tmnCode: 'OTHERTMN' }), { ok: false, reason: 'BAD_RESPONSE' });
  });
  it('rejects a 00 response whose amount differs from Payment.amount * 100', () => {
    assert.deepEqual(ok(RESP_SUCCESS, RESP_SUCCESS_HASH, { ...expectation, amountVnd: 20000 }), { ok: false, reason: 'MISMATCH' });
  });
  it('rejects a 00 response whose vnp_TransactionType is not 01', () => {
    assert.deepEqual(ok(RESP_WRONG_TYPE, RESP_WRONG_TYPE_HASH), { ok: false, reason: 'MISMATCH' });
  });
});

// Arguments are (responseCode, transactionStatus, expired, pastGrace). pastGrace implies expired in real use.
describe('queryDrAction (plan 1.6 table, D6 grace)', () => {
  it('00/00 -> SUCCESS, before and after the grace', () => {
    assert.deepEqual(queryDrAction('00', '00', false, false), { kind: 'SUCCESS' });
    assert.deepEqual(queryDrAction('00', '00', true, true), { kind: 'SUCCESS' });
  });
  it('00/01 -> IN_PROGRESS while the grace has not ended, also after expiry', () => {
    assert.deepEqual(queryDrAction('00', '01', false, false), { kind: 'IN_PROGRESS' });
    assert.deepEqual(queryDrAction('00', '01', true, false), { kind: 'IN_PROGRESS' });
  });
  it('00/01 -> EXPIRED once the grace has ended (D6)', () => {
    assert.deepEqual(queryDrAction('00', '01', true, true), { kind: 'EXPIRED' });
  });
  it('00/02 -> FAILED (not EXPIRED), before and after the grace', () => {
    assert.deepEqual(queryDrAction('00', '02', false, false), { kind: 'FAILED' });
    assert.deepEqual(queryDrAction('00', '02', true, true), { kind: 'FAILED' });
  });
  it('91 -> EXPIRED only after expiry, IN_PROGRESS before', () => {
    assert.deepEqual(queryDrAction('91', '', true, false), { kind: 'EXPIRED' });
    assert.deepEqual(queryDrAction('91', '', false, false), { kind: 'IN_PROGRESS' });
    assert.deepEqual(queryDrAction('91', '', true, true), { kind: 'EXPIRED' });
  });
  it('00 with reversal/refund/suspect statuses keeps PENDING and asks for reconciliation, even after the grace', () => {
    for (const status of ['04', '05', '06', '07', '09']) {
      assert.deepEqual(queryDrAction('00', status, true, true), { kind: 'PROVIDER_ERROR', reconcile: true });
      assert.deepEqual(queryDrAction('00', status, true, false), { kind: 'PROVIDER_ERROR', reconcile: true });
      assert.deepEqual(queryDrAction('00', status, false, false), { kind: 'PROVIDER_ERROR', reconcile: true });
    }
  });
  it('00 with a missing or unsupported status is a provider error without reconciliation before the grace ends', () => {
    assert.deepEqual(queryDrAction('00', '', false, false), { kind: 'PROVIDER_ERROR', reconcile: false });
    assert.deepEqual(queryDrAction('00', '03', false, false), { kind: 'PROVIDER_ERROR', reconcile: false });
    assert.deepEqual(queryDrAction('00', 'xx', true, false), { kind: 'PROVIDER_ERROR', reconcile: false });
  });
  it('00 with a missing or unsupported status -> EXPIRED once the grace has ended', () => {
    for (const status of ['', '03', 'xx']) assert.deepEqual(queryDrAction('00', status, true, true), { kind: 'EXPIRED' });
  });
  it('any other response code is a provider error before the grace ends, never a payment failure', () => {
    for (const code of ['02', '03', '94', '97', '99', '', 'zz']) {
      assert.deepEqual(queryDrAction(code, '', true, false), { kind: 'PROVIDER_ERROR', reconcile: false });
      assert.deepEqual(queryDrAction(code, '02', true, false), { kind: 'PROVIDER_ERROR', reconcile: false });
    }
  });
  it('a verified 99 -> EXPIRED once the grace has ended', () => {
    assert.deepEqual(queryDrAction('99', '', true, true), { kind: 'EXPIRED' });
    assert.deepEqual(queryDrAction('99', '02', true, true), { kind: 'EXPIRED' });
  });
  // Review finding 9: a suspect status only protects the payment together with response code 00.
  it('a suspect status with a response code other than 00 -> EXPIRED once the grace has ended', () => {
    assert.deepEqual(queryDrAction('99', '05', true, true), { kind: 'EXPIRED' });
    assert.deepEqual(queryDrAction('99', '05', true, false), { kind: 'PROVIDER_ERROR', reconcile: false });
  });
});

describe('unansweredQueryAction (D6)', () => {
  // Every reason of a QueryDR call that returned no verified answer, except MISMATCH.
  const unanswered = ['BAD_RESPONSE', 'BAD_SIGNATURE', 'UNSIGNED', 'TIMEOUT', 'NETWORK', 'NOT_CONFIGURED', 'MISSING_CREATE_DATE'] as const;
  it('MISMATCH is a provider error with reconciliation, before and after the grace', () => {
    assert.deepEqual(unansweredQueryAction('MISMATCH', false), { kind: 'PROVIDER_ERROR', reconcile: true });
    assert.deepEqual(unansweredQueryAction('MISMATCH', true), { kind: 'PROVIDER_ERROR', reconcile: true });
  });
  it('any other reason is a provider error without reconciliation before the grace ends', () => {
    for (const reason of unanswered) assert.deepEqual(unansweredQueryAction(reason, false), { kind: 'PROVIDER_ERROR', reconcile: false });
  });
  it('any other reason -> EXPIRED once the grace has ended', () => {
    for (const reason of unanswered) assert.deepEqual(unansweredQueryAction(reason, true), { kind: 'EXPIRED' });
  });
});

describe('isPastGrace (D6)', () => {
  const expiresAt = new Date('2026-10-30T03:15:00.000Z');
  it('has a grace of 15 minutes', () => {
    assert.equal(EXPIRY_GRACE_MS, 15 * 60 * 1000);
  });
  it('is true exactly at expiresAt + 15 minutes', () => {
    assert.equal(isPastGrace(expiresAt, new Date('2026-10-30T03:30:00.000Z')), true);
  });
  it('is false 1 ms before expiresAt + 15 minutes', () => {
    assert.equal(isPastGrace(expiresAt, new Date('2026-10-30T03:29:59.999Z')), false);
  });
  it('is false at expiresAt itself and true long after the grace', () => {
    assert.equal(isPastGrace(expiresAt, expiresAt), false);
    assert.equal(isPastGrace(expiresAt, new Date('2026-11-30T00:00:00.000Z')), true);
  });
  it('is false when expiresAt is null, however late it is', () => {
    assert.equal(isPastGrace(null, new Date('2099-01-01T00:00:00.000Z')), false);
  });
});

describe('ipnAction (plan 1.3 steps 5-7)', () => {
  it('00 and 00 -> SUCCESS', () => {
    assert.deepEqual(ipnAction('00', '00'), { kind: 'SUCCESS' });
  });
  it('status 02 with a failure response code (cancel 24, 51, 11...) -> FAILED', () => {
    for (const code of ['24', '51', '11', '13', '09', '10', '12', '79']) {
      assert.deepEqual(ipnAction(code, '02'), { kind: 'FAILED' });
    }
  });
  it('status 02 with response 00 or 07 is contradictory/suspect -> UNRESOLVED with reconciliation', () => {
    assert.deepEqual(ipnAction('00', '02'), { kind: 'UNRESOLVED', reconcile: true });
    assert.deepEqual(ipnAction('07', '02'), { kind: 'UNRESOLVED', reconcile: true });
  });
  it('status 01 (still processing) -> UNRESOLVED, reconcile only if the response code hints at a debit', () => {
    assert.deepEqual(ipnAction('24', '01'), { kind: 'UNRESOLVED', reconcile: false });
    assert.deepEqual(ipnAction('00', '01'), { kind: 'UNRESOLVED', reconcile: true });
  });
  it('reversal/refund/suspect statuses -> UNRESOLVED with reconciliation, whatever the response code', () => {
    for (const status of ['04', '05', '06', '07', '09']) {
      assert.deepEqual(ipnAction('00', status), { kind: 'UNRESOLVED', reconcile: true });
      assert.deepEqual(ipnAction('24', status), { kind: 'UNRESOLVED', reconcile: true });
    }
  });
  it('00 status with a non-00 response code is contradictory -> UNRESOLVED with reconciliation', () => {
    assert.deepEqual(ipnAction('24', '00'), { kind: 'UNRESOLVED', reconcile: true });
  });
  it('missing codes or an unsupported status with no sign of a debit -> UNRESOLVED without reconciliation', () => {
    assert.deepEqual(ipnAction('', ''), { kind: 'UNRESOLVED', reconcile: false });
    assert.deepEqual(ipnAction('24', ''), { kind: 'UNRESOLVED', reconcile: false });
    assert.deepEqual(ipnAction('24', '03'), { kind: 'UNRESOLVED', reconcile: false });
  });
  it('00 response code with a missing status still hints at a debit -> reconcile', () => {
    assert.deepEqual(ipnAction('00', ''), { kind: 'UNRESOLVED', reconcile: true });
  });
});

describe('vnpay-config', () => {
  const full = { VNP_TMN_CODE: TMN, VNP_HASH_SECRET: SECRET, WEB_URL: 'http://localhost:3000' };
  it('defaults to the public sandbox URLs', () => {
    const config = readVnpayConfig({});
    assert.equal(config.vnpUrl, 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html');
    assert.equal(config.apiUrl, 'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction');
  });
  it('reads overrides and treats blank values as missing', () => {
    const config = readVnpayConfig({ ...full, VNP_URL: 'https://pay.example.test/x', VNP_API_URL: '  ', VNP_TMN_CODE: ' ' });
    assert.equal(config.vnpUrl, 'https://pay.example.test/x');
    assert.equal(config.apiUrl, 'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction');
    assert.equal(config.tmnCode, null);
  });
  it('creating a URL needs all three variables', () => {
    assert.equal(canCreateUrl(readVnpayConfig(full)), true);
    assert.equal(canCreateUrl(readVnpayConfig({ ...full, WEB_URL: '' })), false);
    assert.equal(canCreateUrl(readVnpayConfig({ ...full, VNP_HASH_SECRET: '' })), false);
  });
  it('IPN, return and QueryDR need only the two merchant variables', () => {
    assert.equal(canVerify(readVnpayConfig({ ...full, WEB_URL: '' })), true);
    assert.equal(canVerify(readVnpayConfig({ ...full, VNP_TMN_CODE: '' })), false);
    assert.equal(canVerify(readVnpayConfig({ ...full, VNP_HASH_SECRET: '' })), false);
  });
  it('lists only the names of missing variables, never values', () => {
    assert.deepEqual(missingVnpayVars(readVnpayConfig({})), ['VNP_TMN_CODE', 'VNP_HASH_SECRET', 'WEB_URL']);
    assert.deepEqual(missingVnpayVars(readVnpayConfig({ ...full, VNP_HASH_SECRET: '' })), ['VNP_HASH_SECRET']);
    assert.deepEqual(missingVnpayVars(readVnpayConfig(full)), []);
  });
  it('accepts vnpay (default) as the payment provider', () => {
    assert.doesNotThrow(() => assertPaymentProvider({}));
    assert.doesNotThrow(() => assertPaymentProvider({ PAYMENT_PROVIDER: 'vnpay' }));
    assert.doesNotThrow(() => assertPaymentProvider({ PAYMENT_PROVIDER: '' }));
  });
  it('refuses fake and unknown providers so startup stops', () => {
    assert.throws(() => assertPaymentProvider({ PAYMENT_PROVIDER: 'fake' }), /fake/);
    assert.throws(() => assertPaymentProvider({ PAYMENT_PROVIDER: 'fake', NODE_ENV: 'production' }), /fake/);
    assert.throws(() => assertPaymentProvider({ PAYMENT_PROVIDER: 'stripe' }), /not supported/);
  });
  it('does not echo the provider value or any secret in the error', () => {
    assert.throws(() => assertPaymentProvider({ PAYMENT_PROVIDER: 'stripe', VNP_HASH_SECRET: SECRET }), (error: Error) => !error.message.includes('stripe') && !error.message.includes(SECRET));
  });
});

describe('VnpayGateway', () => {
  const savedEnv = { ...process.env };
  const useEnv = (env: Record<string, string>) => {
    for (const name of ['VNP_TMN_CODE', 'VNP_HASH_SECRET', 'WEB_URL', 'VNP_URL', 'VNP_API_URL']) delete process.env[name];
    Object.assign(process.env, env);
  };
  const FULL_ENV = { VNP_TMN_CODE: TMN, VNP_HASH_SECRET: SECRET, WEB_URL: 'http://localhost:3000' };
  const queryInput = { paymentId: 'PAYMENT1', orderId: 'ORDER1', amount: 10000, gatewayCreateDate: '20261029100000' };
  const respond = (body: unknown, status = 200) => async () => new Response(JSON.stringify(body), { status });
  const stubFetch = (impl: (url: string | URL | Request, init?: RequestInit) => Promise<Response>) => mock.method(globalThis, 'fetch', impl);
  afterEach(() => {
    mock.restoreAll();
    for (const name of ['VNP_TMN_CODE', 'VNP_HASH_SECRET', 'WEB_URL', 'VNP_URL', 'VNP_API_URL']) delete process.env[name];
    Object.assign(process.env, savedEnv);
  });

  describe('createUrl', () => {
    const input = { paymentId: 'PAYMENT1', orderId: 'ORDER1', amount: 10000, method: 'CARD' as const, ipAddr: '127.0.0.1' };
    const now = new Date('2026-10-29T03:00:00.250Z');
    it('signs a URL for the card method with the 15 minute expiry (D5) and the VNBANK bank code (D2)', () => {
      useEnv(FULL_ENV);
      const result = new VnpayGateway().createUrl({ ...input, now });
      assert.deepEqual(result, {
        ok: true,
        paymentUrl: `${SANDBOX_URL}?${URL_SIGNED}&vnp_SecureHash=${URL_HASH}`,
        gatewayCreateDate: '20261029100000',
        expiresAt: new Date('2026-10-29T03:15:00.000Z'),
      });
    });
    it('leaves the bank to the customer for the wallet method', () => {
      useEnv(FULL_ENV);
      const result = new VnpayGateway().createUrl({ ...input, method: 'WALLET', now });
      assert.equal(result.ok && result.paymentUrl.includes('vnp_BankCode'), false);
    });
    it('keeps expiresAt equal to the signed vnp_ExpireDate', () => {
      useEnv(FULL_ENV);
      const result = new VnpayGateway().createUrl(input);
      assert.ok(result.ok);
      if (result.ok) assert.equal(new URL(result.paymentUrl).searchParams.get('vnp_ExpireDate'), formatVnDate(result.expiresAt));
    });
    it('reports NOT_CONFIGURED when any of the three variables is missing', () => {
      for (const name of Object.keys(FULL_ENV)) {
        useEnv({ ...FULL_ENV, [name]: '' });
        assert.deepEqual(new VnpayGateway().createUrl(input), { ok: false, reason: 'NOT_CONFIGURED' });
      }
    });
  });

  describe('query', () => {
    const goodBody = () => queryDrBody(RESP_SUCCESS, RESP_SUCCESS_HASH);
    it('returns the verified response code, transaction status and metadata separately', async () => {
      useEnv(FULL_ENV);
      stubFetch(respond(goodBody()));
      assert.deepEqual(await new VnpayGateway().query(queryInput), {
        ok: true, responseCode: '00', transactionStatus: '00', transactionNo: '14000001', bankCode: 'NCB',
        payDate: new Date('2026-10-29T03:05:00.000Z'),
      });
    });
    it('POSTs a signed JSON request with the stored create date, a short request id and a timeout', async () => {
      useEnv(FULL_ENV);
      const stub = stubFetch(respond(goodBody()));
      await new VnpayGateway().query({ ...queryInput, now: new Date('2026-10-29T03:08:00Z') });
      const [url, init] = stub.mock.calls[0].arguments as [string, RequestInit];
      assert.equal(url, 'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction');
      assert.equal(init.method, 'POST');
      assert.ok(init.signal instanceof AbortSignal);
      const sent = JSON.parse(String(init.body));
      assert.equal(sent.vnp_TransactionDate, '20261029100000');
      assert.equal(sent.vnp_CreateDate, '20261029100800');
      assert.equal(sent.vnp_TxnRef, 'PAYMENT1');
      assert.equal(sent.vnp_TmnCode, TMN);
      assert.match(sent.vnp_RequestId, /^[0-9a-f]{32}$/);
      assert.match(sent.vnp_SecureHash, /^[0-9a-f]{128}$/);
    });
    it('keeps a 91 response distinguishable from errors', async () => {
      useEnv(FULL_ENV);
      stubFetch(respond(queryDrBody(RESP_NOT_FOUND, RESP_NOT_FOUND_HASH)));
      const result = await new VnpayGateway().query(queryInput);
      assert.deepEqual(result, { ok: true, responseCode: '91', transactionStatus: '', transactionNo: null, bankCode: null, payDate: null });
    });
    it('reports TIMEOUT when the request times out', async () => {
      useEnv(FULL_ENV);
      stubFetch(async () => { throw new DOMException('timed out', 'TimeoutError'); });
      assert.deepEqual(await new VnpayGateway().query(queryInput), { ok: false, reason: 'TIMEOUT' });
    });
    it('reports NETWORK when the request fails', async () => {
      useEnv(FULL_ENV);
      stubFetch(async () => { throw new TypeError('fetch failed'); });
      assert.deepEqual(await new VnpayGateway().query(queryInput), { ok: false, reason: 'NETWORK' });
    });
    it('reports BAD_RESPONSE for a non-200 status or a body that is not JSON', async () => {
      useEnv(FULL_ENV);
      stubFetch(respond(goodBody(), 500));
      assert.deepEqual(await new VnpayGateway().query(queryInput), { ok: false, reason: 'BAD_RESPONSE' });
      stubFetch(async () => new Response('<html>maintenance</html>', { status: 200 }));
      assert.deepEqual(await new VnpayGateway().query(queryInput), { ok: false, reason: 'BAD_RESPONSE' });
    });
    it('reports BAD_SIGNATURE when the response was tampered with', async () => {
      useEnv(FULL_ENV);
      stubFetch(respond({ ...goodBody(), vnp_TransactionStatus: '02' }));
      assert.deepEqual(await new VnpayGateway().query(queryInput), { ok: false, reason: 'BAD_SIGNATURE' });
    });
    it('reports UNSIGNED with the response code when the sandbox answers 99 without a signature', async () => {
      useEnv(FULL_ENV);
      stubFetch(respond({ vnp_ResponseCode: '99', vnp_Message: 'Unexpected error' }));
      assert.deepEqual(await new VnpayGateway().query(queryInput), { ok: false, reason: 'UNSIGNED', responseCode: '99' });
    });
    it('reports MISMATCH when the verified response is for a different amount', async () => {
      useEnv(FULL_ENV);
      stubFetch(respond(goodBody()));
      assert.deepEqual(await new VnpayGateway().query({ ...queryInput, amount: 20000 }), { ok: false, reason: 'MISMATCH' });
    });
    it('reports MISSING_CREATE_DATE without calling VNPay', async () => {
      useEnv(FULL_ENV);
      const stub = stubFetch(respond(goodBody()));
      assert.deepEqual(await new VnpayGateway().query({ ...queryInput, gatewayCreateDate: null }), { ok: false, reason: 'MISSING_CREATE_DATE' });
      assert.equal(stub.mock.callCount(), 0);
    });
    it('needs only the merchant variables: WEB_URL is not required', async () => {
      useEnv({ VNP_TMN_CODE: TMN, VNP_HASH_SECRET: SECRET });
      stubFetch(respond(goodBody()));
      assert.equal((await new VnpayGateway().query(queryInput)).ok, true);
    });
    it('reports NOT_CONFIGURED without calling VNPay when a merchant variable is missing', async () => {
      useEnv({ VNP_TMN_CODE: TMN, WEB_URL: 'http://localhost:3000' });
      const stub = stubFetch(respond(goodBody()));
      assert.deepEqual(await new VnpayGateway().query(queryInput), { ok: false, reason: 'NOT_CONFIGURED' });
      assert.equal(stub.mock.callCount(), 0);
    });
  });
});

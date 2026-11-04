// UNIT-T02: startup and payment behavior with fake-only, isolated configuration.
import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it, mock } from 'node:test';
import { Logger } from '@nestjs/common';
import { CheckoutModule } from '../src/checkout/checkout.module';
import { VnpayGateway } from '../src/payment/payment-gateway';

const names = ['VNP_TMN_CODE', 'VNP_HASH_SECRET', 'WEB_URL', 'VNP_URL', 'VNP_API_URL', 'PAYMENT_PROVIDER'] as const;
const fake = {
  VNP_TMN_CODE: 'FAKE_CONFIG_TMN',
  VNP_HASH_SECRET: 'FAKE_CONFIG_SECRET_FOR_UNIT_TESTS_ONLY',
  WEB_URL: 'https://web.example.test',
  PAYMENT_PROVIDER: 'vnpay',
};
const input = { paymentId: 'unit-payment', orderId: 'unit-order', amount: 124000, method: 'CARD' as const, ipAddr: '127.0.0.1', now: new Date('2026-11-04T00:00:00Z') };
const query = { paymentId: 'unit-payment', orderId: 'unit-order', amount: 124000, gatewayCreateDate: '20261104070000' };

describe('UNIT-T02 VNPay configuration', () => {
  let saved: Partial<Record<typeof names[number], string | undefined>>;
  beforeEach(() => {
    saved = Object.fromEntries(names.map((name) => [name, process.env[name]]));
    for (const name of names) delete process.env[name];
    Object.assign(process.env, fake);
    mock.method(globalThis, 'fetch', async () => { throw new Error('Unexpected network request'); });
  });
  afterEach(() => {
    mock.restoreAll();
    for (const name of names) {
      if (saved[name] === undefined) delete process.env[name];
      else process.env[name] = saved[name];
    }
  });

  for (const missing of ['VNP_TMN_CODE', 'VNP_HASH_SECRET', 'WEB_URL']) {
    for (const value of [undefined, '   ']) {
      it(`disables new payments when ${missing} is ${value === undefined ? 'absent' : 'blank'}, warning with names only`, () => {
        if (value === undefined) delete process.env[missing];
        else process.env[missing] = value;
        const warning = mock.method(Logger.prototype, 'warn', () => {});
        assert.doesNotThrow(() => new CheckoutModule());
        assert.equal(warning.mock.callCount(), 1);
        const message = String(warning.mock.calls[0].arguments[0]);
        assert.match(message, new RegExp(missing));
        for (const configured of Object.values(fake)) assert.equal(message.includes(configured), false);
        assert.deepEqual(new VnpayGateway().createUrl(input), { ok: false, reason: 'NOT_CONFIGURED' });
      });
    }
  }

  for (const missing of ['VNP_TMN_CODE', 'VNP_HASH_SECRET']) {
    it(`disables QueryDR without network access when ${missing} is missing`, async () => {
      delete process.env[missing];
      const fetch = mock.method(globalThis, 'fetch', async () => { assert.fail('Unconfigured QueryDR must not call fetch'); });
      assert.deepEqual(await new VnpayGateway().query(query), { ok: false, reason: 'NOT_CONFIGURED' });
      assert.equal(fetch.mock.callCount(), 0);
    });
  }

  it('starts with no merchant variables and logs all missing names in one warning', () => {
    for (const name of ['VNP_TMN_CODE', 'VNP_HASH_SECRET', 'WEB_URL']) delete process.env[name];
    const warning = mock.method(Logger.prototype, 'warn', () => {});
    assert.doesNotThrow(() => new CheckoutModule());
    assert.equal(warning.mock.callCount(), 1);
    const message = String(warning.mock.calls[0].arguments[0]);
    for (const name of ['VNP_TMN_CODE', 'VNP_HASH_SECRET', 'WEB_URL']) assert.match(message, new RegExp(name));
    for (const configured of Object.values(fake)) assert.equal(message.includes(configured), false);
  });

  it('does not warn when required configuration is present', () => {
    const warning = mock.method(Logger.prototype, 'warn', () => {});
    new CheckoutModule();
    assert.equal(warning.mock.callCount(), 0);
  });

  it('rejects PAYMENT_PROVIDER=fake at startup', () => {
    process.env.PAYMENT_PROVIDER = 'fake';
    assert.throws(() => new CheckoutModule(), /PAYMENT_PROVIDER=fake is not supported/);
  });

  it('uses sandbox payment and QueryDR URLs by default, even without WEB_URL for QueryDR', async () => {
    const gateway = new VnpayGateway();
    const created = gateway.createUrl(input);
    assert.equal(created.ok, true);
    if (!created.ok) assert.fail('Expected a configured payment URL');
    const url = new URL(created.paymentUrl);
    assert.equal(url.origin + url.pathname, 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html');
    assert.equal(url.searchParams.get('vnp_Amount'), '12400000');
    delete process.env.WEB_URL;
    const fetch = mock.method(globalThis, 'fetch', async (url: string | URL | Request) => {
      assert.equal(String(url), 'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction');
      return new Response('{}', { status: 503 });
    });
    assert.deepEqual(await gateway.query(query), { ok: false, reason: 'BAD_RESPONSE' });
    assert.equal(fetch.mock.callCount(), 1);
  });
});

import { defineConfig, devices } from '@playwright/test';
import assert from 'node:assert/strict';

// Config loads before Playwright's external-module rules; enforce the shared fixture's guard here before starting either server.
const loopback = (value: string | undefined, protocols: string[], label: string) => {
  assert.ok(value, `${label} must be explicit`);
  const url = new URL(value);
  assert.ok(protocols.includes(url.protocol) && ['localhost', '127.0.0.1'].includes(url.hostname), `${label} must use loopback`);
  return url;
};
const api = loopback(process.env.API_URL, ['http:'], 'API_URL');
const web = loopback(process.env.WEB_URL, ['http:'], 'WEB_URL');
assert.ok(!api.username && !api.password && !web.username && !web.password, 'HTTP targets cannot contain credentials');
const database = loopback(process.env.DATABASE_URL, ['postgres:', 'postgresql:'], 'DATABASE_URL');
// Prisma may honour extra connection-string parameters such as host; only the schema selector is allowed.
assert.deepEqual([...database.searchParams.keys()].filter((key) => key !== 'schema'), [], 'DATABASE_URL may only carry the schema query parameter');
assert.match(database.pathname.slice(1), /^brewlite_(ci|test)(_[a-z0-9]+)?$/, 'Database name must identify a test database');
assert.ok(decodeURIComponent(database.username) === 'brewlite' && decodeURIComponent(database.password) === 'fake-ci-only-password', 'Only known fake database credentials are allowed');
const fake = { jwt: 'FAKE_JWT_SECRET_FOR_CI_ONLY_32_CHARS_MINIMUM', tmnCode: 'FAKETMN1', hashSecret: 'FAKE_SECRET_FOR_CI_ONLY' };
for (const [key, value] of Object.entries({ JWT_SECRET: fake.jwt, VNP_TMN_CODE: fake.tmnCode, VNP_HASH_SECRET: fake.hashSecret })) {
  assert.ok(process.env[key] === undefined || process.env[key] === value, `${key} must use the known fake value`);
}
const targets = { apiUrl: api.origin, webUrl: web.origin, databaseUrl: database.href };

if (api.port !== '4105' || web.port !== '3105') throw new Error('E2E requires API port 4105 and web port 3105');

export default defineConfig({
  testDir: '../../tests/e2e',
  build: { external: ['**/tests/integration/**'] },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  forbidOnly: !!process.env.CI,
  reporter: 'list',
  timeout: 60_000,
  use: { baseURL: targets.webUrl, headless: true, trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], channel: 'chromium' } }],
  webServer: [
    {
      command: 'npm --prefix ../api run build && npm --prefix ../api run start:prod',
      url: `${targets.apiUrl}/health`,
      // Always start our own API: a running one may use another database, other secrets or stale code. The fixture's check of the
      // registered user (tests/integration/helpers.mjs) only finds a wrong database after it has already registered a user there.
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        DATABASE_URL: targets.databaseUrl, PORT: '4105', CORS_ORIGINS: targets.webUrl,
        WEB_URL: targets.webUrl, JWT_SECRET: fake.jwt, VNP_TMN_CODE: fake.tmnCode,
        VNP_HASH_SECRET: fake.hashSecret, PAYMENT_PROVIDER: 'vnpay',
        VNP_URL: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
        VNP_API_URL: `${targets.apiUrl}/__e2e_vnpay_query_disabled`,
      },
    },
    {
      command: `npm run build && npm run start -- --hostname ${web.hostname} --port 3105`,
      url: targets.webUrl,
      // Always build and start our own web server: NEXT_PUBLIC_API_URL is inlined at build time, so a running build or dev server
      // may call a different API, and a stale build would not contain the code under test.
      reuseExistingServer: false,
      timeout: 180_000,
      env: { NEXT_PUBLIC_API_URL: targets.apiUrl },
    },
  ],
});

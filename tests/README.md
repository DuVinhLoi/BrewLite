# Restored test suites (PR-2)

Use Node from `.nvmrc` and install each app with `npm ci` (Windows PowerShell may
require `npm.cmd`). Unit suites do not need a database or application server:

```powershell
npm.cmd --prefix apps/api ci
npm.cmd --prefix apps/api run prisma:generate
npm.cmd --prefix apps/web ci
npm.cmd --prefix apps/api test
npm.cmd --prefix apps/web test
```

API units use `node:test`/`tsx`; web units use Vitest/Testing Library/jsdom.
See [current results](../docs/task5/verification.md#khôi-phục-test-pr-2--06112026)
and [test IDs](../docs/traceability-matrix.md#phan-b). The first restored CI run is recorded in the
[CI evidence](../docs/evidence/ci/README.md); three consecutive green runs remain pending. UNIT-T12 covers the old `stockBadge`
helper; current menu UI has only Còn hàng/Hết hàng, covered by UNIT-T14.

## HTTP integration (Task 4 / B4)

Run with Node 24, Docker Compose and installed dependencies in `apps/api`.
Tests call the built API over HTTP. Supplementary database assertions use the
existing Prisma client inside transactions beginning with `SET TRANSACTION READ
ONLY`; they verify persisted snapshots, atomic rejection and seed preservation.
They never import Nest services or application pricing/signing functions.

Use an exclusive local test database. All fixtures mutate stock, recipes, orders
and payments through HTTP. Each scenario registers a unique Customer and logs in
as the seeded Barista. Cleanup fails outstanding payments through signed fake
IPNs, cancels unpaid orders, restores edited recipes and restores starting stock
through audited API adjustments. Users, cancelled/paid orders and movement audit
records remain in this disposable database. Never share it with another suite.

## Start the local database and API

PowerShell, from the repository root. This Compose project uses its own volume
and binds PostgreSQL only to loopback; it does not use the application's database.
All credentials below are deliberately fake. No `.env` file is needed; the
integration helpers do not load `.env` files.

```powershell
$env:POSTGRES_PASSWORD = 'fake-ci-only-password'
$env:API_URL = 'http://127.0.0.1:4105'
$env:WEB_URL = 'http://127.0.0.1:3105'
$env:DATABASE_URL = 'postgresql://brewlite:fake-ci-only-password@127.0.0.1:55439/brewlite_test?schema=public'
$env:JWT_SECRET = 'FAKE_JWT_SECRET_FOR_CI_ONLY_32_CHARS_MINIMUM'
$env:VNP_TMN_CODE = 'FAKETMN1'
$env:VNP_HASH_SECRET = 'FAKE_SECRET_FOR_CI_ONLY'
$env:PORT = '4105'
$env:PAYMENT_PROVIDER = 'vnpay'
$env:VNP_URL = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html'
$env:VNP_API_URL = 'http://127.0.0.1:4199/unused-querydr'
$env:CORS_ORIGINS = $env:WEB_URL
$testCompose = Join-Path $env:TEMP 'brewlite-integration-compose.yml'
@'
name: brewlite-integration
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: brewlite_test
      POSTGRES_USER: brewlite
      POSTGRES_PASSWORD: fake-ci-only-password
    ports: ["127.0.0.1:55439:5432"]
    volumes: ["integration-data:/var/lib/postgresql/data"]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U brewlite -d brewlite_test"]
      interval: 2s
      timeout: 3s
      retries: 30
volumes:
  integration-data:
'@ | Set-Content -LiteralPath $testCompose
docker compose -f $testCompose up --detach --wait
Push-Location apps/api
npm ci
npm run prisma:generate
npm run prisma:migrate
$env:SEED_DEMO_USERS = 'true'
npm run prisma:seed
$env:SEED_DEMO_USERS = 'false'
npm run prisma:seed
npm run build
Pop-Location
node apps/api/dist/main.js
```

In another terminal set the same `API_URL`, `WEB_URL`, `DATABASE_URL` and fake
environment values, then run from the repository root:

```powershell
node --test --test-concurrency=1 'tests/integration/*.test.mjs'
```

Use the explicit glob: Node 24 treats `tests/integration/` as an entry module and
reports `MODULE_NOT_FOUND`. File concurrency must remain **1** because stock is
shared. INT-T04 creates its ten concurrent requests internally. No VNPay URL is
visited; callbacks are signed locally. The frontend need not be running for B4.

`API_URL`, `WEB_URL` and `DATABASE_URL` are mandatory. Both HTTP URLs and the
Postgres host must be `127.0.0.1` or `localhost`. The database name must match
`^brewlite_(ci|test)(_[a-z0-9]+)?$` (for example `brewlite_test_cutover` or
`brewlite_ci`). Database credentials must be the fake pair above. When supplied,
JWT/merchant/hash variables must equal the documented fake values. Guards run
before any HTTP request or database connection, including before seed execution.
Do not supply real credentials or point the suite at a deployed API.

INT-T15 receives stock, edits a recipe and reserves an order, then invokes the
actual `prisma/seed.ts` twice using `node --import tsx`, with guarded local DB
and fake environment values. It checks preservation after each invocation,
including duplicate product/ingredient/recipe and recipe-line detection.

The suite covers API-T01–API-T05 and INT-T01–INT-T15. INT-T01 sends the normal
order DTO and checks server-computed prices. INT-T02 rejects client `total` and
`unitPrice` fields per SRS AC-F12.3; these fields must not be silently accepted.
INT-T11b currently retains its required403 assertion but is narrowly skipped
pending [the dedicated Barista cancellation fix (PR31)](https://github.com/DuVinhLoi/BrewLite/pull/31):
the baseline API returns409. INT-T11a paid progression remains enabled. Remove
the skip when that runtime fix is integrated; other failures remain failures.

When finished, stop the test database without removing its audit data:

```powershell
docker compose -f $testCompose down
```

## Chromium E2E (Task 5 / B5)

Run this suite after integration has finished. Use the same isolated database
setup above, or a separate database matching the guard with the same fake
credentials. Migrate and seed before starting; Playwright does not seed for you.
Never run integration and E2E against the same database concurrently.

In a terminal with the exact fake environment block above, from the repository
root, while the test database is running:

```powershell
node apps/web/node_modules/playwright/cli.js install chromium
npm.cmd --prefix apps/web run test:e2e
```

On Linux runners install system dependencies as well with
`node apps/web/node_modules/playwright/cli.js install --with-deps chromium`.
The config requires API port **4105** and web port **3105** and validates targets
before starting either server. It builds and starts API/web itself. Local runs
may reuse an existing server only when it belongs to this test environment and
database; stop unrelated servers on those ports first. CI always starts fresh
servers. Use the config-provided `NEXT_PUBLIC_API_URL`; a production web build
pointing elsewhere must not be reused.

Five tests cover paid checkout/history, guest login with preserved cart,
failed payment then retry, ingredient shortage and cart recovery, and Barista
receiving stock in `/inventory` followed by menu availability. Menu assertions
use Còn hàng/Hết hàng; API assertions check computed capacity separately.
Fixtures use HTTP for mutations and fake independently signed IPN/return data;
browser navigation to VNPay is intercepted. No card, OTP or production secret is
needed, and this does not prove a real sandbox transaction.

Playwright uses one Chromium worker, retains traces on failure, and retries once
in CI (zero locally). Results/trace ZIPs are under `apps/web/test-results/`.
Open a trace with:

```powershell
node apps/web/node_modules/playwright/cli.js show-trace apps/web/test-results/<case>/trace.zip
```

CI uploads this directory on failure when present. Its artifact is available
from the Actions run page for seven days. Do not commit generated results or
credentials. Stop local servers and run the non-destructive Compose `down`
command above when finished; retain the database volume unless deletion is
separately authorized.

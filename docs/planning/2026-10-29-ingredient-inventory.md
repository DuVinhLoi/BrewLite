# Ingredient inventory implementation plan

**Task:** BREW-INVENTORY-01. **Goal:** receive ingredients → display cups → reserve order → consume on payment or release on cancellation.

**Architecture:** additive Prisma inventory tables; one inventory service shared by catalog and checkout. Decimal quantities, ordered row locks, immutable order snapshots. Contract: [inventory-contract.md](../inventory-contract.md).

**Latest user instruction:** after verification, delete all project tests, including associated test scripts/configuration/dependencies. Record pre-removal evidence in the verification report. This supersedes the initial request to retain runnable tests and extends allowed paths solely for that cleanup.

**Stack:** existing NestJS, Prisma, PostgreSQL and Next.js. Jest, Vitest and Playwright were used for verification, then removed as requested. No new application dependencies; build/config changes only remove test references.

## Ownership and execution

This session owns API, schema, migrations and API tests. A frontend worker may own only `apps/web/src/` and `tests/e2e/inventory.spec.ts`. A documentation worker may own only requirement/diagram/architecture/runbook/traceability files under `docs/`, excluding this plan and inventory-contract.md. They consume the recorded HTTP contract; contract changes are serialized through this session. No worker edits another worktree or commits another worker's changes.

## 1. Baseline and schema

- [x] Read task, repository rules, current schema, checkout, catalog and frontend stock behavior. Confirm clean linked worktree, base 73a6ccb and task branch.
- [x] Install existing lockfile dependencies; run baseline API/web tests. Integration needs an explicitly isolated `brewlite_test*` database.
- [x] Add Ingredient, Recipe, RecipeLine, StockMovement, OrderIngredient and Order.inventoryTracked, retaining Product.stock for legacy orders. Add checks/foreign keys and additive migration under `apps/api/prisma/migrations/`.
- [x] Add seed recipes and zero-balance ingredients using no-op updates. Run Prisma validate/generate; test reseed preserves balances and recipes.

## 2. Availability and administration API

- [x] Write `apps/api/test/inventory.spec.ts` for exact Matcha six-cup example, limiting ingredient, zero/missing recipes, shared demands, toppings and unit conversion; run failing tests before implementation.
- [x] Implement `apps/api/src/inventory/` calculation/validation service, module and controllers per contract. Use Decimal throughout; return string amounts. Lock recipes before ingredient balances for mutations.
- [x] Wire module into app/catalog/checkout. Catalog returns computed S stock; public availability aggregates all lines. Staff inventory/movement/recipe endpoints enforce BARISTA and body validation.
- [x] Run focused unit and API tests, then API lint/build.

## 3. Transactional checkout

- [x] Update real PostgreSQL checkout regression fixtures to use ingredients and recipes. Write integration cases for aggregate oversell, deliberate transaction failure after a reservation, concurrency, snapshot edits, retry/replay, cancellation and legacy orders.
- [x] Replace product decrement on new order creation with inventory reservation/snapshot inside existing transaction. Use aggregate demand and deterministic ingredient locks. Preserve server pricing.
- [x] On payment success consume snapshot before commit; on owner cancellation release snapshot. Preserve original stock behavior for legacy false-marker orders. Do not mutate on replay or failed payment.
- [x] Run complete API tests plus PostgreSQL suite with `TEST_DATABASE_URL`; inspect resulting balances, orders and payments.

## 4. Customer and staff UI

- [x] Add typed availability/inventory client contracts and staff `/inventory` UI with balances, reasoned receive/count forms, movement history, recipe editor and limiting ingredients.
- [x] Product detail requests selected variant availability on size/topping changes; prevent stale results and invalid additions. Remove shared product-stock variant cap.
- [x] Cart checks total shared ingredient demand, shows shortages and permits editing. Checkout retains cart on 409 and links back for correction.
- [x] Write runnable Vitest tests for variant availability, shared cart shortages, staff authorization/form validation and server errors. Add browser receive → availability → failed-payment/cancel plus success flow.
- [x] Run web tests, lint, typecheck/build and browser E2E when API/database are available.

## 5. Documentation and handoff

- [x] Update SRS FR-29, scope, use case and acceptance criteria; inventory class/activity/sequence PlantUML sources plus renders; architecture and ADR; seed/demo/cutover/deployment runbook; traceability matrix.
- [x] Record actual test outcomes and remaining environmental limitations in `docs/inventory-verification.md`, including exact commands and evidence.
- [x] Request independent code review, address material findings, rerun affected checks.
- [x] Run `git diff --check`, `git diff --name-status` and list new files. Confirm every path in approved scope. Deliver branch/worktree, feature summary, migration/seed/demo commands, tests, assumptions and limitations. Do not push or deploy production.

## Final outcome

- [x] Reproduced and fixed stale cart additions on navigation/cart changes and stale staff initial/manual/post-save loads; scoped independent re-review clean.
- [x] Final pre-cleanup verification: API26, PostgreSQL20, web48 and Chromium7 tests passed.
- [x] Deleted all26 project test/config/documentation files in the cleanup manifest, removed12 test-only devDependencies and obsolete scripts/CI steps; regenerated lockfiles with no retained package version changes.
- [x] After cleanup API/web lint/typecheck/build and API runtime checks passed; Prisma valid/up to date; no dangling executable test references.
- [x] Recorded exact outcomes, assumptions, limitations and every changed path in [inventory-verification.md](../inventory-verification.md). Worktree and branch preserved; no commit/push/deploy.

## BREW-INVENTORY-UI-02 — simplify staff inventory

User reviewed the running Docker demo and requested removal of the recipe editor (recipes are fixed) and sellable-cup preview from the inventory page. Root session owns this follow-up on `feat/ingredient-inventory` in `C:\Users\baoth\orca\workspaces\BrewLite\jumbo`; no parallel writers or branch dependencies.

Allowed paths: `apps/web/src/components/shop/InventoryScreen.tsx`, `apps/web/src/lib/inventory.ts` (unused UI type only), `apps/web/src/app/globals.css` (unused recipe styles), `apps/web/README.md`, root README, this plan, `docs/inventory-runbook.md` and `docs/docker-demo.md` for verification. No API/schema/dependency changes.

Acceptance: inventory page contains only balances, receive/count form and history; removed panels leave no editor/preview state or dedicated fetches; refresh and stock movement submission still work. Keep existing data and order calculations. Run web lint/typecheck, rebuild the same Docker demo and verify the rendered page plus API health. Do not add tests, commit or push.

- [x] Remove both panels, their local state/components/requests and unused recipe styles/type.
- [x] Update the current inventory instructions to match the simpler page.
- [x] Web lint/typecheck and Docker web build exit 0. Same demo container recreated healthy; existing balances, recipes and JWT preserved. HTTP `/inventory` returns 200; all 8 served JavaScript chunks contain balances/form/history and omit recipe editor/cup preview. Browser host unavailable, so interactive form/refresh were not re-exercised; their submission and abort handling remain in source.
- [x] Inspected scoped paths and `git diff --check`; demo left running with its existing volume and hidden WSL waiter. Exact evidence and limitation recorded in `docs/docker-demo.md`.

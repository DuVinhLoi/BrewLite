# BREW-INVENTORY-01 — paused checkpoint, 2026-10-29

> **Đã tiếp tục theo yêu cầu người dùng và hoàn tất phần còn lại.** Nội dung checkpoint bên dưới giữ nguyên như hồ sơ tạm dừng. Hai lỗi UI đã được tái hiện/sửa và review lại; các bộ kiểm chứng đã chạy đạt trước khi toàn bộ test/tooling được xóa theo yêu cầu. Trạng thái cuối và danh sách thay đổi: [inventory-verification.md](../inventory-verification.md). Không commit/push/deploy.

## Stop state

The user requested: **“stop and make a checkpoint and write out what left to do.”** Implementation and review workers have stopped. Do not resume implementation, remove tests, commit, push or deploy until the user resumes the task.

- Repository/worktree: `C:\Users\baoth\orca\workspaces\BrewLite\jumbo`.
- Branch: `feat/ingredient-inventory`, created from the original HEAD.
- HEAD/base: `73a6ccb53691d5a6304d631761f1b7446a25701a`.
- No commits, staging, push, PR or production deployment performed.
- All work is uncommitted in this worktree; preserve it. `git status --porcelain=v1` showed 67 entries before this checkpoint (some entries represent new directories).
- Original worktree was clean. No other worktree was edited.
- Latest root `git -c core.safecrlf=false diff --check`: exit 0. Root inspected `git diff --name-status` and untracked paths.
- API/Next browser-test servers stopped normally; recorded task PIDs 4916/20884/22128/13400 were absent on process inspection.
- Temporary PostgreSQL cluster was explicitly stopped with `pg_ctl -m fast -w stop`, exit 0. Its databases/files are retained.
- No worker exec sessions remain running according to the workers' final reports.

## Task and latest user instructions

Original task specification: `C:\Users\baoth\OneDrive\Desktop\plan san pham.txt` (UTF-8). It authorizes schema, migration, API, types and full inventory implementation within API source/Prisma/tests, web source, tests, docs and README.

The user subsequently confirmed **delete ALL project tests after verification**, not merely new inventory tests. This also requires removing obsolete test scripts/configuration/dependencies and CI references. **That deletion has NOT happened.** Keep the existing tests until the remaining fixes and verification are finished. This latest instruction supersedes the original requirement to retain runnable tests and extends scope solely for associated cleanup.

Design/contract: [inventory-contract.md](../inventory-contract.md).
Implementation plan: [2026-10-29-ingredient-inventory.md](../planning/2026-10-29-ingredient-inventory.md). It was moved from ignored `docs/superpowers/plans/` to tracked `docs/planning/`. Some plan checkboxes have not yet been synchronized; this checkpoint is the current status.

## Implemented

### Database and seed

- Prisma models: Ingredient, Recipe, RecipeLine, StockMovement, OrderIngredient; `Order.inventoryTracked` defaults false for old orders.
- Additive migration: `apps/api/prisma/migrations/20261029000000_ingredient_inventory/migration.sql`.
- Decimal numeric(18,3) quantities; DB checks for balances, canonical units, pieces, positive recipe/snapshot quantities, recipe selectors and movement reasons.
- Product.stock is retained for the legacy lifecycle only. New orders use ingredient balances; catalog stock is computed for size S without topping.
- `apps/api/prisma/inventory.seed.ts`: 15 zero-balance ingredients, 24 product/size recipes and 3 topping recipes. Seed creates missing records with no-op updates and preserves operational balances/edited recipes.
- S recipes match the task. Demo M=1.25×S, L=1.5×S, peach pieces rounded up; extra toppings 20g each. Water/ice unlimited; prepared intermediates counted separately; no batch-production module.

### API and checkout

- New `apps/api/src/inventory/` module, controller, service and Decimal calculation/validation helpers.
- Public aggregate availability endpoint; BARISTA-only balances, receive/count movements with reason, history and recipe replacement endpoints.
- Same-dimension kg→g and l→ml conversion; incompatible units, bad precision, duplicate ingredients/unknown fields and invalid totals rejected.
- Shared ingredient demand aggregated across all cart lines, sizes and toppings.
- New order transaction reserves ingredients and stores immutable aggregate snapshot with order/items.
- Payment success consumes onHand/reserved once; failure keeps reservation; successful replay does not consume again.
- Owner cancellation releases snapshot once; recipe changes do not affect old snapshots. False-marker legacy orders retain their prior product-stock lifecycle.
- Ordered recipe/ingredient locks; payment/order state locking preserved. One reviewed deadlock defect was fixed: recipe replacement now locks all ingredient IDs in SQL order before FK inserts. Cancellation transaction timeout aligned to 20 seconds.

### Frontend

- `/inventory`: staff balances, receipts/counts with reasons, movement history, product/size/topping recipe editor, availability/limiting-ingredient preview, loading/error/empty/validation states.
- BARISTA navigation link.
- Product detail loads selected variant availability, rejects stale availability results, checks aggregate cart before addition and removes obsolete shared Product.stock variant cap.
- Menu identifies stock as S/no-topping estimate and permits navigating to other variants.
- Cart checks shared aggregate ingredient demand, shows shortages and allows correction.
- Checkout 409 keeps cart and links back for correction, preserving payment retry and lost-response recovery.
- Valid zero-stock recipes display “Hết nguyên liệu” rather than incorrectly claiming a missing recipe.

### Documentation

- SRS/scope/checkout UC updated; FR-25 and FR-29 are Must for this increment.
- Added `docs/requirements/uc-inventory.md`, `docs/architecture/adr/006-ingredient-inventory-snapshots.md`, `docs/inventory-runbook.md`.
- Architecture, related ADR contradictions, deployment and traceability updated.
- Seven native PlantUML source/SVG pairs updated: class, activity, sequence, state, two use-case diagrams and deployment. Worker rendered with official PlantUML 1.2025.10, visually inspected PNGs and validated 7/7 SVGs.
- Root README, app READMEs and CONTRIBUTING updated for inventory and planned test removal.

**Intermediate documentation inconsistency:** README/current docs already describe tests as removed and link `docs/inventory-verification.md`, but tests still exist and that verification report has NOT been written. Resolve this when resuming; do not present the current worktree as a completed handoff.

## Verification already observed

| Check | Actual outcome before pause |
|---|---|
| API `npm.cmd test -- --runInBand` | 5 suites, **26/26 passed**, exit 0 after latest API fix |
| API `TEST_DATABASE_URL=... npm.cmd test -- --runInBand --testRegex=.integration-spec.ts$` | Real PostgreSQL, 2 suites, **20/20 passed**, exit 0 |
| Web `npm.cmd test` | Worker observed **45/45 passed** after zero-stock wording regression fix |
| Web Playwright `npm.cmd run test:e2e` | Worker session 98736: **7/7 passed**, exit 0, 16.1s |
| API lint/build | Latest root run exit 0 after ingredient lock fix |
| API `tsc --noEmit` | Exit 0 before final ordered-lock addition; Nest build passed after it |
| Web lint/typecheck | Worker observed exit 0; last standalone runs preceded final zero-stock wording fix |
| Web production build | Worker session 57529 exit 0 after latest zero-stock fix; includes TypeScript |
| Prisma generate | Exit 0, Prisma Client 6.19.3 |
| Prisma validate | Exit 0 with explicit disposable DATABASE_URL |
| Prisma migrate status | Up to date, all four migrations applied |
| Empty DB migration | Both disposable inventory/E2E DBs migrated successfully |
| Legacy DB migration preservation | Old three migrations → insert pending legacy order/items/product stock 7 → new migration: order/items/stock preserved, marker false, zero fabricated ingredients/snapshots |
| Seed rerun preservation | Modified test matcha onHand=20/reserved=3 and recipe=4.125; reran seed; exact values and record counts unchanged; fixture restored |
| PlantUML/native SVG | Worker: 7 rendered, 7/7 checks passed and PNGs visually inspected |
| Root final diff whitespace check | Exit 0 immediately before checkpoint |

The 20 PostgreSQL cases include supplied Matcha 6-cup/limiter example, missing/zero recipes, additive size/topping demand, shared cart shortages, forced failure after reservation with full rollback, concurrent last-stock orders, failed-payment retry/replay, snapshot cancellation after recipe edits, repeated cancellation, authorization/units, legacy lifecycle and original 10 checkout regressions.

The final browser run covers six original checkout recovery flows plus a mobile staff receipt → S6/M5 availability → payment decline/reservation → cancellation/release → successful payment/consumption flow.

Initial failures were resolved: dependency installation/cache/network sandbox restrictions; missing generated Prisma Client; tsx Windows userInfo sandbox restriction; seed syntax typo; missing Chromium; Windows browser/server teardown permissions; E2E selector mismatch. Expected injected PostgreSQL failure logs in the rollback test are intentional, not unresolved failures. One Prisma validate attempt omitted DATABASE_URL and failed; rerun with explicit disposable URL passed.

## Remaining work, in order

1. **Fix the outstanding frontend review finding before finalizing.**
   - `apps/web/src/components/shop/ProductDetail.tsx:46–48` awaits aggregate availability, then calls captured `shop.add`.
   - `ShopProvider.tsx:31` captures the old cart in `add`.
   - Navigation remains enabled during the request. A customer can navigate to Cart and change/delete lines, then the delayed add response can restore the obsolete cart plus the added item.
   - This is a concrete read-only review finding, not yet reproduced/fixed. Add a controlled delayed-response/unmount/cart-edit regression while tests still exist; cancel/ignore obsolete additions and avoid committing against an obsolete cart. Then rerun relevant UI checks.
2. **Finish read-only frontend review.** Variant availability, aggregate cart, checkout conflicts and staff forms were inspected. Staff initial-load/manual-refresh/save race assessment and final contract cross-check remain incomplete. Possible stale initial inventory response overwriting refresh is noted but not yet confirmed/fixed.
3. **Run final affected checks and record evidence.** API checks are already green; rerun when code changes justify it. Recheck web tests/lint/typecheck/build after the remaining fix; rerun affected browser flow. API independent review is clean after scoped re-review of the ordered-lock fix.
4. **Create `docs/inventory-verification.md`.** Record exact commands/outcomes above, environment, resolved failures, review findings/fixes, migration/seed evidence, remaining limits and file purposes. Distinguish pre-deletion test evidence from final source distribution.
5. **Perform the user's requested ALL-test cleanup only after verification.**
   - Delete `apps/api/test/**`, web `*.test.ts`/`*.test.tsx`, `tests/**` (including E2E, deployment tests and Postman artifact), and `docs/validate_task2.py` (its header identifies an automated smoke test).
   - Remove API `tsconfig.test.json`, web `vitest.config.mts`, `vitest.setup.ts`, `playwright.config.ts`.
   - Remove test/test:watch/test:cov/test:integration/test:e2e scripts and API Jest package configuration.
   - Remove test-only dependencies and regenerate both package-lock files using npm. API candidates: @nestjs/testing, @types/jest, @types/supertest, cross-env, jest, supertest, ts-jest. Web candidates: @playwright/test, @testing-library/jest-dom, @testing-library/react, jsdom, vitest. Verify actual usage before removing any dependency.
   - Update API tsconfig `types`/`include` and ESLint test globs/Jest globals; retain real source/Prisma checks.
   - Update `.github/workflows/ci.yml` to remove Unit Test, Integration Test command and Browser E2E steps; preserve meaningful lint/typecheck/build/migration/seed/Compose validation. Do not leave CI calling removed scripts.
   - Preserve deployment operational health checks and historical evidence. Remove current live links/instructions to deleted test paths; archive documents can retain clearly historical records.
   - **None of these package/config/CI/deletion changes has been made yet.**
6. **After cleanup:** run API lint/build/typecheck, web lint/typecheck/build, Prisma validate; verify lockfiles and scan for dangling test imports/scripts. Update README/docs to reflect actual state. No claim of automated tests shipping afterward.
7. **Finish scope/diff/handoff:** synchronize plan checkboxes, inspect every tracked/untracked path, run `git diff --check` and `git diff --name-status`, explain file purposes, report branch/worktree/results/demo commands/limits. Original scope was extended only by explicit test-cleanup instruction for CONTRIBUTING/app READMEs and future package/config/CI cleanup. Do not commit/push/deploy unless requested.

## Temporary environment for resumption

Node 24.19.0 and npm are available. PowerShell execution policy blocks `npm.ps1`; use **npm.cmd**. Both apps' lockfile dependencies were installed. Docker is not installed. Browser Chromium and supporting Playwright binaries were installed outside the repository through approved escalation.

Portable PostgreSQL 16.14, isolated in Temp:

```powershell
$pg = 'C:\Users\baoth\AppData\Local\Temp\brewlite-inventory-pg\node_modules\@embedded-postgres\windows-x64\native\bin\pg_ctl.exe'
$data = 'C:\Users\baoth\AppData\Local\Temp\brewlite-inventory-pg\data'
& $pg -D $data -l "$env:TEMP\brewlite-inventory-pg\postgres.log" -o '-p 55439 -h 127.0.0.1' -w start
```

Cluster is **stopped** at checkpoint. Existing disposable databases:

- `postgresql://postgres@127.0.0.1:55439/brewlite_test_inventory` — integration/seed checks.
- `postgresql://postgres@127.0.0.1:55439/brewlite_test_e2e` — browser checks, seeded demo users; receipts/orders from E2E remain.
- `postgresql://postgres@127.0.0.1:55439/brewlite_test_migration` — retained legacy migration-preservation fixture.

These are local disposable test databases, not production. No real database was modified. Do not infer balances or reset user data when resuming.

Temporary seed/migration verification scripts are in `%TEMP%\brewlite-seed-preservation.cjs` and `%TEMP%\brewlite-migration-preservation.cjs`. Do not blindly rerun the creation/legacy-insert setup on already-existing fixtures.

Demo users in seeded disposable DBs: `customer.demo@brewlite.local` and `barista.demo@brewlite.local`, password `Demo@12345`. These credentials are the existing explicit demo seed, not production secrets.

## Ownership after pause

All worker file ownership is released back to the root session. Workers have stopped. On resumption recheck branch/status and current human changes before writing. Existing diff must be preserved. No changes were restored/discarded or copied between worktrees.

Known product limits remain deliberate: no automatic unpaid-order expiry, no raw-to-prepared batch production, no production deployment performed, and menu counts are independent estimates rechecked transactionally at order creation.

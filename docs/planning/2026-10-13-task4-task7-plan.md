# Task 4 / Task 7 implementation plan — 2026-10-13

Scope: feat/task4-task7 at C:\BrewLite-task4-task7, based on origin/develop 92ff320. No commits, shared DB mutations, root-worktree edits or dependency changes.

Existing architecture: ProductDetailModal + pricing + Zustand cart; Nest AuthModule + bcryptjs + JwtAuthGuard; Login/Register tabs at /login with sessionStorage. Reuse these contracts and styles.

1. Reproduce Prisma missing-model types, generate client from backend/prisma/schema.prisma and rebuild; do not remove the User import or change schema.
2. Add regression tests for normalized email, concurrent unique-email failure, invalid/expired JWT identities and real HTTP auth/order routing. Normalize in DTO before validation and service before lookup/save, translate P2002 email errors to 409, validate JWT sub/email, require JWT_SECRET at module initialization.
3. Test detail API real-data loading and errors. Add getProduct(id), reuse useAsync for loading/retry/404 in the existing modal, disable options/add while detail is unavailable or stock is zero. Preserve pricing/cart contracts and demo menu behavior; never substitute mock detail data for an API failure.
4. Run targeted red/green tests then backend build/tests, frontend tests/lint/typecheck/build, and git diff --check/name-status. Document exact results, missing environment and review steps in docs/task4-task7-report.md.

Dependencies: database HTTP verification requires a separately supplied test database; no migration is needed. Existing order controller already uses req.user.id. Prisma generated files stay in ignored node_modules. No source is copied from C:\BrewLite.

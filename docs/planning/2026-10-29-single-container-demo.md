# BREW-DOCKER-DEMO-01 — single-container demo

User approved one container containing web, API and PostgreSQL for a fast local demo. Owner: root session, current branch `feat/ingredient-inventory`, worktree `C:\Users\baoth\orca\workspaces\BrewLite\jumbo`. Preserve all existing inventory changes and the separate-service Docker deployment.

Allowed changes for this task: root `Dockerfile`, `.dockerignore`, `compose.demo.yml`, `docker/demo-entrypoint.sh`, web `next.config.ts` for opt-in `/api` proxy, README and this task's documentation. Acceptance: one image/container, one browser port, persistent isolated PostgreSQL volume, migrate/seed on startup without resetting stock, graceful shutdown and startup failure propagation. No new application dependency or retained test suite.

Design: reuse Node 24 build stages and the official PostgreSQL 16 Bookworm runtime. Tini runs a small Bash supervisor; official PostgreSQL entrypoint initializes its database. API and standalone Next run as an unprivileged app user. A build-time opt-in Next rewrite proxies `/api` to the same container's API; browser uses relative `/api`, so changing the host port needs no rebuild. Persist generated database/JWT secrets and database data in the dedicated demo volume. Seed accounts by default for this explicitly selected demo image; ingredient balances remain zero until staff records receipts.

- [x] Inspect branch/status, existing Dockerfiles/Compose, API/seed/frontend contracts and local Docker/WSL availability.
- [x] Add the image, single-service Compose, ignore rules, supervised entrypoint and opt-in rewrite.
- [x] Check Bash syntax, web lint/typecheck/build and independently review lifecycle/data preservation.
- [x] Build and start the actual image; verify health, same-origin API, login, stock receipt/order lifecycle, restart persistence and graceful stop. Installed official Docker Engine/Compose in Ubuntu WSL because Windows Docker CLI/Desktop was absent.
- [x] Document one-command startup/stop, credentials/stock, volume behavior and exact verification outcomes in `docs/docker-demo.md`. Inspect diff scope/whitespace; do not commit/push/deploy production.

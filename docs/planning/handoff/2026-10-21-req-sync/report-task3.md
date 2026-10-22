# Task 3 architecture sync report

## Identity and status

- Task: Task 3, card `card-task3.md`, steps B0–B9.
- Date: 2026-10-22.
- Branch: `a2/task-3-architecture`.
- Worktree: `E:\CNPM\BrewLite\.worktrees\task3-arch`.
- Base: `origin/develop-Assignment2` at `30a7a9d2554b198a0f5592c0eef1c73698ab684c`.
- Task 4 reference: `origin/a2/Task4` at `dd94220775e959e581c52bc95da6d457d7204757`.
- Initial branch/worktree verified; initial `git status -sb` was clean.
- Scoped B8 checks PASS. Task 3 merges cleanly into develop.
- **External blocker:** requested Task 4 merge-tree check still reports a matrix conflict. The same conflict occurs between Task 4 and unchanged develop; Task 3's matrix is byte-identical to develop. Task 4 owner must reconcile it. No other worktree was edited and no merge was performed.

## Commits and delivery scope

- `81d4068`: `docs(traceability): defer Task 3 matrix cells to B10`.
- `a6448ab60bec4e3996ab71f43e7260e9bd0de18d`: `docs(architecture): align ADRs and deployment diagram with SRS after PR 11`.
- This report is delivered in a separate planning commit; its SHA is available in branch history.
- Before reverting the matrix, saved HEAD's version at `E:\CNPM\BrewLite\.worktrees\matrix-task3-draft.md` for B10. It is outside this PR.
- B10 is **deferred**, not completed: separate branch/PR after Task 2 T2-M merges. architecture.md §8 supplies the 19 design mappings.
- Report moved with `git mv` from repository root to this handoff path.
- Existing filenames `003-containerization.md` and `004-vercel-render.md` retained, per the user's request to match the five actual ADR files.

| Changed path in final PR | Purpose |
|---|---|
| `docs/architecture/architecture.md` | Layered/container/module view; correct NFR codes; configuration, migration/seed, logging, trade-offs; 19 NFR mapping rows for B10. |
| `docs/architecture/deployment.puml` | UML deployment nodes/artifacts, all eight A2 components, local/CI/production boundaries; startup migration, GHCR SHA, smoke and rollback. |
| `docs/architecture/deployment.svg` | New SVG actually rendered by PlantUML 1.2026.8; XML and visual QA. |
| `docs/architecture/adr/001-monorepo.md` | Correct related NFRs to CI/CD (17/18). |
| `docs/architecture/adr/002-layered-nestjs.md` | Correct related FR/NFR references to API responsibilities. |
| `docs/architecture/adr/003-containerization.md` | Keep existing filename and startup migration decision; add versioned additive Prisma migrations, repeatable seed and storage details. |
| `docs/architecture/adr/004-vercel-render.md` | GHCR image, internal-only DB with external access disabled, platform configuration, startup migration, smoke/rollback and free-tier limits. |
| `docs/architecture/adr/005-idempotency-and-optimistic-lock.md` | Exact BR-05/D2/D3 replay rules, stateless in-process simulator, accepted crash gap, stock reserved at order creation; no compensate. |
| `docs/architecture/README.md` | Artifact links, scope, render instructions and SVG serialization notes. |
| `docs/architecture/adr/README.md` | Exactly five existing ADR filenames and accepted decisions. |
| `docs/planning/handoff/2026-10-21-req-sync/report-task3.md` | Move root report to assigned path; replace expected outcomes with observed evidence and downstream blocker. |

## Acceptance coverage

- B2: all five ADRs Accepted (2026-10-21); ADR-005 explicitly notes D3's 2026-10-22 clarification.
- B3: replay compares owner/orderId/key/paymentMethod; cardNumber is never compared or stored; different method after PAID returns 409; same key on another order is new; failed payment does not lock key. Stock is reserved at order creation. Accepted simulator crash gap is documented.
- B4–B5: Vercel/Render/GHCR SHA deployment; migration at container startup; health {status, database}; smoke health/products/web with up to 10 minutes retry per step; previous image/web rollback and smoke. Additive migration and repeatable seed documented.
- B6: corrected NFR meanings; container/module view, config, security, logging, migration/seed and decision trade-offs; exactly 19 mapping rows excluding NFR-06 (covered separately in prose).
- B7a/A2 §5.2: device/browser/PWA, Vercel CDN, Render API container, Postgres persistent storage, GHCR, HTTPS 443/internal 5432, environment/secret/health/log, distinct local/CI/production. No CI-to-production-DB connection, no refund capability.
- B7b: both indexes updated; five ADR filenames and relative links verified.
- B8: actual render and scoped gates below.
- B9: commits and report prepared; PR targets develop-Assignment2 and must merge before PR #9.

## Render and visual evidence

Downloaded official [PlantUML 1.2026.8 release](https://github.com/plantuml/plantuml/releases/tag/v1.2026.8) into `C:\Users\Admin\AppData\Local\Temp\brewlite-task3-plantuml`, outside the repository.

```text
java version "24.0.2" 2025-07-15
JAR SHA256: 5e1ecfa8ecd32c90b03bbf3b1eb6f020943f98ab0fcf4032be31a0002ee2c462
```

Commands run from the worktree root (absolute temporary paths abbreviated below):

```text
java -jar <temp>/plantuml-1.2026.8.jar -charset UTF-8 -checkonly docs/architecture/deployment.puml
(no output)
exit: 0
java -jar <temp>/plantuml-1.2026.8.jar -charset UTF-8 -tsvg -o <temp>/rendered docs/architecture/deployment.puml
(no output)
exit: 0
java -jar <temp>/plantuml-1.2026.8.jar -charset UTF-8 -tpng -o <temp>/preview docs/architecture/deployment.puml
(no output)
exit: 0
```

Copied the rendered SVG into docs/architecture/deployment.svg. Inspected the PNG preview from the same source; all three boundaries, components, ports and arrow labels are visible. Escaped Creole hyphens so the Vercel CLI flags remain literal.

The raw single-line SVG caused false positives in the card's broad grep: XML `version="1.1"` occurred on the same line as SHA labels; a path coordinate `916.776` matched `16\.7`. Stored SVG splits XML tags onto separate lines and serializes that decimal point as `&#46;`. Parsed XML attributes, text and geometry were checked identical to the raw generated SVG. No contract text was hidden or removed by serialization.

One-off XML/link/map verification output:

```text
PASS SVG: valid XML, PlantUML 1.2026.8 metadata, no Syntax Error or strikethrough
PASS SVG: parsed geometry/text identical to raw PlantUML output; literal CLI flags intact
PASS NFR map: exactly 19 unique rows (01-20 except 06)
PASS Markdown: 28 relative links resolve across 8 files
PASS ADR index: exactly five actual filenames
exit: 0
```

## B8 command evidence

Results below were captured against the staged architecture content before the architecture commit. Git grep exit 1 means **zero matches**, the expected successful outcome of this negative check.

```text
$ git grep -n --cached -E 'E8b|16\.7|AC-N15\.3|APP_VERSION|version.*SHA|/health\.version|đúng SHA|poll .?/health|Cache-Control|phục hồi|lưu bền vững|bảng lưu|~2 phút|/body|thất bại, chống thu trùng|simulator chống thu trùng|vi phạm SRS 3\.4|Câu hỏi cho nhóm|Đề xuất \(nhóm chốt|Bản nháp do AI|chưa đối chiếu|chưa có ADR|chưa có nội dung' -- docs/architecture
(no output)
exit: 1
```

```text
$ git diff --cached --check
(no output)
exit: 0
```

```text
$ git diff --cached --name-only origin/develop-Assignment2
docs/architecture/README.md
docs/architecture/adr/001-monorepo.md
docs/architecture/adr/002-layered-nestjs.md
docs/architecture/adr/003-containerization.md
docs/architecture/adr/004-vercel-render.md
docs/architecture/adr/005-idempotency-and-optimistic-lock.md
docs/architecture/adr/README.md
docs/architecture/architecture.md
docs/architecture/deployment.puml
docs/architecture/deployment.svg
docs/planning/handoff/2026-10-21-req-sync/report-task3.md
exit: 0
```

```text
$ python docs/validate_task2.py
PASS class-domain: source .puml + image .svg
PASS class-domain: PlantUML boundary markers
PASS class-domain: SVG valid XML rendered by PlantUML
PASS state-order: source .puml + image .svg
PASS state-order: PlantUML boundary markers
PASS state-order: SVG valid XML rendered by PlantUML
PASS sequence-checkout: source .puml + image .svg
PASS sequence-checkout: PlantUML boundary markers
PASS sequence-checkout: SVG valid XML rendered by PlantUML
PASS activity-checkout: source .puml + image .svg
PASS activity-checkout: PlantUML boundary markers
PASS activity-checkout: SVG valid XML rendered by PlantUML
PASS User: minimum properties
PASS Product: minimum properties
PASS Order: minimum properties
PASS OrderItem: minimum properties
PASS Payment: minimum properties
PASS Promotion: minimum properties
PASS LoyaltyTransaction: minimum properties
PASS Role: exact values
PASS OrderStatus: exact values
PASS PaymentMethod: exact values
PASS PaymentStatus: exact values
PASS LoyaltyType: exact values
PASS class diagram: 7 associations & multiplicities
PASS state machine: exactly eight business transitions
PASS state machine: PAID -> CANCELLED is forbidden
PASS activity: all four swimlanes
PASS activity: start and explicit terminal nodes for failures
PASS activity: E1/E2/E3 explicit
PASS activity: balanced if/endif, note blocks
PASS sequence: all five required lifelines
PASS sequence: calls, JWT, idempotency header
PASS sequence: T1/T2, replay, retry same order
PASS sequence: balanced alt/opt/group/end fragments

All static checks PASSED. Run PlantUML -checkonly before PR merge.
exit: 0
```

```text
$ git diff --check
(no output)
exit: 0
```

```text
$ git diff --cached --name-status
M	docs/architecture/README.md
M	docs/architecture/adr/001-monorepo.md
M	docs/architecture/adr/002-layered-nestjs.md
M	docs/architecture/adr/003-containerization.md
M	docs/architecture/adr/004-vercel-render.md
M	docs/architecture/adr/005-idempotency-and-optimistic-lock.md
M	docs/architecture/adr/README.md
M	docs/architecture/architecture.md
M	docs/architecture/deployment.puml
A	docs/architecture/deployment.svg
R100	report-task3.md	docs/planning/handoff/2026-10-21-req-sync/report-task3.md
exit: 0
```

## Integration evidence

These merge-tree checks use architecture commit `a6448ab`, before the final report commit; they create temporary Git objects and do not merge or change the working tree.

```text
$ git merge-tree --write-tree --name-only origin/develop-Assignment2 HEAD
4c013391ced40b85f081b34261cfdfbc3aa251d6
exit: 0
```

```text
$ git merge-tree --write-tree --name-only origin/a2/Task4 HEAD
14e0552cc369cf4d7f7e4e4b1c3e58cadc367d4b
docs/traceability-matrix.md

Auto-merging docs/traceability-matrix.md
CONFLICT (content): Merge conflict in docs/traceability-matrix.md
exit: 1
```

```text
$ git merge-tree --write-tree --name-only origin/a2/Task4 origin/develop-Assignment2
e57b5b2f323872ca1be9ad8acb3f1a0bf784b50d
docs/traceability-matrix.md

Auto-merging docs/traceability-matrix.md
CONFLICT (content): Merge conflict in docs/traceability-matrix.md
exit: 1
```

```text
$ git diff --exit-code origin/develop-Assignment2 HEAD -- docs/traceability-matrix.md
(no output)
exit: 0
```

The Task 4 failure is pre-existing: Task 4 versus develop fails in exactly the same file, and the matrix equality check exits 0. The PR removes Task 3's earlier matrix edits entirely. Resolving Task 4's matrix here would break this task's scope and the B10 dependency; it belongs to the Task 4 owner.

## Independent review and limits

Used executing-plans, UML, domain-modeling, api-engineer (existing contract only), requesting-code-review, verification-before-completion and PR skills. A read-only reviewer checked the card, A2 §5.1–5.2, SRS, D2/D3, CR-5.3, links and scope. It found one minor PlantUML flag-formatting issue, fixed and rerendered; no remaining content findings.

Only documentation and diagram checks were run. No API/web runtime, live deploy, CORS configuration, performance benchmark, production database or rollback drill was executed. These are Task 4/5 delivery evidence, not Task 3 claims. Render limitations and DB-access details were verified from official docs linked in ADR-004.

Remaining external work: Task 4 matrix conflict; Task 2 T2-M then Task 3 B10 matrix PR; Task 5 implementation and production evidence. This branch has no matrix contribution and does not merge or clean up another worker's branch/worktree.

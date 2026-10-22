# Task 3 sync report

## Branch

- `a2/task-3-architecture`
- base: `develop-Assignment2`
- date: 2026-10-22

## Status

- [x] B0: branch created from `develop-Assignment2`
- [x] B1: architecture docs restored and staged in `docs/architecture/`
- [x] B2: ADR state updated to `Accepted (2026-10-21)`
- [x] B3: ADR-005 rewritten for idempotency and anti-stock-conflict design
- [x] B4: ADR-004 updated for Vercel + Render, health checks, retry window, migration
- [x] B5: ADR-003 updated with date and startup migration guidance
- [x] B6: `architecture.md` updated with runtime, module, quality attributes, ADR traceability
- [x] B7a: `deployment.puml` updated for smoke checks and deployment flow
- [x] B7b: README files updated to describe architecture docs and ADR index

## Validation checklist

The following checks are intended to be run before merge:

```bash
git add docs/architecture
git diff --cached --check
git diff --cached --name-only origin/develop-Assignment2
git grep -n --cached -E "E8b|16\.7|AC-N15\.3|APP_VERSION|version.*SHA|/health\.version|đúng SHA|poll .?/health|Cache-Control|phục hồi|lưu bền vững|bảng lưu|~2 phút|/body|thất bại" -- docs/architecture
python docs/validate_task2.py
```

## Expected outcome

- `git diff --cached --check` returns no issues
- banned terms grep returns no matches
- `python docs/validate_task2.py` passes if the repo contains the validation script in the relevant branch state

## Notes

This branch is the architecture documentation branch for Task 3. The traceability matrix and separate PR for B10 remain a follow-up step after the architecture docs are accepted and merged.

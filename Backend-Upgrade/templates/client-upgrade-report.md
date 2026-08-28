# NGO Core Upgrade Report — {ClientId}

> Superset of the legacy `templates/upgrade-report.template.md`. Written at the
> client solution root as `upgrade-report-YYYY-MM-DD.md`. This is a mandatory
> gate: the run cannot be COMPLETE without it (config/quality-gates.yaml).

## 1. Upgrade result
- Status: `{SUCCESS | PARTIAL | BLOCKED}`
- Previous version → Target version: `{source}` → `{target}`
- Build result: `{green | N errors}`
- EF migration: `{applied | no-changes | n/a | blocked}`
- Tests: `{passed X/Y | noTests | regressed}`
- Build-fix iterations: `{n}`

## 2. Baseline (before upgrade)
- Baseline build: `{green | N errors}`
- Baseline tests: `{passed X/Y | noTests}`

## 3. Files changed
| File | Change | Reason |
|------|--------|--------|

## 4. Configuration changes
| Key | Value | File | Notes |
|-----|-------|------|-------|

## 5. Errors fixed
| Error code | Symbol / file | Root cause | Fix | Evidence (decompile ref) |
|-----------|---------------|-----------|-----|--------------------------|

## 6. Breaking changes & deployment implications
{Narrative for the deployment team.}

## 7. Agentic reasoning summary
- Key hypotheses and overrides.
- Decompile lookups performed (authoritative signatures).
- Patterns applied (approved / candidate — labelled).

## 8. Deviations from plan
{List anything that differed from `upgrade-plan-YYYY-MM-DD.md`.}

## 9. Unresolved issues
{Link each `unresolved-issue` file; state whether it blocks completion.}

## 10. Developer decisions recorded
{From decisions.jsonl.}

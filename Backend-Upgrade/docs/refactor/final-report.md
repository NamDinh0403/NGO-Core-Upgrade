# Refactor Final Report — Backend-Upgrade

Date: 2026-08-13
Scope: `Backend-Upgrade/` (NGO Core backend upgrade agent). `Frontend-Upgrade/` untouched.

## Executive summary
The backend upgrade system was refactored from a prompt/markdown + JSON knowledge
base (with no executable orchestration, no durable per-run state, and no memory
lifecycle) into a durable, resumable workflow system. The knowledge layer was
**physically reorganized** into the target `knowledge/{canonical,derived,index}/`
layout (single source of truth, no duplication), and the refactor adds
the previously missing machinery: an explicit state machine, isolated durable runs
with checkpoints, differentiated blocked/terminal statuses, a candidate→approved
memory lifecycle, client isolation + redaction policy, JSON schemas, scoped
retrieval, a mandatory documentation gate, and runnable validation + evaluations.
The legacy procedural layer (`BOOT.md`, `Agent/`, `Templates/`) is preserved with
all references updated to the new knowledge paths.

All checks pass: `node tools/validate.js` → 13/13; `node tools/run-evals.js` → 12/12,
silent-stop-rate = 0.

## Architecture implemented
- `config/` — 5 policies: agent-policy, quality-gates, escalation-policy, retention-policy, knowledge-priority.
- `workflows/core-upgrade/` — `workflow.yaml` state machine + 8 phase cards (each with full contracts) + 2 checklists.
- `schemas/` — 7 JSON schemas (run-request, run-state, workflow-event, episode, error-pattern, fix-pattern, version-knowledge).
- `memory/` — episodes / candidates / approved / rejected with a documented promotion lifecycle.
- `runs/` — isolated, client-scoped durable run directory contract.
- `templates/` — developer-escalation, unresolved-issue, learned-pattern, client-upgrade-report.
- `tools/` — `orchestration/state-machine.js`, `validate.js`, `run-evals.js`, and role docs (build/test/repository/documentation/memory).
- `evals/` — regression cases, synthetic simulated runs, scoring metrics.
- `knowledge/` — reorganized into `canonical/` (errors, symbols, versions, migrations, appsettings, anti-patterns), `derived/` (breaking-changes, common-error-solutions, deployment-guides), and `index/` (routing-table, manifest, retrieval-index, legacy version-manifest).
- `docs/` — architecture overview + 4 ADRs, operations guide + client-memory removal, refactor assessment/map/report.
- `AGENTS.md` — concise agent entry point.

## Major files added
See the tree above; ~60 new files. Key runnable artifacts: `tools/validate.js`,
`tools/run-evals.js`, `tools/orchestration/state-machine.js`.

## Major files moved or transformed
The entire `Knowledge/` tree was relocated into `knowledge/{canonical,derived,index}/`
(see `docs/refactor/migration-map.md` for the per-path mapping); `Knowledge/index.json`
became `knowledge/index/routing-table.json` with its internal route paths rewritten,
and all callers (BOOT, kernel, phase cards, README, docs, memory) were updated.
One transformation: `Case-Studies/WVUK/core-8.x-migration.md` was
**imported** as a structured episode (`memory/episodes/imported/ep-wvuk-core8x-001.json`)
with conservative confidence and provenance `imported`, plus two derived candidate
patterns (`cand-nu1201-align-tfm`, `cand-cs7036-add-ctor-param`). The original case
study is preserved.

## Legacy compatibility retained
None — superseded by the **FINAL_CUTOVER** (2026-08-19). The legacy layer
(`Agent/`, `Case-Studies/`, `Version-Changes/`, `Templates/`, `BOOT.md`,
`ARCHITECTURE.md`) was physically removed after its useful content was migrated.
`AGENTS.md` is the sole agent entry point. There is one source of truth:
procedural in `workflows/` + `config/`, canonical knowledge in `knowledge/canonical/`,
historical runs in `memory/episodes/`. See `docs/refactor/legacy-cleanup-report.md`
and `docs/refactor/deleted-legacy-paths.md`. A layout policy
(`config/repository-layout-policy.yaml`) + cleanliness test (`tools/repo-layout.test.js`)
prevent the legacy paths from returning.

## Existing behaviour preserved
Decompile-first / installed-DLL-authoritative evidence policy; `index.json` routing;
plan and report hard gates; minimal-diff principle; the 7-step Fix Pattern Workflow;
the bounded 5-iteration build-fix loop.

## Problems fixed
- No durable/isolated run state → `runs/` + `state.json` + checkpoints + idempotency.
- Ambiguous stop conditions → differentiated status enum; every blocked/failed path routes to HANDOVER with a resume instruction; silent-stop-rate = 0.
- Uncontrolled global-knowledge writes → candidate→approved lifecycle; candidates never authoritative.
- No client isolation → retention/redaction policy + cross-client isolation check.
- No schema/reference validation → `tools/validate.js`.
- No escalation artifact → `templates/developer-escalation.md` + handover phase.
- Documentation could be implicit → machine-readable `documentation-status.json` completion gate; `DOCUMENTATION_PENDING` prevents premature COMPLETE.

## Validation commands executed
```
node tools/validate.js     -> 13/13 checks passed
node tools/run-evals.js    -> 12/12 scenarios passed, silent-stop-rate=0
```

## Test and evaluation results
Behavioural scenarios covered: normal success, known-error/approved-fix,
unknown-error escalation, fix-causes-regression, missing-client-decision,
tool-timeout retry+escalate, interruption+resume (no repeated mutation),
docs-not-completed → DOCUMENTATION_PENDING, candidate-not-auto-applied,
cross-client isolation denied, repeated-error escalation, blocked-produces-episode.
All pass.

## Known limitations
- Orchestration logic is provided as a testable module + workflow contracts; the
  agent still executes phases (this is an LLM-driven system by design). The state
  machine is enforced via `state.json` + `tools/`, not a long-running daemon.
- `Version-Changes/9.0.0` and `9.1.0` diff folders are referenced but not prepared (pre-existing gap).
- Deep-dive Core 8 Markdown docs are not yet reconciled field-by-field against the JSON registries.
- The schema validator is a dependency-free subset (required/type/enum/const), sufficient for these records.

## Remaining manual-review items
- Reconcile `knowledge/derived/breaking-changes/core-8-migration-detailed.md` / `core-8.0.0-changes-by-class.md` against JSON registries; then treat purely as generated derived docs.
- Prepare 9.0.0 / 9.1.0 diff folders or remove the dangling references.
- First real run: promote validated candidate patterns to `memory/approved/` after developer approval.

## Recommended next improvements
- Add a thin CLI (`tools/orchestration`) to scaffold `runs/<client>/<run-id>/` and append JSONL events.
- Generate the derived Markdown from JSON registries automatically.
- Wire `node tools/validate.js` + `node tools/run-evals.js` into CI.

## Start the first real client upgrade
1. `node tools/validate.js && node tools/run-evals.js` (both exit 0).
2. Pick a sanitized client id, e.g. `acme`. Create `runs/acme/acme-<UTC>-0001/` and write `request.json`.
3. Open `workflows/core-upgrade/phases/01-discovery.md` (or legacy `BOOT.md`) and give the agent:
   `Upgrade NGO Core packages to version <X.Y.Z>`.
4. The agent advances the state machine, checkpoints each step, fixes errors decompile-first, runs tests + EF migration, writes `upgrade-report-YYYY-MM-DD.md`, produces an episode, and finishes with exactly one terminal/blocked status.

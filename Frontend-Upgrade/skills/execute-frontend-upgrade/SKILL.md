---
name: execute-frontend-upgrade
description: Apply approved plan changes to the client repository only, behind the mutation gate.
metadata:
  id: execute-frontend-upgrade
  version: 1.1.0
  status: active
  risk: high
  input-schema: schemas/input.schema.json
  output-schema: schemas/output.schema.json
---

# Purpose

Apply the approved plan to the **client repository only**, one change at a time,
behind the mutation gate, with a rollback checkpoint and continuous Core-unchanged
verification.

# Trigger conditions

A READY (or policy-approved READY_WITH_ASSUMPTIONS) plan exists and the mutation
gate passes.

# Exclusions

Never writes to Core. Never installs into Core. Never switches Core branches or
resets Core. Never performs manual file copying between repositories. Never
applies changes outside the approved plan.

# Preconditions (mutation gate)

`tools/lib/engine.js` `mutationGate(ctx)` must pass: plan READY; client baseline
checkpoint captured; rollback strategy present; Core fingerprint captured;
planning-time fingerprints still match; and the requested action exists in the
plan. Any failure blocks execution.

# Required capabilities

`mutate-client-repository`, `install-client-dependencies`, `run-shell-command`.
Optional: `create-readonly-core-worktree`.

# Inputs

See `schemas/input.schema.json`.

# Procedure

1. Create/verify the client rollback checkpoint (git baseline or working copy).
2. Capture the Core fingerprint before mutation.
3. For each planned change, in dependency order: apply the exact edit to the exact
   client files; record before/after evidence; re-verify Core is unchanged.
4. Apply exact target package versions; install client dependencies using the
   detected client package manager.
5. On failure, route to `investigate-frontend-failure`; do not brute-force.
6. After the batch, re-verify Core fingerprint unchanged and record results.

# Operational safety (learned)

- **Install:** ensure the private feed is authenticated FIRST (a stale token 401s every
  download — see `investigate-frontend-failure`). Use the client's package manager with
  `--legacy-peer-deps` when Core has a hard peer conflict; because that skips peers, all
  `CORE_REQUIRED_PEER`/`CORE_IMPLICIT_PEER` packages must already be in `package.json`
  (from `resolve-target-packages`). If a prior install failed/was interrupted, delete
  `node_modules` + lockfile and clean-install rather than layering onto a partial tree.
- **Bulk mechanical edits** (e.g. `@Effect`->`createEffect`, `async`->`waitForAsync`,
  type renames across many files) may be done with a scoped codemod, but: handle CRLF +
  trailing whitespace, verify per-file transform counts, and `git checkout -- <file>` +
  re-run on any file the codemod half-transformed. Never leave a partially edited file.
- **Long-running commands** block the shell and buffer output — redirect to an ASCII log
  file and read it after completion; do not pipe through output-filtering cmdlets.
- **Checkpoint per work-group**, not per file, so a batch can be reverted atomically; keep
  git operations file-scoped when the repo/monorepo holds unrelated in-progress work.
- **Apply every `targetClientFiles` path** of each plan change — do not stop after the "main"
  file. After a change, diff its declared target set against the files actually written and
  record any path left unapplied as N/A-with-evidence, else the change is only half-done
  (e.g. env keys added to `environment.ts` but missed in `environment.prod.ts` / runtime config).
- **Adapt to API changes via the dependency's `.d.ts`; never `as any`-cast** a changed signature
  to force a compile (it hides runtime breakage) — see `investigate-frontend-failure`.

# Evidence requirements

Every applied change records exact files, before/after state, and the Core
fingerprint comparison.

# Uncertainty behavior

If a dependency diff or new evidence invalidates the plan, stop and route back to
planning; do not improvise.

# Completion criteria

All planned changes applied or a clear stop state recorded; Core verified
unchanged; state persisted for resume.

# Retry behavior

Bounded retries per `config/quality-gates.yaml`; repeated identical failures
escalate. Rollback restores the client baseline.

# Escalation behavior

Gate failure, Core mutation detected, or exhausted retries route to
`developer-escalation`.

# Outputs

See `schemas/output.schema.json`.

# Allowed next skills

`build-and-fix` via `investigate-frontend-failure`, `audit-frontend-integration`,
`developer-escalation`.

# Prohibited behavior

No Core writes. No out-of-plan changes. No manual copying. No unbounded retries.

# Evaluations

See `evals/`. Covers execution-requires-READY, rollback-required, Core-unchanged
during execution, dependency-diff replanning, and retry limits.

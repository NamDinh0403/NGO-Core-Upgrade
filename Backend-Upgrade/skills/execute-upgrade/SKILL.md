---
name: execute-upgrade
description: Applies an approved, evidence-backed Core upgrade plan to the client repository.
metadata:
  id: execute-upgrade
  version: 1.0.0
  status: active
  risk: high
  input-schema: schemas/input.schema.json
  output-schema: schemas/output.schema.json
---

# Purpose
Apply a READY plan to the client in small, checkpointed, verified steps — the only
skill permitted to mutate the client, and only through the client-mutation gate.

# Trigger conditions
- A ready plan exists and mutation is permitted.

# Exclusions
- Refuses to run without a ready plan and a rollback checkpoint.
- Does not perform uncontrolled deep research while the client is partially modified.

# Preconditions (client-mutation gate — see `tools/skills/lib/engine.js#mutationGate`)
- Plan status READY (or policy-permitted READY_WITH_ASSUMPTIONS).
- Required capabilities available; blocking (HIGH/CRITICAL) uncertainty resolved.
- Rollback checkpoint exists; baseline recorded; repository status known; action is in the plan.

# Required capabilities
`repository-version-control`, `create-git-checkpoint`, `restore-nuget-dependency-graph`, `build-dotnet` (Level 1).

# Optional capabilities
`run-tests`, `acquire-npm-package`.

# Inputs
See `schemas/input.schema.json` — planRef, run directory, approved step list.

# Procedure
1. Verify repository state matches the plan.
2. Create a rollback boundary (branch/worktree/checkpoint); record uncommitted changes, manifests, lockfiles, baseline build/test.
3. Set an execution checkpoint.
4. Apply changes in small logical groups; record every changed file and the plan step that caused it; validate after each group.
5. Do not combine unrelated fixes; do not ignore failing commands; do not leave untracked experiments; do not repeat mutating actions without idempotency/rollback.
6. Update `state.json` after every step; save tool outputs as artifacts.

# On unexpected HIGH/CRITICAL uncertainty
Pause mutation → save checkpoint → record changed files + build/test evidence → add to `uncertainty-register.yaml` → set status `RESEARCH_REQUIRED` → invoke `research-version` in isolated storage → update the plan → resume only when the plan is READY again.

# Evidence requirements
Each change references its plan step; each verification records command + exit code + artifact.

# Completion criteria
All planned changes applied and verified, or a bounded partial with escalation. Status one of the registry completion statuses. Documentation status updated.

# Retry behavior
Delegates fix retries to `investigate-build-failure` (bounded by `config/escalation-policy.yaml`).

# Escalation behavior
Public-API/destructive/security changes → BLOCKED_NEEDS_APPROVAL; budget → FAILED_BUDGET; unresolved blocker → `developer-escalation`.

# Outputs
See `schemas/output.schema.json` — package/source/config/migration/front-end changes, changed-file inventory, attempted/reverted fixes, build/test/runtime results, documentation status, remaining uncertainty, current checkpoint, nextAction.

# Allowed next skills
`investigate-build-failure`, `audit-frontend-integration`, `research-version`, `learn-from-run`, `developer-escalation`.

# Prohibited behavior
No mutation without the gate open. No target-package installation as "research". No candidate knowledge as authoritative.

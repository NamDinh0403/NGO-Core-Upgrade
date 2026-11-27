---
name: execute-upgrade
description: Automatically applies an engine-registered, evidence-backed Core upgrade plan, including client EF migration and SQL generation.
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
2. Create a rollback boundary (branch/worktree/checkpoint); record uncommitted changes, manifests, lockfiles, baseline build and optional-test disposition.
3. Set an execution checkpoint.
4. Apply changes in small logical groups; record every changed file and the plan step that caused it; validate after each group.
5. Do not combine unrelated fixes; do not ignore failing commands; do not leave untracked experiments; do not repeat mutating actions without idempotency/rollback.
6. Update `state.json` after every step; save tool outputs as artifacts.
   Use existing commands, not new test/probe files; unit suites default to
   SKIPPED with a reason. Do not rerun unchanged successful restore/build
   commands just to populate reports.
7. After a successful target build, automatically generate/review the client EF
   migration, snapshot and SQL script under the registered plan. Follow
   [autonomous migration policy](../../AGENTS.md#autonomous-upgrades-and-ef-migrations)
   and `knowledge/canonical/migrations/ef-migration-patterns.json`. No separate
   generation approval; no database application. Reuse matching output on resume,
   inspect destructive/data-precondition risks and rebuild generated code.

# On unexpected HIGH/CRITICAL uncertainty
Pause mutation → save checkpoint → record changed files + build/test evidence → add to `uncertainty-register.yaml` → set status `RESEARCH_REQUIRED` → invoke `research-version` in isolated storage → update the plan → resume only when the plan is READY again.

# Evidence requirements
Each change references its plan step; each verification records command + exit code + artifact.

# Completion criteria
All planned changes applied and verified, or a bounded partial with escalation. Status one of the registry completion statuses. Documentation status updated.

# Retry behavior
Delegates fix retries to `investigate-build-failure` (bounded by `config/escalation-policy.yaml`).

# Escalation behavior
Client public-contract/business/security/auth changes, destructive migration
acceptance or database application → BLOCKED_NEEDS_APPROVAL; budget → FAILED_BUDGET;
unresolved blocker → `developer-escalation`. Routine installed-Core API adaptations
and migration/SQL generation/review do not require separate approval. Scope a
blocker to affected work and continue independent safe in-plan steps where permitted.

# Outputs
See `schemas/output.schema.json` — package/source/config/migration/front-end changes, changed-file inventory, attempted/reverted fixes, build/test/runtime results, documentation status, remaining uncertainty, current checkpoint, nextAction.

# Allowed next skills
`investigate-build-failure`, `audit-frontend-integration`, `research-version`, `learn-from-run`, `developer-escalation`.

# Prohibited behavior
No mutation without the gate open. No target-package installation as "research". No candidate knowledge as authoritative.

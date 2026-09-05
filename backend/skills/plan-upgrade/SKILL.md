---
name: plan-upgrade
description: Creates a read-only evidence-based Core upgrade plan.
metadata:
  id: plan-upgrade
  version: 1.0.0
  status: active
  risk: low
  input-schema: schemas/input.schema.json
  output-schema: schemas/output.schema.json
---

# Purpose
Produce a read-only, evidence-based upgrade plan and an uncertainty register before
any client mutation. This skill is the mandatory first step of every run.

# Trigger conditions
- A new Core upgrade is requested.
- An interrupted run has no valid plan.
- Material evidence changes the current plan.
- Execution discovered high-impact uncertainty and must replan.

# Exclusions
- Do not use to modify the client (see the client-mutation gate in `config/` / `tools/skills/lib/engine.js`).
- Do not use to install target packages, run migrations, or apply fixes.

# Preconditions
- A run directory exists: `runs/<client>/<run-id>/`.
- `doctor` reports `READY_FOR_PLANNING` (Level 0/1 only; optional tools may be absent).

# Required capabilities
`read-repository`, `search-repository`, `inspect-approved-knowledge`, `create-plan` (all Level 0).

# Optional capabilities
`inspect-nuget-metadata`, `inspect-npm-registry-metadata` (used only if cheaply available).

# Inputs
See `schemas/input.schema.json` — objective, client id, source/target version, run directory.

# Procedure
1. Inspect the repository read-only; detect backend/front-end technologies, projects, package managers, lockfiles, bootstrap style. Write `repository-inventory.json`.
2. Identify source and target Core versions.
3. Inspect approved knowledge (`knowledge/canonical/versions/{target}.json` + routes). Note known vs missing version knowledge.
4. When resuming, read current run `state.json`.
5. Classify every planning fact as KNOWN / ASSUMED / UNCERTAIN / CONTRADICTORY / NOT_APPLICABLE. KNOWN facts cite evidence.
6. Populate `uncertainty-register.yaml` and `assumptions.yaml` (see `docs/operations/uncertainty.md`).
7. Decide whether `research-version` is required (missing/contradictory/insufficient knowledge, or HIGH/CRITICAL uncertainty). If `knowledge/canonical/versions/{target}.json` does not exist at all **and** `coreRepoPath` is configured (`config/core-repository.yaml`), this is exactly the condition `research-version` rung 10.5 (`ingest-core-release`) exists for — route to `research-version` rather than escalating straight to a developer for missing version data.
8. Compute **only** the capabilities the plan actually needs (lazy activation). Defer Level 2/3 tools until proven necessary.
9. Produce a verification strategy and a rollback strategy.
10. Write `plan.yaml` and `planning-report.md`. Emit an exact next action.

# Evidence requirements
Every KNOWN fact references a file/route/tool artifact. Assumptions state validation method, impact, and whether they block mutation.

# Uncertainty handling
HIGH/CRITICAL open uncertainty blocks the affected mutation and cannot be auto-accepted. Record all uncertainty in `uncertainty-register.yaml`.

# Completion criteria
`plan.yaml` + `uncertainty-register.yaml` exist and validate; status is one of READY, READY_WITH_ASSUMPTIONS, RESEARCH_REQUIRED, BLOCKED_NEEDS_CONTEXT, BLOCKED_NEEDS_DEVELOPER, FAILED_POLICY. Mutation is permitted only for READY or policy-permitted READY_WITH_ASSUMPTIONS.

# Retry behavior
Re-planning is safe and idempotent; supersede the previous plan, never delete resolved uncertainty history.

# Escalation behavior
If required client information is missing → BLOCKED_NEEDS_CONTEXT; if a decision needs business context → BLOCKED_NEEDS_DEVELOPER; both hand off to `developer-escalation`.

# Outputs
See `schemas/output.schema.json` — status, plan, planRef, uncertaintyRegisterRef, requiredCapabilities, deferredCapabilities, nextAction, evidence.

# Allowed next skills
`research-version`, `analyze-client-impact`, `execute-upgrade`, `ingest-core-release`
(when resuming after candidate version knowledge changes the plan), `developer-escalation`.

# Prohibited behavior
No client file changes. No claiming compatibility without evidence. No installing specialist tools speculatively.

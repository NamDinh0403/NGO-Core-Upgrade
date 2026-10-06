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
Follow the engine's shared planning procedure first; this skill supplies backend behavior only.
1. Inspect .NET solution/projects, SDK, NuGet dependency graph and installed NGO.Core assemblies/public API. Write backend inventory and surface evidence.
2. Interpret the backend slice and approved .NET version/symbol/error knowledge; request isolated package/API research only for unresolved compatibility. Missing Core release evidence returns to the shared owner, never independent ingestion.
3. Map backend source, EF/migration and all startup-required appsettings changes to exact API/WebJob/Deployment files, preserving client values and secret-provider use.
4. Produce backend changes, restore/build/test/config/migration validation and rollback facts. Register the implementation plan with the engine; do not assign global lifecycle status locally.

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

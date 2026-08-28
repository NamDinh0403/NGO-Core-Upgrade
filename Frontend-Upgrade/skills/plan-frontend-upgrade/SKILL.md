---
name: plan-frontend-upgrade
description: Produce a complete read-only plan with exact files and evidence before any mutation.
metadata:
  id: plan-frontend-upgrade
  version: 1.0.0
  status: active
  risk: low
  input-schema: schemas/input.schema.json
  output-schema: schemas/output.schema.json
---

# Purpose

Produce a complete, read-only plan before any client mutation. The plan is the
mutation contract: every change cites exact files and evidence.

# Trigger conditions

Requirement mapping complete; no READY plan exists.

# Exclusions

Read-only. Writing the plan never modifies the client or Core.

# Preconditions

`package-alignment-map.yaml`, `frontend-requirement-map.yaml`, and the client
semantic graph exist.

# Required capabilities

`create-plan`, `create-uncertainty-records`, `validate-json-schema`.

# Inputs

See `schemas/input.schema.json`.

# Procedure

Assemble `plan.yaml`, `planning-report.md`, `assumptions.yaml`, and
`uncertainty-register.yaml` containing: request summary; client and Core identity;
source/target versions; exact target package alignment; workspace classification;
applications/libraries; bootstrap style; client semantic coverage; Core target
requirements; requirement-to-client mappings; common integration changes; feature
and extension changes; environment/runtime config changes; module/provider
changes; route changes; TypeScript changes; asset/style/script changes; HTML
changes; test/build changes; deployment/pipeline changes; assumptions;
uncertainty; contradictions; risks; rollback strategy; verification strategy;
documentation requirements; and the exact next action.

Each planned change includes: change ID, Core requirement ID, semantic role,
target client project, exact client files, authoritative implementation point,
current state, target state, reason, Core evidence, client evidence, uncertainty
IDs, risk, mutation phase, validation, and status.

Separate Work group A (common integration) from Work group B (client
customizations). Work group A is planned and aligned before broad Work group B
adaptation.

# Evidence requirements

Reject vague actions ("update environment", "check AppModule", "fix routes",
"update tsconfig", "compare JSON", "inspect assets", "align with Core"). Every
change must be specific and evidence-backed.

# Uncertainty behavior

HIGH/CRITICAL open uncertainties prevent a READY status for affected changes. The
plan may end READY, READY_WITH_ASSUMPTIONS, RESEARCH_REQUIRED,
BLOCKED_NEEDS_CONTEXT, BLOCKED_NEEDS_DEVELOPER, or FAILED_POLICY.

# Completion criteria

`plan.yaml` validates against `schemas/plan.schema.json`; every change has exact
files and evidence; status is set.

# Retry behavior

Idempotent; re-planning overwrites the draft plan.

# Escalation behavior

`BLOCKED_*` routes to `developer-escalation`.

# Outputs

See `schemas/output.schema.json`. Mutation is allowed only for READY or
policy-approved READY_WITH_ASSUMPTIONS.

# Allowed next skills

`execute-frontend-upgrade`, `developer-escalation`.

# Prohibited behavior

No mutation. No vague actions. No change without exact files and evidence.

# Evaluations

See `evals/`. Covers plan-with-exact-files, vague-plan-rejected, and
execution-requires-READY.

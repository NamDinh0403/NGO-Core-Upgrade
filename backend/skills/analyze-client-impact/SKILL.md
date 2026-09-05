---
name: analyze-client-impact
description: Maps version and package changes to actual client source and configuration (read-only by default).
metadata:
  id: analyze-client-impact
  version: 1.0.0
  status: active
  risk: low
  input-schema: schemas/input.schema.json
  output-schema: schemas/output.schema.json
---

# Purpose
Turn abstract version/package changes into a concrete, evidence-backed map of the
client files, symbols, and configuration roles that must adapt.

# Trigger conditions
- A plan needs the concrete client impact of a version change.

# Exclusions
- Read-only unless invoked under an explicitly approved mutation phase.

# Preconditions
- A plan exists; version knowledge (approved or researched) is available.

# Required capabilities
`read-repository`, `search-repository` (Level 0).

# Optional capabilities
`scan-csharp-symbols`, `scan-typescript-symbols`, `inspect-angular-workspace` (Level 2, only if needed).

# Inputs
See `schemas/input.schema.json` — version delta / candidate compatibility manifest, run directory.

# Procedure
1. **Backend:** inspect project/package references, target frameworks, changed/removed symbols, constructor/method signature changes, DI registration, options/config binding, EF setup, serialization, auth integration, migration requirements, startup/hosting, deployment config, tests.
2. **Front-end (semantic roles, not fixed filenames):** package manifest, lockfile, workspace config, bootstrap, root NgModule OR standalone app config, global providers, root routes, environment/runtime config, root/app/test tsconfig, polyfills, assets, styles, scripts, proxy, prod/dev build config, test config, service worker, custom builders, workspace libraries.
3. Classify the Angular project as NGMODULE / STANDALONE / HYBRID / UNKNOWN. Do not assume `app.module.ts` exists.
4. Resolve actual paths via `angular.json`, tsconfig inheritance, file replacements, bootstrap imports, project definitions.
5. Produce a structured client-impact map with per-item risk, evidence, and verification requirements.

# Evidence requirements
Each affected file/symbol/role cites the evidence that flagged it (metadata diff, symbol scan, config resolution).

# Uncertainty handling
Record newly-discovered uncertainty; if a HIGH/CRITICAL item appears, mark RESEARCH_REQUIRED and return to `plan-upgrade`.

# Completion criteria
A `client-impact-map` exists covering backend + front-end roles with statuses; status is SUCCEEDED / SUCCEEDED_WITH_WARNINGS / RESEARCH_REQUIRED / BLOCKED_NEEDS_DEVELOPER.

# Retry behavior
Re-run is safe (read-only).

# Escalation behavior
Missing client context for a role → `developer-escalation` (BLOCKED_NEEDS_CONTEXT/DEVELOPER).

# Outputs
See `schemas/output.schema.json` — affected files, symbols, config roles, expected adaptations, risk, evidence, verification requirements, uncertainty, bootstrapStyle, nextAction.

# Allowed next skills
`plan-upgrade`, `execute-upgrade`, `developer-escalation`.

# Prohibited behavior
No client mutation in the default (analysis) mode.

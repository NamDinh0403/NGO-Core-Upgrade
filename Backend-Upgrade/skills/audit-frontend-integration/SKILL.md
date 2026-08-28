---
name: audit-frontend-integration
description: Verifies front-end integration completeness via a semantic configuration graph, not only files that errored.
metadata:
  id: audit-frontend-integration
  version: 1.0.0
  status: active
  risk: medium
  input-schema: schemas/input.schema.json
  output-schema: schemas/output.schema.json
---

# Purpose
After front-end changes, verify the whole integration by building a semantic
front-end configuration graph and resolving every role — not just files that failed to compile.

# Trigger conditions
- Front-end package or source changes were applied, or a front-end client needs post-change verification.

# Exclusions
- Must not inspect only files that produced compiler errors.
- Must not report success solely because `npm install` succeeded.

# Preconditions
- A front-end client is present (package.json / angular.json detected).

# Required capabilities
`read-repository`, `inspect-angular-workspace` (activated when Angular is present).

# Optional capabilities
`typecheck-typescript`, `build-angular-development`, `build-angular-production`, `run-tests`.

# Inputs
See `schemas/input.schema.json` — run directory, workspace root, changed files.

# Procedure
1. Build the semantic graph: `angular.json`, `package.json`, lockfile, bootstrap entry, AppModule OR standalone config, global providers, routes, environment/runtime config, tsconfig inheritance, build configs, file replacements, assets, styles, scripts, tests, service worker, custom builders, workspace libraries, peer deps.
2. Classify bootstrap style and apply the matching checklist:
   - `checklists/angular-ngmodule.md` (root module imports, providers, `forRoot()`, HTTP, interceptors, state, i18n, animations, initializers, error handlers).
   - `checklists/angular-standalone.md` (`bootstrapApplication`, app config, provider functions, `importProvidersFrom`, routes, HTTP, interceptors, state, initializers, zone).
   - `checklists/generic-typescript.md` (tsconfig graph, type-check, build).
3. Mark every semantic role: RESOLVED_AND_INSPECTED / NOT_APPLICABLE_WITH_EVIDENCE / MISSING_BLOCKING / MISSING_NON_BLOCKING / REQUIRES_DEVELOPER.
4. Run available verification: dependency resolution, type check, framework compilation, dev build, prod build, tests, bootstrap smoke, routing smoke, asset/config checks.

# Evidence requirements
Each role status cites the resolved path/evidence. Verification records commands + results.

# Uncertainty handling
A MISSING_BLOCKING or REQUIRES_DEVELOPER role blocks pass; record uncertainty and escalate or research.

# Completion criteria
No unresolved required semantic role; required verifications pass. Status SUCCEEDED / SUCCEEDED_WITH_WARNINGS / RESEARCH_REQUIRED / BLOCKED_NEEDS_DEVELOPER.

# Retry behavior
Re-run is safe (read + verification).

# Escalation behavior
Unresolved required role or failing prod build with unknown cause → `developer-escalation` / `research-version`.

# Outputs
See `schemas/output.schema.json` — workspace structure, bootstrap style, resolved roles, package compatibility, provider/module findings, environment findings, TypeScript findings, build/test/runtime results, remaining uncertainty, nextAction.

# Allowed next skills
`execute-upgrade`, `research-version`, `learn-from-run`, `developer-escalation`.

# Prohibited behavior
No "pass" with unresolved required roles. No install-only success.

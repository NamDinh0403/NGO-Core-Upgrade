---
name: inventory-client-frontend
description: Recursively inventory the client front-end and classify its structure.
metadata:
  id: inventory-client-frontend
  version: 1.0.0
  status: active
  risk: low
  input-schema: schemas/input.schema.json
  output-schema: schemas/output.schema.json
---

# Purpose

Recursively inventory the client repository and build a semantic map of where
every integration concern lives. Do not assume a standard Angular layout.
Implemented deterministically by `tools/lib/inventory.js`.

# Trigger conditions

Doctor returned `READY_FOR_INVENTORY` and no client inventory exists yet.

# Exclusions

Read-only. No mutation, no install, no Core access.

# Preconditions

Valid client repository confirmed by `validate-local-repositories`.

# Required capabilities

`read-client-repository`, `search-repository`, `parse-angular-workspace`,
`resolve-typescript-inheritance`.

# Inputs

See `schemas/input.schema.json`.

# Procedure

1. Recursively walk the client (skipping `node_modules`, `dist`, `.git`, runs).
2. Discover, by conventional filename, pattern, workspace reference, TypeScript
   import/`extends` traversal, Angular `fileReplacements`, runtime references,
   module/provider registration, route composition, assets/styles/scripts, and
   build scripts: package manifests, lockfiles, package-manager config,
   `angular.json`, projects, `main.ts`, bootstrap, `AppModule`, standalone
   config, routing modules, route services, dynamic route factories, environment
   services, compile-time environment files, runtime JSON config, `assets/config`,
   `APP_INITIALIZER`/`provideAppInitializer`, tsconfig inheritance, polyfills,
   `index.html`, global/package styles, fonts, skins, themes, scripts, web
   manifest, browser config, icons, test bootstrap/config, service worker, proxy
   config, custom builders, workspace libraries, deployment scripts, CI/CD.
3. Classify the workspace: `NGMODULE`, `STANDALONE`, `HYBRID`, or `UNKNOWN`.
4. Determine the bootstrap style (`bootstrapModule` vs `bootstrapApplication`).
5. Classify configuration sources (`COMPILE_TIME`, `BUILD_TIME_REPLACEMENT`,
   `RUNTIME_STATIC_ASSET`, `RUNTIME_REMOTE`, `DEPLOYMENT_SUBSTITUTED`,
   `GENERATED`, `UNKNOWN`).
6. Compute semantic coverage: every role is `PRESENT` or `ABSENT_WITH_EVIDENCE`.

# Evidence requirements

Every discovered role lists the exact client-relative file paths that satisfy it.

# Uncertainty behavior

An absent role is recorded as inspected-and-absent, never as unknown. Genuinely
ambiguous bootstrap/workspace classification is recorded as `UNKNOWN` with
evidence rather than guessed.

# Completion criteria

`frontend-file-inventory.json`, `frontend-semantic-graph.json`, and
`frontend-coverage.yaml` are written.

# Retry behavior

Idempotent; safe to re-run.

# Escalation behavior

If the workspace cannot be classified at all, route to `developer-escalation`.

# Outputs

See `schemas/output.schema.json`.

# Allowed next skills

`inspect-local-core`, `developer-escalation`.

# Prohibited behavior

No mutation. No Core access. No assumption of a fixed Angular structure.

# Evaluations

See `evals/`. Covers NgModule, standalone, hybrid, `app-environment.service.ts`,
`assets/config` runtime JSON, and nonstandard file locations.

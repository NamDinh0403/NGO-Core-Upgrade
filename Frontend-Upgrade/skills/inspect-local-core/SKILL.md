---
name: inspect-local-core
description: Scoped, read-only inspection of the local NGO Core repository.
metadata:
  id: inspect-local-core
  version: 1.1.0
  status: active
  risk: low
  input-schema: schemas/input.schema.json
  output-schema: schemas/output.schema.json
---

# Purpose

Inspect the local Core repository (or a read-only target worktree) for target
integration evidence, scoped by the client inventory. Do not scan every Core
file blindly into context. Implemented by `tools/lib/inspect-core.js`.

# Trigger conditions

Client inventory exists and Core inspection has not run.

# Exclusions

Absolutely read-only against Core. No writes, installs, branch switches, resets,
or migrations. When the target ref differs from the current checkout, a read-only
`git worktree` is created OUTSIDE both repositories under
`runs/<client>/<run-id>/research/core-target/`; the developer's Core working tree
is never switched.

# Preconditions

Doctor recorded the Core git identity and target commit. A Core fingerprint was
captured before inspection.

# Required capabilities

`read-core-repository`, `search-repository`. Optional:
`create-readonly-core-worktree`.

# Inputs

See `schemas/input.schema.json`.

# Procedure

1. Use the client inventory to scope which Core files to inspect (only roles the
   client actually uses).
2. Discover relevant Core files and relationships: target `package.json`,
   lockfile, Angular workspace, root bootstrap, root `AppModule`/standalone
   config, root routes and route services, environment definitions and config
   services, `assets/config`, tsconfig, package publishing config, public exports
   and declarations, modules, providers, feature flags, initializers, icons,
   assets, styles, skins, themes, manifests, HTML templates, tests, and
   migrations/schematics.
3. For each client integration point, inspect the equivalent target Core
   implementation and its public declarations.
3a. Capture the Core **reference host application** (the target `src/app` app
   module, route service, routing module, environment service, environment
   files, `main.ts`, `index.html`, global styles, polyfills) as a COMPLETE
   structural baseline. Record every module import, provider, route, guard,
   runtime/config key, and icon registration it contains — including elements
   that are NEW in the target and not yet present in the client. Write these to
   `core-host-app-baseline.yaml`. This baseline is NOT scoped away by current
   client usage; newly-added reference-app elements are candidate adoptions.
4. Do not blindly clone Core. But DO surface every element of the reference
   host-app baseline that the client lacks as a candidate adoption WITH evidence,
   and distinguish those shared reference-app deltas from unrelated Core features
   the client legitimately omits (a genuinely unused, non-baseline feature).
5. After inspection, re-capture the Core fingerprint and verify it is unchanged.

# Evidence requirements

Every scoped Core file is recorded with its Core-relative path and, where read at
a specific commit, the commit sha.

# Uncertainty behavior

Requirements are seeded as `REQUIRES_RESEARCH` placeholders where evidence is
pending; nothing is asserted without a Core source reference.

# Completion criteria

`core-file-inventory.json`, `core-semantic-graph.json`,
`core-target-requirements.yaml`, and `core-host-app-baseline.yaml` are written,
and Core is verified unchanged.

# Retry behavior

Idempotent; safe to re-run. Worktrees are removed after use.

# Escalation behavior

If Core changes during inspection, record a failure and route to
`developer-escalation`.

# Outputs

See `schemas/output.schema.json`.

# Allowed next skills

`resolve-target-packages`, `developer-escalation`.

# Prohibited behavior

No blind full-tree LLM scans. No Core mutation. No adding a genuinely unused,
non-baseline Core feature. (Reference host-app baseline elements the client lacks
are NOT "unused features" — they are candidate adoptions and must be surfaced.)

# Evaluations

See `evals/`. Covers scoped inspection, target-ref worktree, and Core-unchanged
verification.

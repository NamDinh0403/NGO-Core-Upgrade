---
name: derive-release-requirements
description: Normalize canonical release requirements and Core findings into semantic requirements, not direct patches.
metadata:
  id: derive-release-requirements
  version: 1.0.0
  status: active
  risk: low
  input-schema: schemas/input.schema.json
  output-schema: schemas/output.schema.json
---

# Purpose

Normalize Core findings into semantic requirements that describe **what** is
required, not **where** the client implements it. A Core record must never
translate directly into "edit environment.ts" or "add route to
app-routing.module.ts".

# Trigger conditions

Core inspection produced a requirements scaffold that must be normalized.

# Exclusions

Read-only. Produces no client edits and no direct patches.

# Preconditions

`core-target-requirements.yaml` scaffold exists; package alignment resolved.

# Required capabilities

`read-core-repository`, `inspect-configuration`.

# Inputs

See `schemas/input.schema.json`.

# Procedure

1. For each Core finding, emit a requirement with: requirement ID, target
   version, category, description, applicability conditions, possible
   implementation roles, package/symbol, module/provider, configuration key,
   route, asset/style/script, evidence source, verification, risk, and confidence.
2. Use the requirement categories: package, peer dependency, compiler option,
   Angular compiler option, environment key, runtime configuration key, module,
   provider, initializer, route, icon, asset, font, skin, theme, style, script,
   polyfill, manifest, HTML structure, test configuration, build configuration,
   service worker, deployment, CI/CD.
3. Never bind a requirement to a specific client file — that is the mapping
   skill's job.
4. Mark requirements with insufficient evidence as `REQUIRES_RESEARCH`.

# Evidence requirements

Every requirement cites a Core evidence source (file and, where relevant, symbol
or key).

# Uncertainty behavior

Requirements without adequate Core evidence stay `REQUIRES_RESEARCH` and do not
progress to mapping as actionable.

# Completion criteria

`core-target-requirements.yaml` contains normalized, schema-valid requirements.

# Retry behavior

Idempotent.

# Escalation behavior

If Core evidence is contradictory, route to `developer-escalation`.

# Outputs

See `schemas/output.schema.json`.

# Allowed next skills

`map-core-to-client`, `developer-escalation`.

# Prohibited behavior

No direct patches. No binding to client files. No unevidenced requirements.

# Evaluations

See `evals/`. Covers requirement normalization and rejection of direct-patch
records.

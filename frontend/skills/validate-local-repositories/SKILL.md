---
name: validate-local-repositories
description: Dual-repository, non-mutating doctor for the client and the local NGO Core repository.
metadata:
  id: validate-local-repositories
  version: 1.0.0
  status: active
  risk: low
  input-schema: schemas/input.schema.json
  output-schema: schemas/output.schema.json
---

# Purpose

Run a single non-mutating preflight over **both** repositories in one process:
the mutable client front-end and the read-only local NGO Core repository. Confirm
each repository is valid, detect cross-repository contradictions, and return
exactly one terminal status plus an exact next action.

This skill is implemented deterministically by `tools/lib/doctor.js` and invoked
by `frontend-upgrade-agent doctor` and the first stage of `start`.

# Trigger conditions

- A run is starting and no doctor status is recorded.
- The developer explicitly runs `frontend-upgrade-agent doctor`.

# Exclusions

This skill must **not**:
- install target packages into the client,
- delete `node_modules` or lockfiles,
- change `package.json` or `.npmrc`,
- edit, reset, branch-switch, or write into the Core repository,
- run package migrations, or perform any upgrade fix.

# Preconditions

- A request exists with client path, Core path, source version, and target
  version (or Core target ref).

# Required capabilities

`read-client-repository`, `read-core-repository`, `parse-package-json`,
`parse-angular-workspace`. Optional: `repository-version-control`.

# Inputs

See `schemas/input.schema.json`.

# Procedure

1. **Validate the request** structurally (paths, versions present, target exact).
2. **Validate the client repository**: path exists/readable; git detectable;
   `package.json` valid; lockfile + package manager identified; Angular workspace
   detected where applicable; NGO Core reference found; source version confirmed
   or reported contradictory; rollback strategy available.
3. **Validate the Core repository**: path exists/readable; identity plausible;
   `package.json` exists; target package identity present; current branch/commit
   recorded; target ref/commit resolved read-only; required source directories
   discoverable; package version agrees with the requested target; inspectable
   without modification.
4. **Probe prerequisites**: Node.js, git, and the client package manager.
5. **Detect contradictions**: identical/overlapping client and Core paths; Core
   path is actually a client; client source declaration mismatch; Core target
   mismatch; target tag version drift; client lockfile drift; Core uncommitted
   changes.
6. **Resolve exactly one terminal status** and an **exact next action**.

# Evidence requirements

Every check records a concrete detail (path, version, commit, branch, filename).
Contradictions record both conflicting values.

# Uncertainty behavior

Version contradictions become `BLOCKED_VERSION_MISMATCH`. A missing client Core
reference becomes `BLOCKED_NEEDS_DEVELOPER`. Nothing is assumed.

# Completion criteria

A `doctor-report.json` conforming to `schemas/doctor-report.schema.json` is
written and one terminal status is set. `READY_FOR_INVENTORY` permits the run to
continue to `inventory-client-frontend`.

# Retry behavior

Idempotent and read-only; safe to re-run at any time.

# Escalation behavior

Any `BLOCKED_*` status routes to `developer-escalation` with the exact next
action.

# Outputs

See `schemas/output.schema.json`.

# Allowed next skills

`inventory-client-frontend`, `developer-escalation`.

# Prohibited behavior

No mutation of either repository. No installation. No branch switching. No
writes into Core.

# Evaluations

See `evals/`. Covers valid paths, missing client path, missing Core path,
identical paths, nested paths, version match, version contradiction, and target
ref divergence.

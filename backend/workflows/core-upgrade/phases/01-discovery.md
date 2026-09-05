# Phase 01 — Discovery

- **Phase ID:** `01-discovery`
- **State:** `DISCOVERY`

## Purpose
Establish the run identity and the facts needed to plan, without modifying anything.

## Required inputs
- User request naming the target Core version.
- Access to the client solution working tree.

## Preconditions
- A run directory `runs/<sanitized-client-id>/<run-id>/` is created.
- `request.json` written and valid against `schemas/run-request.schema.json`.

## Required actions
1. Detect solution/project files, current `NGO.Core.*` versions, and target version.
2. Compute the upgrade path (see `knowledge/derived/version-changes/changelog.md` planner). If the target version is not listed there **and** no `knowledge/canonical/versions/<target>.json` exists: this is not automatically a hard block — record `versionKnowledgeStatus: "missing"` in `inventory.json`/`state.json` and continue. `PLAN` will route to `research-version` (which can reach `ingest-core-release` at rung 10.5 when `coreRepoPath` is configured, per `config/core-repository.yaml`). Only escalate `BLOCKED_NEEDS_CONTEXT` here if the target version string itself is not a plausible Core release (fails to parse as `x.y.z`, or the client explicitly confirms no such Core version exists) — do not block Discovery purely because knowledge hasn't been authored yet.
3. Write `inventory.json` (projects, packages, frameworks, presence of DbContext, presence of test projects).
4. Initialize `state.json` (status `DISCOVERY`) from `templates/upgrade-state.template.json` extended per `schemas/run-state.schema.json`.
5. If a prior `runs/<client>/<run-id>` exists and is incomplete, resume from its last checkpoint instead of re-detecting.

## Allowed tools
Read-only repository inspection, package/version detection. No builds, no edits, no decompile.

## Required evidence
`inventory.json`, detected versions recorded in `observations.jsonl`.

## Required outputs
`request.json`, `inventory.json`, `state.json`.

## Completion criteria
All outputs exist and validate; `nextAction = "Load phases/02-baseline.md"`.

## Documentation responsibilities
Record detected source/target versions and upgrade path in `state.json`.

## Checkpoint requirements
Write a checkpoint after `inventory.json` is produced and before leaving the phase.

## Retry behaviour
Detection failures are `RETRYABLE_FAILURE` up to policy budget.

## Escalation conditions
- No solution/project file → `BLOCKED_NEEDS_CONTEXT`.
- Target version string does not parse as a plausible Core release, or is confirmed not to exist → `BLOCKED_NEEDS_CONTEXT`.
- Target package version unavailable from configured sources → `BLOCKED_NEEDS_DEVELOPER`.

## Allowed next states
`BASELINE`, or `HANDOVER` on a blocked status.

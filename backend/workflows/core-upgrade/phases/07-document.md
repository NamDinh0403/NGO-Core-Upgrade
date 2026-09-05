# Phase 07 — Document

- **Phase ID:** `07-document`
- **State:** `DOCUMENT`

## Purpose
Produce the mandatory developer-facing documentation. **A run cannot be COMPLETE without this.**

## Required inputs
`changed-files.json`, `test-results.json`, config changes, unresolved issues, decisions.

## Preconditions
Build succeeded and tests captured (or blocked path routed here to document a partial/blocked outcome).

## Required actions
1. Write `upgrade-report-YYYY-MM-DD.md` at the solution root using `templates/client-upgrade-report.md` (superset of the legacy report template), including a **Deviations from Plan** section.
2. Document configuration changes, breaking changes, deployment implications, unresolved issues, and developer decisions.
3. Write `documentation-status.json` and set every required item (see `config/quality-gates.yaml`).
4. For each unresolved item, emit `templates/unresolved-issue.md`.

## Allowed tools
File writes of documentation only.

## Required evidence
The run artifacts referenced by the report.

## Required outputs
`upgrade-report-YYYY-MM-DD.md`, `documentation-status.json`, any `unresolved-issue` files.

## Completion criteria
Report exists at solution root AND `documentation-status.json` has all required items true. If implementation is done but docs are incomplete, set status `DOCUMENTATION_PENDING` (never `COMPLETE`).

## Documentation responsibilities
This phase *is* the documentation gate.

## Checkpoint requirements
Checkpoint after the report and status file exist.

## Retry behaviour
Missing content is completed here, not skipped.

## Escalation conditions
- Required client business context missing for a decision to document → `BLOCKED_NEEDS_CONTEXT`.

## Allowed next states
`HANDOVER`, or `COMPLETE` (only via Handover's final gate).

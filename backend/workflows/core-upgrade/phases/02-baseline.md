# Phase 02 — Baseline

- **Phase ID:** `02-baseline`
- **State:** `BASELINE`

## Purpose
Record the pre-change state of the solution so regressions introduced by the upgrade are detectable.

## Required inputs
`inventory.json`, `state.json` from Discovery.

## Preconditions
Discovery completed with `SUCCEEDED`.

## Required actions
1. Attempt a baseline `dotnet restore` + `dotnet build --no-restore`; capture result (may already fail — record honestly).
2. Record tests SKIPPED with the reason by default, even if a test project exists.
   Run existing targeted tests only when explicitly requested or needed to
   diagnose a concrete regression; apply the configured timeout when run.
3. Write `baseline` block into `state.json` and a `baseline-build.log` artifact.

## Allowed tools
`dotnet restore`, `dotnet build`, test runner. No source edits.

## Required evidence
`baseline-build.log`, test disposition/reason (or output if explicitly run).

## Required outputs
`state.json.baseline` populated.

## Completion criteria
Baseline build and optional-test disposition captured; `nextAction = "Load phases/03-plan.md"`.

## Documentation responsibilities
Baseline build/test status feeds the report's "before" column.

## Checkpoint requirements
Checkpoint after baseline capture.

## Retry behaviour
Transient tool failure is `RETRYABLE_FAILURE`; a failing baseline build is **not** a failure of this phase.

## Escalation conditions
- Build tooling cannot be executed/installed → `BLOCKED_NEEDS_DEVELOPER`.
- The baseline test run exceeds its timeout or never returns an exit code → kill the process, record the hang as evidence (do not treat as a passing baseline), and escalate `BLOCKED_NEEDS_DEVELOPER` with the evidence that the test harness is unresponsive.

## Allowed next states
`PLAN`, or `HANDOVER`.

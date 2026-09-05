# Phase 06 — Test

- **Phase ID:** `06-test`
- **State:** `TEST`

## Purpose
Verify the upgraded build and apply required EF migrations.

## Required inputs
Green build, routed `knowledge/canonical/migrations/ef-migration-patterns.json`.

## Preconditions
Build succeeded.

## Required actions
1. If a `DbContext` exists, run the EF migration per the migration pattern. Treat "no changes detected" as success.
2. Run the client's test suite if present (same timeout as baseline: `config/quality-gates.yaml#gates.tests-run.timeoutSeconds`); capture `test-results.json`. A hung/non-terminating run is not a silent pass — kill it, record the evidence, and escalate `BLOCKED_NEEDS_DEVELOPER`. If no test project exists, record `noTests: true` and pass.
3. Compare against the baseline: if tests that passed at baseline now fail, treat as a regression. Increment `state.json.testRegressionLoopCount` and record which test(s) regressed and after which fix, so a repeat regression on the same test is detectable.

## Allowed tools
`dotnet ef`, test runner.

## Required evidence
EF migration output, `test-results.json`.

## Required outputs
`test-results.json`, EF migration result recorded in `state.json`.

## Completion criteria
EF migration attempted (where applicable) and tests captured with no new regressions; `nextAction = "Load phases/07-document.md"`.

## Documentation responsibilities
Test and EF results feed the report and `documentation-status.json`.

## Checkpoint requirements
Checkpoint before EF migration (side effect) and after results received.

## Retry behaviour
"No DbContext found" / "build failed" follow the migration pattern's retry rules.

## Escalation conditions
- Destructive DB migration may be required → `BLOCKED_NEEDS_APPROVAL`.
- Tests regress after a fix → back to `BUILD_AND_FIX`. "Unresolved" means either:
  (a) the **same** test regresses a second time after a second `BUILD_AND_FIX`
  pass targeting it, or (b) the number of TEST→BUILD_AND_FIX round-trips in this
  run reaches `config/escalation-policy.yaml#budgets.maxTestRegressionLoops`.
  Either condition → `BLOCKED_NEEDS_DEVELOPER` (do not attempt a third,
  different fix for the same regressed test without developer input).

## Allowed next states
`DOCUMENT`, back to `BUILD_AND_FIX`, or `HANDOVER`.

# Phase 06 — Test

- **Phase ID:** `06-test`
- **State:** `TEST`

## Purpose
Verify the upgraded build and automatically generate/review required client EF
migration, snapshot and SQL files. Do not apply database changes.

## Required inputs
Green build, routed `knowledge/canonical/migrations/ef-migration-patterns.json`.

## Preconditions
Build succeeded.

## Required actions
1. If a `DbContext` exists, automatically generate/review migration/snapshot and SQL
   files per the migration pattern and
   [autonomous migration policy](../../../AGENTS.md#autonomous-upgrades-and-ef-migrations).
   No separate generation approval. Reuse matching output on resume, inspect
   destructive/data-precondition risks and rebuild. Treat "no changes detected"
   as success; record empty output explicitly. Never run database update or SQL.
2. Record optional tests SKIPPED with the reason by default. Do not create test
   files/projects or run full suites. Run existing targeted tests only when
   explicitly requested or needed to diagnose a concrete regression; if run,
   capture real results and use the configured timeout. Never claim skipped
   tests passed.
3. Compare against the baseline: if tests that passed at baseline now fail, treat as a regression. Increment `state.json.testRegressionLoopCount` and record which test(s) regressed and after which fix, so a repeat regression on the same test is detectable.

## Allowed tools
`dotnet ef`, test runner.

## Required evidence
EF migration/snapshot diff, SQL artifact, review findings, post-generation build
and EF command outputs, `test-results.json`.

## Required outputs
`test-results.json`, EF migration result recorded in `state.json`.

## Completion criteria
EF migration attempted/reviewed (where applicable), generated code rebuilt and
optional-test disposition recorded; `nextAction = "Load phases/07-document.md"`.

## Documentation responsibilities
Test and EF results feed the report and `documentation-status.json`.

## Checkpoint requirements
Checkpoint before EF migration (side effect) and after results received.

## Retry behaviour
"No DbContext found" / "build failed" follow the migration pattern's retry rules.

## Escalation conditions
- Generated output has unresolved destructive/data-semantic risks, or database
  application is requested without explicit approval → `BLOCKED_NEEDS_APPROVAL`
  for the affected acceptance/application step, not generation/review.
- Tests regress after a fix → back to `BUILD_AND_FIX`. "Unresolved" means either:
  (a) the **same** test regresses a second time after a second `BUILD_AND_FIX`
  pass targeting it, or (b) the number of TEST→BUILD_AND_FIX round-trips in this
  run reaches `config/escalation-policy.yaml#budgets.maxTestRegressionLoops`.
  Either condition → `BLOCKED_NEEDS_DEVELOPER` (do not attempt a third,
  different fix for the same regressed test without developer input).

## Allowed next states
`DOCUMENT`, back to `BUILD_AND_FIX`, or `HANDOVER`.

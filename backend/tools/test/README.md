# tools/test

Test + EF migration contract for Phase 06 (Test).

- Do not create test/probe files or run suites by default. Record optional tests
  SKIPPED with the reason; use existing targeted tests only when requested or
  needed to diagnose a concrete regression. Capture real results if run.
- EF migration: follow `knowledge/canonical/migrations/ef-migration-patterns.json`.
  Automatically generate/review migration, snapshot and SQL files after the
  target build; no separate generation approval. Reuse matching output on
  resume, inspect destructive/data-precondition risks and rebuild. Treat "no
  changes detected" as success and record empty migrations. Follow
  [autonomous migration policy](../../AGENTS.md#autonomous-upgrades-and-ef-migrations).
  Database application and acceptance of destructive/lossy changes require
  explicit approval (`BLOCKED_NEEDS_APPROVAL`); never run database update or SQL
  as part of generation validation.
- If tests were run at baseline and target, compare their results for regressions.

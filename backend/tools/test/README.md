# tools/test

Test + EF migration contract for Phase 06 (Test).

- Detect a test project; if present run the suite and write `test-results.json`
  (`{ passed, failed, skipped, regressedVsBaseline }`). If absent, write `{ noTests: true }`.
- EF migration: follow `knowledge/canonical/migrations/ef-migration-patterns.json`.
  Treat "no changes detected" as success. A destructive migration requires
  approval (`BLOCKED_NEEDS_APPROVAL`).
- Compare against `state.json.baseline` to detect regressions.

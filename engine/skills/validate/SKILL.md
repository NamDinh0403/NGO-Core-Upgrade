---
name: shared-upgrade-validate
description: Coordinate domain verification evidence, missing checks and coverage without weakening .NET or Angular checks.
---
# Procedure
1. Run existing domain restore/install, required build and installed-package/API checks; retain exact command, result and evidence under the run. Reuse unchanged successful results, not duplicate builds or new test/probe scripts.
2. Return each executor's required validation evidence to `record-validation`. Record optional tests as SKIPPED with a nonempty summary/reason and no command/exitCode. Run existing targeted tests only when requested or needed to diagnose a concrete regression; all other missing/skipped required checks block.
3. Verify requirement coverage and evidence fingerprints. Changed evidence requires revalidation, never a cached success claim.
4. Do not proceed to shared handover until coverage succeeds. Any outstanding manual work has an explicit owner and next action.
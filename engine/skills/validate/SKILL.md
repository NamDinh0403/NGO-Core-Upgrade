---
name: shared-upgrade-validate
description: Coordinate domain verification evidence, missing checks and coverage without weakening .NET or Angular checks.
---
# Procedure
1. Run deterministic domain build/test/installed-package checks; retain exact command, result and evidence under the run.
2. Return each executor's required validation evidence to `record-validation`; missing/skipped checks remain visible and cannot PASSED.
3. Verify requirement coverage and evidence fingerprints. Changed evidence requires revalidation, never a cached success claim.
4. Do not proceed to shared handover until coverage succeeds. Any outstanding manual work has an explicit owner and next action.
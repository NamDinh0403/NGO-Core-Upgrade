---
name: shared-upgrade-report
description: Produce one evidence-bound coverage result, deployment handover and final upgrade report.
---
# Procedure
1. Compose requested executor results without transferring opposite-domain internals.
2. Run `verify-coverage`, then `prepare-handover`, then `final-report` through the engine CLI.
3. Include all failures, incomplete validations, deployment actions/owners and exact resume instructions. Never mark missing/blocked executors COMPLETE.
4. The report is engine-owned; domain summaries are evidence inputs, not independent upgrade reports.
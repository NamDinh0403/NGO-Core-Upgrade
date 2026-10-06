---
name: shared-upgrade-escalate
description: Produce one actionable blocked-state handoff with exact evidence and safe resume action from any executor or lifecycle phase.
---
# Procedure
1. Save the checkpoint, preserve logs/diffs and attempted fixes. Never revert user changes or perform unapproved cleanup.
2. Record blocker, impact, uncertainty, inspected evidence, commands/results, repository safety, decision/approval required, options and risks.
3. Ask for one exact developer action; record safe rollback and exact resume command. Do not request secrets through the model.
4. Mark the engine executor BLOCKED/FAILED with nextAction and safeResumeInstruction. No automatic retries while waiting for the developer.
5. Emit the compatibility/domain output schema. No fabricated fix, silent stop or blocked run that looks active.
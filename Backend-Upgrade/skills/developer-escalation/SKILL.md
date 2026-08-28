---
name: developer-escalation
description: Produces an actionable developer handoff whenever automation cannot safely continue. Callable from every skill and phase.
metadata:
  id: developer-escalation
  version: 1.0.0
  status: active
  risk: low
  input-schema: schemas/input.schema.json
  output-schema: schemas/output.schema.json
---

# Purpose
Produce an actionable developer handoff and a safe resume point whenever automation
cannot safely continue. Reachable from every skill and every workflow phase.

# Trigger conditions
- Any skill or phase reaches a blocked/failed condition, or requires a developer decision, approval, tool, credential, or vendor input.

# Exclusions
- Must not leave a blocked run looking active without a next action.

# Preconditions
- A run directory and current checkpoint exist.

# Required capabilities
`read-repository` (Level 0).

# Inputs
See `schemas/input.schema.json` — run id, phase, current skill, checkpoint, blocker, attempted fixes, evidence.

# Procedure
1. Save a checkpoint and mark the run blocked with the specific reason.
2. Preserve logs/diffs; revert unverified changes where safe and policy permits.
3. Fill the escalation using `templates/developer-escalation.md`: run id, phase, current skill, checkpoint, exact blocker, impact, uncertainty IDs, evidence inspected, tools used, exact commands, attempted fixes in order + result of each, changed/reverted files, repository safety state, why automation cannot continue, decision/info required, options + risk of each, recommended option, safe rollback + resume instruction, exact resume command.
4. Update durable `state.json` (`status`, `nextAction`, `safeResumeInstruction`).

# Evidence requirements
Every attempted fix and its result is listed; the escalation is actionable, never "the agent could not solve it".

# Uncertainty handling
Links the blocking uncertainty IDs; states exactly what resolves them.

# Completion criteria
An escalation document exists; `state.json` carries a non-empty `safeResumeInstruction`; outcome is one of the waiting/terminal statuses below.

# Retry behavior
None — this skill finalizes a blocked state.

# Escalation behavior
This skill *is* the escalation producer.

# Outputs
See `schemas/output.schema.json` — outcome, escalationRef, safeResumeInstruction, exactResumeCommand, nextAction.

# Allowed next skills
None (developer acts, then the run resumes via `resume`).

# Prohibited behavior
No silent stop. No blocked run without a next action.

# Escalation outcomes
`WAITING_FOR_CONTEXT`, `WAITING_FOR_DEVELOPER_DECISION`, `WAITING_FOR_APPROVAL`, `WAITING_FOR_TOOL`, `WAITING_FOR_CREDENTIAL`, `WAITING_FOR_VENDOR`, `TERMINAL_UNSAFE`, `CANCELLED`.

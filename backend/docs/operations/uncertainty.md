# Uncertainty — operations

Do not mix facts and guesses. Classify every planning item as **KNOWN**, **ASSUMED**,
**UNCERTAIN**, **CONTRADICTORY**, or **NOT_APPLICABLE**. A KNOWN fact cites evidence.

## Uncertainty register
`runs/<client>/<run-id>/uncertainty-register.yaml`. Each entry:
id, statement, category, impact, confidence, evidence available, evidence missing,
resolution options, capability required, automatable?, blocks-mutation?, blocks-completion?,
owner, status, eventual resolution.

Statuses: `OPEN` · `RESEARCHING` · `RESOLVED` · `ACCEPTED_RISK` · `DEFERRED` ·
`REQUIRES_DEVELOPER` · `NOT_APPLICABLE`. Impacts: `LOW` · `MEDIUM` · `HIGH` · `CRITICAL`.

## Rules (enforced by `engine.mutationGate` / `engine.uncertaintyBlocks*`)
- HIGH or CRITICAL open uncertainty **blocks** the affected mutation.
- HIGH or CRITICAL uncertainty **cannot** be auto-accepted.
- Accepted risk records approver, date, reason, scope.
- Resolution references evidence; resolved uncertainty is never deleted from history.
- A deferred uncertainty names the phase where it becomes blocking.
- Completion is impossible while completion-blocking uncertainty is OPEN.
- A LOW-impact uncertainty may stay open only if policy allows and the final report documents it.

## Assumptions
Each assumption records: why necessary now, how to validate, impact if wrong, and
whether it blocks mutation.

## Contradictions
Each contradiction records: conflicting statements, evidence for each, affected area,
risk, proposed resolution, and the developer decision when needed.

Record concise reviewable facts, alternatives, decisions, and justification — never
private chain-of-thought.

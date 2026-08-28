# Developer Escalation — {ClientId} / {RunId}

> Generated automatically when a run reaches a blocked status. This document MUST
> be actionable. It must never consist only of "the agent could not solve the problem."

## Status
- Run status: `{BLOCKED_NEEDS_CONTEXT | BLOCKED_NEEDS_DEVELOPER | BLOCKED_NEEDS_APPROVAL | FAILED_POLICY | FAILED_BUDGET | CANCELLED}`
- Phase / step: `{currentPhase}` / `{currentStep}`
- Source → Target: `{sourceVersion}` → `{targetVersion}`
- Last successful checkpoint: `{checkpointRef}`

## What was attempted
| # | Action | Evidence | Outcome | Why it failed |
|---|--------|----------|---------|---------------|
| 1 | {action} | {decompile/diff/log ref} | {failed} | {reason} |

## Exact decision or information required
{State precisely what the developer must decide or provide. E.g. "Confirm whether
NGO.Migration.CostStructure may be retargeted to net9.0" or "Provide the package
feed credential for source X".}

## Why no safe automated fix exists
{Reference the escalation trigger from config/escalation-policy.yaml.}

## Impact if unresolved
{What remains broken / not upgraded.}

## Safest resume point
- Resume from checkpoint: `{checkpointRef}`
- Phase to re-enter: `{phaseId}`

## Exact resume instruction
```
{state.json.safeResumeInstruction}
```

## Documentation status
{Summarize documentation-status.json — what is done, what is pending.}

## Attachments
- Logs / diffs: `runs/{ClientId}/{RunId}/`
- Episode: `memory/episodes/{episodeId}.json`

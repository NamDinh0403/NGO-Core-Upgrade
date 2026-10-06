# Phase 08 — Handover

- **Phase ID:** `08-handover`
- **State:** `HANDOVER`

## Purpose
Close the run safely: produce an episode, and either complete or hand off to a developer with an actionable escalation. **Every run passes through Handover — there is no other exit.**

## Required inputs
Full run directory, `documentation-status.json`.

## Preconditions
Reached from any phase that ended in a terminal, blocked, or completed status.

## Required actions
1. Produce an **episode** under `../engine/memory/episodes/backend/` (native or imported) valid against `schemas/episode.schema.json` — for successful **and** blocked/failed runs.
2. Extract reusable learning as a **candidate pattern** under `../engine/memory/candidates/backend/` (never write directly to approved/canonical).
3. If the run is blocked/failed: generate `templates/developer-escalation.md` listing attempted fixes, why each failed, the exact decision/information required, the safest resume point, and the exact resume instruction.
4. Verify the Definition of Done (`checklists/definition-of-done.md`). If all gates pass, set `COMPLETE`. If documentation is pending, set `DOCUMENTATION_PENDING`. Otherwise set the specific `BLOCKED_*`/`FAILED_*` status.
5. Ensure `state.json.nextAction` and `state.json.safeResumeInstruction` are non-empty.

## Allowed tools
File writes (episode, candidate, escalation), memory tools.

## Required evidence
Links from the episode to redacted run artifacts.

## Required outputs
Episode; optional candidate pattern; escalation document when blocked; final `state.json`.

## Completion criteria
Exactly one terminal/blocked status is set AND a `safeResumeInstruction` exists AND an episode exists.

## Documentation responsibilities
Confirms documentation gate before allowing `COMPLETE`.

## Checkpoint requirements
Checkpoint before waiting for a human and before termination.

## Retry behaviour
None — this phase finalizes status.

## Escalation conditions
This phase *is* the escalation producer.

## Allowed next states
`COMPLETE`, or return to `DOCUMENT` to clear `DOCUMENTATION_PENDING`.

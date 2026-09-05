# Resuming a run

Every run is durable. State, evidence, checkpoints, and artifacts live under
`runs/<client>/<run-id>/`, so a run can always be continued after a developer resolves a
blocker or after an interruption.

```
node tools/frontend-upgrade-agent.js resume --run <run-id>
```

## How resume works

1. Reads `runs/<client>/<run-id>/state.json` (`schemas/run-state.schema.json`).
2. Continues from `state.json.nextAction`, restoring the most recent valid checkpoint.
3. **Re-verifies safety invariants before doing anything mutating:**
   - the Core fingerprint still matches (Core unchanged since inspection),
   - the planning fingerprints still match the current client and Core (nothing drifted),
   - no mutating action with an already-recorded idempotency key is repeated.
4. Re-enters the mutation gate for any client change (same conditions as a fresh run).

If Core or the client changed since planning, resume does **not** blindly apply the old
plan - it routes back to re-inspection/replanning so the plan reflects reality.

## Common resume scenarios

| You were blocked by | Do this | Then |
| --- | --- | --- |
| `BLOCKED_VERSION_MISMATCH` | Check out the correct client/Core state | `resume` |
| HIGH/CRITICAL uncertainty | Resolve/annotate the item in the uncertainty register | `resume` |
| `BLOCKED_BUILD` in audit | Fix the reported build issue (or let investigate handle it) | `resume` |
| `BLOCKED_CORE_MODIFIED` | Restore Core to its inspected state (Core must be read-only) | `resume` |
| developer escalation | Follow the escalation record's instructions | run its `resumeCommand` |

## Finding the run id

```
node tools/frontend-upgrade-agent.js status
```

Lists runs and their status. `status --run <id>` shows the exact next action and the
resume command to use.

## Guarantees on resume

- The client is still the only repository written.
- No mutation happens without a READY plan, a client checkpoint, a recorded Core
  fingerprint, matching planning fingerprints, and no open HIGH/CRITICAL uncertainty.
- A run is never left "active" without a `nextAction` and a safe resume instruction.

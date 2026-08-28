# Skills — operations

Skills are bounded agent procedures under `skills/`. They are selected
deterministically by `tools/skills/lib/engine.js`, validated against per-skill
schemas, and recorded in `runs/<client>/<run-id>/skill-invocations.jsonl`.

## Simple flow
```
doctor → plan → research (when necessary) → run → resume (if interrupted) → learn
```

## The eight skills
See `skills/README.md` for the table. Boundaries:
- `plan-upgrade` — read-only plan + uncertainty register (mandatory first).
- `research-version` — resolve version knowledge outside the client (evidence ladder).
- `analyze-client-impact` — map changes to client files/symbols/roles (read-only).
- `execute-upgrade` — apply a READY plan through the mutation gate.
- `investigate-build-failure` — evidence-based diagnosis within retry limits.
- `audit-frontend-integration` — semantic front-end graph verification.
- `learn-from-run` — sanitized episodes + candidates (never canonical).
- `developer-escalation` — actionable handoff from any skill.

## Selection
`engine.selectSkill(context)` uses deterministic rules (phase, plan status, version
knowledge status, failure signature, mutation permission, requested operation) — not
semantic similarity. `engine.isValidTransition(from, to)` enforces the registry's
allowed transitions; `developer-escalation` is always reachable.

## Gates
- **Client-mutation gate** (`engine.mutationGate`) — mutation only with a READY plan,
  resolved HIGH/CRITICAL uncertainty, rollback checkpoint, baseline, known repo status,
  and the action in the plan.
- **Uncertainty gate** — HIGH/CRITICAL open uncertainty blocks the affected mutation.
- **Documentation gate** — a run cannot be COMPLETE while mandatory documentation is pending.

## Validate
```
node tools/skills.test.js     # 40 scenarios
node tools/validate.js        # includes skill registry + schema checks
```

# Skills

Twelve skills implement the single-session, dual-repository front-end upgrade. Each skill
is a directory containing `SKILL.md` (contract), `schemas/input.schema.json`,
`schemas/output.schema.json`, and `evals/*.output.json`. They are registered and wired in
[registry.yaml](registry.yaml) and selected deterministically by
[../tools/lib/engine.js](../tools/lib/engine.js).

## Pipeline

```
validate-local-repositories
  -> inventory-client-frontend
  -> inspect-local-core            (read-only; records Core fingerprint)
  -> resolve-target-packages       (exact versions from Core)
  -> derive-release-requirements   (semantic "what is required")
  -> map-core-to-client            (resolve to real client implementation point)
  -> plan-frontend-upgrade         (read-only plan; exact files + evidence)
  -> execute-frontend-upgrade      (client-only mutation, behind the gate)
       <-> investigate-frontend-failure   (classify / bounded fix / replan)
  -> audit-frontend-integration    (mandatory completion gate)
  -> learn-from-frontend-run       (redacted candidates only)
```

`developer-escalation` is reachable from **every** skill and always emits an exact
`resumeCommand`. No skill silently stops.

## The twelve skills

| Skill | Risk | Writes client? | Purpose |
| --- | --- | --- | --- |
| `validate-local-repositories` | low | no | Validate both repos, source-version agreement, distinct/non-nested paths; emit doctor report. |
| `inventory-client-frontend`   | low | no | Workspace type, bootstrap style, file inventory, semantic graph, role coverage. |
| `inspect-local-core`          | low | no | Read-only Core inventory + semantic graph + scoped requirements; Core fingerprint. |
| `resolve-target-packages`     | low | no | Exact target versions from Core manifests (no ranges); classify every package. |
| `derive-release-requirements` | low | no | Normalise canonical release requirements + Core findings into semantic requirements with verification predicates. |
| `map-core-to-client`          | low | no | Resolve each requirement to the client's real implementation point; raise uncertainty. |
| `plan-frontend-upgrade`       | low | no | Read-only plan: exact files + evidence; uncertainty register; `readOnly = true`. |
| `execute-frontend-upgrade`    | high | yes | Apply planned changes behind the mutation gate, with checkpoints and rollback. |
| `investigate-frontend-failure`| medium | yes | Classify build/integration failures; bounded fixes or trigger replanning. |
| `audit-frontend-integration`  | low | no | Mandatory: exact versions installed, prod build green, requirements met, Core unchanged. |
| `learn-from-frontend-run`     | low | no | Redacted learning candidates only (never auto-approved). |
| `developer-escalation`        | low | no | Structured hand-off with an exact resume command; reachable from every skill. |

## Invariants every skill upholds

- **Client is the only mutable repository.** Read-only skills report `coreUnchanged`;
  mutating skills are the only ones that touch the client, and only via the gate.
- **Exact versions from Core** - never `latest`, wildcards, or ranges.
- **Facts vs uncertainty** - KNOWN / ASSUMED / UNCERTAIN / CONTRADICTORY / NOT_APPLICABLE;
  KNOWN cites evidence. HIGH/CRITICAL open uncertainty blocks mutation.
- **One status + one next action** - every result ends with exactly one status and an exact
  next action; blocked/failed routes to `developer-escalation`.
- **Completion statuses are a subset of the skill's output `status` enum** (enforced by
  `tools/validate.js`).

## Testing

- `node tools/validate.js` - registry/skill/schema structural integrity.
- `node tools/skills.test.js` - skill IO validation + behavioural evaluations.
- `node tools/run-evals.js` - end-to-end read-only pipeline + mutation-gate scenarios.

# Skills

A **skill** is a bounded, reusable agent procedure. Skills define *how* an agent
performs a bounded task. They are separate from:

- `workflows/` — *what phase comes next* (the state machine),
- `tools/` — deterministic technical operations + the skill engine,
- `schemas/` — valid data shapes,
- `knowledge/` — approved reusable facts,
- `memory/` — episodes and candidate learning,
- `runs/` — current durable execution state,
- `config/` — policies, gates, and limits.

Each skill is a folder with `SKILL.md` (the procedure + front matter contract),
`schemas/input.schema.json` + `schemas/output.schema.json` (validated I/O), and
`evals/` (a valid sample output the test suite validates). Do not duplicate central
policy inside a skill — reference `config/`.

## The eight skills

| Skill | Purpose | Mutates client? |
|-------|---------|-----------------|
| `plan-upgrade` | read-only, evidence-based plan + uncertainty register | no |
| `research-version` | resolve version knowledge outside the client, evidence ladder | no |
| `analyze-client-impact` | map changes to client files/symbols/config roles | no (default) |
| `execute-upgrade` | apply a READY plan through the mutation gate | yes (gated) |
| `investigate-build-failure` | evidence-based failure diagnosis within retry limits | yes (small, gated) |
| `audit-frontend-integration` | semantic front-end graph verification | verification only |
| `learn-from-run` | sanitized episodes + candidate learning (never canonical) | no |
| `developer-escalation` | actionable handoff + safe resume, from any skill | no |

## Contract (every SKILL.md)
Front matter uses VS Code-supported agent-file keys: `name`, `description`, and a
`metadata` block carrying `id, version, status, risk, input-schema, output-schema`.
Sections: Purpose, Trigger conditions, Exclusions, Preconditions, Required capabilities,
Optional capabilities, Inputs, Procedure, Evidence requirements, Uncertainty handling,
Completion criteria, Retry behavior, Escalation behavior, Outputs, Allowed next skills,
Prohibited behavior.

## Engine
`tools/skills/lib/engine.js` provides the functional backbone: registry loading,
schema-lite validation, **deterministic** skill selection, transition enforcement,
the **client-mutation gate**, uncertainty gates, **lazy capability activation**, and
invocation recording. It is exercised by `tools/skills.test.js` (40 scenarios).

## Flow
```
plan-upgrade
  ├─ research-version ─► plan-upgrade
  ├─ analyze-client-impact ─► plan-upgrade
  └─ execute-upgrade
        ├─ investigate-build-failure
        ├─ audit-frontend-integration
        ├─ research-version ─► plan-upgrade
        └─ learn-from-run
```
`developer-escalation` is reachable from every skill. No skill silently stops; every
skill result carries an exact next action.

## Lazy capability model
- **Level 0** repository inspection — no specialist install (planning always works here).
- **Level 1** normal dev prerequisites (git, SDK, package manager) — checked per detected technology.
- **Level 2** local research tools (ApiCompat, ILSpyCmd, TypeScript scanner) — activated only when an approved plan requires them.
- **Level 3** deep research (containers, runtime tracing) — only when standard research cannot resolve HIGH/CRITICAL uncertainty.

Optional Level 2/3 tools being absent must never block planning. See
`docs/operations/tool-capabilities.md`.

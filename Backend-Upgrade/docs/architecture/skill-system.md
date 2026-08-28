# Skill system — architecture

The skill layer adds *how an agent performs a bounded task* on top of the workflow
state machine. It is stable across LLM model changes because behaviour is encoded in
files (SKILL.md contracts, schemas, registry) and enforced by a deterministic engine,
not in a single large prompt.

## Separation of responsibilities
| Concern | Location |
|---------|----------|
| what phase comes next | `workflows/` |
| how a bounded task is performed | `skills/` |
| deterministic technical operations + skill engine | `tools/` |
| valid data | `schemas/` and per-skill `skills/*/schemas/` |
| approved reusable facts | `knowledge/` |
| episodes + candidate learning | `memory/` |
| current durable execution state | `runs/` |
| policies, gates, limits | `config/` |

## Engine (`tools/skills/lib/engine.js`)
- **Registry** loader (`skills/registry.yaml`).
- **Schema-lite validation** of every skill input/output.
- **Deterministic selection** (`selectSkill`) from run/plan/failure context — not similarity.
- **Transition enforcement** (`isValidTransition`); `developer-escalation` reachable from all.
- **Client-mutation gate** (`mutationGate`): plan READY + resolved HIGH/CRITICAL uncertainty
  + rollback checkpoint + baseline + known repo status + action-in-plan.
- **Uncertainty gates** (`uncertaintyBlocksMutation`, `uncertaintyBlocksCompletion`).
- **Lazy capability activation** (`capabilityActivation`, `planningReadiness`, `CAPABILITY_LEVEL`).
- **Invocation recording** to `skill-invocations.jsonl`.

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
developer-escalation ◄─ (reachable from every skill)
```

## Durable progress
Every skill persists under `runs/<client>/<run-id>/`: `state.json`, `plan.yaml`,
`uncertainty-register.yaml`, `assumptions.yaml`, `skill-invocations.jsonl`,
`events.jsonl`, `decisions.jsonl`, `observations.jsonl`, `changed-files.json`,
`documentation-status.json`, `checkpoints/`, `artifacts/`. A new agent resumes from
state, not from chat history.

## Evaluations
`tools/skills.test.js` proves the 40 required behaviours (planning-first, read-only
planning, fact/uncertainty separation, gates, lazy activation, isolation, retry limits,
NgModule + standalone classification, escalation reachability, exact next actions,
schema validation, transition rejection).

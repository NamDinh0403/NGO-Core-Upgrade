# AGENTS.md — NGO Core Upgrade

Single entry point. Read this file first; it tells you exactly which contract to
load next. Do **not** read both track contracts speculatively — load only the one
(or two) you actually need.

## Layout

```
ingest/        Shared Core-release ingestion (read-only against the NGO.Core repo). Run ONCE per version.
orchestrator/  Shared cross-track coordination: one run, normalized requirements, merged coverage, merged deployment handover, final report. Never mutates a client repository. Contract: orchestrator/AGENTS.md
backend/       Sub-agent: .NET / NuGet / EF migrations / appsettings.   Contract: backend/AGENTS.md
frontend/      Sub-agent: Angular / NgRx / package.json / templates.    Contract: frontend/AGENTS.md
```

Only `backend/` and `frontend/` ever mutate a client repository, each behind its
own mutation gate. `ingest/` and `orchestrator/` never mutate anything.

## Route by request

| Request | Do this |
|---|---|
| Upgrade **both** tracks, or track not stated | Follow `orchestrator/AGENTS.md`: one shared run and validated ingest, parallel track delegation when repositories are independent, one merged handover/report. |
| Backend only (.NET/NuGet/EF/appsettings) | Create a shared run with `--tracks backend`, then load **`backend/AGENTS.md`** with its backend context. |
| Frontend only (Angular/package.json) | Create a shared run with `--tracks frontend`, then load **`frontend/AGENTS.md`** with its frontend context. |
| "Is there a newer Core release?" | `node ingest/tools/ingest.js check --core-path <path>` — nothing else needed. |

## Context And Inputs

Discover the requested client paths/source version from workspace solution and
package metadata, and the read-only Core path from supplied inputs/config.
Ask once only for material missing/conflicting inputs and target version.
Do not infer a requested target from the highest installed version.
Load current run state, the owning contract and applicable knowledge only;
historical runs, raw logs, all skills and unrelated domains are not default context.
The shared-run loop is owned by `orchestrator/AGENTS.md`, not duplicated here.
The generic lifecycle is `orchestrator/skills/lifecycle/SKILL.md`. If a verified
track context was supplied, consume it; do not create another shared run or ingest
again. Standalone track agents use the same owner without delegating to themselves.

## Non-negotiables (all three modules)

- Never mutate a client repo before that track has a `READY` plan.
- Never write to any `knowledge/canonical/` directly — candidates only, developer promotes.
- The local NGO.Core repo is strictly read-only; never check out or switch its branches.
- Never commit secret values; use placeholders and the secret provider.
- Every step ends in exactly one status with an exact next action. No silent stops.
- Never call `prepare-handover` before `verify-coverage`, and never declare a
  run COMPLETE while `missing-steps.yaml` has an unowned outstanding item.

## Validate the framework itself (not per client run)

One command runs every suite in `ingest/`, `orchestrator/`, `backend/` and `frontend/`
and fails if any suite fails **or** modifies a tracked file:

```
node tools/validate-all.js
```

Per-suite commands (each must run from its own module folder) are listed in the README's
*Tests & Validation* section.

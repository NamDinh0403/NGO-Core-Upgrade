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
| Upgrade **both** tracks, or track not stated | Create one shared run via `orchestrator/tools/orchestrator.js create-run` (runs the shared ingest phase internally), then delegate to **both** sub-agents in parallel, then compose results / verify coverage / prepare handover / final report once (see Steps 2-4 below). |
| Backend only (.NET/NuGet/EF/appsettings) | Run ingest, then load **`backend/AGENTS.md`** and follow it. |
| Frontend only (Angular/package.json) | Run ingest, then load **`frontend/AGENTS.md`** and follow it. |
| "Is there a newer Core release?" | `node ingest/tools/ingest.js check --core-path <path>` — nothing else needed. |

## Step 1 — Collect inputs once

Backend solution path (if backend) · client front-end path (if frontend) · local
read-only **NGO.Core repo path** · shared `release-notes.md` path (if available)
· target Core version. Collect these up front so neither sub-agent has to stop
and ask again mid-run.

## Step 2 — One shared run + shared ingest phase (once per target version)

```
node orchestrator/tools/orchestrator.js create-run --client <id> --tracks backend,frontend \
  --core-path <coreRepoPath> --release-notes <notesPath> --target-version <version>
```

This runs the same shared ingest phase as before internally
(`node ingest/tools/ingest.js check|ingest`, skipped automatically if the
version is already covered by either track's canonical knowledge — see
[ingest/README.md](ingest/README.md) for the record shape) and additionally
writes a normalized, per-domain requirements seed under
`orchestrator/runs/<client>/<runId>/requirements/{backend,frontend,shared}.yaml`
— read by, but never authoritative over, each track's own planning. Output is
always a **CANDIDATE**; a developer promotes it to canonical, never the agent.

## Step 3 — Delegate

Hand each track the shared `runId` plus the collected inputs and its own
`requirements/<track>.yaml` seed path. Run both in parallel when both are
requested; they touch different repositories and cannot conflict. Each track
keeps writing its own `runs/<client>/<run-id>/` exactly as before — the shared
run does not replace it.

## Step 4 — Compose, verify coverage once, hand over once

Once each requested track reports a terminal status:

```
node orchestrator/tools/orchestrator.js compose-results  --run <client>/<runId> --backend-run <path> --frontend-run <path>
node orchestrator/tools/orchestrator.js verify-coverage   --run <client>/<runId>
node orchestrator/tools/orchestrator.js prepare-handover  --run <client>/<runId>
node orchestrator/tools/orchestrator.js final-report      --run <client>/<runId>
```

Report one combined result from `final-report.md`: status per track, each
track's plan/report path and `state.json`, the merged coverage summary, the
merged deployment handover, and one aggregated next action. Surface any
`BLOCKED_*` with its exact `safeResumeInstruction` rather than retrying on the
sub-agent's behalf.

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

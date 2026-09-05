# AGENTS.md — NGO Core Upgrade

Single entry point. Read this file first; it tells you exactly which contract to
load next. Do **not** read both track contracts speculatively — load only the one
(or two) you actually need.

## Layout

```
ingest/      Shared Core-release ingestion (read-only against the NGO.Core repo). Run ONCE per version.
backend/     Sub-agent: .NET / NuGet / EF migrations / appsettings.   Contract: backend/AGENTS.md
frontend/    Sub-agent: Angular / NgRx / package.json / templates.    Contract: frontend/AGENTS.md
```

Only `backend/` and `frontend/` ever mutate a client repository, each behind its
own mutation gate. `ingest/` never mutates anything.

## Route by request

| Request | Do this |
|---|---|
| Upgrade **both** tracks, or track not stated | Run the shared ingest phase (below), then delegate to **both** sub-agents in parallel and combine their results. |
| Backend only (.NET/NuGet/EF/appsettings) | Run ingest, then load **`backend/AGENTS.md`** and follow it. |
| Frontend only (Angular/package.json) | Run ingest, then load **`frontend/AGENTS.md`** and follow it. |
| "Is there a newer Core release?" | `node ingest/tools/ingest.js check --core-path <path>` — nothing else needed. |

## Step 1 — Collect inputs once

Backend solution path (if backend) · client front-end path (if frontend) · local
read-only **NGO.Core repo path** · shared `release-notes.md` path (if available)
· target Core version. Collect these up front so neither sub-agent has to stop
and ask again mid-run.

## Step 2 — Shared ingest phase (once per target version)

```
node ingest/tools/ingest.js check  --core-path <coreRepoPath>
node ingest/tools/ingest.js ingest --core-path <coreRepoPath> --release-notes <notesPath> --target <version>
```

Skip `ingest` if `check` shows the version is already covered by either track's
canonical knowledge. This cross-checks Core's git history against the release
notes and writes ONE shared candidate record per version to
`ingest/knowledge/candidates/releases/<version>.json`. Both sub-agents read their
own slice of it (`findings.backend` / `findings.frontend`, plus `findings.shared`),
so a version is never diffed twice. Output is always a **CANDIDATE** — a
developer promotes it to canonical, never the agent.

## Step 3 — Delegate

Hand each track its collected inputs plus a note that ingest has already run for
this version. Run both in parallel when both are requested; they touch different
repositories and cannot conflict. Then report one combined result: status per
track, each track's plan/report path and `state.json`, and one aggregated next
action. Surface any `BLOCKED_*` with its exact `safeResumeInstruction` rather
than retrying on the sub-agent's behalf.

## Non-negotiables (both tracks)

- Never mutate a client repo before that track has a `READY` plan.
- Never write to any `knowledge/canonical/` directly — candidates only, developer promotes.
- The local NGO.Core repo is strictly read-only; never check out or switch its branches.
- Never commit secret values; use placeholders and the secret provider.
- Every step ends in exactly one status with an exact next action. No silent stops.

## Validate the framework itself (not per client run)

```
node ingest/tools/ingest.test.js
cd backend  && node tools/validate.js && node tools/run-evals.js
cd frontend && node tools/validate.js && node tools/repo-layout.test.js
```

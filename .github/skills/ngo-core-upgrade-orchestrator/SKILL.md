---
name: ngo-core-upgrade-orchestrator
description: Runs a full NGO Core upgrade engagement spanning backend and/or frontend for one client in a single request. Creates one shared run, shares one Core-release ingestion phase, delegates the actual work to the backend/frontend upgrade agents as parallel sub-agents, then composes their results into one merged coverage check, one merged deployment handover, and one final report. Use when the user asks to upgrade both the backend and frontend together, or just wants "upgrade NGO Core for this client" without specifying a single track.
---

# NGO Core Upgrade Orchestrator

This skill wraps [ingest/](../../../ingest/README.md), the two existing track
agents — [backend/](../../../backend/AGENTS.md) and
[frontend/](../../../frontend/AGENTS.md) — and the new
[orchestrator/](../../../orchestrator/README.md) coordination module into a
single entry point. Do not re-derive any track's procedure here; your job is
**routing, ingestion, and coordinating one shared run**, not duplicating
their state machines.

## When to use
- "Upgrade NGO Core for `<client>` to `<version>`" without the user specifying
  backend-only or frontend-only.
- The user explicitly wants both tracks done together, or in one session.
- Prefer the single-track skills (`ngo-core-backend-upgrade` /
  `ngo-core-frontend-upgrade`) when the user clearly asks for only one side.

## How to run it
1. Collect once: which track(s) (backend/frontend/both), the client backend
   solution path (if backend), the client front-end path (if frontend), the
   local read-only NGO.Core repository path, the shared `release-notes.md`
   path (if available), and the target Core version(s).
2. Create one shared run (runs the shared ingestion phase internally, reused
   unchanged from before if already fresh for this version, then writes a
   normalized per-domain requirements seed):
   ```
   node orchestrator/tools/orchestrator.js create-run --client <id> --tracks backend,frontend \
     --core-path <coreRepoPath> [--release-notes <releaseNotesPath>] [--source-version <v>] --target-version <targetVersion>
   ```
3. Delegate the real work: launch `ngo-core-backend-upgrade` and/or
   `ngo-core-frontend-upgrade` as sub-agents (in parallel when both are
   requested — they touch different repositories and never conflict), passing
   each the shared `runId` and its own `requirements/<track>.yaml` seed path
   as additional read-only context alongside its own planning.
4. Once each requested track reports a terminal status, compose their results
   into the shared run, then verify coverage once and prepare the deployment
   handover once:
   ```
   node orchestrator/tools/orchestrator.js compose-results  --run <client>/<runId> --backend-run <path> --frontend-run <path>
   node orchestrator/tools/orchestrator.js verify-coverage   --run <client>/<runId>
   node orchestrator/tools/orchestrator.js prepare-handover  --run <client>/<runId>
   node orchestrator/tools/orchestrator.js final-report      --run <client>/<runId>
   ```
5. Produce one combined report from `final-report.md`: status per track,
   links to each track's plan/report markdown and `state.json`, the merged
   coverage summary, the merged deployment handover, and one aggregated next
   action.

## Do not
- Do not mutate any client repository yourself — only each sub-agent does
  that, behind its own mutation gate.
- Do not duplicate either track's workflow phases, skills, or escalation
  policy here, and do not duplicate the coverage/handover merge logic — it
  lives once in `orchestrator/tools/lib/{coverage,handover}.js`.
- Do not paper over a sub-agent's `BLOCKED_*` status — surface it with its
  exact `safeResumeInstruction` in the combined report.
- Do not call `prepare-handover` before `verify-coverage`, and do not declare
  the run COMPLETE while `missing-steps.yaml` has an unowned outstanding item.

## Reference
Full details: [ingest/README.md](../../../ingest/README.md),
[backend/README.md](../../../backend/README.md),
[frontend/README.md](../../../frontend/README.md),
[orchestrator/README.md](../../../orchestrator/README.md).

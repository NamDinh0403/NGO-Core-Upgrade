---
name: ngo-core-upgrade-orchestrator
description: Runs a full NGO Core upgrade engagement spanning backend and/or frontend for one client in a single request, sharing one Core-release ingestion phase and delegating the actual work to the backend/frontend upgrade agents as parallel sub-agents. Use when the user asks to upgrade both the backend and frontend together, or just wants "upgrade NGO Core for this client" without specifying a single track.
---

# NGO Core Upgrade Orchestrator

This skill wraps [ingest/](../../../ingest/README.md) plus the two
existing track agents — [backend/](../../../backend/AGENTS.md)
and [frontend/](../../../frontend/AGENTS.md) — into a single
entry point. Do not re-derive either track's procedure here; your job is
**routing and shared ingestion**, not duplicating their state machines.

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
2. Run the shared ingestion phase once, before delegating to either track:
   ```
   node ingest/tools/ingest.js check  --core-path <coreRepoPath>
   node ingest/tools/ingest.js ingest --core-path <coreRepoPath> --release-notes <releaseNotesPath> --target <targetVersion>
   ```
   Skip `ingest` if `check` shows the version is already canonical in either
   track. This step is read-only against the Core repository and never
   touches any client repository.
3. Delegate the real work: launch `ngo-core-backend-upgrade` and/or
   `ngo-core-frontend-upgrade` as sub-agents (in parallel when both are
   requested — they touch different repositories and never conflict), passing
   each the collected inputs plus a note that the shared ingestion phase has
   already run for this target version.
4. Wait for both (or the one requested), then produce one combined report:
   status per track, links to each track's plan/report markdown and
   `state.json`, and one aggregated next action.

## Do not
- Do not mutate any client repository yourself — only each sub-agent does
  that, behind its own mutation gate.
- Do not duplicate either track's workflow phases, skills, or escalation
  policy here.
- Do not paper over a sub-agent's `BLOCKED_*` status — surface it with its
  exact `safeResumeInstruction` in the combined report.

## Reference
Full details: [ingest/README.md](../../../ingest/README.md),
[backend/README.md](../../../backend/README.md),
[frontend/README.md](../../../frontend/README.md).

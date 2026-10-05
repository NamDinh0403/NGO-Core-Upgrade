# AGENTS.md — orchestrator (shared cross-track module)

Concise entry point for the `ngo-core-upgrade-orchestrator` custom agent. Not
a third upgrade track — this module never touches a client repository. It
owns exactly one thing: the **shared run** that ties one backend delegation
and one frontend delegation together into one coherent engagement.

## What this module owns (see `config/artifact-ownership.yaml`)
- One run-id and one `runs/<client>/<run-id>/` tree per engagement.
- Splitting the shared `ingest/` candidate record (plus
  `feature-decisions.yaml`, if supplied) into normalized, per-domain
  requirement seeds — **additional read-only context** each track may use
  alongside its own planning, never a replacement for it.
- Composing each track's own result (read-only) into one shared results
  folder after both finish.
- ONE merged requirement-coverage check across both tracks.
- ONE merged deployment handover across both tracks.
- ONE final report.

## What this module does NOT own
- Backend/frontend's own internal `runs/<client>/<run-id>/` trees, state
  machines, skills, or policies — those remain exactly as they are (see
  `../docs/refactor/unified-agent-decisions.md`, DEC-1). This module reads
  their `state.json` and per-run artifacts; it never writes to them.
- Client repository mutation of any kind.
- Raw release-note parsing or Core git-history diffing — delegates to
  `../ingest/tools/ingest.js`, exactly as each track's own
  `ingest-core-release` skill already does.

## Shared-Run Loop

1. Discover requested client paths/source versions from workspace metadata and
  Core path from inputs/config. Collect actual missing/conflicting inputs once,
  including the requested target. Resolve x.y shorthand to x.y.0. Different
  targets require separate runs; do not choose a target speculatively.
2. Run create-run below, including source version and each requested client path.
  Ingest validates commit/notes/analyzer identity even on cache hits and splits
  every intermediate release into per-track seeds. A BLOCKED result stops
  delegation; follow its exact safeResumeInstruction. Candidates need developer
  review before canonical promotion.
3. Delegate to `ngo-core-backend-upgrade` / `ngo-core-frontend-upgrade` with all
  inputs, shared runId and its requirements/<track>.yaml seed. Seeds are advisory;
  each track owns its planning, state, mutation and validation. Run in parallel
  only when client working trees do not overlap; serialize otherwise.
  During the existing planning/verification pass, each track records seed
  finding dispositions in its own `release-finding-dispositions.yaml`:
  `findings: [{id: <seed-id>, status: VERIFIED|NOT_APPLICABLE_WITH_EVIDENCE,
  evidence: <concrete proof>}]`. Frontend coverage may instead link
  `sourceCandidateIds` on evidenced verified/not-applicable requirements.
  These disposition IDs are traceability, not promoted canonical records;
  hints are evaluated, never blindly applied. No additional reasoning pass.
4. Safe deterministic reads, tool checks and existing READY-gated execution run
  without repeated permission prompts. Track retry policy controls diagnosis;
  ambiguous/destructive actions, conflicts, approvals and exhausted retries stop
  with exact escalation/resume evidence. Never retry a blocked track on its behalf.
5. Compose every requested terminal track result, verify coverage, then prepare
  handover and final-report. Missing/blocked/nonterminal tracks cannot COMPLETE.
6. Surface the generated report: per-track status, plan/report/state paths,
  coverage, deployment handover and one exact next action. Do not re-reason it.

Keep release evidence scoped by track and affected files. Do not read historical
runs/all knowledge/all skills by default or suppress mandatory frontend host-app
and backend appsettings validation merely because a diff is narrow.

## Commands
```
node tools/orchestrator.js create-run       --client <id> --tracks backend,frontend \
    --core-path <path> [--release-notes <path>] --source-version <v> --target-version <v> \
    [--backend-client-path <solution>] [--frontend-client-path <client>] [--feature-decisions <path>]
node tools/orchestrator.js compose-results  --run <client>/<runId> \
    [--backend-run <backend/runs/.../run-id>] [--frontend-run <frontend/runs/.../run-id>]
node tools/orchestrator.js verify-coverage  --run <client>/<runId>
node tools/orchestrator.js prepare-handover --run <client>/<runId>
node tools/orchestrator.js final-report     --run <client>/<runId>
node tools/orchestrator.js status           --run <client>/<runId>
```

## Non-negotiables
- `compose-results` reads each track's own `state.json`; it never mutates it.
- `verify-coverage` runs only after the requested track(s) report a terminal
  status; `prepare-handover` runs only after `verify-coverage` succeeds.
- Release/coverage/seed evidence must still match its verified hash at handover
  and final report; changed/missing evidence requires re-verification.
- Where a track has no structured coverage/deployment output of its own
  (backend today has neither), the merge surfaces an explicit, labelled
  placeholder rather than silently omitting that track's contribution.
- Every subcommand ends in exactly one status with an exact `nextAction` —
  no silent stops.

## Validate the module itself
```
node tests/orchestrator.test.js
```

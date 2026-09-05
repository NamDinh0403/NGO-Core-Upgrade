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

## Run the pipeline
```
node tools/orchestrator.js create-run       --client <id> --tracks backend,frontend \
    --core-path <path> [--release-notes <path>] [--source-version <v>] --target-version <v>
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
- Where a track has no structured coverage/deployment output of its own
  (backend today has neither), the merge surfaces an explicit, labelled
  placeholder rather than silently omitting that track's contribution.
- Every subcommand ends in exactly one status with an exact `nextAction` —
  no silent stops.

## Validate the module itself
```
node tests/orchestrator.test.js
```

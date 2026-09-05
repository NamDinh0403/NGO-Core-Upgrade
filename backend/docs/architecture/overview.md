# Architecture Overview

The backend system upgrades client NGO.Core solutions through an explicit,
resumable workflow. It separates four concerns that were previously entangled in
prompt text:

| Concern | What | Where |
|---------|------|-------|
| Procedural memory | how upgrades run | `workflows/`, `config/` |
| Working state | the current run | `runs/<client>/<run-id>/` |
| Episodic memory | what happened in past runs | `memory/episodes/` |
| Semantic memory | validated facts | `knowledge/canonical/` + `memory/approved/` |

## Layers

```
AGENTS.md ──▶ workflows/core-upgrade/workflow.yaml ──▶ phases 01..08
                     │
        config/*.yaml (policy, gates, escalation, retention, priority)
                     │
   tools/orchestration/state-machine.js (deterministic progression)
                     │
   runs/<client>/<run-id>/ (durable, isolated state + checkpoints + JSONL events)
                     │
   knowledge/canonical/ (single source) ◀── knowledge/index (retrieval)
                     │
   memory/ episodes ▶ candidates ▶ (validate+approve) ▶ approved ▶ knowledge/canonical
```

## Evidence policy (preserved)
The decompiled installed `NGO.Core.*.dll` is authoritative for concrete
signatures. Written knowledge corroborates; on conflict, the DLL wins and the
override is recorded. See `config/knowledge-priority.yaml`.

## State machine
`DISCOVERY → TOOL_BOOTSTRAP → BASELINE → PLAN → UPGRADE → BUILD_AND_FIX → TEST → DOCUMENT → HANDOVER → COMPLETE`
with controlled backward transitions. Every step ends in exactly one machine
status; any blocked/failed status routes to `HANDOVER`, which always emits a
resume instruction and an episode. There is no silent exit.

## One source of truth
The `FINAL_CUTOVER` physically removed the legacy layer (the former Agent,
Case-Studies and Version-Changes directories, and the BOOT and ARCHITECTURE root
documents). Procedural behaviour now lives only in `workflows/` + `config/`;
canonical knowledge only in `knowledge/canonical/`; historical runs only in
`memory/episodes/`. The blow-by-blow migration records for that cutover were
themselves removed once complete; `config/repository-layout-policy.yaml` is what
now prevents the legacy layout from returning.

See ADRs under `docs/architecture/adr/` for the key decisions.

# orchestrator

The **single shared coordination layer** for an NGO Core upgrade engagement
spanning backend and/or frontend. Added so a client engagement has one run,
one merged coverage check, and one merged deployment handover — instead of
two independent per-track runs that never talk to each other.

## Why this exists

Before this module: the orchestrator agent delegated to the backend and
frontend agents, and each produced its own independent run, its own
coverage-like output (frontend has structured `requirement-coverage.yaml` /
`missing-steps.yaml` / `deployment-checklist.yaml`; backend has a
differently-shaped `definition-of-done` gate and free-text handover docs),
and its own deployment notes. An engagement touching both tracks ended up
with two disconnected reports that a developer had to reconcile by hand.

`orchestrator/` does not replace either track's own execution — see
[`../docs/refactor/unified-agent-decisions.md`](../docs/refactor/unified-agent-decisions.md)
(DEC-1) for why their internal state machines are deliberately left
untouched. It adds the missing coordination layer on top: one run-id, one
normalized requirements seed per domain, one composed result set, one
coverage check, one deployment handover, one final report.

## What it is not

- Not a third client-mutating track. It never touches a client repository.
- Not a replacement for `ingest/` — it calls the same shared
  `ingest/tools/ingest.js` each track's own `ingest-core-release` skill
  already calls, exactly once, and reuses the result if already fresh.
- Not authoritative over either track's own knowledge, policies, or
  approved memory.

## Structure

```
orchestrator/
├── AGENTS.md                     Contract (read this first)
├── config/artifact-ownership.yaml Write-boundary matrix
├── schemas/                       run-request, shared-run-state, requirement-coverage,
│                                  missing-steps, deployment-checklist
├── templates/                     before/after-deployment.md, final-report.md
├── tools/
│   ├── orchestrator.js            CLI: create-run | compose-results | verify-coverage |
│   │                               prepare-handover | final-report | status
│   └── lib/                       yaml.js, run.js, requirements.js, coverage.js, handover.js
├── tests/orchestrator.test.js
└── runs/                          Durable per-engagement state (git-ignored)
```

## Usage

```
node tools/orchestrator.js create-run --client acme --tracks backend,frontend \
  --core-path D:\Clients\Acme\NGO.Core --target-version 9.2.1

node tools/orchestrator.js compose-results --run acme/<runId> \
  --backend-run  backend/runs/acme/<backend-run-id> \
  --frontend-run frontend/runs/acme/<frontend-run-id>

node tools/orchestrator.js verify-coverage  --run acme/<runId>
node tools/orchestrator.js prepare-handover --run acme/<runId>
node tools/orchestrator.js final-report     --run acme/<runId>
```

## Validate

```
node tests/orchestrator.test.js
```

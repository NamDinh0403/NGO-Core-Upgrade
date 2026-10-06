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
The current contract also owns release ensuring, one CoreChangeSet manifest,
UpgradeContext and isolated executor packets. The previous additive-only decision
is superseded for these shared responsibilities, not for local checkpoints/gates.

## What it is not

- Not a third client-mutating track. It never touches a client repository.
- Not a replacement for `ingest/` — it calls the same shared
  `ingest/tools/ingest.js` once and retains its validated cache. Track wrappers
  now consume the result through this owner, including standalone exact-version runs.
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
  --core-path D:\Clients\Acme\NGO.Core --source-version 9.2.0 --target-version 9.2.1 \
  --backend-client-path <solution> --frontend-client-path <frontend>

node tools/orchestrator.js context --run acme/<runId> --track frontend
node tools/orchestrator.js context --run acme/<runId> --track frontend --evidence-version 9.2.1

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

## Contracts

`schemas/execution-context.schema.json` names CoreChangeSet, UpgradeContext,
BackendContext and FrontendContext. `tools/lib/context.js` creates/validates
them; `execution.js` durably binds track runs; `knowledge.js` owns the shared
track-aware release reader; `discovery.js` limits initial manifest inspection.
`lifecycle.js` projects shared phase/status without replacing domain engines.
`executors.js` dispatches capabilities and contains no domain implementation.

Existing canonical records keep their historical locations and promotion rules;
frontend reader APIs are compatibility adapters, not the owner of generic release
selection. Configuration inspection lives in backend. Its values never enter
frontend planning or shared packets. Validation refreshes sanitized domain evidence
after execution, then rebinds coverage/handover hashes. Legacy runs remain readable;
new runs cannot silently downgrade to legacy when a context is missing.

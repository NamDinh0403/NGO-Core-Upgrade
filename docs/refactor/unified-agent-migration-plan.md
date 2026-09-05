# Unified agent migration plan

Goal: close the gap between the current state (shared ingestion already
exists; each track still plans/runs/reports independently) and the
"minimum working path" the developer prioritized:

1. One orchestrator ingests release requirements. **Already true.**
2. One orchestrator inspects the local Core repository. **Already true**
   (via `ingest/`, read-only).
3. One orchestrator creates one shared run. **Gap — this plan closes it.**
4. Backend and frontend agents receive separate structured plans. **Gap.**
5. Results return to the same run. **Gap.**
6. Coverage is checked once. **Gap.**
7. Deployment handover is generated once. **Gap.**
8. Redundant files and duplicated implementations are deleted. **Mostly
   done already (see inventory); remaining items closed in this plan.**

## Step 1 — Checkpoint (done)

Commit the pre-existing uncommitted rename/orchestrator work as-is, tag
`pre-orchestrator-refactor-checkpoint`. Nothing further is built on an
unreviewable working tree.

## Step 2 — Inventory (this doc set)

`unified-agent-inventory.md` + `unified-agent-reference-map.json` capture the
full current state and disposition of every item before anything else changes.

## Step 3 — Root hygiene

- Add root `.gitignore` (mirrors the two tracks' patterns, adds
  `orchestrator/runs/*`).
- Delete duplicate root `compiler-error-fix-loop.png`; repoint `README.md`.
- Fix the stale `Frontend-Upgrade/` path comment in
  `backend/tools/wrappers/core-repository-history`.
- Full-repo grep sweep for any other stale `Backend-Upgrade`/`Frontend-Upgrade`
  text references.

## Step 4 — Build `orchestrator/` (new shared module)

Mirrors the existing `ingest/` convention (dependency-free Node CLI, minimal
YAML lib, JSON schemas, its own tests) rather than inventing a new pattern.

```
orchestrator/
├── README.md
├── AGENTS.md                     Contract: what the orchestrator owns/does not own
├── .gitignore                    /runs/* ignored, like backend/ and frontend/
├── config/
│   └── artifact-ownership.yaml   Write-boundary matrix (orchestrator vs backend vs frontend)
├── schemas/
│   ├── run-request.schema.json
│   ├── shared-run-state.schema.json
│   ├── requirement-coverage.schema.json
│   ├── missing-steps.schema.json
│   └── deployment-checklist.schema.json
├── templates/
│   ├── before-deployment.template.md
│   ├── after-deployment.template.md
│   └── final-report.template.md
├── tools/
│   ├── orchestrator.js            CLI: create-run | compose-results | verify-coverage | prepare-handover | final-report
│   └── lib/
│       ├── yaml.js                (reused pattern from backend/tools/bootstrap/lib/yaml.js)
│       ├── run.js                 run-id + directory scaffolding
│       ├── requirements.js         splits ingest's candidate record + feature-decisions into backend/frontend/shared slices
│       ├── coverage.js             merges each track's own coverage/gate output into one report
│       └── handover.js             merges each track's own deployment-relevant output into one handover
├── tests/
│   └── orchestrator.test.js
└── runs/
    └── README.md                  (actual run dirs are git-ignored, like the other two tracks)
```

### `orchestrator.js create-run`
Inputs: client id, track(s) requested, core repo path, release-notes path
(optional), target version(s), feature decisions.
Actions:
1. Generate one `run-id`, create `orchestrator/runs/<client>/<run-id>/`.
2. Write `request.yaml`, initial `state.json`.
3. Invoke `ingest/tools/ingest.js check` / `ingest` exactly as the existing
   agents already do (no change to `ingest/`).
4. Read the resulting candidate record and split it plus
   `feature-decisions.yaml` into `requirements/{all,backend,frontend,shared,decisions}.yaml`.
Output: paths to hand each track (run-id, requirements file, shared run dir).
This is an **additive seed** — each track keeps doing its own planning; this
file is extra read-only context, not a replacement.

### `orchestrator.js compose-results --run <id>`
Reads (never writes) each track's own `state.json` + report path — supplied by
the orchestrator agent after each sub-agent finishes — and writes
`results/{backend,frontend}-result.yaml` under the shared run. No mutation of
`backend/runs/` or `frontend/runs/`.

### `orchestrator.js verify-coverage --run <id>`
Reads frontend's own `requirement-coverage.yaml`/`missing-steps.yaml` (if the
frontend track ran) and backend's own definition-of-done outcome (if the
backend track ran), plus the shared `requirements/all.yaml`, and writes ONE
`requirement-coverage.yaml` + `missing-steps.yaml` under the shared run.

### `orchestrator.js prepare-handover --run <id>`
Only runs after `verify-coverage` succeeds. Reads frontend's own
`deployment-checklist.yaml` and backend's own handover-phase output, merges
into ONE `before-deployment.md`, `after-deployment.md`,
`deployment-checklist.yaml` under the shared run.

### `orchestrator.js final-report --run <id>`
Writes `final-report.md`: status per track, links to each track's own
plan/report and `state.json`, the merged coverage summary, the merged
handover, one aggregated next action.

## Step 5 — Update the 3 agent/skill entry points

- `.github/agents/ngo-core-upgrade-orchestrator.agent.md` +
  matching `SKILL.md`: replace the "collect → shared ingest → delegate →
  combine text report" loop with "collect → `create-run` → delegate (passing
  run-id + requirements seed) → `compose-results` → `verify-coverage` →
  `prepare-handover` → `final-report`".
- `.github/agents/ngo-core-backend-upgrade.agent.md` /
  `ngo-core-frontend-upgrade.agent.md` + matching `SKILL.md`s: add a short
  paragraph — when launched by the orchestrator with a run-id and a
  requirements seed file, read it as additional context, keep writing your
  normal internal artifacts under your own `runs/` exactly as today.

No filenames or locations change.

## Step 6 — Root docs refresh

`AGENTS.md`, `README.md` (layout diagram + routing table), `IMPORT.md`
(hand-off section) gain a short description of `orchestrator/` and the shared
run, consistent with the actual new behavior.

## Step 7 — Validate

Existing suites must still pass, unmodified:
- `node ingest/tools/ingest.test.js`
- `cd backend && node tools/validate.js && node tools/run-evals.js`
- `cd frontend && node tools/validate.js && node tools/repo-layout.test.js`

New suite:
- `cd orchestrator && node tests/orchestrator.test.js`

## Step 8 — Final report

`unified-agent-progress.md` is updated at the end of each step (not just at
the end) so it always reflects real, current status rather than a
retrospective reconstruction.

## Explicitly deferred (see decisions.md for the reasoning)

- 7 of the pasted spec's 9 named `.github/skills/*` (all but
  `verify-release-coverage` and `prepare-deployment-handover`, whose
  equivalents already exist per-track).
- `.github/instructions/*.instructions.md` and
  `.github/prompts/*.prompt.md` scaffolding.

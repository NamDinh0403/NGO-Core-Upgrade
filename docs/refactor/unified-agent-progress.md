# Unified agent — progress and final report

## Status

| Step | Status |
|---|---|
| 1. Git checkpoint | ✅ Done — commit `9a5bbda`, tag `pre-orchestrator-refactor-checkpoint` |
| 2. Inventory docs | ✅ Done |
| 3. Root hygiene | ✅ Done |
| 4. Build `orchestrator/` | ✅ Done — 12/12 tests passing |
| 5. Update 3 agent/skill entry points | ✅ Done |
| 6. Root docs refresh | ✅ Done |
| 7. Validate | ✅ Done — 0 regressions across all 4 suites |
| 8. Final report | ✅ Done (this section) |

## Final `.github/agents/` tree
```
.github/agents/
├── ngo-core-backend-upgrade.agent.md      (edited: additive orchestrator-seed note)
├── ngo-core-frontend-upgrade.agent.md     (edited: additive orchestrator-seed note)
└── ngo-core-upgrade-orchestrator.agent.md (edited: drives orchestrator/tools/orchestrator.js)
```
No renames — all three already used the correct, Copilot-discoverable
`.github/agents/<name>.agent.md` naming and location.

## Final `.github/skills/` tree
```
.github/skills/
├── ngo-core-backend-upgrade/SKILL.md      (edited: additive orchestrator-seed note)
├── ngo-core-frontend-upgrade/SKILL.md     (edited: additive orchestrator-seed note)
└── ngo-core-upgrade-orchestrator/SKILL.md (edited: drives orchestrator/tools/orchestrator.js)
```
No new skill folders added — see `unified-agent-decisions.md` DEC-2/DEC-3 for
why the pasted spec's other 7 named shared skills were deliberately not
re-created here (equivalents already exist per-track).

## Final shared repository tree (top level)
```
NGO Core Upgrade/
├── .github/agents/, .github/skills/   (3 + 3, see above)
├── .gitignore                          NEW — root ignore rules
├── AGENTS.md                           edited — orchestrator routing + shared run steps
├── README.md                           edited — orchestrator in layout diagram/routing table, fixed image ref
├── IMPORT.md                           edited — shared-run hand-off + sanity-check command
├── install.ps1 / install.sh / uninstall.ps1 / uninstall.sh / package-agent.ps1 / *.code-workspace   unchanged
├── docs/refactor/                      NEW — this inventory/plan/decisions/progress set + reference-map.json
├── ingest/                             unchanged (11 files) — shared release ingestion
├── orchestrator/                       NEW (20 files) — shared cross-track coordination module
├── backend/                            unchanged internals (231 files) — 1 stale comment fixed
└── frontend/                           unchanged internals (370 files)
```

## Agent responsibility summary

| Agent | Owns | Never does |
|---|---|---|
| **ngo-core-upgrade-orchestrator** | Collects inputs once; creates the one shared run (`orchestrator create-run`); delegates to both sub-agents with a normalized requirements seed; composes results, verifies coverage once, prepares the deployment handover once, writes the final report | Client mutation; re-deriving either track's plan; re-implementing coverage/handover merge logic; hiding a sub-agent's `BLOCKED_*` |
| **ngo-core-backend-upgrade** | .NET/NuGet/EF/appsettings upgrade for one client solution, its own 10-phase workflow, its own `runs/<client>/<run-id>/` | Frontend files; raw release-note parsing (delegates to `ingest/`); independent deployment handover; writing outside its own run/results |
| **ngo-core-frontend-upgrade** | Angular/NgRx/package.json upgrade for one client front-end, its own dual-repository pipeline, its own `runs/<client>/<run-id>/` | Backend files; Core repository mutation; raw release-note parsing; independent deployment handover; writing outside its own run/results |

## Handoff contracts (what each agent hands / receives)

- **Orchestrator → backend/frontend**: shared `runId`; path to
  `orchestrator/runs/<client>/<runId>/requirements/{backend,frontend}.yaml`
  (additive, read-only seed — never authoritative over the track's own
  planning).
- **backend/frontend → Orchestrator**: nothing pushed — the orchestrator
  *pulls* by reading each track's own `runs/<client>/<run-id>/state.json`
  via `orchestrator compose-results --backend-run <path> --frontend-run <path>`.
- **Orchestrator internal**: `create-run` → `compose-results` →
  `verify-coverage` → `prepare-handover` (refuses if coverage hasn't run) →
  `final-report`. Every step writes `state.json.nextAction`; no silent stops.

## Files moved
- None in this session (the Backend-Upgrade→backend / Frontend-Upgrade→frontend
  rename was already-uncommitted prior work, captured as-is in the checkpoint
  commit `9a5bbda` before this session's changes began).

## Files deleted
- `compiler-error-fix-loop.png` (repo root) — byte-identical duplicate (SHA256
  verified) of `frontend/docs/assets/compiler-error-fix-loop.png`, the correct
  location. `README.md` reference repointed.

## Files retained and why
- `backend/**`, `frontend/**` internal state machines, knowledge, skills,
  policies, schemas, templates, tools, docs — retained unchanged by design
  (DEC-1): mature, independently tested, in active use with real client run
  history. Rewriting them was assessed as high-risk for no required benefit.
- `backend/runs/`, `frontend/runs/` (git-ignored, real client run history) —
  retained on disk, never committed, per each track's own
  `repository-layout-policy.yaml` / `.gitignore`.
- `ingest/**` — retained unchanged: already a genuinely shared, non-duplicated
  module; both tracks' `ingest-core-release` skill already delegates to it.
- `install.ps1`/`install.sh`/`uninstall.*`/`package-agent.ps1`/
  `*.code-workspace` — retained unchanged: already generic over whatever
  exists under `.github/agents`/`.github/skills`, and `package-agent.ps1`
  already excludes any directory literally named `runs` at any depth, so it
  needed no update to also exclude `orchestrator/runs/`.

## Tests and evaluations executed
| Suite | Command | Result |
|---|---|---|
| Ingest | `node ingest/tools/ingest.test.js` | 14/14 passed |
| Orchestrator (new) | `node orchestrator/tests/orchestrator.test.js` | 12/12 passed |
| Backend structural | `node backend/tools/validate.js` | 15/15 checks passed |
| Backend behavioural evals | `node backend/tools/run-evals.js` | 12/12 passed, silent-stop-rate=0 |
| Frontend structural | `node frontend/tools/validate.js` | VALID |
| Frontend layout policy | `node frontend/tools/repo-layout.test.js` | LAYOUT OK |

## Validation results
Zero regressions. Every pre-existing suite passes unmodified after this
session's changes; the new `orchestrator/tests/orchestrator.test.js` suite
covers YAML round-tripping, run-id generation, requirement splitting
(including feature-decision exclusion), coverage merging (both the
frontend-structured path and the backend-synthetic path), deployment-handover
merging, and a full CLI end-to-end flow including the
`prepare-handover`-before-`verify-coverage` refusal gate.

## Manual blockers
None. Every inventoried item resolved to a definite disposition (see
`unified-agent-reference-map.json`, `manualBlockers: []`).

## Exact first step for a new developer
1. Read root [`AGENTS.md`](../../AGENTS.md) — it is the single entry point.
2. To run a full engagement: say `Upgrade NGO Core for <client> to <version>`
   to the **NGO Core Upgrade Orchestrator** agent/skill, or manually:
   ```powershell
   node orchestrator/tools/orchestrator.js create-run --client <id> --tracks backend,frontend \
     --core-path <coreRepoPath> --target-version <version>
   ```
3. To validate the framework itself before any client work:
   ```powershell
   node ingest/tools/ingest.test.js
   cd orchestrator; node tests/orchestrator.test.js
   cd ../backend;  node tools/validate.js; node tools/run-evals.js
   cd ../frontend; node tools/validate.js; node tools/repo-layout.test.js
   ```
4. For deferred scope (not built this session — see `unified-agent-decisions.md`
   DEC-5), a future pass may add `.github/instructions/*.instructions.md`
   and `.github/prompts/*.prompt.md` scaffolding per the original spec.

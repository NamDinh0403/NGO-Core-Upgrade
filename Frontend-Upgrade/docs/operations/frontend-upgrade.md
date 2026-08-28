# Running a front-end upgrade

End-to-end operational guide for upgrading a client front-end to a target NGO Core in a
single session.

## Inputs

| Flag | Required | Meaning |
| --- | --- | --- |
| `--client-path`    | yes | Client front-end repository (the only repository modified). |
| `--core-path`      | yes | Local NGO Core repository (read-only source of truth). |
| `--source-version` | yes | Core version the client currently integrates (e.g. `8.3.0`). |
| `--target-version` | one of | Target Core version (e.g. `9.2.0`). |
| `--target-ref`     | one of | Target Core git reference (branch/tag/commit) - read via a disposable worktree. |
| `--request <file>` | alt | Supply all inputs from a request YAML/JSON file. |
| `--run <id>`       | no  | Explicit run id (otherwise generated). |
| `--execute`        | no  | Continue past planning into gated, client-only mutation. |

## Stage-by-stage

### 1. Preflight (`doctor`, read-only)
Validates both repositories, confirms the source version agrees, and that the paths are
distinct and non-nested. Records the initial Core fingerprint. See
[frontend-doctor.md](frontend-doctor.md).

### 2. Read-only analysis (`start`)
Runs inventory -> Core inspection -> package resolution -> requirement derivation ->
Core-to-client mapping -> plan. Nothing in either repository is modified. Artifacts appear
under `runs/<client>/<run-id>/`:

- `inventory/` - client file inventory, semantic graph, role coverage
- `core/` - Core inventory, semantic graph, fingerprint
- `packages/manifest.json`, `packages/alignment-map.json` - exact target versions
- `requirements/`, `maps/` - semantic requirements and the requirement/impact maps
- `plan/plan.json` - the plan (exact files + evidence)
- `uncertainty-register.yaml` - classified uncertainties

Review the plan and the uncertainty register. Resolve any HIGH/CRITICAL uncertainties
(they block mutation).

### 3. Execute (`run` or `start --execute`, client only)
Mutation only proceeds when the mutation gate passes:

- plan exists and is READY (or READY_WITH_ASSUMPTIONS where policy permits assumptions),
- a client rollback checkpoint exists,
- the Core fingerprint is recorded and Core is unchanged,
- planning fingerprints still match the current repositories,
- no HIGH/CRITICAL uncertainty is open,
- the action being applied is in the plan, and retries are not exhausted.

Each change is checkpointed. Failures route to `investigate-frontend-failure`, which
classifies and applies bounded fixes or triggers replanning.

### 4. Audit (mandatory, `audit`)
The run cannot complete until `audit-frontend-integration` passes:

- the exact target versions are installed (no ranges/`latest`),
- the production build succeeds,
- required config keys, providers, and routes are present at their resolved points,
- Core is unchanged (`coreUnchanged`).

Possible blocks: `BLOCKED_INTEGRATION`, `BLOCKED_BUILD`, `BLOCKED_CORE_MODIFIED`,
`BLOCKED_NEEDS_DEVELOPER`.

### 5. Learn (`learn`)
`learn-from-frontend-run` writes **redacted candidates only** under the run directory.
Candidates are never auto-approved and never cross into another client's context.

## Checking progress

```
node tools/frontend-upgrade-agent.js status --run <id>
```

Shows run status, the doctor result, coverage, package alignment, documentation
completeness, and the exact next action.

## If a stage blocks

Every blocked/failed status routes to `developer-escalation`, which writes an escalation
record and emits an exact `resumeCommand`. Fix the blocker, then
[resume](frontend-resume.md).

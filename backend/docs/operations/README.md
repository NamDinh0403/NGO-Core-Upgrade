# Operations Guide

How to run and maintain the Core upgrade system.

## Start a new run
1. Choose a sanitized client id (lowercase kebab-case, no secrets), e.g. `acme`.
2. Create `runs/<client>/<run-id>/` where `<run-id>` = `<client>-<UTC-timestamp>-<seq>`.
3. Write `request.json` (`schemas/run-request.schema.json`).
4. Open `workflows/core-upgrade/phases/01-discovery.md` and follow phases 01→08.

## Resume a run
1. Open `runs/<client>/<run-id>/state.json`.
2. Read `status`, `nextAction`, `safeResumeInstruction`.
3. Restore from the most recent valid checkpoint in `checkpoints/`.
4. Do **not** repeat any action whose `idempotencyKey` is already in `actions.jsonl`.

## Inspect a blocked run
1. `state.json.status` is one of `BLOCKED_NEEDS_*` / `FAILED_*` / `CANCELLED`.
2. Read the generated `developer-escalation.md` in the run directory (from `templates/developer-escalation.md`).
3. It lists attempted fixes, why each failed, the exact decision/info required, and the exact resume instruction.
4. After the developer provides the decision, record it in `decisions.jsonl` and resume.

## Approve or reject a candidate pattern
1. Review the record in `../engine/memory/candidates/backend/**` against `config/escalation-policy.yaml` promotion requirements.
2. Run `node tools/run-evals.js` (regression replay) and confirm no contradiction with canonical knowledge.
3. To approve: set `status: approved`, `approvalStatus: approved`, `approvedBy`, add a `reviewHistory` entry, and move the file to `../engine/memory/approved/backend/<type>/`.
4. To reject: set `status: rejected` with `rejectionReason`, and move to `../engine/memory/rejected/backend/`. Never delete — retain the reason.

## Add version knowledge
1. Create `knowledge/canonical/versions/<x.y.z>.json` following `schemas/version-knowledge.schema.json`.
2. Add the route to `knowledge/index/routing-table.json.routes.versions`.
3. Run `node tools/validate.js` to confirm schema + reference integrity.

## Regenerate derived documentation
Derived Markdown (`knowledge/derived/**/*.md`) is generated from canonical JSON — never edit
it as an authoritative source. Regenerate from the JSON registries and re-run
`node tools/validate.js`. Given the same canonical inputs, the output is reproducible.

## Run validation and evaluations
```
node tools/validate.js     # structural, schema, reference, invariants
node tools/run-evals.js    # behavioural regression scenarios
```
Both must exit 0 before declaring the refactor healthy.

## Remove a client's retained memory
See `docs/operations/remove-client-memory.md`.

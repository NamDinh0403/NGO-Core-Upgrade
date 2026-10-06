# Shared Upgrade Engine

The engine is the sole upgrade framework. Follow
[shared lifecycle](skills/lifecycle/SKILL.md); it owns the executable lifecycle,
not a projection over track workflows. Generic policy is
[execution-policy.json](config/execution-policy.json). Domain adapters implement
inspection, implementation planning, execution and verification only.

## Commands
From repository root:
```
node engine/tools/upgrade-engine.js create-run --client <id> --tracks backend,frontend --core-path <core> --source-version <source> --target-version <target> --backend-client-path <solution> --frontend-client-path <client>
node engine/tools/upgrade-engine.js dispatch --run <client>/<run> --track backend --operation plan
node engine/tools/upgrade-engine.js register-plan --run <client>/<run> --track backend --file <plan-and-gate-facts.json>
node engine/tools/upgrade-engine.js dispatch --run <client>/<run> --track backend --operation execute
node engine/tools/upgrade-engine.js record-validation --run <client>/<run> --track backend --file <evidence.json>
node engine/tools/upgrade-engine.js compose-results --run <client>/<run>
node engine/tools/upgrade-engine.js verify-coverage --run <client>/<run>
node engine/tools/upgrade-engine.js prepare-handover --run <client>/<run>
node engine/tools/upgrade-engine.js final-report --run <client>/<run>
node engine/tools/upgrade-engine.js context --run <client>/<run> --track frontend
node engine/tools/upgrade-engine.js status --run <client>/<run>
```
Dispatch each requested track independently. Engine control commands are serial;
delegate domain work in parallel only for independent client working trees.
Plan inputs are `{plan:{status,changes:[{file,evidence,validation}]},gateFacts:{...}}`.
`gateFacts.proofRefs` binds baseline, rollback-checkpoint, repository-status,
capabilities and uncertainty records, plus core-fingerprint for frontend.
Proof files are run-bound JSON envelopes with hashed artifacts. The engine
checks their hashes and captures live client/Core fingerprints; boolean facts
alone never open the gate. Planned files cannot escape the client root or Core.
Evidence is `[{kind,status,ref}]`; each ref is a JSON envelope produced by
`tools/lib/validation.envelope(packet, kind, proof)`. It carries schemaVersion,
run/client/track/target identity, kind/status, summary and hashed artifact refs.
Command-based checks include exact command and exitCode 0. Coverage, dispositions
and deployment records contain requirements/findings/items arrays respectively.
Baseline and repository-status proofs carry the live clientFingerprint; baseline
also records its successful command/result. Rollback proof carries the existing
Git commit. Core proof carries coreFingerprint. Capabilities/uncertainty proofs
carry capabilities/missingCapabilities/uncertainties arrays. These facts are
derived and cross-checked by the engine, not trusted from caller booleans.
Coverage, finding dispositions and structured deployment checklist are mandatory
evidence for both executors. Documentation evidence carries every required
documentationStatus flag from the track compatibility profile; pending items
still block completion. The engine publishes validated result envelopes.
Use `diagnose --file <failure.json>` for `{signature,ref}` within shared budgets;
use `learn --file <redacted-record.json> [--candidate]` for scoped capture.
Learning input is `{record,redactionReview}`. The review names reviewer Agent or
Developer, confirms personalDataRemoved/clientBusinessRulesRemoved/sourceBodiesRemoved
and cites evidence. Uncertain redaction blocks capture; review is not approval.
After execution blockage, `replan --file <approval.json>` requires the explicit
developer decision APPROVED_FOR_REPLAN, reviewer Developer, runId, track and
targetVersion. It preserves history and requires fresh inspection/proofs/planning.
Never fabricate that approval or silently reset an exhausted retry budget.
All results retain exact next actions and safe resume instructions.

## Boundaries
The engine invokes unchanged ingest once and owns CoreChangeSet lifetime.
Canonical Core knowledge lives in `ingest/knowledge/canonical/`; the shared reader
loads only applicable scope/range. Track contexts carry common requirements,
their own facts/impact and API/integration status, never opposite-track internals.
Installed surface and domain semantic interpretation remain executor work.

The engine stores shared runs at the existing `orchestrator/runs/` location for
compatibility; physical location is not ownership. Track run files are domain
artifacts/checkpoint projections, not authoritative global state machines.
Historical public imports/CLI/skill IDs are adapters, not alternative engines.
New execution is registered/dispatched/validated here; legacy results remain
readable for historical evidence and reporting, never a way to bypass a registered
engine plan or its validation.

Use shared plan/validate/diagnose/report/learn/escalate skills. Generic memory is
`engine/memory/{episodes,candidates,approved,rejected}/<scope>` and only the shared
mechanism manages it. Existing imported records keep original contents; directory
scope supplies their metadata. Developer review is required for promotion.
# Shared Upgrade Engine

The engine is the sole upgrade framework. Follow
[shared lifecycle](skills/lifecycle/SKILL.md); it owns the executable lifecycle,
not a projection over track workflows. Generic policy is
[execution-policy.json](config/execution-policy.json). Domain adapters implement
inspection, implementation planning, execution and verification only.

## Command-First Upgrade Execution
This is the default for client upgrades, including minor/patch releases:
- Execute documented CLI commands, consume their structured output and proceed.
  Run `node engine/tools/upgrade-engine.js --help` for syntax, then `status` /
  `context` for an existing run. Reading a JS file is not executing a check.
  Do not inspect CLI/library/test implementations before running the supported
  command; read only the failing function when an actual error cannot be
  explained by help, current context and the relevant contract.
- Read root/engine/requested-track contracts once, the current skill and the
  relevant release slice. Search for symbols/files first and read bounded
  ranges. Reuse verified ingestion, inventory, installed API and prior command
  output while its identity/fingerprint remains valid. Do not reread entire
  frameworks, all skills, raw release JSON or unrelated client directories.
- Do not create test/spec files, test projects, synthetic apps, custom harnesses
  or duplicate research/probe scripts during a client upgrade. Use existing
  tools and direct bounded commands. Required run evidence/logs, plan/report,
  production compatibility edits and EF migration/snapshot/SQL files are not
  tests and remain required; keep artifacts in the existing run.
- Default validation is restore/install, required zero-error builds, installed
  package/API checks, configuration/integration coverage and planned EF output
  review. Unit/browser/regression suites are opt-in: run existing targeted tests
  only when explicitly requested or needed to diagnose a concrete regression.
  Record `tests` as `SKIPPED` with the reason; never fabricate a passing command.
  A skipped optional suite is not a completion blocker or a claim tests passed.
- Capture one baseline and validate each coherent changed batch. Rebuild only
  after relevant input changes, failed-build fixes or generated EF code; do not
  repeat restore/install/build for reporting or duplicate audit evidence.
  Independent backend/frontend work remains parallel. Never hide a real failed
  command, omit mandatory checks or bypass safety/coverage gates to save time.
- Framework test suites validate changes to this framework, not client upgrades.
  Do not run `tools/validate-all.js` or framework tests during a client upgrade.
  When explicitly maintaining this framework, extend an existing relevant test
  and run the smallest affected suite; the full framework check is the final
  maintenance check, not an executor step.

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
delegate domain work in parallel for independent client working trees (such as backend
and frontend in separate subdirectories). When both tracks are upgraded, run them
concurrently in parallel without waiting for one to finish before starting the other.
Plan inputs are `{plan:{status,changes:[{file,evidence,validation}]},gateFacts:{...}}`.
`gateFacts.proofRefs` binds baseline, rollback-checkpoint, repository-status,
capabilities and uncertainty records, plus core-fingerprint for frontend.
Proof files are run-bound JSON envelopes with hashed artifacts. The engine
checks their hashes and captures live client/Core fingerprints; boolean facts
alone never open the gate. Planned files cannot escape the client root or Core.
Evidence is `[{kind,status,ref}]`; each ref is a JSON envelope produced by
`tools/lib/validation.envelope(packet, kind, proof)`. It carries schemaVersion,
run/client/track/target identity, kind/status, summary and hashed artifact refs.
Command-based passed checks include exact command and exitCode 0. The optional
`tests` envelope may instead use `status: "SKIPPED"` and a nonempty summary
explaining why; omit command/exitCode. Other skipped checks still block. Keep
the test disposition visible in the report; do not set testsCompleted to true
when tests were not run. Coverage, dispositions
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
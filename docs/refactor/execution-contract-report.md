# Shared Execution Contract Refactor

Historical report from the preceding refactor; its ownership descriptions and
14-suite validation apply to that revision, not the current implementation.
Superseded by [the shared engine report](shared-engine-report.md).

## Architecture

Before: shared ingest supplied candidates; coordination supplied advisory seeds
and merged reports; both track procedures could ensure release evidence and
frontend planning included backend configuration/requirements.

Now: `ngo-core-upgrade` uses one shared ensuring owner and generic lifecycle.
CoreChangeSet references existing verified release records. UpgradeContext binds
run, client identity, target, shared requirements, policies and integration
evidence. Isolated domain executors retain implementation, READY mutation gates,
checkpoints, bounded diagnosis and local validation. The orchestrator dispatches
capabilities; it does not implement package, EF or Angular edits.

Backend owns NuGet/.NET, installed DLL evidence, EF/database, configuration and
backend canonical dispositions. Frontend owns npm/Angular/TypeScript/NgRx,
providers/routes/templates and the mandatory reference-host integration audit.
API hints are explicitly marked for semantic review, not compatibility proof.

## Ingest And Knowledge

`orchestrator/tools/lib/context.js#ensureCoreChangeSet` is the ensuring owner.
It reuses `ingest.ensureReleases` without changing analysis, identity/cache,
redaction, Core fingerprints, tag checks or atomic candidate writes. The manifest
binds ordered intermediate releases and record hashes; it is not another analyzer
or copied knowledge store. Live consume checks validate notes, commits and analyzer
identity without re-extracting facts. Changed/missing evidence blocks safely.

The shared knowledge reader owns generic range/scope/cache selection. Curated
records retain their historical physical paths and authority; domain adapters
retain their distinct knowledge and installed-package evidence. No canonical
records or policies were edited, duplicated or automatically promoted.

## Context Isolation

BackendContext: backend manifests/SDK pin, backend/shared requirement seeds,
policy reference, Core fingerprint and relevant API/integration hints. Further
NuGet/EF/configuration inspection is domain-owned and lazy.

FrontendContext: frontend manifest/dependency facts, frontend/shared requirement
seeds, policy reference, Core fingerprint and API/integration validation status.
It excludes backend appsettings values, connections, EF/database implementation
and backend-only configuration; BackendContext excludes Angular/NgRx internals
and frontend dependencies. Lazy evidence retrieval filters the opposite track.

The moved configuration adapter persists no client configuration values. Shared
coverage/handover keeps backend actions visible. Owner validation refreshes that
evidence after execution, invalidating old coverage/handover hashes.

## Efficiency

- Two track-local ingest CLI procedures now consume the single shared owner;
  there was already only one analyzer, and it remains unchanged.
- One generic lifecycle replaces repeated ensuring/handoff rules; domain skills
  and legacy registry identities remain. No domain skill was removed.
- One release knowledge reader and one backend configuration implementation;
  old module paths are compatibility adapters, not duplicate implementations.
- Backend doctor reuses bootstrap evidence instead of gathering it a second time.
  Broad parent-workspace discovery is replaced by requested-root manifest reads.
- Shared requirements appear once per packet; lazy evidence retrieval performs
  one consume/verification pass instead of two. Manifest declarations containing
  URLs/local references remain lazy markers, never credential-bearing context.
- Existing range fixture measures 73 full release YAML reads versus 6 scoped
  reads for 9.1.0 to 9.2.0; this pre-existing optimization remains preserved,
  not claimed as a new reduction. Frontend-only scope selection adds isolation.
- No model-call/token/credit savings were measured. Deterministic CLI/context
  work adds no explicit model calls; Copilot semantic reasoning is not instrumented.

## Important Files

Added: shared context, execution, discovery, knowledge, lifecycle and capability
dispatch modules; execution-context schema; shared lifecycle skill; backend
configuration adapter; this report.

Modified: orchestrator CLI/schemas/requirements/coverage/handover/tests; backend
bootstrap discovery and CLI; frontend CLI/range/planning/reader compatibility
adapters and release tests; root/module contracts and READMEs; existing Copilot
agent/skill surfaces; artifact ownership; complete validation runner.

Key additions: [context](../../orchestrator/tools/lib/context.js),
[execution](../../orchestrator/tools/lib/execution.js),
[discovery](../../orchestrator/tools/lib/discovery.js),
[knowledge](../../orchestrator/tools/lib/knowledge.js),
[lifecycle](../../orchestrator/tools/lib/lifecycle.js),
[capability dispatch](../../orchestrator/tools/lib/executors.js),
[execution schema](../../engine/schemas/execution-context.schema.json),
[shared lifecycle skill](../../orchestrator/skills/lifecycle/SKILL.md), and
[backend configuration](../../backend/tools/configuration.js).

Moved responsibility, not canonical data: release reader to shared ownership;
configuration implementation to backend ownership. No tracked files deleted.
User's existing untracked project-structure document remains untouched.

## Validation

Baseline: `node tools/validate-all.js`, all 14 suites passed, working tree unchanged.
Focused orchestration: `node orchestrator/tests/orchestrator.test.js`, 30/30 passed.
Focused release knowledge: `node frontend/tests/release-knowledge.test.js`, 38/38 passed.
Backend skills: `node tools/skills.test.js` from backend, 40/40 passed.
Final complete validation: `node tools/validate-all.js`, 14/14 suites passed;
working-tree status and tracked contents unchanged, including already-dirty files.

The exact reliable Windows task invocation was
`"C:\Program Files\nodejs\node.exe" tools/validate-all.js`; focused task commands
used the same executable with `orchestrator/tests/orchestrator.test.js`.
Successful native focused commands used
`C:\Progra~1\nodejs\node.exe frontend/tests/release-knowledge.test.js` and
`C:\Progra~1\nodejs\node.exe orchestrator/tests/orchestrator.test.js`.
Intermittent terminal PATH/invocation failures were resolved by the task runner;
they are not treated as passed validations.

The complete runner executed these commands from their owning module directories,
all passing:

| Module | Commands |
| --- | --- |
| ingest | `node tools/ingest.test.js` |
| orchestrator | `node tests/orchestrator.test.js` |
| backend | `node tools/validate.js`; `node tools/repo-layout.test.js`; `node tools/skills.test.js`; `node tools/release-knowledge.test.js`; `node tools/bootstrap/tests/bootstrap.test.js`; `node tools/run-evals.js` |
| frontend | `node tools/validate.js`; `node tools/repo-layout.test.js`; `node tools/skills.test.js`; `node tests/release-schema.test.js`; `node tests/release-knowledge.test.js`; `node tools/run-evals.js` |

Windows execution used the installed Node executable and VS Code tasks where
terminal PATH/capture was unreliable. Suite commands run from their module root.
The final runner additionally compares tracked content hashes, including dirty
files, so a status-only match cannot conceal a test mutation.

## Remaining Risks

Real-client upgrades, installed user-profile discovery and deployment were not
rehearsed. Domain checkpoint engines remain behind adapters; their valid local
transitions were not speculatively deleted. Legacy raw reader APIs remain for
compatibility, but the new runtime defaults use isolated views. Reference-only
legacy frontend requests without a resolved exact version retain their existing
read-only inspection path; a shared exact-version run is the recommended upgrade
entry point. Canonical record formats/physical consolidation and differing domain
policy ranks were intentionally not rewritten.

## Source Cleanup (2026-10-06)

Reference checks found no safely removable whole-source-file candidates outside
historical inventories. SHA-256 comparison found no byte-identical files in the
checked JS/PowerShell/shell/JSON/YAML source/config/schema set; runs, knowledge,
memory, dependency caches and fixture data were excluded from deletion candidates.

Removed the unreachable private backend workspace walker and unreferenced
`detectClientToolVersions` helper/export. Reused the existing shared snapshot
hasher and migration loader instead of maintaining duplicate implementations.
Removed the unused `base` argument from internal domain-evidence refresh and
updated its caller/test. No production source file, canonical record, fixture,
compatibility reader, maintenance tool or historical evidence was deleted.

YAML parser forks were inspected but retained: backend scalar handling and
frontend flow collections/writer behavior differ, so replacing them is not a
behavior-neutral deletion. Referenced compatibility modules and templates remain.

Focused checks passed: bootstrap 24/24, orchestration 30/30, release knowledge
38/38. Final `"C:\Program Files\nodejs\node.exe" tools/validate-all.js` passed all
14 suites with working-tree status and tracked contents unchanged. Temporary
validation task configuration was removed; existing VS Code settings preserved.
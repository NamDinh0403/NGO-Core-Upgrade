# Shared Upgrade Engine Refactor

## Before
Core release ingestion and caching were already shared. However, backend and
frontend each implemented generic skill/schema/uncertainty/mutation machinery,
separate authoritative workflow graphs, retry budgets and learning/escalation
procedures. Orchestrator projected their progress and merged results afterward.
Core release/configuration knowledge lived in track directories; generic memory
was backend-owned. This was coordination over two frameworks, not one engine.
The seven-question dependency audit is [shared-engine-ownership.md](shared-engine-ownership.md).

## After
`ingest -> engine -> backend/frontend executors` is the dependency direction.
Ingest produces one canonical CoreChangeSet using the existing analyzer/cache.
Engine owns DISCOVER, CORE_ANALYSIS, IMPACT_ANALYSIS, PLAN, EXECUTE, VALIDATE and
REPORT, including persisted plan registration, executor dispatch, evidence and
recovery. Tracks expose READY/RUNNING/PASSED/FAILED/BLOCKED. Orchestrator CLI and
imports are facades; its existing run directory remains a compatibility location.
Domain mutation remains agent-driven through the preserved specialized skills
and tools, not a new speculative automatic source-rewriter.

## Shared
Lifecycle, context slicing and lazy evidence; planning/mutation/uncertainty gates;
registry/schema/capability mechanism; idempotency/checkpoints/log storage;
retry/diagnosis/replan coordination; scoped memory and developer review;
generic skills, safety/retention policy, validation coordination, coverage,
deployment handover and final report. Shared Core release/configuration records
were moved to ingest, not copied or promoted. Existing record contents remain.

## Backend
.NET SDK/project/NuGet inspection, installed Core assemblies and public API,
selective decompilation, EF/migrations, startup configuration and source changes.
Existing wrapper/bootstrap verification remains. New validation requires installed
assembly/API, restore/build/test/configuration, coverage, finding dispositions and
deployment/documentation evidence. Installed DLL signatures still override source descriptions.

## Frontend
Angular/TypeScript/NgRx, exact dependency/toolchain alignment, client semantic
inventory, target host-app comparison, routes/providers/templates/assets/config
authority, development/production builds and integration audit. The preserved
deterministic analysis batch moved behind the executor; the old CLI delegates.
Core remains read-only. Backend settings/EF internals never enter frontend context.

## Removed Duplication
- Two generic skill engines became domain adapters to one shared mechanism.
- Independent track FSM implementations became compatibility adapters; generic
  routing/resume/idempotency/retry logic exists only in the engine.
- Generic lifecycle/status/checkpoint blocks were removed from track policies;
  retry budgets now have one source. Backend workflow YAML is a domain task index.
- Three YAML parsers became one; production/test schema checks use shared code.
- Duplicate learning/escalation/ingest procedures became shared-skill adapters.
- Generic memory tiers/schemas and shared Core knowledge left track ownership.
- Coverage consumes both structured executor results; new reporting no longer
  depends on separate track lifecycle completion or synthetic backend-only status.

## Context Reduction
Executors receive one verified context: common requirements, their own repository
facts/impact, API hints and integration status. No opposite-domain implementations,
full repository description or full Core diff. Additional immutable release
evidence is retrieved lazily by track/version. Mutable integration-validation
status does not invalidate immutable planning identity; its evidence is still
fingerprinted and included in coverage.

## LLM Efficiency
Deterministic tools own transitions, gates, hashes, schema checks, prerequisite
checks, registry selection and report composition. Model reasoning remains for
domain semantics, compatibility, migrations and ambiguous failures. Tests prove
one ingestion across both executor dispatches. No token, credit or monetary
savings were measured; existing caching/read-count gains are not claimed anew.

## Validation
Exact commands (focused commands run from their indicated module directories):
- `node tools/validate-all.js` from root: 15/15 suites passed, exit 0; every
  original suite retained, engine suite added. Working tree and tracked file
  contents unchanged by validation, including already edited tracked files.
- `node engine/tests/engine.test.js` from root: exit 0; lifecycle, isolated
  contexts, one ingestion, registered plans, live prerequisites/proofs, client/
  Core HEAD/branch drift, retry bypass/exhaustion, evidence/projection tampering,
  unrelated historical results, scoped memory/redaction and approved recovery.
- `node tests/orchestrator.test.js` from orchestrator: 30/30.
- `node tools/skills.test.js`: backend 40/40; frontend 53/53.
- `node tools/run-evals.js`: backend 12/12; frontend 19/19.
- `node tools/validate.js` from backend: 15/15; layout repair: 7/7.
- `node tests/release-schema.test.js` from frontend: 72 requirements, 13 Angular
  migration requirements, 14 settings and 29 manifests remain validated.
- `node tests/release-knowledge.test.js` from frontend: 38/38.
No live client upgrade/build/deployment, real installed-package compatibility,
Copilot UI session, profile installation or billing verification is claimed.

## Files Changed
Important additions: engine runtime/contracts/config/generic skills/tests,
backend/frontend executor modules, frontend read-only analysis module,
ingest CoreChangeSet producer/schema, ownership map and this report.
Moves: orchestrator implementations/config/schemas/templates to engine; shared
backend memory/retention/generic schemas to engine; frontend Core releases,
settings/version metadata and backend Core configuration knowledge to ingest.
Modified: track CLIs, skill engines, state-machine paths, generic-skill adapters,
policies/workflow/indexes, knowledge consumers, agents/discovery/installation
stamps, reference docs and complete validator. Existing path imports remain
compatible through adapters/resolvers. One-time migration scripts/tasks were
reference-checked and removed after successful migration validation.

## Remaining Duplication
Legacy skill IDs, IO schemas, phase/checkpoint labels and public CLI/import paths
remain as compatibility data/adapters, not independent frameworks. Domain task
selectors/capability tables, .NET/EF rules and Angular migration/mapping rules
remain separate because their semantics differ. Historical reports, checkpoints
and narrative evidence remain untouched; they are not current ownership contracts.
New engine runs require typed run-scoped proof/evidence envelopes, exact command
results and artifact hashes; old completion snapshots cannot substitute for them.
Approved replanning preserves failure/retry history and needs fresh safety proofs.
Canonical and approved knowledge is never automatically rewritten or promoted.
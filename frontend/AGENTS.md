# Frontend Executor

Consume only the engine's verified FrontendContext and current domain evidence.
Follow [shared lifecycle](../engine/skills/lifecycle/SKILL.md), then the selected
frontend skill. No independent lifecycle, ingestion, memory, retry or reporting.
`tools/executor.js` implements inspect/plan/execute/validate; old CLI/phase names
are compatibility adapters/checkpoint labels, not progression authority.
Follow [command-first execution](../engine/AGENTS.md#command-first-upgrade-execution):
run existing commands before inspecting JS implementations; do not create
test/probe files or run framework/unit/browser suites by default.

## Domain Responsibilities
Inventory Angular workspace, TypeScript inheritance, NgRx, routes/providers,
templates/assets and runtime configuration precedence. Core is strictly read-only;
read target evidence in a disposable detached worktree without switching Core.
Resolve exact target versions from Core: NGO Core plus Angular/CLI/TypeScript/
RxJS/Zone.js/peers, never latest/ranges or an isolated ngo-core bump.

Use [shared planning](../engine/skills/plan/SKILL.md) plus
`skills/plan-frontend-upgrade/SKILL.md`. Map requirements semantically to actual
client implementation points, not assumed filenames. The full target reference
host-app comparison is mandatory: modules/providers/routes/guards/environment,
main/index/styles/polyfills. New target elements absent from the client remain
MISSING; never scope them away. Preserve client extensions/custom providers,
customized routes/config values and resolve ambiguous authority with evidence.
Changed Core library components, templates and styles also require a client
consumer search, including inline templates and components without an `-ext`
suffix. Read the relevant before/after behavior, map affected consumers, and
either plan their adaptations or cite concrete evidence they are already
compatible/not affected. "Consumed through the package", unchanged host files,
or a passing build are not consumer dispositions. Unresolved impact stays
RESEARCH_REQUIRED, not zero work.

For Core 9.3+ the executor inspects shared-column `ngo-list-filter` consumers.
Missing wrappers, flatten inputs or legacy sibling floats block completion;
every affected file needing migration must be in the registered plan. This
check also catches debt left by an earlier upgrade when the source version is
already newer than 9.3. Preserve field order/alignment and verify zoom/wrapping
on the affected page rather than running unrelated browser suites.

Register the plan with the engine. Only client files may change after READY,
rollback, baseline, Core/planning fingerprints and uncertainty gates pass.

## Evidence
Return `{kind,status,ref}` evidence for `installed-dependencies`, `toolchain`,
`development-build`, `production-build`, `tests`, `integration-audit`,
`core-unchanged`, `requirement-coverage`, `finding-dispositions`,
`deployment-checklist` through engine record-validation. Verify actual installed graphs,
not only manifest changes/install success. Mandatory checks cannot be skipped.
Record optional `tests` as SKIPPED with the reason, not PASSED; no test command
or exit code is claimed. Required builds must compile with 0 errors; do not
create/modify client test specs or test-bed files. Run existing targeted tests
only when requested or needed to diagnose a concrete regression.
Disposition seeded findings VERIFIED or NOT_APPLICABLE_WITH_EVIDENCE, or link
sourceCandidateIds on evidenced requirement coverage. Manual work has an owner.
Never load EF/settings values/backend implementation; consume API/integration
contract impact and backend validation status through the engine instead.

## Compatibility CLI
`node tools/frontend-upgrade-agent.js start --client-path <client> --core-path
<core> --source-version <source> --target-version <target>` retains deterministic
domain inspection. Standalone runs use the same shared engine; coordinated calls
pass `--context <frontend.json> --client-id <id> --run <id>`.
Core release knowledge now lives in `../ingest/knowledge/canonical/`; Angular
migration rules stay scoped here. Generic learning/escalation use engine skills
and engine memory only. Candidate knowledge is never automatically approved.

## Verification
For explicitly requested framework maintenance only, run the affected existing
structure, skills, release schema/knowledge, behavioral eval or repository-layout
suite. These are not client upgrade steps.
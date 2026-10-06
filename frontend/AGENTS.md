# Frontend Executor

Consume only the engine's verified FrontendContext and current domain evidence.
Follow [shared lifecycle](../engine/skills/lifecycle/SKILL.md), then the selected
frontend skill. No independent lifecycle, ingestion, memory, retry or reporting.
`tools/executor.js` implements inspect/plan/execute/validate; old CLI/phase names
are compatibility adapters/checkpoint labels, not progression authority.

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
Register the plan with the engine. Only client files may change after READY,
rollback, baseline, Core/planning fingerprints and uncertainty gates pass.

## Evidence
Return `{kind,status,ref}` evidence for `installed-dependencies`, `toolchain`,
`development-build`, `production-build`, `tests`, `integration-audit`,
`core-unchanged`, `requirement-coverage`, `finding-dispositions`,
`deployment-checklist` through engine record-validation. Verify actual installed graphs,
not only manifest changes/install success. Missing/skipped checks cannot PASSED.
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
Existing structure, skills, release schema/knowledge, behavioral eval and
repository-layout tests remain required.
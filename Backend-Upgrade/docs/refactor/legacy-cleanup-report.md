# Legacy Cleanup Report — FINAL_CUTOVER

Date: 2026-08-19

## Summary
The additive migration was completed by physically removing the legacy layer and
normalizing directory naming, leaving exactly one source of truth. All references
were updated; validation, evaluations, tool bootstrap, and a new repository-layout
cleanliness test all pass.

## Removed
- Directories: `Agent/`, `Case-Studies/`, `Version-Changes/`, and the capital-cased `Templates/` (normalized to `templates/`).
- Root files: `BOOT.md`, `ARCHITECTURE.md`.
- Relocated root briefs: `refactor.md` → `docs/refactor/refactor-plan.md`; `tools.md` → `docs/refactor/tool-bootstrap-plan.md`.
- Obsolete template: `Templates/case-study.template.md`.

## Content preserved (where useful)
- `Version-Changes/CHANGELOG.md` → `knowledge/derived/version-changes/changelog.md`.
- WVUK case study → `memory/episodes/imported/ep-wvuk-core8x-001.json` (+ 2 candidate patterns).
- All version/error/symbol/migration/appsettings facts remain canonical under `knowledge/canonical/`.

## References updated
- `tools/validate.js` required-structure and routing checks (no BOOT/Agent/Templates).
- `workflows/core-upgrade/workflow.yaml` — removed `legacyMapping`; phase cards no longer point to `Agent/`.
- `config/agent-policy.yaml` — removed `legacyEntryPoint: BOOT.md`.
- `config/knowledge-priority.yaml` — removed `Version-Changes/**` from derived location.
- `knowledge/index/manifest.json` — `versionDiffs` → `versionChanges` (changelog).
- `knowledge/canonical/versions/*.json` — emptied deleted `diffFiles` arrays.
- `knowledge/derived/**` — `../Agent/*` and `Version-Changes/*` references rewritten.
- `memory/episodes/imported/ep-wvuk-core8x-001.json` — evidence reference externalized.
- `AGENTS.md`, `README.md`, `docs/architecture/overview.md`, ADR-0001, `templates/*` — delegacy-ed.

## Compatibility readers
No runtime compatibility readers existed (the system is prompt + JSON + Node tooling).
No legacy loaders, feature flags, or path constants remained after the reference updates.
The Node tooling (`tools/`) reads only the new locations.

## Dead source code
None found. The only executable code is the Node tooling (state machine, validator,
evals, bootstrap engine, wrappers) — all active. No legacy loaders/parsers/DTOs existed.

## Validation (post-deletion)
```
node tools/validate.js        -> 13/13
node tools/run-evals.js       -> 12/12 (silent-stop-rate 0)
node tools/bootstrap/tests/bootstrap.test.js -> 20/20
node tools/repo-layout.test.js -> 7/7
node tools/upgrade-agent.js tools bootstrap  -> SUCCEEDED
```
Stale-path search (case-sensitive) over active files: no `Agent/`, `Case-Studies/`,
`Version-Changes/`, `Templates/`, `BOOT.md`, `ARCHITECTURE.md`, or the four legacy
Agent document names outside `docs/refactor/`.

## Final root
`.config/  config/  docs/  evals/  knowledge/  memory/  runs/  schemas/  templates/  tools/  workflows/  AGENTS.md  README.md`
(no `src/`, `skills/`, or `tests/` — not applicable to this docs/config/tooling repository; empty dirs were not created to match a template).

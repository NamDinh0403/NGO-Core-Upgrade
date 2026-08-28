# Refactor Progress

| Phase | Status | Date | Evidence |
|-------|--------|------|----------|
| Inventory & current-state assessment | DONE | 2026-08-13 | `docs/refactor/current-state-assessment.md` |
| Additive architecture (config, workflows, schemas, memory, runs, evals, tools) | DONE | 2026-08-13 | `docs/refactor/final-report.md` |
| Knowledge reorganization → `knowledge/{canonical,derived,index}` | DONE | 2026-08-13 | `docs/refactor/migration-map.md` |
| TOOL_BOOTSTRAP (config, schemas, engine, wrappers, tests, docs) | DONE | 2026-08-13 | `runs/_bootstrap/tool-manifest.json`, `tools/bootstrap/tests` |
| **FINAL_CUTOVER** — physical legacy removal | DONE | 2026-08-19 | `docs/refactor/legacy-cleanup-report.md`, `deleted-legacy-paths.md` |
| Templates normalized `Templates/` → `templates/` | DONE | 2026-08-19 | layout test |
| Root docs moved / obsolete deleted | DONE | 2026-08-19 | final root = allowlist |
| Repository layout policy + cleanliness test | DONE | 2026-08-19 | `config/repository-layout-policy.yaml`, `tools/repo-layout.test.js` |

## Completion checklist (cutover)
- [x] `Agent/` removed
- [x] `Case-Studies/` removed
- [x] `Version-Changes/` removed (facts canonical; changelog in derived)
- [x] `Templates/` normalized to `templates/`
- [x] Obsolete root documents removed (`BOOT.md`, `ARCHITECTURE.md`); briefs relocated
- [x] Stale compatibility readers removed (none existed)
- [x] Dead legacy source code removed (none existed)
- [x] All references updated
- [x] Tests passing (validate 13/13, evals 12/12, bootstrap 20/20)
- [x] Repository layout test passing (7/7)
- [x] Final tree contains only the active architecture

## Current validation snapshot
```
node tools/validate.js        -> 13/13
node tools/run-evals.js       -> 12/12 (silent-stop 0)
node tools/bootstrap/tests/bootstrap.test.js -> 20/20
node tools/repo-layout.test.js -> 7/7
node tools/upgrade-agent.js tools bootstrap  -> SUCCEEDED
```

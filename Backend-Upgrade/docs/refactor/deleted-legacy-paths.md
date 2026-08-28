# Deleted Legacy Paths — FINAL_CUTOVER

Date: 2026-08-19
Git: the working tree is not under an active git repository (the `.git` entry is not a
valid repo), so no commit hashes are available. Deletions were performed directly on
the working tree at the user's explicit request. History-based recovery is unavailable;
the structured migrations below preserve the useful content.

| Deleted path | Disposition | Reason | Replacement / component | Validation | Deleted at |
|---|---|---|---|---|---|
| `Agent/1-operating-kernel.md` | MERGE_THEN_DELETE_SOURCE | Kernel rules migrated | `config/agent-policy.yaml`, `config/escalation-policy.yaml`, `config/quality-gates.yaml`, `workflows/core-upgrade/workflow.yaml` | validate.js, repo-layout.test.js | 2026-08-19 |
| `Agent/2-reasoning-loop.md` | MERGE_THEN_DELETE_SOURCE | Reasoning loop migrated | `workflows/core-upgrade/phases/05-build-and-fix.md` | repo-layout.test.js | 2026-08-19 |
| `Agent/3-execution-guide.md` | MERGE_THEN_DELETE_SOURCE | Recipe migrated | `workflows/core-upgrade/phases/*`, `docs/operations/README.md` | repo-layout.test.js | 2026-08-19 |
| `Agent/4-fix-pattern-workflow.md` | MERGE_THEN_DELETE_SOURCE | 7-step pattern migrated | `workflows/core-upgrade/phases/05-build-and-fix.md` | repo-layout.test.js | 2026-08-19 |
| `Agent/Phases/00..07*.md` | MERGE_THEN_DELETE_SOURCE | Phase behaviour + contracts migrated | `workflows/core-upgrade/phases/01..08` (+ `01b-tool-bootstrap`) | validate.js (9 phase cards, contract sections) | 2026-08-19 |
| `Agent/` (directory) | DELETE_AS_OBSOLETE | Empty after migration | `workflows/` + `config/` | repo-layout.test.js | 2026-08-19 |
| `Case-Studies/WVUK/core-8.x-migration.md` | CONVERT_THEN_DELETE_SOURCE | Real run → structured episode; client name sanitized to scope `wvuk`; raw evidence reference externalized | `memory/episodes/imported/ep-wvuk-core8x-001.json` + candidates `cand-nu1201-align-tfm`, `cand-cs7036-add-ctor-param` | episode schema (validate.js), retrieval by errorCode/symbol/version | 2026-08-19 |
| `Case-Studies/{CFGB,Digni,NCA}/.gitkeep` | DELETE_AS_OBSOLETE | Empty placeholders, no content | `memory/episodes/` (created per real run) | repo-layout.test.js | 2026-08-19 |
| `Case-Studies/README.md` | DELETE_AS_OBSOLETE | Conventions superseded by episode lifecycle | `memory/README.md` | repo-layout.test.js | 2026-08-19 |
| `Case-Studies/` (directory) | DELETE_AS_OBSOLETE | Client-named hierarchy removed | `memory/episodes/` (client-scoped, retrievable by tech traits) | repo-layout.test.js | 2026-08-19 |
| `Version-Changes/CHANGELOG.md` | MOVE_TO_CANONICAL_LOCATION | Comparison matrix + upgrade-path planner is useful derived narrative | `knowledge/derived/version-changes/changelog.md` | manifest reference, layout test | 2026-08-19 |
| `Version-Changes/{7.2.0,7.3.0,7.4.0,8.0.0}/**` (diffs + READMEs) | DELETE_AS_DUPLICATE | Version facts already canonical; raw diffs superseded by decompile-first policy | `knowledge/canonical/versions/*.json` (authoritative) | validate.js version schema | 2026-08-19 |
| `Version-Changes/` (directory) | DELETE_AS_OBSOLETE | No second version-knowledge store permitted | `knowledge/canonical/versions/` + `knowledge/derived/version-changes/changelog.md` | repo-layout.test.js | 2026-08-19 |
| `Templates/` (directory) | MOVE_TO_CANONICAL_LOCATION | Case normalization + consolidation with new `templates/` | `templates/` (lowercase) | validate.js required-structure | 2026-08-19 |
| `Templates/case-study.template.md` | DELETE_AS_OBSOLETE | Case studies replaced by episodes | `schemas/episode.schema.json` + `templates/learned-pattern.yaml` | repo-layout.test.js | 2026-08-19 |
| `BOOT.md` | DELETE_AS_OBSOLETE | Legacy entry point conflicted with `AGENTS.md`; single source of truth | `AGENTS.md` + `workflows/core-upgrade/phases/01-discovery.md` + `01b-tool-bootstrap.md` | repo-layout.test.js | 2026-08-19 |
| `ARCHITECTURE.md` | DELETE_AS_OBSOLETE | Diagrams described the pre-cutover design (BOOT/Agent/old state machine) | `docs/architecture/overview.md` + ADRs | repo-layout.test.js | 2026-08-19 |
| `refactor.md` (root) | MOVE_TO_CANONICAL_LOCATION | Historical task brief | `docs/refactor/refactor-plan.md` | layout test (root files allowlist) | 2026-08-19 |
| `tools.md` (root) | MOVE_TO_CANONICAL_LOCATION | Historical task brief | `docs/refactor/tool-bootstrap-plan.md` | layout test (root files allowlist) | 2026-08-19 |

## MANUAL_BLOCKER
None. All listed paths received a final disposition and were physically removed or relocated.

## External archive note
The raw WVUK migration markdown was removed from the active tree. Its lessons are preserved
in the sanitized episode. If the original raw evidence must be retained, place it in the
approved protected archive referenced as
`external-archive://ngo-protected/wvuk/core-8.x-migration.md` (recorded in the episode's
`evidenceLinks`). Git is **not** an approved store for that material and, in any case, is not
active in this working tree.

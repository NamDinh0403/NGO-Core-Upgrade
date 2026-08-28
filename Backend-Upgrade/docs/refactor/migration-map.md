# Migration Map — Backend-Upgrade Refactor

Date: 2026-08-13

Strategy: **compatibility-preserving, with the knowledge layer physically reorganized** into the target `knowledge/{canonical,derived,index}/` layout. The refactor also *adds* the missing durable-workflow machinery (orchestration state machine, isolated runs, checkpoints, escalation, memory lifecycle, schemas, scoped retrieval, isolation, evals, validation). The legacy procedural layer (`BOOT.md`, `Agent/`, `Templates/`) is preserved and its references were updated to the new paths. No canonical record is duplicated.

Legend — Action: `moved` (relocated + references updated), `kept` (unchanged, referenced), `added` (new), `wrapped` (new contract references legacy), `imported` (copied+transformed into memory), `flagged` (retained, needs review).

| Original path | New path / role | Action | Reason | Refs updated | Content transformed | Validation |
|---|---|---|---|---|---|---|
| `Knowledge/index.json` | `knowledge/index/routing-table.json` | moved | Routing table relocated into `index/`; internal route paths rewritten to `knowledge/canonical/**` | yes (all callers) | yes (route paths) | routing-table-resolves |
| `Knowledge/errors/*.json` | `knowledge/canonical/errors/*.json` | moved | Canonical error knowledge into `canonical/` | yes | no | schema-check |
| `Knowledge/symbols/*.json` | `knowledge/canonical/symbols/*.json` | moved | Canonical symbol knowledge into `canonical/` | yes | no | schema-check |
| `Knowledge/versions/*.json` | `knowledge/canonical/versions/*.json` | moved | Canonical version knowledge into `canonical/` | yes | no | schema-check |
| `Knowledge/migrations/*.json` | `knowledge/canonical/migrations/*.json` | moved | Canonical migration knowledge into `canonical/` | yes | no | schema-check |
| `Knowledge/appsettings/*.json` | `knowledge/canonical/appsettings/*.json` | moved | Canonical appsettings knowledge into `canonical/` | yes | no | schema-check |
| `Knowledge/anti-patterns.json` | `knowledge/canonical/anti-patterns/anti-patterns.json` | moved | Global guardrails into `canonical/anti-patterns/` | yes | no | routing-table-resolves |
| `Knowledge/*.md` (7 narrative docs) | `knowledge/derived/{breaking-changes,common-error-solutions,deployment-guides}/` | moved+flagged | Narrative overlaps JSON; relocated to `derived/`, not authoritative | yes | no | manual review noted |
| `Knowledge/version-manifest.json` | `knowledge/index/version-manifest.json` | moved+flagged | Superseded by `versions/*.json`; kept for compatibility under `index/` | yes | no | none |
| `Agent/1-operating-kernel.md` | procedural memory (legacy kernel) | kept | Proven rules; new `workflows/` extends, does not replace | linked from workflow | no | none |
| `Agent/Phases/00-07*.md` | detailed phase procedures | wrapped | New `workflows/core-upgrade/phases/01-08` add contracts and reference these | linked | no | phase-contract-check |
| `Templates/upgrade-state.template.json` | run-state seed | kept | Extended by `schemas/run-state.schema.json` | linked | no | schema aligns |
| `Templates/upgrade-plan.template.md` | plan template | kept | Plan gate preserved | linked | no | none |
| `Templates/upgrade-report.template.md` | client report template | kept | Report gate preserved; also `templates/client-upgrade-report.md` new superset | linked | no | none |
| `Templates/migration-memory.template.json` | client memory seed | kept | Client-scoped, isolated | linked | no | none |
| `Templates/case-study.template.md` | episode seed | kept | Feeds `memory/episodes` | linked | no | none |
| `Version-Changes/**` | derived supporting evidence | kept | Optional corroboration; DLL wins | n/a | no | none |
| `Case-Studies/WVUK/core-8.x-migration.md` | `memory/episodes/imported/` (provenance recorded) | imported | Real historical run → episodic memory (sanitized, conservative confidence) | new episode links back | yes (structured episode) | schema-check |
| `Case-Studies/{CFGB,Digni,NCA}/.gitkeep` | placeholders | kept | No content yet | n/a | no | none |
| `tools/Fix-Mojibake.ps1` | `tools/repository/` role | kept | Utility, not orchestration | n/a | no | none |
| — | `config/*.yaml` (5 policies) | added | Missing: policy/quality/escalation/retention/knowledge-priority | n/a | n/a | yaml parse |
| — | `workflows/core-upgrade/**` | added | Explicit versioned state machine + phase contracts + checklists | n/a | n/a | phase-contract-check |
| — | `schemas/*.schema.json` (7) | added | Missing: validated record contracts | n/a | n/a | self-consistent |
| — | `memory/{episodes,candidates,approved,rejected}` | added | Missing: candidate→approved lifecycle | n/a | n/a | schema-check |
| — | `runs/` | added | Missing: isolated durable run directories | n/a | n/a | none |
| — | `templates/{developer-escalation,unresolved-issue,learned-pattern,client-upgrade-report}` | added | Missing: escalation + learning artifacts | n/a | n/a | none |
| — | `tools/**` (validator + role dirs) | added | Missing: automated validation | n/a | n/a | executable |
| — | `evals/**` | added | Missing: regression + scoring | n/a | n/a | schema-check |
| — | `AGENTS.md` | added | Missing: concise agent entry point | n/a | n/a | reference-check |
| — | `docs/{architecture,operations,refactor}` + ADRs | added | Missing: durable docs | n/a | n/a | reference-check |

## Legacy compatibility

- `BOOT.md`, `Agent/`, `knowledge/`, `Templates/`, `Version-Changes/`, `Case-Studies/` remain valid. Existing references (`../knowledge/index/routing-table.json`, `../Templates/...`) are unchanged, so any in-flight run continues to work.
- `AGENTS.md` is the new preferred entry point; `BOOT.md` remains supported and is linked from it.
- No file was deleted. No canonical record was duplicated.

## Known gaps carried forward (not invented)

- `9.0.0` and `9.1.0` version diffs were never prepared; the canonical version records cover them without diffs.
- Deep-dive Core 8 Markdown docs not yet reconciled field-by-field against JSON registries. Flagged for review.

## FINAL_CUTOVER (2026-08-19)

The additive layer was made canonical and the legacy layer physically removed. The
earlier `kept`/`wrapped` rows for `Agent/`, `Templates/`, `Version-Changes/`,
`Case-Studies/`, `BOOT.md`, and `ARCHITECTURE.md` are **superseded** by the deletions
recorded in `docs/refactor/deleted-legacy-paths.md` and `docs/refactor/legacy-cleanup-report.md`.
There is now exactly one source of truth: procedural in `workflows/` + `config/`,
canonical knowledge in `knowledge/canonical/`, historical runs in `memory/episodes/`.
Cleanliness is enforced by `config/repository-layout-policy.yaml` + `tools/repo-layout.test.js`.

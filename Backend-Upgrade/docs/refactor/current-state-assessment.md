# Current-State Assessment — Backend-Upgrade

Date: 2026-08-13
Scope: `Backend-Upgrade/` (the NGO Core backend upgrade agent system). `Frontend-Upgrade/` is out of scope and untouched.

## 1. Current repository structure

```
Backend-Upgrade/
├── BOOT.md                     # sole agent entry point
├── README.md                   # human orientation
├── ARCHITECTURE.md             # 4 mermaid diagrams (assets, state machine, evidence, data)
├── refactor.md                 # the refactor brief (this task)
├── Agent/                      # procedural instructions
│   ├── 1-operating-kernel.md   # state machine + non-negotiable rules
│   ├── 2-reasoning-loop.md     # per-error investigation playbooks
│   ├── 3-execution-guide.md    # maintainer recipe
│   ├── 4-fix-pattern-workflow.md
│   └── Phases/00-boot..07-report.md  # 8 sequential phase cards
├── knowledge/                  # machine-consumed knowledge
│   ├── index.json              # routing table (single source of truth for routes)
│   ├── version-manifest.json
│   ├── anti-patterns.json
│   ├── errors/*.json           # 9 compiler/DI error playbooks
│   ├── symbols/*.json          # 7 NGO.Core symbol playbooks
│   ├── versions/*.json         # 6 version registries (7.2.0..9.1.0)
│   ├── migrations/*.json       # 1 EF migration pattern set
│   ├── appsettings/*.json      # 1 config-key-by-version registry
│   └── *.md                    # 7 legacy narrative docs (derived evidence)
├── Templates/                  # 5 output templates (state, plan, report, memory, case-study)
├── Version-Changes/            # per-version diffs (7.2.0/7.3.0/7.4.0/8.0.0) — supporting evidence
├── Case-Studies/               # WVUK (live) + CFGB/Digni/NCA (placeholders)
└── tools/Fix-Mojibake.ps1      # encoding-repair utility (not orchestration)
```

## 2. Current execution flow

Prompt/markdown-driven, no executable orchestration engine. `BOOT.md` loads the operating kernel + phase cards 00→07. A run advances a hand-maintained `.upgrade-state.json` through:

`INIT → PREFLIGHT_DONE → PLAN_WRITTEN → PACKAGES_UPDATED → APPSETTINGS_UPDATED → RESTORE_DONE → BUILD_SUCCEEDED/FIXING_ERRORS → EF_MIGRATION_DONE → REPORT_WRITTEN → COMPLETED|BLOCKED`

Hard gates already exist for the plan (`PLAN_WRITTEN`) and report (`REPORT_WRITTEN`).

## 3. Current knowledge-loading behaviour

`knowledge/index/routing-table.json` is a routing table. Phase cards load `index.json` then only the routed JSON entries needed (error/symbol/version/config/migration). The **decompiled installed DLL is authoritative**; JSON, diffs, case studies and legacy Markdown corroborate. Lookup order is explicit in `index.json.lookupOrder`.

## 4. Current logging behaviour

State is captured inside `.upgrade-state.json` (single evolving snapshot with `investigationLog`, `activeHypotheses`, `fixesApplied`, `resolvedSignatures`). A per-build `build.log` is captured. There is no append-only event stream, no checkpoint history, and no isolated per-run directory.

## 5. Current documentation behaviour

Documentation is already partly mandatory: the report is a hard gate before `COMPLETED`/`BLOCKED`. Case studies are promoted manually from reports. There is no machine-readable documentation-status object feeding the completion gate.

## 6. Current failure and stopping conditions

The kernel defines a Response Gate and a True Blocker Definition and forbids progress-only replies. However, statuses are limited to `BLOCKED`/`COMPLETED` with no differentiated blocked reasons (needs-context vs needs-developer vs needs-approval vs policy vs budget), no explicit per-step status enum, and no machine-checkable "every terminal/blocked state has a resume instruction" guarantee.

## 7. Duplicate or conflicting sources

- Route facts exist only in `index.json` (good, single source).
- Narrative Markdown (`breaking-changes-registry.md`, `common-error-solutions.md`, `error-fix-patterns.md`, `code-changes-by-version.md`, `core-8*.md`, `deployment-instructions-by-version.md`) overlaps with the JSON registries and `Version-Changes/`. These are **derived/narrative**, not authoritative, but this is not enforced by schema.
- `version-manifest.json` overlaps with `versions/*.json`. Marked legacy in `index.json`.

## 8. Risks of the existing design

1. No durable, isolated per-run state → interrupted runs resume from chat memory, not a checkpoint.
2. No differentiated blocked/terminal statuses → ambiguous stop conditions possible.
3. No candidate→approved memory lifecycle → a one-off client fix could be copied straight into global knowledge.
4. No client-isolation/redaction policy → client-specific info could leak into reusable knowledge.
5. No schema validation / reference-integrity checks / tests → registries can drift silently.
6. No escalation artifact generation → blocked runs may end with "could not solve" rather than an actionable handoff.
7. No scoped retrieval contract → risk of loading too much into context.

## 9. Elements to preserve (proven, valuable)

- Decompile-first / installed-DLL-authoritative evidence policy.
- `index.json` routing model and JSON registry granularity.
- Plan and report hard gates.
- Minimal-diff principle and the 7-step Fix Pattern Workflow.
- Version/error/symbol/migration/appsettings JSON schemas.
- WVUK case study as real episodic evidence.

## 10. Information that could not be confidently classified

- `Version-Changes/9.0.0` and `9.1.0` diff folders are referenced in registries but not prepared. Recorded as a known gap, not migrated.
- Whether `core-8-migration-detailed.md` / `core-8.0.0-changes-by-class.md` contain any facts absent from the JSON registries — treated conservatively as derived, retained in place, flagged for review in the migration map.

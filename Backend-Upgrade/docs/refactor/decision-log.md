# Decision Log — Refactor & Cutover

Chronological record of non-obvious decisions and their rationale.

| # | Date | Decision | Rationale |
|---|------|----------|-----------|
| D1 | 2026-08-13 | Additive, compatibility-preserving refactor first | Knowledge layer already sound; lower risk to add durable machinery before deleting. |
| D2 | 2026-08-13 | Keep JSON as canonical machine format (not YAML) | Tooling relies on JSON; avoid duplicate hand-edited representations (ADR-0004). |
| D3 | 2026-08-13 | Reorganize `Knowledge/` → `knowledge/{canonical,derived,index}/` | Target architecture; remove ambiguous flat structure. |
| D4 | 2026-08-13 | Bootstrap engine + tests in Node (dependency-free) | Matches existing tooling; offline-deterministic; Node 14 present. |
| D5 | 2026-08-19 | **FINAL_CUTOVER**: physically delete legacy layer | Duplicate sources of truth and conflicting agent instructions must not remain. |
| D6 | 2026-08-19 | `BOOT.md` → DELETE_AS_OBSOLETE (not moved to docs) | Moving a stale boot document would re-create conflicting agent instructions; `AGENTS.md` is the single entry point. |
| D7 | 2026-08-19 | `ARCHITECTURE.md` → DELETE_AS_OBSOLETE (not moved) | Its diagrams describe the pre-cutover design (BOOT/Agent/old state machine); superseded by `docs/architecture/overview.md`. |
| D8 | 2026-08-19 | `refactor.md`/`tools.md` → `docs/refactor/` (not `docs/operations/`) | They are historical briefs containing legacy path names; placing them in the exempt historical area keeps active operational docs free of legacy references (cleanliness policy). |
| D9 | 2026-08-19 | `Version-Changes/` diffs → DELETE_AS_DUPLICATE; CHANGELOG → derived | Version facts already canonical; a second version-knowledge store is forbidden. Raw diffs are superseded by decompile-first evidence. |
| D10 | 2026-08-19 | WVUK case study → sanitized episode; raw evidence externalized | Client-named folders must not remain; lessons retrievable by technical traits; raw evidence reference points to an approved external archive. |
| D11 | 2026-08-19 | `Templates/case-study.template.md` → DELETE_AS_OBSOLETE | Case studies are replaced by the episode/candidate lifecycle. |
| D12 | 2026-08-19 | Keep both `.config/` and `config/` | `.config/dotnet-tools.json` is standard .NET tool metadata (narrow purpose); `config/` is agent/tool policy. Distinct, documented in `config/repository-layout-policy.yaml`. No overlap → no merge. |
| D13 | 2026-08-19 | No `src/`, `skills/`, or top-level `tests/` created | This is a docs/config/tooling repo with no application source; tests live beside the Node tooling (`tools/*.test.js`). Empty dirs are not created to match a template. |
| D14 | 2026-08-19 | Proceed with deletion despite no active git repo | The `.git` entry is not a valid repository, so history-based recovery is unavailable. The user explicitly requested physical removal; structured migrations preserve content. Recorded as a limitation. |

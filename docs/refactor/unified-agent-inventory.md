# Unified agent inventory

Machine-readable version: [unified-agent-reference-map.json](./unified-agent-reference-map.json).
This document is the human-readable summary of the same data.

Granularity: **file-level** for governance, config, tooling, docs, schemas and
templates; **directory-level** for bulk generated/curated content
(`knowledge/`, `runs/`, `evals/`) where hundreds of individual JSON/YAML
records would add no decision-relevant detail beyond "this directory's whole
disposition is X".

## Baseline

A prior, **uncommitted** working-tree refactor had already:
- renamed `Backend-Upgrade/` → `backend/`, `Frontend-Upgrade/` → `frontend/`
- carved out a shared `ingest/` module (single Core-release ingestion phase)
- added `.github/agents/ngo-core-upgrade-orchestrator.agent.md` +
  `.github/skills/ngo-core-upgrade-orchestrator/`

This was committed as-is as the rollback checkpoint (`9a5bbda`, tag
`pre-orchestrator-refactor-checkpoint`) before this pass began, so it is now
part of history rather than a pending risk.

## Root

| Path | Responsibility | Disposition |
|---|---|---|
| `AGENTS.md` | Root routing contract | KEEP_AS_CANONICAL (edited: add orchestrator routing) |
| `README.md` | Human orientation, layout diagram | KEEP_AS_CANONICAL (edited: add orchestrator/, fix image ref) |
| `IMPORT.md` | Install/import instructions | KEEP_AS_CANONICAL (edited: mention shared run) |
| `install.ps1` / `install.sh` | Registers agents/skills at user level | KEEP_AS_CANONICAL (unchanged) |
| `uninstall.ps1` / `uninstall.sh` | Unregisters agents/skills | KEEP_AS_CANONICAL (unchanged) |
| `package-agent.ps1` | Builds portable zip | KEEP_AS_CANONICAL (unchanged — already excludes any `runs/` dir) |
| `ngo-core-upgrade.code-workspace` | Multi-root workspace template | KEEP_AS_CANONICAL (unchanged) |
| `compiler-error-fix-loop.png` | Diagram image | **DELETE_AS_DUPLICATE** — byte-identical (SHA256 verified) to `frontend/docs/assets/compiler-error-fix-loop.png`, which is the real, correctly-located copy |
| `.gitignore` | Root ignore rules | **Did not exist.** Created new, mirroring `backend/.gitignore` / `frontend/.gitignore`, adding `orchestrator/runs/*` |

## `.github/` (GitHub Copilot customizations only)

| Path | Disposition |
|---|---|
| `.github/agents/ngo-core-upgrade-orchestrator.agent.md` | KEEP_AS_CANONICAL — rewritten to drive the new `orchestrator/` module end to end |
| `.github/agents/ngo-core-backend-upgrade.agent.md` | KEEP_AS_CANONICAL — additive note only |
| `.github/agents/ngo-core-frontend-upgrade.agent.md` | KEEP_AS_CANONICAL — additive note only |
| `.github/skills/ngo-core-upgrade-orchestrator/SKILL.md` | KEEP_AS_CANONICAL — mirrors the agent file update |
| `.github/skills/ngo-core-backend-upgrade/SKILL.md` | KEEP_AS_CANONICAL — additive note only |
| `.github/skills/ngo-core-frontend-upgrade/SKILL.md` | KEEP_AS_CANONICAL — additive note only |

All three `.agent.md` files already use the correct, Copilot-discoverable
`.github/agents/<name>.agent.md` naming and location — **no renames or moves
were required or performed.**

## `ingest/` (11 files) — shared, already non-duplicated

Both tracks' `ingest-core-release` skill is a thin wrapper that delegates to
`ingest/tools/ingest.js` and reads only its own findings slice. Confirmed by
reading both wrapper `SKILL.md` files side by side — the actual git-diff /
release-notes parsing logic exists exactly once. **KEEP_AS_CANONICAL, no
changes.**

## `backend/` (231 files)

| Subdir | Files | Disposition |
|---|---|---|
| `.config`, `config`, `docs`, `evals`, `knowledge`, `memory`, `schemas`, `skills`, `templates`, `workflows` | 163 | KEEP_AS_CANONICAL — mature, independently-tested state machine; untouched by design (see decisions.md) |
| `tools/wrappers/core-repository-history` | 1 | KEEP_AS_CANONICAL — one stale comment fixed (referenced old `Frontend-Upgrade/` path) |
| `runs/` | 40 (git-ignored) | EXCLUDE_AS_GENERATED — real client run history (`ngo-online-brc`) retained on disk, never committed |

## `frontend/` (370 files)

| Subdir | Files | Disposition |
|---|---|---|
| `config`, `docs`, `evals`, `knowledge`, `schemas`, `skills`, `templates`, `tests`, `tools` | 247 | KEEP_AS_CANONICAL — mature, independently-tested dual-repository state machine; untouched by design |
| `runs/` | 121 (git-ignored) | EXCLUDE_AS_GENERATED — real client run history (`ngo-client`, `ngo-online-cbm`, `ngo-online-norcross`) retained on disk, never committed |

## Already removed (prior to this session, part of the checkpoint commit)

- `Backend-Upgrade/`, `Frontend-Upgrade/` — DELETE_AS_OBSOLETE (superseded by rename)
- `Backend-Upgrade/docs/refactor/*`, `Frontend-Upgrade/docs/refactor/*` — DELETE_AS_OBSOLETE (transient reports from the earlier per-track rename, correctly not recreated)

## New in this pass

- `docs/refactor/` (this inventory set)
- `orchestrator/` — new shared module (see migration plan); not a migration of
  an existing item, so no disposition code applies — it is documented as a
  net-new addition.

## Manual blockers

None identified. Every item above resolves to a definite disposition.

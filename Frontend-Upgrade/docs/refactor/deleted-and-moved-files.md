# Deleted and moved files

## Renamed directories (casing normalized)

| From | To |
| --- | --- |
| `Frontend-Upgrade/Knowledge/` | `Frontend-Upgrade/knowledge/` |
| `Frontend-Upgrade/Templates/` | `Frontend-Upgrade/templates/` |

## Moved files

| From | To |
| --- | --- |
| `Frontend-Upgrade/CHANGELOG.md` | `Frontend-Upgrade/docs/release-knowledge/historical-frontend-upgrade-changelog.md` |
| `knowledge/version-manifest.json` | `knowledge/canonical/versions/version-manifest.json` |
| `knowledge/angular-10-to-15-migration.md` and the other 5 vendor `.md` | `knowledge/derived/` |
| `../compiler-error-fix-loop.png` (copy) | `docs/assets/compiler-error-fix-loop.png` |
| workspace-root `release-notes.md` (sanitized copy) | `knowledge/raw/release-note-import/release-notes-sanitized.md` |
| `skills/derive-core-requirements/` | `skills/derive-release-requirements/` |

## Created (structure)

- `knowledge/canonical/{releases/<24 versions>,migrations,appsettings,versions}`,
  `knowledge/derived`, `knowledge/raw/release-note-import`, `knowledge/index`,
  `knowledge/candidates`.
- `tests/` (30-case release-knowledge suite, release-schema suite, runner).
- `docs/architecture/{release-knowledge,requirement-coverage,appsettings-knowledge}.md`,
  `docs/operations/{import-release-notes,update-release-knowledge,review-missing-steps}.md`,
  `docs/release-knowledge/`, `docs/assets/`, `docs/refactor/*` reports.
- `config/{release-coverage-policy,knowledge-priority,retry-policy}.yaml`.
- `schemas/{release-requirement,release-manifest,appsettings-requirement,requirement-coverage}.schema.json`.
- `.gitignore`, `runs/README.md`.

## MANUAL_BLOCKERs (not auto-deleted - cross-track)

The git root is shared by the Backend track. These root files were **not** deleted; their
removal requires backend-track sign-off:

| Root file | Status | Handling |
| --- | --- | --- |
| `release-notes.md` (git root) | MB-1 | Sanitized copy + import manifest created in the frontend knowledge base; runtime never reads it. Removal is a cross-track decision; the exposed IATI key must be rotated regardless. |
| `compiler-error-fix-loop.png` (git root) | MB-2 | Copied into `docs/assets/`; the root copy is referenced by the workspace `README.md`. Removal is a cross-track decision. |
| `README.md` (git root) | Not a duplicate | Workspace-level orientation for both tracks; kept. Distinct from `Frontend-Upgrade/README.md`. |

## Not deleted (git preserves history)

Removed files (e.g. the moved `CHANGELOG.md`, the old skill directory) are recoverable from
git history; only the working tree is reorganized.

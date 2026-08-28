# Repository cleanup progress

Live checklist. Updated as steps complete. Status: TODO / DOING / DONE / BLOCKED.

| # | Step | Status | Validation result |
|---|------|--------|-------------------|
| 1 | Inventory + reference map + plan + progress + decisions | DONE | docs created |
| 2 | Layout policy + cleanliness test | DONE | repo-layout.test.js LAYOUT OK |
| 3 | Release-requirement schemas | DONE | release-schema.test.js VALID |
| 4 | Structured release knowledge import (release-notes.md) | DONE | 24 versions, 72 reqs schema VALID |
| 5 | Migration + appsettings canonical | DONE | 13 migration + 14 appsettings VALID |
| 6 | Rename Knowledge/->knowledge/, Templates/->templates/ | DONE | validate.js VALID |
| 7 | Source modules (release-knowledge, range, applicability, mapping, coverage, appsettings) | DONE | release-knowledge.test.js 30/30 |
| 8 | Integrate planning gate | DONE | start pipeline E2E verified |
| 9 | Integrate execution + audit/completion gate | DONE | planReady/completionReady wired |
| 10 | tests/ + 30 deterministic tests + evals | DONE | tests/run.js 2/2; run-evals 19/19 |
| 11 | Documentation | DONE | architecture + operations docs added |
| 12 | CHANGELOG.md -> memory + docs/release-knowledge | DONE | moved to docs/release-knowledge |
| 13 | Raw notes normalization + import manifest | DONE | raw/release-note-import created |
| 14 | compiler-error-fix-loop.png -> docs/assets | DONE | copied to docs/assets |
| 15 | gitignore + runs placeholder | DONE | .gitignore + runs/README.md |
| 16 | Final validation + tree | DONE | all suites green (see below) |

## Final validation (all green)
- `tools/validate.js` — VALID (schemas, config, registry, 12 skills)
- `tools/repo-layout.test.js` — LAYOUT OK
- `tests/run.js` — 2/2 test files (30 release-knowledge + schema: 72 reqs / 13 migration / 14 appsettings / 24 manifests)
- `tools/skills.test.js` — 52/52 passed
- `tools/run-evals.js` — 19/19 scenarios (doctor 4, inventory 3, core 1, packages 5, gate 6)

## Manual blockers
- **MB-1**: Root `release-notes.md` is shared with the Backend track. The frontend import
  and sanitized copy are created here, but removing the git-root file is a cross-track
  decision requiring backend-track owner sign-off (backend may still read it). Documented,
  not auto-deleted.
- **MB-2**: Root `compiler-error-fix-loop.png` is referenced by the workspace `README.md`
  (shared). A copy is placed in `docs/assets/`; removing the root asset is a cross-track
  decision.

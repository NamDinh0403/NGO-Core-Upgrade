# Repository cleanup decisions

Concrete decisions and their rationale. Each records the option chosen and why, so the
choices are auditable and reversible.

## D-1 - Node.js adaptation of the .NET target tree
**Decision:** Keep business logic in `tools/lib/<domain>.js` modules; do **not** create a
C#-style `src/` tree or `.config/dotnet-tools.json`.
**Why:** The project is Node.js/CommonJS and deliberately mirrors the sibling
`Backend-Upgrade/`, which has no `src/` and no dotnet manifest. The task explicitly says to
"use the existing project language and conventions" and "adapt names to current project
conventions". Inventing a `src/` C# layout would fragment conventions across the two tracks.

## D-2 - Duplicate README
**Decision:** There is no true duplicate. `README.md` at the git root documents the
**workspace/two-track** system; `Frontend-Upgrade/README.md` documents the **frontend agent**.
Both are KEEP_AS_CANONICAL. A layout test forbids a second README **inside** `Frontend-Upgrade/`.
**Why:** They have different scope and audience; merging them would lose the workspace-level
orientation the backend track also relies on.

## D-3 - Root release-notes.md is shared with the backend track
**Decision:** Import and sanitize into the frontend knowledge base; create the sanitized copy
and import manifest under `knowledge/raw/release-note-import/`. Do **not** silently delete the
git-root `release-notes.md` (MB-1); record it as a MANUAL_BLOCKER for cross-track sign-off.
**Why:** The git root is one repository shared by both agents; the backend track may still
consume the root notes. Deleting it unilaterally risks breaking the sibling project.

## D-4 - compiler-error-fix-loop.png
**Decision:** Copy into `Frontend-Upgrade/docs/assets/`; keep the root copy (MB-2) because the
workspace `README.md` references it. Frontend docs reference the frontend copy.
**Why:** Same cross-track-ownership reason as D-3.

## D-5 - Canonical structured knowledge is authoritative; Markdown is derived
**Decision:** The structured YAML records under `knowledge/canonical/` are canonical. The
existing human-readable `Knowledge/*.md` become derived documentation under `knowledge/`
(and `knowledge/canonical/migrations/*.md` / `appsettings/*.md` are generated/validated from
the YAML).
**Why:** The task requires a single canonical representation and forbids two independently
edited authoritative versions.

## D-6 - version-manifest.json placement
**Decision:** Move to `knowledge/canonical/versions/version-manifest.json`; it is consumed by
the release-range resolver and package resolution.
**Why:** It is canonical machine-readable version knowledge and belongs under canonical.

## D-7 - Tests vs evals
**Decision:** Deterministic Node tests move to a new top-level `tests/` tree; `evals/` retains
agent-behaviour scenarios and shared fixtures. The existing `tools/*.test.js` validators are
kept as thin entry points and/or moved under `tests/`.
**Why:** The task requires a clear tests/evals boundary.

## D-8 - CHANGELOG.md
**Decision:** CONVERT_TO_MEMORY (mine sanitized episodes + candidate knowledge) and move the
human-readable document to `docs/release-knowledge/historical-frontend-upgrade-changelog.md`;
remove the `Frontend-Upgrade/` root copy.
**Why:** It is historical client-upgrade evidence (WVUK), not an authoritative workflow source.

## D-9 - Secret handling
**Decision:** Replace exposed values with placeholders (`<FROM_SECRET_PROVIDER>`,
`<CLIENT_SPECIFIC_VALUE>`, `<PM_APPROVAL_REQUIRED>`). The IATI subscription key found in
`release-notes.md` is flagged for **rotation** in `docs/refactor/secret-redaction-report.md`
(no raw value in the report).
**Why:** Secrets must never enter knowledge, logs, or reports; a committed real credential must
be rotated.

## D-10 - Skill rename
**Decision:** Rename `derive-core-requirements` -> `derive-release-requirements` to match the
release-knowledge model, updating the registry and all references.
**Why:** The task names `derive-release-requirements` and the skill now derives from canonical
release requirements, not only Core inspection.

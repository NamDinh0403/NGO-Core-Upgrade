# Operations - Updating release knowledge

When a new NGO Core release ships, or when a run discovers that a note was incomplete,
update the canonical knowledge - never the raw notes at runtime.

## Add a new release

0. **Run the shared ingestion phase first** (once per engagement, covers both tracks):
   `node ../ingest/tools/ingest.js ingest --core-path <path> --release-notes <path> --target <new-version>`.
   Review the resulting `../ingest/knowledge/candidates/releases/<new-version>.json`
   — its `findings.frontend` + `findings.shared` sections are your starting point for
   steps 1-3 below, already cross-checked against the git diff.
1. Create `../ingest/knowledge/canonical/releases/<new-version>/release.yaml` with `version`,
   `frameworkTransition` (Angular/.NET from/to), `scopes`, and `sourceEvidence`.
2. Add the non-empty scope files with atomic requirements (see
   [import-release-notes.md](import-release-notes.md)).
3. If a card re-lists an earlier one, set `status: DUPLICATE` + `duplicateOf`. If it
   replaces one, set `supersedes` on the new record and `supersededBy` on the old.
4. Add any new AppSettings to `../ingest/knowledge/canonical/appsettings/backend-appsettings.yaml`.
5. Validate: `node tests/release-schema.test.js` and `node tests/release-knowledge.test.js`.

## Learn from a run (candidates only)

When a run finds a discrepancy (an unmapped requirement, an extra client caller, a missing
step the notes did not mention), `tools/lib/knowledge-candidate.js` emits a **redacted
candidate** under `knowledge/candidates/` (or the run's candidates file). Candidates:

- are `status: CANDIDATE`, `approved: false`;
- never enter canonical knowledge automatically;
- never cross into another client's context;
- are reviewed by a maintainer before any promotion to `knowledge/canonical/`.

## Keep markdown in sync

`knowledge/derived/*.md` is human-readable documentation derived from the canonical YAML.
When you change canonical records, regenerate or re-check the derived markdown; do not edit
the two independently.

## Precedence reminder

Per [../../config/knowledge-priority.yaml](../../config/knowledge-priority.yaml): the local
target Core repository and the installed target packages always outrank any written note.
If canonical knowledge disagrees with the target Core, the Core wins and the discrepancy
becomes a candidate.

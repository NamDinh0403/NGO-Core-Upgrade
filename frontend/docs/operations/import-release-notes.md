# Operations - Importing release notes

Raw release notes are **import material**, not runtime context. This is how they become
canonical structured knowledge.

> **Automated first pass available.** Before doing this by hand, run the shared
> [`../../ingest/tools/ingest.js`](../../ingest/README.md) ingestion phase
> (`node ../ingest/tools/ingest.js ingest --core-path <path> --release-notes <path> --target <version>`).
> It cross-checks the Core git history against `release-notes.md` and writes a
> `CANDIDATE` record per version — you're then editing/promoting a draft instead of
> transcribing from scratch. The manual steps below still apply for turning an
> approved candidate finding into a fully atomic canonical requirement.

## One-time / additive import

1. Obtain the raw notes (the workspace-root `release-notes.md`, shared with the Backend
   track). Do not point runtime code at it.
2. For every version, create `../ingest/knowledge/canonical/releases/<version>/release.yaml` plus only
   the non-empty scope files (`frontend.yaml`, `backend.yaml`, `database.yaml`,
   `deployment.yaml`, `decisions.yaml`).
3. Split each note into **atomic** requirements
   (`schemas/release-requirement.schema.json`): one action, one applicability, one owner.
4. Set duplicate/supersession relationships explicitly (`duplicateOf`, `supersedes`,
   `supersededBy`) where a card is re-listed or replaced in a later release.
5. Move reusable framework steps into `knowledge/canonical/migrations/` and configuration
   changes into `../ingest/knowledge/canonical/appsettings/`.
6. **Redact secrets**: replace concrete secret values with `<FROM_SECRET_PROVIDER>` /
   `<CLIENT_SPECIFIC_VALUE>` / `<PM_APPROVAL_REQUIRED>` and mark the requirement
   `sensitive: true`. Never commit a real value.
7. Write a sanitized copy and an import manifest under
   `knowledge/raw/release-note-import/` (`release-notes-sanitized.md`,
   `import-manifest.json` with source hash, import date, discovered versions, records
   created, redactions, unresolved items).

## Validate

```
node tests/release-schema.test.js     # every record conforms to its schema
node tests/release-knowledge.test.js  # range/duplicate/supersession/mapping/coverage
node tools/repo-layout.test.js        # no runtime module reads the raw notes
```

## Rules

- The complete raw note is **never** loaded into the model during an upgrade; only the
  applicable, resolved subset is (see `tools/lib/knowledge-context.js`).
- A note that names a client file (e.g. "edit app.module.ts") becomes a **semantic**
  requirement; the client mapping resolves the real implementation point at run time.
- Canonical YAML is authoritative; any Markdown under `knowledge/derived/` is generated or
  validated from it - never independently edited as a second source of truth.

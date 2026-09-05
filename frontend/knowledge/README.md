# Frontend Upgrade — Knowledge Base

**Canonical, structured source of truth for Angular 10 → 15 / NGO Core v5.x → v9.x frontend upgrades.**

The agent loads only the *applicable, resolved subset* per run — never the raw notes.

## Layout

```
knowledge/
  canonical/                                  # AUTHORITATIVE structured knowledge
    releases/<version>/{release,frontend,backend,database,deployment,decisions}.yaml
    migrations/angular-10-to-15.yaml          # reusable framework migration
    appsettings/backend-appsettings.yaml      # backend configuration requirements
    versions/version-manifest.json            # ngo-core <-> Angular/TS/ES mapping
  derived/                                     # human-readable, derived from canonical
    angular-10-to-15-migration.md  breaking-changes-by-version.md
    build-pipeline-changes.md  config-files-reference.md
    install-procedure.md  syntax-migration-patterns.md
  raw/release-note-import/                     # sanitized import material — NEVER read at runtime
  index/                                       # optional lookup indexes
  candidates/                                  # unapproved learning candidates
```

## Authority

- **Canonical YAML is authoritative.** Markdown under `derived/` is documentation derived from it — never a second source of truth.
- **The local target Core repository and installed target packages outrank every note** (see [../config/knowledge-priority.yaml](../config/knowledge-priority.yaml)).
- **Raw notes are import material only** and are never loaded into the model at run time.

## Schemas

`schemas/release-requirement.schema.json`, `release-manifest.schema.json`,
`appsettings-requirement.schema.json`, `requirement-coverage.schema.json`.

## How it is consumed

`tools/lib/release-knowledge.js` loads it; `release-range.js` resolves `S < v <= T` (dedup,
supersession, reusable migration); `applicability.js`, `requirement-map.js`,
`requirement-coverage.js`, and `appsettings-inventory.js` produce per-run coverage,
missing-steps, and deployment checklists. See
[../docs/architecture/release-knowledge.md](../docs/architecture/release-knowledge.md).

## Derived reference documents

| File | Purpose |
|------|---------|
| [derived/angular-10-to-15-migration.md](derived/angular-10-to-15-migration.md) | Step-by-step vendor recipe (narrative) |
| [derived/config-files-reference.md](derived/config-files-reference.md) | Per-file exact edits |
| [derived/syntax-migration-patterns.md](derived/syntax-migration-patterns.md) | Import/decorator/syntax transformations |
| [derived/install-procedure.md](derived/install-procedure.md) | Clean → purge → install → verify |
| [derived/build-pipeline-changes.md](derived/build-pipeline-changes.md) | CI/CD YAML changes |
| [derived/breaking-changes-by-version.md](derived/breaking-changes-by-version.md) | Per-release breaking changes |
| [canonical/versions/version-manifest.json](canonical/versions/version-manifest.json) | ngo-core ↔ Angular ↔ TS ↔ ES mapping |

Anything not covered is a genuine unknown → the agent marks it `HUMAN_REQUIRED` and continues.

## When to update

- Vendor ships a new version → add `knowledge/canonical/releases/<version>/` records and update `canonical/versions/version-manifest.json`; regenerate `derived/breaking-changes-by-version.md`
- New Angular major → extend `canonical/migrations/` and update `derived/config-files-reference.md`
- New pattern discovered during a client migration → write a **candidate** under `candidates/` (single-client patterns are not promoted to canonical until reviewed and shown to recur)

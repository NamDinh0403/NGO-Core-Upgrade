# Release knowledge import report

## Source

Workspace-root `release-notes.md` (shared with the Backend track). SHA-256 and full details
recorded in `knowledge/raw/release-note-import/import-manifest.json`.

## Records created

- **24 release versions**: 5.12.0, 5.14.0, 6.0.0, 6.1.0, 6.2.0, 6.3.0, 6.4.0, 7.0.0, 7.1.0,
  7.2.0, 7.3.0, 7.3.1, 7.5.0, 7.6.0, 7.7.0, 8.0.0, 8.1.0, 8.2.0, 8.3.0, 8.4.0, 8.6.0, 9.0.0,
  9.1.0, 9.2.0 - each with `release.yaml` plus only the non-empty scope files.
- **72 atomic release requirements** across FRONTEND / BACKEND / DATABASE / DEPLOYMENT /
  PIPELINE / AZURE / CROSS_CUTTING.
- **13 reusable Angular 10 -> 15 migration requirements**
  (`knowledge/canonical/migrations/angular-10-to-15.yaml`).
- **14 backend AppSettings requirements**
  (`knowledge/canonical/appsettings/backend-appsettings.yaml`).
- **version manifest** relocated to `knowledge/canonical/versions/version-manifest.json`.

All records validate against their schemas (`node tests/release-schema.test.js` -> 72
requirements, 13 migration reqs, 14 appsettings, 24 manifests, VALID).

## Duplicate / backport relationships (evidence-based)

| Duplicate (re-list) | Primary |
| --- | --- |
| REQ-9.1.0-BACKEND-01 (mark-as-paid folder) | REQ-8.6.0-BACKEND-01 |
| REQ-9.1.0-BACKEND-03 (Logframe2 saved-query tool) | REQ-8.6.0-BACKEND-02 |
| REQ-8.3.0-FRONTEND-01 (catch-all route) | REQ-7.7.0-FRONTEND-01 |
| REQ-8.3.0-BACKEND-01 (task view-permission) | REQ-7.7.0-BACKEND-01 |
| REQ-8.1.0-FRONTEND-01 (finance modules) | REQ-7.5.0-FRONTEND-01 |
| REQ-8.2.0-DATABASE-01 (DisableLogframe1) | REQ-7.6.0-DATABASE-01 |
| REQ-6.3.0-FRONTEND-01 (search-preview icon) | REQ-5.12.0-FRONTEND-01 |
| REQ-6.4.0-BACKEND-01 (indicator tracker) | REQ-5.14.0-BACKEND-01 |

## Supersession

- REQ-8.2.0-DEPLOYMENT-01 (SetAzureAdIdForUser, upgrade person) **supersedes**
  REQ-7.6.0-DEPLOYMENT-01 (deployment person).

## Reusable migration trigger

Angular 10 -> 15 loads when the client's Angular major increases across the range (source
major <= 14, target major >= 11, increasing). Verified: triggers for 7.0.0 -> 8.0.0
(Angular 10 -> 14); does not trigger for 8.3.0 -> 9.2.0 (15 -> 15).

## Redactions

See [secret-redaction-report.md](secret-redaction-report.md). The IATI subscription key was
redacted and flagged for rotation.

## Confirmations

- No runtime module reads the raw notes (`node tools/repo-layout.test.js` +
  test 30 in `tests/release-knowledge.test.js`).
- Range/duplicate/supersession/mapping/coverage behaviour verified (30/30 in
  `tests/release-knowledge.test.js`).

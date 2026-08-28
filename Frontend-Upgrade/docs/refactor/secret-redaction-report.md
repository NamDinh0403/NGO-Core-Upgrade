# Secret redaction report

Scope: all knowledge, documents, source, tests, and the release-note import material in the
Frontend-Upgrade repository. **No raw secret values appear in this report.**

## Findings

| # | Location (source) | Type | Action | Rotation required |
| --- | --- | --- | --- | --- |
| 1 | workspace-root `release-notes.md` (IATI section) | API subscription key (32-hex) | Replaced with `<FROM_SECRET_PROVIDER>` in the sanitized import; canonical requirement `APPSET-IATI-SUBSCRIPTIONKEY` marked `sensitive: true`, `dataType: secret`, value placeholder | **YES** - a real-looking key was committed in the raw notes and must be rotated |
| 2 | release-note AI section | Azure OpenAI endpoint + deployment name | Canonical `APPSET-OPENAI-ENDPOINT` / `APPSET-OPENAI-DEPLOYMENT` marked `sensitive: true`, placeholders `<FROM_SECRET_PROVIDER>` / `<CLIENT_SPECIFIC_VALUE>`, PM approval required | If a real endpoint/name was ever committed elsewhere, rotate |
| 3 | Various queue names / schedules (e.g. `adsyncgroupqueue`, cron strings) | Not secrets | Kept as `defaultValue` (non-sensitive) | No |

## Redaction mechanism

- The sanitized raw import (`knowledge/raw/release-note-import/release-notes-sanitized.md`)
  was produced by replacing any 32-hex token and the `IATISubscriptionKey` value with
  `<FROM_SECRET_PROVIDER>`. The import manifest records the source SHA-256 and the redaction.
- Canonical secret-backed settings store **only** placeholders and set `sensitive: true`.
- `tools/lib/appsettings-inventory.js` **rejects** any concrete value found on a `sensitive`
  key in committed client config (`secretRejections`), and the `start` pipeline records an
  `appsettings-secret-rejected` failure event.
- `tools/lib/knowledge-candidate.js` redacts candidate fields via the shared redactor before
  writing.

## Placeholders in use

- `<FROM_SECRET_PROVIDER>` - value must be resolved from the secret provider at deploy time.
- `<CLIENT_SPECIFIC_VALUE>` - client-specific, non-secret, supplied per client.
- `<PM_APPROVAL_REQUIRED>` - gated on PM approval (optional/cost-bearing features).

## Required follow-up

- **Rotate** the IATI subscription key that was present in the committed raw notes (finding
  #1). Removing the git-root `release-notes.md` is a cross-track MANUAL_BLOCKER (shared with
  the Backend track) and does not by itself rotate the exposed credential.

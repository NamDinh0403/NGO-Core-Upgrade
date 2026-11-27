# Power Automate -> GitHub release-note sync

Use GitHub as the shared source of truth instead of a personal OneDrive path. Store
the token in an authenticated connection, environment variable, or secret provider;
never place a PAT or GitHub App token directly in a flow definition.
The HTML/Markdown export must not contain live credentials; generated reports
redact secret-shaped values, but the committed raw file remains source evidence
and is visible to repository readers.

## Recommended: update the raw OneNote export through the Contents API

1. Export or serialize the OneNote release-notes page as UTF-8 HTML.
2. Send `GET` to obtain the current file SHA:

   ```http
   GET https://api.github.com/repos/NamDinh0403/NGO-Core-Upgrade/contents/docs/onenote-core-release-notes.html?ref=master
   Accept: application/vnd.github+json
   Authorization: Bearer <TOKEN_FROM_SECURE_CONNECTION>
   X-GitHub-Api-Version: 2022-11-28
   User-Agent: NGO-Release-Notes-PowerAutomate
   ```

3. Send `PUT` to the same URL with this JSON body:

   ```json
   {
     "message": "chore(release-notes): update OneNote source",
     "content": "<base64_of_the_UTF8_HTML_export>",
     "sha": "<sha_from_the_GET_response>",
     "branch": "master"
   }
   ```

   In a Power Automate expression, encode the response body with its built-in
   `base64(...)` function. Use the `sha` field only when the file already exists.
   If the file is absent, leave `sha` out.

4. The `push` on
   `docs/onenote-core-release-notes.html` starts
   `.github/workflows/sync-release-notes.yml`. The workflow merges the OneNote
   source with committed cards/candidate diffs and opens or refreshes the
   `automation/sync-release-notes` pull request.

## Alternative: trigger `repository_dispatch`

Send:

```http
POST https://api.github.com/repos/NamDinh0403/NGO-Core-Upgrade/dispatches
Accept: application/vnd.github+json
Authorization: Bearer <TOKEN_FROM_SECURE_CONNECTION>
X-GitHub-Api-Version: 2022-11-28
Content-Type: application/json
User-Agent: NGO-Release-Notes-PowerAutomate
```

Use this body when the OneNote file has already been updated:

```json
{
  "event_type": "onenote-updated",
  "client_payload": {
    "target_version": "10.0",
    "source_ref": "OneNote release notes",
    "core_ref": "develop"
  }
}
```

To include the export in the dispatch without OneDrive, optionally add
`"onenote_content_base64":"<base64_of_the_UTF8_HTML_export>"`. The workflow decodes
that value in its runner and includes the raw file in the generated PR.

## Token scope and repository configuration

- Prefer a GitHub App or fine-grained PAT over a classic PAT.
- A token used for Contents API needs **Contents: Read and write** plus repository
  metadata access.
- A token used for `repository_dispatch` needs **Actions: Read and write** (or the
  App permission capable of dispatching repository events) plus repository metadata.
- To collect active development diffs from another private Core repository, configure
  repository variable `CORE_REPOSITORY` and secret `CORE_REPOSITORY_TOKEN`, plus optional
  variables `CORE_DEVELOPMENT_REF` and `CORE_BASE_REF`. The token remains a GitHub
  Actions secret; no token is written to generated reports.
- Set `CORE_DRAFT_TARGET_VERSION` (for example `10.0`) when scheduled runs should
  associate the active development ref with an upcoming release. Without this
  variable, scheduled runs still merge committed OneNote/card/diff inputs but do
  not guess a draft version for Core checkout diffs.
- Use the workflow's `target_version` input for a one-click sync. Aliases such as
  `10`, `v10`, or `10.0` resolve to an existing released version or
  `10.0.0-draft`.

The resulting JSON and Markdown contain source references only. Secrets, personal
OneDrive paths, and Power Automate connection values must never be committed.

# Raw release-note inputs

The cloud sync job reads these deterministic inputs without depending on a local
machine:

- `cards/`: one Markdown file per release, or JSON shaped as
  `{"version":"10.0.0-draft","status":"DRAFT / IN PROGRESS","cards":[...]}`
- `git-diffs/`: JSON candidate-compatible records containing at least
  `{"version":"10.0.0","changes":[{"status":"M","path":"..."}]}`
- `../../docs/onenote-core-release-notes.html`: the raw OneNote export updated
  directly by Power Automate through the GitHub Contents API.

Raw inputs remain source evidence. Generated four-table reports are written under
`../generated/`; generated files must not be edited by hand.

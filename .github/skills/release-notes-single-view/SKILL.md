---
name: release-notes-single-view
description: Generate or display the four-table release report for one released or draft NGO Core version.
---

# Single Release View

1. Extract the requested version. Preserve aliases such as `v10`, `10`, and
   `10.0`.
2. Run:

   ```bash
   node platform/tools/release-notes-cli.js single --version "<version>"
   ```

3. Return the CLI Markdown as the release view. It contains the required quick
   summary and four tables:
   - Mandatory Actions
   - Conditional Actions (with condition first)
   - New Features & Enhancements
   - Bug Fixes
4. Keep `RELEASED` or `DRAFT / IN PROGRESS` exactly as returned. Preserve
   `Needs Review` labels and Card/PR links.
5. If JSON is needed for a UI/tool, rerun with `--json`; do not reconstruct the
   object from the Markdown.

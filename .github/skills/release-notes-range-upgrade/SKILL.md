---
name: release-notes-range-upgrade
description: Aggregate mandatory and conditional upgrade actions across a source-to-target NGO Core release range in execution order.
---

# Cross-Version Upgrade Lookup

1. Resolve the user's source and target versions exactly as entered.
2. Run:

   ```bash
   node platform/tools/release-notes-cli.js range --from "<source>" --to "<target>"
   ```

3. Present Mandatory Actions separately from Conditional Actions. Preserve the
   version prefix on every row and the tool's order: version ascending, then
   Before Deploy, During Upgrade, After Deploy.
4. Do not deduplicate actions across versions. A repeated action may belong to
   separate releases and source references.
5. Use `--json` only when another deterministic consumer needs the structured
   range. Never infer that a `Needs Review` condition can be skipped.

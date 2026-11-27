---
name: release-notes-tracking-search
description: Search deterministic feature, bug-fix, action, module, and Card/PR evidence across NGO Core releases.
---

# Feature and Bug Tracking Search

1. Convert the user's query into the exact lookup text; do not expand it with
   guessed synonyms.
2. Run:

   ```bash
   node platform/tools/release-notes-cli.js search --query "<query>" \
     [--from "<source>"] [--to "<target>"] [--module "<module>"]
   ```

3. Summarize returned matches only. Include the release version, status, category,
   technical evidence, and Card/PR ref supplied in each JSON match.
4. If the question is "Which release fixed X?", list matching bugfix versions in
   deterministic order and state when no deterministic match exists.
5. If the question is "What changed in module Y?", keep feature, bugfix, and
   upgrade-action matches separate. Do not claim root cause beyond the returned
   key-file evidence.

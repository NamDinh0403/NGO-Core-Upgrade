---
name: release-notes-client-filter
description: Check conditional release-note actions against a supplied client repository and separate applicable, skippable, and review-needed items.
---

# Client-Aware Conditional Filtering

Run this skill only when the user supplies a client repository path. Do not scan
or mutate any unrelated client.

```bash
node platform/tools/release-notes-cli.js client --version "<version>" \
  --client-path "<absolute-client-path>"
```

Group the JSON output under:

- **Applies:** a deterministic code/config signal was found; include matched
  files.
- **Can Skip:** no extracted condition signal exists in the repository; retain
  the caveat returned by the tool for externally configured modules.
- **Needs Review:** the condition depends on database, Azure, PM, module state,
  or is already ambiguous in the source.

Never convert `Needs Review` to `Can Skip` from model judgment. Client scanning is
read-only and deterministic; database or deployed-environment checks remain an
explicit owner task.

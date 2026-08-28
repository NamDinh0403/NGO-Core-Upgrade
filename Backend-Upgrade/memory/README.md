# Memory

Four-tier separation. Do not collapse these into one file or one prompt.

- `episodes/` — what happened during a specific run (native or imported). Sanitized. Schema: `schemas/episode.schema.json`.
- `candidates/` — proposed reusable patterns extracted from episodes. **Never authoritative.** Schema: `schemas/fix-pattern.schema.json` / `error-pattern.schema.json`.
- `approved/` — patterns that passed validation + regression + developer approval. May be applied as guidance (still below the decompiled DLL).
- `rejected/` — patterns proven unsafe, kept with reasons so they are not rediscovered.

## Promotion lifecycle

```
raw evidence (runs/)
  -> structured episode (episodes/)
  -> candidate pattern (candidates/)
  -> validation + regression replay (evals/)
  -> developer approval (or explicit policy gate)
  -> approved pattern (approved/)
  -> canonical/index update
```

A candidate cannot become approved because it worked once. Default promotion
requirements (see `config/escalation-policy.yaml` + `retention-policy.yaml`):
no unredacted client secrets, at least one preserved successful evidence set,
defined applicability + validation, no unresolved contradiction with canonical
knowledge, regression evaluation completed, developer approval, confidence
threshold satisfied, schema validation passes.

## Isolation

Candidate/episode records are client-scoped. Cross-client retrieval of
unapproved memory is forbidden (`config/retention-policy.yaml`). Only approved,
redacted patterns are globally retrievable.

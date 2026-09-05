# tools/memory

Memory lifecycle contract (Phase 08 Handover).

- Create an `episode` for every run (success or blocked) →
  `memory/episodes/**`, valid against `schemas/episode.schema.json`.
- Extract reusable learning as a `candidate` pattern → `memory/candidates/**`.
  Never write directly to `memory/approved/**` or `Knowledge/`.
- Redact secrets/PII before creating any reusable record
  (`config/retention-policy.yaml`).
- Isolation: candidate/episode records are client-scoped. Cross-client retrieval
  of unapproved memory is forbidden. `verify-isolation` conceptually checks that
  no global/approved record carries a client identifier.

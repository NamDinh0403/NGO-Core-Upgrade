---
name: learn-from-run
description: Transforms a completed/blocked/failed run into sanitized episodes and candidate learning (never canonical).
metadata:
  id: learn-from-run
  version: 1.0.0
  status: active
  risk: low
  input-schema: schemas/input.schema.json
  output-schema: schemas/output.schema.json
---

# Purpose
Convert a finished run into safe, structured, reusable learning: a sanitized
episode plus (optionally) candidate patterns — never canonical knowledge.

# Trigger conditions
- A run completed, was blocked, or failed.

# Exclusions
- Never writes to `knowledge/canonical/`.
- Never approves its own candidates.
- Never exposes client-sensitive information.
- Never treats a single success as a universal rule.

# Preconditions
- Final or blocked run state and event history exist.

# Required capabilities
`read-repository`, `validate-json-schema` (Level 0).

# Inputs
See `schemas/input.schema.json` — run state, events, decisions, observations, attempted fixes, build/test/runtime results, documentation status, changed files, developer feedback, final outcome.

# Procedure
1. Distinguish: what happened / what appeared to work / what was verified / what failed / what stays client-specific / what may be reusable.
2. Write a sanitized `episode` (`memory/episodes/**`, validated against `schemas/episode.schema.json`) — success AND failure captured.
3. Extract candidate patterns to `memory/candidates/**` only when evidence supports them (never to approved).
4. Redact secrets/PII and client business rules before any reusable record (`config/retention-policy.yaml`).
5. Classify learning: EPISODE_ONLY / CLIENT_SPECIFIC / CANDIDATE_ERROR_PATTERN / CANDIDATE_FIX_PATTERN / CANDIDATE_VERSION_FINDING / CANDIDATE_WORKFLOW_IMPROVEMENT / INSUFFICIENT_EVIDENCE.

# Evidence requirements
Candidate records include problem signature, applicability, exclusions, action, successful + failed evidence, verification level, risks, limitations, confidence, redaction status, review requirement.

# Uncertainty handling
Unresolved research questions are recorded for developer review, not resolved here.

# Completion criteria
An episode exists and validates; candidates (if any) are labelled and unapproved; client identifiers do not appear in global reusable memory. Status SUCCEEDED / SUCCEEDED_WITH_WARNINGS / BLOCKED_NEEDS_DEVELOPER.

# Retry behavior
Idempotent; re-running updates the episode without duplicating.

# Escalation behavior
If sanitization cannot be guaranteed → BLOCKED_NEEDS_DEVELOPER via `developer-escalation`.

# Outputs
See `schemas/output.schema.json` — episodeRef, candidateRefs, classifications, redactionStatus, nextAction.

# Allowed next skills
`developer-escalation` (for review handoff) or run closure.

# Prohibited behavior
No canonical writes. No self-approval. No client leakage.

---
name: shared-upgrade-learn
description: Capture sanitized scoped episodes and candidate-only learning for successful, blocked or failed upgrade runs.
---
# Procedure
1. Distinguish observed, verified, failed, client-specific and potentially reusable findings. Preserve negative evidence and limitations.
2. Exclude personal data, client business rules and source bodies; redact secrets and client identifiers before reusable capture. If sanitization is uncertain, stop for developer review.
3. Use `engine/tools/lib/memory.capture(scope, record, options)` with scope shared/core/backend/frontend. A redactionReview must explicitly verify removal of personal data, client business rules and source bodies with evidence; uncertainty stops capture. Capture episodes for all outcomes and candidates only with redacted evidence.
4. Stable IDs make retries idempotent. Records live under engine/memory/episodes or candidates with scope metadata; no separate track memory engine.
5. Candidates never become approved or canonical automatically. Only explicit developer review moves a candidate to approved/rejected. Client-specific unapproved data never enters another client's context.
6. Return episode/candidate refs, redaction status, limitations and exact next action using the compatibility/domain output schema.
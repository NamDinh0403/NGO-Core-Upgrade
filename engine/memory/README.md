# Scoped Upgrade Memory

One lifecycle: episodes -> candidates -> explicit developer review -> approved
or rejected. Content is scoped shared/core/backend/frontend; the engine owns the
mechanism, retention and isolation policy. Scope directories are created lazily.

Use `tools/lib/memory.capture`, `approved` and `review`, or the shared learning
skill. Capture never writes approved/canonical knowledge. Reusable records are
redacted and client-identifying fields removed; uncertain personal/business
content stops for review. Review metadata is allowlisted and sanitized.

Existing backend episode/pattern records were relocated without changing their
contents or promoting them. Their directory supplies backend scope. Legacy
schemas and technical IDs remain valid for historical reads/evaluation.
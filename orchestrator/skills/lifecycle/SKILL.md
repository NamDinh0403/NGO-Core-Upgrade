---
name: shared-upgrade-lifecycle
description: Owns generic NGO Core discovery, ingestion, context handoff, validation, reporting and candidate-learning rules. Track adapters supply domain planning and execution.
---

# Shared Lifecycle

This is the single generic lifecycle contract. Read only the current section,
the current run and applicable evidence. Never load all skills/knowledge/history.

## Discover
Use requested repository roots and manifest facts, not a recursive workspace
inventory. Discover installed versions through the domain adapter. Ask once for
missing/conflicting inputs, including the requested target; never infer a target
from the highest installed version. JSON, Git, manifests and fingerprints are
deterministic work, not separate model-reasoning passes.
Shared discovery carries version constraints only; URL/local/non-version package
declarations use a lazy-resolution marker. Never copy credentials from manifests
or tool output into contexts, artifacts or learned knowledge.

## Ingest And Analyze
The orchestrator alone calls `context.ensureCoreChangeSet`, which reuses existing
`ingest.ensureReleases` cache/analysis. Run `create-run` with the requested tracks
and source/target. A valid CoreChangeSet references all intermediate candidate
records, immutable boundaries, note/analyzer identities and content hashes.
Candidate facts are not approved knowledge or API compatibility proof.

For coordinated execution consume `contexts/<track>.json`; never call ingest
again. Standalone executors create a single-track shared run through the same
owner. Missing/stale context stops with an exact owner resume action; it is not
permission to independently regenerate Core knowledge. Legacy historical runs
remain readable through their existing engines.

## Plan And Execute
Pass only one track context, not both client repositories or the full Core diff.
Evaluate both `requirements` and `upgrade.sharedRequirements`; shared items appear
only once per packet rather than being duplicated in the domain array.
API hints and integration validation status are the cross-track boundary. Domain
adapters own installed-package, configuration, migration and host-app inspection.
Read relevant immutable evidence lazily when semantic analysis needs it.

Each track plans read-only and passes its own READY, uncertainty, baseline,
fingerprint, approval, capability and idempotency gates before mutation. Local
checkpoints stay authoritative. Shared executor status is a projection, not a
replacement state machine. Serialize mutation when client working trees overlap.

## Diagnose
Capture/classify deterministic failure first; use a scoped requirement/evidence
packet for semantic diagnosis only when necessary. Apply the owning track's
existing retry budget. Do not retry blocked tracks on their behalf, repeat an
identical unsuccessful interpretation or hide incomplete validation.

## Validate And Report
Domain adapters produce build/test/configuration/integration evidence. Backend
owns appsettings values, EF and database requirements; frontend owns Angular,
NgRx and the mandatory reference-host diff. Frontend receives backend validation
status, not configuration values. Shared coverage still checks moved requirements
and backend configuration evidence.

Compose terminal results, verify coverage, prepare handover, then generate one
report. Fingerprints bind candidates, contexts, discovery, domain evidence,
coverage and handover; drift blocks completion. Never mark failure as success,
omit an outstanding requirement or leave an unowned manual item.

## Learn
Use the domain adapter's candidate output schema; redact first. Client evidence
stays run-scoped, never enters another client's context. Candidates are never
automatically canonical. Developers promote approved knowledge. Do not copy
secrets or generalize an unverified fix. Every step ends with one status and an
exact safe next action.
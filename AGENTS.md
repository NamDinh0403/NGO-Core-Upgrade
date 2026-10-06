# NGO Core Upgrade

`@ngo-core-upgrade` uses ONE shared engine and TWO domain executors.
Read [engine/AGENTS.md](engine/AGENTS.md) first, then only the requested executor
contract: [backend](backend/AGENTS.md) or [frontend](frontend/AGENTS.md).

## Ownership
- `ingest/`: read-only Core analysis, cache and canonical CoreChangeSet producer;
  shared Core release/configuration knowledge. Do not rewrite/repeat ingestion.
- `engine/`: authoritative lifecycle, context, planning/safety, dispatch, retry,
  evidence, memory, generic skills/schemas, coverage, handover and report.
- `backend/`: .NET/NuGet/EF/config/source implementation and installed-surface verification.
- `frontend/`: Angular/TypeScript/NgRx/packages/routes/providers/templates and verification.
- `orchestrator/`: compatibility CLI/import paths and historical shared runs only.

Discover source versions/client paths from metadata, Core path from inputs/config,
and ask once for material missing/conflicting inputs including the target.
Do not infer a target from the highest installed version. Both-track and
single-track upgrades use the same engine. Tracks never ingest or own global state.

## Safety
Never mutate a client before its engine-registered plan is READY and all safety
gates pass. Core is strictly read-only, with no branch switching. Never expose
secrets or automatically write/promote canonical/approved knowledge. Every
result has one status and an exact next action. Verify coverage before handover;
no COMPLETE with incomplete evidence or unowned outstanding work.

## Framework Validation
Run `node tools/validate-all.js`. It runs all existing ingest/orchestrator/backend/
frontend suites plus engine tests and fails if tracked content changes.
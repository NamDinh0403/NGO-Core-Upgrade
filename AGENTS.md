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

## Release Discovery Hierarchy
Release resolution uses an evidence-based hierarchy:
1. Published package artifact matching the requested target version.
2. Official release tag or immutable source revision, if available.
3. Official release metadata and release notes.
4. Relevant commits, pull requests, or source diffs, if available.
5. Authoritative package metadata and compatibility information.

The existence of a `releases` branch is an OPTIONAL discovery hint, never a release
prerequisite. For urgent package-first releases where packages are published before
branches or tags exist, proceed using package evidence and available artifacts. Missing
optional evidence is not missing required input; never block on absent branches.

## Safety
Never mutate a client before its engine-registered plan is READY and all safety
gates pass. Core is strictly read-only, with no branch switching. Never expose
secrets or automatically write/promote canonical/approved knowledge. Every
result has one status and an exact next action. Verify coverage before handover;
no COMPLETE with incomplete evidence or unowned outstanding work.

## Framework Validation
Run `node tools/validate-all.js`. It runs all existing ingest/orchestrator/backend/
frontend suites plus engine tests and fails if tracked content changes.
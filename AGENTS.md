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

## Interactive Multi-Machine Protocol & Preflight
When running on any developer machine (especially outside the primary workstation):
1. **Always Ask for Paths Upfront**:
   If not explicitly provided in the user's prompt or workspace, ask the user to confirm/paste:
   - Local path to `ngo-online-core` repository.
   - Local path to the client project / solution to upgrade.
   - Desired target version or branch (e.g. `9.4` or `9.4.1`). When a branch/minor like "9.4" or "last 9.4" is requested, the framework resolves it to the latest verified release on that branch (e.g. `9.4.1`); NEVER assume or default to `9.4.0`.
   Never assume or guess hardcoded paths.
2. **Deterministic Preflight Verification**:
   Run `node tools/check-environment.js --core-path <core> --client-path <client> --target <target>` to verify:
   - **Git Author Identity**: Verify coworker's `git config user.name` and `git config user.email`. All commits must use the coworker's authenticated identity.
   - **Client Git Status**: Confirm clean working tree or safe baseline.
   - **Core Repository**: Confirm valid git repo and verify release evidence (git tags `v<source>`, `v<target>` or release branches `releases/*`). If refs are missing, run `cd "<core>" && git fetch --all --tags`. Remind that Core is strictly READ-ONLY (no checkout, no branch changes).
   - **NuGet & npm Runtimes**: Verify .NET SDK, authenticated NuGet package sources, and Node/npm.
3. **Anti-Looping & Agent Integrity Rules (STRICT)**:
   - **NEVER edit the upgrade agent code**: Under no circumstances should an agent modify files in `NGO Core Upgrade/` (engine, backend, frontend, ingest, or tools). If a command fails, report the error with remediation steps; never attempt to "fix" the upgrade agent scripts.
   - **NEVER checkout or switch Git branches in Core**: Core is strictly READ-ONLY. Do not run `git checkout` or switch branches in Core; release discovery reads branch metadata non-destructively.
   - **No infinite retry loops**: Run engine commands deterministically. If blocked, report the blocker and pause for user input.
4. **Restore, Build & Completion Gate**:
   - Backend: run `dotnet restore` and `dotnet build` on the client solution; verify 0 errors.
   - Frontend: run `npm install` / `npm ci` and `npm run build` on the client web app; verify 0 errors.
   - Report a structured completion summary to the user when finished (version, files changed, build verification: 0 errors).

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

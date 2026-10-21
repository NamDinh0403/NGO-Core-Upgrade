---
name: ngo-core-upgrade
description: Single NGO Core upgrade engine for backend and frontend. Owns one lifecycle, CoreChangeSet, planning, safety, memory, validation and report; dispatches specialized domain executors.
---

# NGO Core Upgrade Orchestrator

Read [AGENTS.md](../../AGENTS.md) for routing, then follow
[engine/AGENTS.md](../../engine/AGENTS.md) for the shared-run loop.
These contracts own input discovery, validated release reuse, delegation,
auto-mode boundaries, coverage, escalation and reporting. Do not re-derive them.
Resolve links against the installed agent root when running from a user profile.
Load only the requested track's contract and current applicable evidence.
Delegate only its verified track context and domain inputs. Core ensuring and
generic lifecycle belong to the shared owner; executors do not repeat ingestion.

## Standard Execution Protocol on Any Machine

### 1. Mandatory Input Gathering (Ask First)
If not explicitly provided in the user's initial prompt, prompt the user to provide:
- **Local NGO Core path** (e.g. `C:\repos\ngo-online-core`).
- **Client project / solution path** (e.g. `C:\repos\DemoSite\DemoSite.sln` or directory).
- **Target version or branch** (e.g. `9.4` or `9.4.1`). When a branch/minor like "9.4" or "last 9.4" is requested, resolve it to the latest verified release on that branch (e.g. `9.4.1`); NEVER assume or default to `9.4.0`.
*Never guess or fallback to hardcoded paths from other machines.*

### 2. Environment & Git Authentication Verification
Run the preflight check before any operation:
```bash
node tools/check-environment.js --core-path "<corePath>" --client-path "<clientPath>" --target "<targetVersion>"
```
- **Git Author Identity**: Ensure commits use the coworker's logged-in git identity (`git config user.name`, `git config user.email`).
- **Client Working Tree**: Verify working tree status.
- **Core Repository**: Verify local Core repo. Ensure git tags are fetched (`git fetch --all --tags` if missing). Remember Core is strictly **READ-ONLY**.
- **NuGet & npm**: Verify .NET SDK and authenticated NuGet feeds.

### 3. Strict Safety & Anti-Looping Rules
- **NEVER mutate any files in `NGO Core Upgrade/`**: The agent must NEVER edit engine, backend, frontend, ingest, or tools scripts. If a command fails, report the error to the user immediately. Do not attempt to fix or rewrite the upgrade tools.
- **NEVER checkout or switch Git branches in Core**: Core is strictly READ-ONLY. Do not run `git checkout` or switch branches in Core; release discovery reads tags, branch refs, and package evidence non-destructively.
- **No infinite retry loops**: Run engine CLI commands sequentially. If a command exits with an error, pause and present the error and recommended fix to the user.

### 4. Parallel Track Execution & Verification Gate
When upgrading both backend and frontend:
- **Parallel Track Dispatch**: Do NOT run the tracks sequentially or wait for backend to finish before starting frontend. Because backend (e.g. `ngo-api/`) and frontend (e.g. `ngo-client/`) reside in separate directories with independent build toolchains (`dotnet` vs `npm`/`ng`), execute them concurrently in parallel.
- **Concurrent Restore & Build**: Run backend (`dotnet restore` and `dotnet build`) and frontend (`npm install` and `npm run build`) in parallel background executions without waiting for one to finish before starting the other.
- **Completion Gate**: Wait for both parallel executions to complete. Verify 0 errors for both backend and frontend builds before declaring completion.

### 5. Completion Notification
When complete, notify the user with:
- Client name & target version reached (e.g. upgraded to 9.4.1).
- Summary of updated files (.csproj, packages, appsettings).
- Verification results: Backend build PASSED (0 errors), Frontend build PASSED (0 errors).
- Git commit status.

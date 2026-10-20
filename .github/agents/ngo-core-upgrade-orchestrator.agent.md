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
- **Target version** (e.g. `9.4.0`).
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
- **NEVER search for or checkout Git branches**: Follow the release hierarchy (tags like `v9.4.0` or package artifacts). Never look for a `releases` branch or switch branches in Core.
- **No infinite retry loops**: Run engine CLI commands sequentially. If a command exits with an error, pause and present the error and recommended fix to the user.

### 4. Restore, Build, and Verification Gate
After executing the upgrade modifications:
- **Backend**: Run `dotnet restore <solutionPath>` and `dotnet build <solutionPath> --no-restore` (assert 0 errors).
- **Frontend**: Run `npm install` (or `npm ci`) and `npm run build` in the client directory (assert 0 errors).
- Ensure both backend and frontend build with 0 errors before declaring success.

### 5. Completion Notification
When complete, notify the user with:
- Client name & target version reached (e.g. upgraded to 9.4.0).
- Summary of updated files (.csproj, packages, appsettings).
- Verification results: Backend build PASSED (0 errors), Frontend build PASSED (0 errors).
- Git commit status.

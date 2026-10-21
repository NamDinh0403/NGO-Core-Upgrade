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

## Automated Guided Onboarding, Preflight & Execution Protocol

When the user sends an upgrade request (e.g. `"Upgrade my client project to NGO Core 9.4.1"`), **you (the agent) own the setup check and interactive guidance before running the upgrade** so the user never has to manually read or run pre-setup steps first:

### 1. Input Gathering (Ask Only for Missing Inputs)
Check if the user's prompt provides:
- **Local NGO Core path** (e.g. `C:\repos\ngo-online-core`)
- **Client project / solution path** (e.g. `C:\repos\ngo-online-shelterbox`)
- **Target version or branch** (e.g. `9.4` or `9.4.1`)

If any of the 3 are missing and cannot be auto-discovered, ask the user for them once. When a branch/minor like `9.4` is requested, resolve it to the latest verified release on that branch (e.g. `9.4.1`); NEVER assume or default to `9.4.0`.

### 2. Automatic Path Persistence & 8-Stage Preflight Check
Before starting the upgrade engine, ALWAYS run:
```bash
node tools/check-environment.js --core-path "<corePath>" --client-path "<clientPath>" --target "<targetVersion>" --save-settings
```
This command automatically:
- Saves the verified `corePath` and client workspace root into `platform/config/settings.json` so the user does not need to edit config files manually.
- Checks **Stage 1 (Tools)**, **Stage 2 (Git Identity & GitHub Access)**, **Stage 3 (Local Core Repo)**, **Stage 4 (NuGet / Azure Artifacts 5-Stage Feed Auth)**, **Stage 5 (`.npmrc` & Private npm Auth)**, **Stage 6 (Client Working Tree)**, and **Stage 7 (Source/Target Release Evidence via `releases/*` branches and published NuGet/npm package metadata — Git tags are optional and NOT required)**.

### 3. Interactive Guided Setup (If Preflight Finds Missing Config or Auth)
If `check-environment.js` reports any `BLOCKED` or missing authentication/config items, **guide the user step-by-step and help fix them interactively**:
1. **Outdated Remote `releases/*` Branches in Core:** NGO Core releases rely on `origin/releases/*` branches, commit history, and published package metadata (not Git tags). If remote release branches need refreshing, automatically run `git -C "<corePath>" fetch --all` (strictly read-only fetch; NEVER checkout or switch branches in Core) and re-run preflight.
2. **Missing Git Author Identity (`user.name` / `user.email`):** Ask the user for their name and email, then run `git config --global user.name "<Name>"` and `git config --global user.email "<Email>"` for them.
3. **Missing GitHub / Git HTTPS Auth:** Guide the user to run `gh auth login --hostname github.com --web && gh auth setup-git --hostname github.com` (never ask the user to paste PATs in chat).
4. **Missing NuGet / Azure Artifacts Auth (`HTTP 401`):** Run or guide the user to run `dotnet restore --interactive` inside `<clientPath>/ngo-api` (or `az login`) so they can complete the interactive Microsoft login, then re-run `check-environment.js`.
5. **Missing `.npmrc` Private Feed Auth (`NPM_AUTH_REQUIRED`):** Guide the user to run `npx vsts-npm-auth -config .npmrc` inside `<clientPath>/ngo-client` (or `npm login --auth-type=web`), then re-run `check-environment.js`.

Repeat the preflight check after guiding the user through any missing item until `check-environment.js` reports **`Readiness Status: READY TO UPGRADE`**.

### 4. Automatic Upgrade Execution (Once Preflight is `READY TO UPGRADE`)
As soon as `check-environment.js` passes (`READY TO UPGRADE`), **immediately proceed with the upgrade** without asking the user to re-type their prompt:
- **Strict Safety Rules**:
  - **NEVER mutate any files in `NGO Core Upgrade/`** (engine, backend, frontend, ingest, or tools scripts).
  - **NEVER checkout or switch Git branches in Core** (`ngo-online-core` is strictly READ-ONLY).
- **Parallel Track Execution**:
  - When upgrading both backend and frontend, execute backend (`ngo-api/`) and frontend (`ngo-client/`) concurrently in parallel—never wait for backend to finish before starting frontend.
  - Run `dotnet restore` & `dotnet build` and `npm ci`/`npm install` & `npm run build` in parallel background executions.
- **Completion Gate & Summary**:
  - Wait for both parallel tracks to finish and verify **0 build errors** on both backend and frontend.
  - Report the final summary: client name, target version reached, updated files, and build verification status (0 errors).

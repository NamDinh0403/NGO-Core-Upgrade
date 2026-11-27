---
name: ngo-core-backend-upgrade
description: Backend domain executor for the shared NGO Core engine; implements .NET, NuGet, EF and configuration changes with installed-assembly/API and build/test evidence.
---

# NGO Core Backend Upgrade Agent

Your authoritative contract is [backend/AGENTS.md](../../backend/AGENTS.md) —
read it first. It defines domain verification and implementation; the engine
owns lifecycle, policies and escalation. Workspace-level routing lives in the
root [AGENTS.md](../../AGENTS.md).

## Protocol & Guardrails
Follow [command-first execution](../../engine/AGENTS.md#command-first-upgrade-execution):
execute documented commands before reading JS; no new test/probe files or
framework suites during client upgrades. Optional tests default to SKIPPED
with a reason; do not repeat unchanged successful restore/build checks.
1. **Inputs**: Use supplied or verified client solution path, Core repository path and target version; ask only for genuinely missing/conflicting inputs. Never use hardcoded paths from other machines.
2. **Environment & Git Auth**: Verify coworker's git author identity (`git config user.name`, `git config user.email`), clean git status, and release evidence via `releases/*` branches or published NuGet package metadata (Git tags are optional and not required). Core is strictly READ-ONLY.
3. **No Self-Mutation**: NEVER edit or mutate files in `NGO Core Upgrade/`. Report failures directly to user.
4. **Restore & Build**: Run `dotnet restore <solutionPath>` and `dotnet build <solutionPath> --no-restore`. Verify 0 errors. Run existing targeted tests only when requested or needed to diagnose a concrete regression.
5. **Autonomous Changes & EF**: The upgrade request authorizes routine package/source/config fixes and client migration/snapshot/SQL generation and review. Follow [autonomous migration policy](../../backend/AGENTS.md#autonomous-upgrades-and-ef-migrations); plan these steps and execute after the target build without separate approval. Never apply database changes without explicit approval. Escalate concrete destructive/data-semantic risks, not the mere need for a migration.
6. **Notification**: Summarize completed NuGet package updates, appsettings adjustments, migration/SQL review, pending deployment actions and build status (0 errors) when done.

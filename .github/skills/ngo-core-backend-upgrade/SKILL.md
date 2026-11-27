---
name: ngo-core-backend-upgrade
description: Upgrades a client's NGO.Core NuGet packages (.NET backend, EF migrations, appsettings) to a target version using the agent-driven workflow in backend/. Use when the user asks to upgrade NGO Core / NGO.Core packages on the backend, fix compile errors after an NGO Core bump, or run an EF migration as part of a Core upgrade.
---

# NGO Core Backend Upgrade

This skill dispatches the specialized backend executor that lives in
[backend/](../../../backend/AGENTS.md). Do not re-derive the process —
the [shared engine](../../../engine/AGENTS.md) owns lifecycle, safety, memory,
generic skills and reporting. Backend owns .NET/NuGet/EF implementation only.
Follow [command-first execution](../../../engine/AGENTS.md#command-first-upgrade-execution):
run existing commands before reading JS, create no test/probe files, skip
optional tests with a reason, and reuse unchanged successful build evidence.

## When to use
- "Upgrade NGO Core packages to version X.Y.Z" for a given client solution.
- Resuming an interrupted Core upgrade run.
- Diagnosing a build failure that appeared after an NGO Core bump.

## Procedure
Follow [backend/AGENTS.md](../../../backend/AGENTS.md) and the shared engine's
registered-plan lifecycle. Resolve paths against the installed agent
root when registered at user level.
1. Prompt for client solution path and core path if not provided.
2. Verify coworker's git author identity (`git config user.name`, `git config user.email`), safe git baseline, and release/package evidence. Tags and release branches are optional, not approval blockers.
3. Automatically apply registered package/source/config fixes; the upgrade request authorizes routine compatibility changes. Never edit the upgrade agent code itself.
4. Run `dotnet restore` and `dotnet build --no-restore`. Verify 0 compile errors. Do not modify client test-bed files or create duplicate compile sandboxes.
5. Automatically generate/review client EF migration/snapshot and SQL files after the target build, following [autonomous migration policy](../../../backend/AGENTS.md#autonomous-upgrades-and-ef-migrations). No separate generation approval; never apply database changes without explicit approval. Report concrete destructive/data-semantic risks and reuse matching output on resume.
6. Notify the user with a structured completion report including migration/SQL review and pending deployment actions when done.

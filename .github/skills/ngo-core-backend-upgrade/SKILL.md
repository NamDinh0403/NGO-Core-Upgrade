---
name: ngo-core-backend-upgrade
description: Upgrades a client's NGO.Core NuGet packages (.NET backend, EF migrations, appsettings) to a target version using the agent-driven workflow in backend/. Use when the user asks to upgrade NGO Core / NGO.Core packages on the backend, fix compile errors after an NGO Core bump, or run an EF migration as part of a Core upgrade.
---

# NGO Core Backend Upgrade

This skill dispatches the specialized backend executor that lives in
[backend/](../../../backend/AGENTS.md). Do not re-derive the process —
the [shared engine](../../../engine/AGENTS.md) owns lifecycle, safety, memory,
generic skills and reporting. Backend owns .NET/NuGet/EF implementation only.

## When to use
- "Upgrade NGO Core packages to version X.Y.Z" for a given client solution.
- Resuming an interrupted Core upgrade run.
- Diagnosing a build failure that appeared after an NGO Core bump.

## Procedure
Follow [backend/AGENTS.md](../../../backend/AGENTS.md), including its Start/Resume
and Shared Orchestration sections. Resolve paths against the installed agent
root when registered at user level.
1. Prompt for client solution path and core path if not provided.
2. Verify coworker's git author identity (`git config user.name`, `git config user.email`), clean git tree, and core release tags.
3. Apply planned NuGet package and code updates. Never edit the upgrade agent code itself.
4. Run `dotnet restore` and `dotnet build --no-restore`. Verify 0 compile errors.
5. Notify the user with a structured completion report when done.

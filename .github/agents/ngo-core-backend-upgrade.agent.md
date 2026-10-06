---
description: Backend domain executor for the shared NGO Core engine; implements .NET, NuGet, EF and configuration changes with installed-assembly/API and build/test evidence.
---

# NGO Core Backend Upgrade Agent

Your authoritative contract is [backend/AGENTS.md](../../backend/AGENTS.md) —
read it first. It defines domain verification and implementation; the engine
owns lifecycle, policies and escalation. Workspace-level routing lives in the
root [AGENTS.md](../../AGENTS.md).

Use the contract's Start/Resume and Shared Orchestration sections. Discover
obvious workspace inputs before asking for missing/conflicting ones. Load only
the selected skill, current state and applicable evidence. Resolve links against
the installed agent root when registered at user level.

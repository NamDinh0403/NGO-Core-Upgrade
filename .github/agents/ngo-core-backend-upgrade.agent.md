---
description: Runs an autonomous NGO Core backend package upgrade (NuGet, .NET, EF migrations) for a client solution, following the backend agent workflow end to end.
---

# NGO Core Backend Upgrade Agent

Your authoritative contract is [backend/AGENTS.md](../../backend/AGENTS.md) —
read it first. It defines the phase order, skills, policies and escalation
rules; do not re-derive or duplicate them. Workspace-level routing lives in the
root [AGENTS.md](../../AGENTS.md).

Use the contract's Start/Resume and Shared Orchestration sections. Discover
obvious workspace inputs before asking for missing/conflicting ones. Load only
the selected skill, current state and applicable evidence. Resolve links against
the installed agent root when registered at user level.

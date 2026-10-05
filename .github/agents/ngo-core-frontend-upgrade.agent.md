---
description: Runs an autonomous NGO Core front-end upgrade (Angular/NgRx) for a client repository, reading a local NGO Core checkout read-only, following the frontend agent workflow end to end.
---

# NGO Core Frontend Upgrade Agent

Your authoritative contract is [frontend/AGENTS.md](../../frontend/AGENTS.md) —
read it first. It defines the release-knowledge model, the dual-repository
rules, the skill pipeline and the mutation gate; do not re-derive them.
Workspace-level routing lives in the root [AGENTS.md](../../AGENTS.md).

Use the contract's Start/Resume and Shared Orchestration sections. Discover
obvious workspace inputs before asking for missing/conflicting ones. Load only
the selected skill, current state and applicable evidence. Resolve links against
the installed agent root when registered at user level.

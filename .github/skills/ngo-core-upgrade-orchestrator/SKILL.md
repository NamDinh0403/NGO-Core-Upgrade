---
name: ngo-core-upgrade-orchestrator
description: Runs a full NGO Core upgrade engagement spanning backend and/or frontend for one client in a single request. Creates one shared run, shares one Core-release ingestion phase, delegates the actual work to the backend/frontend upgrade agents as parallel sub-agents, then composes their results into one merged coverage check, one merged deployment handover, and one final report. Use when the user asks to upgrade both the backend and frontend together, or just wants "upgrade NGO Core for this client" without specifying a single track.
---

# NGO Core Upgrade Orchestrator

Use the existing shared-run coordinator, not another upgrade implementation.
Read [AGENTS.md](../../../AGENTS.md) for routing and
[orchestrator/AGENTS.md](../../../orchestrator/AGENTS.md) for the procedure.
Resolve links against the installed agent root when registered at user level.
Load track contracts only when delegating to those tracks. The public agent is
`ngo-core-upgrade`; this skill retains its existing discovery identity.

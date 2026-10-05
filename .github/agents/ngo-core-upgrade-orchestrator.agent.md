---
name: ngo-core-upgrade
description: Single entry point for an NGO Core upgrade engagement spanning backend and/or frontend. Creates one shared run, hands each track a normalized requirements seed, delegates the actual upgrade work to the ngo-core-backend-upgrade and ngo-core-frontend-upgrade agents as parallel sub-agents, then composes their results into one merged coverage check, one merged deployment handover, and one final report.
---

# NGO Core Upgrade

Read [AGENTS.md](../../AGENTS.md) for routing, then follow
[orchestrator/AGENTS.md](../../orchestrator/AGENTS.md) for the shared-run loop.
These contracts own input discovery, validated release reuse, delegation,
auto-mode boundaries, coverage, escalation and reporting. Do not re-derive them.
Resolve links against the installed agent root when running from a user profile.
Load only the requested track's contract and current applicable evidence.

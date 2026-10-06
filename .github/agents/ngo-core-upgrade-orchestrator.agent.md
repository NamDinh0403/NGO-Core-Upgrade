---
name: ngo-core-upgrade
description: Single NGO Core upgrade engine for backend and frontend. Owns one lifecycle, CoreChangeSet, planning, safety, memory, validation and report; dispatches specialized domain executors.
---

# NGO Core Upgrade

Read [AGENTS.md](../../AGENTS.md) for routing, then follow
[engine/AGENTS.md](../../engine/AGENTS.md) for the shared-run loop.
These contracts own input discovery, validated release reuse, delegation,
auto-mode boundaries, coverage, escalation and reporting. Do not re-derive them.
Resolve links against the installed agent root when running from a user profile.
Load only the requested track's contract and current applicable evidence.
Delegate only its verified track context and domain inputs. Core ensuring and
generic lifecycle belong to the shared owner; executors do not repeat ingestion.

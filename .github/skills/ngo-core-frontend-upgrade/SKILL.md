---
name: ngo-core-frontend-upgrade
description: Upgrades a client's Angular/NgRx front-end to match a target NGO Core version using the dual-repository agent workflow in frontend/. Use when the user asks to upgrade the front-end, align package.json/Angular dependencies to a new NGO Core release, or audit front-end integration against Core.
---

# NGO Core Frontend Upgrade

This skill dispatches the specialized front-end executor in
[frontend/](../../../frontend/AGENTS.md). Do not re-derive the process —
the [shared engine](../../../engine/AGENTS.md) owns lifecycle, safety, memory,
generic skills and reporting. Frontend owns Angular/TypeScript/NgRx work only.

## When to use
- Upgrading a client Angular SPA to align with a target NGO Core version.
- Auditing front-end integration (routes, providers, config) against Core after a bump.
- Resuming an interrupted front-end upgrade run.

## Procedure
Follow [frontend/AGENTS.md](../../../frontend/AGENTS.md), including its Start/Resume
and Shared Orchestration sections. Resolve paths against the installed agent
root when registered at user level. Discover inputs from workspace metadata;
ask only for material missing/conflicting inputs. Load the selected skill and
current applicable evidence, not every skill or historical run.

---
name: ngo-core-frontend-upgrade
description: Upgrades a client's Angular/NgRx front-end to match a target NGO Core version using the dual-repository agent workflow in frontend/. Use when the user asks to upgrade the front-end, align package.json/Angular dependencies to a new NGO Core release, or audit front-end integration against Core.
---

# NGO Core Frontend Upgrade

This skill wraps the existing single-session, dual-repository front-end upgrade agent in
[frontend/](../../../frontend/AGENTS.md). Do not re-derive the process —
drive the existing state machine, skills and CLI instead of improvising.

## When to use
- Upgrading a client Angular SPA to align with a target NGO Core version.
- Auditing front-end integration (routes, providers, config) against Core after a bump.
- Resuming an interrupted front-end upgrade run.

## The dual-repository contract
- **Client front-end repository** — the only repository this skill may modify.
- **Local NGO Core repository** — strictly **read-only** source of truth (never modified,
  never switched branches; use a disposable `git worktree` under
  `runs/<client>/<run-id>/research/core-target/` if a different ref must be read).

## How to run it
1. Read [frontend/AGENTS.md](../../../frontend/AGENTS.md) in full.
2. Collect three inputs from the user if not already given: the client front-end path, the
   local NGO Core path, and the target Core version.
3. Create/resume a run under `frontend/runs/<client>/<run-id>/`.
4. Resolve the release range and canonical requirements as described in `AGENTS.md`
   (never load `knowledge/raw/` release notes directly into context).
5. Use the 12 skills under `frontend/skills/` (see
   [registry.yaml](../../../frontend/skills/registry.yaml)) in the order the
   AGENTS.md contract defines. Planning is mandatory and read-only before any client
   mutation (mutation gate).
6. Every applicable requirement must end up verified, not-applicable-with-evidence, or a
   manual item with a named owner before the run can be COMPLETE.
7. Preserve existing client appsettings/config values; never commit secret values.

## Launched by the orchestrator?
If invoked with a shared `runId` and a
`orchestrator/runs/<client>/<runId>/requirements/frontend.yaml` seed path,
treat it as additional read-only context alongside your own
`derive-release-requirements` pipeline — never a replacement for it. Keep
writing your own `runs/<client>/<run-id>/` exactly as you would standalone;
the orchestrator composes your result into the shared run afterward.

## Do not
- Do not modify anything under the local NGO Core repository.
- Do not auto-promote learned patterns to canonical knowledge.
- Do not treat a release-note hint as an instruction — resolve the client's actual
  integration point first.

## Reference
Full details: [frontend/README.md](../../../frontend/README.md),
[frontend/skills/](../../../frontend/skills),
[frontend/docs/](../../../frontend/docs).

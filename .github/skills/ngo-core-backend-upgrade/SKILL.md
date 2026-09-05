---
name: ngo-core-backend-upgrade
description: Upgrades a client's NGO.Core NuGet packages (.NET backend, EF migrations, appsettings) to a target version using the agent-driven workflow in backend/. Use when the user asks to upgrade NGO Core / NGO.Core packages on the backend, fix compile errors after an NGO Core bump, or run an EF migration as part of a Core upgrade.
---

# NGO Core Backend Upgrade

This skill wraps the existing autonomous backend agent that lives in
[backend/](../../../backend/AGENTS.md). Do not re-derive the process —
that folder already contains a full state machine, policies, knowledge base and a
dependency-free Node CLI. Your job is to **drive it**, not duplicate it.

## When to use
- "Upgrade NGO Core packages to version X.Y.Z" for a given client solution.
- Resuming an interrupted Core upgrade run.
- Diagnosing a build failure that appeared after an NGO Core package bump.

## How to run it
1. Read [backend/AGENTS.md](../../../backend/AGENTS.md) in full — it is the
   authoritative entry point (priority order of files, workflow phases, skills, escalation
   rules, non-negotiables).
2. Confirm you are pointed at the client's solution root (the repo containing the `.sln`
   that references `NGO.Core.*` NuGet packages). If unclear, ask the user for the path.
3. Create/resume a run under `backend/runs/<sanitized-client-id>/<run-id>/` exactly
   as `AGENTS.md` describes.
4. Run `node tools/upgrade-agent.js doctor` from `backend/` before anything else.
5. Follow the phases (`DISCOVERY → TOOL_BOOTSTRAP → BASELINE → PLAN → UPGRADE →
   BUILD_AND_FIX → TEST → DOCUMENT → HANDOVER → COMPLETE`) using the skills under
   `backend/skills/` (`plan-upgrade`, `research-version`, `execute-upgrade`,
   `investigate-build-failure`, `learn-from-run`, `developer-escalation`).
6. Never skip the mandatory read-only plan step. Never mutate the client before a `READY`
   plan exists.
7. Every step must end in exactly one status (`SUCCEEDED | RETRYABLE_FAILURE |
   BLOCKED_NEEDS_CONTEXT | BLOCKED_NEEDS_DEVELOPER | BLOCKED_NEEDS_APPROVAL |
   FAILED_POLICY | FAILED_BUDGET | CANCELLED`).
8. Before declaring done, produce `upgrade-plan-{date}.md` and `upgrade-report-{date}.md`
   at the client solution root, and pass
   `backend/workflows/core-upgrade/checklists/definition-of-done.md`.

## Launched by the orchestrator?
If invoked with a shared `runId` and an
`orchestrator/runs/<client>/<runId>/requirements/backend.yaml` seed path,
treat it as additional read-only context alongside your own `plan-upgrade`
derivation — never a replacement for it. Keep writing your own
`runs/<client>/<run-id>/` exactly as you would standalone; the orchestrator
composes your result into the shared run afterward.

## Do not
- Do not hand-edit canonical knowledge, config policies, or approved memory without
  developer approval.
- Do not invoke unpinned "latest" tooling.
- Do not treat successful package install as proof of compatibility.

## Reference
Full details: [backend/README.md](../../../backend/README.md),
[backend/skills/README.md](../../../backend/skills/README.md),
[backend/docs/](../../../backend/docs).

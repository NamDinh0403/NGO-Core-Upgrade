---
name: ngo-core-backend-upgrade
description: Upgrades a client's NGO.Core NuGet packages (.NET backend, EF migrations, appsettings) to a target version using the agent-driven workflow in Backend-Upgrade/. Use when the user asks to upgrade NGO Core / NGO.Core packages on the backend, fix compile errors after an NGO Core bump, or run an EF migration as part of a Core upgrade.
---

# NGO Core Backend Upgrade

This skill wraps the existing autonomous backend-upgrade agent that lives in
[Backend-Upgrade/](../../../Backend-Upgrade/AGENTS.md). Do not re-derive the process —
that folder already contains a full state machine, policies, knowledge base and a
dependency-free Node CLI. Your job is to **drive it**, not duplicate it.

## When to use
- "Upgrade NGO Core packages to version X.Y.Z" for a given client solution.
- Resuming an interrupted Core upgrade run.
- Diagnosing a build failure that appeared after an NGO Core package bump.

## How to run it
1. Read [Backend-Upgrade/AGENTS.md](../../../Backend-Upgrade/AGENTS.md) in full — it is the
   authoritative entry point (priority order of files, workflow phases, skills, escalation
   rules, non-negotiables).
2. Confirm you are pointed at the client's solution root (the repo containing the `.sln`
   that references `NGO.Core.*` NuGet packages). If unclear, ask the user for the path.
3. Create/resume a run under `Backend-Upgrade/runs/<sanitized-client-id>/<run-id>/` exactly
   as `AGENTS.md` describes.
4. Run `node tools/upgrade-agent.js doctor` from `Backend-Upgrade/` before anything else.
5. Follow the phases (`DISCOVERY → TOOL_BOOTSTRAP → BASELINE → PLAN → UPGRADE →
   BUILD_AND_FIX → TEST → DOCUMENT → HANDOVER → COMPLETE`) using the skills under
   `Backend-Upgrade/skills/` (`plan-upgrade`, `research-version`, `execute-upgrade`,
   `investigate-build-failure`, `learn-from-run`, `developer-escalation`).
6. Never skip the mandatory read-only plan step. Never mutate the client before a `READY`
   plan exists.
7. Every step must end in exactly one status (`SUCCEEDED | RETRYABLE_FAILURE |
   BLOCKED_NEEDS_CONTEXT | BLOCKED_NEEDS_DEVELOPER | BLOCKED_NEEDS_APPROVAL |
   FAILED_POLICY | FAILED_BUDGET | CANCELLED`).
8. Before declaring done, produce `upgrade-plan-{date}.md` and `upgrade-report-{date}.md`
   at the client solution root, and pass
   `Backend-Upgrade/workflows/core-upgrade/checklists/definition-of-done.md`.

## Do not
- Do not hand-edit canonical knowledge, config policies, or approved memory without
  developer approval.
- Do not invoke unpinned "latest" tooling.
- Do not treat successful package install as proof of compatibility.

## Reference
Full details: [Backend-Upgrade/README.md](../../../Backend-Upgrade/README.md),
[Backend-Upgrade/skills/README.md](../../../Backend-Upgrade/skills/README.md),
[Backend-Upgrade/docs/](../../../Backend-Upgrade/docs).

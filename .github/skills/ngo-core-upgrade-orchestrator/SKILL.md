---
name: ngo-core-upgrade-orchestrator
description: Runs a full NGO Core upgrade engagement spanning backend and/or frontend for one client in a single request. Creates one shared run, shares one Core-release ingestion phase, delegates the actual work to the backend/frontend upgrade agents as parallel sub-agents, then composes their results into one merged coverage check, one merged deployment handover, and one final report. Use when the user asks to upgrade both the backend and frontend together, or just wants "upgrade NGO Core for this client" without specifying a single track.
---

# NGO Core Upgrade Orchestrator

Use the existing shared-run coordinator, not another upgrade implementation.
Read [AGENTS.md](../../../AGENTS.md) for routing and
[engine/AGENTS.md](../../../engine/AGENTS.md) for the procedure.
Resolve links against the installed agent root when registered at user level.
Load track contracts only when delegating to those tracks. The public agent is
`ngo-core-upgrade`; this skill retains its existing discovery identity.
The shared lifecycle is [engine/skills/lifecycle/SKILL.md](../../../engine/skills/lifecycle/SKILL.md).
Pass one isolated track context per delegation, not the complete shared run.

## Workflow Execution Steps
1. **Prompt for Inputs**: Prompt the user to provide local `ngo-online-core` path, client project path, and target version if not given. Never guess paths.
2. **Preflight**: Execute `node tools/check-environment.js --core-path "<corePath>" --client-path "<clientPath>" --target "<targetVersion>"`. Verify git author identity, core git tags, and build tools.
3. **Engine Run**: Run `node engine/tools/upgrade-engine.js create-run ...` deterministically. Never mutate upgrade agent scripts. Never search for git branches.
4. **Parallel Execution**: Execute backend and frontend upgrade tracks concurrently in parallel. Never run them sequentially or wait for backend to finish before starting frontend. Run `dotnet restore`/`dotnet build` and `npm install`/`npm run build` in parallel background executions.
5. **Verification Gate & Report**: Await both parallel tracks. Ensure both backend and frontend report 0 build errors. Notify the user with a structured completion summary when done.

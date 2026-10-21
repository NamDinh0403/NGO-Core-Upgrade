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
1. **Gather Inputs**: Check if the user provided local `ngo-online-core` path, client project path, and target version. Ask once if any are missing. Never guess paths.
2. **Auto-Save Config & Run 8-Stage Preflight**: Execute `node tools/check-environment.js --core-path "<corePath>" --client-path "<clientPath>" --target "<targetVersion>" --save-settings`. This automatically updates `platform/config/settings.json` and verifies tools, Git identity, GitHub auth, Core `releases/*` branches & package metadata (Git tags are not required), NuGet/Azure Artifacts feed auth, and `.npmrc` auth.
3. **Interactive Guided Setup (If Blocked)**: If `check-environment.js` reports any missing config or auth (e.g. missing Git identity, outdated remote `releases/*` branches, `401` on NuGet feed, or unauthenticated `.npmrc`), automatically run safe fixes (such as `git -C "<corePath>" fetch --all`) or guide the user step-by-step through the exact login command (`dotnet restore --interactive`, `gh auth login`, `npx vsts-npm-auth -config .npmrc`), re-running `check-environment.js` until status is `READY TO UPGRADE`.
4. **Engine Run & Parallel Execution**: Once preflight is `READY TO UPGRADE`, immediately run `node engine/tools/upgrade-engine.js create-run ...` and execute backend and frontend upgrade tracks concurrently in parallel (`dotnet restore`/`dotnet build` and `npm ci` or `npm install`/`npm run build`). Never mutate upgrade agent scripts or switch branches in Core.
5. **Verification Gate & Report**: Await both parallel tracks, verify 0 build errors on both backend and frontend, and present the structured completion summary.

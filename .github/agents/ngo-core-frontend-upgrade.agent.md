---
description: Runs an autonomous NGO Core front-end upgrade (Angular/NgRx) for a client repository, reading a local NGO Core checkout read-only, following the frontend agent workflow end to end.
---

# NGO Core Frontend Upgrade Agent

Your authoritative contract is [frontend/AGENTS.md](../../frontend/AGENTS.md) —
read it first. It defines the release-knowledge model, the dual-repository
rules, the skill pipeline and the mutation gate; do not re-derive them.
Workspace-level routing lives in the root [AGENTS.md](../../AGENTS.md).

## Your loop
1. Ask only for what's missing: client front-end path, local NGO Core path,
   target Core version.
2. Honour the dual-repository contract — the client front-end is the **only**
   repository you may modify; the local NGO Core checkout is strictly read-only.
3. Create or resume a run under `frontend/runs/<client>/<run-id>/`.
4. Resolve the applicable release range, then work the skills in
   `frontend/skills/` (see `registry.yaml`) in the contract's order — plan first
   (read-only), then apply through the mutation gate.
5. Every applicable requirement ends verified, not-applicable-with-evidence, or
   handed over with a named owner before the run is COMPLETE.

## Shared ingest (don't redo it)
`ingest-core-release` is **not** user-invoked — it fires automatically after
`resolve-target-packages` when a version in range lacks canonical release
knowledge, delegating to the shared `../ingest/tools/ingest.js` (reusing the
Core path you already collected). If the orchestrator launched you, that phase
has already run: check `../ingest/knowledge/candidates/releases/<version>.json`
before invoking it again.

## Guardrails
- Never write to the local NGO Core repository; use a disposable `git worktree`
  under `runs/<client>/<run-id>/research/core-target/` for a different Core ref.
- Preserve existing client appsettings/config values; never commit secret
  values — use the secret provider.
- Learned patterns are candidates only: never auto-promoted to canonical, never
  shared across clients.

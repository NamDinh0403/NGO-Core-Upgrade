---
name: ngo-core-frontend-upgrade
description: Frontend domain executor for the shared NGO Core engine; implements Angular, TypeScript and NgRx alignment with exact dependency, host-app and build/integration evidence.
---

# NGO Core Frontend Upgrade Agent

Your authoritative contract is [frontend/AGENTS.md](../../frontend/AGENTS.md) —
read it first. It defines the release-knowledge model, the dual-repository
rules and domain implementation; the engine owns lifecycle, safety and reporting.
Workspace-level routing lives in the root [AGENTS.md](../../AGENTS.md).

## Protocol & Guardrails
1. **Inputs**: Confirm client web app directory, core repository path, and target version with user. Never use hardcoded paths.
2. **Environment & Git Auth**: Verify coworker's git identity (`git config user.name`, `git config user.email`), clean git tree, and core tags (`v<source>`, `v<target>`). Core is strictly READ-ONLY.
3. **No Self-Mutation**: NEVER edit or mutate files in `NGO Core Upgrade/`.
4. **Restore & Build**: Run `npm install` (or `npm ci`) and `npm run build` (or `ng build`). Verify 0 errors.
5. **Notification**: Summarize completed npm package updates and template/component build verification (0 errors) when done.

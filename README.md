# NGO Core Upgrade Workspace

> **Last Updated:** August 2026
> **Execution:** Agent-driven, with a dependency-free Node CLI per track

AI-agent-driven workflow for upgrading NGO Core packages (backend) and the Angular SPA (frontend) for any NGO client project.

---

## Two Tracks

| Track | Folder | Entry point | How to start |
|-------|--------|-------------|---------------|
| **Backend** — NGO.Core NuGet packages, .NET, EF migrations | [Backend-Upgrade/](Backend-Upgrade/README.md) | [Backend-Upgrade/AGENTS.md](Backend-Upgrade/AGENTS.md) | Attach `Backend-Upgrade/AGENTS.md` as context and send `Upgrade NGO Core packages to version X.Y.Z`. The agent does the rest. |
| **Frontend** — Angular, NgRx, package.json, templates | [Frontend-Upgrade/](Frontend-Upgrade/README.md) | [Frontend-Upgrade/AGENTS.md](Frontend-Upgrade/AGENTS.md) | Attach `Frontend-Upgrade/AGENTS.md` as context and send the upgrade prompt with the client path, Core path, and target version. |

**You attach the track's `AGENTS.md` and send one prompt — the agent drives everything from there.** It reads the workflow state machine, calls its own tooling (the Node CLI under `tools/`), enforces the policies in `config/`, and persists durable per-run state under `runs/<client>/<run-id>/`. You do not run any commands by hand. The two tracks are independent; a typical full client upgrade runs the Backend track first, verifies the build, then runs the Frontend track.

---

## Use It as a Real Agent (Skills + Custom Agents)

This workspace is also packaged as portable, discoverable **GitHub Copilot Agent Skills**
and **custom agents**, so teammates don't need to manually attach `AGENTS.md` files or
craft prompts — Copilot discovers and offers them automatically.

```
.github/
├── skills/
│   ├── ngo-core-backend-upgrade/SKILL.md    Discoverable skill wrapping Backend-Upgrade
│   └── ngo-core-frontend-upgrade/SKILL.md   Discoverable skill wrapping Frontend-Upgrade
└── agents/
    ├── ngo-core-backend-upgrade.agent.md    Chat persona for the backend track
    └── ngo-core-frontend-upgrade.agent.md   Chat persona for the frontend track
```

- **Skills** (`.github/skills/`) are auto-loaded by Copilot (VS Code, Copilot CLI, Copilot
  cloud agent) whenever a request matches their `description` — e.g. asking to "upgrade
  NGO Core packages to 9.2.1" is enough; no manual context attachment needed. This follows
  the open [Agent Skills standard](https://agentskills.io), so it also works in the
  Copilot CLI and cloud agent, not just VS Code.
- **Custom agents** (`.github/agents/*.agent.md`) show up in VS Code's agent picker as
  `NGO Core Backend Upgrade Agent` / `NGO Core Frontend Upgrade Agent`. Selecting one
  switches Copilot Chat into that persona with the right instructions pre-loaded — a
  colleague just opens the workspace, picks the agent from the dropdown, and types the
  upgrade request.
- Both simply drive the existing `Backend-Upgrade/AGENTS.md` and
  `Frontend-Upgrade/AGENTS.md` machinery — no logic was duplicated, so the CLI/workflow/
  skills registry stay the single source of truth.

### How a teammate uses it (no setup beyond opening the repo)
1. Open this workspace folder in VS Code with the GitHub Copilot extension enabled.
2. Open Copilot Chat, agent mode. Either:
   - Pick **NGO Core Backend Upgrade Agent** or **NGO Core Frontend Upgrade Agent** from
     the agent/mode picker, or
   - Just type a natural request (e.g. `Upgrade NGO Core packages to 9.2.1 for
     <client>`) — Copilot will auto-discover the matching skill under `.github/skills/`.
3. Answer any clarifying questions the agent asks (client path, Core path, target
   version) and let it run. Progress and results land under `Backend-Upgrade/runs/` or
   `Frontend-Upgrade/runs/` as before.

---

## Importing This Agent Onto Another Computer

The whole agent is just files in this Git repository plus Node 14+ (for the CLIs) — there
is no server, install step, or license to configure. To set it up on another machine:

1. **Clone the repository** onto the new machine:
   ```powershell
   git clone <this-repo-url> "NGO Core Upgrade"
   cd "NGO Core Upgrade"
   ```
   If you don't have it in a remote yet, first push it: `git remote add origin <url>` then
   `git push -u origin master` from this machine.
2. **Install Node.js 14+** (only dependency; both CLIs are dependency-free — no `npm
   install` needed).
3. **Open the cloned folder in VS Code** with the GitHub Copilot extension signed in to an
   account with Copilot access.
4. **Verify discovery**: open Copilot Chat → agent mode → confirm
   `NGO Core Backend Upgrade Agent` / `NGO Core Frontend Upgrade Agent` appear in the
   agent picker, and that `.github/skills/*/SKILL.md` are picked up (Command Palette →
   **Chat: Open Customizations** → Skills tab should list both).
5. **Sanity-check the tooling** from each track's folder:
   ```powershell
   cd Backend-Upgrade;  node tools/validate.js;  node tools/run-evals.js
   cd ../Frontend-Upgrade; node tools/validate.js; node tools/repo-layout.test.js
   ```
6. Start a run exactly as described above — no further configuration required. All
   per-run state (`runs/<client>/<run-id>/`) is local to whichever machine runs the
   upgrade; nothing needs to sync between machines unless you want to hand off an
   in-progress run (in which case, copy that specific `runs/<client>/<run-id>/` folder
   across).

> Optional: for user-level (cross-workspace) reuse instead of project-level, copy
> `.github/agents/*.agent.md` to `~/.copilot/agents/` and `.github/skills/*` to
> `~/.copilot/skills/` on the target machine. Project-level (checked into this repo) is
> recommended so the whole team gets the same versioned setup automatically via `git
> clone`/`git pull`.

---

## Start Here

### Backend track
1. **Open** the client solution in an agent-capable editor (VS Code + Copilot Chat agent mode).
2. **Attach** [Backend-Upgrade/AGENTS.md](Backend-Upgrade/AGENTS.md) as context and **send** the prompt: `Upgrade NGO Core packages to version X.Y.Z`.
3. **Walk away.** The agent bootstraps its own tooling, writes a plan before touching code, upgrades packages/config, fixes every compiler error against the installed DLL, runs tests + EF migrations, and writes the report — calling the Node CLI under `tools/` itself. You do not run any commands.
4. **Read the plan, then the report** — the run writes an `upgrade-plan-{date}.md` before any change and an `upgrade-report-{date}.md` before it finishes, both at the solution root. The terminal status lives in `Backend-Upgrade/runs/<client>/<run-id>/state.json`.

### Frontend track
1. **Attach** [Frontend-Upgrade/AGENTS.md](Frontend-Upgrade/AGENTS.md) as context and **send** the upgrade prompt with the client front-end path, the local NGO Core path, and the target version.
2. **Walk away.** One agent run inspects **both** repositories at once. The **client is the only repository modified**; the local NGO Core is a strictly **read-only** source of truth. The agent resolves exact target dependency versions from Core, derives the semantic integration requirements, maps them to the actual client, plans every change with evidence, and — behind a mutation gate — applies changes to the client. State lands under `Frontend-Upgrade/runs/<client>/<run-id>/`.

> **Under the hood (you don't run these).** Each track ships a dependency-free Node CLI (`tools/upgrade-agent.js` backend, `tools/frontend-upgrade-agent.js` frontend) with `doctor` / `plan` / `run` / `resume` / `status` commands. The agent invokes them for you; they are documented here only as a developer reference and for manual troubleshooting. See each track's README for the exact commands.

---

## Workspace Layout

```
NGO Core Upgrade/
├── README.md                       This file
├── compiler-error-fix-loop.png     Diagram of the build-fix loop
│
├── Backend-Upgrade/                Backend agent workflow + knowledge
│   ├── AGENTS.md                   The agent entry point (routes through the state machine)
│   ├── README.md                   Human orientation + flow
│   ├── config/                     Machine-enforced policies (gates, escalation, retention, tools, layout)
│   ├── workflows/core-upgrade/     Versioned state machine (workflow.yaml + phases + checklists)
│   ├── knowledge/                  index/ · canonical/ · derived/ (routing + version/error/symbol records)
│   ├── memory/                     episodes → candidates → approved → rejected (learning lifecycle)
│   ├── skills/                     Bounded agent procedures + registry
│   ├── runs/                       Durable per-run state, checkpoints, artifacts (client + _bootstrap)
│   ├── schemas/                    JSON schemas for every machine record
│   ├── templates/                  plan / report / escalation / learned-pattern / state seeds
│   ├── evals/                      Regression cases, simulated runs, scoring
│   ├── tools/                      upgrade-agent CLI, validate.js, run-evals.js, bootstrap engine, wrappers
│   └── docs/                       architecture / operations / refactor
│
└── Frontend-Upgrade/               Single-session, dual-repository Angular / NGO Core agent
    ├── AGENTS.md                   Agent contract (release-knowledge + dual-repository rules)
    ├── README.md                   Overview + quick start (frontend-upgrade-agent start)
    ├── config/                     agent / escalation / quality-gate / package-alignment / safety / layout
    ├── knowledge/                  Canonical release requirements · migrations · appsettings · manifest
    ├── schemas/                    draft-07 schemas (requests, state, reports, skill IO)
    ├── skills/                     12 skills (SKILL.md + IO schemas + evals) + registry.yaml
    ├── templates/                  plan / report templates
    ├── tests/                      Dependency-free deterministic tests + fixtures
    ├── tools/                      CLI (frontend-upgrade-agent) + lib/ engine
    ├── runs/                       Durable per-run state, evidence, checkpoints, artifacts
    └── docs/                       architecture / operations / refactor
```

---

## Runs & Learning

Every run is isolated under `runs/<client>/<run-id>/` in each track (state, checkpoints, evidence, artifacts). Reusable lessons flow through a learning lifecycle — raw episodes become candidate patterns that are never applied as authoritative until they pass validation and developer approval (`Backend-Upgrade/memory/`). Client data is scoped and redacted per each track's retention policy; there is no shared per-client case-study folder.

---

## Tests & Validation

For maintainers of this workspace (not part of a client upgrade run). Each track ships dependency-free Node tests (Node 14+, run offline):

```
# Backend-Upgrade/
node tools/validate.js
node tools/run-evals.js
node tools/repo-layout.test.js

# Frontend-Upgrade/
node tools/validate.js
node tools/repo-layout.test.js
node tools/skills.test.js
node tests/run.js
```

# NGO Core Upgrade Workspace

> **Last Updated:** September 2026
> **Execution:** Agent-driven, with a dependency-free Node CLI per track

AI-agent-driven workflow for upgrading NGO Core packages (backend) and the Angular SPA (frontend) for any NGO client project.

---

## One Entry Point, Two Sub-Agents, One Shared Ingestion Phase

**Start here: [`AGENTS.md`](AGENTS.md).** It is the single entry point — a short
routing table that says which contract to load for a given request, plus the shared
ingest phase and the non-negotiables. An agent reads that one small file instead of
discovering the structure by exploration.

**Recommended way to run it:** say `Upgrade NGO Core for <client> to <version>`
(backend, frontend, or both). The **ngo-core-upgrade** custom agent discovers local inputs,
asks only for actual gaps, and collects the inputs
once, creates one shared run (running the shared [ingest/](ingest/README.md) phase
internally), then delegates the real work to the backend and/or frontend sub-agent **in
parallel**, and composes their results into one merged coverage check, one merged
deployment handover, and one final report — see [`orchestrator/README.md`](orchestrator/README.md).
You no longer run two separate agents by hand, neither one re-derives Core's release
history independently, and you no longer have to reconcile two disconnected reports by
hand.

| | Folder | Contract | How to start |
|-------|--------|-------------|---------------|
| **Orchestrator** — single entry point, either/both tracks | [orchestrator/](orchestrator/README.md) | [AGENTS.md](AGENTS.md) + [orchestrator/AGENTS.md](orchestrator/AGENTS.md) | Say `Upgrade NGO Core for <client> to X.Y.Z`. Delegates to the two sub-agents below. |
| **Shared ingest** — read-only Core release ingestion | [ingest/](ingest/README.md) | [ingest/README.md](ingest/README.md) | `node ingest/tools/ingest.js check --core-path <path>` |
| **Backend** — NGO.Core NuGet, .NET, EF migrations | [backend/](backend/README.md) | [backend/AGENTS.md](backend/AGENTS.md) | Backend-only: pick the backend agent, or load `backend/AGENTS.md`. |
| **Frontend** — Angular, NgRx, package.json, templates | [frontend/](frontend/README.md) | [frontend/AGENTS.md](frontend/AGENTS.md) | Frontend-only: pick the frontend agent, or load `frontend/AGENTS.md`. |

Each track still works standalone — its `AGENTS.md` remains the authoritative contract
for that track. The orchestrator adds routing, one shared run, and cross-track merging;
it is not a replacement for either track.

**You send one prompt — the agent(s) drive everything from there.** They read the
workflow state machine, call their own tooling (the Node CLI under `tools/`), enforce the
policies in `config/`, and persist durable per-run state under `runs/<client>/<run-id>/`.
You do not run any commands by hand.

---

## Use It as a Real Agent (Skills + Custom Agents)

This workspace is also packaged as portable, discoverable **GitHub Copilot Agent Skills**
and **custom agents**, so teammates don't need to manually attach `AGENTS.md` files or
craft prompts — Copilot discovers and offers them automatically.

```
.github/
├── skills/
│   ├── ngo-core-upgrade-orchestrator/SKILL.md   Discoverable skill wrapping the orchestrator
│   ├── ngo-core-backend-upgrade/SKILL.md        Discoverable skill wrapping backend
│   └── ngo-core-frontend-upgrade/SKILL.md       Discoverable skill wrapping frontend
└── agents/
    ├── ngo-core-upgrade-orchestrator.agent.md    Chat persona: single entry point, delegates to both
    ├── ngo-core-backend-upgrade.agent.md         Chat persona for the backend track
    └── ngo-core-frontend-upgrade.agent.md        Chat persona for the frontend track
```

- **Skills** (`.github/skills/`) are auto-loaded by Copilot (VS Code, Copilot CLI, Copilot
  cloud agent) whenever a request matches their `description` — e.g. asking to "upgrade
  NGO Core packages to 9.2.1" is enough; no manual context attachment needed. This follows
  the open [Agent Skills standard](https://agentskills.io), so it also works in the
  Copilot CLI and cloud agent, not just VS Code. A request that doesn't specify a single
  track (e.g. "upgrade NGO Core for Acme to 9.2.1") matches the orchestrator skill, which
  fans out to both track skills as sub-agents; a request that clearly names one track
  matches that track's skill directly.
- **Custom agents** (`.github/agents/*.agent.md`) show up in VS Code's agent picker as
   `ngo-core-upgrade` / `NGO Core Backend Upgrade Agent` / `NGO Core Frontend
  Upgrade Agent`. Selecting one switches Copilot Chat into that persona with the right
  instructions pre-loaded — a colleague just opens the workspace, picks the agent from the
  dropdown, and types the upgrade request.
- All three simply drive the existing `ingest/`, `orchestrator/`, `backend/AGENTS.md`, and
  `frontend/AGENTS.md` machinery — no logic was duplicated, so the CLI/workflow/
  skills registry stay the single source of truth. The orchestrator persona/skill adds
  routing, one shared run, and cross-track merging; it does not re-implement either track.


### How a teammate uses it (no setup beyond opening the repo)

> **Where this lives.** This agent is published inside the NGO Core repository at
> `ngo-api-core/NGO/Core Upgrade/`. A teammate who already has `ngo-online-core` cloned
> gets it with a `git pull` — there is nothing else to download. Paths in this README are
> relative to that `Core Upgrade/` folder; open **that** folder (not the Core repo root)
> as the agent's workspace folder so `.github/skills/` and `.github/agents/` are
> discovered. Alternatively, run [`install.ps1`](install.ps1) / [`install.sh`](install.sh)
> once to register the skills and agents into your Copilot user profile, after which they
> work from any workspace.

1. Open this `Core Upgrade/` folder in VS Code with the GitHub Copilot extension enabled.
   To upgrade a specific client, open **both** this folder and the client solution in one
   window — copy the [`ngo-core-upgrade.code-workspace`](ngo-core-upgrade.code-workspace)
   template, point its second folder at your client solution, and open it (see the
   two-folder model in [IMPORT.md](IMPORT.md)).
2. Open Copilot Chat, agent mode. Either:
   - Pick **ngo-core-upgrade** from the agent/mode picker for a full
     engagement (backend, frontend, or both — you choose when asked), or
   - Pick **NGO Core Backend Upgrade Agent** / **NGO Core Frontend Upgrade Agent**
     directly for a single-track run, or
   - Just type a natural request (e.g. `Upgrade NGO Core packages to 9.2.1 for
     <client>`) — Copilot auto-discovers the matching skill under `.github/skills/`
     (the orchestrator skill if no single track is named, a track skill otherwise).
3. Answer any clarifying questions the agent asks (client path(s), Core path, target
   version) and let it run. Progress and results land under `backend/runs/`
   and/or `frontend/runs/` as before; the shared run (normalized requirements, merged
   coverage, merged deployment handover, final report) lands under
   `orchestrator/runs/<client>/<run-id>/`; shared Core-release knowledge lands under
   `ingest/knowledge/candidates/releases/`.

---

## Importing This Agent Onto Another Computer

> **Quick reference:** see [IMPORT.md](IMPORT.md) for the condensed step-by-step. Fastest
> path is the **one-command installer** — [`install.ps1`](install.ps1) (Windows) or
> [`install.sh`](install.sh) (macOS/Linux) — which clones the repo and registers the
> skills + agents into your Copilot user profile so they work in every workspace. To move
> it without a Git host, run [`package-agent.ps1`](package-agent.ps1) to build a portable
> zip. Uninstall with [`uninstall.ps1`](uninstall.ps1) / [`uninstall.sh`](uninstall.sh).

The whole agent is just files in this Git repository plus Node 14+ (for the CLIs) — there
is no server, install step, or license to configure. To set it up on another machine:

1. **Get the files.** They ship inside the NGO Core repository — clone it and use the
   nested folder:
   ```powershell
   git clone <ngo-online-core-url>
   cd "ngo-online-core/ngo-api-core/NGO/Core Upgrade"
   ```
   (If you instead keep a standalone clone of this agent, the remaining steps are
   identical.)
2. **Install Node.js 14+** (only dependency; all CLIs are dependency-free — no `npm
   install` needed). Node 14+ covers the agent framework and its test suites. A
   **frontend** upgrade run additionally installs an isolated Angular CLI/TypeScript
   matching the *client's* declared versions, so your Node version must satisfy that
   Angular release's engine range (e.g. Angular 17 needs Node 18+, Angular 20+ needs
   Node 22+). The agent reports `INSTALLATION_BLOCKED` instead of installing a
   mismatched toolchain.
3. **Open the cloned folder in VS Code** with the GitHub Copilot extension signed in to an
   account with Copilot access.
4. **Verify discovery**: open Copilot Chat → agent mode → confirm
   `ngo-core-upgrade` / `NGO Core Backend Upgrade Agent` / `NGO Core
   Frontend Upgrade Agent` appear in the agent picker, and that `.github/skills/*/SKILL.md`
   are picked up (Command Palette → **Chat: Open Customizations** → Skills tab should
   list all three).
5. **Sanity-check the tooling** with the single validation entry point:
   ```powershell
   node tools/validate-all.js
   ```
   It runs every suite in `ingest/`, `orchestrator/`, `backend/` and `frontend/` and
   fails if any suite fails or modifies a tracked file. See
   [Tests & Validation](#tests--validation) for the per-suite breakdown.
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

### Orchestrated (recommended for a full client engagement)
1. **Open** the client solution/workspace(s) in an agent-capable editor.
2. **Pick** `ngo-core-upgrade` from the agent picker (or just say
   `Upgrade NGO Core for <client> to X.Y.Z`).
3. **Answer once**: which track(s) (backend/frontend/both), each client path, the local
   NGO.Core repo path, the shared `release-notes.md` path (optional), and the target
   version.
4. **Walk away.** The orchestrator runs the shared [ingest/](ingest/README.md)
   phase once, then launches the requested track(s) as sub-agents (in parallel when both
   are requested) and reports one combined result — plan/report links and terminal status
   for each track.

### Backend track (standalone)
1. **Open** the client solution in an agent-capable editor (VS Code + Copilot Chat agent mode).
2. **Attach** [backend/AGENTS.md](backend/AGENTS.md) as context and **send** the prompt: `Upgrade NGO Core packages to version X.Y.Z`.
3. **Walk away.** The agent bootstraps its own tooling, writes a plan before touching code, upgrades packages/config, fixes every compiler error against the installed DLL, runs tests + EF migrations, and writes the report — calling the Node CLI under `tools/` itself. You do not run any commands.
4. **Read the plan, then the report** — the run writes an `upgrade-plan-{date}.md` before any change and an `upgrade-report-{date}.md` before it finishes, both at the solution root. The terminal status lives in `backend/runs/<client>/<run-id>/state.json`.
5. **Optional — reduce manual version-knowledge upkeep.** If you have a local, read-only clone of the NGO.Core source repo, pass its path as `coreRepoPath` (and, if you have one, the shared `release-notes.md` as `coreReleaseNotesPath`) — see [ingest/config/core-repository.yaml](ingest/config/core-repository.yaml). When the target version isn't yet in `knowledge/canonical/versions/`, the agent derives **candidate** knowledge via the shared [ingest](ingest/README.md) phase (`skills/ingest-core-release`) instead of stopping at a "please provide version info" escalation. A developer still reviews the candidate before it becomes canonical. Check for newer releases anytime with `node ingest/tools/ingest.js check --core-path <path>`.

### Frontend track (standalone)
1. **Attach** [frontend/AGENTS.md](frontend/AGENTS.md) as context and **send** the upgrade prompt with the client front-end path, the local NGO Core path, and the target version.
2. **Walk away.** One agent run inspects **both** repositories at once. The **client is the only repository modified**; the local NGO Core is a strictly **read-only** source of truth. The agent resolves exact target dependency versions from Core, derives the semantic integration requirements, maps them to the actual client, plans every change with evidence, and — behind a mutation gate — applies changes to the client. State lands under `frontend/runs/<client>/<run-id>/`.
3. **Same version-knowledge automation as Backend, same shared source.** `skills/ingest-core-release` delegates to the shared [ingest](ingest/README.md) phase whenever `knowledge/canonical/releases/<version>/` is missing for a version in range — again gated behind developer review, never auto-promoted, and never re-diffed twice if Backend already ingested the same version.


> **Under the hood (you don't run these).** Each track ships a dependency-free Node CLI (`tools/upgrade-agent.js` backend, `tools/frontend-upgrade-agent.js` frontend) with `doctor` / `plan` / `run` / `resume` / `status` commands, plus the shared `ingest/tools/ingest.js` (`check` / `ingest`). The agent(s) invoke them for you; they are documented here only as a developer reference and for manual troubleshooting. See each track's README for the exact commands.

---

## Workspace Layout

```
NGO Core Upgrade/                   The agent home. Root AGENTS.md is the single entry point.
├── AGENTS.md                       ← START HERE. Routing table + shared ingest phase + non-negotiables.
├── README.md                       This file (human orientation)
│
├── ingest/                         Shared Core-release ingestion — run ONCE per version, feeds both tracks
│   ├── README.md                   Why this exists + record shape
│   ├── config/core-repository.yaml Core repo path / tag convention / release-notes location
│   ├── schemas/                    release-finding.schema.json, ingested-release.schema.json
│   ├── tools/                      ingest.js CLI (check/ingest) + lib/ (git, notes, classify) + tests
│   └── knowledge/candidates/       releases/<version>.json — ONE shared candidate record per version
│
├── orchestrator/                   Shared cross-track coordination — one run, merged coverage, merged handover
│   ├── AGENTS.md                   Contract (what it owns vs. what stays with each track)
│   ├── config/artifact-ownership.yaml  Write-boundary matrix
│   ├── schemas/                    run-request, shared-run-state, requirement-coverage, missing-steps, deployment-checklist
│   ├── templates/                  before/after-deployment.md, final-report.md
│   ├── tools/                      orchestrator.js CLI (create-run/compose-results/verify-coverage/prepare-handover/final-report) + lib/
│   ├── tests/                      orchestrator.test.js
│   └── runs/                       Durable per-engagement shared state (git-ignored)
│
├── backend/                        Sub-agent: .NET / NuGet / EF migrations / appsettings
│   ├── AGENTS.md                   Track contract (phases, skills, policies)
│   ├── config/                     Machine-enforced policies (gates, escalation, retention, tools, layout)
│   ├── workflows/core-upgrade/     Versioned state machine (workflow.yaml + phases + checklists)
│   ├── knowledge/                  index/ · canonical/ · derived/ (routing + version/error/symbol records)
│   ├── memory/                     episodes → candidates (fix/error patterns) → approved → rejected
│   ├── skills/                     9 skills + registry (incl. ingest-core-release)
│   ├── schemas/ · templates/ · evals/
│   ├── tools/                      upgrade-agent CLI, validate.js, run-evals.js, bootstrap engine, wrappers
│   ├── runs/                       Durable per-run state (git-ignored — local execution state only)
│   └── docs/                       architecture / operations
│
└── frontend/                       Sub-agent: Angular / NgRx / package.json / templates
    ├── AGENTS.md                   Track contract (release-knowledge + dual-repository rules)
    ├── config/                     agent / escalation / quality-gate / package-alignment / safety / layout
    ├── knowledge/                  Canonical release requirements · migrations · appsettings · manifest
    ├── skills/                     13 skills (SKILL.md + IO schemas + evals) + registry.yaml
    ├── schemas/ · templates/ · tests/
    ├── tools/                      CLI (frontend-upgrade-agent) + lib/ engine
    ├── runs/                       Durable per-run state (git-ignored)
    └── docs/                       architecture / operations · assets/compiler-error-fix-loop.png (build-fix loop diagram)
```

Only `backend/` and `frontend/` ever mutate a client repository, each behind its own
mutation gate. `ingest/` is read-only against the NGO.Core repo and writes only
**candidate** records that a developer promotes to canonical. `orchestrator/` never
mutates a client repository or the Core repository either — it only reads each track's
own run output and writes its own shared-run bookkeeping.

---

## Runs & Learning

Every run is isolated under `runs/<client>/<run-id>/` in each track (state, checkpoints, evidence, artifacts). Reusable lessons flow through a learning lifecycle — raw episodes become candidate patterns that are never applied as authoritative until they pass validation and developer approval (`backend/memory/`). Client data is scoped and redacted per each track's retention policy; there is no shared per-client case-study folder. Core-**release** knowledge (as opposed to per-client learning) is the one exception that's intentionally shared: both tracks read the same `ingest/knowledge/candidates/releases/` store, since a Core version's git history and release notes don't vary per client.

---

## Tests & Validation

For maintainers of this workspace (not part of a client upgrade run). Everything is
dependency-free and runs offline on Node 14+.

**One command validates the whole agent** — all 14 suites across `ingest/`,
`orchestrator/`, `backend/` and `frontend/`, plus a working-tree check that fails if any
suite modified a tracked file:

```
node tools/validate-all.js            # add --verbose to see each suite's output
```

Individual suites, if you need to narrow down a failure (each must run from its own
module folder — the suites resolve paths relative to the current directory):

```
# ingest/
node tools/ingest.test.js

# orchestrator/
node tests/orchestrator.test.js

# backend/
node tools/validate.js
node tools/repo-layout.test.js
node tools/skills.test.js
node tools/release-knowledge.test.js
node tools/bootstrap/tests/bootstrap.test.js
node tools/run-evals.js

# frontend/
node tools/validate.js
node tools/repo-layout.test.js
node tools/skills.test.js
node tests/release-schema.test.js
node tests/release-knowledge.test.js
node tools/run-evals.js
```

> `backend/tools/release-knowledge.test.js` also audits local run state under
> `backend/runs/` (git-ignored, machine-specific). Those gaps are reported as warnings by
> default; run it with `--include-runs` to make them fail the suite when auditing a live
> engagement.
